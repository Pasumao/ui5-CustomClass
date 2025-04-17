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
        },

        renderer: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.openEnd();
            oControl.getAggregation("content").forEach(element => {
                oRm.renderControl(element);
            });

            oRm.close("div");
        }
    });
});