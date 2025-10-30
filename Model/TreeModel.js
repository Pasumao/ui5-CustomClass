/* eslint-disable no-param-reassign */
sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function (
    JSONModel
) {
    "use strict";

    const TreeModel = JSONModel.extend("app.controller.Model.TreeModel", {
        metadata: {
            publicMethods: ["getNode", "getNodeParent", "getNodeProperty", "getNodeIdPathArray",
                "getNodePath", "addChild", "setNodeProperty", "removeNode"]
        }
    });

    /**
     * 返回对应ID的NODE对象
     * @public
     * @param {number} targetId ID
     * @param {object} [oTreeData] 递归用不要传值
     * @returns {object|undefined} object
     */
    TreeModel.prototype.getNode = function (targetId, oTreeData = this.getData()) {
        for (let i = 0; i < oTreeData.length; i++) {
            const node = oTreeData[i];
            if (node.id === targetId) { return node; }
            if (node.children && node.children.length > 0) {
                const foundNode = this.getNode(targetId, node.children);
                if (foundNode) { return foundNode; }
            }
        }
        return undefined;
    };

    /**
     * 返回对应ID的NODE对象的父节点对象
     * @public
     * @param {number} targetId id
     * @param {object} [oTreeData] 递归用不要传值
     * @param {object} [parentNode] 递归用不要传值
     * @returns {object|undefined} object
     */
    TreeModel.prototype.getNodeParent = function (targetId, oTreeData = this.getData(), parentNode) {
        if (!targetId) { return undefined; }
        for (let i = 0; i < oTreeData.length; i++) {
            const node = oTreeData[i];
            if (node.id === targetId) { return parentNode; }
            if (node.children && node.children.length > 0) {
                const foundNode = this.getNodeParent(targetId, node.children, node);
                if (foundNode) { return foundNode; }
            }
        }
        return undefined;
    };

    /**
     * 返回对应ID的NODE对象的指定属性值
     * @public
     * @param {number} targetId id
     * @param {string} property proptery
     * @returns {any} return
     */
    TreeModel.prototype.getNodeProperty = function (targetId, property) {
        const oNode = this.getNode(targetId);
        if (oNode) {
            return oNode[property];
        }
        return undefined;
    };

    /**
     * 返回对应ID的NODE对象的路径ID数组
     * @public
     * @param {number} targetId id
     * @param {object} [oTreeData] 递归用不要传值
     * @param {array} [path] 递归用不要传值
     * @returns {array|undefined} return
     */
    TreeModel.prototype.getNodeIdPathArray = function (targetId, oTreeData = this.getData(), path = []) {
        for (let node of oTreeData) {
            path.push(node.id);
            if (node.id === targetId) { return path; }
            if (node.children && node.children.length > 0) {
                let result = this.getNodeIdPathArray(targetId, node.children, path);
                if (result) { return result; }
            }
            path.pop();
        }
        return undefined;
    };

    /**
     * 返回对应ID的NODE对象的路径字符串
     * @public
     * @param {number} targetId id
     * @param {object} [oTreeData] 递归用不要传值
     * @param {string} [sPath] 递归用不要传值
     * @returns {string|undefined} return
     */
    TreeModel.prototype.getNodePath = function (targetId, oTreeData = this.getData(), sPath = "") {
        for (let i = 0; i < oTreeData.length; i++) {
            sPath = sPath + "/" + i;
            if (oTreeData[i].id === targetId) { return sPath; }
            if (oTreeData[i].children && oTreeData[i].children.length > 0) {
                sPath = sPath + "/children";
                const foundPath = this.getNodePath(targetId, oTreeData[i].children, sPath);
                if (foundPath) { return foundPath; }
            }
            sPath = sPath.slice(0, sPath.lastIndexOf("/children"));
            sPath = sPath.slice(0, sPath.lastIndexOf("/"));
        }
        return undefined;
    };

    /**
     * 给对应节点添加一个子节点
     * @public
     * @param {number} targetId id
     * @param {object} oNode oNode
     * @returns {this} this
     */
    TreeModel.prototype.addChild = function (targetId, oNode) {
        const parentNode = this.getNode(targetId);
        if (parentNode) {
            parentNode.children.push(oNode);
            this.setNodeProperty(targetId, "children", parentNode.children);
            return this;
        }
        var odata = this.getData();
        odata.push(oNode);
        this.setData(odata);
        return this;
    };

    /**
     * 设置对应ID的NODE对象的指定属性值
     * @public
     * @param {number} targetId id
     * @param {string} property property
     * @param {any} value value
     * @returns {this|undefined} this
     */
    TreeModel.prototype.setNodeProperty = function (targetId, property, value) {
        const node = this.getNode(targetId);
        if (node) {
            node[property] = value;
            const sPath = this.getNodePath(targetId);
            var bSuccess = this.setProperty(sPath, node);
            if (bSuccess) { return this; }
        }
        return undefined;
    };

    /**
     * 删除对应ID的NODE对象
     * @public
     * @param {number} targetId id
     */
    TreeModel.prototype.removeNode = function (targetId) {
        const parentNode = this.getNodeParent(targetId);
        if (parentNode) {
            const index = parentNode.children.findIndex(node => node.id === targetId);
            if (index >= 0) {
                parentNode.children.splice(index, 1);
                this.setNodeProperty(parentNode.id, "children", parentNode.children);
            }
        }
        var odata = this.getData();
        var index = odata.findIndex(node => node.id === targetId);
        if (index >= 0) {
            odata.splice(index, 1);
            this.setData(odata);
        }
    };


    return TreeModel;
});