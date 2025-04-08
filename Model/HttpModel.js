sap.ui.define([
    "sap/ui/model/Model"
], function (
    Model
) {
    "use strict";

    /**
     * @class
     * @extends sap.ui.model.Model
     * @alias CustomModel.HttpModel
     */
    const HttpModel = Model.extend("com.aspn.tools.ybcpi0070.ext.CustomModel.HttpModel", {
        metadata: {
            properties: {
                vServiceUrl: { type: "string" }
            },
            publicMethods: ["GET", "POST", "DELETE", "PUT", "PATCH"]
        },

        constructor: function (vServiceUrl) {
            Model.apply(this, arguments);
            if (vServiceUrl.endsWith("/")) {
                vServiceUrl = vServiceUrl.slice(0, -1);
            }
            this.vServiceUrl = vServiceUrl;
        }
    });

    /**
     * @typedef {Object} RequestParam 请求参数类型
     * @property {Object<string, any>} [urlParameters] - URL查询参数，键值对自动编码为URL参数
     * @property {Object} [context] - 绑定请求的上下文对象
     * 
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
     * @property {Object<string|object|Array>} [body] - 返回体
     * @property {Headers} headers - HTTP请求头配置
     * @property {string} status - HTTP状态码
     * @property {string} statusText - HTTP状态码文本
     * @property {string} url - 请求URL
     * @property {string} type - 请求类型
     * @property {boolean} redirected - 是否重定向
     * @property {boolean} ok - 请求是否成功
     */

    /**
     * 发送GET请求
     * @public
     * @param {string} sPath 请求路径
     * @param {RequestParam} [mParameters] 请求参数
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype.getProperty = async function (sPath, mParameters) {
        return await this.GET(sPath, mParameters);
    };

    /**
     * 发送GET请求
     * @public
     * @param {string} sPath 请求路径
     * @param {RequestParam} [mParameters] 请求参数
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype.GET = async function (sPath, mParameters) {
        return await this._handleRequest("GET", sPath, undefined, mParameters);
    };

    /**
     * 发送POST请求
     * @public
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {RequestParam} [mParameters] 请求参数
     * @returns {Promise<object>} 请求结果
     */
    HttpModel.prototype.POST = async function (sPath, oData, mParameters) {
        return await this._handleRequest("POST", sPath, oData, mParameters);
    };

    /**
     * 发送DELETE请求
     * @public
     * @param {string} sPath 请求路径
     * @param {RequestParam} [mParameters] 请求参数
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype.DELETE = async function (sPath, mParameters) {
        return await this._handleRequest("DELETE", sPath, undefined, mParameters);
    };

    /**
     * 发送PUT请求
     * @public
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {RequestParam} [mParameters] 请求参数
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype.PUT = async function (sPath, oData, mParameters) {
        return await this._handleRequest("PUT", sPath, oData, mParameters);
    };

    /**
     * 发送PATCH请求
     * @public
     * @param {string} sPath 请求路径
     * @param {object} oData 请求体
     * @param {RequestParam} [mParameters] 请求参数
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype.PATCH = async function (sPath, oData, mParameters) {
        return await this._handleRequest("PATCH", sPath, oData, mParameters);
    };

    /**
     * 处理请求
     * @protected
     * @param {string} method 方法
     * @param {string} sPath 路径
     * @param {object} oData 请求体
     * @param {RequestParam} mParameters 请求参数
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype._handleRequest = async function (method, sPath, oData, mParameters) {
        let sUrl = this.vServiceUrl + this.resolve(sPath, mParameters?.context);

        if (mParameters?.urlParameters) {
            //使用`URLSearchParams`处理URL参数，确保参数编码符合标准
            const searchParams = new URLSearchParams();
            Object.entries(mParameters?.urlParameters).forEach(([k, v]) => { searchParams.append(k, v); });
            sUrl += `?${searchParams}`;
        }

        const shouldIncludeBody = method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && oData !== null && oData !== undefined;
        let bodyValue;
        if (shouldIncludeBody) {
            bodyValue = typeof oData === "object" ? JSON.stringify(oData) : oData;
        } else {
            bodyValue = undefined;
        }

        let fetchParams = {
            headers: mParameters?.headers || {},
            body: bodyValue,
            method: method,
            mode: mParameters?.mode || undefined,
            credentials: mParameters?.credentials || undefined,
            cache: mParameters?.cache || undefined,
            redirect: mParameters?.redirect || undefined,
            referrer: mParameters?.referrer || undefined,
            referrerPolicy: mParameters?.referrerPolicy || undefined,
            integrity: mParameters?.integrity || undefined
        };

        const oRequest = {
            url: sUrl,
            param: fetchParams
        };

        //当发送JSON数据时自动添加`Content-Type: application/json`头
        if (shouldIncludeBody && typeof oData === "object") {
            oRequest.param.headers["Content-Type"] = "application/json";
        }

        return this.sendRequest(oRequest);
    };

    /**
     * 发送请求
     * @protected
     * @param {object} oRequest 请求对象
     * @returns {Promise<RequestReturn>} 返回值
     */
    HttpModel.prototype.sendRequest = async function (oRequest) {
        try {
            const req = await fetch(oRequest.url, oRequest.param);
            const data = await req.clone().json().catch(() => req.text());

            if (!req.ok) {
                //throw new Error(`HTTP error! Status: ${req.status}, Data: ${data}`);
                console.log(`HTTP error! Status: ${req.status}, Data: ${data}`)
            }

            return {
                body: data,
                status: req.status,
                headers: req.headers,
                ok: req.ok,
                redirected: req.redirected,
                statysText: req.statusText,
                url: req.url,
                type: req.type,
                bodyUsed: req.bodyUsed,
            };
        } catch (error) {
            throw new Error(`HTTP request failed: ${error.message}`);
        }
    };

    return HttpModel;
});