'use strict';
(function() {
    var __hxdNoop = function() { };
    if (typeof console !== 'undefined') {
        console.log = __hxdNoop;
        console.warn = __hxdNoop;
        console.info = __hxdNoop;
    }

    var BASE_URL = 'http://127.0.0.1:5483';
    var EXTENSION_ORDER = ['core', 'hxd-sync-input-tolerance', 'welcome', 'styles', 'themes', 'hxd-performance', 'header', 'settings', 'discord', 'verified', 'vip', 'roomlist', 'scoreboard', 'smart-extrapolation', 'split-extrapolation', 'jerseykit', 'chatlinks', 'hideui', 'quickavatar', 'hosttoken', 'leaveroom', 'shortcuts', 'chat-expand', 'translate', 'goal-celebration', 'ads', 'security', 'inputboost'];

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

        var nativeRequestAnimationFrame = window.requestAnimationFrame && window.requestAnimationFrame.bind(window);
        var nativeCancelAnimationFrame = window.cancelAnimationFrame && window.cancelAnimationFrame.bind(window);
        if (!nativeRequestAnimationFrame || !nativeCancelAnimationFrame) return;

        var callbacks = {};
        var nextFrameId = 1;
        var nativeHandle = null;
        var timerHandle = null;
        var lastFrameTime = 0;
        var maxSchedulerFps = 240;

        function readEnabled() {
            try {
                return window.localStorage.getItem('hxd_background_frames') !== 'false';
            } catch (e) {
                return true;
            }
        }

        function writeEnabled(enabled) {
            try {
                window.localStorage.setItem('hxd_background_frames', enabled ? 'true' : 'false');
            } catch (e) {}
        }

        function isBackground() {
            return document.hidden || document.visibilityState === 'hidden';
        }

        function isRoomMenuVisible() {
            try {
                return !!window.__hxdRoomMenuVisible;
            } catch (e) {
                return false;
            }
        }

        function hasCallbacks() {
            for (var id in callbacks) {
                if (Object.prototype.hasOwnProperty.call(callbacks, id)) return true;
            }
            return false;
        }

        function getSavedFpsLimit() {
            var fps = 0;
            try {
                fps = parseInt(window.localStorage.getItem('fps_limit'), 10) || 0;
            } catch (e) {}
            if (fps > 0 && fps < 6) {
                fps = [0, 30, 60, 75, 144, 240][fps] || fps;
                try {
                    window.localStorage.setItem('fps_limit', String(fps));
                } catch (eMigrate) {}
            }
            if (fps < 1) fps = 0;
            if (fps > maxSchedulerFps) fps = maxSchedulerFps;
            return fps;
        }

        function getTargetFps() {
            return getSavedFpsLimit() || maxSchedulerFps;
        }

        function useTimerFrame() {
            if (readEnabled() && isBackground()) return true;
            if (isBackground()) return false;
            if (getSavedFpsLimit() > 0) return true;
            return readEnabled() && isRoomMenuVisible();
        }

        function clearNativeFrame() {
            if (nativeHandle === null) return;
            try {
                nativeCancelAnimationFrame(nativeHandle);
            } catch (e) {}
            nativeHandle = null;
        }

        function clearTimerFrame() {
            if (timerHandle === null) return;
            window.clearTimeout(timerHandle);
            timerHandle = null;
        }

        function scheduleFrame() {
            if (!hasCallbacks()) return;

            if (useTimerFrame()) {
                clearNativeFrame();
                if (timerHandle !== null) return;

                var now = window.performance.now();
                if (!lastFrameTime) lastFrameTime = now;
                var interval = 1000 / getTargetFps();
                var delay = Math.max(0, interval - (now - lastFrameTime));

                timerHandle = window.setTimeout(function() {
                    timerHandle = null;
                    runFrame(window.performance.now());
                }, delay);
                return;
            }

            clearTimerFrame();
            if (nativeHandle !== null) return;
            nativeHandle = nativeRequestAnimationFrame(function(now) {
                nativeHandle = null;
                runFrame(now);
            });
        }

        function runFrame(now) {
            now = now || window.performance.now();
            lastFrameTime = now;

            var batch = callbacks;
            callbacks = {};

            for (var id in batch) {
                if (!Object.prototype.hasOwnProperty.call(batch, id)) continue;
                try {
                    batch[id](now);
                } catch (e) {
                    window.setTimeout(function(err) {
                        throw err;
                    }.bind(null, e), 0);
                }
            }

            scheduleFrame();
        }

        window.requestAnimationFrame = function(callback) {
            if (typeof callback !== 'function') {
                return nativeRequestAnimationFrame(callback);
            }
            var id = nextFrameId++;
            callbacks[id] = callback;
            scheduleFrame();
            return id;
        };

        window.cancelAnimationFrame = function(id) {
            delete callbacks[id];
            if (!hasCallbacks()) {
                clearNativeFrame();
                clearTimerFrame();
            }
        };

        document.addEventListener('visibilitychange', function() {
            if (readEnabled() && isBackground()) {
                clearNativeFrame();
            } else {
                clearTimerFrame();
            }
            scheduleFrame();
        }, true);

        window.__hxdBackgroundFrameScheduler = {
            isEnabled: readEnabled,
            setEnabled: function(enabled) {
                writeEnabled(!!enabled);
                if (!enabled) clearTimerFrame();
                scheduleFrame();
            },
            getTargetFps: getTargetFps
        };
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
            if (appendScriptUrl(base + 'game-min-original.js')) return true;
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
