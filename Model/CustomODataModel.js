sap.ui.define([
    "./HttpModel",
    "sap/ui/util/XMLHelper"
], function (
    HttpModel,
    XMLHelper
) {
    "use strict";

    /**
     * @class CustomODataModel
     */
    const CustomODataModel = HttpModel.extend("Model.CustomODataModel", {
        metadata: {
        },

        constructor: function (vServiceUrl) {
            HttpModel.apply(this, arguments);
            this._refreshToken();
        }
    });

    /**
     * 刷新CSRF令牌
     * @private
     * @returns {Promise<void>} 无返回值
     */
    CustomODataModel.prototype._refreshToken = async function () {
        await this._req("HEAD", "/", {}, {
            headers: {
                "x-csrf-token": "Fetch"
            }
        });
    };

    /**
     * @typedef {object} RequestParam 请求参数类型
     * @property {Record<string, any>} [urlParameters] - URL查询参数，键值对自动编码为URL参数
     * @property {Object} [context] - 绑定请求的上下文对象
     * @property {AbortSignal} [signal] - 请求信号
     * @property {Object<string, string>} [headers] - HTTP请求头配置（Fetch headers）
     * @property {string} [mode] - 请求模式，默认为`cors`
     * @property {string} [credentials] - 身份验证模式，默认为`omit`（可选值：omit/same-origin/include）
     * @property {string} [cache] - 缓存模式，默认为`default`（可选值：no-store/reload/force-cache/network-only）
     * @property {string} [integrity] - SRI 完整性校验字符串（如 `sha256-...`）
     * @property {string} [referrer] - 请求来源，默认为`no-referrer`
     * @property {string} [referrerPolicy] - 请求来源策略，默认为`no-referrer-when-downgrade`
     * @property {string} [redirect] - 重定向模式，默认为`follow`（可选值：manual/error/follow）
     */

    /**
     * @typedef {Object} RequestReturn 请求返回值类型
     * @property {string|object|Array} [body] - 返回体
     * @property {Headers} headers - HTTP请求头配置
     * @property {string} status - HTTP状态码
     * @property {object} [error] - 错误信息
     * @property {string} error.message - 错误信息
     * @property {string} error.code - 错误码
     * @property {string} statusText - HTTP状态码文本
     * @property {string} url - 请求URL
     * @property {string} type - 请求类型
     * @property {boolean} redirected - 是否重定向
     * @property {boolean} ok - 请求是否成功
     */

    /**
     * 发送GET请求
     * @param {string} sPath 路径
     * @param {object} [oParameters] 参数 RequestParam
     * @returns {Promise<Array|string>} 请求结果
     */
    CustomODataModel.prototype.GET = async function (sPath, oParameters) {
        const oReq = await this._req("GET", sPath, undefined, oParameters);
        if (oReq.error) {
            return oReq.error;
        }
        if (oReq.body.d) {
            return oReq.body.d.results;
        }
        return oReq.body;
    };

    /**
     * 发送POST请求
     * @public
     * @override
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {object} [oParameters] 请求参数
     * @returns {Promise<RequestReturn>} 请求结果
     */
    CustomODataModel.prototype.POST = async function (sPath, oData, oParameters) {
        const oReq = await this._req("POST", sPath, oData, oParameters);
        if (oReq.error) {
            return oReq.error;
        }
        return oReq;
    };

    /**
     * 发送DELETE请求
     * @public
     * @override
     * @param {string} sPath 请求路径
     * @param {object} [oParameters] 请求参数
     * @returns {Promise<RequestReturn>} 请求结果
     */
    CustomODataModel.prototype.DELETE = async function (sPath, oParameters) {
        const oReq = await this._req("DELETE", sPath, undefined, oParameters);
        if (oReq.error) {
            return oReq.error;
        }
        return oReq;
    };

    /**
     * 发送PUT请求
     * @public
     * @override
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {object} [oParameters] 请求参数
     * @returns {Promise<RequestReturn>} 请求结果
     */
    CustomODataModel.prototype.PUT = async function (sPath, oData, oParameters) {
        const oReq = await this._req("PUT", sPath, oData, oParameters);
        if (oReq.error) {
            return oReq.error;
        }
        return oReq;
    };

    /**
     * 发送PATCH请求
     * @public
     * @override
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {object} [oParameters] 请求参数
     * @returns {Promise<RequestReturn>} 请求结果
     */
    CustomODataModel.prototype.PATCH = async function (sPath, oData, oParameters) {
        const oReq = await this._req("PATCH", sPath, oData, oParameters);
        if (oReq.error) {
            return oReq.error;
        }
        return oReq;
    };

    /**
     * 对_handleRequest的封装，主要处理了odata服务的报错解析
     * @param {string} sMethod 请求方法
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {RequestParam} oParameters 请求参数 
     * @returns {Promise<RequestReturn>} return
     */
    CustomODataModel.prototype._req = async function (sMethod, sPath, oData, oParameters) {
        const oReq = await this._handleRequest(sMethod, sPath, oData, oParameters);
        const xml = XMLHelper.parse(oReq.body);
        // eslint-disable-next-line fiori-custom/sap-no-hardcoded-url
        const namespace = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata";
        // 使用命名空间查询错误节点
        const errorNodes = xml.getElementsByTagNameNS(namespace, "error");
        if (errorNodes.length > 0) {
            // 获取错误节点
            const errorNode = xml.getElementsByTagNameNS(namespace, "error")[0];

            // 获取子元素内容（注意也需要处理命名空间）
            const codeNode = errorNode.getElementsByTagNameNS(namespace, "code")[0];
            const messageNode = errorNode.getElementsByTagNameNS(namespace, "message")[0];

            oReq.error = {
                code: codeNode ? codeNode.textContent : "",
                message: messageNode ? messageNode.textContent : ""
            };
        }
        return oReq;
    };

    return CustomODataModel;
});