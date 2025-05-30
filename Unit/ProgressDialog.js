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
        /**
         * 
         * @param {object} oParameters 初始化参数
         * @param {string} [oParameters.title] 标题
         * @param {AbortController} [oParameters.abortController] Abortcontroller
         * @param {string} [oParameters.dialogWidth] Dialog宽度 默认为"30%"
         * @param {sap.ui.core.Control} [oParameters.content] 内容
         * @param {sap.m.Button[]} [oParameters.buttons] 按钮
         * @param {sap.m.Button} [oParameters.endButton] endButton
         * @param {sap.m.Button} [oParameters.beginButton] beginButton
         */
        constructor: function (oParameters) {
            this._oProgressIndicator = new ProgressIndicator({
                state: "Success",
                showValue: false
            }).addStyleClass("sapUiSmallMarginBottom");
            this._oTextArea = new TextArea({
                width: "100%",
                rows: 10,
                editable: false
            });
            this._content = oParameters ? oParameters.content : null;

            this._abortController = oParameters ? oParameters.abortController : null;

            this._oDialog = new Dialog({
                contentWidth: oParameters ? oParameters.dialogWidth || "30%" : "30%",
                title: oParameters ? oParameters.title || "Dialog" : "Dialog",
                content: [
                    this._oProgressIndicator,
                    this._content,
                    this._oTextArea
                ],
                buttons: this._getButtons(oParameters)
            }).addStyleClass("sapUiContentPadding")
            this._aCurrentTasks = [];
        }
    });

    ProgressDialog.prototype._getButtons = function (oParameters) {
        const aButtons = [];
        if (oParameters) {
            if (oParameters.buttons) {
                let endButton = oParameters.buttons.find(i => i.data("defaultEndButton"))
                if (endButton) {
                    endButton.attachPress(() => {
                        if (this._abortController) {
                            this._abortController.abort();
                        }
                        this.close();
                    });
                }
                aButtons.push(...oParameters.buttons);
            } else {
                if (oParameters.beginButton) {
                    aButtons.push(oParameters.endButton);
                }
                if (oParameters.endButton) {
                    aButtons.push(oParameters.endButton);
                } else {
                    const endButton = ProgressDialog.getEndButton()
                    endButton.attachPress(() => {
                        if (this._abortController) {
                            this._abortController.abort();
                        }
                        this.close();
                    });
                    aButtons.push(endButton);
                }
            }
        }
        return aButtons;
    }

    /**
     * 输出日志
     * @param {string} sText 日志内容
     */
    ProgressDialog.prototype.log = function (sText) {
        const sTextArea = this._oTextArea
        let sValue = sTextArea.getValue();
        const time = new Date().toLocaleTimeString();
        if (!sValue) {
            sValue = "[Log][" + time + "]:" + sText;
        } else {
            sValue = "[Log][" + time + "]:" + sText + "\n" + sValue;
        }
        sTextArea.setValue(sValue);
    }

    ProgressDialog.getEndButton = function () {
        const defultEndButton = new sap.m.Button({
            text: "Close"
        });
        defultEndButton.data("defaultEndButton", true);
        return defultEndButton;
    }

    /**
     * 输出错误日志
     * @param {string} sText 日志内容
     */
    ProgressDialog.prototype.error = function (sText) {
        const sTextArea = this._oTextArea
        let sValue = sTextArea.getValue();
        const time = new Date().toLocaleTimeString();
        if (!sValue) {
            sValue = "[Error][" + time + "]:" + sText;
        } else {
            sValue = "[Error][" + time + "]:" + sText + "\n" + sValue;
        }
        this._oProgressIndicator.setState("Error");
        this._setPercentValue(100);
        sTextArea.setValue(sValue);
    }

    /**
     * 设置进度条
     * @param {number} iValue 进度百分比
     */
    ProgressDialog.prototype._setPercentValue = function (iValue) {
        this._oProgressIndicator.setPercentValue(iValue);
    }

    /**
     * 设置任务
     * @param {string} name 任务名称
     * @param {number} [total] 任务总数
     */
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

    /**
     * 获取所有任务的总工作量
     * @returns {number} 总工作量
     */
    ProgressDialog.prototype._getAllWorkload = function () {
        return this._aCurrentTasks.reduce((acc, task) => acc + task.current, 0);
    };

    /**
     * 提交任务
     * @param {string} name 任务名称
     * @param {number} [increment] 增量
     */
    ProgressDialog.prototype.submitTask = function (name, increment = 1) {
        if (!this._aCurrentTasks.some(task => task.name === name)) {
            return;
        }

        const task = this._aCurrentTasks.find(task => task.name === name);
        task.current += increment;
        if (task.current >= task.total) {
            task.current = task.total;
        }
        this._refreshPercentValue();
    };

    /**
     * 刷新进度条
     */
    ProgressDialog.prototype._refreshPercentValue = function () {
        const percent = Math.round((this._getAllWorkload() / this._aCurrentTasks.reduce((acc, task) => acc + task.total, 0)) * 100);
        this._setPercentValue(percent);
    };

    /**
     * 打开进度条
     */
    ProgressDialog.prototype.open = function () {
        this._oDialog.open();
    }

    /**
     * 关闭进度条
     */
    ProgressDialog.prototype.close = function () {
        this._oDialog.close();
    }

    return ProgressDialog;
});