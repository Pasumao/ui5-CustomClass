sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";

    return Control.extend("Control.Base.CaseBase", {
        metadata: {
            defaultAggregation: "content",
            aggregations: {
                content: { type: "sap.ui.core.Control", multiple: true, default: true }
            }

        },

        renderer: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.openEnd();

            oRm.renderControl(oControl.getAggregation("content"));

            oRm.close("div");
        }

    });
});