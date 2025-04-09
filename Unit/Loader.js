sap.ui.define([
    "sap/ui/base/Object"
], function (
    Object
) {
    "use strict";

    var Loader = Object.extend("Unit.Loader", {});

    /**
     * 
     * @param {object} oProperty property
     * @returns {void}
     */
    Loader.script = function (oProperty) {

        if (typeof oProperty === "string") {
            oProperty = {
                id: _getId(oProperty),
                src: oProperty
            };
        }

        if (oProperty.id === undefined) {
            oProperty.id = _getId(oProperty.src);
        }

        return new Promise((resolve, reject) => {
            if (document.getElementById(oProperty.id)) {
                resolve();  // 如果库已经加载，直接返回
                return;
            }

            var script = document.createElement("script");
            script.id = oProperty.id;
            script.src = oProperty.src;

            if (oProperty.type) { script.type = oProperty.type; }
            if (oProperty.async) { script.async = oProperty.async; }
            if (oProperty.defer) { script.defer = oProperty.defer; }
            if (oProperty.crossorigin) { script.crossorigin = oProperty.crossorigin; }
            if (oProperty.integrity) { script.integrity = oProperty.integrity; }
            if (oProperty.nomodule) { script.nomodule = oProperty.nomodule; }
            if (oProperty.referrerpolicy) { script.referrerpolicy = oProperty.referrerpolicy; }
            if (oProperty.fetchpriority) { script.fetchpriority = oProperty.fetchpriority; }
            if (oProperty.nonce) { script.nonce = oProperty.nonce; }
            if (oProperty.blocking) { script.blocking = oProperty.blocking }

            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    Loader.link = function (oProperty) {

        if (typeof oProperty === "string") {
            oProperty = {
                id: _getId(oProperty),
                href: oProperty
            };
        }

        if (oProperty.id === undefined) {
            oProperty.id = _getId(oProperty.href);
        }

        return new Promise((resolve, reject) => {
            if (document.getElementById(oProperty.id)) {
                resolve();  // 如果库已经加载，直接返回
                return;
            }

            var link = document.createElement("link");
            link.id = oProperty.id;
            link.href = oProperty.href;

            if (oProperty.rel) { link.rel = oProperty.rel; } else { link.rel = "stylesheet"; }
            if (oProperty.type) { link.type = oProperty.type; } else { link.type = "text/css"; }
            if (oProperty.media) { link.media = oProperty.media; }
            if (oProperty.as) { link.as = oProperty.as; }
            if (oProperty.blocking) { link.blocking = oProperty.blocking; }
            if (oProperty.crossorigin) { link.crossorigin = oProperty.crossorigin; }
            if (oProperty.disabled) { link.disabled = oProperty.disabled; }
            if (oProperty.fetchPriority) { link.fetchPriority = oProperty.fetchPriority; }
            if (oProperty.hreflang) { link.hreflang = oProperty.hreflang; }
            if (oProperty.imageSrcset) { link.imageSrcset = oProperty.imageSrcset; }
            if (oProperty.media) { link.media = oProperty.media; }
            if (oProperty.referrerpolicy) { link.referrerpolicy = oProperty.referrerpolicy; }
            if (oProperty.sizes) { link.sizes = oProperty.sizes; }
            if (oProperty.title) { link.title = oProperty.title; }

            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    };

    Loader.style = function (oProperty) {

        if (typeof oProperty === "string") {
            oProperty = {
                id: _getId(oProperty),
                innerHTML: oProperty,
            };
        }

        if (oProperty.id === undefined) {
            oProperty.id = _getId(oProperty.innerHTML);
        }

        return new Promise((resolve, reject) => {
            if (document.getElementById(oProperty.id)) {
                resolve();  // 如果库已经加载，直接返回
                return;
            }
            var style = document.createElement("style");
            style.id = oProperty.id;
            style.innerHTML = oProperty.innerHTML;

            if (oProperty.blocking) { style.blocking = oProperty.blocking; }
            if (oProperty.media) { style.media = oProperty.media; }
            if (oProperty.nonce) { style.nonce = oProperty.nonce; }
            if (oProperty.title) { style.title = oProperty.title; }

            style.onload = resolve;
            style.onerror = reject;
            document.head.appendChild(style);
        });
    };

    const _getId = (sData) => {
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(sData);

        let latin1String = "";
        for (let i = 0; i < uint8Array.length; i++) {
            latin1String += String.fromCharCode(uint8Array[i]);
        }

        let encodedSrc = btoa(latin1String);
        const suffixLength = Math.min(encodedSrc.length, 32);

        return "Id_" + encodedSrc.slice(-suffixLength);
    };

    return Loader;
});