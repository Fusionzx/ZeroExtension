// Service worker/background da extensao.
// Importante: este arquivo nao pode registrar eventos globais de novas abas
// nem remover abas. O navegador precisa abrir normalmente fora do HaxBall.
(function () {
    'use strict';

    function getManifestVersion() {
        try {
            return chrome.runtime.getManifest().manifest_version;
        } catch (e) {
            return 3;
        }
    }

    // Compatibilidade com builds MV2 antigos. No MV3 o redirect fica em rules.json.
    if (getManifestVersion() === 2 && chrome.webRequest && chrome.webRequest.onBeforeRequest) {
        chrome.webRequest.onBeforeRequest.addListener(
            function (details) {
                var url = String((details && details.url) || '');
                if (/(^|\/)game-min\.js(?:[?#]|$)/i.test(url)) {
                    return { redirectUrl: chrome.runtime.getURL('runtime.js') };
                }
                return {};
            },
            { urls: ['*://*.haxball.com/*game-min.js*', '*://haxball.com/*game-min.js*'] },
            ['blocking']
        );

        chrome.webRequest.onBeforeRequest.addListener(
            function () {
                return { cancel: true };
            },
            {
                urls: [
                    '*://*.cpmstar.com/*',
                    '*://*.doubleclick.net/*',
                    '*://*.googlesyndication.com/*',
                    '*://*.googleadservices.com/*',
                    '*://adservice.google.com/*',
                    '*://*.moatads.com/*',
                    '*://*.pubmatic.com/*',
                    '*://*.rubiconproject.com/*',
                    '*://*.openx.net/*'
                ]
            },
            ['blocking']
        );
    }

    function sendSafe(sendResponse, payload) {
        try {
            if (typeof sendResponse === 'function') sendResponse(payload);
        } catch (e) {}
    }

    function openExternalLink(request, sendResponse) {
        var url = String((request && request.url) || '');
        if (!/^https?:\/\//i.test(url)) {
            sendSafe(sendResponse, { success: false, error: 'Invalid URL' });
            return false;
        }
        chrome.tabs.create({ url: url, active: true }, function (tab) {
            var err = chrome.runtime.lastError;
            sendSafe(sendResponse, err ? { success: false, error: err.message } : { success: true, tabId: tab && tab.id });
        });
        return true;
    }

    function downloadFile(request, sendResponse) {
        var filename = request && request.filename ? String(request.filename) : 'download.bin';
        var url = request && request.url ? String(request.url) : '';
        if (request && request.base64) {
            url = 'data:application/octet-stream;base64,' + request.base64;
        }
        if (!url) {
            sendSafe(sendResponse, { success: false, error: 'Missing download URL' });
            return false;
        }

        chrome.downloads.download({ url: url, filename: filename, saveAs: true }, function (downloadId) {
            var err = chrome.runtime.lastError;
            sendSafe(sendResponse, err ? { success: false, error: err.message } : { success: true, downloadId: downloadId });
        });
        return true;
    }

    function isHaxballUrl(url) {
        try {
            var parsed = new URL(String(url || ''));
            return parsed.hostname === 'haxball.com' ||
                parsed.hostname === 'www.haxball.com' ||
                parsed.hostname === 'html5.haxball.com' ||
                /\.haxball\.com$/i.test(parsed.hostname);
        } catch (e) {
            return false;
        }
    }

    function readTabZoom(tabId, sendResponse) {
        if (typeof tabId !== 'number' || !chrome.tabs || !chrome.tabs.getZoom) {
            sendSafe(sendResponse, { success: false, error: 'Missing tab zoom API' });
            return false;
        }
        chrome.tabs.getZoom(tabId, function (zoomFactor) {
            var err = chrome.runtime.lastError;
            sendSafe(sendResponse, err
                ? { success: false, error: err.message }
                : { success: true, zoomFactor: Number(zoomFactor) || 1 });
        });
        return true;
    }

    function publishTabZoom(tabId, zoomFactor) {
        try {
            chrome.tabs.sendMessage(tabId, {
                action: 'hxdPageZoomChanged',
                zoomFactor: Number(zoomFactor) || 1
            }, function () {
                void chrome.runtime.lastError;
            });
        } catch (e) {}
    }

    // Bloqueia requisicoes para redes de anuncio
    function setupAdBlocking() {
        if (typeof chrome.declarativeNetRequest !== 'object') return;
        var adRules = [
            { id: 1001, filter: '||cpmstar.com^' },
            { id: 1002, filter: '||doubleclick.net^' },
            { id: 1003, filter: '||googlesyndication.com^' },
            { id: 1004, filter: '||googleadservices.com^' },
            { id: 1005, filter: '||adservice.google.com^' },
            { id: 1006, filter: '||moatads.com^' },
            { id: 1007, filter: '||pubmatic.com^' },
            { id: 1008, filter: '||rubiconproject.com^' },
            { id: 1009, filter: '||openx.net^' }
        ];
        var rules = adRules.map(function(r) {
            return {
                id: r.id,
                priority: 1,
                action: { type: 'block' },
                condition: {
                    urlFilter: r.filter,
                    resourceTypes: ['image', 'sub_frame', 'script', 'xmlhttprequest', 'other']
                }
            };
        });
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: adRules.map(function(r) { return r.id; }),
            addRules: rules
        }, function() {
            var err = chrome.runtime.lastError;
            if (err) console.warn('DNR addRules error:', err.message);
        });
    }

    setupAdBlocking();

    if (chrome.tabs && chrome.tabs.onZoomChange) {
        chrome.tabs.onZoomChange.addListener(function (info) {
            if (!info || typeof info.tabId !== 'number') return;
            chrome.tabs.get(info.tabId, function (tab) {
                if (chrome.runtime.lastError || !tab || !isHaxballUrl(tab.url)) return;
                publishTabZoom(info.tabId, info.newZoomFactor);
            });
        });
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        var action = request && request.action;
        if (action === 'openExternalLink') return openExternalLink(request, sendResponse);
        if (action === 'downloadFile') return downloadFile(request, sendResponse);
        if (action === 'getPageZoom') {
            return readTabZoom(sender && sender.tab ? sender.tab.id : null, sendResponse);
        }
        return false;
    });
})();
