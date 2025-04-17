sap.ui.define([
    'sap/ui/core/Control'
], async function (Control
) {
    "use strict";

    const Loader = await new Promise((resolve, reject) => {
        sap.ui.require(["app/controller/func/Loader"], resolve, reject);
    })
    // await Loader.script("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js")
    await Loader.link("https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css");
    await Loader.script("https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js");
    await Loader.script("https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js")
    await Loader.script("https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-abap.min.js")


    await Loader.style(`
        ._class_Markdown {
            width: 100%;
            height: 100%;
            overflow-y: auto; /* 允许文本溢出 */
            overflow-x: hidden; /* 禁止文本水平溢出 */
        }

        ._class_Markdown img {
            max-width: 40rem; /* 限制图片宽度为40rem */
            height: auto; /* 保持图片的原始宽高比 */
            display: block; /* 防止图片下方出现空隙 */
            max-height: 40rem; /* 限制图片高度为40rem */
        }

        ._class_Markdown span {
            white-space: pre-wrap; /* 允许文本换行 */
        }
        ._class_Markdown pre {
            box-sizing: border-box;
        }
        ._class_Markdown pre code {
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        ._class_Textarea {
            padding-bottom: 1rem;
        }

        .scrollableDiv {
            overflow-y: auto;
            height: 100%;
        }
    `)

    return Control.extend('app.control.Markdown', {
        metadata: {
            properties: {
                text: { type: 'string', defaultValue: '' },
                edit: { type: 'boolean', defaultValue: false }
            },
            aggregations: {
                _textarea: { type: 'sap.m.TextArea', multiple: false }
            },
            events: {
                change: { parameters: { value: { type: 'string' } } },
                liveChange: { parameters: { value: { type: 'string' } } }
            }
        },

        init: function () {
            Control.prototype.init.call(this);

            this._md = window.markdownit({
                html: true,
                highlight: function (str, lang) {
                    var Prism = window.Prism
                    if (lang && Prism.languages[lang]) {
                        try {

                            return `<pre style="width:100%;" class="language-${lang}"><code class="language-${lang}">` +
                                Prism.highlight(str, Prism.languages[lang], lang) +
                                `</code></pre>`;
                        } catch (__) { }
                    }
                    return undefined;
                }
            });

            this._aBlob = [];

            this._oTextArea = new sap.m.TextArea({
                value: this.getProperty('text'),
                width: '100%',
                // height: '100%',
                layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
                liveChange: this._onLiveChange.bind(this),
                change: this._onChange.bind(this)
            }).attachLiveChange(oEvent => this.setProperty('text', oEvent.getParameter("value")))
                .addStyleClass("_class_Textarea")
                .addStyleClass("scrollableDiv");

            this.setAggregation("_textarea", this._oTextArea)
        },

        /**
         * @override
         * @param {jQuery.Event} oEvent <p>onAfterRendering event object</p>
         */
        onAfterRendering: function (oEvent) {
            Control.prototype.onAfterRendering.apply(this, arguments);

            this._oTextArea.$().off("paste");
            this._oTextArea.$().on("paste", this._onPaste.bind(this));
        },

        /**
         * @override
         */
        exit: function () {
            this._oTextArea.$().off("paste");

            this._cleanBlob();

            if (this._oTextArea.prototype.exit) this._oTextArea.prototype.exit.apply(this._oTextArea, arguments);
            if (Control.prototype.exit) Control.prototype.exit.apply(this, arguments);
        },

        _cleanBlob: function () {
            this._aBlob.forEach(url => URL.revokeObjectURL(url))
            this._aBlob = [];
        },

        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.style("display", "flex")
                oRm.style("height", "100%")
                oRm.openEnd();

                oControl.getAggregation("_textarea").setVisible(oControl.getEdit());
                oRm.renderControl(oControl.getAggregation("_textarea"));

                oRm.openStart("div");
                oRm.class("_class_Markdown");
                oRm.style("flex-grow", "1")
                oRm.class("scrollableDiv")
                oRm.openEnd();

                var sHTML = oControl._md.render(oControl.mProperties.text);
                oRm.unsafeHtml(sHTML);
                oRm.close("div");

                oRm.close("div");
            }
        },

        setText: function (sText) {
            this.setProperty('text', sText);
            // if (!sText) return;
            this.getAggregation("_textarea").setValue(sText);
        },

        setEdit: function (bEdit) {
            this.setProperty('edit', bEdit);
            this.getAggregation("_textarea").setVisible(bEdit);
        },

        _onLiveChange(oEvent) {
            this.fireLiveChange({ value: oEvent.getParameter("value") })
        },

        _onChange(oEvent) {
            this.fireChange({ value: oEvent.getParameter("value") })
        },

        _onPaste(oEvent) {
            const oClipboardData = oEvent.originalEvent.clipboardData;

            if (!oClipboardData) return;

            const $textarea = this._oTextArea.$()[0].firstChild.childNodes[0]
            const startPos = $textarea.selectionStart;
            const endPos = $textarea.selectionEnd;
            const currentValue = this._oTextArea.getValue();

            let newValue = '';
            let cursorPos = startPos;

            for (let i = 0; i < oClipboardData.items.length; i++) {
                const item = oClipboardData.items[i];
                if (item.kind === 'file' && item.type.match(/^image\//i)) {
                    //清除默认行为
                    oEvent.preventDefault();

                    const file = item.getAsFile();
                    var dataUrl = URL.createObjectURL(file);
                    this._aBlob.push(dataUrl);
                    // this._oTextArea.setValue(this._oTextArea.getValue() + `![desc](${dataUrl})`)

                    newValue += `![desc](${dataUrl})`;
                    cursorPos += `![desc](${dataUrl})`.length;
                }
            }
            const updatedValue = currentValue.substring(0, startPos) + newValue + currentValue.substring(endPos);
            // $textarea.value = updatedValue;
            document.execCommand("insertText", false, newValue);
            // navigator.clipboard.writeText(newValue);

            $textarea.setSelectionRange(cursorPos, cursorPos);
            this._oTextArea.fireLiveChange({ value: updatedValue });
            // this._oTextArea.fireChange({ value: updatedValue });
        }

    });
});
