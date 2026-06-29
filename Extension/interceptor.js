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
    }

    function disableDownloadShelf() {
        try {
            if (chrome.downloads && chrome.downloads.setShelfEnabled) {
                chrome.downloads.setShelfEnabled(false);
            }
        } catch (e) {}
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
        disableDownloadShelf();

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

    disableDownloadShelf();

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        var action = request && request.action;
        if (action === 'openExternalLink') return openExternalLink(request, sendResponse);
        if (action === 'downloadFile') return downloadFile(request, sendResponse);
        return false;
    });
})();
