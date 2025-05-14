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
		let data = oAttachmentData._raw;
		let name = "table";

		//如果是数组最外层
		if (Array.isArray(data) && data.length > 0) {
			//如果对象内只有一个属性
			if (Object.keys(data[0]).length === 1) {
				name = Object.keys(data[0])[0];
				if (Array.isArray(data[0][name])) {
					//如果里面是数组
					data = data[0][name];
				} else { //如果里面是对象
					data = data.map(i => i[name]);
				}
			}
		}

		oAttachmentData.content = data;
		this.jsonSetName(oAttachmentData.content, name);
		oAttachmentData._raw = JSON.stringify(oAttachmentData._raw, null, 4);

		return oAttachmentData;
	};

	LogParser.xmlGetRowRoot = function (oXml) {
		if (oXml.nodeName === "#document" && oXml.children.length === 1) {
			return oXml.children[0];
		}
		return oXml;
	};

	LogParser.xml2json = function (oXml, isGetColumns) {
		function isTextNode(oXml) {
			return oXml.childNodes.length > 0
				&& oXml.childNodes[0].nodeName === "#text"
				&& oXml.childNodes.length === 1;
		}

		function isTable3Node(oXml) {
			//首先判断有没有三层结构
			let oChild1, oChild2;
			if (oXml.children.length > 0) {
				oChild1 = oXml.children[0];
				if (oChild1.children.length > 0) {
					oChild2 = oChild1.children[0];
				} else {
					return false;
				}
			} else {
				return false;
			}
			//判断第三层是否有文本节点，如果有那肯定是table3
			if ([...oChild1.children].some(c => isTextNode(c))) {
				return true;
			}
			//如果第二层节点名全部一样且大于1个则为table3
			if (
				[...oXml.children].every(c => c.nodeName === oChild1.nodeName)
				&& [...oXml.children].length > 1
			) {
				return true;
			}
		}

		function isTable2Node(oXml) {
			//首先判断有没有两层结构
			if (!(oXml.children.length > 0)) {
				return false;
			}
			return true;
		}

		if (isTextNode(oXml)) {
			return oXml.childNodes[0].nodeValue
		} else if (isTable3Node(oXml)) {
			let obj = []
			let a = [...oXml.children];
			a.forEach(c => {
				obj.push(this.xml2json(c, true));
			});
			obj.name = oXml.nodeName;
			return obj;
		} else if (isGetColumns) {
			let row = {};
			let a = [...oXml.children];
			a.forEach(c => {
				row[c.nodeName] = this.xml2json(c);
			});
			return row
		} else if (isTable2Node(oXml)) {
			let row = {};
			let a = [...oXml.children];
			a.forEach(c => {
				row[c.nodeName] = this.xml2json(c);
			});
			let obj = [row];
			obj.name = oXml.nodeName;
			return obj
		} else {
			var obj = {};
			var aCill = [...oXml.children];
			if (oXml.children.length !== 0) {
				if (aCill.some(child => child.childNodes.length === 1)) {
					aCill.forEach(child => {
						const nodeName = child.nodeName;
						obj[nodeName] = this.xml2json(child);
					});
					return {
						[oXml.nodeName]: obj
					}
				} else {
					obj[oXml.nodeName] = aCill.map(c => this.xml2json(c));
				}
			} else {
				return oXml.textContent;
			}
			return obj;
		}
	};

	LogParser.formateXml = function (xmlStr) {
		let text = xmlStr;
		//使用replace去空格
		text = '\n' + text.replace(/(<\w+)(\s.*?>)/g, function ($0, name, props) {
			return name + ' ' + props.replace(/\s+(\w+=)/g, " $1");
		}).replace(/>\s*?</g, ">\n<");
		//处理注释
		text = text.replace(/\n/g, '\r').replace(/<!--(.+?)-->/g, function ($0, text) {
			var ret = '<!--' + escape(text) + '-->';
			return ret;
		}).replace(/\r/g, '\n');
		//调整格式  以压栈方式递归调整缩进
		var rgx = /\n(<(([^\?]).+?)(?:\s|\s*?>|\s*?(\/)>)(?:.*?(?:(?:(\/)>)|(?:<(\/)\2>)))?)/mg;
		var nodeStack = [];
		var output = text.replace(rgx, ($0, all, name, isBegin, isCloseFull1, isCloseFull2, isFull1, isFull2) => {
			var isClosed = (isCloseFull1 == '/') || (isCloseFull2 == '/') || (isFull1 == '/') || (isFull2 == '/');
			var prefix = '';
			if (isBegin == '!') {//!开头
				prefix = this.setPrefix(nodeStack.length);
			} else {
				if (isBegin != '/') {///开头
					prefix = this.setPrefix(nodeStack.length);
					if (!isClosed) {//非关闭标签
						nodeStack.push(name);
					}
				} else {
					nodeStack.pop();//弹栈
					prefix = this.setPrefix(nodeStack.length);
				}
			}
			var ret = '\n' + prefix + all;
			return ret;
		});
		var prefixSpace = -1;
		var outputText = output.substring(1);
		//还原注释内容
		outputText = outputText.replace(/\n/g, '\r').replace(/(\s*)<!--(.+?)-->/g, function ($0, prefix, text) {
			if (prefix.charAt(0) == '\r')
				prefix = prefix.substring(1);
			text = unescape(text).replace(/\r/g, '\n');
			var ret = '\n' + prefix + '<!--' + text.replace(/^\s*/mg, prefix) + '-->';
			return ret;
		});
		outputText = outputText.replace(/\s+$/g, '').replace(/\r/g, '\r\n');
		return outputText;
	}

	//计算头函数 用来缩进
	LogParser.setPrefix = function (prefixIndex) {
		var result = '';
		var span = '    ';//缩进长度
		var output = [];
		for (var i = 0; i < prefixIndex; ++i) {
			output.push(span);
		}
		result = output.join('');
		return result;
	}

	LogParser.xmlPrase = function (oAttachmentData) {
		const oXml = XMLHelper.parse(oAttachmentData._raw);

		//如果解析错误
		if (oXml.parseError.errorCode !== 0) {
			oAttachmentData.type = "text";
			oAttachmentData.error = "XML解析错误";
			oAttachmentData.content = oAttachmentData._raw;
			return oAttachmentData;
		}

		//格式化xml文本
		oAttachmentData._raw = this.formateXml(oAttachmentData._raw);

		const oRowRoot = this.xmlGetRowRoot(oXml);
		// 如果解析错误 - 无法找到列表结构
		if (!oRowRoot) {
			oAttachmentData.type = "text";
			oAttachmentData.error = "XML解析成功，但是无法找到列表结构";
			oAttachmentData.content = oAttachmentData._raw;
			return oAttachmentData;
		}

		oAttachmentData.content = this.xml2json(oRowRoot);

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