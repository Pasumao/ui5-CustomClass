
/**
 * ============================================
 * 这个文件是示例，不是可执行文件，请不要直接运行。
 * ============================================
 */

sap.ui.define([
    "app/controller/Basecontroller",
    "sap/ui/comp/smarttable/SmartTable"
], async function (Basecontroller,
    SmartTable) {
    "use strict";

    return Basecontroller.extend("app.controller.View1", {
        async onInit() {

            //这里需要导入lodash库，需要他的深拷贝object方法
            await (async () => {
                const sLodashUrl = "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"
                const id = "idLodash"
                return new Promise((resolve, reject) => {
                    if (document.getElementById(id)) {
                        resolve();  // 如果库已经加载，直接返回
                        return;
                    }

                    var script = document.createElement("script");
                    script.id = id;
                    script.src = sLodashUrl;

                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            })();

            /**
             * 需要在oninit时重写SmartTable的方法，
             * _createContent方法是创建table模板相关，
             * 所有的单元格全都是绑到一个JSONModel上，没办法单独修改，这里把edit的模板直接替换成display的模板，
             * 然后阻止修改表宽度的方法_updateVisibleColumnsWidthForEdit，readonly的列不参与宽度计算。
             * 需要在xmlview中设置data属性readOnlyFields，值为readonly的列名，多个列用逗号分隔。
             * 示例
             * <smarttable:SmartTable 
             *              xmlns:data="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1" //写最上面也行
             *				id="idSmartTable"
             *				entitySet="I_Product" 
             *				showRowCount="true"
             *				header="Product"
             *				smartFilterId="smartFilterBar"
             *				initiallyVisibleFields="Product,ProductGroup,Plant,GrossWeight,NetWeight,ProductionInvtryManagedLoc,ProfileValidityStartDate"
             *				data:readOnlyFields="Product,Plant"  //需要readonly的列名，多个列用逗号分隔
             *				editTogglable="true"
             *				beforeExport="onSmartTableBeforeExport"
             *				tableType="Table"
             *				enableAutoColumnWidth="true"
             *				data:useSmartToggle="true">
             *
             *			</smarttable:SmartTable>
             */

            const fn_createContent = SmartTable.prototype._createContent;
            SmartTable.prototype._createContent = function () {
                const aReadOnlyFileds = this.data("readOnlyFields") ?
                    this.data("readOnlyFields").split(",") : [] || [];

                this._aTableViewMetadata
                    .filter((oColumn) => aReadOnlyFileds.includes(oColumn.name))
                    .forEach(function (oColumn) {
                        oColumn.template.mAggregations.edit = _.cloneDeep(oColumn.template.mAggregations.display)
                        oColumn.template.mAggregations.edit.sId += "-edit"
                    })

                fn_createContent.apply(this, arguments);
            };

            SmartTable.prototype._updateVisibleColumnsWidthForEdit = function () {
                const aReadOnlyFileds = this.data("readOnlyFields") ?
                    this.data("readOnlyFields").split(",") : [] || [];

                if (!this._oTable || !this._oTableProvider || !this.getEnableAutoColumnWidth()) {
                    return;
                }

                this._oTable
                    .getColumns()
                    .filter((oColumn) => oColumn.getVisible())
                    .filter((oColumn) => !aReadOnlyFileds.includes(oColumn.getFilterProperty()))
                    .forEach(function (oColumn) {
                        var sLeadingProperty = this._getColumnLeadingProperty(oColumn);

                        if (sLeadingProperty) {
                            const oField = this._oTableProvider.getFieldMetadata(sLeadingProperty);
                            this._updateColumnWidthForEdit(oColumn, oField);
                        }
                    }, this);
            };

        }
    });
});