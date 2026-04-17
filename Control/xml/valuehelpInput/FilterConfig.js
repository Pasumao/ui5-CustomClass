sap.ui.define([
    "sap/ui/core/Element"
], function (
    Element
) {
    "use strict";

    const RangeConfig = Element.extend("Control.xml.valuehelpInput.FilterConfig", {
        metadata: {
            properties: {
                key: { type: "string", defaultValue: null },
                value1: { type: "string", defaultValue: null },
                value2: { type: "string", defaultValue: null },
                operation: { type: "string", defaultValue: "EQ" },
            }
        }
    });

    RangeConfig.prototype._getFilterConfig = function () {
        const oProperties = {};
        oProperties.key = this.getKey();
        oProperties.value1 = this.getValue1();
        oProperties.value2 = this.getValue2();
        oProperties.operation = this.getOperation();

        return oProperties;
    }

    return RangeConfig;
});