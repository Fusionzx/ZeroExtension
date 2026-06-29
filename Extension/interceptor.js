// Intercepta game-min.js e redireciona para runtime.js
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.url.includes('game-min.js')) {
            return { redirectUrl: chrome.runtime.getURL('runtime.js') };
        }
    },
    { urls: ['*://html5.haxball.com/*game-min.js*', '*://www.haxball.com/*game-min.js*'] },
    ['blocking']
);

// Desabilita a shelf de downloads (barra que aparece embaixo)
if (chrome.downloads && chrome.downloads.setShelfEnabled) {
    chrome.downloads.setShelfEnabled(false);
}

// Controle de abas - mantém apenas a aba do HaxBall
var mainTabId = null;

chrome.tabs.query({ url: ['*://www.haxball.com/*', '*://haxball.com/*'] }, function(tabs) {
    if (tabs.length > 0) mainTabId = tabs[0].id;
});

chrome.tabs.onCreated.addListener(function(tab) {
    if (mainTabId === null) {
        chrome.tabs.query({ url: ['*://www.haxball.com/*', '*://haxball.com/*'] }, function(tabs) {
            if (tabs.length > 0) mainTabId = tabs[0].id;
        });
    }
    if (tab.id !== mainTabId) {
        chrome.tabs.remove(tab.id);
    }
});

chrome.windows.onCreated.addListener(function(win) {
    chrome.tabs.query({ windowId: win.id }, function(tabs) {
        var hasMain = tabs.some(function(t) { return t.id === mainTabId; });
        if (!hasMain && win.type !== 'popup') {
            chrome.windows.remove(win.id);
        }
    });
});

// Handler de mensagens do content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Abre link externo
    if (request.action === 'openExternalLink' && request.url) {
        chrome.tabs.create({ url: request.url, active: true });
        sendResponse({ success: true });
    }
    
    // Download de arquivo (replay)
    if (request.action === 'downloadFile') {
        try {
            if (chrome.downloads.setShelfEnabled) {
                chrome.downloads.setShelfEnabled(false);
            }
            
            // Se recebeu base64, converte para data URL
            if (request.base64) {
                var dataUrl = 'data:application/octet-stream;base64,' + request.base64;
                chrome.downloads.download({
                    url: dataUrl,
                    filename: request.filename,
                    saveAs: true
                }, function(downloadId) {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true, downloadId: downloadId });
                    }
                });
            }
            // Se recebeu URL direta (fallback)
            else if (request.url) {
                chrome.downloads.download({
                    url: request.url,
                    filename: request.filename,
                    saveAs: true
                }, function(downloadId) {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true, downloadId: downloadId });
                    }
                });
            }
        } catch (e) {
            sendResponse({ success: false, error: e.message });
        }
        return true; // Mantém o canal aberto para resposta assíncrona
    }
    
    return true;
});
