sap.ui.define([
    "sap/m/MultiInput",
    "sap/m/MultiInputRenderer",
    "./unit/_ValueHelpDialogUnit",
    "sap/m/Label",
    "sap/m/Column",
    "sap/m/ColumnListItem"
], function (
    MultiInput,
    MultiInputRenderer,
    _ValueHelpDialogUnit,
    Label,
    Column,
    ColumnListItem
) {
    "use strict";

    const ValueHelpInput = MultiInput.extend("Control.xml.valuehelpInput.ValueHelpInput", {
        metadata: {
            properties: {

                title: { type: "string", defaultValue: "" },

                tableData: { type: "object", defaultValue: [] },

                showValueHelp: { type: "boolean", defaultValue: true },
                /**
                 * Defines the value for the basic search field. The value is set into the basic search field of the filter bar used.
                 *
                 * @since 1.24
                 */
                basicSearchText: { type: "string", defaultValue: "" },

                /**
                 * Enables multi-selection in the table used.
                 *
                 * @since 1.24
                 */
                supportMultiselect: { type: "boolean", defaultValue: true },

                /**
                 * Enables the ranges (conditions) feature in the dialog.
                 *
                 * @since 1.24
                 */
                supportRanges: { type: "boolean", defaultValue: false },

                /**
                 * If this property is set to <code>true</code>, the value help dialog only supports the ranges (conditions) feature.
                 *
                 * @since 1.24
                 */
                supportRangesOnly: { type: "boolean", defaultValue: false },

                /**
                 * Defines the key of the column used for the internal key handling. The value of the column is used for the token key and also to
                 * identify the row in the table.
                 *
                 * @since 1.24
                 */
                key: { type: "string", defaultValue: "" },

                /**
                 * Defines the list of additional keys of the column used for the internal key handling.
                 *
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
                 * ValueHelp中Range的配置
                 */
                ranges: { type: "Control.xml.valuehelpInput.RangeConfig", multiple: true, bindable: true }
            },
        },

        renderer: MultiInputRenderer
    });

    ValueHelpInput.prototype.init = function () {
        MultiInput.prototype.init.apply(this, arguments);
    }

    ValueHelpInput.prototype.fireValueHelpRequest = function () {
        const oProperties = this._getVHProperties();
        this.setBusy(true);

        _ValueHelpDialogUnit.open(this, oProperties);

        setTimeout(() => {
            this.setBusy(false);
        }, 1000);
    }

    ValueHelpInput.prototype._getVHProperties = function () {
        const oProperties = {};
        oProperties.supportMultiselect = this.getSupportMultiselect();
        oProperties.supportRanges = this.getSupportRanges();
        oProperties.supportRangesOnly = this.getSupportRangesOnly();
        oProperties.key = this.getKey();
        oProperties.keys = this.getKeys();
        oProperties.descriptionKey = this.getDescriptionKey();
        oProperties.basicSearchText = this.getBasicSearchText();
        oProperties.maxConditions = this.getMaxConditions();
        oProperties.displayFormat = this.getDisplayFormat();
        oProperties.tokenDisplayBehaviour = this.getTokenDisplayBehaviour();
        oProperties.title = this.getTitle();
        oProperties.tableData = this._getTableDataString();

        oProperties.range = this.getRanges().map(range => {
            return range._getRangeConfig();
        });

        oProperties.column = this.getColumns().map(column => {
            return column._getColumnConfig();
        });

        return oProperties;
    }

    ValueHelpInput.prototype._getTableDataString = function () {
        const data = this.getTableData();
        const result = data.map(obj => {
            const newObj = { ...obj }; // 创建浅拷贝，避免修改原数组
            for (let key in newObj) {
                if (typeof newObj[key] === 'number') {
                    newObj[key] = String(newObj[key]);
                }
            }
            return newObj;
        });
        return result;
    }

    // ValueHelpInput.prototype.setShowSuggestion = function (bShowSuggestion) {
    //     this.setProperty("showSuggestion", true);
    //     const aSuggestionColumns = this.getSuggestionColumns();
    //     if (aSuggestionColumns.length === 0 && bShowSuggestion) {
    //         this._setSuggestion()
    //     }
    // }

    // ValueHelpInput.prototype._setSuggestion = function () {
    //     const aColumnConfig = this.getColumns().map(column => {
    //         return column._getColumnConfig();
    //     });

    //     aColumnConfig.forEach((config) => {
    //         const oColumn = new Column({
    //             popinDisplay: "Inline",
    //             header: new Label({
    //                 text: config.text
    //             }),
    //         })
    //         this.addSuggestionColumn(oColumn)
    //     })

    //     const oColumnListItem = new ColumnListItem({
    //         cells: aColumnConfig.map((config) => {
    //             return new Label({
    //                 text: `{${config.key}`
    //             })
    //         })
    //     })
    //     this.addSuggestionRow(oColumnListItem)
    // }

    // ValueHelpInput.prototype.setTableData = function (data) {
    //     this.setProperty("tableData", data)
    //     const oBindingInfo = this.getBindingInfo("tableData")
    //     if (this.getSelectedItem()) {
    //         this.bindAggregation("suggestionItems", oBindingInfo)
    //     }
    // }

    return ValueHelpInput;
});