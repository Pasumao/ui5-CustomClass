sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/util/XMLHelper"
], function (
	ui5Object,
	XMLHelper
) {
	"use strict";

	const LogParser = ui5Object.extend("com.aspn.tools.ybcpi0010.controller.Unit.LogParser", {
	});

	/**
	 * 
	 * @param {string} sContent log
	 * @returns {object} oLog
	 */
	LogParser.detectContent = function (sContent) {
		if (!sContent) { return { _raw: undefined, type: undefined }; }
		if (sContent.startsWith("<")) {
			return { _raw: sContent, type: "xml" };
		}
		try {
			let json = JSON.parse(sContent);
			if (sContent.startsWith("{")) {
				return { _raw: [json], type: "json" };
			} else if (sContent.startsWith("[")) {
				return { _raw: json, type: "json" };
			}
		} catch (e) {
			return { _raw: sContent, type: "text" };
		}
	};

	LogParser.jsonSetName = function (oJson, name) {
		if (Array.isArray(oJson)) {
			oJson.name = name;
			oJson.forEach(item => {
				this.jsonSetName(item);
			});
		} else {
			Object.entries(oJson).forEach(([key, value]) => {
				if (typeof value === "object") {
					this.jsonSetName(value, key);
				}
			});
		}
	};

	LogParser.jsonParse = function (oAttachmentData) {
		oAttachmentData.content = oAttachmentData._raw;
		// oAttachmentData.content.name = "table";
		this.jsonSetName(oAttachmentData.content, "table");
		oAttachmentData._raw = JSON.stringify(oAttachmentData._raw, null, 4);

		return oAttachmentData;
	};

	LogParser.xmlGetRowRoot = function (oXml) {
		return oXml
		if (oXml.children.length > 1) {
			return oXml;
		} else {
			return this.xmlGetRowRoot(oXml.children[0]);
		}
	};

	LogParser.xml2json = function (oXml) {
		var obj;
		if (oXml.children.length !== 0) { // element node
			obj = {};
			var aCill = [...oXml.children];
			if (aCill.every(child => child.nodeName === aCill[0].nodeName)) {
				obj = [];
				obj.name = aCill[0].nodeName;
				aCill.forEach((c) => {
					obj.push(this.xml2json(c));
				});
			} else {
				aCill.forEach(child => {
					const nodeName = child.nodeName;
					obj[nodeName] = this.xml2json(child);
				});
			}
		} else {
			return oXml.textContent.trim();
		}
		return obj;
	};

	LogParser.xmlPrase = function (oAttachmentData) {
		const oXml = XMLHelper.parse(oAttachmentData._raw);

		//如果解析错误
		if (oXml.parseError.errorCode !== 0) {
			oAttachmentData.type = "text";
			oAttachmentData.error = "XML解析错误";
			oAttachmentData.content = oAttachmentData._raw;
			return oAttachmentData;
		}

		const oRowRoot = this.xmlGetRowRoot(oXml);
		// 如果解析错误 - 无法找到列表结构
		if (!oRowRoot) {
			oAttachmentData.type = "text";
			oAttachmentData.error = "XML解析成功，但是无法找到列表结构";
			oAttachmentData.content = oAttachmentData._raw;
			return oAttachmentData;
		}

		oAttachmentData.content = this.xml2json(oRowRoot);
		if (!oAttachmentData.content.name) {
			oAttachmentData.content.name = oRowRoot.nodeName;
		}
		// if (Array.isArray(oAttachmentData.content[0])) {
		// 	let data = JSON.parse(JSON.stringify(oAttachmentData.content[0]));
		// 	let name = oAttachmentData.content.name
		// 	delete oAttachmentData.content
		// 	oAttachmentData.content = [{ [`${data.name}`]: data[0] }];
		// 	oAttachmentData.content["name"] = name;
		// }

		return oAttachmentData;
	};

	LogParser.parse = function (sLog) {
		const oAttachmentData = this.detectContent(sLog);

		let oData;
		if (oAttachmentData.type === "json") {
			oData = this.jsonParse(oAttachmentData);
		} else if (oAttachmentData.type === "xml") {
			oData = this.xmlPrase(oAttachmentData);
		} else {
			return oAttachmentData
		}

		return oData;
	};

	return LogParser;
});