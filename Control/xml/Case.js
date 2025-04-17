sap.ui.define([
    "../Base/CaseBase"
], function (
    CaseBase
) {
    "use strict";

    return CaseBase.extend("Control.xml.Case", {
        metadata: {
            properties: {
                value: { type: "any" }
            },
            // defaultAggregation: "content",
            // aggregations: {
            //     content: { type: "sap.ui.core.Control", multiple: true }
            // }
        },

        renderer: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.openEnd();
            oRm.renderControl(oControl.getAggregation("content"));
            oRm.close("div");
        }
    });
});