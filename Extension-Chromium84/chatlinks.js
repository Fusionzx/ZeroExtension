// CHAT LINKS - URLs clicables en el chat (estadio, equipo, etc.)
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+\.[^\s<>"']+|(?:discord\.gg|youtu\.be|t\.me|bit\.ly|github\.com|twitter\.com|x\.com|instagram\.com|tiktok\.com|twitch\.tv|open\.spotify\.com)\/[^\s<>"']+)/gi;
    var ROOM_REGEX = /^https?:\/\/(?:www\.)?haxball\.com\/play\?c=([a-zA-Z0-9_-]{8,15})$/;
    var CHAT_ROOT_SELECTORS = '.log-contents, .chatbox-view, .tm-chatpane__msgs, .zip-chat-body';
    var processed = new WeakSet();
    var boundRoots = new WeakSet();

    function resolveLocalApiBase() {
        try {
            if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                return String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/$/, '');
            }
        } catch (e0) {}
        return 'http://127.0.0.1:5483';
    }

    function normalizeHref(url) {
        var u = String(url || '').trim();
        if (!u) return '';
        if (/^https?:\/\//i.test(u)) return u;
        return 'https://' + u;
    }

    function openChatUrl(url) {
        var href = normalizeHref(url);
        if (!href) return;

        var isRoom = ROOM_REGEX.test(href);
        if (isRoom) {
            try {
                window.top.location.href = href;
            } catch (eRoom) {
                window.location.href = href;
            }
            return;
        }

        var openers = [];
        try {
            if (typeof window.__hxdOpenExternalUrl === 'function') openers.push(window.__hxdOpenExternalUrl);
        } catch (e1) {}
        try {
            if (window.top && window.top !== window && typeof window.top.__hxdOpenExternalUrl === 'function') {
                openers.push(window.top.__hxdOpenExternalUrl);
            }
        } catch (e2) {}
        try {
            if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
                openers.push(function(u) { window.electronAPI.openExternal(u); });
            }
        } catch (e3) {}
        try {
            if (window.top && window.top.electronAPI && typeof window.top.electronAPI.openExternal === 'function') {
                openers.push(function(u) { window.top.electronAPI.openExternal(u); });
            }
        } catch (e4) {}

        for (var i = 0; i < openers.length; i++) {
            try {
                openers[i](href);
                return;
            } catch (eOpen) {}
        }

        fetch(resolveLocalApiBase() + '/open-external', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: href })
        }).catch(function() {
            try {
                window.open(href, '_blank', 'noopener,noreferrer');
            } catch (eWin) {}
        });
    }

    function textHasUrl(text) {
        if (!text) return false;
        URL_REGEX.lastIndex = 0;
        return URL_REGEX.test(text);
    }

    function buildLinkParts(text) {
        var parts = [];
        var last = 0;
        var match;
        URL_REGEX.lastIndex = 0;
        while ((match = URL_REGEX.exec(text)) !== null) {
            if (match.index > last) {
                parts.push({ t: text.slice(last, match.index) });
            }
            var url = match[0];
            var href = normalizeHref(url);
            parts.push({ t: url, link: true, room: ROOM_REGEX.test(href), href: href });
            last = match.index + url.length;
        }
        if (parts.length === 0) return null;
        if (last < text.length) parts.push({ t: text.slice(last) });
        return parts;
    }

    function linkifyTextNode(textNode) {
        if (!textNode || !textNode.parentNode) return;
        if (textNode.parentNode.closest && textNode.parentNode.closest('.chat-link')) return;
        var text = textNode.textContent;
        if (!textHasUrl(text)) return;
        var parts = buildLinkParts(text);
        if (!parts) return;
        var parent = textNode.parentNode;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.link) {
                var span = document.createElement('span');
                span.textContent = part.t;
                span.className = part.room ? 'chat-link chat-link-room' : 'chat-link';
                span.dataset.href = part.href;
                span.dataset.room = part.room ? '1' : '0';
                frag.appendChild(span);
            } else {
                frag.appendChild(document.createTextNode(part.t));
            }
        }
        parent.replaceChild(frag, textNode);
    }

    function processMessage(el) {
        if (!el || processed.has(el)) return;
        if (el.querySelector && el.querySelector('.chat-link')) {
            processed.add(el);
            return;
        }
        var text = el.textContent || '';
        if (!textHasUrl(text)) return;
        processed.add(el);

        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (var i = 0; i < nodes.length; i++) linkifyTextNode(nodes[i]);
    }

    function scanRoot(root) {
        if (!root) return;
        var paragraphs = root.querySelectorAll('p, .tm-msg__text');
        for (var i = 0; i < paragraphs.length; i++) processMessage(paragraphs[i]);
    }

    function bindRoot(root) {
        if (!root || boundRoots.has(root)) return;
        boundRoots.add(root);
        scanRoot(root);
        new MutationObserver(function(muts) {
            for (var i = 0; i < muts.length; i++) {
                var nodes = muts[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                    var node = nodes[j];
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'P' || (node.classList && node.classList.contains('tm-msg__text'))) {
                        processMessage(node);
                    } else {
                        scanRoot(node);
                    }
                }
            }
        }).observe(root, { childList: true, subtree: true });
    }

    function attachChatRoots() {
        var roots = document.querySelectorAll(CHAT_ROOT_SELECTORS);
        for (var i = 0; i < roots.length; i++) bindRoot(roots[i]);
    }

    function init() {
        attachChatRoots();
        if (!document.body) {
            setTimeout(init, 200);
            return;
        }
        new MutationObserver(function() {
            attachChatRoots();
        }).observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target || !target.closest) return;

        var linkEl = target.closest('.chat-link');
        if (linkEl && linkEl.dataset && linkEl.dataset.href) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openChatUrl(linkEl.dataset.href);
            return false;
        }

        var inChat = target.closest(CHAT_ROOT_SELECTORS);
        if (!inChat) return;

        var anchor = target.closest('a[href]');
        if (anchor && anchor.href) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openChatUrl(anchor.href);
            return false;
        }
    }, true);

    Injector.injectCSS('chat-links-css', '\
        .chat-link{color:#60a5fa!important;cursor:pointer!important;text-decoration:underline!important}\
        .chat-link:hover{opacity:0.88!important}\
        .chat-link-room{color:#4ade80!important}\
        html[data-theme="light"] .chat-link{color:#2563eb!important}\
        html[data-theme="light"] .chat-link-room{color:#16a34a!important}\
        .log-contents a,.chatbox-view a,.tm-chatpane__msgs a,.zip-chat-body a{\
            color:#60a5fa!important;cursor:pointer!important;text-decoration:underline!important;\
        }\
    ');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
