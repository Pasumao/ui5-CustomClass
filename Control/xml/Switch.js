sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";

    return Control.extend("com.aspn.tools.ybcpi0010.controller.ui5-CustomClass.Control.xml.Switch", {
        metadata: {
            properties: {
                value: { type: "any" }
            },
            defaultAggregation: "content",
            aggregations: {
                content: { type: "sap.ui.core.Control", multiple: true, default: true }
            }

        }
    });
});