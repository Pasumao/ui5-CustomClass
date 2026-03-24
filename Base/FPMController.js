sap.ui.define([
    'sap/fe/core/PageController',
    "./ModelControllerFunc",
    "./BaseControllerFunc"
], function (
    PageController,
    ModelControllerFunc,
    BaseControllerFunc
) {
    "use strict";

    return PageController.extend("Base.BaseController", {
        ...ModelControllerFunc,

        onInit() {
            PageController.prototype.onInit.apply(this, arguments);
            this._bind();
            this._registerModel();
            this._registerEvent();
            this._onInit();

            this._odata(); //odata的batch方法封装
        },

        ...BaseControllerFunc,

        _bind() {           //绑定this的元素
            BaseControllerFunc._bind.apply(this, arguments);
            this.Router = this.getExtensionAPI().getRouting();
        }
    });
});
