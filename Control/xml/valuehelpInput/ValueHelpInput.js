sap.ui.define([
    "sap/m/Input",
    "sap/m/InputBaseRenderer",
    "./unit/_ValueHelpDialogUnit"
], function (
    Input,
    InputBaseRenderer,
    _ValueHelpDialogUnit
) {
    "use strict";

    const ValueHelpInput = Input.extend("Control.xml.valuehelpInput.ValueHelpInput", {
        metadata: {
            properties: {

                title: { type: "string", defaultValue: "" },


                /**
                 * jsonmodel的数据就指向这里
                 */
                tableData: { type: "object[]", defaultValue: [] },

                /**
                 * odatamodel的path但是不要写大括号用纯字符串
                 *
                 * @since 1.24
                 */
                odataPath: { type: "string", defaultValue: "" },

                showValueHelp: { type: "boolean", defaultValue: true },
                /**
                 * Defines the value for the basic search field. The value is set into the basic search field of the filter bar used.
                 *
                 * @since 1.24
                 */
                basicSearchText: { type: "string", defaultValue: "" },

                /**
                 * Defines the key of the column used for the internal key handling. The value of the column is used for the token key and also to
                 * identify the row in the table.
                 * **必须输入**
                 * @since 1.24
                 */
                key: { type: "string", defaultValue: "" },

                /**
                 * Defines the list of additional keys of the column used for the internal key handling.
                 * 特别说明，如果标注keys，则会在选中的token中增加两个customdata，
                 * 一个是row会返回选择的整行数据
                 * 一个是longKey会返回key对应的值
                 * @since 1.24
                 */
                keys: { type: "string[]", defaultValue: null },

                /**
                 * Defines the key of the column used for the token text.
                 *
                 * @since 1.24
                 */
                descriptionKey: { type: "string", defaultValue: "" },

                /**
                 * Defines the maximum number of conditions allowed to be added.
                 *
                 * @since 1.84.1
                 */
                maxConditions: { type: "string", defaultValue: '-1' },

                /**
                 * Represents the display format of the range values. With the <code>displayFormat</code> value UpperCase, the entered value of the
                 * range (condition) is converted to uppercase letters.
                 *
                 * @since 1.24
                 */
                displayFormat: { type: "string", defaultValue: "" },

                /**
                 * Represents how the item token text should be displayed in ValueHelpDialog. Use one of the valid
                 * <code>sap.ui.comp.smartfilterbar.DisplayBehaviour</code> values.
                 *
                 * @since 1.24
                 */
                tokenDisplayBehaviour: { type: "string", defaultValue: "" }
            },
            aggregations: {
                /**
                 * ValueHelp中表上的Column配置
                 */
                columns: { type: "Control.xml.valuehelpInput.ColumnConfig", multiple: true, bindable: true },
                /**
                 * ValueHelp中FilterBar上的Filter配置
                 */
                filters: { type: "Control.xml.valuehelpInput.FilterConfig", multiple: true, bindable: true },
            }
        },

        renderer: InputBaseRenderer
    });

    ValueHelpInput.prototype.init = function () {
        Input.prototype.init.apply(this, arguments);
    }

    ValueHelpInput.prototype.fireValueHelpRequest = async function () {
        const oProperties = await this._getVHProperties();
        this.setBusy(true);

        _ValueHelpDialogUnit.open(this, oProperties);

        setTimeout(() => {
            this.setBusy(false);
        }, 1000);
    }

    ValueHelpInput.prototype._getVHProperties = async function () {
        const oProperties = {};
        oProperties.supportMultiselect = false
        oProperties.supportRanges = false
        oProperties.supportRangesOnly = false
        oProperties.key = this.getKey();
        oProperties.keys = this.getKeys();
        oProperties.descriptionKey = this.getDescriptionKey();
        oProperties.basicSearchText = this.getBasicSearchText();
        oProperties.maxConditions = this.getMaxConditions();
        oProperties.displayFormat = this.getDisplayFormat();
        oProperties.tokenDisplayBehaviour = this.getTokenDisplayBehaviour();
        oProperties.title = this.getTitle();
        oProperties.tableData = await this._getTableDataString();

        oProperties.column = this.getColumns().map(column => {
            return column._getColumnConfig();
        });

        oProperties.filter = this.getFilters().map(filter => {
            return filter._getFilterConfig();
        });

        return oProperties;
    }

    ValueHelpInput.prototype._getTableDataString = async function () {
        const data = await this.getTableData();
        const result = data.map(obj => {
            const newObj = { ...obj };
            for (let key in newObj) {
                if (typeof newObj[key] === 'number') {
                    newObj[key] = String(newObj[key]);
                }
            }
            return newObj;
        });
        return result;
    }

    ValueHelpInput.prototype.getTableData = async function () {
        if (this.getOdataPath()) {
            return await this._getOData()
        }
        return this.getProperty("tableData")
    }

    ValueHelpInput.prototype._getOData = async function () {
        function getViewByControl(oControl) {
            var oParent = oControl;
            while (oParent && !(oParent instanceof sap.ui.core.mvc.View)) {
                oParent = oParent.getParent();
            }
            return oParent;
        }
        function parseSimpleBinding(text) {
            if (!text || typeof text !== 'string') {
                return { model: "", path: "" };
            }

            // 去除首尾空格（防止意外输入的空格干扰）
            const cleanText = text.trim();

            // 查找 '>' 分隔符
            const separatorIndex = cleanText.indexOf('>');

            if (separatorIndex === -1) {
                // 情况 2: 没有 '>'，全是路径，模型默认为空字符串
                return {
                    model: "",
                    path: cleanText
                };
            } else {
                // 情况 1: 有 '>'，分割模型和路径
                const model = cleanText.substring(0, separatorIndex);
                const path = cleanText.substring(separatorIndex + 1);

                return {
                    model: model,
                    path: path
                };
            }
        }
        const oView = getViewByControl(this);
        const oController = oView.getController();
        let { model, path } = parseSimpleBinding(this.getOdataPath());
        if (!model) {
            model = undefined
        }
        let oModel = oView.getModel(model)
        if (!oModel) {
            oModel = oController.getOwnerComponent().getModel(model)
        }
        if (oModel.isA("sap.ui.model.odata.v2.ODataModel")) {
            const fGetODatav2 = (aData = [], iSkip = 0) => {
                return new Promise((resolve, reject) => {
                    oModel.read(path, {
                        urlParameters: {
                            "$skip": iSkip,
                            "$format": "json",
                            "$top": "100" // 根据分页限制设置每次请求条目数
                        },
                        success: (oData, oResponse) => {
                            aData = aData.concat(oData.results);
                            if (oData.results.length === 100) {
                                iSkip += 100;
                                fGetODatav2(aData, iSkip).then(resolve, reject); // 继续请求下一页数据
                            } else {
                                resolve(aData);
                            }
                        },
                        error: (error) => {
                            if (error.statusCode === 200 && error.responseText) {
                                resolve(error.responseText);
                            }
                        }
                    });
                });
            };
            return await fGetODatav2();
        }
        else if (oModel.isA("sap.ui.model.odata.v4.ODataModel")) {
            const oBindList = oModel.bindList(path)
            const fGetODatav4 = (aData = [], iSkip = 0) => {
                return new Promise((resolve, reject) => {
                    oBindList.requestContexts(iSkip, 100).then(function (aContexts) {
                        aContexts.forEach(function (context) {
                            aData.push(context.getObject());
                        });
                        if (aContexts.length === 100) {
                            iSkip += 100;
                            fGetODatav4(aData, iSkip).then(resolve, reject);
                        } else {
                            resolve(aData);
                        }
                    });
                });
            };
            return await fGetODatav4();
        }
        return []
    }

    return ValueHelpInput;
});