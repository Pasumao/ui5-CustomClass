sap.ui.define([
    "sap/ui/core/Element"
], function (
    Element
) {
    "use strict";

    const ColumnConfig = Element.extend("Control.xml.valuehelpInput.ColumnConfig", {
        metadata: {
            properties: {
                key: { type: "string" },

                text: { type: "string" },

                /**
                 * 作用与Column
                 */
                autoResizable: { type: "boolean", defaultValue: true },

                /**
                 * 作用于FilterBar
                 */
                visibleInFilterBar: { type: "boolean", defaultValue: true },

                /**
                 * 作用于FilterBar
                 */
                hiddenFilter: { type: "boolean", defaultValue: false },
            }
        }
    });

    ColumnConfig.prototype._getColumnConfig = function () {
        const oProperties = {};
        oProperties.key = this.getKey();
        oProperties.text = this.getText();
        oProperties.visibleInFilterBar = this.getVisibleInFilterBar();
        oProperties.autoResizable = this.getAutoResizable();
        oProperties.hiddenFilter = this.getHiddenFilter();

        return oProperties;
    };

    return ColumnConfig;
});