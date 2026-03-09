sap.ui.define([
    "sap/ui/base/Object"
], function (
    Object
) {
    "use strict";

    /**
     * 这是一个sap.ui.table.Table的控制器类，可以把表展示为2D表
     */
    const Table2DController = Object.extend("Unit.Table2DController", {
        constructor: function (oTable, oModel) {
            this.oTable = oTable;
            this.oTable.destroyColumns()
            this.oModel = oModel;
            this._row_data = [];
            this._col_data = [];
            this._cell_data = [];
            this._fdataMap = new Map();
            this._dataMap = new Map();
            this._formulaMap = new Map();
            // 存储每个公式的层级和依赖信息
            this._formulaInfo = new Map();

        },
    });

    Table2DController.prototype.setColumns = function (aColumnData) {
        this._col_data = aColumnData
        this.oTable.destroyColumns()
        const firstColumn = new sap.ui.table.Column({
            label: new sap.m.Label(),
            template: new sap.m.Text({
                text: "{tableData>row_label/label}"
            })
        })
        this.oTable.addColumn(firstColumn)
        aColumnData.forEach(column => {
            const oColumn = new sap.ui.table.Column({
                label: new sap.m.Label({ text: column.label }),
                customData: [new sap.ui.core.CustomData({
                    key: "key",
                    value: column.key
                })],
                template: column.template
            })
            this.oTable.addColumn(oColumn)
        })
    }

    Table2DController.prototype.getColData = function () {
        return this._col_data
    }

    Table2DController.prototype.getRowData = function () {
        return this._row_data
    }

    Table2DController.prototype.set2dArrayData = function (rootRow, rootCol, towdArray) {
        const colData = this.getColData()
        function getCol(rootCol, colIndex) {
            let index
            colData.forEach((col, i) => {
                if (col.key === rootCol) {
                    index = i
                }
            })
            const getIndex = index + colIndex
            if (getIndex >= colData.length) {
                return undefined
            }
            return colData[getIndex].key
        }

        towdArray.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellCol = getCol(rootCol, colIndex)
                const cellRow = Number(rootRow) + rowIndex
                if (cellCol === undefined || cellRow >= this.getRowData().length) {
                    return;
                }
                const path = `/${cellRow}/${cellCol}`

                this.changeCellData(path, cell)
            })
        })
        this.render()
    }

    Table2DController.prototype.setRows = function (aRowData) {
        this._row_data = aRowData
    }

    Table2DController.prototype.setCellData = function (cellData) {
        this._cell_data = cellData
        cellData.forEach(cell => {
            this._dataMap.set(`${cell.row_uid}.${cell.col_uid}`, cell.value)
        })
    }

    Table2DController.prototype.setFormulas = function (aFormulaData) {
        aFormulaData.forEach(f => {
            this._formulaMap.set(f.cell, f.formula);
            this._formulaInfo.set(f.cell, {
                formula: f.formula,
                level: -1, // -1 表示未计算/未知层级
                dependencies: this._extractDependencies(f.formula)
            });
        });
        this._calculateLevels()
    }

    Table2DController.prototype._extractDependencies = function (formulaStr) {
        // 匹配规则：字母+数字 . 字母+数字 (根据示例 uid.id 格式)
        const regex = /[a-zA-Z0-9]+\.[a-zA-Z0-9]+/gi;
        const matches = formulaStr.match(regex);
        return matches ? [...new Set(matches)] : []; // 去重
    }

    Table2DController.prototype._calculateLevels = function () {
        let remainingFormulas = new Set(this._formulaMap.keys());
        let hasProgress = true;

        // 循环直到所有公式都分配了层级，或者发现循环依赖（无进展）
        while (remainingFormulas.size > 0 && hasProgress) {
            hasProgress = false;
            const toRemove = [];

            for (const cellId of remainingFormulas) {
                const info = this._formulaInfo.get(cellId);
                const deps = info.dependencies;

                // 检查依赖是否都已解决
                const allDepsResolved = deps.every(dep => {
                    // 依赖是初始数据 OR 依赖是已经计算出层级的公式
                    return this._dataMap.has(dep)
                        || (this._formulaInfo.has(dep) && this._formulaInfo.get(dep).level !== -1)
                        || (!this._formulaInfo.has(dep) && !this._dataMap.has(dep))
                });

                if (allDepsResolved) {
                    // 计算当前公式的层级 = 依赖项中的最大层级 + 1
                    // 如果依赖全是初始数据，maxDepLevel 为 0，则当前为 1
                    let maxDepLevel = 0;

                    deps.forEach(dep => {
                        if (this._formulaInfo.has(dep)) {
                            const depLevel = this._formulaInfo.get(dep).level;
                            if (depLevel > maxDepLevel) {
                                maxDepLevel = depLevel;
                            }
                        }
                    });

                    info.level = maxDepLevel + 1;
                    // this._formulaInfo.set(cellId, info);
                    toRemove.push(cellId);
                    hasProgress = true;
                }
            }

            // 移除已分层的公式
            toRemove.forEach(id => remainingFormulas.delete(id));
        }

        if (remainingFormulas.size > 0) {
            console.error("检测到循环依赖或无法解析的引用:", Array.from(remainingFormulas));
            throw new Error(`公式存在循环依赖或缺少数据: ${Array.from(remainingFormulas).join(', ')}`);
        }
    }

    Table2DController.prototype.excute = function () {
        // 2. 按层级排序公式
        const sortedFormulas = Array.from(this._formulaInfo.entries()).sort((a, b) => {
            return a[1].level - b[1].level;
        });

        for (const [cellId, info] of sortedFormulas) {
            const calculatedValue = this._evaluateFormula(info.formula);

            this._fdataMap.set(cellId, calculatedValue);
        }

    }

    Table2DController.prototype._evaluateFormula = function (formulaStr) {
        const deps = this._extractDependencies(formulaStr);
        deps.sort((a, b) => b.length - a.length);

        let executableStr = formulaStr;

        deps.forEach(dep => {
            let val
            if (this._dataMap.has(dep)) {
                val = this._dataMap.get(dep);
            } else if (this._fdataMap.has(dep)) {
                val = this._fdataMap.get(dep);
            } else {
                val = 0;
            }

            // 使用正则全局替换，确保只替换完整的单元格ID
            // 这里的逻辑假设公式中单元格ID周围是非字母数字字符或边界
            const regex = new RegExp(`\\b${dep}\\b`, 'g');
            executableStr = executableStr.replace(regex, val);
        });

        try {
            // 使用 Function 构造器安全地执行数学表达式 (比 eval 稍好，但仍需注意输入源可信度)
            // 支持 + - * / ()
            const result = new Function('return ' + executableStr)();
            return result;
        } catch (e) {
            console.error(`公式计算失败: ${formulaStr} -> ${executableStr}`, e);
            throw e;
        }
    }

    Table2DController.prototype.changeCellData = function (sPath, value) {
        const oData = this.oModel.getProperty(sPath)
        if (!this.oModel.getProperty(sPath + "/is_formula")) {
            this._dataMap.set(`${oData.row}.${oData.col}`, value)
        }
    }

    Table2DController.prototype.render = function () {
        this.excute()
        const tableData = []
        this._row_data.forEach(row => {
            const rowData = {}
            rowData.row_label = {
                label: row.label,
                key: row.key
            }
            this._col_data.forEach(col => {
                let cellValue = this._fdataMap.has(`${row.key}.${col.key}`)
                    ? this._fdataMap.get(`${row.key}.${col.key}`)
                    : this._dataMap.has(`${row.key}.${col.key}`)
                        ? this._dataMap.get(`${row.key}.${col.key}`)
                        : 0
                rowData[col.key] = {
                    row: row.key,
                    col: col.key,
                    is_formula: this._formulaMap.has(`${row.key}.${col.key}`),
                    value: cellValue
                }
            })
            tableData.push(rowData)
        })
        this.oModel.setData(tableData)
    }

    return Table2DController
});