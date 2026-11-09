'use strict';
(function() {
    var __hxdNoop = function() { };
    if (typeof console !== 'undefined') {
        console.log = __hxdNoop;
        console.warn = __hxdNoop;
        console.info = __hxdNoop;
    }

    var BASE_URL = 'http://127.0.0.1:5483';
    var EXTENSION_ORDER = ['core', 'hxd-sync-input-tolerance', 'welcome', 'styles', 'themes', 'hxd-performance', 'header', 'settings', 'discord', 'verified', 'vip', 'roomlist', 'scoreboard', 'jerseykit', 'chatlinks', 'hideui', 'quickavatar', 'hosttoken', 'leaveroom', 'shortcuts', 'chat-expand', 'translate', 'goal-celebration', 'ads', 'security'];

    function isDesktopRuntime() {
        try {
            return !!(
                window.electronAPI ||
                (window.process && window.process.versions && window.process.versions.electron) ||
                /\bElectron\//i.test(navigator.userAgent || '')
            );
        } catch (e) {}
        return false;
    }

    function extensionBaseUrl() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                var url = chrome.runtime.getURL('');
                try { window.__hxdExtensionBaseUrl = url; } catch (eSetChromeBase) {}
                return url;
            }
            var script = document.currentScript;
            var src = script && script.src ? String(script.src) : '';
            if (src) {
                var base = src.replace(/\/[^\/]*$/, '/');
                try { window.__hxdExtensionBaseUrl = base; } catch (eSetScriptBase) {}
                return base;
            }
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

    function appendScriptUrl(url) {
        if (!url) return false;
        try {
            var script = document.createElement('script');
            script.src = url;
            script.async = false;
            document.documentElement.appendChild(script);
            return true;
        } catch (eUrl) {}
        return false;
    }

    function installBackgroundFrameScheduler() {
        if (window.__hxdBackgroundFrameScheduler) return;
        var nativeRaf = window.requestAnimationFrame.bind(window);
        var nativeCancel = window.cancelAnimationFrame.bind(window);
        var pending = new Map();
        var nextId = 0;
        var maxFps = 60;
        function bgFramesEnabled() {
            try { return localStorage.getItem('hxd_background_frames') !== 'false'; }
            catch (e) { return true; }
        }
        function useTimer() { return document.hidden && bgFramesEnabled(); }
        function cancelEntry(entry) {
            if (entry.timer) window.clearTimeout(entry.handle);
            else nativeCancel(entry.handle);
        }
        function schedule(id, entry) {
            entry.timer = useTimer();
            var generation = entry.generation = (entry.generation || 0) + 1;
            function fire(time) {
                if (pending.get(id) !== entry || entry.generation !== generation) return;
                pending.delete(id);
                entry.cb(time);
            }
            entry.handle = entry.timer
                ? window.setTimeout(function() { fire(window.performance.now()); }, 1000 / maxFps)
                : nativeRaf(fire);
        }
        function migrate() {
            pending.forEach(function(entry, id) {
                if (entry.timer === useTimer()) return;
                cancelEntry(entry);
                schedule(id, entry);
            });
        }
        window.requestAnimationFrame = function(cb) {
            if (typeof cb !== 'function') throw new TypeError('Frame callback must be a function');
            var id = --nextId;
            var entry = { cb: cb };
            pending.set(id, entry);
            schedule(id, entry);
            return id;
        };
        window.cancelAnimationFrame = function(id) {
            var entry = pending.get(id);
            if (!entry) { nativeCancel(id); return; }
            pending.delete(id);
            cancelEntry(entry);
        };
        document.addEventListener('visibilitychange', migrate);
        window.addEventListener('pageshow', migrate);
        window.__hxdBackgroundFrameScheduler = {
            isEnabled: bgFramesEnabled,
            setEnabled: function(value) {
                try { localStorage.setItem('hxd_background_frames', value ? 'true' : 'false'); } catch (e) {}
                migrate();
            },
            getTargetFps: function() { return maxFps; }
        };
    }

    // Carrega o game script do servidor local
    function loadGameScript() {
        if (isDesktopRuntime()) {
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
        }
        var base = extensionBaseUrl();
        if (base) {
            if (appendScriptUrl(base + 'game-min-original.js')) return true;
            var localGame = loadTextSync(base + 'game-min-original.js');
            if (appendScriptText(localGame, base + 'game-min-original.js')) return true;
        }
        return false;
    }
    
    // Carrega as extensões do servidor local
    function loadExtensions() {
        if (isDesktopRuntime()) {
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
        }
        var base = extensionBaseUrl();
        var loaded = false;
        if (base) {
            EXTENSION_ORDER.forEach(function(name) {
                if (appendScriptUrl(base + name + '.js')) {
                    loaded = true;
                    return;
                }
                var source = loadTextSync(base + name + '.js');
                if (appendScriptText(source, base + name + '.js')) loaded = true;
            });
        }
        if (loaded) return true;
        return false;
    }
    
    // Fecha o app
    function closeApp() {
        if (!isDesktopRuntime()) return;
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
    installBackgroundFrameScheduler();
    var gameLoaded = loadGameScript();
    var extLoaded = loadExtensions();
    
    if (!gameLoaded || !extLoaded) {
        function showError() {
            (document.body || document.documentElement).innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a1a;color:#fff;font-family:sans-serif;flex-direction:column;gap:16px;"><h2>Erro ao carregar</h2><p style="color:#888;">Não foi possível conectar ao servidor. O app será fechado.</p></div>';
        }
        if (document.body) { showError(); } else { document.addEventListener('DOMContentLoaded', showError); }
        setTimeout(closeApp, 2000);
    }
})();
