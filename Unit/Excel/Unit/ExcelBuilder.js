sap.ui.define([
    "./xlsx-js-style",
    "./../../Lodash"
], function (
    SheetJS,
    _
) {
    "use strict";

    function setSmartAlign(ws) {
        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;

                const cellValue = ws[cellAddress].v;
                const isNumber = (cellValue !== null && cellValue !== '' && isFinite(cellValue));

                // 定义对齐样式
                // 第一行是表头，通常居中；数据行根据类型对齐
                const alignType = R === 0 ? 'center' : (isNumber ? 'right' : 'left');

                ws[cellAddress].s = {
                    alignment: {
                        horizontal: alignType,
                        vertical: 'center'
                    }
                };
            }
        }
    }

    function setColumns(ws, wsData, columns) {
        const colConfigs = columns.map((col, colIndex) => {
            let maxLen = 0;
            wsData.forEach(row => {
                if (row[colIndex]) {
                    const str = String(row[colIndex]);
                    const len = str.length + (str.match(/[^\x00-\xff]/g) || []).length;
                    if (len > maxLen) maxLen = len;
                }
            });
            return { wch: Math.min(Math.max(maxLen, 10), 50), hidden: col.hidden };
        });
        ws['!cols'] = colConfigs;
    }

    function setStyle(ws, styles) {
        styles.forEach(style => {
            const oStyle = style.style
            const range = style.range
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    ws[cellAddress].s = _.merge({}, ws[cellAddress].s || {}, oStyle || {});
                }
            }
        })
    }

    return {
        build: async function (params) {
            const columns = params.columns;
            const data = params.data;
            const enableSmartAlign = params.enableSmartAlign !== false;
            const customMerges = params.merges || [];
            const styles = params.styles || [];
            // 1. 生成表头
            const header = columns.map(col => col.label);

            // 2. 生成数据行
            const rows = data.map(rowItem => {
                return columns.map(col => rowItem[col.key]);
            });

            // 3. 合并为二维数组
            const wsData = [header, ...rows];

            // 4. 创建工作表
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            setColumns(ws, wsData, columns);

            if (enableSmartAlign) {
                setSmartAlign(ws);
            }

            setStyle(ws, styles)

            if (customMerges && customMerges.length > 0) {
                ws['!merges'] = customMerges;
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

            return XLSX.write(wb, { bookType: "xlsx", type: "buffer", cellStyles: true });
        }
    }
});