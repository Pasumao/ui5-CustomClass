/* eslint-disable max-depth */
sap.ui.define([
	"./ModelController",
	"../Unit/ValueHelpDialog",
	"../Control/Debugger",
	"sap/ui/core/EventBus",
	"../Unit/FragmentEvent",
	"../Unit/Lodash"
], function (
	Controller,
	ValueHelpDialog,
	Debugger,
	EventBus,
	FragmentEvent,
	_
) {
	"use strict";

	return Controller.extend("Base.BaseController", {
		_bind() {           //绑定this的元素
			Controller.prototype._bind.apply(this, arguments);
			this.Router = this.getOwnerComponent().getRouter();
			this.EventBus = EventBus.getInstance();
			this.EventLoop = [];
			this._debounceList = [];
			// eslint-disable-next-line fiori-custom/sap-no-global-define
			window.Debugger = new Debugger({ this: this, visible: false });
		},

		/**
		 * 主要是用于处理自定义事件触发乱序问题和同时触发的问题
		 * 比如A控件叠在B控件上就可能导致同时触发A和B的事件
		 * 这里指的事件是直接绑在DOM上的事件而不是sapui5的事件
		 * 包括press之类的，只要是sap定义的事件都不包括在内
		 * 因为sap定义的事件是他重新写的事件系统，和原生DOM事件不同
		 * DOM事件会优先于sap事件触发导致bug
		 * @param {function} func 回调函数
		 * @param {number} level 触发等级，在同时触发时触发等级最高的事件，其他时间则不会触发
		 */
		_Event(func, level = 1) {
			this.EventLoop.push({ func, level });
			setTimeout(() => {
				if (this.EventLoop.length === 0) {
					return;
				}
				var funcmax = () => { };
				var levelmax = 0;
				this.EventLoop.forEach((event) => {
					if (event.level > levelmax) {
						levelmax = event.level;
						funcmax = event.func;
					}
				});
				this.EventLoop = [];
				funcmax();
			}, 0);
		},

		_: _,

		/**
		 * FragmentEvent用的简便方法，详情参考Unit/FragmentEvent文件
		 * @param {string} name 
		 * @param {Function} callback 
		 */
		h(name, callback) {
			this.EventBus.subscribe("fragment", name, FragmentEvent.h(callback));
		},

		/**
		 * valuehelp的调用方法，如果要处理数据可以照着写
		 * 增加了防抖
		 * @param {sap.ui.base.Event} oEvent oEvent
		 */
		onMultiInputValueHelpRequest: function (oEvent) {
			const vhfunction = () => {
				const oControl = oEvent.getSource();
				const oProperties = oControl.data("valuehelp");

				// 原始业务逻辑
				ValueHelpDialog.open(oEvent, JSON.parse(JSON.stringify(oProperties)), this);

				// 保留原始超时释放逻辑
				setTimeout(() => {
					oControl.setBusy(false);
				}, 5000);
			}
			const oControl = oEvent.getSource();
			const sId = oControl.getId();
			let debouncedSearch;

			// 查找已存在的防抖函数
			const existingDebounce = this._debounceList.find(item => item.id === sId && item.mark === 'vh');

			if (!existingDebounce) {
				// 创建新的防抖函数并绑定正确的this
				debouncedSearch = _.debounce(vhfunction.bind(this), 500, { leading: true });

				this._debounceList.push({
					id: sId,
					mark: 'vh',
					obj: debouncedSearch
				});
			} else {
				debouncedSearch = existingDebounce.obj;
			}

			// 直接调用防抖函数（无需传递oEvent）
			debouncedSearch();
		},

		/**
		 * 下载的模板方法，也可直接调用
		 * @param {object[]} aFiles 
		 * @returns o 下载的成功与否
		 */
		async Download(aFiles) {
			let directoryHandle;
			if (window.showDirectoryPicker) {
				directoryHandle = await window.showDirectoryPicker({
					mode: "readwrite",
					startIn: "downloads"
				})
			}
			const _down = async (oData) => {
				try {
					if (directoryHandle) {
						const fileHandle = await directoryHandle.getFileHandle(`${oData.fileName}.${oData.fileType}`, { create: true });
						const writable = await fileHandle.createWritable();

						await writable.write(oData.FileData);
						await writable.close();
					} else {
						const a = document.createElement("a");
						a.href = URL.createObjectURL(oData.FileData);
						a.download = req.filename;
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
						URL.revokeObjectURL(a.href);
					}
					return {
						fileName: oData.fileName,
						fileType: oData.fileType,
						success: true
					}
				} catch (error) {
					return {
						fileName: oData.fileName,
						fileType: oData.fileType,
						success: false,
						error: error
					}
				}
			}

			const aPromise = aFiles.map(async (oFile) => _down(oFile));
			await Promise.all(aPromise);
			return aPromise;
		},

		/**
		 * 自动调整列宽的方法，增加了对sap.m.InputBase的列宽调整
		 * sap.ui.table.Column上可以使用data:maxWidth="100px"来设置最大宽度,目前只支持px宽度单位
		 * sap.ui.table.Column上可以使用data:addWidth="10px"来自动计算完宽度后添加宽度
		 * sap.ui.table.Column上可以使用data:minWidth="10px"来设定最小宽度,目前只支持px宽度单位
		 * sap.ui.table.Column上可以使用data:noWidth="true"来禁止自动调整列宽
		 * 在template中的控件可以使用data:agg="Aggregations"来逐级往内获取控件，根据最后找到的控件的宽度来设置列宽，引号内输入Aggregations属性
		 * @public
		 * @param {sap.ui.table.Table|sap.ui.base.Event} oEvent table控件实例
		 */
		__autoWidthTable(oEvent) {
			let oTable;
			if (oEvent.getSource) {
				oTable = oEvent.getSource();
			} else {
				oTable = oEvent;
			}
			const aColumns = oTable.getColumns();

			function measureTextWidth(text, font) {
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');
				context.font = font;
				return context.measureText(text).width;
			}

			function getControl(oControl) {
				if (oControl.data("agg")) {
					return getControl(oControl.getAggregation(oControl.data("agg")));
				} else {
					return oControl;
				}
			}

			aColumns.forEach(column => {
				if (column.data("noWidth")) { return; }
				try {
					column.autoResize();
					let width = Number(column.getWidth().split("px")[0]);
					const oTemplate = getControl(column.getTemplate());
					if (oTemplate.isA("sap.m.InputBase")) {
						const aInputs = column._mTemplateClones.Standard
						const aWidth = aInputs.map(i => {
							const oInputDom = i.getDomRef().querySelector("input");
							const text = oInputDom.value || oInputDom.placeholder || "";
							if (!text) { return 0; }
							const font = window.getComputedStyle(oInputDom).font;
							const textWidth = measureTextWidth(text, font);
							if (i.mAggregations._endIcon) { textWidth += 32; }
							if (i.mAggregations._beginIcon) { textWidth += 32; }
							return textWidth;
						})

						let iWidth = Math.max(...aWidth);
						if (iWidth === 0) { return; }
						const oTableElement = oTable.getDomRef();
						const iTableWidth = oTableElement.querySelector('.sapUiTableCnt').getBoundingClientRect().width;
						iWidth = Math.min(iWidth, iTableWidth); // no wider as the table
						iWidth = Math.max(iWidth, 10); // not too small
						width = iWidth + 36
					}

					if (column.data("addWidth")) {
						let addWidth = column.data("addWidth").split("px")[0];
						addWidth = Number(addWidth);
						width += addWidth;
					}

					if (column.data("maxWidth")) {
						let maxWidth = column.data("maxWidth").split("px")[0];
						if (width > Number(maxWidth)) {
							width = Number(maxWidth);
						}
					}

					if (column.data("minWidth")) {
						let minWidth = column.data("minWidth").split("px")[0];
						if (width < Number(minWidth)) {
							width = Number(minWidth);
						}
					}

					column.setWidth(width + "px");
				} catch (e) {
					return;
				}
			});
		},

		/**
		 * multiinput的addValidator方法用
		 * 函数添加在将任何新令牌添加到 tokens 聚合之前调用的验证回调。
		 * @param {string} keyfield 主要是配合valuehelpdialog使用，如果不使用valuehelpdialog可以为空字符串
		 * @returns {function} 返回一个函数
		 */
		Validator(keyfield) {
			return (oArgs) => {
				let str = oArgs.text;

				const operatorMap = {
					"**": sap.ui.model.FilterOperator.Contains,     // 包含
					"_*": sap.ui.model.FilterOperator.StartsWith,   // 以特定值开头
					"*_": sap.ui.model.FilterOperator.EndsWith,      // 以特定值结尾
					"=": sap.ui.model.FilterOperator.EQ,           // 等于
					"!=": sap.ui.model.FilterOperator.NE,          // 不等于
					"<": sap.ui.model.FilterOperator.LT,           // 小于
					"<=": sap.ui.model.FilterOperator.LE,          // 小于等于
					">": sap.ui.model.FilterOperator.GT,           // 大于
					">=": sap.ui.model.FilterOperator.GE,          // 大于等于
					"…": sap.ui.model.FilterOperator.BT            // 范围
				};

				let operator = null;
				let value1 = null;
				let value2 = null;

				// 判断字符串内容
				if (str.startsWith("*") && str.endsWith("*")) {
					// 处理 *value* 的情况
					operator = "**";
					value1 = str.slice(1, str.length - 1).trim();
				} else if (str.endsWith("*")) {
					// 处理 555* 的情况
					operator = "_*";
					value1 = str.slice(0, -1).trim();
				} else if (str.startsWith("*")) {
					// 处理 *value 的情况（以特定值结尾）
					operator = "*_";
					value1 = str.slice(1).trim();
				} else if (str.startsWith("!=")) {
					// 处理 !=value 的情况
					operator = "!=";
					value1 = str.slice(2).trim();
				} else if (str.includes("...") && !str.startsWith("...") && !str.endsWith("...")) {
					// 处理 value...value 的情况（范围）
					operator = "…";
					[value1, value2] = str.split("...").map(s => s.trim());
				} else if (str.startsWith(">=")) {
					// 处理 >=value 的情况
					operator = ">=";
					value1 = str.slice(2).trim();
				} else if (str.startsWith(">")) {
					// 处理 >value 的情况
					operator = ">";
					value1 = str.slice(1).trim();
				} else if (str.startsWith("<=")) {
					// 处理 <=value 的情况
					operator = "<=";
					value1 = str.slice(2).trim();
				} else if (str.startsWith("<")) {
					// 处理 <value 的情况
					operator = "<";
					value1 = str.slice(1).trim();
				} else if (str.startsWith("=")) {
					// 处理 =value 的情况
					operator = "=";
					value1 = str.slice(1).trim();
				} else if (str.startsWith("!(=") && str.endsWith(")")) {
					// 处理 !(=value) 的情况
					operator = "!=";
					value1 = str.slice(3, -1).trim();
				} else {
					operator = "=";
					value1 = str.trim();
				}

				const filterOperator = operatorMap[operator] || operator;

				if (operator === "=") {
					return new sap.m.Token({
						key: value1,
						text: "=" + oArgs.text
					});
				} else {
					return new sap.m.Token({
						key: value1,
						text: oArgs.text
					}).data("range", {
						keyField: keyfield,
						operation: filterOperator,
						value1: value1,
						value2: value2
					});
				}
			};
		},

		/**
		 * 弹窗获取输入的值
		 * <ul>
		 * <li>{</li>
		 * <li><pre>  title: String,</pre></li>
		 * <li>  fieldlist: [{</li>
		 * <li>     key: String,</li>
		 * <li>    label: String,</li>
		 * <li>    isKey: Boolean,</li>
		 * <li>    control: sap.m.Input,</li>
		 * <li>  }]</li>
		 * <li>}</li>
		 * </ul>
		 * @param {object} oFiledCatalog 设置参数
		 * @param {string} oFiledCatalog.title 设置标题
		 * @param {string} oFiledCatalog.width 设置label长度
		 * @param {object[]} oFiledCatalog.fieldlist 设置字段列表
		 * @param {string} oFiledCatalog.fieldlist.key 设置字段在返回值的时候的key
		 * @param {string} oFiledCatalog.fieldlist.label 设置字段显示名称
		 * @param {boolean} oFiledCatalog.fieldlist.isKey 设置为必须输入
		 * @param {sap.ui.core.Control} oFiledCatalog.fieldlist.control 设置字段控件
		 * @returns {Promise<Object<string,any>>} 返回输入的参数
		 */
		getvaluedialog(oFiledCatalog) {
			var oView = this.getView();

			function getValue(oControl) {
				if (oControl instanceof sap.m.InputBase) {
					return oControl.getValue();
				} else if (oControl instanceof sap.m.DatePicker) {
					return oControl.getDateValue();
				} else if (oControl instanceof sap.m.CheckBox) {
					return oControl.getSelected();
				} else if (oControl instanceof sap.m.Select) {
					return oControl.getSelectedKey();
				}
				return null;
			}

			return new Promise((resolve, reject) => {
				const oDialog = new sap.m.Dialog({
					title: oFiledCatalog.title,
					draggable: true,
					resizable: true,
					beginButton: new sap.m.Button({
						text: "OK",
						type: sap.m.ButtonType.Emphasized,
						press: async () => {
							for (const field of oFiledCatalog.fieldlist) {
								var sValue = getValue(field.control);

								if (field.isKey) {
									if (!sValue) {
										field.control.setValueState(sap.ui.core.ValueState.Error);
										field.control.setValueStateText("Please enter a value.");
										return;
									} else {
										field.control.setValueState(sap.ui.core.ValueState.None);
										field.control.setValueStateText("");
									}
								}
							}

							var oData = {};
							oFiledCatalog.fieldlist.forEach(field => {
								oData[field.key] = getValue(field.control);
							});

							oDialog.close();
							resolve(oData);
						}
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						press: () => {
							oDialog.close();
							reject();
						}
					}),
					content: oFiledCatalog.fieldlist.map(field => {
						return new sap.m.HBox({
							alignContent: "Center",
							alignItems: "Center",
							justifyContent: "Center",
							items: [
								new sap.m.Label({
									width: oFiledCatalog.width || "10rem",
									required: field.isKey,
									text: field.label + ":"
								}),
								field.control
							]
						}).addStyleClass("sapUiSmallMarginBeginEnd");
					})
				});
				oView.addDependent(oDialog);
				oDialog.open();
			});
		},

		/**
		 * 弹窗确认与否
		 * @param {object} oProperty oProperty
		 * @param {string} oProperty.title 标题
		 * @param {string} oProperty.text 中间内容
		 * @returns {Promise<Boolean>} 返回是，否
		 */
		OKDialog(oProperty) {
			return new Promise((resolve, reject) => {
				var oDialog = new sap.m.Dialog({
					title: oProperty.title,
					draggable: true,
					resizable: true,
					beginButton: new sap.m.Button({
						text: "OK",
						type: sap.m.ButtonType.Emphasized,
						press: () => {
							oDialog.close();
							resolve(true);
						}
					}),
					endButton: new sap.m.Button({
						text: "cancel",
						press: () => {
							oDialog.close();
							reject(false);
						}
					}),
					content: [
						new sap.m.Text({
							text: oProperty.text
						}).addStyleClass("sapUiSmallMargin")
					]
				});
				oDialog.open();
			});
		},

		/**
		 * @example 
		 * await this.MessageBox().error("error message")
		 * @returns {sap.m.MessageBox} MessageBox namespace
		 */
		MessageBox() {
			var that = this;

			return new Proxy({}, {
				get: function (_, method) {
					return async function (...args) {
						if (!that._MessageBox) {
							that._MessageBox = await new Promise((resolve, reject) => {
								sap.ui.require(["sap/m/MessageBox"], resolve, reject);
							});
						}
						return that._MessageBox[method](...args);
					};
				}
			});
		},

		/**
		 * 异步加载一个类并返回
		 * @param {string} vClass 类名,要么使用sap.m.Input这种写法要么就直接写相对位置
		 * @returns {Promise<class>} 返回类
		 */
		import(vClass) {
			var sClass = vClass;
			if (vClass.includes(".")) {
				sClass = vClass.split(".").join("/");
			}

			return new Promise((resolve, reject) => {
				sap.ui.require([sClass], resolve, reject);
			});
		}
	});
});
