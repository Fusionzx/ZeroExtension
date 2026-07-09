// ============================================
// ADS - Remove propagandas
// ============================================
(function() {
    if (!Injector.isMainFrame()) return;

    // CSS para esconder containers de ad conhecidos
    var AD_CSS = '\
        .rightbar, .ad-container, .ad-wrapper, .ad-frame, .ad-sidebar,\
        .adsbygoogle, .ads-container, .ad-box, .sponsor-box,\
        iframe[src*="cpmstar"], iframe[src*="doubleclick"], iframe[src*="googlesyndication"],\
        iframe[src*="adservice"], iframe[src*="adserver"], iframe[src*="adsystem"],\
        iframe[id*="google_ads"], iframe[id*="adframe"],\
        [id*="ad-container"], [class*="ad-container"],\
        [data-ad], [data-ads], [data-adunit],\
        .gpt-ad, .dfp-ad, .carbonad, .adunit,\
        img[src*="cpmstar"], a[href*="cpmstar"] {\
            display: none !important;\
            width: 0 !important;\
            height: 0 !important;\
            overflow: hidden !important;\
            opacity: 0 !important;\
            pointer-events: none !important;\
        }\
    ';

    Injector.injectCSS('hxd-ads-block', AD_CSS);

    // Observer pra remover iframes/popups de ad assim que surgirem
    var adObserver = new MutationObserver(function(muts) {
        for (var mi = 0; mi < muts.length; mi++) {
            var nodes = muts[mi].addedNodes;
            for (var ni = 0; ni < nodes.length; ni++) {
                var node = nodes[ni];
                if (!node || node.nodeType !== 1) continue;
                // Remove iframes de ad
                if (node.tagName === 'IFRAME' && node.src && /cpmstar|doubleclick|googlesyndication|adservice/i.test(node.src)) {
                    node.remove();
                    continue;
                }
                // Checa filhos
                var adIframes = node.querySelectorAll && node.querySelectorAll('iframe[src*="cpmstar"], iframe[src*="doubleclick"], iframe[src*="googlesyndication"], iframe[src*="adservice"]');
                if (adIframes) {
                    for (var fi = 0; fi < adIframes.length; fi++) {
                        adIframes[fi].remove();
                    }
                }
            }
        }
    });
    if (document.body) {
        adObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        Injector.waitForElement('body').then(function() {
            adObserver.observe(document.body, { childList: true, subtree: true });
        });
    }

    Injector.log('Ads blocked');
})();
