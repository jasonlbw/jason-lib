(function($, undefined) {

   $.expr[":"].txtContains = $.expr.createPseudo(function(arg) {
      return function(elem) {
         return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
      };
   });
   $.expr[":"].searchOption = $.expr.createPseudo(function(arg) {
      arg = arg.split(',');
      return function(elem) {
         var $elem = $(elem);
         var valFlag = $elem.data('value').toString().toUpperCase() === arg[0].toUpperCase();
         var txtFlag = $elem.text().toUpperCase() === arg[1].toUpperCase();
         return valFlag && txtFlag;
      };
   });

   $.fn.searchselect = function(options) {

      var searchSelect = function(el) {
         this.options = options || {};
         this.el = $(el);
         this._init();
      }

      searchSelect.prototype = {
         //初始化
         _init: function() {
            this.el.hide();
            this.el.data('searchselect', this);
            this.itemClass = '.searchable-select-item';
            this.itemClassName = '.searchable-select-item';
            this.hideClass = '.searchable-select-hide';
            this.hideClassName = 'searchable-select-hide';
            this.noneClassName = '.searchable-select-none';
            this._render();
            this._bind();
         },
         //销毁插件
         _destroy: function() {
            this._offSearchElement();
            this._offSearchInput();
            this._offBlur();
            this._offItems();
            this._offPage();
            this.el.removeData('searchselect');
            this.searchableElement.remove();
            this.el.show();
         },
         //绑定事件
         _bind: function() {
            this._bindSearchElement();
            this._bindSearchInput();
            this._bindBlur();
            this._bindItems();
            this._bindPage();
         },
         //绑定整个插件事件
         _bindSearchElement: function() {
            var me = this;
            this.searchableElement.off('click').on('click', function(e) {
               var ev = e || window.event;
               if (ev.target === me.searchInput[0]) {
                  return false;
               }

               if (!me.status) {
                  me._show();
               } else {
                  if (me.status === "show") {
                     me._hide();
                  } else {
                     me._show();
                  }
               }
            });
         },
         _offSearchElement: function() {
            this.searchableElement.off('click');
         },
         //绑定搜索框事件
         _bindSearchInput: function() {
            var me = this;
            this.searchInput.off('keydown').on('keydown', function(e) {
               var ev = e || window.event;

               if (ev.which === 13) { //enter
                  me._preventDefault(ev);
                  if (!me.items.isMatch) {
                     $(this).val('');
                     me._filter();
                     return false;
                  }
                  me._selectHoverItem();
                  me._hide();
               } else if (ev.which == 27) { //esc
                  me._hide();
               } else if (ev.which == 40) { //down                  
                  me._hoverNextItem();
               } else if (ev.which == 38) { //up
                  me._hoverPreItem();
               }
            }).off('keyup').on('keyup', function(e) {               
               var ev = e || window.event;
               if (ev.which != 13 && ev.which != 27 && ev.which != 38 && ev.which != 40)
                  me._filter();
            });
         },
         _offSearchInput: function() {
            this.searchInput.off('keydown').off('keyup');
         },
         //绑定插件失去焦点
         _bindBlur: function() {
            var me = this;
            $(document).off('click').on('click', null, function(e) {
               var ev = e || window.event;
               if (me.searchableElement.has($(ev.target)).length === 0) {
                  me._hide();
               }
            });
         },
         _offBlur: function() {
            $(document).off('click');
         },
         //绑定item事件
         _bindItem: function(item) {
            var me = this;
            item.off('mouseenter').on('mouseenter', function() {
               $(this).addClass('hover');
            }).off('mouseleave').on('mouseleave', function() {
               $(this).removeClass('hover');
            }).off('click').on('click', function(e) {
               var ev = e || window.event;
               me._preventDefault(ev);
               me._selectItem($(this));
               me._hide();
            });
         },
         _offItem: function(item) {
            if(item) {
               item.off('mouseenter').off('mouseleave').off('click');
            } else {
               this.items.find(this.itemClass).each(function() {
                  $(this).off('mouseenter').off('mouseleave').off('click');
               });
            }
         },
         //绑定下拉框的scorll事件
         _bindItems: function() {
            var me = this;
            this.items.off('scroll').on('scroll', function() {
               me._setPageVisibility();
            });
         },
         _offItems: function() {
            this.items.off('scroll');
         },
         //绑定options的分页事件
         _bindPage: function() {
            var me = this;

            this.pres.data('flag', 1);
            this.nexts.data('flag', -1);

            this.pres.add(this.nexts).off('mouseenter').on('mouseenter', function() {
               me.pageTimer = null;
               var tempTop = 0,
                  flag = $(this).data('flag') > 0;

               var page = function() {
                  var sTop = me.items.scrollTop();
                  var currentTop = flag ? (sTop - 20) : (sTop + 20);

                  if (tempTop !== currentTop) {
                     tempTop = currentTop;
                     me.items.scrollTop(currentTop);
                     me.pageTimer = setTimeout(page, 50);
                  } else {
                     clearTimeout(me.pageTimer);
                  }
               }
               page();
            }).off('mouseleave').on('mouseleave', function() {
               me.pageTimer && clearTimeout(me.pageTimer);
            });
         },
         _offPage: function() {
            this.pres.add(this.nexts).off('mouseenter').off('mouseleave');
         },
         //搜索过滤选项item
         _filter: function() {
            var items = this.items;
            var txt = this.searchInput.val();
            var options = items.find(this.itemClass);

            if(options.length === 0) {
               items.isMatch = false;
               if(txt) {
                  items.find(this.noneClassName).show();
               } else {
                  items.find(this.noneClassName).hide();
               }
               return false;
            }
            
            var contains = items.find(this.itemClass + ':txtContains(' + txt + ')');
            options.addClass(this.hideClassName);
            contains.removeClass(this.hideClassName);
            
            if (items.find(this.itemClass + ':not(' + this.hideClass + ')').length > 0) {
               this._hoverFirstItem();
               items.isMatch = true;
               items.find(this.noneClassName).hide();
            } else {
               items.isMatch = false;
               items.find(this.noneClassName).show();
            }
            this._setPageVisibility();
         },
         //渲染整个插件
         _render: function() {
            var searchClassName = this.options.searchClassName;
            var eleClassName = searchClassName ? ('searchable-select ' + searchClassName) : 'searchable-select';
            this.searchableElement = $('<div class="' + eleClassName + '"></div>');

            this._renderMain();
            this._renderDropdown();
            this._renderOptions();
            this._renderItems();

            this.el.after(this.searchableElement);
         },
         //渲染主体结构
         _renderMain: function() {
            this.holder = $('<div class="searchable-select-holder"></div>').appendTo(this.searchableElement);
            this.icon = $('<span class="searchable-select-icon"></span>').appendTo(this.searchableElement);
            this.dropdown = $('<div class="searchable-select-dropdown searchable-select-hide"></div>').appendTo(this.searchableElement);
         },
         //渲染下拉部分结构
         _renderDropdown: function() {
            var inputClassName = this.options.inputClassName;
            var eleClassName = inputClassName ? ('searchable-select-input ' + inputClassName) : 'searchable-select-input';
            this.searchInput = $('<input type="text" class="' + eleClassName + '" />').appendTo(this.dropdown);
            this.scrollContainer = $('<div class="searchable-scroll"></div>').appendTo(this.dropdown);
         },
         //渲染下拉分页结构
         _renderOptions: function() {
            this.pres = $('<div class="searchable-has-privious">...</div>').appendTo(this.scrollContainer);
            this.items = $('<div class="searchable-select-items"></div>').appendTo(this.scrollContainer);
            this.nexts = $('<div class="searchable-has-next">...</div>').appendTo(this.scrollContainer);
         },
         //渲染下拉选项options
         _renderItems: function() {
            var me = this;
            var itemClassName = this.options.itemClassName;
            var eleClassName = itemClassName ? ('searchable-select-item ' + itemClassName) : 'searchable-select-item';
            this.el.find('option').each(function() {
               var item = $('<div class="' + eleClassName + '" data-value="' + $(this).prop('value') + '">' + $(this).text() + '</div>');

               if (this.selected) {
                  me._selectItem(item);
               }
               me._bindItem(item);
               me.items.append(item);
            });

            this.items.append('<div class="searchable-select-none">no match item</div>');
            this.items.isMatch = true;
         },
         //是否有hover选项
         _hasHoverItem: function() {
            return this.hoverItem && this.hoverItem.length > 0;
         },
         //设置选项为hover选项
         _hoverItem: function(item) {
            if (this._hasHoverItem()) {
               this.hoverItem.removeClass('hover');
            }

            var height = this.items.height();
            var oHeight = item.outerHeight();
            var top = item.position().top;
            var sTop = this.items.scrollTop();

            if (oHeight + top > height) {
               this.items.scrollTop(sTop + oHeight + top - height);
            } else if (top < 0) {
               this.items.scrollTop(sTop + top);
            }

            this.hoverItem = item;
            item.addClass('hover');
         },
         //设置首个选项为hover选项
         _hoverFirstItem: function() {
            this._hoverItem(this.items.find(this.itemClass + ':not(' + this.hideClass + ')').first());
         },
         //设置上一个选项为hover选项
         _hoverPreItem: function() {
            if (!this._hasHoverItem()) {
               this._hoverFirstItem();
            } else {
               var pre = this.hoverItem.prevAll(this.itemClass + ':not(' + this.hideClass + '):first');
               if (pre.length > 0) {
                  this._hoverItem(pre);
               }
            }
         },
         //设置下一个选项为hover选项
         _hoverNextItem: function() {
            if (!this._hasHoverItem()) {
               this._hoverFirstItem();
            } else {
               var next = this.hoverItem.nextAll(this.itemClass + ':not(' + this.hideClass + '):first');
               if (next.length > 0) {
                  this._hoverItem(next);
               }
            }
         },
         //是否有选中项
         _hasSelectedItem: function() {
            return this.selectedItem && this.selectedItem.length > 0;
         },
         //选中选项
         _selectItem: function(item) {
            if (this._hasSelectedItem()) {
               this.selectedItem.removeClass('selected');
            }

            this.selectedItem = item;
            item.addClass('selected');

            var text = item.text();
            var value = item.data('value');
            this.holder.text(text).data('value', value);
            this.el.val(value);

            if (this.options.change) {
               this.options.change(value, text);
            }
         },
         //选中当前非隐藏的hover选项
         _selectHoverItem: function() {
            if (!this.hoverItem.hasClass(this.hideClassName)) {
               this._selectItem(this.hoverItem);
            }
         },
         //设置分页按钮是否显示
         _setPageVisibility: function() {
            if(this.items.find(this.itemClass).length === 0) {
               this.pres.addClass(this.hideClassName);
               this.nexts.addClass(this.hideClassName);
               this.scrollContainer.addClass('has-privious').addClass('has-next');
               return false;
            }

            var sTop = this.items.scrollTop();
            var iHeight = this.items.innerHeight();
            var sHeight = this.items[0].scrollHeight;
            if (sTop === 0) {
               this.pres.addClass(this.hideClassName);
               this.scrollContainer.removeClass('has-privious');
            } else {
               this.pres.removeClass(this.hideClassName);
               this.scrollContainer.addClass('has-privious');
            }

            if (sTop + iHeight >= sHeight) {
               this.nexts.addClass(this.hideClassName);
               this.scrollContainer.removeClass('has-next');
            } else {
               this.nexts.removeClass(this.hideClassName);
               this.scrollContainer.addClass('has-next');
            }
         },
         //显示下拉选项及分页
         _show: function() {
            this.dropdown.removeClass(this.hideClassName);
            this.searchInput.focus();
            this.searchableElement.trigger('focus');
            this.status = 'show';
            if(!this.items.isMatch) {
               this.searchInput.val('');
               this._filter();
            }
            this._setPageVisibility();
         },
         //隐藏下拉选项及分页
         _hide: function() {
            this.dropdown.addClass(this.hideClassName);
            this.status = 'hide';
            this.hoverItem && this.hoverItem.removeClass('hover');
         },
         //阻止默认事件和冒泡
         _preventDefault: function(ev) {
            if (ev.preventDefault) {
               ev.preventDefault();
               ev.stopPropagation();
            }
         }
      }

      //公用方法
      var methods = {
         //销毁插件
         destroy: function() {
            var searchselect = this.data('searchselect');
            searchselect && searchselect._destroy();
            return this;
         },
         //添加选项
         addItem: function($option) {
            var searchselect = this.data('searchselect');
            if(!searchselect) {
               return this;
            }

            if(!searchselect.items.isMatch) {
               searchselect._hide();
               searchselect.searchInput.val('');
               searchselect._filter();
               return this;
            }

            var item = $('<div class="searchable-select-item" data-value="' + $option.prop('value') + '">' + $option.text() + '</div>');
            searchselect.items.append(item);
            searchselect.el.append($option);
            searchselect._bindItem(item);
            if(!searchselect.selectedItem) {
               searchselect._selectItem(item);
            }

            return this;
         },
         //移除选项
         removeItem: function($option) {
            var searchselect = this.data('searchselect');
            if(!searchselect) {
               return this;
            }

            if(!searchselect.items.isMatch) {
               searchselect._hide();
               searchselect.searchInput.val('');
               searchselect._filter();
               return this;
            }

            var items = searchselect.items.find(searchselect.itemClass + ':not(' + searchselect.hideClass + ')');
            var length = items.length;

            if(length <= 0) {
               return this;
            }

            var txt = $option.text();
            var val = $option.prop('value');
            var selector = ':searchOption(' + val + ',' + txt + ')';
            var item = searchselect.items.find(searchselect.itemClass + selector);

            if(!item) {
               return this;
            }
            //如果删除项为选中项
            if(searchselect.selectedItem[0] === item[0]) {
               var next = item.nextAll(searchselect.itemClass + ':not(' + searchselect.hideClass + '):first');
               if(next.length > 0) {
                  searchselect._selectItem(next);
               } else {
                  var pre = item.prevAll(searchselect.itemClass + ':not(' + searchselect.hideClass + '):first');
                  if(pre.length > 0) {
                     searchselect._selectItem(pre);
                  } else {
                     searchselect.holder.text('no available item').removeData('value');
                     searchselect.selectedItem = null;
                     searchselect.hoverItem = null;
                     if (searchselect.options.change) {
                        searchselect.options.change('', '');
                     }
                  }
               }               
            }
            searchselect._offItem(item);
            item.remove();
            $option.remove();

            return this;
         }
      };

      var method = arguments[0];
      if(methods[method]) {
         var args = Array.prototype.slice.call(arguments, 1);
         return this.each(function() {
            methods[method].apply($(this), args);
         });
      } else if(typeof options === 'object' || !options) {
         return this.each(function() {
            new searchSelect(this);
         });
      } else {
         $.error('method ' + options + ' does not exist on searchselect');
         return this;
      }
   };

})(jQuery);