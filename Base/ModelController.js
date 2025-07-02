/* eslint-disable max-depth */
/* eslint-disable no-param-reassign */
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("app.controller.Base.ModelController", {
        onInit() {
            this._bind();
            this._registerModel();
            this._registerEvent();
            this._onInit();

            this._odata(); //odata的batch方法封装
        },

        /**
         * @protected
         */
        _bind() { },

        /**
         * @protected
         */
        _registerModel() { },//注册model

        /**
         * @protected
         */
        _registerEvent() { },//注册事件

        /**
         * @protected
         */
        _onInit() { },       //其他初始化设置

        /**
         * 获取model
         * @param {string|undefined} [sModelName] model name
         * @returns { sap.ui.model.Model|undefined } model data
         */
        getmodel(sModelName) {
            let oModel = sModelName === "" || sModelName === undefined
                ? this.getView().getModel()
                : this.getView().getModel(sModelName);
            return oModel
                ? oModel
                : this.getOwnerComponent().getModel(sModelName);
        },

        /**
         * 设置model
         * @param {string|undefined} [sModelName] model name
         * @param {sap.ui.model.Model|object|Array} [oModel] model object or js object
         * @param {boolean} [isGlobal] is global model
         * @returns {sap.ui.core.mvc.Controller} this
         */
        setmodel(sModelName, oModel, isGlobal) {
            var model;
            if (oModel instanceof sap.ui.model.Model) {
                model = oModel;
            } else {
                model = new sap.ui.model.json.JSONModel(oModel);
            }
            if (isGlobal === true) {
                return this.getOwnerComponent().setModel(model, sModelName);
            } else {
                return this.getView().setModel(model, sModelName);
            }
        },

        /**
         * 获取model的属性
         * @param {string|undefined} [sModelName] model name
         * @param {string} sPropertyName property name
         * @returns {any} any
         */
        getmodelproperty(sModelName, sPropertyName) {
            const model = this.getmodel(sModelName);
            return model.getProperty(sPropertyName);
        },

        /**
         * 设置model的属性
         * @param {string|undefined} [sModelName] model name
         * @param {string} sPropertyPath property Path
         * @param {any} value value
         * @param {boolean} [bFireChange] ifFireChange
         * @returns {void}
         */
        setmodelproperty(sModelName, sPropertyPath, value, bFireChange) {
            var model = this.getmodel(sModelName);
            if (bFireChange) {
                const allControls = this.getView().findAggregatedObjects(true, (control) => {
                    try {
                        // eslint-disable-next-line fiori-custom/sap-no-ui5base-prop
                        const bindingInfos = control.mBindingInfos;

                        for (let key in bindingInfos) {
                            if (!Reflect.has(bindingInfos, key)) { continue; }
                            var bindingInfo = bindingInfos[key].parts.some((part) => part.path === sPropertyPath
                                && part.model === sModelName);
                            var bindingInfo2 = bindingInfos[key].binding.sPath === sPropertyPath;
                            if (bindingInfo && bindingInfo2) {
                                return true;
                            }
                        }

                        if (control.getBindingContext(sModelName)) {
                            for (let key in bindingInfos) {
                                if (!Reflect.has(bindingInfos, key)) { continue; }
                                var oValue = bindingInfos[key];
                                var bindingInfo3 = oValue.parts.find((part) => part.path === sPropertyPath.split("/")[2]);

                                if (bindingInfo3) {
                                    return oValue.binding.oContext.sPath + "/" + bindingInfo3.path === sPropertyPath;
                                }
                            }
                        }
                        return false;
                    } catch (e) {
                        return false;
                    }
                });
                model.setProperty(sPropertyPath, value);
                allControls.forEach((control) => control.fireEvent("change"));
                return model;
            }
            return model.setProperty(sPropertyPath, value);
        },

        /**
         * 获取model的值
         * @param {string} [sModelName] model name
         * @param {string} [sPath] path
         * @param {sap.ui.model.Filter[]} [aFilters] filters
         * @returns {object|Array} any
         */
        async getmodeldata(sModelName, sPath = "/", aFilters) {
            const oModel = this.getmodel(sModelName);

            if (oModel.isA("sap.ui.model.json.JSONModel")) {
                const bindList = oModel.bindList(sPath, {}, {}, aFilters);
                return bindList.oList;
                // const contexts = bindList.getContexts();
                // return contexts.map((context) => context.getObject());
                // return sPath && sPath !== "/" ? oModel.getData()[sPath.slice(1)] : oModel.getData();
            } else if (oModel.isA("sap.ui.model.odata.v2.ODataModel")) {
                const fGetODatav2 = (aData = [], iSkip = 0) => {
                    return new Promise((resolve, reject) => {
                        oModel.read(sPath, {
                            filters: aFilters ?? [],
                            urlParameters: {
                                "$skip": iSkip,
                                "$format": "json",
                                "$top": "100" // 根据分页限制设置每次请求条目数
                            },
                            success: (oData, oResponse) => {
                                aData = aData.concat(oData.results);
                                if (oData.results.length === 100) {
                                    iSkip += 100;
                                    fGetODatav2(aData, iSkip).then(resolve, reject); // 继续请求下一页数据
                                } else {
                                    resolve(aData);
                                }
                            },
                            error: (error) => {
                                if (error.statusCode === 200 && error.responseText) {
                                    resolve(error.responseText);
                                }
                            }
                        });
                    });
                };
                return await fGetODatav2();
            } else if (oModel.isA("sap.ui.model.odata.v4.ODataModel")) {
                /**@type {sap.ui.model.odata.v4.ODataListBinding} */
                var oContext = oModel.bindList(sPath, undefined, undefined, aFilters);
                const fGetODatav4 = (aData = [], iSkip = 0) => {
                    return new Promise((resolve, reject) => {
                        oContext.requestContexts(iSkip, 100).then(function (aContexts) {
                            aContexts.forEach(function (context) {
                                aData.push(context.getObject());
                            });
                            if (aContexts.length === 100) {
                                iSkip += 100;
                                fGetODatav4(aData, iSkip).then(resolve, reject); // 继续请求下一页数据
                            } else {
                                resolve(aData);
                            }
                        });
                    });
                };
                return await fGetODatav4();
            } else {
                return undefined;
            }
        },

        /**
         * 设置model的值，只支持jsonmodel
         * @param {string} oModelName model name
         * @param {object|Array} oData omodeldata
         * @returns {sap.ui.core.mvc.Controller} this
         */
        setmodeldata(oModelName, oData) {
            var oModel = this.getmodel(oModelName);
            if (oModel.isA("sap.ui.model.json.JSONModel")) {
                oModel.setData(oData);
            }
            return this;
        },

        /**
         * 向JSONModel数组追加数据项
         * @param {string} sModelName 模型名称
         * @param {string} sPath 数组路径（如 "/items"）
         * @param {any} oItem 新增项
         * @returns {sap.ui.core.mvc.Controller} this
         */
        addmodeldata(sModelName, sPath, oItem) {
            const model = this.getmodel(sModelName);
            const currentData = model.getProperty(sPath) || [];
            currentData.push(oItem);
            model.setProperty(sPath, currentData);
            return this;
        },

        /**
         * 根据索引从数组中移除指定项
         * @param {string} sModelName 模型名称
         * @param {string} sPath 数组路径
         * @param {number} iIndex 要删除的索引位置
         * @returns {sap.ui.core.mvc.Controller} this
         */
        popmodeldata: function (sModelName, sPath, iIndex) {
            const model = this.getmodel(sModelName);
            const data = model.getProperty(sPath) || [];
            if (iIndex >= 0 && iIndex < data.length) {
                let poped = data.splice(iIndex, 1);
                model.setProperty(sPath, poped);
            }
            return this;
        },

        /**
         * 对odata的封装，建议使用batch时使用，如果不使用batch，请使用CustomODataModel
         * 已废弃,请使用Model/CustomODataModel
         * @deprecated
         */
        _odata: function () {

            this.odata4 = {
                /**
                 * odata v4 get
                 * @param {string} sModelName model name
                 * @param {string} sPath path
                 * @param {object} mParameter parameter
                 * @param {sap.ui.model.Filter[]} aFilters filters
                 * @returns {Promise<any>} promise
                 */
                GET: function (sModelName, sPath, mParameter, aFilters) {
                    const model = this.getmodel(sModelName);
                    /**@type {sap.ui.model.odata.v4.ODataListBinding} */
                    var oContext = model.bindList(sPath, undefined, undefined, aFilters);
                    return new Promise((resolve, reject) => {
                        oContext.requestContexts().then(function (aContexts) {
                            var aData = [];
                            aContexts.forEach(function (context) {
                                aData.push(context.getObject());
                            });
                            resolve(aData);
                        });
                    });
                }.bind(this)
            };

            this.odata2 = {
                /**
                 * odata v2 get
                 * @param {string} sModelName model name
                 * @param {string} sPath path
                 * @param {object} mParameter parameter
                 * @param {sap.ui.model.Filter[]} aFilters filters
                 * @returns {Promise<any>} promise
                 */
                GET: function (sModelName, sPath, mParameter, aFilters) {
                    const model = this.getmodel(sModelName);
                    return new Promise((resolve, reject) => {
                        model.read(sPath, {
                            filters: aFilters ?? [],
                            urlParameters: mParameter,
                            success: ((oData, oResponse) => {
                                if (oData.results) {
                                    resolve(oData.results);
                                }
                                else {
                                    resolve(oData);
                                }
                            }),
                            error: ((error) => {
                                if (error.statusCode === 200 && error.responseText) {
                                    resolve(error.responseText);
                                } else {
                                    reject(error);
                                }
                            })
                        });
                    });
                }.bind(this),
                /**
                 * odata v2 post
                 * @param {string} sModelName model name
                 * @param {string} sPath path
                 * @param {object} mData data
                 * @param {object} mParameter parameter
                 * @returns {Promise<any>} promise
                 */
                POST: function (sModelName, sPath, mData, mParameter) {
                    const model = this.getmodel(sModelName);
                    return new Promise((resolve, reject) => {
                        model.create(sPath, mData, {
                            urlParameters: mParameter,
                            success: ((oData, oResponse) => {
                                if (oData.results) {
                                    resolve(oData.results);
                                }
                                else {
                                    resolve(oData);
                                }
                            }),
                            error: ((error) => {
                                if (error.statusCode === 200 && error.responseText) {
                                    resolve(error.responseText);
                                } else {
                                    reject(error);
                                }
                            })
                        });
                    });
                }.bind(this),
                /**
                 * odata v2 delete
                 * @param {string} sModelName model name
                 * @param {string} sPath path
                 * @param {object} mParameter parameter
                 * @returns {Promise<any>} promise
                 */
                DELETE: function (sModelName, sPath, mParameter) {
                    const model = this.getmodel(sModelName);
                    return new Promise((resolve, reject) => {
                        model.remove(sPath, {
                            urlParameters: mParameter,
                            success: ((oData, oResponse) => {
                                if (oData.results) {
                                    resolve(oData.results);
                                }
                                else {
                                    resolve(oData);
                                }
                            }),
                            error: ((error) => {
                                if (error.statusCode === 200 && error.responseText) {
                                    resolve(error.responseText);
                                } else {
                                    reject(error);
                                }
                            })
                        });
                    });
                }.bind(this),
                /**
                 * odata v2 put
                 * @param {string} sModelName model name
                 * @param {string} sPath path
                 * @param {object} mData data
                 * @param {object} mParameter parameter
                 * @returns {Promise<any>} promise
                 */
                PUT: function (sModelName, sPath, mData, mParameter) {
                    const model = this.getmodel(sModelName);
                    model.defaultUpdateMethod = "PUT";
                    return new Promise((resolve, reject) => {
                        model.update(sPath, mData, {
                            urlParameters: mParameter,
                            success: ((oData, oResponse) => {
                                if (oData.results) {
                                    resolve(oData.results);
                                }
                                else {
                                    resolve(oData);
                                }
                            }),
                            error: ((error) => {
                                if (error.statusCode === 200 && error.responseText) {
                                    resolve(error.responseText);
                                } else {
                                    reject(error);
                                }
                            })
                        });
                    });
                }.bind(this)
            };
        },

        /**
         * 这个方法的功能是将年传过来的对象里的值转换为对应的值
         * 这个方法会改变原对象，请先拷贝
         * 它可以解析类似{model>/path}这种字符串，并换上对应的值
         * 如果在xmlview中也可以解析带context的格式比如{model>path}
         * @protected
         * @param {object} obj 数据
         * @param {sap.ui.base.Event} oEvent oEvent
         * @returns {void} 
         */
        _processObject(obj, oEvent) {
            const regex = /^\{(\w+)>(.+)\}$/;
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    if (typeof value === "string") {
                        const match = value.match(regex);
                        if (match) {
                            const modelName = match[1];
                            const path = match[2];
                            const model = this.getmodel(modelName);
                            if (!model) {
                                console.warn(`Model ${modelName} not found.`);
                                return;
                            }

                            var fullPath;
                            if (!path.startsWith("/")) {
                                /**@type {sap.ui.core.Control} */
                                let currentControl = oEvent.getSource();
                                let oContext = currentControl.getBindingContext(modelName);
                                fullPath = path;
                                if (oContext) {
                                    const contextPath = oContext.getPath();
                                    fullPath = `${contextPath}/${path}`;
                                }
                            } else {
                                fullPath = path;
                            }
                            obj[key] = model.getProperty(fullPath);
                        }
                    } else if (typeof value === "object" && value !== null) {
                        this._processObject.call(this, value);
                    }
                }
            }
        }
    });
});
