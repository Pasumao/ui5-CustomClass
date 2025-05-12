sap.ui.define([
    "sap/ui/core/EventBus"
], function (
    EventBus
) {
    "use strict";

    /**
     * 这个文件是为了给fragment跳转控件的事件到controller准备的
     * @example
     * fragment部分
     * <c:FragmentDefinition xmlns:table="sap.ui.table"
            xmlns:data="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
            core:require="{handler: 'com/aspn/tools/ybcpi0080/controller/CC/Unit/FragmentEvent'}"> 导入这个文件
            <table:Table 
                rows="{file>/}"
                rowsUpdated="handler.event"   这里是固定调用event这个方法
                data:eventName="autoWidthTable">  这里要写调用的事件名
            </table:Table>
        </c:FragmentDefinition>

        controller部分
        this.EventBus.subscribe("fragment", "autoWidthTable", this.h(this.__autoWidthTable.bind(this))) 这里的方法要过一遍h方法
     */

    return {
        /**
         * 所有的事件统一走fragment频道
         * @param {sap.ui.base.Event} oEvent 事件对象
         */
        event(oEvent) {
            const eb = EventBus.getInstance();
            const oControl = oEvent.getSource();
            const sEventName = oControl.data("eventName");
            if (sEventName) {
                eb.publish("fragment", sEventName, oEvent);
            }
        },

        /**
         * 这是为了格式化方法，因为通过eventbus调用方法会传三个参数，频道，事件名，参数
         * 为了过滤掉前两个，这样和直接调用事件的结果就一样了
         * 这个方法在BaseController里有接入，所以可以直接使用
         * @param {Function} fn 
         * @returns 
         */
        h(fn) {
            return function (sChannelId, sEventId, oEvent) {
                fn.call(this, oEvent);
            }
        }
    }
});