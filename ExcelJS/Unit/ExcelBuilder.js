sap.ui.define([
    "./SheetJS",
], function (
    SheetJS,
) {
    "use strict";

    return {
        build: async function (mParameters) {
            // 1. 准备数据：提取 JSON 数据源
            const jsonData = mParameters.dataSource.data;

            // 2. 准备表头：将 columns 数组转换为表头对象数组
            // SheetJS 需要 [{ label: 'Name', key: 'name' }, ...] 格式来定义表头
            const headers = mParameters.workbook.columns.map(col => ({
                label: col.label,
                key: col.property
            }));

            // 3. 创建工作表
            // 使用 json_to_sheet 并传入 headers 配置，确保列的顺序和名称正确
            const worksheet = XLSX.utils.json_to_sheet(jsonData, { header: headers });

            // 4. 创建工作簿并添加工作表
            const workbook = XLSX.utils.book_new();
            // 这里默认命名为 "Sheet1"，也可以从 mParameters 中获取名称
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

            // 5. 导出为 Buffer (Node.js 环境)
            // 如果是浏览器环境，通常使用 XLSX.writeFile(workbook, "filename.xlsx")
            return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
        }
    }
});