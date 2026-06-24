// Bloqueia apenas interacoes do reCAPTCHA, sem quebrar o menu nativo dos jogadores.
(function() {
    'use strict';

    function isRecaptchaDocument() {
        var host = String(window.location.hostname || '').toLowerCase();
        var href = String(window.location.href || '').toLowerCase();
        return host.indexOf('google.com') !== -1 ||
            host.indexOf('gstatic.com') !== -1 ||
            href.indexOf('recaptcha') !== -1;
    }

    function isRecaptchaTarget(target) {
        var current = target;
        while (current && current !== document.body) {
            if (current.tagName === 'IFRAME') {
                var src = String(current.getAttribute('src') || '').toLowerCase();
                var title = String(current.getAttribute('title') || '').toLowerCase();
                if (src.indexOf('recaptcha') !== -1 || title.indexOf('recaptcha') !== -1) {
                    return true;
                }
            }

            if (current.id && String(current.id).toLowerCase().indexOf('recaptcha') !== -1) return true;

            if (current.classList) {
                if (current.classList.contains('g-recaptcha') || current.classList.contains('grecaptcha-badge')) {
                    return true;
                }

                for (var i = 0; i < current.classList.length; i++) {
                    if (String(current.classList[i]).toLowerCase().indexOf('recaptcha') !== -1) {
                        return true;
                    }
                }
            }

            current = current.parentElement;
        }
        return false;
    }

    document.addEventListener('contextmenu', function(e) {
        if (!isRecaptchaDocument() && !isRecaptchaTarget(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);

    // Bloqueia links do reCAPTCHA (Privacy, Terms) para nao abrir no cliente.
    document.addEventListener('click', function(e) {
        var target = e.target;

        while (target && target.tagName !== 'A') {
            target = target.parentElement;
        }

        if (!target || !target.href) return;
        if (!isRecaptchaDocument() && !isRecaptchaTarget(target)) return;

        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
})();
