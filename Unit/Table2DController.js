sap.ui.define([
    "sap/ui/base/Object"
], function (
    Object
) {
    "use strict";

    /**
     * @typedef ExtraColumnConfig 列扩展配置
     * @property {string} label 列标题文本
     * @property {string} key 列唯一标识
     * @property {number} index 列索引
     * @property {object[]} [data] 列数据
     * @property {string[]} [group] 用于树结构分组
     */

    /**
     * @typedef RowConfig 行配置
     * @property {string} label 行标题文本
     * @property {string} key 行唯一标识
     * 如果要使用树表group数据展示
     * 则需要在RowConfig中添加this._extraColumnConfig中第一条中键为key
     * 值为group中的一个值才可匹配
     */

    /**
     * @typedef ColumnConfig 列配置
     * @property {string} label 列标题文本
     * @property {string} key 列唯一标识
     * @property {sap.ui.core.Control} template 列模板
     */

    /**
     * @typedef CellData
     * @property {string} row_key 行唯一标识
     * @property {string} col_key 列唯一标识
     * @property {string} value 单元格值
     * @property {boolean} [editable] 是否可编辑
     * @property {boolean} [isFormula] 是否为公式
     */

    /**
     * @typedef FormulaConfig
     * @property {string} row_key 公式所在行
     * @property {string} col_key 公式所在列
     * @property {string} formula 公式字符串
     */

    /**
     * @typedef GroupConfig
     * @property {string} label 列标题文本
     * @property {string} key 列唯一标识
     * @property {number} index 列索引
     * @property {object[]} [data] 列数据
     * @property {boolean} [isArrayNames] 用于树结构分组,整个groupconfigs里需要唯一
     */

    class groupHandler {
        constructor() {
            this.mSettings = []
        }

        addConfig(config) {
            this.mSettings.push(config)
        }

        getKeyConfig() {
            return this.mSettings.find(config => config.isArrayNames === true)
        }

        getOtherConfigs() {
            return this.mSettings.filter(config => config.isArrayNames !== true)
        }
    }

    /**
     * 这是一个sap.ui.table.Table的控制器类，可以把表展示为2D表
     */
    const Table2DController = Object.extend("Unit.Table2DController", {
        constructor: function (oTable, oModel, sModelName) {
            this.oTable = oTable;
            this.oTable.destroyColumns()
            this.oModel = oModel;
            this.sModelName = sModelName;

            /** @type {RowConfig[]} 行配置 */
            this._aRowConfigs = [];

            /** @type {ColumnConfig[]} aColumnConfigs 列配置 */
            this._aColumnConfigs = [];

            this._mData = new Map();
            // 存储每个公式的层级和依赖信息
            this._mFormula = new Map();

            /**  @type {ExtraColumnConfig[]} extraColumnConfigs 额外的列配置 */
            this._extraColumnConfig = [];
        },
    });

    /**
     * 设置列配置
     * @param {ColumnConfig[]} aColumnConfigs 列配置
     */
    Table2DController.prototype.setColumnConfigs = function (aColumnConfigs) {
        this._aColumnConfigs = aColumnConfigs
    }

    Table2DController.prototype._setColumns = function () {
        this.oTable.destroyColumns()
        this._aColumnConfigs.forEach((column, index) => {
            const aExColumns = this._extraColumnConfig.filter(col => col.index === index)
            if (aExColumns.length > 0) {
                aExColumns.forEach(exColumn => {
                    const oColumn = new sap.ui.table.Column({
                        label: new sap.m.Label({ text: exColumn.label }),
                        template: new sap.m.Label({ text: `{${this.sModelName}>${exColumn.key}/value}` }),
                        width: "100px"
                    })
                    this.oTable.addColumn(oColumn)
                })
            }
            if (index === 0) {
                const firstColumn = new sap.ui.table.Column({
                    label: "항목",
                    template: new sap.m.Text({
                        text: `{${this.sModelName}>row_label/label}`
                    }),
                    visible: !this._bHide,
                    width: "100px"
                })
                this.oTable.addColumn(firstColumn)
            }
            const oColumn = new sap.ui.table.Column({
                label: new sap.m.Label({ text: column.label }),
                template: column.template,
                width: "100px"
            })
            this.oTable.addColumn(oColumn)
        })
    }

    /**
     * 获取列配置
     * @returns {ColumnConfig[]} 列配置
     */
    Table2DController.prototype.getColumnConfigs = function () {
        return this._aColumnConfigs
    }

    /**
     * 获取行配置
     * @returns {RowConfig[]} 行配置
     */
    Table2DController.prototype.getRowConfigs = function () {
        return this._aRowConfigs
    }

    Table2DController.prototype.hideFirstColumn = function (bHide) {
        this._bHide = bHide
    }

    Table2DController.prototype.set2dArrayData = function (rootRow, rootCol, towdArray) {
        const colData = this.getColumnConfigs()
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
                if (cellCol === undefined || cellRow >= this.getRowConfigs().length) {
                    return;
                }
                const path = `/${cellRow}/${cellCol}`
                if (!this.oModel.getProperty(path + "/isFormula")) {
                    this.changeCellValue(cellRow, cellCol, cell)
                }
            })
        })
        this.render()
    }

    /**
     * 设置行配置
     * @param {RowConfig} aRowData 
     */
    Table2DController.prototype.setRowConfigs = function (aRowData) {
        this._aRowConfigs = aRowData
    }

    /**
     * 设置单元格数据
     * @param {CellData[]} cellData 单元格数据
     */
    Table2DController.prototype.setCellData = function (cellData) {
        cellData.forEach(cell => {
            this._mData.set(`${cell.row_key}.${cell.col_key}`, cell)
        })
    }

    /**
     * 设置公式
     * @param {FormulaConfig[]} aFormulaData 公式配置
     */
    Table2DController.prototype.setFormulaConfigs = function (aFormulaConfig) {
        aFormulaConfig.forEach(f => {
            const sCell = `${f.row_key}.${f.col_key}`
            this._mFormula.set(sCell, {
                formula: f.formula,
                level: -1, // -1 表示未计算/未知层级
                dependencies: this._extractDependencies(f.formula)
            });
        });
        this._calculateLevels()
    }

    /**
     * 提取公式依赖的单元格行列数据
     * @param {string} formula 公式字符串
     * @returns {string[]} 公式依赖项
     */
    Table2DController.prototype._extractDependencies = function (formula) {

        let parts = [];
        let currentPart = "";
        let bracketLevel = 0; // 括号层级计数器

        for (let i = 0; i < formula.length; i++) {
            const char = formula[i];

            if (char === '(') {
                bracketLevel++;
                currentPart += char;
            }
            else if (char === ')') {
                bracketLevel--;
                currentPart += char;
            }
            else if (bracketLevel === 0 && ['+', '-', '*', '/'].includes(char)) {
                if (currentPart.startsWith('(')) {
                    parts = [...parts, ...this._extractDependencies(currentPart.trim().slice(1, -1))]
                } else {
                    parts.push(currentPart.trim());
                }
                currentPart = "";
            }
            else {
                currentPart += char;
            }
        }

        if (currentPart.trim()) {
            if (currentPart.startsWith('(')) {
                parts = [...parts, ...this._extractDependencies(currentPart.trim().slice(1, -1))]
            } else {
                parts.push(currentPart.trim());
            }
        }

        const uniqueItems = new Set(parts);

        return Array.from(uniqueItems);
    }

    /**
     * 优化后的层级计算 (使用 Kahn 算法)
     */
    Table2DController.prototype._calculateLevels = function () {
        const inDegree = new Map(); // 存储每个节点的入度
        const graph = new Map();    // 邻接表: key -> [被依赖的节点列表]
        const allNodes = Array.from(this._mFormula.keys());

        // 初始化
        allNodes.forEach(node => {
            inDegree.set(node, 0);
            graph.set(node, []);
        });

        // 构建图和入度
        allNodes.forEach(node => {
            const info = this._mFormula.get(node);
            info.dependencies.forEach(dep => {
                // 只有当依赖项也是公式时，才建立图关系
                if (this._mFormula.has(dep)) {
                    graph.get(dep).push(node); // dep -> node
                    inDegree.set(node, inDegree.get(node) + 1);
                }
            });
        });

        // 队列：所有入度为 0 的节点 (没有依赖其他公式，或依赖全是静态数据)
        const queue = [];
        allNodes.forEach(node => {
            if (inDegree.get(node) === 0) {
                this._mFormula.get(node).level = 1; // 第一层
                queue.push(node);
            }
        });

        let processedCount = 0;
        while (queue.length > 0) {
            const current = queue.shift();
            processedCount++;
            const currentLevel = this._mFormula.get(current).level;

            // 处理当前节点指向的所有节点
            const neighbors = graph.get(current);
            neighbors.forEach(neighbor => {
                const neighborInfo = this._mFormula.get(neighbor);
                // 更新邻居的层级：max(当前层级，依赖层级 + 1)
                neighborInfo.level = Math.max(neighborInfo.level, currentLevel + 1);

                inDegree.set(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            });
        }

        if (processedCount < allNodes.length) {
            const remaining = allNodes.filter(n => inDegree.get(n) > 0);
            console.error("检测到循环依赖:", remaining);
            throw new Error(`公式存在循环依赖: ${remaining.join(', ')}`);
        }
    };

    /**
     * 执行公式计算
     */
    Table2DController.prototype.excute = function () {
        // 2. 按层级排序公式
        const sortedFormulas = Array.from(this._mFormula.entries()).sort((a, b) => {
            return a[1].level - b[1].level;
        });

        for (const [cellId, info] of sortedFormulas) {
            const calculatedValue = this._evaluateFormula(info.formula);
            const cell = this._mData.get(cellId);
            cell.value = calculatedValue;
            cell.isFormula = true;
            this._mData.set(cellId, cell);
        }

    }

    /**
     * 计算公式
     * @param {string} formulaStr 公式字符串
     * @returns {number} 公式计算结果
     */
    Table2DController.prototype._evaluateFormula = function (formulaStr) {
        const deps = this._extractDependencies(formulaStr);
        deps.sort((a, b) => b.length - a.length);

        let executableStr = formulaStr;

        deps.forEach(dep => {
            let val
            if (isFinite(dep)) {
                val = dep
            } else {
                val = this.getCellValue(dep)
                val = val.value
            }

            if (!val) {
                val = 0
            }

            const regex = new RegExp(`\\b${dep}\\b`, 'g');
            executableStr = executableStr.replace(regex, "(" + val + ")");
        });

        try {
            const result = new Function('return ' + executableStr)();
            if (isNaN(result)) {
                return 0;
            }
            return result;
        } catch (e) {
            console.error(`公式计算失败: ${formulaStr} -> ${executableStr}`, e);
            throw e;
        }
    }

    /**
     * 根据行列更改数据
     * @param {string} row_key 行索引
     * @param {string} col_key 列索引
     * @param {string} value 数据值
     */
    Table2DController.prototype.changeCellValue = function (row_key, col_key, value) {
        const oCell = this._mData.get(`${row_key}.${col_key}`)
        if (oCell) {
            oCell.value = value
        }
    }

    /**
     * 渲染列
     */
    Table2DController.prototype.renderColumn = function () {
        this._setColumns()
    }

    /**
     * 渲染表格到sap.ui.table.Table
     */
    Table2DController.prototype.render = function () {
        const oData = this.getTableData()

        const oExData = this._addExtraData(oData)
        this.oModel.setData(oExData)
    }

    /**
     * 获取表格计算完的数据
     * @returns {Array} 表格数据
     */
    Table2DController.prototype.getTableData = function () {
        this.excute()
        const tableData = []
        this._aRowConfigs.forEach(row => {
            const rowData = {}
            rowData.row_label = {
                label: row.label,
                key: row.key
            }
            this._aColumnConfigs.forEach(col => {
                let cellValue = this.getCellValue(row.key, col.key)
                const sCell = `${row.key}.${col.key}`
                cellValue.isFormula = this._mFormula.has(sCell)
                rowData[col.key] = cellValue
            })
            tableData.push(rowData)
        })
        return tableData
    }

    /**
     * 添加额外的列配置,不可用于计算只能显示文本
     * @param {ExtraColumnConfig} oColumn 列配置
     * @param {number} index 列插入的位置
     */
    Table2DController.prototype.addExtraColumnConfig = function (oExtraColumnConfig, index) {
        this._extraColumnConfig.push({
            index: index,
            key: oExtraColumnConfig.key,
            data: oExtraColumnConfig.data || [],
            label: oExtraColumnConfig.label,
            group: oExtraColumnConfig.group
        })
    }

    /**
     * 添加额外的数据
     * @param {Array} tableData 计算完后的表格数据
     * @returns {Array} 最终表格数据
     */
    Table2DController.prototype._addExtraData = function (tableData) {
        const extradData = []
        tableData.forEach((rowData) => {
            this._extraColumnConfig.forEach((ex) => {
                rowData[ex.key] = {
                    col_key: ex.key,
                    value: ex.data[rowData.row_label.key],
                    row_key: rowData.row_label.key,
                    editable: false
                }
            })
            extradData.push(rowData)
        })
        return extradData
    }

    /**
     * 渲染树形表格 用于sap.ui.table.TreeTable
     */
    Table2DController.prototype.renderForTree = function () {
        this.excute()
        const groupData = this._groupData()
        this.oModel.setData(groupData)
    }

    /**
     * 返回用于TreeTable的分组数据
     * @returns {Array} 表格数据
     */
    Table2DController.prototype._groupData = function () {
        const groupDatas = []
        const exc = this._extraColumnConfig[0]
        exc.group.forEach(group => {
            const groupData = {}
            groupData.groups = []
            groupData[exc.key] = { value: group.label }
            this._extraColumnConfig.slice(1).forEach(ex => {
                const excc = ex.group.find(i => i.key === group.key)
                groupData[ex.key] = { value: excc.label }
            })
            this._aRowConfigs.filter(r => r[exc.key] === group.key).forEach(row => {
                const rowData = {}
                rowData.row_label = {
                    label: row.label,
                    key: row.key
                }
                this._aColumnConfigs.forEach(col => {
                    let cellValue = this.getCellValue(row.key, col.key)
                    const sCell = `${row.key}.${col.key}`
                    cellValue.isFormula = this._mFormula.has(sCell)
                    rowData[col.key] = cellValue
                })
                groupData.groups.push(rowData)
            })
            groupDatas.push(groupData)
        })
        return groupDatas
    }

    /**
     * @param {string} row_key
     * @param {string} [col_key]
     * @returns {string} value
     */
    Table2DController.prototype.getCellValue = function (row_key, col_key) {
        let sCell;
        if (!col_key) {
            sCell = row_key
        } else {
            sCell = `${row_key}.${col_key}`
        }
        return this._mData.get(sCell)
    }

    return Table2DController
});