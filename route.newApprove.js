ecui.esr.addRoute('newApprove', {
    model:[
        'typeLists@/approve/setting/type/list?companyId=${companyId}&status=${typeStatus}&pageNo=1&pageSize=1000',
        'eleLists@/approve/approveElements/list',
        'formModel@/approve/setting/flow/view?companyId=${companyId}&flowId=${flowId}'
    ],
    main: 'newPage',
    view: 'newApprove',
    onbeforerequest: function(context) {
        context.companyId = sessionStorage.getItem("companyId");
        context.typeStatus = 2;
        context.flowId = context.formId || -1;
    },

    onbeforerender: function(context) {
        //审批类型列表
        context.approveTypes = [];
        context.approveTypeIds = [];
        if(context.typeLists) {
            for(var i in context.typeLists.list) {
                var item = context.typeLists.list[i];
                var type = {
                    id: item.id,
                    name: item.name
                }
                context.approveTypes.push(type);
                context.approveTypeIds.push(item.id);
            }
        }

        //审批二期所有的控件Id
        var eleIds = [1, 2, 3, 4, 6, 8, 9];
        context.approveElements = [];
        if(context.eleLists) {
            for(var j in context.eleLists.list) {
            var ele = context.eleLists.list[j];
            if(eleIds.indexOf(ele.id) > -1) {
                    ele.control = JSON.stringify(ele);
                    context.approveElements.push(ele);
                }
            }
        }
    },

    onafterrender: function(context) {
        var me = this;
        var dom = ecui.dom;        
        var save = ecui.get('save');
        var approve = meipro.approve;
        var newPage = ecui.$("newPage");
        var newTitle = ecui.$('newTitle');
        var returnBtn = ecui.get("returnBtn");
        var setting = ecui.$("attributeSetting");
        var formTitle = ecui.$('approveFormTitle');
        var newControls = ecui.$('newApproveControls');
        var controlSet = ecui.get("controlSettingBtn");
        var approveSet = ecui.get("approveSettingBtn");
        var formModel = this.formModel = context.formModel || null;
        
        //根据标识设置标题，flag：0为复制，1为编辑，新建为空字符串
        newTitle.innerHTML = context.flag ? '编辑审批单' : '新建审批单';
        //当前审批单是否编辑
        this.isEdit = false;
        //审批/控件设置中文本框类型枚举
        this.inputType = {
            'title': 0,
            'placeholder': 1,
            'unit': 2,
            'autoTitle': 3
        }
        //审批设置对象
        this.approveForm = {
            'companyId': parseInt(context.companyId),//公司Id
            'typeId': this._approveTypeId(context.approveTypeIds),//流程类型ID
            'procdefId': formModel ? (formModel.procdefId || '') : '',//流程定义key
            'name': formModel ? (formModel.name || '') : '',//流程名称
            'icon': formModel ? (formModel.icon || '') : '',//流程图标
            'status': formModel ? (formModel.status || false) : false,//启用状态
            'form': {
                'elements': []
            }
        }
        //审批单设置验证信息
        this.approveFormMsg = {
            'nameMsg': '',
            'typeMsg': ''
        };
        //控件公用参数
        this.options = {
            'rootId': 'generatedControls',
            'noControlClass': 'newapprove-no-control',
            'itemClass': 'newapprove-control-item',
            'controls': [],
            'itemSettingCb': me._controlSetting.bind(this),
            'isEditCb': me._isEditCb.bind(this)
        }

        //生成控件列表中的默认选项
        if(formModel && formModel.form && formModel.form.elements) {
            //设置审批单名称
            formTitle.innerHTML = formModel.name;

            //按序号给元素列表排序
            formModel.form.elements.sort(function(a, b) {
                return a.orderCode > b.orderCode;
            });

            //编辑的控件对象需要添加额外属性
            var modelId = formModel.id;
            var formId = formModel.form.id;
            this.approveForm.id = modelId;
            this.approveForm.form.id = formId;

            //编辑时拖拽控件提示不显示
            approve.$('.' + this.options.noControlClass).style.cssText = 'display:none;';
            
            for(key in formModel.form.elements) {
                var option = formModel.form.elements[key];

                //初始化控件并追加到已生成控件列表中
                var eleObj = approve.initControl(this.options.itemClass, option);
                newControls.appendChild(eleObj.itemControl);
                
                //将控件对象存入公用参数中
                eleObj.control.id = option.id;
                this.options.controls.push(eleObj.control);

                delete eleObj.itemControl;
            }
        }
        
        //初始化当前界面
        this._init(context.approveTypes, context.approveElements);

        //返回按钮点击事件
        ecui.addEventListener(returnBtn, 'click', function() {
            var anchor = context.type === 0 ? 'approveType' : 'approveForm';
            var params = { 'status': context.status };

            if(me.isEdit) {
                hookDialog.innerHTML = etpl.render('formBackDialog', { 'content': '审批单已更改,是否离开该页面' });
                ecui.init(hookDialog);
                //显示提示窗口
                var formDialog = ecui.get('formTipDialog');
                formDialog.showModal();

                ecui.addEventListener(ecui.get('leftBtn'), 'click', function() {
                    formDialog.hide();
                });

                ecui.addEventListener(ecui.get('leaveBtn'), 'click', function() {
                    formDialog.hide();
                    me._changePage(anchor, params, false);
                });
            } else {
                me._changePage(anchor, params, false);
            }
        });
        
        //控件设置点击事件
        ecui.addEventListener(controlSet, 'click', function() {
            var selected = me._getSelectedControl(me.options.controls);
            me._controlSettingView(selected);
        });

        //审批设置点击事件
        ecui.addEventListener(approveSet, 'click', function() {
            me._approveSettingView();
        });

        //保存表单按钮点击事件        
        this.formStatus = 2;
        this.formFlag = false;
        this.companyId = context.companyId;
        this.operateFlag = context.flag ? false : true;
        this.pageStatus = context.status;
        ecui.addEventListener(save, 'click', function() {
            me._saveForm(me);
        });
    },
    /*
     * 根据锚点和参数来跳转页面
     * anchor {string} 锚点
     * params {obj} 参数
     * isNew {boolen} 是否为newPage
     */
    _changePage: function(anchor, params, isNew) {
        var dom = ecui.dom;
        var header = ecui.$("header");
        var newPage = ecui.$("newPage");
        var container = ecui.$("container");

        if(isNew) {
            dom.setStyle(newPage, "display", "block");
            dom.setStyle(header, "display", "none");
            dom.setStyle(container, "display", "none");
        } else {
            dom.setStyle(newPage, "display", "none");
            dom.setStyle(header, "display", "block");
            dom.setStyle(container, "display", "block");
        }
        
        ecui.esr.change(anchor, params);
    },
    /*
     * 当前界面初始化
     * approveTypes 审批类型列表
     * approveElements 审批控件列表
     */
    _init: function(approveTypes, approveElements) {
        var dom = ecui.dom;
        var approve = meipro.approve;        
        var controlList = ecui.$('controlList');
        var setting = ecui.$('attributeSetting');
        var approveSet = ecui.get('approveSettingBtn');
        
        //渲染可生成控件列表
        controlList.innerHTML = etpl.render('approveElements', { 'approveElements': approveElements })
        ecui.init(controlList);

        //默认显示控件设置并注册事件
        approveSet.alterClass('+selected');
        setting.innerHTML = etpl.render('approveSettingTemp', { 'approveTypes': approveTypes, 'approveForm': this.approveForm });
        ecui.init(setting);
        this._approveSettingView();
        this._approveSettingEvent();

        //显示当前模块界面
        dom.setStyle(newPage, 'display', 'block');


        //拖动生成控件参数
        var createOptions = {
            'containerId': 'createControls',
            'controlClass': 'control-item'            
        }
        //拖动生成控件初始化
        var create = new approve.createControl(approve.extend(createOptions, this.options));

        //生成的控件列表可拖拽参数
        var itemOptions = {
            'titleClass': 'control-move',
            'removeClass': 'control-close',
            'isRange': true
        }
        //拖动生成控件初始化
        var itemDrag = new approve.drag(approve.extend(itemOptions,this.options));
    },
    /*
     * 控件是否有改动回调函数
     * isEdit 是否变动
     */
    _isEditCb: function(isEdit) {
        isEdit && (this.isEdit = true);
    },
    /*
     * 获取审批类型下拉框的默认Id
     * approveTypes 审批类型Id列表
     */
    _approveTypeId: function(approveTypeIds) {
        if(!this.formModel) {
            return -2;
        }
        var typeId = this.formModel.typeId;
        if(typeId) {
            return approveTypeIds.indexOf(typeId) > -1 ? typeId : -2;
        }
        return -2;
    },
    /*
     * 验证控件的错误消息，展现验证错误的控件提示
     * controlMsg 验证信息对象
     * controls 控件列表对象
     * control 控件对象
     * me 当前上下文对象
     */
    _controlsVerity: function(controlMsg, controls, control, me) {
        var options = me.options;
        var controlDom = me._getSelectedDom(control, me);

        for(key in controlMsg) {
            var msg = controlMsg[key];
            if(msg) {
                var root = ecui.$(options.rootId);
                var itemList = root.querySelectorAll('.' + options.itemClass);
                //先清除所有控件的样式，设置当前验证未通过的控件样式
                meipro.approve.clearListClass(controls, itemList, 'selected', 'failed');
                me._controlSetting(controls, controlDom, 'selected', 'failed', true);
                meipro.showToast(msg, 'red');
                return true;
            }
        }
        return false;
    },
    /*
     * 清除控件上的验证失败类名
     * selected 选中对象
     * me 当前上下文对象
     */
    _clearControlFailed: function(selected, me) {
        var controlDom = me._getSelectedDom(selected, me);
        
        //根据验证信息来确认是否删除当前控件上的验证失败类名
        var isVertify = selected.msg.titleMsg || selected.msg.placeholderMsg || selected.msg.unitMsg || selected.msg.itemMsg || selected.msg.autoMsg;
        isVertify || meipro.approve.removeClass(controlDom, 'failed');
    },
    /*
     * 验证审批单名称，如果验证通过继续验证后续信息
     * me 当前上下文对象
     */
    _verityApproveName: function(me) {
        var dom = ecui.dom;
        var approve = meipro.approve;
        var approveFormMsg = me.approveFormMsg;

        //验证审批单名称设置
        var approveNameMsg = approveFormMsg.nameMsg;
        var approveNameUi = ecui.get('approveInputTitle');//设置名称ecui文本框
        var approveName = approveNameUi.getValue();//设置审批单名称的文本框值
        var approveNameDom = approveNameUi.getMain();//设置审批单名称的文本框Dom
        var approveNameLength = dom.first(approveNameDom).getAttribute('data-length');//设置审批单文本框的值最大长度
        var approveNameTip = dom.getParent(approveNameDom).querySelector('.tip');//文本框的提示Dom
        //错误信息存在或者名称为空时弹出错误提示框
        if(approveNameMsg || !me.approveForm.name) {
            approveNameTip.innerHTML = me._vertifyContent(me.inputType.title, approveName, approveNameLength);
            approveFormMsg.nameMsg = approveNameMsg ? approveNameMsg : '审批单名称不能为空';
            approve.addClass(approveNameDom, 'attribute-inpuTest');
            approve.addClass(approveNameTip, 'attribute-extraTest');
            me._approveSettingView();//切回审批单设置界面
            meipro.showToast(approveFormMsg.nameMsg, 'red');
            return false;
        }
        return true;
    },
    /*
     * 新建时判断审批单名称是否已经存在
     * me 当前上下文对象
     */
    _isRepeatApproveName: function(me) {
        var approveName = ecui.get('approveInputTitle').getValue();
        meipro.ajax('/approve/setting/flow/flowList', {
            data:{
                'pageNo': 1,
                'pageSize': 1000,
                'companyId': me.companyId,
                'status': me.formStatus//全部类型的审批单
            },
            method: 'get',
            onsuccess: function(data) {
                for(var i = 0, j = data.list.length; i < j; i++) {
                    var tempForm = data.list[i];
                    if(approveName === tempForm.name) {
                        meipro.showToast('审批单名称已存在，请重新输入！', 'red');
                        return false;
                    }
                }
                
                me._saveApproveForm(me);//继续验证后续的审批类型和控件列表
            },
            onerror: function(code, data) {
                var dataParsed = JSON.parse(data);
                meipro.showToast(dataParsed.msg, 'red');
            },
            onfailure: function() {
                meipro.showToast('系统错误，请联系管理员！', 'red');
            }
        });
    },
    /*
     * 验证审批类型和控件列表，保存表单信息
     * me 当前上下文对象
     */
    _saveApproveForm: function(me) {
        var approveFormMsg = me.approveFormMsg;
        var controls = me.options.controls;

        //验证审批单所属审批类型
        var approveTypeMsg = approveFormMsg.typeMsg;
        var approveTypeUi = ecui.get('approveSelectType');
        var approveType = parseInt(approveTypeUi.getValue());
        var approveNameTip = ecui.$('approveSettingType').querySelector('.attribute-title-extra');
        //审批类型的错误信息存在或者选项为默认值时弹出错误提示框
        if(approveTypeMsg || approveType === -2) {
            var approveTypeDom = approveTypeUi.getMain();
            meipro.approve.addClass(approveTypeDom, 'attribute-selectTest');
            approveFormMsg.typeMsg = approveNameTip.innerHTML = approveTypeMsg ? approveTypeMsg : '请选择审批类型';
            me._approveSettingView();//切回审批单设置界面
            meipro.showToast(approveFormMsg.typeMsg, 'red');
            return false;
        }

        //验证是否有生成的控件
        if(controls.length <= 0) {
            meipro.showToast('最少选择使用一个控件', 'red');
            return false;
        }

        //循环生成的控件列表，判断所有控件的验证
        for(var i = 0, j = controls.length; i < j; i++) {
            var control = controls[i];
            var tempMsg = control.msg;

            //根据控件的验证信息来提示
            if(me._controlsVerity(tempMsg, controls, control, me)) return false;
        }

        //深拷贝控件对象列表
        var tempControls = [];
        for(var k = 0; k < j; k++) {
            var tempControl = controls[k];
            var obj = me.approveForm.form.hasOwnProperty('id') ? { 'formId': me.approveForm.form.id } : {};
            for(key in tempControl) {
                if(!tempControl.hasOwnProperty(key)) {
                    continue;
                }
                //忽略多余的属性
                if(key === 'delitems' || key === 'msg' || key === 'uniqueIndex' || key === 'isActive') {
                    continue;
                } else if(key === 'items') {
                    //忽略选项组中多余的属性
                    obj[key] = me._ignoreItemsIndex(tempControl[key]);
                } else {
                    obj[key] = tempControl[key];
                }
            }
            tempControls.push(obj);
        }
        
        //全部验证通过后组装提交的表单对象
        me.approveForm.form.elements = tempControls;

        //提交添加内容到接口
        me.formFlag = true;
        var url = me.operateFlag ? '/approve/setting/flow/add' : '/approve/setting/flow/update';
        meipro.ajax(url, {
            data: me.approveForm,
            method: 'post',
            nojson: false,
            onsuccess: function(data) {
                //通过标识定义初始值
                var formId = me.operateFlag ? data.id : me.approveForm.id;

                if(me.approveForm.procdefId) {
                    //已设置审批流程跳转
                    meipro.showToast('保存成功', 'black');
                    me._changePage('approveForm', { 'status': me.pageStatus }, false);
                } else {
                    //未设置审批流程弹窗提示
                    me._imporveTipDialog('保存成功,请完善审批流程', formId, me);
                }
            },
            onerror: function(code, data) {
                var dataParsed = JSON.parse(data);
                meipro.showToast(dataParsed.msg, 'red');
                me.formFlag = false;
            },
            onfailure: function() {
                meipro.showToast('系统错误，请联系管理员！', 'red');
                me.formFlag = false;
            }
        });
    },
    /*
     * 未设置审批流程弹窗提示
     * content 弹窗提示内容
     * formId 审批单Id
     * me 当前上下文对象
     */
    _imporveTipDialog: function(content, formId, me) {
        hookDialog.innerHTML = etpl.render('saveImproveDialog', { 'content': content });
        ecui.init(hookDialog);

        //显示提示窗口
        var saveDialog = ecui.get('saveImproveDialog');
        saveDialog.showModal();

        //给完善按钮注册事件
        ecui.addEventListener(ecui.get('saveImproveBtn'), 'click', function() {
            saveDialog.hide();
            saveDialog.dispose();

            hookDialog.innerHTML = etpl.render('saveFlowDialog');
            ecui.init(hookDialog);

            //显示提示窗口
            var saveFlowDialog = ecui.get('saveFlowDialog');
            saveFlowDialog.showModal();
            
            meipro.ajax('/approve/setting/flow/flowList', {
                method: 'get',
                data: {
                    'companyId': me.companyId,
                    'status': me.formStatus,
                    'pageNo': 1,
                    'pageSize': 1000
                },
                onsuccess: function(data) {
                    var procdefId = me.approveForm.procdefId;
                    var approveFlowList = ecui.$('approveFlowList');

                    //存储已设置审批流程的审批单并显示
                    var settingList = [];
                    for(var i in data.list) {
                        var tempList = data.list[i];
                        tempList.procdefId && settingList.push(tempList);
                    }
                    approveFlowList.innerHTML = etpl.render('saveFlowList', { 'saveFlowList': settingList });

                    //设置审批按钮注册点击事件
                    ecui.addEventListener(ecui.get('approveFlowEnter'), 'click', function() {
                        me._changePage('approveFlow', { 'formId': formId, 'procdefId': procdefId, 'status': 1 }, true);
                        ecui.get('saveFlowDialog').hide();
                        ecui.get('saveFlowDialog').dispose();
                    });

                    //流程列表中的选项注册点击事件
                    ecui.dom.addEventListener(approveFlowList, 'click', function(e) {
                        e = e || window.event;
                        var target = e.target || e.srcElement;
                        if(target.tagName.toUpperCase() ==='IMG' || target.tagName.toUpperCase() ==='SPAN') {
                            target = target.parentElement;
                        }
                        var id = target ? target.getAttribute('id').split('_')[1] : '';
                        var copyProcedfId = target ? target.getAttribute('data-procdefId') : '';
                        
                        me._changePage('approveFlow', { 'formId': formId, 'procdefId': procdefId, 'copyId': id, 'copyProcedfId': copyProcedfId, 'status': me.pageStatus }, true);
                        ecui.get('saveFlowDialog').hide();
                        ecui.get('saveFlowDialog').dispose();
                    });

                    //弹出框的关闭按钮
                    var closeBtn = hookDialog.querySelector('.approve-form-dialog-close');
                    ecui.dom.addEventListener(closeBtn, 'click', function() {
                        me._changePage('approveForm', { 'status': me.pageStatus }, false);
                    });
                },
                onerror: function(code, msg) {}
            });
        });

        //给暂不完善按钮注册事件
        ecui.addEventListener(ecui.get('saveCloseBtn'), 'click', function() {
            saveDialog.hide();
            saveDialog.dispose();
            me._changePage('approveForm', { 'status': me.pageStatus }, false);
        });

        //弹出框的关闭按钮
        var closeBtn = hookDialog.querySelector('.approve-form-dialog-close');
        ecui.dom.addEventListener(closeBtn, 'click', function() {
            me._changePage('approveForm', { 'status': me.pageStatus }, false);
        });
    },
    /*
     * 忽略选项组中多余的属性
     * items 选项组数组
     */
    _ignoreItemsIndex: function(items) {
        var temps = [];
        for(var i = 0, j = items.length; i < j; i++) {
            var obj = {};
            var item = items[i];
            
            for(key in item) {
                if(item.hasOwnProperty(key) && key !== 'index') {
                    obj[key] = item[key];
                }
            }
            temps.push(obj);
        }
        return temps;
    },
    /*
     * 新建时判断审批单名称是否已经存在
     * me 当前上下文对象
     * startFlag 是否启用
     */
    _saveForm: function(me) {
        //先判断审批单名称标识
        if(me.formFlag) {
            meipro.showToast('请不要重复提交！', 'red');
            return false;
        }

        //审批单验证、控件列表验证
        if(!me._verityApproveName(me)) {
            return false;
        }

        //根据操作标识来确定是新建或编辑
        if(!me.operateFlag) {
            me._saveApproveForm(me);
        } else {
            me._isRepeatApproveName(me);
        }
    },
    
    /*
     * 获取生成控件列表中的选中项
     */
    _getSelectedControl: function() {
        var selected = null;
        var controls = this.options.controls;
        for(var i = 0, length = controls.length; i < length; i++) {
            var item = controls[i];
            if(item.isActive) {
                selected = item;
                break;
            }
        }
        return selected;
    },
    /*
     * 获取生成控件列表中的选中项Dom
     * selected 选中对象
     * me 当前上下文对象
     */
    _getSelectedDom: function(selected, me) {
        var dom = ecui.dom;
        var options = me.options;
        var root = ecui.$(options.rootId);
        return root.querySelector('.' + options.itemClass + '[data-id="' + selected.uniqueIndex + '"]');
    },
    /*
     * 隐藏设置视图中的所有设置项
     */
    _resetSettings: function() {
        var setting = ecui.$("attributeSetting");
        var items = setting.querySelectorAll('.attribute-item');
        for(var i = 0, length = items.length; i < length; i++) {
            ecui.dom.setStyle(items[i], 'display', 'none');
        }
    },
    /*
     * 展示审批设置界面
     */
    _approveSettingView: function() {
        var controlSet = ecui.get("controlSettingBtn");
        var approveSet = ecui.get("approveSettingBtn");
        approveSet.alterClass('+selected');
        controlSet.alterClass("-selected");

        var dom = ecui.dom;
        var approveSettingTitle = ecui.$('approveSettingTitle');
        var approveSettingType = ecui.$('approveSettingType');

        this._resetSettings();
        dom.setStyle(approveSettingTitle, 'display', 'block');
        dom.setStyle(approveSettingType, 'display', 'block');       
    },
    /*
     * 展示控件设置界面
     * selected 选中的控件对象
     */
    _controlSettingView: function(selected) {
        var controlSet = ecui.get("controlSettingBtn");
        var approveSet = ecui.get("approveSettingBtn");
        controlSet.alterClass('+selected');
        approveSet.alterClass("-selected");
        this._resetSettings();

        if(!selected) {
            return false;
        }

        var dom = ecui.dom;
        var type = selected.elementId;
        var inputType = this.inputType;
        var placeholder = selected.placeholder;        
        var controlSettingTitle = ecui.$('controlSettingTitle');
        var controlSettingRequire = ecui.$('controlSettingRequire');
        if(type) {
            /*重置控件标题设置输入框的内容和样式*/
            var title = selected.title;            
            var inputTitle = ecui.get('controlInputTitle');
            this._resetView(inputTitle, inputType.title, selected, title, controlSettingTitle);

            /*审批设置选中的控件对应的必填选项*/
            var cbRequire = ecui.get('isRequire');
            cbRequire.setChecked(selected.isMust === 1);
            //显示必填项设置
            dom.setStyle(controlSettingRequire, 'display', 'block');
        }
        
        switch(type) {//根据控件类型展示对应的设置界面
            case 1:
                //重置文本框提示文字的内容和样式
                var inputTip = ecui.get('controlInputTip');
                var inputSettingTip = ecui.$('inputSettingTip');
                this._resetView(inputTip, inputType.placeholder, selected, placeholder, inputSettingTip);
                break;
            case 2:
                //重置多行文本框提示文字的内容和样式
                var textareaTip = ecui.get('controlTextareaTip');
                var textareaSettingTip = ecui.$('textareaSettingTip');
                this._resetView(textareaTip, inputType.placeholder, selected, placeholder, textareaSettingTip);
                break;        
            case 3:
            case 4:
                var items = selected.items;

                //获取集合中是否有选中项
                var repeats = this._controlRepeatItems(items, 'item', 'index');
                var isRepeat = repeats.length > 0;
                var tipClass = isRepeat ? 'attribute-extraTest' : '';
                var tipContent = isRepeat ? '(选项重复)' : '(每项最多20个字)';


                //根据是否有重复选中项来组装标题界面
                var choiceHTML = '<label class="attribute-item-title">' +
                    '选项&nbsp;' +
                    '<span class="attribute-title-extra ' + tipClass + '">' + tipContent + '</span>' +
                '</label>';
                
                var length = items.length;
                var reduceDisabled = length <= 1 ? ' item-disabled' : '';
                var addDisabled = length >= 20 ? ' item-disabled' : '';
                //根据选中项的集合属性来组装设置界面
                for(var i = 0; i < length; i++) {
                    var item = items[i];
                    var inputClass = repeats.indexOf(item.index) > -1 ? 'attribute-inpuTest' : '';
                    choiceHTML += '<div class="item-setting">' +
                    '    <input ui="type:input-control" data-length="20" data-id="' + item.index + '" type="text" value="' + (item.item) + '" class="item-input ' + inputClass + '" />' +
                    '    <button ui="type:button" data-id="' + item.index + '" class="btn-no item-reduce' + reduceDisabled + '"></button>' +
                    '    <button ui="type:button" data-id="' + item.index + '" class="btn-no item-add' + addDisabled + '"></button>' +
                    '</div>';
                }

                //显示选择选项控件设置界面
                var controlSettingChoice = ecui.$('controlSettingChoice');
                controlSettingChoice.innerHTML = choiceHTML;
                ecui.init(controlSettingChoice);
                dom.setStyle(controlSettingChoice, 'display', 'block');
                break;
            case 6:
                this._controlDateFormatView(selected);
                break;            
            case 8:
                this._controlDateFormatView(selected);

                //重置是否设置时长的设置界面                
                var autoUi = ecui.get('isAuto');
                var elementRule = selected.elementRule;
                var inputTitle = ecui.get('controlDateTitle');
                
                var rule = elementRule ? JSON.parse(selected.elementRule) : { 'isAuto': false, 'autoTitle': '' };
                var isAuto = rule.isAuto;
                var autoTitle = isAuto ? rule.autoTitle : '';

                autoUi.setChecked(isAuto);
                inputTitle.setValue(autoTitle);

                //显示设置标题框
                var dateTitle = ecui.$('controlDateTitle');
                dom.setStyle(dateTitle, 'display', isAuto ? 'block' : 'none');

                var dateSettingConvert = ecui.$('dateSettingConvert');
                dom.setStyle(dateSettingConvert, 'display', 'block');
                break;
            case 9:
                //重置文本框提示文字、单位的内容和样式
                var inputTip = ecui.get('controlInputTip');
                var inputUnit = ecui.get('controlInputUnit');
                var inputSettingTip = ecui.$('inputSettingTip');
                var inputSettingUnit = ecui.$('inputSettingUnit');
                this._resetView(inputTip, inputType.placeholder, selected, placeholder, inputSettingTip);
                this._resetView(inputUnit, inputType.unit, selected, JSON.parse(selected.extra1).unit, inputSettingUnit);
                break;
        }
    },
    /*
     * 重置设置界面和选中控件界面
     * inputUi 控件中的ecui输入框
     * inputType 输入框类型
     * selected 选中的控件对象
     * value 设置的值
     * showDom 需要展示的设置界面
     */
    _resetView: function(inputUi, inputType, selected, value, showDom) {
        inputUi.setValue(value);
        //同步内容到选中的控件上
        this._syncControlContent(inputType, selected, value, this);
        //重新渲染设置界面
        this._settingInputRender(inputType, inputUi, value, this);
        //显示当前设置界面
        ecui.dom.setStyle(showDom, 'display', 'block');
    },
    /*
     * 选中生成的控件切换对应的设置界面
     * list 内存中生成的控件列表
     * target 选中的控件
     * selectedClass 选中的控件需设置的样式
     * verityClass 验证失败样式
     * isEdit 是否编辑过
     */
    _controlSetting: function(list, target, selectedClass, verityClass, isEdit) {
        var dom = ecui.dom;
        var approve = meipro.approve;
        isEdit && (this.isEdit = isEdit);

        //不存在就渲染表单设置界面
        if(!target) {
            this._approveSettingView();
            return false;
        }

        //存在选中的控件就渲染对应的设置界面
        var selected = null;
        approve.addClass(target, selectedClass);
        approve.addClass(target, verityClass);
        var tid = parseInt(target.getAttribute('data-id'));

        //设置目标对象对象为选中
        for(var i = 0, length = list.length; i < length; i++) {
            var item = list[i];
            if(tid === item.uniqueIndex) {
                item.isActive = true;
                selected = item;
                break;
            }
        }

        //重新渲染控件设置界面
        this._controlSettingView(selected);
    },
    /* 审批/控件设置界面上的Dom事件注册
     */
    _approveSettingEvent: function() {

        //给审批单设置标题输入框注册事件
        this._approveInputEvent();

        //给审批单设置审批类型下拉框注册事件
        this._approveTypeEvent();

        //给审批单控件对应的设置元素注册事件
        this._controlSettingEvent();
    },    
    /*
     * 审批设置中的审批单名称注册事件
     */
    _approveInputEvent: function() {
        var me = this;
        var dom = ecui.dom;
        var inputUi = ecui.get('approveInputTitle');
        var formTitle = ecui.$('approveFormTitle');
        //设置审批单名称文本框的最大长度
        var length = parseInt(dom.first(inputUi.getMain()).getAttribute('data-length'));

        //由于IE会预执行INPUT事件的回调函数，所以改为KEYUP事件
        ecui.addEventListener(inputUi, 'keyup', function() {
            var value = inputUi.getValue().trim();

            //同步输入内容到展示元素上和控件对应对象上
            formTitle.innerHTML = value;
            me.approveForm.name = value;
            
            //重新渲染设置界面样式
            me._settingInputRender(me.inputType.autoTitle, inputUi, value, me);

            //根据文本框的值来设置验证信息
            if(value.length <= 0) {
                me.approveFormMsg.nameMsg = '审批单名称不能为空';
            } else if(value.length > length) {
                me.approveFormMsg.nameMsg = '审批单名称不能超过' + length + '个字';
            } else {
                me.approveFormMsg.nameMsg = '';
            }

            me.isEdit || (me.isEdit = true);;
        });
    },
    /**
     * 审批设置中的审批类型选择注册事件
     */
    _approveTypeEvent: function() {
        var me = this;
        var dom = ecui.dom;
        var approve = meipro.approve;
        var selectUi = ecui.get('approveSelectType');
        var extra = ecui.$('approveSettingType').querySelector('.attribute-title-extra');

        //注册触发事件，获取选中值（同步至对象上），根据选中值展示提示内容，赋值给错误对象中的字段
        ecui.addEventListener(selectUi, 'change', function() {
            var selectDom = this.getMain();
            var value = parseInt(this.getValue());

            me.approveForm.typeId = value;
            if(value === -2) {
                approve.addClass(selectDom, 'attribute-selectTest');
                me.approveFormMsg.typeMsg = extra.innerHTML = '请选择审批类型';
            } else {
                approve.removeClass(selectDom, 'attribute-selectTest');
                me.approveFormMsg.typeMsg = extra.innerHTML = '';
            }

            me.isEdit || (me.isEdit = true);
        });
    },
    /*
     * 给控件设置界面上的所有需注册的元素注册事件
     */
    _controlSettingEvent: function() {
        var inputType = this.inputType;
        var inputTip = ecui.get('controlInputTip');
        var dateTitle = ecui.get('controlDateTitle');
        var inputUnit = ecui.get('controlInputUnit');
        var inputTitle = ecui.get('controlInputTitle');
        var textareaTip = ecui.get('controlTextareaTip');
        
        var rdFormat = ecui.$('dateSettingFormat');
        var choice = ecui.$('controlSettingChoice');
        var cbConvert = ecui.$('dateSettingConvert');        
        var cbRequire = ecui.$('controlSettingRequire');
        
        
        
        //给控件标题、控件提示文字、控件单位注册事件
        this._controlInputEvent(inputType.placeholder, inputTip);
        this._controlInputEvent(inputType.title, inputTitle);
        this._controlInputEvent(inputType.placeholder, textareaTip);
        this._controlInputEvent(inputType.unit, inputUnit);

        //给必填选项控件注册事件
        this._controlRequireEvent(cbRequire);

        //给日期控件的格式选项设置控件注册事件
        this._controlDateFormatEvent(rdFormat);

        //给双日历控件设置自动计算时长，复选框、文本框注册事件
        this._controlConvertEvent(cbConvert);
        this._controlDateTitleEvent(dateTitle);

        //给选择选项控件的移除、添加选项按钮、输入框注册事件
        this._controlChoiceItemEvent(choice);

    },
    /* 给控件设置界面上的输入框注册事件
     * inputType 审批/控件设置中文本框类型枚举
     * inputUi ecui-input控件
     */
    _controlInputEvent: function(inputType, inputUi) {
        var me = this;
        var dom = ecui.dom;

        ecui.addEventListener(inputUi, 'input', function() {
            
            var selected = null;
            var inputDom = inputUi.getMain();
            var value = inputUi.getValue().trim();
            
            //获取控件列表中的选中项
            var selected = me._getSelectedControl();
            
            if(!selected) {
                return false;
            }
            
            //同步内容到选中的控件上
            me._syncControlContent(inputType, selected, value, me);

            //重新渲染设置界面样式
            var length = me._settingInputRender(inputType, inputUi, value, me);
            
            //根据文本框的值来获取验证信息
            me._vertifyMessage(selected, inputType, value, length);

            //根据验证情况清除对应选中控件的失败样式
            me._clearControlFailed(selected, me);
            
            me.isEdit || (me.isEdit = true);
        });
    },
    /*
     * 给控件设置界面上的必填选项注册事件
     * cbRequire 复选框选项的根元素
     */
    _controlRequireEvent: function(cbRequire) {
        var me = this;
        
        ecui.dom.addEventListener(cbRequire, 'click', function() {
            var selected = null;
            var isRequire = ecui.get('isRequire').isChecked();

            //获取控件列表中的选中项，设置其必填属性
            var selected = me._getSelectedControl();

            if(!selected) {
                return false;
            }

            selected.isMust = isRequire ? 1 : 0;

            me.isEdit || (me.isEdit = true);
        });
    },
    /*
     * 给控件设置界面上的日期格式选项注册事件
     * rdFormat 单选框选项的根元素
     */
    _controlDateFormatEvent: function(rdFormat) {
        var me = this;
        
        ecui.dom.addEventListener(rdFormat, 'click', function() {
            var dateFormat = ecui.get('dateFormat');
            var dateFormatDetail = ecui.get('dateFormatDetail');
            
            //获取控件列表中的选中项，设置其日期格式
            var format = dateFormat.isChecked() ? dateFormat.getValue() : dateFormatDetail.getValue();            
            var selected = me._getSelectedControl();

            if(!selected) {
                return false;
            }

            selected.format = format;

            me.isEdit || (me.isEdit = true);
        });
    },
    /*
     * 给控件设置界面上的是否自动计算时长复选框注册事件
     * cbConvert 复选框选项的根元素
     */
    _controlConvertEvent: function(cbConvert) {
        var me = this;
        var dom = ecui.dom;
        var inputTitle = ecui.get('controlDateTitle');
        var dateTitle = ecui.$('controlDateTitle');

        dom.addEventListener(cbConvert, 'click', function() {
            var isAuto = ecui.get('isAuto').isChecked();
            var display = isAuto ? 'block' : 'none';
            var autoTitle = isAuto ? '时长': '';

            dom.setStyle(dateTitle, 'display', display);
            inputTitle.setValue(autoTitle);

            //设置选中控件对象上的对应字段值
            var selected = me._getSelectedControl();

            if(!selected) {
                return false;
            }

            selected.elementRule = JSON.stringify({ 'isAuto': isAuto, 'autoTitle': autoTitle });

            me.isEdit || (me.isEdit = true);
        });
    },
    /*
     * 给控件设置界面上的是否自动计算时长文本框注册事件
     * dateTitle 设置日期是否自动计算时长标题的ecui输入框
     */
    _controlDateTitleEvent: function(dateTitle) {
        var me = this;

        ecui.addEventListener(dateTitle, 'input', function() {
            var selected = null;
            var inputType = me.inputType.autoTitle;
            var value = dateTitle.getValue().trim();
            
            //设置控件选中项对象的是否自动计算时长
            var selected = me._getSelectedControl();

            if(!selected) {
                return false;
            }

            selected.elementRule = JSON.stringify({ 'isAuto': true, 'autoTitle': value });

            //重新渲染设置界面样式
            var length = me._settingInputRender(inputType, dateTitle, value, me);

            //根据文本框的值来获取验证信息
            me._vertifyMessage(selected, inputType, value, length);

            //根据验证情况清除对应选中控件的失败样式
            me._clearControlFailed(selected, me);

            me.isEdit || (me.isEdit = true);
        });
    },
    /*
     * 重置选中控件对应的日期格式单选框界面
     * selected 选中的控件对象
     */
    _controlDateFormatView: function(selected) {
        var dateFormat = ecui.get('dateFormat');
        var dateFormatDetail = ecui.get('dateFormatDetail');

        if(selected.format === 'yyyy-MM-dd') {
            dateFormat.setChecked(true);
        } else if(selected.format === 'yyyy-MM-dd HH:mm') {
            dateFormatDetail.setChecked(true);
        } else {
            dateFormat.setChecked(false);
            dateFormatDetail.setChecked(false);
        }

        var dateSettingFormat = ecui.$('dateSettingFormat');
        ecui.dom.setStyle(dateSettingFormat, 'display', 'block');
    },
    /*
     * 给选择选项控件的移除、添加选项按钮、输入框注册事件
     * choice 选项组设置界面的根元素
     */
    _controlChoiceItemEvent: function(choice) {
        var me = this;
        var dom = ecui.dom;
        var approve = meipro.approve;

        dom.addEventListener(choice, 'click', function(e) {
            e = e || window.event;
            var tar = e.target;            

            if(!tar) {
                return false;
            }

            var selected = me._getSelectedControl();
            var dataId = parseInt(tar.getAttribute('data-id'));

            if(!selected) {
                return false;
            }

            var dom = ecui.dom;
            var items = selected.items;
            var length = items.length;
            var delitems = selected.delitems;
            
            if(dom.hasClass(tar, 'item-reduce')) {//移除选项
                me.isEdit || (me.isEdit = true);

                if(length <= 1) {
                    return false;
                }
                
                //删除当前选项，并在选中项的删除选项数组中添加删除项
                dom.remove(dom.getParent(tar));
                for(var i = 0; i < length; i++) {
                    if(items[i].index === dataId) {
                        var del = items.splice(i, 1)[0];
                        del.item = '';
                        delitems.push(del);
                        delitems.sort(function(a, b) { return a.index - b.index });
                        break;
                    }
                }
                
                //删除选中控件中的对应选项节点
                var removeItem = ecui.get('control-item-' + selected.uniqueIndex + '-' + dataId);
                dom.remove(dom.getParent(removeItem.getMain()));

                //处理选项值重复的验证问题
                me._handleRepeatItemsTip(selected, choice, items, me);
                
                //选项组仅剩最后一项时调整移除按钮样式为不可用
                if(items.length <= 1) {
                    approve.addClass(this.querySelector('.item-reduce[data-id="' + items[0].index + '"]'), 'item-disabled');
                }
                
                //选项组选项未超过上限且添加按钮样式为不可用时，移除样式
                if(items.length < 20 && dom.hasClass(this.querySelector('.item-add'), 'item-disabled')) {
                    var adds = this.querySelectorAll('.item-add');
                    adds.forEach(function(add) {
                        approve.removeClass(add, 'item-disabled');
                    });
                }
            } else if(dom.hasClass(tar, 'item-add')) {//添加选项
                me.isEdit || (me.isEdit = true);

                if(length <= 1) {
                    approve.removeClass(this.querySelector('.item-reduce[data-id="' + items[0].index + '"]'), 'item-disabled');
                } else if(length >= 20) {
                    return false;
                }
                
                //根据选中项的删除选项数组来确认新添加的选项对象
                var key = -1, obj = {};
                if(delitems.length === 0) {
                    key = length;
                    obj = { 'index': key, 'item': ('选项' + (key + 1)), 'rule': '' };
                } else {
                    obj = delitems.splice(0 , 1)[0];
                    key = obj.index;
                    obj.item = '选项' + (key + 1);
                }

                //组装新添加项的界面结构并追加
                var itemSetting = document.createElement('div');
                itemSetting.setAttribute('class', 'item-setting');
                itemSetting.innerHTML = '' +
                '   <input ui="type:input-control" data-length="20" data-id="' + key + '" type="text" value="' + obj.item + '" class="item-input" />' +
                '   <button ui="type:button" data-id="' + key + '" class="btn-no item-reduce"></button>' +
                '   <button ui="type:button" data-id="' + key + '" class="btn-no item-add"></button>';
                ecui.init(itemSetting);
                var item = approve.getTargetDom(tar, 'item-setting');
                approve.insertAfter(itemSetting, item);
                
                //在当前添加选项之后追加新选项
                for(var j = 0; j < length; j++) {
                    if(items[j].index === dataId) {
                        items.splice(j + 1, 0 , obj);
                        break;
                    }
                }
                
                //组装控件中的新添加项的界面结构并追加
                var controlType = selected.elementId === 3 ? 'radio' : 'checkbox';
                var tempIndex = selected.uniqueIndex + '-' + key;
                var controlItem = document.createElement('div');
                controlItem.setAttribute('class', controlType);
                controlItem.innerHTML = '' + 
                '    <div ui="type:' + controlType + ';disabled;id:control-item-' + tempIndex + '" class="on-front">' +
                '        <input name="control-item-' + selected.uniqueIndex + '" type="' + controlType + '">' +
                '    </div>' +
                '    <div ui="type:label;id:control-label-' + tempIndex + '">选项' + (key + 1) + '</div>';
                ecui.init(controlItem);
                var tempItem = ecui.get('control-item-' + selected.uniqueIndex + '-' + dataId);
                approve.insertAfter(controlItem, dom.getParent(tempItem.getMain()));

                //清除已使用过的对象
                delete obj;
                delete itemSetting;
                delete controlItem;
                
                //处理选项值重复的验证问题
                me._handleRepeatItemsTip(selected, choice, items, me);

                //选项组选项超过上限时调整添加按钮样式为不可用
                if(items.length >= 20) {
                    adds = this.querySelectorAll('.item-add');
                    adds.forEach(function(add) {
                        approve.addClass(add, 'item-disabled');
                    });
                }
            }
        });

        dom.addEventListener(choice, 'input', function(e) {
            e = e || window.event;
            var tar = e.target;

            if(!tar) {
                return false;
            }

            var selected = me._getSelectedControl();
            var dataId = parseInt(tar.getAttribute('data-id'));

            if(!selected) {
                return false;
            }

            if(approve.isTarget(tar, 'item-input')) {
                me.isEdit || (me.isEdit = true);

                var value = tar.value;
                //填写内容超出上限时阻止继续填写
                if(value.length >= 20) {
                    tar.value = value.substring(0, 19);
                    return false;
                }

                var items = selected.items;
                var length = items.length;

                //同步输入内容到控件对应的对象上
                for(var j = 0; j < length; j++) {
                    if(items[j].index === dataId) {
                        items[j].item = value;
                        break;
                    }
                }
                //同步输入内容到控件对应的选项上
                var itemLabel = ecui.get('control-label-' + selected.uniqueIndex + '-' + dataId);
                itemLabel.setContent(value);
                
                //处理选项值重复的验证问题
                me._handleRepeatItemsTip(selected, choice, items, me);
            }
        });
    },
    /*
     * 同步输入内容到选中的控件上和控件对应对象上
     * inputType 审批/控件设置中文本框类型枚举
     * selected 选中的控件对应的对象
     * value 需要同步的值
     * me 当前上下文对象
     */
    _syncControlContent: function(inputType, selected, value, me) {
        var selectedId = selected.uniqueIndex;
        if(inputType === 0) {
            var showUi = ecui.get('control-title-' + selectedId);
            showUi.setContent(value);
            selected.title = value;
        } else if(inputType === 1) {
            var showUi = ecui.get('control-input-' + selectedId);
            var showInput =  ecui.dom.first(showUi.getMain());
            showInput.setAttribute('placeholder', value);
            selected.placeholder = value;
        } else if(inputType === 2) {
            var showUi = ecui.get('control-unit-' + selectedId);
            showUi.setContent(value ? '（' + value + '）' : '');            
            selected.extra1 = JSON.stringify({ 'unit': value });
        }
    },
    /* 重新渲染输入框和提示设置
     * inputType 文本框类型
     * inputUi ecui-input控件
     * value 输入框的内容(去除两端空格)
     * me 当前上下文对象
     * return 文本框内容的最大长度
     */
    _settingInputRender: function(inputType, inputUi, value, me) {
        var dom = ecui.dom;
        var approve = meipro.approve;
        var inputDom = inputUi.getMain();
        var length = parseInt(dom.first(inputDom).getAttribute('data-length'));
        var tip = dom.getParent(inputDom).querySelector('.tip');
        

        //根据文本框的值来设置提示内容及样式
        tip.innerHTML = me._vertifyContent(inputType, value, length);

        if(((inputType === 0 || inputType === 3) && value.length === 0) || value.length > length) {
            approve.addClass(inputDom, 'attribute-inpuTest');
            approve.addClass(tip, 'attribute-extraTest');           
        } else {
            approve.removeClass(inputDom, 'attribute-inpuTest');
            approve.removeClass(tip, 'attribute-extraTest');
        }
        return length;
    },
    /*
     * 获取对象数组中某个指定属性的所有重复项
     * items 对象数组
     * prop 指定检测重复的属性
     * id 对象数组中每个对象的主键(可选)
     * return id存在就返回所有重复项的主键，id不存在就返回所有重复项的下标
     */
    _controlRepeatItems: function(items, prop, id) {
        var obj = {}, repeats = [];
        for(var i = 0, j = items.length; i < j; i++) {
            var item = items[i];
            if(obj.hasOwnProperty(item[prop])) {
                repeats.indexOf(obj[item[prop]]) === -1 && repeats.push(obj[item[prop]]);
                repeats.push(id ? item[id] : i);
            } else {
                obj[item[prop]] = id ? item[id] : i;
            }
        }
        delete obj;
        return repeats;
    },
    /*
     * 处理选项组中出现重复选项值时的验证提示
     * selected 当前选中控件对象
     * choice 选项组设置界面的根元素
     * items 选项组对应的对象数组
     * me 当前上下文对象
     */
    _handleRepeatItemsTip: function(selected, choice, items, me) {
        var dom = ecui.dom;
        var approve = meipro.approve;
        var inputs =  choice.querySelectorAll('.item-input');
        var repeats = me._controlRepeatItems(items, 'item', 'index');
        
        //根据是否有重复项设置输入选项的标题提示内容
        var extra = choice.querySelector('.attribute-title-extra');
        var isRepeat = dom.hasClass(extra, 'attribute-extraTest');
        if(repeats.length > 0) {
            selected.msg.itemMsg = '选项组选项重复';
            extra.innerHTML = '(选项重复)';
            isRepeat || approve.addClass(extra, 'attribute-extraTest');
        } else {
            selected.msg.itemMsg = '';
            extra.innerHTML = '(每项最多20个字)';
            isRepeat && approve.removeClass(extra, 'attribute-extraTest')
        }

        //根据重复项数组来添加或移除对应项的验证样式
        inputs.forEach(function(k) {
            var kId = parseInt(dom.first(k).getAttribute('data-id'));
            if(repeats.indexOf(kId) > -1) {
                approve.addClass(k ,'attribute-inpuTest');
            } else {
                approve.removeClass(k ,'attribute-inpuTest');
            }
        });

        //根据验证情况清除对应选中控件的失败样式
        me._clearControlFailed(selected, me);
    },
    /**
     * 根据文本框的内容来确定验证提示信息
     * inputType 文本框类型
     * value 文本框的值
     * length 文本框内容的最大长度
     * return 提示信息
     */
    _vertifyContent: function(inputType, value, length) {
        if((inputType === 0 || inputType === 3) && value.length === 0) {//标题验证是否为空
            return '(请输入名称)';
        } {
            return '(最多' + length + '个字)';
        }
    },
    /**
     * 根据文本框的内容来设置保存时的提示信息
     * selected 当前选中控件对象
     * inputType 文本框类型
     * value 文本框的值
     * length 文本框内容的最大长度
     */
    _vertifyMessage: function(selected, inputType, value, length) {
        var msg = '';

        if((inputType === 0 || inputType === 3) && value.length === 0) {
            msg = '控件{type}不能为空';
        } else if(value.length > length) {
            msg = '控件{type}不能超过' + length + '个字';
        }

        switch(inputType) {
            case 0:
                selected.msg.titleMsg = msg.replace('{type}', '标题');
                break;
            case 1:
                selected.msg.placeholderMsg = msg.replace('{type}', '提示文字');
                break;
            case 2:
                selected.msg.unitMsg = msg.replace('{type}', '单位');
                break;
            case 3:
                selected.msg.autoMsg = msg.replace('{type}', '自动计算时长标题');
                break;
        }
    }
});
