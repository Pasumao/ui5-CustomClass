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
         * @property {object} s    开始
         * @property {number} s.r  开始行
         * @property {number} s.c  开始列
         * @property {object} e    结束
         * @property {number} e.r  结束行
         * @property {number} e.c  结束列
         */

        /**
         * Specifies color properties for fill, font, and border.
         * @typedef {Object} ColorSpec
         * @property {1} [auto] - Specifies automatic values (e.g., { auto: 1 }).
         * @property {string} [rgb] - Specifies a hex ARGB value (e.g., "FFFFAA00").
         * @property {string} [theme] - Integer index to a theme color (e.g., "1").
         * @property {string} [tint] - Tint value for theme color, default is 0 (e.g., "-0.25").
         * @property {number} [indexed] - Default value for fill.bgColor (e.g., 64).
         */

        /**
         * Specifies the border style type.
         * @typedef {('thin'|'medium'|'thick'|'dotted'|'hair'|'dashed'|'mediumDashed'|'dashDot'|'mediumDashDot'|'dashDotDot'|'mediumDashDotDot'|'slantDashDot')} BorderStyle
         * "thin"为普通细线
         */

        /**
         * Specifies a single border property (style and color).
         * @typedef {Object} BorderProperty
         * @property {BorderStyle} style - The style of the border.
         * @property {ColorSpec} color - The color specification.
         */

        /**
         * Specifies border properties for a cell.
         * @typedef {Object} Border
         * @property {BorderProperty} [top]    上
         * @property {BorderProperty} [bottom] 下
         * @property {BorderProperty} [left]   左
         * @property {BorderProperty} [right]  右
         * @property {BorderProperty} [diagonal] 对角线
         * @property {boolean} [diagonalUp] 对角向上
         * @property {boolean} [diagonalDown] 对角向下
         */

        /**
         * Specifies font properties.
         * @typedef {Object} Font
         * @property {string} [name] - 字体名称
         * @property {string|number} [sz] 字体大小
         * @property {ColorSpec} [color] 字体颜色
         * @property {boolean} [bold] 加粗
         * @property {boolean} [underline] 下划线
         * @property {boolean} [italic] 斜体
         * @property {boolean} [strike] 删除线
         * @property {boolean} [outline] 轮廓
         * @property {boolean} [shadow] 阴影
         * @property {boolean} [vertAlign] 垂直对齐
         */

        /**
         * Specifies fill properties.
         * @typedef {Object} Fill
         * @property {('solid'|'none')} [patternType] 
         * @property {ColorSpec} [fgColor] 
         * @property {ColorSpec} [bgColor] 背景颜色
         */

        /**
         * Specifies alignment properties.
         * @typedef {Object} Alignment
         * @property {('bottom'|'center'|'top')} [vertical]   垂直
         * @property {('left'|'center'|'right')} [horizontal] 水平
         * @property {boolean} [wrapText]
         * @property {number} [readingOrder] - 2 表示从右到左.
         * @property {number} [textRotation] - 文本旋转 0 到 180，或 255 // 180 旋转 180 度，255 为特殊，垂直对齐
         */

        /**
         * Main Style Object definition paralleling OpenXML structure.
         * @typedef {Object} CellStyle
         * @property {Fill} [fill] 背景相关
         * @property {Font} [font] 字体相关
         * @property {string} [numFmt] - 单元格格式相关 (e.g., "0", "0.00%", "m/dd/yy").
         * @property {Alignment} [alignment] 文本对齐
         * @property {Border} [border] 边框
         */

        /**
         * @typedef {object} Style
         * @property {Range} range
         * @property {CellStyle} style
         */

        /**
         * @returns {ExcelExporter}
         */
        constructor: function () {
            this._ws = []

        }
    });

    /**
     * 生成一个sheet
     * @param {object} mSettings 
     * @param {Array<Column>} mSettings.columns 表头
     * @param {Array<Range>} mSettings.merges   合并单元格
     * @param {Array<Style>} mSettings.styles   单元格样式
     * @param {Boolean} mSettings.enableSmartAlign  是否开启智能对齐
     * @param {Array<object>} mSettings.data    数据
     * @param {string} mSettings.sheetName  sheet名称
     * @param {Range} mSettings.autofilter 筛选的列的范围
     */
    ExcelExporter.prototype.buildSheet = async function (mSettings) {
        const oWS = await ExcelBuilder.buildSheet(mSettings)
        this._ws.push({
            ws: oWS,
            name: mSettings.sheetName
        })
    };

    /**
     * 导出
     * @param {string} fileName 文件名
     */
    ExcelExporter.prototype.export = async function (fileName) {
        const oBuffer = await ExcelBuilder.buildBook(this._ws)
        const handle = await (window).showSaveFilePicker({
            suggestedName: fileName + ".xlsx",
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