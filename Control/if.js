sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";

    const ifControl = Control.extend("com.aspn.tools.ybcpi0040.controller.ui5-CustomClass.Control.if", {
        metadata: {
            properties: {
                condition: { type: "boolean", defaultValue: false }
            },
            defaultAggregation: "content",
            aggregations: {
                content: { type: "sap.ui.core.Control", multiple: true, default: true },
                t: { type: "sap.ui.core.Control", multiple: false },
                f: { type: "sap.ui.core.Control", multiple: false }
            }
        },

        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.openEnd();
                const content = oControl.getContent();
                if (content.length > 0) {
                    if (content.length === 1) {
                        oControl.setAggregation("t", content[0]);
                    } else if (content.length === 2) {
                        oControl.setAggregation("t", content[0]);
                        oControl.setAggregation("f", content[1]);
                    } else {
                        oControl.setAggregation("t", content[0]);
                        oControl.setAggregation("f", content.slice(1));
                    }
                }
                if (oControl.getCondition()) {
                    oRm.renderControl(oControl.getAggregation("t"));
                } else {
                    oRm.renderControl(oControl.getAggregation("f"));
                }
                oRm.close("div");
            }
        }
    });

    return ifControl;
});