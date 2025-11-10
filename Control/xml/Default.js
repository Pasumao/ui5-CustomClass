sap.ui.define([
    "../Base/CaseBase"
], function (
    CaseBase
) {
    "use strict";

    return CaseBase.extend("Control.xml.Default", {
        renderer: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.openEnd();
            const aContents = oControl.getAggregation("content")
            if (!aContents) return;
            aContents.forEach(element => {
                oRm.renderControl(element);
            });
            oRm.close("div");
        }
    });
});