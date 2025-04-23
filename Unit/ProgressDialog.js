sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/Dialog",
    "sap/m/ProgressIndicator",
    "sap/m/TextArea"
], function (
    baseObject,
    Dialog,
    ProgressIndicator,
    TextArea
) {
    "use strict";

    const ProgressDialog = baseObject.extend("Unit.ProgressDialog", {
        constructor: function () {
            this._oProgressIndicator = new ProgressIndicator({
                state: "Success",
                showValue: false
            }).addStyleClass("sapUiSmallMarginBottom");
            this._oTextArea = new TextArea({
                width: "100%",
                rows: 10,
                editable: false
            });
            this._oDialog = new Dialog({
                contentWidth: "30%",
                content: [
                    this._oProgressIndicator,
                    this._oTextArea
                ],
                endButton: new sap.m.Button({
                    text: "Close",
                    press: () => this.close()
                })
            }).addStyleClass("sapUiContentPadding")
            this._aCurrentTasks = [];
        }
    });

    ProgressDialog.prototype.log = function (sText) {
        const sTextArea = this._oTextArea
        let sValue = sTextArea.getValue();
        const time = new Date().toLocaleTimeString();
        if (!sValue) {
            sValue = sText;
        } else {
            sValue = "[Log][" + time + "]:" + sText + "\n" + sValue;
        }
        sTextArea.setValue(sValue);
    }

    ProgressDialog.prototype.error = function (sText) {
        const sTextArea = this._oTextArea
        let sValue = sTextArea.getValue();
        const time = new Date().toLocaleTimeString();
        if (!sValue) {
            sValue = sText;
        } else {
            sValue = "[Error][" + time + "]:" + sText + "\n" + sValue;
        }
        this._oProgressIndicator.setState("Error");
        this._setPercentValue(100);
        sTextArea.setValue(sValue);
    }

    ProgressDialog.prototype._setPercentValue = function (iValue) {
        this._oProgressIndicator.setPercentValue(iValue);
    }

    ProgressDialog.prototype.setTask = function (name, total = 1) {
        if (this._aCurrentTasks.some(task => task.name === name)) {
            //去掉原先的任务
            this._aCurrentTasks = this._aCurrentTasks.filter(task => task.name !== name);
        }

        this._aCurrentTasks.push({
            name: name,
            total: total,
            current: 0
        })

        this._setPercentValue(0); // 重置进度条
    };

    ProgressDialog.prototype.getAllWorkload = function () {
        return this._aCurrentTasks.reduce((acc, task) => acc + task.current, 0);
    };

    ProgressDialog.prototype.submitTask = function (name, increment = 1) {
        if (!this._aCurrentTasks.some(task => task.name === name)) {
            return;
        }

        const task = this._aCurrentTasks.find(task => task.name === name);
        task.current += increment;
        if (task.current >= task.total) {
            task.current = task.total;
        }
        this.refreshPercentValue();
    };

    ProgressDialog.prototype.refreshPercentValue = function () {
        const percent = Math.round((this.getAllWorkload() / this._aCurrentTasks.reduce((acc, task) => acc + task.total, 0)) * 100);
        this._setPercentValue(percent);
    };

    ProgressDialog.prototype.open = function () {
        this._oDialog.open();
    }

    ProgressDialog.prototype.close = function () {
        this._oDialog.close();
    }

    return ProgressDialog;
});