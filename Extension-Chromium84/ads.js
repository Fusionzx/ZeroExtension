// ============================================
// ADS - Remove propagandas
// ============================================
(function() {
    if (!Injector.isMainFrame()) return;

    // Remove containers conhecidos de ad
    Injector.injectCSS('hxd-ads-block', '\
        .rightbar, .ad-container, .ad-wrapper, .ad-frame, .ad-sidebar,\
        .adsbygoogle, .ads-container, .ad-box, .sponsor-box,\
        iframe[src*="cpmstar"], iframe[src*="doubleclick"],\
        iframe[src*="googlesyndication"], iframe[src*="adservice"],\
        img[src*="cpmstar"], a[href*="cpmstar"],\
        [id*="google_ads"], [id*="adframe"],\
        [data-ad], [data-ads], [data-adunit],\
        .mntl-dynamic-ad, .mntl-gpt-ad, .ad-unit,\
        iframe#adframe, .advertisement, .ads-box {\
            display: none !important;\
            width: 0 !important;\
            height: 0 !important;\
            overflow: hidden !important;\
            opacity: 0 !important;\
            pointer-events: none !important;\
        }\
    ');

    // Observer simples pra remover iframes de propagando que aparecerem depois
    var obs = new MutationObserver(function(muts) {
        for (var mi = 0; mi < muts.length; mi++) {
            var nodes = muts[mi].addedNodes;
            for (var ni = 0; ni < nodes.length; ni++) {
                var n = nodes[ni];
                if (!n || n.nodeType !== 1) continue;
                var candidates = [];
                if (n.matches && n.matches('iframe, img, a')) candidates.push(n);
                if (n.querySelectorAll) {
                    var nested = n.querySelectorAll('iframe, img, a');
                    for (var ci = 0; ci < nested.length; ci++) candidates.push(nested[ci]);
                }
                for (var ai = 0; ai < candidates.length; ai++) {
                    var candidate = candidates[ai];
                    var adUrl = String(candidate.src || candidate.href || '');
                    if (/cpmstar|doubleclick|googlesyndication|googleadservices|moatads/i.test(adUrl)) {
                        candidate.remove();
                    }
                }
            }
        }
    });
    function startObs() { obs.observe(document.body, { childList: true, subtree: true }); }
    if (document.body) startObs(); else Injector.waitForElement('body').then(startObs);

    Injector.log('Ads blocked');
})();
