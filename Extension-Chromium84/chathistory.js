// ============================================
// CHAT HISTORY — Flecha ↑ / ↓ recupera mensajes enviados en el chat de partida
// (solo si el autocompletado @ no está visible; si no, sigue el comportamiento del juego)
// ============================================
(function () {
    if (typeof Injector !== 'undefined' && Injector.isMainFrame && Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var MAX = 100;
    var lines = [];
    /** null = redactando nuevo; número = offset desde el último enviado (0 = más reciente) */
    var nav = null;
    var scratch = '';

    function isChatInput(el) {
        return (
            el &&
            el.tagName === 'INPUT' &&
            el.getAttribute('data-hook') === 'input' &&
            !!el.closest('.chatbox-view')
        );
    }

    function autoCompleteHidden(input) {
        var box = input.closest('.chatbox-view');
        if (!box) return true;
        var ac = box.querySelector('[data-hook="autocompletebox"]');
        return !ac || ac.hidden;
    }

    function pushSent(text) {
        var t = String(text || '').trim();
        if (!t) return;
        if (lines.length && lines[lines.length - 1] === t) return;
        lines.push(t);
        if (lines.length > MAX) lines.shift();
    }

    function setVal(input, v) {
        input.value = v;
        try {
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {}
        try {
            var n = String(v || '').length;
            input.setSelectionRange(n, n);
        } catch (e2) {}
    }

    document.addEventListener(
        'keydown',
        function (e) {
            if (!e || !isChatInput(e.target)) return;
            var input = e.target;

            if (e.key === 'Enter' && !e.shiftKey) {
                var pending = String(input.value || '').trim();
                if (!pending) return;
                var el = input;
                window.setTimeout(function () {
                    if (String(el.value || '').trim() === '') {
                        pushSent(pending);
                        nav = null;
                        scratch = '';
                    }
                }, 0);
                return;
            }

            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            if (!autoCompleteHidden(input)) return;

            if (e.key === 'ArrowUp') {
                if (!lines.length) return;
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                if (nav === null) {
                    scratch = input.value;
                    nav = 0;
                } else if (nav < lines.length - 1) nav++;
                setVal(input, lines[lines.length - 1 - nav]);
                return;
            }

            if (nav === null) return;
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            if (nav === 0) {
                nav = null;
                setVal(input, scratch);
            } else {
                nav--;
                setVal(input, lines[lines.length - 1 - nav]);
            }
        },
        true
    );
})();
