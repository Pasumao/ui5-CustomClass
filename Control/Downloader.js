sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/core/StaticArea"
], function (
    Control,
    StaticArea
) {
    "use strict";

    return Control.extend("com.aspn.tools.ybcpi0040.controller.Control.Downloader", {
        metadata: {
            properties: {
                url: { type: "string", defaultValue: "" }
            }
        },

        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("iframe", oControl);
                oRm.attr("src", oControl.getUrl());
                oRm.attr("style", "display:none");
                oRm.openEnd();
                oRm.close("iframe");
            }
        },

        download: function (sUrl) {
            this.setUrl(sUrl);
            var oStaticUIArea = StaticArea.getDomRef();

            this.placeAt(oStaticUIArea);
        }
    });
});