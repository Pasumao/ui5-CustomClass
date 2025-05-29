sap.ui.define([
    "sap/ui/core/Control"
], function (
    Control
) {
    "use strict";

    const PropertyController = Control.extend("Control.xml.PropertyController", {
        metadata: {
            properties: {

                /** 
                 * 绑定的值
                 * @type {string | object}
                 * 如果绑定的值为对象，则使用对象中的指定属性进行判断
                 * 如果是字符串，则使用字符串进行判断
                 */
                value: { type: "string", bindable: "bindable" },

                /** 
                 * 改变的控件参数
                 * @type {string} 参考文档中的控件Properties
                 */
                changeProperty: { type: "string", defaultValue: "enabled" },

                /** 
                 * 监听的属性
                 * @type {string}
                 */
                listen: { type: "string", bindable: "bindable" },

                /** 
                 * 值是否取反
                 * @type {boolean}
                 * 默认为如果监听值和value取等则设置为正
                 */
                negate: { type: "boolean", defaultValue: false },

                /** 
                 * 绑定的sap.ui.table.Table控件的ID
                 * @type {sap.ui.core.ID}
                 * 如果绑定table会根据是否选中行输出true和false，支持取反
                 * 选定table会给table控件添加事件
                 */
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
     * 获取table控件
     * @private
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