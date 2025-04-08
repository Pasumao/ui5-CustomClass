/* eslint-disable max-params */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/util/Storage",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/ui/codeeditor/CodeEditor",
    "sap/m/List",
    "sap/m/CustomListItem",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/ui/model/json/JSONModel",
    "sap/m/VBox",
    "sap/ui/core/StaticArea"
], function (Control, Storage, Popover, Button, CodeEditor, List, CustomListItem, HBox, Text, JSONModel, VBox, StaticArea) {
    "use strict";

    return Control.extend("com.aspn.tools.ybcpi0010.ext.Unit.Debugger", {
        metadata: {
            properties: {
                this: { type: "object" }  // 关联的控制器
            }
        },

        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.attr("style", "position: fixed !important;bottom: 2rem;right: 2rem;z-index: 1000;box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);");
                oRm.openEnd();
                oRm.renderControl(oControl._oFloatBtn);
                oRm.close("div");
            }
        },

        init: function () {
            var oStaticUIArea = StaticArea.getDomRef();
            // 创建悬浮按钮
            this._oFloatBtn = new Button({
                icon: "sap-icon://write-new",
                type: "Emphasized",
                press: this.openDialog.bind(this)
            });

            this.placeAt(oStaticUIArea);
            this.setModel(new JSONModel({ blocks: [] }));

            this.localStorage = new Storage(Storage.Type.local, "UI5-Debugger");
            const localBlocks = this.localStorage.get("blocks");

            if (localBlocks) {
                this.getModel().setProperty("/blocks", JSON.parse(localBlocks));
            } else {
                this._addBlock();
            }

            if (!this._oPopover) {
                this._codeEditor = new CodeEditor({
                    type: "javascript",
                    value: "{code}",
                    maxLines: 10,
                    width: "400px",
                    colorTheme: "github",
                    liveChange: this._handleCodeChange.bind(this)
                }).data("index", "{index}");

                this._toolButton = new VBox({
                    items: [
                        new Button({
                            icon: "sap-icon://delete",
                            press: this._deleteBlock.bind(this)
                        }).data("index", "{index}"),
                        new Button({
                            text: "执行",
                            type: "Emphasized",
                            press: this._executeCode.bind(this)
                        }).data("index", "{index}")
                    ]
                });
                this._fn = this._onGetControl.bind(this)
                this._oPopover = new Popover({
                    title: "代码执行器",
                    placement: "Top",
                    contentMinWidth: "450px",
                    showHeader: true,
                    content: [
                        new List({
                            items: {
                                path: "/blocks",
                                template: new CustomListItem({
                                    content: [
                                        new HBox({
                                            items: [
                                                this._codeEditor,
                                                this._toolButton
                                            ]
                                        }).addStyleClass("sapUiSmallMargin"),
                                        new Text({ text: "{result}" })
                                    ]
                                })
                            }
                        }).setModel(this.getModel()),
                        new Button({
                            text: "添加代码块",
                            press: this._addBlock.bind(this)
                        }),
                        new Button({
                            icon: "sap-icon://cursor-arrow",
                            press: (oEvent) => {
                                var oControl = oEvent.getSource()
                                if (!this._bt) {
                                    this._bt = oControl;
                                }
                                if (oControl.getType() === "Emphasized") {
                                    oControl.setType("Default")
                                    document.removeEventListener("mouseup", this._fn);
                                } else {
                                    oControl.setType("Emphasized")
                                    document.addEventListener("mouseup", this._fn);
                                }
                            }
                        })
                    ]
                });

                // 关联悬浮按钮
                this._oPopover.addEventDelegate({
                    onAfterRendering: () => {
                        this._oPopover.attachBrowserEvent("keydown", (oEvent) => {
                            if (oEvent.key === "Escape") { this._oPopover.close(); }
                        });
                    }
                });
            }
        },

        // /**
        //  * @override
        //  * @param {boolean} [bVisible] <p>New value for property <code>visible</code></p>
        //  * @returns {this}
        //  */
        // setVisible(bVisible) {
        //     const vReturn = Control.prototype.setVisible.apply(this, arguments);
        //     if (bVisible) {
        //         
        //     } else {
        //         document.removeEventListener("contextmenu", this.onGetControl.bind(this));
        //     }

        //     return vReturn;
        // },

        _onGetControl: function (oEvent) {
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
            const target = oEvent.target;
            const oControl = target2Control(target)
            if (oControl.sId !== this._bt.sId && oControl.getParent().sId !== this._bt.sId) {
                this.getThis().c = oControl;
                console.log(target2Control(target))
                this._bt.setType("Default")
            }
            oEvent.preventDefault();
            document.removeEventListener("mouseup", this._fn);
        },

        openDialog: function () {
            // 确保悬浮按钮已渲染
            const oFloatBtn = this._oFloatBtn?.getDomRef();

            // 打开定位到悬浮按钮
            this._oPopover.openBy(oFloatBtn || this.getParent());
        },

        _handleCodeChange(oEvent) {
            const sValue = oEvent.getParameter("value");
            const index = oEvent.getSource().data("index");
            const blocks = this.getModel().getProperty("/blocks");

            blocks.find(b => b.index === index).code = sValue;
            this.localStorage.put("blocks", JSON.stringify(blocks));
        },

        _addBlock: function () {
            const blocks = this.getModel().getProperty("/blocks");
            var nextIndex = blocks.length > 0
                ? Math.max(...blocks.map(b => b.index)) + 1
                : 0;
            blocks.push({ code: "", index: nextIndex, result: null });
            this.localStorage.put("blocks", JSON.stringify(blocks));
            this.getModel().setProperty("/blocks", blocks);
        },

        // 修改后的删除方法
        _deleteBlock: function (oEvent) {
            const index = oEvent.getSource().data("index");
            const blocks = this.getModel().getProperty("/blocks");
            var newBlocks = blocks.filter(b => b.index !== index);
            this.localStorage.put("blocks", JSON.stringify(newBlocks));
            this.getModel().setProperty("/blocks", newBlocks);
        },

        _executeCode: async function (oEvent) {
            const index = oEvent.getSource().data("index");
            const code = this.getModel().getProperty(`/blocks/${index}/code`);

            try {
                const AsyncFunction = Object.getPrototypeOf(async () => { }).constructor;

                // 双重绑定确保this指向controller
                const fn = new AsyncFunction(code)
                    .bind(this.getThis()); // 关键修改点

                const result = await fn.call(this.getThis()); // 确保执行上下文

                this.getModel().setProperty(`/blocks/${index}/result`,
                    result || "");
            } catch (e) {
                this.getModel().setProperty(`/blocks/${index}/result`,
                    "错误: " + e.message);
            }
        },

        // 清理资源
        exit: function () {
            if (this._oFloatBtn) { this._oFloatBtn.destroy(); }
            if (this._oPopover) {
                this._oPopover.destroy();
                delete this._oPopover;
            }
            if (this._codeEditor) { this._codeEditor.destroy(); }
            if (this._toolButton) { this._toolButton.destroy(); }
        }
    });
});