sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";

    const Switch = Control.extend("Control.xml.Switch", {
        metadata: {
            properties: {
                value: { type: "any" }
            },
            defaultAggregation: "content",
            aggregations: {
                content: { type: "Control.Base.CaseBase", multiple: true },
                cases: { type: "Control.xml.Case", multiple: true },
                default: { type: "Control.xml.Default", multiple: false }
            },
        },

        renderer: function (oRm, oControl) {
            oRm.openStart("div", oControl);
            oRm.openEnd();

            const aContents = oControl.getAggregation("content");
            if (!aContents) return;
            aContents.forEach((oCase) => {
                if (oCase.isA("Control.xml.Case")) {
                    oControl.addAggregation("cases", oCase);
                } else if (oCase.isA("Control.xml.Default")) {
                    oControl.setAggregation("default", oCase);
                }
            })

            const value = String(oControl.getValue())
            const aCases = oControl.getAggregation("cases");
            let renderControl = oControl.getAggregation("default");
            for (const oCase of aCases) {
                if (value === oCase.getValue()) {
                    renderControl = oCase;
                    break;
                }
            }

            oRm.renderControl(renderControl);

            oRm.close("div");
        }
    });

    return Switch;
});