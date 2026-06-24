'use strict';
(function() {
    var __hxdNoop = function() { };
    if (typeof console !== 'undefined') {
        console.log = __hxdNoop;
        console.warn = __hxdNoop;
        console.error = __hxdNoop;
        console.info = __hxdNoop;
    }

    var BASE_URL = 'http://127.0.0.1:5483';
    var EXTENSION_ORDER = ['core', 'hxd-sync-input-tolerance', 'welcome', 'styles', 'themes', 'hxd-performance', 'header', 'settings', 'discord', 'verified', 'vip', 'friends', 'teams', 'roomlist', 'jerseykit', 'chatlinks', 'hideui', 'quickavatar', 'hosttoken', 'leaveroom', 'shortcuts', 'chat-expand', 'translate', 'goal-celebration', 'ads', 'security', 'autoupdate', 'inputboost'];

    function extensionBaseUrl() {
        try {
            var script = document.currentScript;
            var src = script && script.src ? String(script.src) : '';
            if (src) return src.replace(/\/[^\/]*$/, '/');
        } catch (e0) {}
        return '';
    }

    function loadTextSync(url) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.send();
            if (xhr.status === 200 || xhr.status === 0) return xhr.responseText;
        } catch (e1) {}
        return null;
    }

    function appendScriptText(source, label) {
        if (!source) return false;
        try {
            var script = document.createElement('script');
            script.textContent = source + (label ? '\n//# sourceURL=' + label : '');
            document.documentElement.appendChild(script);
            return true;
        } catch (e2) {}
        return false;
    }
    
    // Carrega o game script do servidor local
    function loadGameScript() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', BASE_URL + '/secure/game-script', false);
            xhr.send();
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.script) {
                    return appendScriptText(response.script, 'haxball-zero://secure/game-script');
                }
            }
        } catch (e) {}
        var base = extensionBaseUrl();
        if (base) {
            var localGame = loadTextSync(base + 'game-min-original.js');
            if (appendScriptText(localGame, base + 'game-min-original.js')) return true;
        }
        return false;
    }
    
    // Carrega as extensões do servidor local
    function loadExtensions() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', BASE_URL + '/secure/extensions', false);
            xhr.send();
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.scripts) {
                    EXTENSION_ORDER.forEach(function(name) {
                        if (response.scripts[name]) {
                            appendScriptText(response.scripts[name], 'haxball-zero://secure/extensions/' + name + '.js');
                        }
                    });
                    return true;
                }
            }
        } catch (e) {}
        var base = extensionBaseUrl();
        var loaded = false;
        if (base) {
            EXTENSION_ORDER.forEach(function(name) {
                var source = loadTextSync(base + name + '.js');
                if (appendScriptText(source, base + name + '.js')) loaded = true;
            });
        }
        if (loaded) return true;
        return false;
    }
    
    // Fecha o app
    function closeApp() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', BASE_URL + '/close', false);
            xhr.send();
        } catch (e) {}
    }
    
    // Handler de downloads - escuta mensagens da página e envia pro background
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'haxball-download-request') {
            var data = event.data.data;
            var filename = event.data.filename;
            
            // Converte ArrayBuffer para base64 para enviar via chrome.runtime.sendMessage
            var bytes = new Uint8Array(data);
            var binary = '';
            for (var i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            var base64 = btoa(binary);
            
            // Envia pro background script fazer o download com saveAs
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    action: 'downloadFile',
                    base64: base64,
                    filename: filename
                });
            }
        }
    });
    
    // Carrega scripts
    var gameLoaded = loadGameScript();
    var extLoaded = loadExtensions();
    
    if (!gameLoaded || !extLoaded) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a1a;color:#fff;font-family:sans-serif;flex-direction:column;gap:16px;"><h2>Erro ao carregar</h2><p style="color:#888;">Não foi possível conectar ao servidor. O app será fechado.</p></div>';
        setTimeout(closeApp, 2000);
    }
})();
