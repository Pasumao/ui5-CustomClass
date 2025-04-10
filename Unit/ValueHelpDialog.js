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
    "sap/m/Token",
    "sap/ui/table/library",
    "sap/ui/model/odata/type/DateTime",
    "sap/ui/model/odata/type/String"
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
    Token,
    tableLibrary,
    DateTime,
    String
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

    const aVALUEHELPDIALOG_FILTER_KEYS = [
        "table",    //ValueHelpDialog中的table属性的属性，继承sap.ui.table.Table的属性
        "range",    //ValueHelpDialog的range相关属性
        "select_one"//是否开启单选模式(单选模式下只能选择一行,但是是多选模式，适用于MultiInput)
        //一旦打开单选模式则会自动设置如下属性
        //table.selectionMode = sap.ui.table.SelectionMode.Single;
        //table.selectionBehavior = sap.ui.table.SelectionBehavior.RowOnly;
        //supportMultiselect = true;
        //maxConditions = 1;
    ];

    const aTABLE_FILTER_KEYS = [
        "modelName", //table的数据来源，模型，支持JSONmodel，ODataModel v2 v4
        "modelPath", //数据的路径
        "filters",   //数据的过滤条件，支持解析{modelname>/modelpath}格式来动态变化
        "columns"    //table的columns配置，继承sap.ui.table.Column的属性
    ];

    /**
     * @class ValueHelpDialog
     * @extends sap.ui.base.Object
     */
    var ValueHelpDialog = BaseObject.extend("./Unit.ValueHelpDialog", {
        /**
         * @constructor
         * @param {sap.ui.base.Event} oEvent oEvent
         * @param {ModelController} oController oController
         */
        constructor: function (oEvent, oController) {
            BaseObject.apply(this, arguments);
            this._oEvent = oEvent;
            this._oDialog = null;
            this._oProperties = {};
            /** @type {sap.m.MultiInput|sap.m.Input} */
            this._oControl = this._oEvent.getSource();
            const sControlType = this._oControl.getMetadata().getName();
            if (sControlType === "sap.m.Input") {
                this._mode = "single";
            }
            this._oController = oController;
        }
    });

    function isArrayOfType(arr, typeCheck) {
        return Array.isArray(arr) && arr.every(typeCheck);
    }

    function isStringArray(arr) {
        return isArrayOfType(arr, item => typeof item === "string");
    }

    /**
     * @param {object} obj object
     * @param {string[]} filter - 要过滤的key
     * @returns {object} 返回一个没有对应key的新对象
     */
    function objfilter(obj, filter) {
        let newobj = JSON.parse(JSON.stringify(obj));
        filter.forEach(f => {
            delete newobj[f];
        });
        return newobj;
    }

    ValueHelpDialog.prototype.setProperty = function (oProperties) {
        this._oProperties = oProperties;
        // 检测是否有key，如果没有则报错
        if (!this._oProperties.key) {
            throw new Error("key is required in properties");
        }
        // 检测是否有title,如果没有则为key
        if (!this._oProperties.title) {
            this._oProperties.title = this._oProperties.key;
        }
        //检测控件是否为单选控件
        if (this._mode === "single") {
            this._oProperties.supportMultiselect = false;
        }
        // 检测是否为select_one模式
        if (this._oProperties.select_one) {
            this._oProperties.table.selectionMode = SelectionMode.Single;
            this._oProperties.table.selectionBehavior = SelectionBehavior.RowOnly;
            this._oProperties.supportMultiselect = true;
            this._oProperties.maxConditions = 1;
            this._mode = "single";
        }
        // 检测是否有range,如果supportRanges是true则初始化range
        if (this._oProperties.supportRanges && !this._oProperties.range) {
            this._oProperties.range = [
                {
                    label: this._oProperties.key,
                    key: this._oProperties.key,
                    type: "string",
                    maxLength: 40
                }
            ];
        }
        // 如果range里没有key则默认为key
        if (this._oProperties.range) {
            this._oProperties.range.forEach(range => {
                if (!range.key) {
                    range.key = this._oProperties.key;
                }
            });
        }
        // 检测是否为仅Range模式
        if (this._oProperties.supportRangesOnly) {
            return;
        }
        this._oProperties.supportRangesOnly = false;
        // 检测是否有filterBar,如果没有则为空对象
        if (!this._oProperties.filterBar) {
            this._oProperties.filterBar = {};
        }
        // 检测是否有table,如果没有则报错
        if (!this._oProperties.table) {
            throw new Error("table is required in properties");
        }
        // 检测是否有modelPath,如果没有则报错, modelName可以为空字符串但不可以是无
        if ((!this._oProperties.table.modelName && this._oProperties.table.modelName !== "") || !this._oProperties.table.modelPath) {
            throw new Error("modelName and modelPath are required in properties.table");
        }
        // 检测是否有columns,如果没有则默认为key
        if (!this._oProperties.table.columns) {
            this._oProperties.table.columns = [this._oProperties.key];
        }
        // 检测是否有filters,如果没有则为空数组
        if (!this._oProperties.table.filters) {
            this._oProperties.table.filters = [];
        }
        //如果columns是字符串数组则转换为对象数组
        if (isStringArray(oProperties.table.columns)) {
            this._oProperties.table.columns = oProperties.table.columns.map(column => {
                return { text: column, key: column };
            });
        }
    };

    ValueHelpDialog.prototype.initDialog = function () {
        return new Promise((resolve, reject) => {
            const oTableData = this._oProperties.table;
            const sKey = this._oProperties?.key;

            this._oDialog = new UI5ValueHelpDialog({
                ok: this._mode === "single" ? this._singleok.bind(this) : this._multiok.bind(this),
                cancel: oEvent => this._oDialog.close(),
                ...objfilter(this._oProperties, aVALUEHELPDIALOG_FILTER_KEYS)
            });

            if (this._oProperties.supportRanges) {
                this._setRange(this._oProperties.range);
            }

            if (!this._oProperties.supportRangesOnly) {
                this._oTable = this._getTable(oTableData);

                this._oDialog.setTable(this._oTable);
                const valueHelpMethod = this._mode === "single"
                    ? this._singleValueHelp
                    : this._multiValueHelp;
                valueHelpMethod.call(this, this._oTable);

                this._oDialog.setFilterBar(new FilterBar({
                    ...this._oProperties.filterBar,
                    basicSearch: new SearchField({
                        search: oEvent => {
                            this._oDialog.getFilterBar().fireSearch();
                        }
                    }),
                    filterGroupItems: oTableData.columns
                        // .filter(column => column.key!= sKey)
                        .map(({ text, key, visibleInFilterBar, ...config }) => {
                            return new FilterGroupItem({
                                name: key,
                                label: text,
                                groupName: "group1",
                                visibleInFilterBar: visibleInFilterBar || false,
                                control: (() => {
                                    var oMultiInput = new MultiInput({
                                        showClearIcon: true,
                                        valueHelpRequest: oEvent => ValueHelpDialog.open(oEvent, {
                                            supportRanges: true,
                                            supportRangesOnly: true,
                                            key: "range"
                                        })
                                    });
                                    oMultiInput.addValidator(this._oController.Validator("range"));
                                    return oMultiInput;
                                })()
                            });
                        }),
                    search: oEvent => {
                        var aFilterItems = this._oDialog.getFilterBar().getFilterGroupItems();
                        var filters = [];
                        aFilterItems
                            // .filter(item => item.getName()!= sKey)
                            .map(item => {
                                var itemcontrol = item.getControl();
                                if (itemcontrol.getTokens().length > 0) {
                                    itemcontrol.getTokens().forEach(token => {
                                        var oToken;
                                        if (token.data("range")) {
                                            oToken = token;
                                        } else {
                                            oToken = this._oController.Validator(item.getName())({ text: token.getProperty("text") });
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
                            filters.push(new Filter(sKey, FilterOperator.Contains, sSearchText));
                        }

                        var oDialogTable = this._oDialog.getTable();
                        var oBinding = oDialogTable.getBinding("rows");
                        oBinding.filter(filters);
                    }
                }));

                var filter = oTableData?.filters?.map(f => new Filter(f.fieldname, f.operator, f.value));
                this._oController.getmodeldata(oTableData.modelName, oTableData.modelPath, filter).then(aData => {
                    let oData = { tabledata: aData };
                    this._oDialog.setModel(new sap.ui.model.json.JSONModel(oData));
                    this._oDialog.update();
                    resolve();
                });
            } else {
                resolve();
            }
        });
    };

    ValueHelpDialog.prototype._getTable = function (oTableData) {
        return new Table({
            ...objfilter(oTableData, aTABLE_FILTER_KEYS),
            columns: oTableData.columns.map(({ text, key, visibleInFilterBar, ...config }) => new Column({
                ...config,
                label: [
                    new Label({ text: text })
                ],
                template: [new Text({ text: `{${key}}` })]
            })
            ),
            rows: {
                path: "/tabledata"
            }
        });
    };

    ValueHelpDialog.prototype._setRange = function (aRangeData) {
        this._oDialog.setRangeKeyFields(
            aRangeData.map(range => {
                var oType;
                switch (range.type) {
                    case "Edm.DateTime":
                        oType = new DateTime({
                            pattern: "yyyy-MM-dd HH:mm:ss",
                            UTC: true
                        }, { displayFormat: "yyyy-MM-dd HH:mm:ss" });
                        break;
                    case "Edm.Date":
                        oType = new DateTime({
                            pattern: "yyyy-MM-dd",
                            UTC: true
                        }, { displayFormat: "yyyy-MM-dd" });
                        break;
                    default:
                        oType = new String({}, { maxLength: range.maxLength || 40 });
                        break;
                }
                return {
                    key: range.key || this._oProperties.key,
                    label: range.label || range.key,
                    type: "string",
                    typeInstance: oType
                };
            })
        );
    };

    ValueHelpDialog.prototype._singleValueHelp = function (oTable) {
        if (oTable) {
            oTable.setSelectionMode(SelectionMode.Single);
            oTable.setSelectionBehavior(SelectionBehavior.RowOnly);
        }

        const sValue = this._oControl.getValue();

        if (sValue) {
            this._oDialog.setTokens([new Token({
                key: sValue,
                text: sValue
            })]);
        }
    };

    ValueHelpDialog.prototype._multiValueHelp = function (oTable) {
        if (this._oProperties.maxConditions === 1) {
            oTable.setSelectionMode(this._oProperties.table.selectionMode || SelectionMode.Single);
            oTable.setSelectionBehavior(this._oProperties.table.selectionBehavior || SelectionBehavior.RowOnly);
            this._oDialog.attachSelectionChange(oEvent => {
                var sIndex = oEvent.getParameter("tableSelectionParams").rowIndex;
                var oRow = oTable.getContextByIndex(sIndex).getObject();
                var sValue = oRow[this._oProperties.key];
                var aIndices = oTable.getSelectedIndices();

                this._oDialog.setTokens([]);
                if (aIndices.length === 0) {
                    return;
                }
                this._oDialog.setTokens([
                    new Token({
                        key: sValue,
                        text: "=" + sValue
                    }).data("range", {
                        exclude: false,
                        operation: "EQ",
                        keyField: this._oProperties.key,
                        value1: sValue,
                        value2: null
                    })
                ]);
            });
        }

        this._oDialog.setTokens(this._oControl.getTokens());
    };

    ValueHelpDialog.prototype.openDialog = function () {
        this._oDialog.open();
    };

    ValueHelpDialog.prototype._singleok = function (oEvent) {
        const aTokens = oEvent.getParameter("tokens");

        const nSelected = this._oTable.getSelectedIndices();
        if (nSelected.length !== 0) {
            const oRow = this._oDialog.getModel().getProperty("/tabledata/" + nSelected[0]);
            this._oControl.data("vh", oRow);
        }

        if (aTokens.length === 0) {
            this._oControl.setValue("");
        } else {
            this._oControl.setValue(aTokens[0].getKey());
        }

        if (this._oControl.isA("sap.m.MultiInput")) {
            this._oControl.fireTokenUpdate();
        } else if (this._oControl.isA("sap.m.Input")) {
            this._oControl.fireChange();
        }
        this._oDialog.close();
    };

    ValueHelpDialog.prototype._multiok = function (oEvent) {
        var aTokens = oEvent.getParameter("tokens");

        const aSelecteds = this._oTable.getSelectedIndices();
        const aSelectedRows = aSelecteds.map(i => this._oDialog.getModel().getProperty("/tabledata/" + i));
        this._oControl.data("vh", aSelectedRows);

        this._oControl.setTokens(aTokens.map(token => {
            if (token.data("range")) {
                // eslint-disable-next-line fiori-custom/sap-no-ui5base-prop
                return token.setProperty("text", token.mAggregations.tooltip)
                    .setProperty("key", token.data("range").value1);    //toUTCString()
            } else {
                return token.setProperty("text", "=" + token.getProperty("key"));
            }
        }));

        if (this._oControl.isA("sap.m.MultiInput")) {
            this._oControl.fireTokenUpdate();
        } else if (this._oControl.isA("sap.m.Input")) {
            this._oControl.fireChange();
        }
        this._oDialog.close();
    };

    /**
     * @typedef {Object} Columns
     * @property {string} text - 열 제목입니다.
     * @property {string} key - 열 필드입니다.
     * @property {string} [other] - 추가적인 속성입니다.
     *
     * @typedef {Object} Filter
     * @property {string} key - 필드 이름입니다.
     * @property {string} operator - 연산자입니다.
     * @property {string} value1 - 첫 번째 값입니다.
     * @property {string} [value2] - 두 번째 값입니다.
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
     * @param {sap.ui.base.Event} oEvent - event
     * @param {object} oProperties - 需要填的参数
     * @param {string} oProperties.key - 表中选择的哪列作为输出
     * @param {string} [oProperties.title] - 弹窗标题
     * @param {object} oProperties.table - 表相关参数
     * @param {string} oProperties.table.modelName - model的name，支持jsonmodel，odatamodel
     * @param {string} oProperties.table.modelPath - 路径
     * @param {(string|Columns)[]} [oProperties.table.columns] - 列的参数
     * @param {Filter[]} [oProperties.table.filters] - 拿数据时过滤器的参数
     * @param {object} [oProperties.filterBar] - 窗口filterbar的参数
     * @param {Range} [oProperties.range] - range页面的参数
     * @param {sap.ui.core.mvc.Controller} oController controller
     */
    ValueHelpDialog.open = function (oEvent, oProperties, oController) {
        const oControl = oEvent.getSource();
        const oVH = oControl._oValueHelpDialog;
        if (oVH) {
            oVH.openDialog();
        } else {
            var oValueHelpDialog = new ValueHelpDialog(oEvent, oController);
            oValueHelpDialog._oControl.setBusy(true);
            oController._processObject(oProperties, oEvent);
            oValueHelpDialog.setProperty(oProperties);
            oValueHelpDialog.initDialog().then(function () {
                oValueHelpDialog._oControl.setBusy(false);
            }).finally(function () {
                oControl._oValueHelpDialog = oValueHelpDialog;
                oValueHelpDialog.openDialog();
            });
        }
    };

    return ValueHelpDialog;
});