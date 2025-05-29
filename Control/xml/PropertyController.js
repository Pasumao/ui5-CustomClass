sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";

    const PropertyController = Control.extend("Control.xml.PropertyController", {
        metadata: {
            properties: {
                value: { type: "string", bindable: "bindable" },
                changeProperty: { type: "string", defaultValue: "enabled" },
                listen: { type: "string", bindable: "bindable" },
                negate: { type: "boolean", defaultValue: false },
                gridTableId: { type: "sap.ui.core.ID" }
            }
        },

        init() {
            this._Control = null;
            const maxWaitTime = 10000; // 最大等待时间（毫秒）
            const intervalTime = 100; // 检查间隔时间（毫秒）

            let intervalId = null;
            let timeoutId = null;

            const tryGetTable = () => {
                const oTable = this._getTable(this.getGridTableId());
                if (oTable) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);

                    // 绑定事件
                    oTable.attachRowSelectionChange(this._onTableEvent.bind(this));
                }
            };

            intervalId = setInterval(tryGetTable, intervalTime);

            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
            }, maxWaitTime);
        }
    });

    /**
     * 获取表格
     * @param {sap.ui.core.ID} sId 表格ID
     * @returns {sap.ui.table.Table} 表格实例
     */
    PropertyController.prototype._getTable = function (sId) {
        let oParent = this.getParent();
        let oView = null;

        // 一路向上查找 view
        while (oParent) {
            if (oParent.isA("sap.ui.core.mvc.View")) {
                oView = oParent;
                break;
            }
            oParent = oParent.getParent();
        }

        if (oView) {
            return oView.byId(sId);
        }

        return null;
    }

    PropertyController.prototype.setListen = function (sValue) {
        this._getControl();
        this.setProperty("listen", sValue);
        this._CheckValue();
    }

    PropertyController.prototype.setValue = function (sValue) {
        this._getControl();
        this.setProperty("value", sValue);
        this._CheckValue();
    }

    PropertyController.prototype._onTableEvent = function (oEvent) {
        this._getControl();
        const aIndices = oEvent.getSource().getSelectedIndices()
        const bEnable = aIndices.length > 0;
        if (this.getNegate()) {
            this._Control.setProperty(this.getChangeProperty(), !bEnable);
        } else {
            this._Control.setProperty(this.getChangeProperty(), bEnable);
        }
    }

    PropertyController.prototype._getControl = function () {
        if (!this._Control) {
            this._Control = this.getParent();
        }
    }

    PropertyController.prototype._CheckValue = function () {
        const value = this.getValue();
        const listen = this.getListen();

        if (!this._Control) {
            return;
        }

        if (typeof value === "object") {
            this._Control.setProperty(this.getChangeProperty(), value[listen]);
        } else {
            if (this.getNegate()) {
                this._Control.setProperty(this.getChangeProperty(), value !== listen);
            } else {
                this._Control.setProperty(this.getChangeProperty(), value === listen);
            }
        }
    }

    return PropertyController;
});