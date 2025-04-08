/* eslint-disable fiori-custom/sap-no-dom-insertion */
sap.ui.define([
    "sap/m/Menu"
], function (
    Menu
) {
    "use strict";

    const ContextMenu = Menu.extend("app.controller.Control.ContextMenu", {
        metadata: {
            properties: {
                active: { type: "boolean", defaultValue: false },
                parent: { type: "object" }
            }
        },

        init() {
            Menu.prototype.init.call(this);
            this.oDom = null;
            this._oSelectedControl = null;
        }
    });

    function target2Control(target) {
        var sId = target.id;
        var oControl = sap.ui.getCore().byId(sId);
        if (!oControl) {
            var oParent = target.parentElement;
            while (oParent && oParent.id) {
                oControl = sap.ui.getCore().byId(oParent.id);
                if (oControl) {
                    break;
                }
                oParent = oParent.parentElement;
            }
        }
        return oControl;
    }

    ContextMenu.prototype.openByContext = function (oEvent) {
        const target = oEvent.target;
        const parentId = this.getParent()?.getId();
        const parentDom = $("#" + parentId)[0];
        this._oSelectedControl = target2Control(target);

        if (this.oDom) {
            $(this.oDom).remove();
            this.oDom = null;
        }

        if (parentDom.contains(target)) {
            oEvent.preventDefault();
            this.oDom = $("<div></div>")
                .css({
                    position: "absolute",
                    top: oEvent.clientY + "px",
                    left: oEvent.clientX + "px",
                    width: "0",
                    height: "0",
                    opacity: "0"
                })
                .appendTo("body");

            //document.body.appendChild(this.oDom);
            this.openBy(this.oDom);
        }
    };

    ContextMenu.prototype.setActive = function (value) {
        this.setProperty("active", value);

        if (!this._boundOpenByContext) {
            // 绑定一次并保存引用
            this._boundOpenByContext = this.openByContext.bind(this);
        }

        if (value) {
            document.addEventListener("contextmenu", this._boundOpenByContext);
        } else {
            document.removeEventListener("contextmenu", this._boundOpenByContext)
        }
    };

    /**
     * @public
     * @returns {sap.ui.core.Control} control
     */
    ContextMenu.prototype.getSelectedControl = function () {
        return this._oSelectedControl;
    };

    return ContextMenu;
});