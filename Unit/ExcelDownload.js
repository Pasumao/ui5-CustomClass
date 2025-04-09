sap.ui.define([
    "sap/ui/base/Object"
], function (
    Object
) {
    "use strict";

    /**
     * This class is used to download data as an Excel file using the xlsx library.
     * 
     * @class
     * @name app.controller.func.ExcelDownload
     * @extends sap.ui.base.Object
     * @public
     */
    var ExcelDownload = Object.extend("Unit.ExcelDownload", {

        metadata: {
            interfaces: ["Download"]
        },

        constructor: function (oTable, oProperties) {
            this._oTable = oTable;
            var oBinding = oTable.getBinding("rows");
            this.aRows = oBinding.getContexts().map(function (context) {
                return context.getObject();
            });
            this.aColumns = oTable.getColumns();
            this.aHeader = this.aColumns.map(function (column) {
                if (!oProperties.filters.includes(_getkey(column))) { return column.getLabel().getText(); }
            });
        }
    });

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}.${month}.${day}`;
    }

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }

    function _getkey(column) {
        return column.getSortProperty() || column.data("key");
    }

    ExcelDownload.Download = async function (oProperties) {
        const oTable = oProperties.control
        if (!oTable.isA("sap.ui.table.Table")) { return; }
        var oExcelDownload = new ExcelDownload(oTable, oProperties);

        var Script = await new Promise((resolve, reject) => {
            sap.ui.require(["app/controller/func/Loader"], resolve, reject);
        });
        // eslint-disable-next-line fiori-custom/sap-no-hardcoded-url
        await Script.load("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js");

        var aData = [];
        var filteredHeaders = oExcelDownload.aHeader.filter(function (header) {
            return !oProperties.filters.includes(header);
        });
        aData.push(filteredHeaders);  // Add filtered headers

        oExcelDownload.aRows.forEach(function (row) {
            // Filter row data based on aFilter
            var rowData = oExcelDownload.aColumns
                .filter(function (column) {
                    return !oProperties.filters.includes(_getkey(column));
                })
                .map(function (column) {
                    var cellValue = row[_getkey(column)];
                    var cell = {};

                    // 如果是日期类型，则设置单元格的日期格式

                    if (_getkey(column).includes("Date")) {
                        const date = new Date(cellValue);
                        cellValue = formatDate(date);
                        cell.z = "yyyy.MM.dd";  // 设置单元格日期格式

                    }

                    cell.v = cellValue;  // 设置单元格的值
                    return cell;
                });

            aData.push(rowData);
        });

        // Generate Excel file using xlsx library
        var ws = XLSX.utils.aoa_to_sheet(aData);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        var data = XLSX.write(wb, { type: "binary", bookType: "xlsx" });

        const fileHandle = await window.showSaveFilePicker({
            suggestedName: oProperties.fileName + ".xlsx",
            types: [{
                description: "Excel Files",
                accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
            }]
        });
        console.log(fileHandle);

        const writable = await fileHandle.createWritable();

        await writable.write(s2ab(data));
        await writable.close();

        sap.m.MessageToast.show("Download complete.");
    };

    return ExcelDownload;
});