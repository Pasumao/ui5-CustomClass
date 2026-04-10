sap.ui.define([
    "sap/ui/base/Object",
    "./Unit/ExcelBuilder"
], function (
    Object,
    ExcelBuilder
) {
    "use strict";

    const ExcelExporter = Object.extend("CC.ExcelJS.ExcelExporter", {
        /**
         * @typedef {sap.ui.export.Column} Column
         * @property {string} label header text
         * @property {string} key
         * @property {boolean} [hidden] 隐藏列
         */

        /**
         * @typedef {object} Range 例如: [{ s: {r: 0, c: 0}, e: {r: 0, c: 1} }]
         * @property {object} s
         * @property {number} s.r
         * @property {number} s.c
         * @property {object} e
         * @property {number} e.r
         * @property {number} e.c
         */

        /**
         * @typedef {object} Style
         * @property {Range} range
         * @property {object} style
         */

        /**
         * 
         * @param {object} mSettings 
         * @param {Array<Column>} mSettings.columns
         * @param {Array<Range>} mSettings.merges
         * @param {Array<Style>} mSettings.styles
         * @param {Boolean} mSettings.enableSmartAlign
         * @param {Array<object>} mSettings.data
         * @param {string} mSettings.fileName
         * @returns {ExcelExporter}
         */
        constructor: function (mSettings) {
            this._mSettings = mSettings

        }
    });

    ExcelExporter.prototype.build = async function () {
        const oBuffer = await ExcelBuilder.build(this._mSettings)
        const handle = await (window).showSaveFilePicker({
            suggestedName: this._mSettings.fileName,
            types: [
                {
                    description: 'Excel Files',
                    accept: {
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                    }
                }
            ]
        });

        const writable = await handle.createWritable();
        await writable.write(oBuffer);
        await writable.close();
    };

    return ExcelExporter;
});