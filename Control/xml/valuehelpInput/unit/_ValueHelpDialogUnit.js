sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/m/SearchField",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/MultiInput",
    "sap/ui/model/FilterOperator",
    "sap/ui/table/library"
], function (
    BaseObject,
    Table,
    Column,
    Label,
    Text,
    Filter,
    UI5ValueHelpDialog,
    FilterBar,
    SearchField,
    FilterGroupItem,
    MultiInput,
    FilterOperator,
    tableLibrary
) {
    "use strict";

    const SelectionBehavior = tableLibrary.SelectionBehavior;
    const SelectionMode = tableLibrary.SelectionMode;

    /**
     * 一个控件会绑定一个valuehelpdialog实例
     * 每次选择完数据之后在控件上会有一个customdata叫vh
     * 里面是选择的数据，单选为那行数据，多选为选择的数据列表
     */

    /**
     * @namespace app.controller.func.ValueHelpDialog
     */

    /**
     * @class ValueHelpDialog
     * @extends sap.ui.base.Object
     */
    var ValueHelpDialog = BaseObject.extend("Control.xml.valuehelpInput.unit._ValueHelpDialogUnit", {
        /**
         * @constructor
         * @param {sap.ui.base.Event} oEvent oEvent
         * @param {object} oProperties oProperties
         */
        constructor: function (oControl, oProperties) {
            BaseObject.apply(this, arguments);
            this._oDialog = null;
            this._oProperties = {};
            this.setProperty(oProperties);
            /** @type {sap.m.InputBase} */
            this._oControl = oControl;
            this._bMultiControl = oControl.isA("sap.m.MultiInput");
            this._oTable = null;
        }
    });

    ValueHelpDialog.prototype.setProperty = function (oProperties) {
        const propr = JSON.parse(JSON.stringify(oProperties));
        // 检测是否有key，如果没有则报错
        if (!propr) {
            throw new Error("key is required in properties");
        }
        // 检测是否有title,如果没有则为key
        if (!propr.title) {
            propr.title = propr.key;
        }
        if (propr.supportRangesOnly) {
            propr.supportRanges = true;
        }
        // 检测是否为select_one模式
        if (propr.supportMultiselect === false) {
            if (!propr.table) propr.table = {}
            propr.table.selectionMode = SelectionMode.Single;
            propr.table.selectionBehavior = SelectionBehavior.RowOnly;
            if (!propr.supportRangesOnly) propr.supportRanges = false;
            propr.maxConditions = 1;
        }
        // 检测是否有range,如果supportRanges是true则初始化range
        if (propr.supportRanges && propr.range?.length === 0) {
            propr.range = [
                {
                    label: propr.key,
                    key: propr.key,
                    type: "string",
                    maxLength: 40
                }
            ];
        }
        // 如果range里没有key则默认为key
        if (propr.range) {
            propr.range.forEach(range => {
                if (!range.key) {
                    range.key = propr.key;
                }
            });
        }
        // 检测是否为仅Range模式
        if (propr.supportRangesOnly) {
            this._oProperties = propr
            return;
        }
        propr.supportRangesOnly = false;
        // 检测是否有filterBar,如果没有则为空对象
        if (!propr.filterBar) {
            propr.filterBar = {};
        }
        // 检测是否设置了baseSearchFields
        if (!propr.filterBar.baseSearchFields) {
            propr.filterBar.baseSearchFields = propr.column.map(column => column.key);
        }
        this._oProperties = propr
    };

    ValueHelpDialog.prototype.initDialog = function () {
        return new Promise((resolve, reject) => {
            const aColumnConfig = this._oProperties.column;

            this._oDialog = new UI5ValueHelpDialog({
                key: this._oProperties.key,
                title: this._oProperties.title,
                basicSearchText: this._oProperties.basicSearchText,
                supportMultiselect: this._oProperties.supportMultiselect,
                supportRanges: this._oProperties.supportRanges,
                supportRangesOnly: this._oProperties.supportRangesOnly,
                keys: this._oProperties.keys,
                descriptionKey: this._oProperties.descriptionKey,
                maxConditions: this._oProperties.maxConditions,
                displayFormat: this._oProperties.displayFormat,
                tokenDisplayBehaviour: this._oProperties.tokenDisplayBehaviour,
                ok: this._ok.bind(this),
                cancel: oEvent => this._oDialog.close()
            });

            if (this._oProperties.supportRanges) {
                this._setRange(this._oProperties.range);
            }

            this._setTokens();
            if (!this._oProperties.supportRangesOnly) {
                this._oTable = this._getTable(aColumnConfig);

                this._oDialog.setTable(this._oTable);

                const oFilterBar = this._getFilterBar(aColumnConfig)
                this._oDialog.setFilterBar(oFilterBar);

                let oData = { tableData: this._oProperties.tableData };
                this._oDialog.setModel(new sap.ui.model.json.JSONModel(oData));
                this._oDialog.update();

            }
            resolve();
        });
    };

    ValueHelpDialog.prototype._getTable = function (aColumnConfig) {
        return new Table({
            columns: aColumnConfig.map(({ text, key, autoResizable, visibleInTable }) => new Column({
                label: [
                    new Label({ text: text })
                ],
                autoResizable: autoResizable || true,
                visible: visibleInTable,
                template: [new Text({ text: `{${key}}` })]
            })
            ),
            rows: {
                path: "/tableData"
            }
        });
    };

    ValueHelpDialog.prototype._getFilterBar = function (aColumnConfig) {
        const oFilterBar = new FilterBar({
            basicSearch: new SearchField({
                search: oEvent => { this._oDialog.getFilterBar().fireSearch() },
                change: oEvent => { this._oDialog.getFilterBar().fireSearch() }
            }),
            filterGroupItems: aColumnConfig
                .map(({ text, key, visibleInFilterBar, hiddenFilter }) => {
                    return new FilterGroupItem({
                        name: key,
                        label: text,
                        groupName: "group1",
                        visibleInFilterBar: visibleInFilterBar || false,
                        hiddenFilter: hiddenFilter || false,
                        control: (() => {
                            var oMultiInput = new MultiInput({
                                showClearIcon: true,
                                valueHelpRequest: oEvent => ValueHelpDialog.open(oMultiInput, {
                                    supportRanges: true,
                                    supportRangesOnly: true,
                                    key: "range"
                                }),
                                tokenUpdate: oEvent => {
                                    setTimeout(() => {
                                        this._oDialog.getFilterBar().fireSearch()
                                    }, 0);
                                }
                            });
                            oMultiInput.addValidator(ValueHelpDialog._Validator("range"));
                            oMultiInput.setTokens(this._oProperties.filter?.filter(i => i.key === key)?.map(f => {
                                return new sap.m.Token({
                                    key: f.key,
                                    text: f.value1
                                }).data("range", {
                                    keyField: f.key,
                                    operation: f.operation,
                                    value1: f.value1,
                                    value2: f.value2
                                });
                            }))
                            return oMultiInput;
                        })()
                    });
                }),
            search: oEvent => {
                var aFilterItems = this._oDialog.getFilterBar().getFilterGroupItems();
                var filters = [];
                aFilterItems
                    .map(item => {
                        var itemcontrol = item.getControl();
                        if (itemcontrol.getTokens().length > 0) {
                            itemcontrol.getTokens().forEach(token => {
                                var oToken;
                                if (token.data("range")) {
                                    oToken = token;
                                } else {
                                    oToken = ValueHelpDialog._Validator(item.getName())({ text: token.getProperty("text") });
                                }
                                var sOperator, sValue1, sValue2;
                                if (oToken.data("range")) {
                                    sOperator = oToken.data("range").operation;
                                    sValue1 = oToken.data("range").value1;
                                    sValue2 = oToken.data("range").value2;
                                } else {
                                    sOperator = FilterOperator.EQ;
                                    sValue1 = oToken.getKey();
                                }

                                if (sOperator === "Empty") {
                                    var exclude = oToken.data("range").exclude;
                                    if (exclude) {
                                        filters.push(new Filter(item.getName(), "NE", ""));
                                    } else {
                                        filters.push(new Filter(item.getName(), "EQ", ""));
                                    }
                                } else {
                                    filters.push(new Filter(item.getName(), sOperator, sValue1, sValue2));
                                }
                            });
                        }
                    });
                var sSearchText = this._oDialog.getFilterBar().getBasicSearchValue();

                if (sSearchText) {
                    const baseFilters = this._oProperties.filterBar.baseSearchFields.map(f => {
                        return new Filter(f, FilterOperator.Contains, sSearchText)
                    })
                    filters.push(new Filter({
                        filters: baseFilters,
                        and: false
                    }));
                }

                var oDialogTable = this._oDialog.getTable();
                var oBinding = oDialogTable.getBinding("rows");
                oBinding.filter(filters);
            }
        })

        return oFilterBar
    }

    ValueHelpDialog._Validator = function (keyfield) {
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
    }

    ValueHelpDialog.prototype._setRange = function (aRangeData) {
        this._oDialog.setRangeKeyFields(
            aRangeData.map(range => {
                return range
            })
        );
    };

    ValueHelpDialog.prototype._setTokens = function () {
        this._oDialog.setTokens([]);
        if (this._bMultiControl) {
            const aTokens = this._oControl.getTokens()
            this._oDialog.setTokens(aTokens);
        } else {
            const sValue = this._oControl.getValue()
            if (sValue) {
                this._oDialog.setTokens([
                    new sap.m.Token({
                        key: sValue,
                        text: sValue
                    })
                ]);
            }
        }
    };

    ValueHelpDialog.prototype.openDialog = function () {
        this._oDialog.open();
    };

    ValueHelpDialog.prototype._ok = function (oEvent) {
        var aTokens = oEvent.getParameter("tokens");
        if (this._bMultiControl) {
            this._oControl.setTokens(aTokens)

            this._oControl.fireTokenUpdate();
        } else {
            const sValue = aTokens[0].data("row")[this._oProperties.key]
            this._oControl.setValue(sValue)
        }
        this._oDialog.close();
    };

    /**
     * @typedef {Object} Columns
     * @property {string} text - 열 제목입니다.
     * @property {string} key - 열 필드입니다.
     * @property {string} [other] - 其他参数都会放到sap.ui.table.Column里
     *
     * @typedef {Object} Filter
     * @property {string} key - key
     * @property {string} operator - operator
     * @property {string} value1 - value1
     * @property {string} [value2] - value2
     * 
     * @typedef {Object} Range
     * @property {string} keyField - columnKey
     * @property {string} [keylabel] - text
     * @property {string} keytype="string" - type
     * @property {sap.ui.model.Type} [keytypeInstance] - typeInstance
     * @property {string} keymaxLength="40" - maxLength
     * @property {object} [keyformatSettings] - formatSettings
     * @property {number} [keyscale] - scale
     * @property {number} [keyprecision] - precision
     * @property {boolean} [keyisDefault] - isDefault
     */

    /**
     * @static
     * @public
     * @description ValueHelpDialog方法入口
     * @param {sap.ui.core.Control} oControl - event
     * @param {object} oProperties - 需要填的参数
     * @param {string} oProperties.key - 表中选择的哪列作为输出
     * @param {string} [oProperties.title] - 弹窗标题
     * @param {object} [oProperties.table] - 表相关参数
     * @param {string} [oProperties.table.refresh] - model类型，jsonmodel或odatamodel
     * @param {string} [oProperties.table.modelName] - model的name，支持jsonmodel，odatamodel
     * @param {string} [oProperties.table.modelPath] - 路径
     * @param {(string|Columns)[]} [oProperties.table.columns] - 列的参数
     * @param {Filter[]} [oProperties.table.filters] - 拿数据时过滤器的参数
     * @param {object} [oProperties.filterBar] - 窗口filterbar的参数
     * @param {string[]} [oProperties.filterBar.baseSearchFields] - filterbar的baseSearch检索的字段
     * @param {Range} [oProperties.range] - range页面的参数
     * @deprecated
     */
    ValueHelpDialog.open = function (oControl, oProperties) {
        const oValueHelpDialog = new ValueHelpDialog(oControl, oProperties);
        oValueHelpDialog.initDialog().then(function () {
            oValueHelpDialog.openDialog();
            if (oProperties.filter) {
                oValueHelpDialog._oDialog.getFilterBar().fireSearch()
            }
        });
    };

    return ValueHelpDialog;
});