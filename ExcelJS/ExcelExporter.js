sap.ui.define([
    "sap/ui/export/ExportBase",
    "sap/ui/export/ExportDialog",
    "./Unit/ExcelBuilder"
],
    /**
     * @param {typeof import("sap/ui/export/ExportBase").default} ExportBase
     * 
     */
    function (
        ExportBase,
        ExportDialog,
        ExcelBuilder
    ) {
        "use strict";

        const ExcelExporter = ExportBase.extend("CC.ExcelJS.ExcelExporter", {
            /**
             * @typedef {sap.ui.export.Column} Column
             * @property {string} label header text
             * @property {string} property key
             * @property {string} textAlign `left`、`right`、`center`、`begin`、`end`
             */


            /**
             * 
             * @param {object} mSettings 
             * @param {object} mSettings.workbook
             * @param {Array<Column>} mSettings.workbook.columns
             * @param {Array<object>} mSettings.dataSource
             * @param {string} mSettings.fileName
             * @returns {ExcelExporter}
             */
            constructor: function (mSettings) {
                this._mSettings = {}
                ExportBase.call(this, mSettings);

                this.process = null;
                this.bIsDestroyed = false;

            }
        });

        ExcelExporter.prototype.setDefaultExportSettings = async function (mParameters) {

        }

        ExcelExporter.prototype.build = async function () {
            const mParameters = this._mSettings;

            if (this.bIsDestroyed) {
                const sMessage = this.getMetadata().getName() + ": Cannot trigger build - the object has been destroyed";

                Log.error(sMessage);
                return Promise.reject(sMessage);
            }

            await this.setDefaultExportSettings(mParameters);
            const bExecuteDefaultAction = this.fireEvent("beforeExport", { exportSettings: mParameters }, true, false);

            if (!bExecuteDefaultAction) {
                return Promise.resolve();
            }

            this.validateSettings(mParameters);
            return this.createBuildPromise(mParameters);
        };

        ExcelExporter.prototype.createBuildPromise = function (mParameters) {
            const that = this;

            return new Promise(function (fnResolve, fnReject) {

                let progressDialog;
                const MAX_ROWS = 1_048_576; // Maximum allowed Rows per sheet
                const iCount = mParameters.dataSource.count;
                const iDownloadLimit = mParameters.dataSource.downloadLimit;
                const nSizeLimit = 2_000_000;
                const nRows = mParameters.dataSource.type == "array" ? mParameters.dataSource.data.length : iDownloadLimit || iCount;
                const nColumns = mParameters.workbook.columns.length;

                async function onmessage(oMessage) {

                    if (oMessage.progress) {
                        if (progressDialog) {
                            progressDialog.updateStatus(oMessage.fetched, oMessage.total);
                        }
                        that.onprogress(oMessage.fetched, oMessage.total);
                    }

                    /*
                     * It is important to check if the process is still assigned, this allows to cancel the export
                     * even though all rows have been appended to the Spreadsheet but the file has not been saved yet
                     */
                    if (oMessage.finished && that.process !== null) {
                        that.process = null;

                        if (!oMessage.spreadsheet) {
                            fnReject();
                            return;
                        }

                        const executeDefaultAction = that.fireEvent("beforeSave", {
                            data: oMessage.spreadsheet,
                            exportDialog: progressDialog
                        }, true, false);

                        if (executeDefaultAction) {
                            /*
                            * Keep the progress dialog open for 1 second to avoid
                            * screen flickering in case of extremely fast exports
                            */
                            if (progressDialog) {
                                window.setTimeout(progressDialog.finish, 1000);
                            }
                            const handle = await (window).showSaveFilePicker({
                                suggestedName: mParameters.fileName,
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
                            await writable.write(oMessage.spreadsheet);
                            await writable.close();
                            // ExportUtils.saveAsFile(new Blob([oMessage.spreadsheet], {
                            //     type: that.getMimeType()
                            // }), mParameters.fileName);
                        }

                        // ExportUtils.announceExportStatus(Status.FINISHED, { assertive: true });
                        fnResolve();
                    }

                    if (typeof oMessage.error != "undefined") {
                        const sError = oMessage.error.message || oMessage.error;
                        that.process = null;

                        if (progressDialog) {
                            progressDialog.finish();
                        }

                        fnReject(sError);
                        ExportDialog.showErrorMessage(sError);
                    }
                }

                function isDownloadLimitLessThanCount(iDownloadLimit, iCount) {
                    return (iDownloadLimit < iCount);

                }

                function startExport() {
                    if (!mParameters.showProgress) {
                        if (that.process) {
                            fnReject("Cannot start export: the process is already running");
                            return;
                        }

                        that.process = ExcelExporter.execute(mParameters, onmessage);
                        return;
                    }

                    // Show progress dialog
                    ExportDialog.getProgressDialog().then(function (oDialogResolve) {
                        progressDialog = oDialogResolve;

                        if (that.process) {
                            fnReject("Cannot start export: the process is already running");
                            return;
                        }

                        progressDialog.oncancel = function () {
                            return that.process && that.process.cancel();
                        };

                        progressDialog.open();

                        // Set initial status
                        progressDialog.updateStatus(0, Math.min(iDownloadLimit || MAX_ROWS, iCount || MAX_ROWS));

                        // Start export once the dialog is present and the code lists have been loaded
                        that.process = ExcelExporter.execute(mParameters, onmessage);
                    });
                }

                // When there are no columns --> don't trigger the export
                if (nColumns <= 0) {
                    // Consider showing a dialog to the end users instead of just this error!
                    fnReject("No columns to export.");
                } else if (nRows * nColumns > nSizeLimit || !nRows || nRows >= MAX_ROWS || isDownloadLimitLessThanCount(nRows, iCount)) { // Amount of rows need to be less than maximum amount because of column header
                    const oDialogSettings = {
                        rows: nRows,
                        columns: nColumns,
                        cellLimit: nSizeLimit,
                        rowLimit: MAX_ROWS,
                        fileType: "XLSX",
                        count: iCount
                    };

                    // Show warning and execute
                    ExportDialog.showWarningDialog(oDialogSettings)
                        .then(startExport)
                        .catch(fnReject);
                } else {
                    startExport();
                }

            });
        };

        ExcelExporter.prototype.validateSettings = function (mParameters) {
        };

        ExcelExporter.prototype.onprogress = function (iFetched, iTotal) {
            if (isNaN(iFetched) || isNaN(iTotal)) {
                return;
            }

            const iProgress = Math.round(iFetched / iTotal * 100);
        };

        ExcelExporter.execute = function (mParams, fnCallback) {
            function postMessage(oMessage) {
                if (oMessage instanceof MessageEvent && oMessage.data) {
                    oMessage = oMessage.data;
                }

                if (typeof fnCallback === 'function') {
                    fnCallback(oMessage);
                }
            }

            function onProgress(iFetched, iTotal) {
                postMessage({
                    progress: true,
                    fetched: iFetched || 0,
                    total: iTotal || 0
                });
            }

            function onFinish(oArrayBuffer) {
                postMessage({ finished: true, spreadsheet: oArrayBuffer });
            }

            function exportArray() {
                var iCount = mParams.dataSource.data.length;
                onProgress(iCount, iCount);
                ExcelBuilder.build(mParams).then(onFinish);

                return { cancel: onFinish };
            }

            if (mParams.dataSource.type === 'array') {
                return exportArray();
            }

        }

        /**
         * @override
         * @param {Array<object>} oDataSource 
         * @returns 
         */
        ExcelExporter.prototype.processDataSource = function (oDataSource) {
            let mDataSource = null;
            if (oDataSource instanceof Array) {
                mDataSource = { data: oDataSource, type: "array" };
            }

            return mDataSource;
        };

        ExcelExporter.prototype.cancel = function () {
            if (this.process) {
                this.process.cancel();
                this.process = null;
            }

            return this;
        };

        return ExcelExporter;
    });