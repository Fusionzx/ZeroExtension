// ============================================
// CHAT EXPAND — atajos tipo Discord (:sob:) + mappings SHORTCUTS
// ============================================
(function () {
    'use strict';
    if (typeof Injector !== 'undefined' && Injector.isMainFrame() && !Injector.isGameDocument()) return;
    if (!Injector.isGameFrame()) return;

    /** Estilo Discord (subset); desconocidos se dejan como :nombre: */
    var DISCORD_EMOJI = {
        sob: '\uD83D\uDE2D',
        joy: '\uD83D\uDE02',
        rofl: '\uD83E\uDD23',
        skull: '\uD83D\uDC80',
        fire: '\uD83D\uDD25',
        thumbsup: '\uD83D\uDC4D',
        thumbsdown: '\uD83D\uDC4E',
        heart: '\u2764\uFE0F',
        broken_heart: '\uD83D\uDC94',
        rage: '\uD83D\uDE21',
        sunglasses: '\uD83D\uDE0E',
        thinking: '\uD83E\uDD14',
        ok_hand: '\uD83D\uDC4C',
        wave: '\uD83D\uDC4B',
        flushed: '\uD83D\uDE33',
        cold_face: '\uD83E\uDD76',
        melting_face: '\uD83E\uDEE0'
    };

    function expandDiscordEmoji(text) {
        return String(text || '').replace(/:([a-zA-Z0-9_+-]+):/g, function (_all, name) {
            var key = String(name || '').toLowerCase();
            var em = DISCORD_EMOJI[key];
            return em != null ? em : ':' + name + ':';
        });
    }

    function normalizeShortcutList(raw) {
        var list = [];
        try {
            list = JSON.parse(raw || '[]');
        } catch (e1) {
            list = [];
        }
        if (!Array.isArray(list)) list = [];
        var out = [];
        for (var i = 0; i < list.length; i++) {
            var row = list[i];
            if (!row) continue;
            var tr = String(row.trigger || '').trim();
            var ex = String(row.expansion || '').trim();
            if (!tr || !ex) continue;
            out.push({ trigger: tr, expansion: ex });
        }
        out.sort(function (a, b) {
            return String(b.trigger).length - String(a.trigger).length;
        });
        return out;
    }

    function processOutgoingChat(raw) {
        var s = String(raw || '');
        var t = s.trim();
        var list = normalizeShortcutList(localStorage.getItem('hax_chat_command_shortcuts'));
        for (var i = 0; i < list.length; i++) {
            if (t === list[i].trigger) {
                s = list[i].expansion;
                break;
            }
        }
        return expandDiscordEmoji(s);
    }

    document.addEventListener(
        'keydown',
        function (e) {
            if (e.key !== 'Enter') return;
            var el = e.target;
            if (!el || el.tagName !== 'INPUT') return;
            try {
                if (el.getAttribute('data-hook') !== 'input') return;
            } catch (ex) {
                return;
            }
            if (!el.closest || !el.closest('.chatbox-view')) return;
            var v = el.value;
            if (v == null || !String(v).trim()) return;
            var next = processOutgoingChat(v);
            if (next !== v) {
                el.value = next;
            }
        },
        true
    );

    Injector.log('Chat expand loaded');
})();
