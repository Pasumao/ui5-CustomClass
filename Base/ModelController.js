/* eslint-disable max-depth */
/* eslint-disable no-param-reassign */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "./ModelControllerFunc"
], function (Controller, ModelControllerFunc) {
    "use strict";

    return Controller.extend("Base.ModelController", {
        ...ModelControllerFunc
    });
});
