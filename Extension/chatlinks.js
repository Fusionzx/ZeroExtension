// CHAT LINKS - Destaca URLs no chat (sem criar links clicáveis)
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+\.[^\s<>"']+)/g;
    var ROOM_REGEX = /^https?:\/\/(?:www\.)?haxball\.com\/play\?c=([a-zA-Z0-9_-]{8,15})$/;
    var processed = new WeakSet();

    function processMessage(p) {
        if (processed.has(p)) return;
        processed.add(p);
        
        var text = p.textContent;
        if (!text || (text.indexOf('http') === -1 && text.indexOf('www.') === -1)) return;
        
        var parts = [];
        var last = 0;
        var match;
        
        URL_REGEX.lastIndex = 0;
        while ((match = URL_REGEX.exec(text)) !== null) {
            if (match.index > last) {
                parts.push({ t: text.slice(last, match.index) });
            }
            var url = match[0];
            var href = url.indexOf('http') === 0 ? url : 'https://' + url;
            var isRoom = ROOM_REGEX.test(href);
            parts.push({ t: url, link: true, room: isRoom, href: href });
            last = match.index + url.length;
        }
        
        if (parts.length === 0) return;
        if (last < text.length) {
            parts.push({ t: text.slice(last) });
        }
        
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
        
        p.textContent = '';
        p.appendChild(frag);
    }

    function init() {
        var log = document.querySelector('.log-contents');
        if (!log) { setTimeout(init, 300); return; }
        
        // Processa existentes
        var msgs = log.getElementsByTagName('p');
        for (var i = 0; i < msgs.length; i++) processMessage(msgs[i]);
        
        // Observer para novas mensagens
        new MutationObserver(function(muts) {
            for (var i = 0; i < muts.length; i++) {
                var nodes = muts[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                    if (nodes[j].tagName === 'P') processMessage(nodes[j]);
                }
            }
        }).observe(log, { childList: true });
        
        // Handler de clique nos links do chat
        log.addEventListener('click', function(e) {
            var t = e.target;
            
            // Se clicou em nosso span de link
            if (t.classList && t.classList.contains('chat-link')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                var href = t.dataset.href;
                var isRoom = t.dataset.room === '1';
                
                if (isRoom) {
                    // Link de sala - navega
                    window.top.location.href = href;
                } else if (typeof window.__hxdOpenExternalUrl === 'function') {
                    window.__hxdOpenExternalUrl(href);
                } else {
                    navigator.clipboard.writeText(href).catch(function() {});
                    t.style.opacity = '0.5';
                    setTimeout(function() {
                        t.style.opacity = '';
                    }, 300);
                }
                return false;
            }
        }, true);
    }

    // Bloqueia TODOS os cliques em <a> dentro do chat (captura)
    document.addEventListener('click', function(e) {
        var t = e.target;
        if (t.tagName === 'A') {
            var inChat = t.closest('.log-contents') || t.closest('.chatbox-view');
            if (inChat) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }
    }, true);

    Injector.injectCSS('chat-links-css', '\
        .chat-link{color:#60a5fa!important;cursor:pointer!important}\
        .chat-link:hover{text-decoration:underline!important}\
        .chat-link-room{color:#4ade80!important}\
        body[data-theme="light"] .chat-link{color:#2563eb!important}\
        body[data-theme="light"] .chat-link-room{color:#16a34a!important}\
        .log-contents a,.chatbox-view a{pointer-events:none!important;color:inherit!important;text-decoration:none!important}\
    ');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
