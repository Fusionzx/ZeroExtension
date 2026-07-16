(function() {
    'use strict';

    var runtimeUrl = chrome.runtime.getURL('runtime.js');

    function redirectGameScript(node) {
        if (!node || node.tagName !== 'SCRIPT')
            return;
        var source = node.getAttribute('src') || '';
        if (!source || source === runtimeUrl || !/(^|\/)game-min\.js(?:[?#]|$)/i.test(source))
            return;
        node.setAttribute('src', runtimeUrl);
        node.setAttribute('data-hxd-runtime', '1');
    }

    function scan(root) {
        redirectGameScript(root);
        if (!root || !root.querySelectorAll)
            return;
        var scripts = root.querySelectorAll('script[src]');
        for (var i = 0; i < scripts.length; i++)
            redirectGameScript(scripts[i]);
    }

    scan(document);
    new MutationObserver(function(records) {
        for (var i = 0; i < records.length; i++)
            for (var j = 0; j < records[i].addedNodes.length; j++)
                scan(records[i].addedNodes[j]);
    }).observe(document, {
        childList: true,
        subtree: true
    });
})();
