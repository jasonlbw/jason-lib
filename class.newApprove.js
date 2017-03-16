meipro.approve={};

(function(approve) {

	function object(o) {
		function F(){};
		F.prototype = o;
		return new F();
	}

	/**
	* 对象继承
	* @param SubType 子类
	* @param SuperType 父类
	*/
	function inheritPrototype(SubType, SuperType) {
		var prototype = object(SuperType.prototype);
		prototype.constructor = SubType;
		SubType.prototype = prototype;
	}

	uniqueIndex = 0,

	approve.Element = function(option) {
		//表单元素标题		
		this.title = option ? (option.title || '') : '';
		//表单元素标识
		this.placeholder = option ? (option.placeholder || '请输入') : '请输入';
		//是否必填  0：不是，1是
		this.isMust = option ? (option.isMust || 0) : 0;
		//日期格式
		this.format = option ? (option.format || 'yyyy-MM-dd') : 'yyyy-MM-dd';
		//表单元素顺序
		this.orderCode = option ? (option.orderCode || 0) : 0;
		//元素类型名
		this.typeName = option ? (option.typeName || '') : '';
		//元素类型ID
		this.elementId = option ? (option.elementId || -1) : -1;
		//标识字段，暂时不用
		this.formElementCode = option ? (option.formElementCode || '') : '';
		//单选、多选、下拉 子元素集合
		this.items = [];
		//移除的单选、多选 子元素集合
		this.delitems = [];
		//记录错误信息
		this.msg = {
			'titleMsg': '',
			'placeholderMsg': '',
			'unitMsg': '',
			'itemMsg': '',
			'autoMsg': ''
		};
		//日历组件是否自动计算时长
		this.elementRule = option ? (option.elementRule || '') : '';
		//元素的唯一标示
		this.uniqueIndex = ++uniqueIndex;
		//是否被选中
		this.isActive = false;
		//扩展对象
		this.extra1 = '';
	},

	approve.Element.prototype = {
		constructor: approve.Element,
		decrease: function() {
			uniqueIndex = --this.uniqueIndex;
		}
	}

	/**
	* 文本对象
	* @param option 参数对象
	*/
	approve.InputElement = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.InputElement, approve.Element);

	//控件结构
	approve.InputElement.prototype.outHtml = function() {
		return '<input ui="type:input-control;disabled;id:control-input-' + this.uniqueIndex + '" class="control-item-tip" type="text" />';
	}

	/**
	* 文本域对象
	* TEXTAREA
	*/
	approve.TextAreaElement = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.TextAreaElement, approve.InputElement);
	approve.TextAreaElement.prototype.outHtml = function() {
		return '' + 
		'<div ui="type:input-control;disabled;id:control-input-' + this.uniqueIndex + '" class="control-item-tip textarea" >' +
		'    <textarea placeholder="'+ this.placeholder +'" ></textarea>' +
		'</div>';
	}

	/**
	* 数字对象
	* NUMBER
	*/
	approve.NumberElement = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.NumberElement, approve.InputElement);

	approve.NumberElement.prototype.outHtml = function() {
		return '' + 
		'<div ui="type:input-control;disabled;id:control-input-' + this.uniqueIndex + '" class="control-item-tip">' +
		'    <input type="text" placeholder="'+ this.placeholder +'" />' +
		'</div>';
	}

	/**
	* 日期对象
	* @param option 参数对象
	*/
	approve.DateElement = function(option) {
		approve.Element.call(this, option);
		
	}
	inheritPrototype(approve.DateElement, approve.Element);
	approve.DateElement.prototype.outHtml = function() {
		return '<input ui="type:input-control;disabled" type="text" class="date-input"/>';
	}

	//日期区间
	approve.DublDatePicker = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.DublDatePicker, approve.Element);
	approve.DublDatePicker.prototype.outHtml = function() {
		return  '' + 
		'<input ui="type:input-control;disabled" type="text" class="date-input"/>' +
			'<span class="date-to-sapn">至</span>' +
		'<input ui="type:input-control;disabled" type="text" class="date-input"/>';
	}

	/**
	* 单选对象
	* @param option 参数对象
	*/
	approve.RadioElement = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.RadioElement, approve.Element);
	approve.RadioElement.prototype.outHtml = function() {
		var me = this;
		var html = '';
		this.items.forEach(function(item, i) {
			var index = this.uniqueIndex + '-' + item.index;

			html += '' + 
			'<div class="radio">' +
			'    <div ui="type:radio;disabled;id:control-item-' + index + '">' +
			'        <input name="control-item-' + me.uniqueIndex + '" type="radio">' +
			'    </div>' +
			'    <div ui="type:label;id:control-label-' + index + '">' + item.item + '</div>' +
			'</div>';
		});
		return html;
	}

	/**
	* 多选对象
	* @param option 参数对象
	*/
	approve.CheckboxElement = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.CheckboxElement, approve.Element);
	approve.CheckboxElement.prototype.outHtml = function() {
		var me = this;
		var html = '';		
		this.items.forEach(function(item, i) {
			var index = me.uniqueIndex + '-' + item.index;

			html += '' + 
			'<div class="checkbox">' +
			'    <div ui="type:checkbox;disabled;id:control-item-' + index + '" class="on-front">' +
			'        <input name="control-item-' + me.uniqueIndex + '" type="checkbox">' +
			'    </div>' +
			'    <div ui="type:label;id:control-label-' + index + '">' + item.item + '</div>' +
			'</div>';
		});
		return html;
	}


	/**
	* 附件对象
	* @param option 参数对象
	*/
	approve.AttachElement = function(option) {
		approve.Element.call(this, option);
	}
	inheritPrototype(approve.AttachElement, approve.Element);
	approve.AttachElement.prototype.outHtml = function() {
		return '<div class="file-upload"><span class="fileupload-logo"></span>选择文件</div>';
	}

})(meipro.approve);

(function(approve) {
	var create = function() {
		return function() {
			this.init.apply(this, arguments);
		}
	}
	
	//列表中选项拖拽
	approve.drag = create();

	/*
	 * 列表中的项拖拽options
	 * rootId 列表根容器的id(必填)
	 * itemClass 列表中项的类名(必填)
	 * titleClass 列表中项的可拖拽bar的类名(必填)
	 * removeClass 列表中的删除项的按钮类名(选填)
	 * noControlClass 列表中没有选项的提示DOM类名(选填)
	 * controls 内存中控件列表(选填)
     * isRange 是否有拖拽范围,true拖拽根容器为范围,false没有范围(选填)
	 * itemSettingCb 选项设置的回调函数(选填)
	 */
	approve.drag.prototype = {
		init: function(options) {
			var me = this;
			var dragContext = {
				'root': approve.$('#' + options.rootId),
				'item': approve.$('.' + options.itemClass),
				'title': approve.$('.' + options.titleClass),
				'options': options
			};
			ecui.dom.addEventListener(dragContext.root, 'mousedown', function(e) {
				var root = dragContext.root;
				var ev = dragContext.ev = e || window.event;
				if(ev.button == 2) {
					return false;
				}

				var tar = dragContext.tar = ev.target;
				if(!tar) {
					return false;
				}
				
				if (approve.isTarget(tar, options.titleClass, root)) {
					me.mousedownHandle(dragContext);
				} else if(options.removeClass && approve.isTarget(tar, options.removeClass, root)) {
					var noControlDom = approve.$('.' + options.noControlClass);//没有控件时的提示Dom
					var target = approve.getTargetDom(tar, options.itemClass);//目标控件
					var tid = parseInt(target.getAttribute('data-id'));
					target.parentNode.removeChild(target);
					
					//删除虚拟列表中的选中项
					for(var i = 0, length = options.controls.length; i < length; i++) {
						var cItem = options.controls[i];
						if(cItem.uniqueIndex === tid) {
							//调用回调，移除列表对象中的目标选项
							cItem.isActive && options.itemSettingCb(options.controls, null, 'selected', '');
							options.controls.splice(i , 1);

							if(i === length - 1) break;

							//重新排序orderCode，排完之后合并数组
							length = options.controls.length;
							var tempItems = options.controls.splice(i, length - i);
							tempItems.forEach(function(item) {
								item.orderCode -= 1;
								//对应节点的orderCode属性也要相应修改
								var itemDom = root.querySelector('.' + options.itemClass + '[data-id="' + item.uniqueIndex + '"]');
								itemDom.setAttribute('data-ordercode', item.orderCode);
							});
							tempItems.unshift(i, 0);
							options.controls.splice.apply(options.controls, tempItems);
							
							delete tempItems;
							break;
						}
					}
					
					var itemList = root.querySelectorAll("." + options.itemClass);
					if(itemList.length <= 0) {
						noControlDom.style.cssText = '';
					}

					if(options.isEditCb) {
						options.isEditCb(true);
					}

				} else if(options.itemSettingCb && approve.isTarget(tar, options.itemClass, root)) {
					//选中列表中的项
					var controls = options.controls;
					var itemList = root.querySelectorAll('.' + options.itemClass);
					var target = approve.getTargetDom(tar, options.itemClass, root);

					//先清除所有后设置选中
					approve.clearListClass(controls, itemList, 'selected');
					options.itemSettingCb(controls, target, 'selected', '');
				}
			});

			ecui.dom.addEventListener(document, 'mousemove', function(e) {
				
				if(!dragContext.dragable) {
					return false;
				}
				var ev = dragContext.ev = e || window.event;

				me.mousemoveHandle(dragContext);
			});

			ecui.dom.addEventListener(document, 'mouseup', function(e) {
				if(!dragContext.dragable) {
					return false;
				}

				me.mouseupHandle(dragContext);
			});
		},
		mousedownHandle: function(dragContext) {
			var ev = dragContext.ev;
			var tar = dragContext.tar;
			var root = dragContext.root;
			var options = dragContext.options;
			
			
			//存储所有可拖拽项目的位置信息
			dragContext.itemArray = approve.restoreComponentsPos(root, options.itemClass);
			
			//获取目标元素然后设置样式
			var target = dragContext.dragTarget = approve.getTargetDom(tar, options.itemClass, root);
			var targetWH = approve.getWH(target);
			var dragW = targetWH.width;
			var dragH = targetWH.height;
			document.body.style.cssText = 'cursor:move!important';
			target.style.cssText = 'z-index:1000;width:' + dragW + 'px;height:' + dragH + 'px';
            approve.addClass(target, 'drag-current');

			//创建占位符
			var posDom = dragContext.posDom = document.createElement("div");
			posDom.style.cssText = 'background-color:#E5E5E5;height:' + dragH + 'px';
			approve.addClass(posDom, options.itemClass);
			approve.insertAfter(posDom, target);

			//获取范围			
			if(options.isRange) {
				dragContext.lRange = target.offsetLeft;
				dragContext.rRange = target.offsetLeft;
				dragContext.tRange = 0;
				dragContext.bRange = root.offsetHeight - target.offsetHeight;
			}

			//存储鼠标和目标元素的坐标差值
			dragContext.dragable = true;
			var downPos = dragContext.movePos = approve.getEleMousePos(ev, root);

			dragContext.tmpX = downPos.x - target.offsetLeft;
			dragContext.tmpY = downPos.y - target.offsetTop;
			
			target.style.left = (approve.isFF ? target.offsetLeft: (target.offsetLeft - root.scrollLeft)) + "px";
			target.style.top = (approve.isFF ? target.offsetTop : (target.offsetTop - root.scrollTop)) + "px";

			if(approve.isIE) {
				target.setCapture();
			} else {
				window.captureEvents(Event.mousemove);
			}
			if(ev.preventDefault) {
				ev.preventDefault();
				ev.stopPropagation();
			}
		},
		mousemoveHandle: function(dragContext) {
			var ev = dragContext.ev;
			var root = dragContext.root;
			var options = dragContext.options;
			var target = dragContext.dragTarget;

			var lastPos = dragContext.movePos;
			var movePos = approve.getEleMousePos(ev, root);

			//检测拖拽目标是否已经达到边界，到达边界然后改变滚动条位置
			var tDistance = approve.getElementPos(target);
			var rDistance = approve.getElementPos(root);
			if((tDistance.y <= rDistance.y) && (lastPos.y - movePos.y > 0)) {
				root.scrollTop -= 10;
			}
			if((rDistance.y + root.offsetHeight <= tDistance.y + target.offsetHeight) && (lastPos.y - movePos.y < 0)) {
				root.scrollTop += 10;
			}
			
			//设置目标元素在移动过程中的位置
			var left = movePos.x - dragContext.tmpX;
			var top = movePos.y - dragContext.tmpY;
			left = (approve.isFF ? left : (left - root.scrollLeft));
			top = (approve.isFF ? top : (top - root.scrollTop));
			if(options.isRange) {
				target.style.left = Math.min(Math.max(dragContext.lRange, left), dragContext.rRange) + "px";
				target.style.top = Math.min(Math.max(dragContext.tRange, top), dragContext.bRange) + "px";
			} else {
				target.style.left = left + "px";
				target.style.top = top + "px";
			}
			dragContext.movePos = movePos;

			//根据鼠标位置设置占位元素在列表中的位置
			var itemTarget = null;
			for (var k = 0; k < dragContext.itemArray.length; k++) {
				var item = dragContext.itemArray[k];

				// var posLeft = approve.isFF ? (item.PosLeft - root.scrollLeft) : item.PosLeft;
				// var posTop = approve.isFF ? (item.PosTop - root.scrollTop) : item.PosTop;

				// var rangeX = (movePos.x > posLeft && movePos.x < posLeft + item.PosWidth);
				// var rangeY = (movePos.y > posTop && movePos.y < posTop + item.PosHeight);

				var posTop = approve.isFF ? (item.PosTop - root.scrollTop) : item.PosTop;

				var rangeX = (movePos.x > rDistance.x && movePos.x < rDistance.x + root.offsetWidth);
				var rangeY = (movePos.y > posTop && movePos.y < posTop + item.PosHeight);

				if (rangeX && rangeY) {
					itemTarget = approve.$('.' + options.itemClass + '[data-id="' + item.DragId + '"]');
					dragContext.posDom.style.width = itemTarget.offsetWidth + "px";
					if (movePos.y < posTop + item.PosHeight / 2) {
						//往上移                                 
						itemTarget.parentNode.insertBefore(dragContext.posDom, itemTarget);
					} else {
						//往下移
						approve.insertAfter(dragContext.posDom, itemTarget);
					}
					break;
				}
			}

			//重新获取所有可拖拽项目的位置信息
			dragContext.itemArray = approve.restoreComponentsPos(root, options.itemClass, target);
		},
		mouseupHandle: function(dragContext) {
			var root = dragContext.root;
			var posDom = dragContext.posDom;
			var options = dragContext.options;

			var controls = options.controls;
			var itemClass = options.itemClass;
			var target = dragContext.dragTarget;

			if(approve.isIE) {
				target.releaseCapture();
			} else {
				window.releaseEvents(target.mousemove);
			}
			dragContext.dragable = false;

			target.style.cssText = '';
			document.body.style.cssText = '';
			approve.removeClass(target, 'drag-current');
			
			if(controls) {
				//开始重新计算元素的orderCode
				var length = controls.length;
				var nextItem = approve.nextItem(posDom, itemClass);
				var start = parseInt(target.getAttribute('data-ordercode'));
				var end = nextItem ? parseInt(nextItem.getAttribute('data-ordercode')) : (length + 1);
				var ismove = !(end === start + 1 || end === start);
				dragContext.isEdit = ismove ? true : false;
				//循环控件列表对象，根据位移情况重置orderCode
				ismove && controls.forEach(function(item) {
					var itemDom = root.querySelector('.' + itemClass + '[data-id="' + item.uniqueIndex + '"]');
					if(end > start) {							
						if(item.orderCode > start && item.orderCode < end) {
							item.orderCode -= 1;
						} else if(item.orderCode == start) {
							item.orderCode = end - 1;
						}
					} else if(end < start) {
						if(item.orderCode >= end && item.orderCode < start) {
							item.orderCode += 1;
						} else if(item.orderCode == start) {
							item.orderCode = end;
						}
					}
					itemDom.setAttribute('data-orderCode', item.orderCode);
				});
				options.controls.sort(function(a, b) { return a.orderCode - b.orderCode; });
			}
			if(options.itemOrderCodeCb) {
				var tarId = target.getAttribute('data-id');
				var prevItem = approve.prevItem(posDom, itemClass);
				var nextItem = approve.nextItem(posDom, itemClass);
				var prevId = prevItem ? prevItem.getAttribute('data-id') : 0;
				var nextId = nextItem ? nextItem.getAttribute('data-id') : 0;
				options.itemOrderCodeCb(tarId, prevId, nextId);
			}

			posDom.parentNode.insertBefore(target, posDom);
			posDom.parentNode.removeChild(posDom);

			if(options.itemSettingCb) {
				//设置选中项
				var itemList = dragContext.root.querySelectorAll('.' + itemClass);
				//先清除所有后设置选中
				approve.clearListClass(controls, itemList, 'selected');
				options.itemSettingCb(controls, target, 'selected', '');
			}

			if(options.isEditCb) {
				options.isEditCb(dragContext.isEdit);
			}

			delete posDom;
			delete dragContext;
		}
	}

	//创建控件拖拽
	approve.createControl = create();
	/*
	 * 列表中的项拖拽options
	 * containerId 拖拽控件的列表根容器的id(必填)
	 * controlClass 拖拽控件的类名(必填)
	 * rootId 生成控件的列表根容器的id(必填)
	 * itemClass 列表中项的类名(必填)
	 * noControlClass 列表中没有选项的提示DOM类名(必填)
	 * controls 内存中控件列表(必填)
	 * itemSettingCb 选项设置的回调函数(选填)
	 */
	approve.createControl.prototype = {
		init: function(options) {
			var me = this;
			var dragContext = {
				'container': approve.$('#' + options.containerId),//控件列表根容器
				'control': approve.$('.' + options.controlClass),//控件列表
				'root': approve.$('#' + options.rootId),//生成的控件列表根容器
				'options': options
			};

			ecui.dom.addEventListener(dragContext.container, 'mousedown', function(e) {
				var ev = dragContext.ev = e || window.event;
				if(ev.button == 2) {
					return false;
				}

				var tar = dragContext.tar = ev.target;
				if(!tar) {
					return false;
				}

				if (approve.isTarget(tar, options.controlClass, dragContext.container)) {
					me.mousedownHandle(dragContext);
				}
			});


			ecui.dom.addEventListener(document, 'mousemove', function(e) {
				
				if(!dragContext.dragable) {
					return false;
				}
				var ev = dragContext.ev = e || window.event;

				me.mousemoveHandle(dragContext);
			});


			ecui.dom.addEventListener(document, 'mouseup', function(e) {
				if(!dragContext.dragable) {
					return false;
				}

				me.mouseupHandle(dragContext);
			});
		},
		mousedownHandle: function(dragContext) {
			var ev = dragContext.ev;
			var tar = dragContext.tar;
			var root = dragContext.root;
			var options = dragContext.options;
			var container = dragContext.container;
			
			//存储所有可拖拽项目的位置信息
			dragContext.itemArray = approve.restoreComponentsPos(root, options.itemClass);

			//创建占位元素
			var posDom = dragContext.posDom = document.createElement("div");

			//获取控件元素
			var control = dragContext.control = approve.getTargetDom(tar, options.controlClass, container);
			control.style.cssText = 'background-color:#ccc;';
			var controlProp = control.getAttribute('data-ele');

			//组装初始化控件时的参数
			var prop = JSON.parse(controlProp);
			var option = { 'elementId': prop.id, 'typeName': prop.typeName, 'title': prop.des };

			//创建目标控件元素
			var obj = approve.initControl(options.itemClass, option);
			dragContext.element = obj.control;
			var target = dragContext.dragTarget = obj.itemControl;
			control.parentNode.insertBefore(target, control);

			//获取目标元素的宽高值
			var targetWH = approve.getWH(target);
			var dragW = targetWH.width;
			var dragH = targetWH.height;

			document.body.style.cssText = 'cursor:move!important';
			target.style.cssText = 'z-index:1002;width:' + dragW + 'px;height:' + dragH + 'px';
            approve.addClass(target, 'drag-current');

			//设置占位元素的样式
			posDom.style.cssText = 'background-color:#E5E5E5;width:' + dragW + 'px;height:' + dragH + 'px';


			dragContext.dragable = true;

			//获取鼠标在控件列表的位置			
			var downPos = dragContext.movePos = approve.getEleMousePos(ev, container);

			dragContext.tmpX = downPos.x - target.offsetLeft;
			dragContext.tmpY = downPos.y - target.offsetTop;
			
			target.style.left = (control.offsetLeft - container.scrollLeft) + 'px';
			target.style.top = (control.offsetTop - container.scrollTop) + 'px';

			if(approve.isIE) {
				dragContext.dragTarget.setCapture();
			} else {
				window.captureEvents(Event.mousemove);
			}
			if(ev.preventDefault) {
				ev.preventDefault();
				ev.stopPropagation();
			}
		},
		mousemoveHandle: function(dragContext) {
			var ev = dragContext.ev;
			var root = document.body;
			var posDom = dragContext.posDom;
			var options = dragContext.options;
			var itemClass = options.itemClass;
			var controlBox = dragContext.root;
			var target = dragContext.dragTarget;			
			var container = dragContext.container;			
			var noControlClass = options.noControlClass;//没有控件样式

			//判断鼠标所在区域(考虑控件列表和生成控件列表有垂直滚动条的情况)
			var mousePos = approve.getMousePos(ev);			
			var conPos = approve.getElementPos(container);
			var boxPos = approve.getElementPos(controlBox);
			if(mousePos.x > conPos.x && mousePos.x < (conPos.x + container.offsetWidth)) {
				root = container;
			} else if(mousePos.x > boxPos.x && mousePos.x < (boxPos.x + controlBox.offsetWidth)) {
				root = controlBox;
			}
			
			//获取鼠标在相应区域的坐标
			var movePos = approve.getEleMousePos(ev, root);
			var left = movePos.x - dragContext.tmpX;
			var top = movePos.y - dragContext.tmpY;
			target.style.left = (approve.isFF ? left : (left - root.scrollLeft)) + "px";
			target.style.top = (approve.isFF ? top : (top - root.scrollTop)) + "px";



			//根据鼠标位置设置占位元素在列表中的位置			
			var itemTarget = null;			
			var rootPos = approve.getElementPos(controlBox);
			for (var k = 0; k < dragContext.itemArray.length; k++) {
				var item = dragContext.itemArray[k];

				// var posLeft = approve.isFF ? (item.PosLeft - root.scrollLeft) : item.PosLeft;
				// var posTop = approve.isFF ? (item.PosTop - root.scrollTop) : item.PosTop;

				// var rangeX = (movePos.x > posLeft && movePos.x < posLeft + item.PosWidth);
				// var rangeY = (movePos.y > posTop && movePos.y < posTop + item.PosHeight);

				var posTop = approve.isFF ? (item.PosTop - root.scrollTop) : item.PosTop;

				var rangeX = (movePos.x > rootPos.x && movePos.x < rootPos.x + controlBox.offsetWidth);
				var rangeY = (movePos.y > posTop && movePos.y < posTop + item.PosHeight);

				if (rangeX && rangeY) {
					itemTarget = approve.$('.' + options.itemClass + '[data-id="' + item.DragId + '"]');					
					posDom.style.width = itemTarget.offsetWidth + "px";
					if (movePos.y < posTop + item.PosHeight / 2) {
						//往上移                                 
						itemTarget.parentNode.insertBefore(posDom, itemTarget);
					} else {
						//往下移
						approve.insertAfter(posDom, itemTarget);
					}
					break;
				}
			}

			var controlList = null;
			var noControlDom = approve.$('.' + noControlClass);
			var itemList = controlBox.querySelectorAll("." + itemClass);
			if (movePos.x > rootPos.x && movePos.x < rootPos.x + controlBox.offsetWidth) {
				if (itemList.length === 0) {
					controlList = noControlDom.parentNode;
					controlList.appendChild(posDom);					
				} else {
					var firstItem = approve.firstChild(controlBox, "." + itemClass);
					var lastItem = approve.lastChild(controlBox,  "." + itemClass);
					var firstItemPos = approve.getElementPos(firstItem);
					var lastItemPos = approve.getElementPos(lastItem);
					var up = firstItemPos.y;
					var down = lastItemPos.y + lastItem.offsetHeight;
					controlList = firstItem.parentNode;
					if (movePos.y < up) {
						controlList.insertBefore(posDom, firstItem);
					} else if (movePos.y > down) {
						controlList.appendChild(posDom);
					}					
				}
				noControlDom.style.cssText = 'display:none';
			} else {
				controlList = approve.$('.' + noControlClass).parentNode;
				if(posDom.parentNode == controlList) {
					controlList.removeChild(posDom);
				}
				if (itemList.length === 0) {
					noControlDom.style.cssText = '';
				}
			}
		},
		mouseupHandle: function(dragContext) {
			var posDom = dragContext.posDom;
			var control = dragContext.control;
			var target = dragContext.dragTarget;
			var element = dragContext.element;
			var options = dragContext.options;
			var controls = options.controls;

			if(approve.isIE) {
				target.releaseCapture();
			} else {
				window.releaseEvents(target.mousemove);
			}
			dragContext.dragable = false;

			target.style.cssText = '';
			control.style.cssText = '';
			document.body.style.cssText = '';

			approve.removeClass(target, 'drag-current');
			if(posDom.parentNode) {
				//重新计算所有生成控件的顺序编号
				var orderCode = -1;
				var tempItems = [];
				var length = controls.length;
				var next = approve.nextItem(posDom, options.itemClass);

				if(!next) {
					orderCode = length + 1;
					element.orderCode = orderCode;
					target.setAttribute('data-ordercode', orderCode);
					options.controls.push(element);
				} else {
					orderCode = parseInt(next.getAttribute('data-ordercode'));
					target.setAttribute('data-ordercode', orderCode);
					element.orderCode = orderCode;

					//重新排序orderCode，排完之后合并数组
					tempItems = options.controls.splice(orderCode - 1, length + 1 - orderCode);
					options.controls.push(element);
					tempItems.forEach(function(item) {
						item.orderCode += 1;
						//对应节点的orderCode属性也要相应修改
						var itemDom = dragContext.root.querySelector('.' + options.itemClass + '[data-id="' + item.uniqueIndex + '"]');
						itemDom.setAttribute('data-ordercode', item.orderCode);
					});
					tempItems.unshift(orderCode - 1, 0);
					options.controls.splice.apply(options.controls, tempItems);

					delete tempItems;
				}
				options.controls.sort(function(a, b) { return a.orderCode - b.orderCode });


				//在生成控件列表中插入目标节点并移除占位节点
				posDom.parentNode.insertBefore(target, posDom);
				posDom.parentNode.removeChild(posDom);

				if(options.itemSettingCb) {
					//选中列表中的项
					var itemList = dragContext.root.querySelectorAll('.' + options.itemClass);

					//先清除所有后设置选中
					approve.clearListClass(controls, itemList, 'selected');
					options.itemSettingCb(controls, target, 'selected', '');
				}
				
				if(options.isEditCb) {
					options.isEditCb(true);
				}
			} else {
				target.parentNode.removeChild(target);
				element.decrease();
			}
			
			delete posDom;
			delete dragContext;
		}
	}


})(meipro.approve);

/*
 * 判断是否为IE浏览器
 */
meipro.approve.isIE = (!!window.ActiveXObject || "ActiveXObject" in window) ? true : false;

/*
 * 判断是否为火狐浏览器
 */
meipro.approve.isFF = window.navigator.userAgent.toLowerCase().indexOf("firefox") > 0;

/*
 * DOM选择器
 * selector {string} 选择器
 */
meipro.approve.$ = function(selector) {
    return document.querySelector(selector);
}

/*
 * 获取元素实际宽高
 * el {obj} DOM元素
 */
meipro.approve.getWH = function(el) {
	var lBorder = parseInt(ecui.dom.getStyle(el, 'borderLeftWidth')) || 0;
	var rBorder = parseInt(ecui.dom.getStyle(el, 'borderRightWidth')) || 0;
	var tBorder = parseInt(ecui.dom.getStyle(el, 'borderTopWidth')) || 0;
	var bBorder = parseInt(ecui.dom.getStyle(el, 'borderBottomWidth')) || 0;

	return {
		width: el.offsetWidth - lBorder- rBorder,
		height: el.offsetHeight - tBorder - bBorder
	}
}

/*
 * 获取某个元素的第一个子元素
 * parentObj 父DOM元素
 * selector {string} 选择器
 */
meipro.approve.firstChild = function(parentObj, selector) {
	var tags = parentObj.querySelectorAll(selector);
    return tags[0];
}

/*
 * 获取元素坐标信息
 * el 目标DOM对象
 */
meipro.approve.getElementPos = function(el) {
    var _x = 0,
        _y = 0;
    do {
        _x += el.offsetLeft;
        _y += el.offsetTop;
    } while (el = el.offsetParent);
    return {
        x: _x,
        y: _y
    };
}

/*
 * 获取鼠标在目标元素中相对浏览器的坐标信息
 * e 鼠标对象
 * el 目标DOM对象
 */
meipro.approve.getEleMousePos = function(e, el) {
    var ev = e || window.event;
    if (ev.pageX || ev.pageY) {
        return {
			x: this.isFF ? ev.pageX : (ev.pageX + el.scrollLeft - el.clientLeft),
			y: this.isFF ? ev.pageY : (ev.pageY + el.scrollTop - el.clientTop)
        };
    }
    return {
        x: ev.clientX + el.scrollLeft - el.clientLeft,
        y: ev.clientY + el.scrollTop - el.clientTop
    };
}

/*
 * 获取鼠标的坐标信息
 * e 鼠标对象
 */
meipro.approve.getMousePos = function(e) {
    var ev = e || window.event;
    if (ev.pageX || ev.pageY) {
        return {
            x: ev.pageX,
            y: ev.pageY
        };
    }
    var doc = document.body ? document.body : document.documentElement;
    return {
        x: ev.clientX + doc.scrollLeft - doc.clientLeft,
        y: ev.clientY + doc.scrollTop - doc.clientTop
    };
}

/*
 * 获取指定类名的目标元素
 * el 起始DOM元素
 * className {string} 目标类名
 */
meipro.approve.getTargetDom = function(tar, tarClassName, root) {
	root = root || document.body;
    do {
        if (ecui.dom.hasClass(tar, tarClassName)) {
            return tar;
        }
    }
    while ((tar = tar.parentNode) && tar != root);
}

/*
 * 初始化控件 
 * itemClass {string} 控件类名
 * option {obj} 控件相关的所有属性
 */
meipro.approve.initControl = function(itemClass, option) {
	var control = null;	
	var itemControl = document.createElement('div');

	var type = option.elementId;
	var title = option.title;

    switch(type) {
        case 1:		
			control = new this.InputElement(option);
            break;
        case 2:
            control = new this.TextAreaElement(option);
            break;        
        case 3:
            control = new this.RadioElement(option);
            break;
        case 4:
            control = new this.CheckboxElement(option);
			break;
		case 6:
            control = new this.DateElement(option);
			break;
		case 7:
            control = new this.AttachElement(option);
            break;
		case 8:
            control = new this.DublDatePicker(option);
            break;            
		case 9:
            control = new this.NumberElement(option);
			control.extra1 = option.extra1 || '{"unit":"元"}';
            break;
    }	
	
	//控件属于选项组，设置对象上的选项组对象默认值
	if(type === 3 || type === 4) {
		var items = option.items;

		//编辑表单初始化时，需要设置index
		if(items && items.length > 0) {
			for(var i = 0, j = items.length; i < j; i++) {
				items[i].index = i;
			}
			control.items = items
		} else {
			//设置选项组的默认值
			control.items = [{ index: 0, item: '选项1', 'rule': '' }, { index: 1, item: '选项2', 'rule': '' }, { index: 2, item: '选项3', 'rule': '' }];
		}
	}

	//组装展示单位
	var unitTip = control.extra1 ? '（' + JSON.parse(control.extra1).unit + '）' : '';

	itemControl.setAttribute("data-id", control.uniqueIndex);
	control.orderCode === 0 || itemControl.setAttribute("data-ordercode", control.orderCode);
	itemControl.className = itemClass;
    itemControl.innerHTML = '' + 
    '<a href="javascript:;" class="control-close"></a>' + 
	'<a href="javascript:;" class="control-move"></a>' + 
	'<div class="control-item-content">' + 
	'	<div ui="type:label;id:control-title-' + control.uniqueIndex + '" class="control-item-title">' + title + 
	'	</div>' + 
	'	<div ui="type:label;id:control-unit-' + control.uniqueIndex + '" class="control-item-title">' + unitTip + 
	'	</div><div></div>' + control.outHtml() + 
	'</div>';

	ecui.init(itemControl);

    return {
		'itemControl': itemControl,
		'control': control
	};
}

/*
 * 在目标元素之后插进DOM
 * insertObj 待插DOM
 * obj 目标DOM
 */
meipro.approve.insertAfter = function(insertObj, obj) {
    if (obj.nextSibling) {
        obj.parentNode.insertBefore(insertObj, obj.nextSibling);
    } else {
        obj.parentNode.appendChild(insertObj);
    }
}

/*
 * 判断是否为目标元素
 * el 起始DOM元素
 * className {string} 目标类名
 */
meipro.approve.isTarget = function(el, className, root) {
	root = root || document.body;
    do {
        if (ecui.dom.hasClass(el, className)) {
            return true;
        }
    }
    while (el != root && (el = el.parentNode));
    return false;
}

/*
 * 获取某个元素的最后一个子元素
 * parentObj 父DOM元素
 * selector {string} 选择器
 */
meipro.approve.lastChild = function(parentObj, selector) {
	var tags = parentObj.querySelectorAll(selector);
    return tags[tags.length - 1];
}

/*
 * 存储容器组中每个容器的位置、宽高信息
 * componentClassName {string} 容器类名
 */
meipro.approve.restoreComponentsPos = function(root, componentClassName, target) {
    var componentList = new Array();
    var components = root.querySelectorAll("." + componentClassName);
    for (var i = 0, length = components.length; i < length; i++) {
        var component = components[i];
		var id =  component.getAttribute('data-id');

		if(!id) {
			continue;
		}

		if(target) {
			var tarId = target.getAttribute('data-id');
			if(id === tarId) {
				continue;
			}
		}
		
        var componentPos = this.getElementPos(component);
        var obj = {
            DragId: id,
            PosLeft: componentPos.x,
            PosTop: componentPos.y,
            PosWidth: component.offsetWidth,
            PosHeight: component.offsetHeight
        };
        componentList.push(obj);
    }
    return componentList;
}

/*
 * 清除列表中所有项的类名
 * memoryList {array} 虚拟列表
 * list {array} dom列表
 * selectedClass {string} 选中类名
 * verityClass {string} 验证样式（可选） 
 */
meipro.approve.clearListClass = function(memoryList, list, selectedClass, verityClass) {
	var dom = ecui.dom;
	for(var i = 0, length = list.length; i < length; i++) {
		var item = list[i];
		this.removeClass(item, selectedClass);
		this.removeClass(item, verityClass);
		memoryList[i].isActive = false;
	}
}

/*
 * 扩展目标对象
 * target 目标对象
 * options 扩展对象
 */
meipro.approve.extend = function(target, options) {
	for (name in options) {
		target[name] = options[name];
	}
	return target;
}

/*
 * 下一个指定类名的兄弟节点
 * node 目标节点
 * itemClass 指定类名
 */
meipro.approve.nextItem = function(node, itemClass) {
	var dom = ecui.dom;
	var next = node.nextSibling;

	if(!next) return null;

	while(next.nodeType != 1) {
		next = next.nextSibling;
		if(!next) return null;
	}

	return dom.hasClass(next, itemClass) ? next : null;
}
/*
 * 前一个指定类名的兄弟节点
 * node 目标节点
 * itemClass 指定类名
 */
meipro.approve.prevItem = function(node, itemClass) {
	var dom = ecui.dom;
	var prev = node.previousSibling;

	if(!prev) return null;

	while(prev.nodeType != 1) {
		prev = prev.previousSibling;
		if(!prev) return null;
	}

	return dom.hasClass(prev, itemClass) ? prev : null;
}

/*
 * 给元素添加类名
 * control 元素节点
 * className 类名
 */
meipro.approve.addClass = function(control, className) {
	var dom = ecui.dom;
	className && (dom.hasClass(control, className) || dom.addClass(control, className));
}

/*
 * 给元素删除类名
 * control 元素节点
 * className 类名
 */
meipro.approve.removeClass = function(control, className) {
	var dom = ecui.dom;
	className && (dom.hasClass(control, className) && dom.removeClass(control, className));
}