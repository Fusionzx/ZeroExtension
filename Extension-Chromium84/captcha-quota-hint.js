/**
 * Avisa cuando Google muestra límite de cuota de reCAPTCHA Enterprise en la página.
 * Eso hace que el flujo parezca "atascado" tras marcar el checkbox; no lo arregla el cliente.
 */
(function () {
    'use strict';
    if (typeof Injector !== 'undefined' && Injector.isMainFrame && !Injector.isMainFrame()) return;

    var shown = false;

    function detectQuotaExceeded() {
        try {
            var t = (document.body && document.body.innerText) ? String(document.body.innerText).toLowerCase() : '';
            if (!t) return false;
            var hasRecaptcha = t.indexOf('recaptcha') !== -1 || t.indexOf('soy un robot') !== -1;
            if (!hasRecaptcha && t.indexOf('quota') === -1 && t.indexOf('cuota') === -1) return false;
            if (
                t.indexOf('cuota gratuita') !== -1 ||
                t.indexOf('supera la cuota') !== -1 ||
                t.indexOf('free quota') !== -1 ||
                t.indexOf('exceeds the free') !== -1 ||
                t.indexOf('exceeded its quota') !== -1
            ) {
                return true;
            }
        } catch (e) {}
        return false;
    }

    function showBanner() {
        if (shown || !document.body) return;
        if (document.querySelector('[data-hxd-captcha-quota]')) return;
        shown = true;
        var d = document.createElement('div');
        d.setAttribute('data-hxd-captcha-quota', '1');
        d.style.cssText =
            'position:fixed;z-index:2147483646;left:8px;right:8px;top:8px;max-width:720px;margin:0 auto;padding:12px 14px;' +
            'background:rgba(127,29,29,.96);color:#fff;font:13px/1.45 system-ui,sans-serif;text-align:center;border-radius:8px;' +
            'box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:auto;';
        d.innerHTML =
            '<strong>reCAPTCHA</strong>: el sitio indica <strong>límite de cuota</strong> (Google reCAPTCHA Enterprise). ' +
            'No es un fallo de HaxBall Zero. Probá más tarde o entrá a haxball.com desde el <strong>navegador</strong>.';
        try {
            document.body.appendChild(d);
        } catch (e) {}
    }

    function tick() {
        if (shown) return;
        if (detectQuotaExceeded()) showBanner();
    }

    var n = 0;
    var iv = setInterval(function () {
        tick();
        n++;
        if (shown || n > 120) clearInterval(iv);
    }, 1500);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tick);
    } else {
        tick();
    }
})();
