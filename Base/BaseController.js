/* eslint-disable max-depth */
sap.ui.define([
    "./ModelController",
    "../Unit/ValueHelpDialog",
    "../Control/Debugger"
], function (
    Controller,
    ValueHelpDialog,
    Debugger) {
    "use strict";

    return Controller.extend("app.controller.Base.BaseController", {
        _bind() {           //绑定this的元素
            Controller.prototype._bind.apply(this, arguments);
            this.Router = this.getOwnerComponent().getRouter();
            this.EventBus = this.getOwnerComponent().getEventBus();
            this.EventLoop = [];
            // window.c = this;
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

        /**
         * valuehelp的调用方法，如果要处理数据可以照着写
         * @param {sap.ui.base.Event} oEvent oEvent
         */
        async onMultiInputValueHelpRequest(oEvent) {
            const oControl = oEvent.getSource();
            const oProperties = oControl.data("valuehelp");
            ValueHelpDialog.open(oEvent, JSON.parse(JSON.stringify(oProperties)), this);
            setTimeout(() => {
                oControl.setBusy(false);
            }, 5000);
        },

        /**
         * 自动调整列宽的方法，主要增加了对input类的支持，原生方法不支持input类的自动调整宽度
         * @public
         * @param {sap.ui.table.Table} oTable table控件实例
         */
        __autoWidthTable(oTable) {
            const aColumns = oTable.getColumns();

            aColumns.forEach(column => {
                column.autoResize();
                let sWight = column.getWidth();
                if (!column.getTemplate().getItems) {
                    return;
                }
                let aTemplates = column.getTemplate().getItems();
                let oTemplate = aTemplates[1];

                sWight = sWight.split("px")[0];
                sWight = Number(sWight);
                sWight += 20;

                if (oTemplate.mAggregations._endIcon) { sWight += 32; }
                if (sWight > 300) { sWight = 300; }

                sWight = String(sWight) + "px";
                column.setWidth(sWight);
            });
        },

        /**
         * @param {sap.ui.base.Event} oEvent oEvent
         */
        smartvaluehelp(oEvent) {
            const Control = oEvent.getSource();

            const oData = Control.data("valuehelp");

            this._processObject(oData, oEvent);

            const modelname = oData?.modelname;
            const modelpath = oData?.modelpath;
            const filters = oData?.filterlist || [];
            this.fieldlist = oData?.dialog;

            this.getmodeldata(modelname, modelpath, filters.map(f => new sap.ui.model.Filter(f.fieldname, f.operator, f.value))).then((aData) => {
                if (!aData || !Array.isArray(aData)) {
                    console.error("[ERROR] No data retrieved or data format is incorrect.");
                    return;
                }
                // 对获取的数据进行去重处理
                var aUniqueData = this.removeDuplicates(aData, this.fieldlist.title);

                // 创建一个临时模型来保存去重后的数据
                var oUniqueModel = new sap.ui.model.json.JSONModel();
                oUniqueModel.setData({ items: aUniqueData });

                var Dialog = new sap.m.SelectDialog({
                    title: "SelectDialog",
                    contentHeight: "40%",
                    items: {
                        path: "/items",
                        //sorter: new sap.ui.model.Sorter(keyfiled, false),
                        template: new sap.m.StandardListItem({
                            title: "{" + this.fieldlist.title + "}",
                            description: this.fieldlist.description ? "{" + this.fieldlist.description + "}" : null,
                            type: "Active"
                        })
                    },
                    liveChange: (oEvent) => {
                        var sValue = oEvent.getParameter("value");
                        var oFilter = sValue ?
                            new sap.ui.model.Filter(this.fieldlist.title, sap.ui.model.FilterOperator.Contains, sValue) :
                            [];
                        oEvent.getSource().getBinding("items").filter(oFilter);
                    },
                    confirm: (oEvent) => {
                        var oModel = this.getmodel(modelname);
                        var oSelectedItem = oEvent.getParameter("selectedItem");
                        if (this.keymodel && this.keyfield) {
                            oModel.setProperty(this.keymodel + "/" + this.keyfield, oSelectedItem.getTitle());
                        } else {
                            Control.setValue(oSelectedItem.getTitle());
                        }
                        Control.fireChange();
                    }
                });

                var sResponsiveStyleClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
                Dialog.toggleStyleClass(sResponsiveStyleClasses, true);
                Dialog.setResizable(true);
                Dialog.setDraggable(true);

                Dialog.setModel(oUniqueModel);

                Dialog.open();
            }).catch((oError) => {
                console.error("Error retrieving data for value help:", oError);
            });
        },

        /**
         * 去重
         * @param {Array} dataArray 模型名称
         * @param {string} key 模型路径
         * @returns {Array} 去重后的数组
         */
        removeDuplicates: function (dataArray, key) {
            if (!key) { return dataArray; } // 如果没有key，不进行去重
            const uniqueKeys = new Set();
            return dataArray.filter(item => {
                const value = item[key];
                if (value === null || uniqueKeys.has(value)) {
                    return false;
                }
                uniqueKeys.add(value);
                return true;
            });
        },

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
         * @param {object} aFiledCatalog 设置参数
         * @param {string} aFiledCatalog.title 设置标题
         * @param {object[]} aFiledCatalog.fieldlist 设置字段列表
         * @param {string} aFiledCatalog.fieldlist.key 设置字段名称
         * @param {string} aFiledCatalog.fieldlist.label 设置字段显示名称
         * @param {boolean} aFiledCatalog.fieldlist.isKey 设置字段显示名称
         * @param {sap.m.InputBase} aFiledCatalog.fieldlist.control 设置字段控件
         * @returns {object} 返回输入的参数
         */
        getvaluedialog(aFiledCatalog) {
            var oView = this.getView();

            return new Promise((resolve, reject) => {
                const oDialog = new sap.m.Dialog({
                    title: aFiledCatalog.title,
                    draggable: true,
                    resizable: true,
                    beginButton: new sap.m.Button({
                        text: "OK",
                        type: sap.m.ButtonType.Emphasized,
                        press: async () => {
                            aFiledCatalog.fieldlist.forEach(field => {
                                var sValue = field.control.getValue();

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
                            });

                            var oData = {};
                            aFiledCatalog.fieldlist.forEach(field => {
                                oData[field.key] = field.control.getValue().trim();
                            });

                            if (aFiledCatalog.fieldlist.some(field => field.isKey && !field.control.getValue())) {
                                return;
                            }

                            oDialog.close();
                            resolve(oData);
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "cancel",
                        press: () => {
                            oDialog.close();
                            reject();
                        }
                    }),
                    content: aFiledCatalog.fieldlist.map(field => {
                        return new sap.m.HBox({
                            alignContent: "Center",
                            alignItems: "Center",
                            justifyContent: "Center",
                            items: [
                                new sap.m.Label({
                                    width: "10rem",
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
         * @param {object} oProperty oProperty
         * @param {string} oProperty.title title
         * @param {string} oProperty.text content text
         * @returns {Promise} oDialog
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
                            resolve("OK");
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "cancel",
                        press: () => {
                            oDialog.close();
                            reject("CANCEL");
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
