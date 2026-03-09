/* eslint-disable max-depth */
sap.ui.define([
	"./ModelController",
	"./BaseControllerFunc"
], function (
	ModelController,
	BaseControllerFunc
) {
	"use strict";

	return ModelController.extend("Base.BaseController", {
		...BaseControllerFunc
	});
});
