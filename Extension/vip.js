// ============================================
// PRO - Sistema de usuários Pro
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var API_BASE = 'http://127.0.0.1:5483';
    var proStatus = null;
    var proSettings = null;

    function t(key) { return window.__t ? window.__t(key) : key; }

    function escapeAttr(v) {
        return String(v || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;');
    }

    function isProInpanelPopup(popup) {
        return !!(popup && popup.getAttribute && popup.getAttribute('data-pro-inpanel') === '1');
    }

    var PRO_BANNERS = {
        'none': { name: 'Nenhum', gradient: 'none' },
        'gold': { name: 'Ouro', gradient: 'linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,193,7,0.25) 50%, rgba(255,215,0,0.15) 100%)' },
        'diamond': { name: 'Diamante', gradient: 'linear-gradient(90deg, rgba(185,242,255,0.15) 0%, rgba(0,191,255,0.25) 50%, rgba(185,242,255,0.15) 100%)' },
        'fire': { name: 'Fogo', gradient: 'linear-gradient(90deg, rgba(255,69,0,0.15) 0%, rgba(255,140,0,0.25) 50%, rgba(255,69,0,0.15) 100%)' },
        'emerald': { name: 'Esmeralda', gradient: 'linear-gradient(90deg, rgba(0,201,87,0.15) 0%, rgba(80,200,120,0.25) 50%, rgba(0,201,87,0.15) 100%)' },
        'purple': { name: 'Roxo', gradient: 'linear-gradient(90deg, rgba(138,43,226,0.15) 0%, rgba(186,85,211,0.25) 50%, rgba(138,43,226,0.15) 100%)' },
        'rainbow': { name: 'Arco-íris', gradient: 'linear-gradient(90deg, rgba(255,0,0,0.2) 0%, rgba(255,127,0,0.2) 17%, rgba(255,255,0,0.2) 33%, rgba(0,255,0,0.2) 50%, rgba(0,127,255,0.2) 67%, rgba(139,0,255,0.2) 83%, rgba(255,0,0,0.2) 100%)' },
        'neon': { name: 'Neon', gradient: 'linear-gradient(90deg, rgba(57,255,20,0.15) 0%, rgba(0,255,255,0.25) 50%, rgba(57,255,20,0.15) 100%)' },
        'sunset': { name: 'Pôr do Sol', gradient: 'linear-gradient(90deg, rgba(255,94,77,0.15) 0%, rgba(255,154,0,0.25) 50%, rgba(255,94,77,0.15) 100%)' },
        'ocean': { name: 'Oceano', gradient: 'linear-gradient(90deg, rgba(0,105,148,0.15) 0%, rgba(0,168,232,0.25) 50%, rgba(0,105,148,0.15) 100%)' },
        'midnight': { name: 'Meia-noite', gradient: 'linear-gradient(90deg, rgba(25,25,112,0.2) 0%, rgba(72,61,139,0.3) 50%, rgba(25,25,112,0.2) 100%)' },
        'cherry': { name: 'Cereja', gradient: 'linear-gradient(90deg, rgba(222,49,99,0.15) 0%, rgba(255,105,180,0.25) 50%, rgba(222,49,99,0.15) 100%)' },
        'custom': { name: 'Personalizado', gradient: 'none' }
    };
    window.__proBanners = PRO_BANNERS;

    var PRO_FONTS = {
        'default': { name: 'Padrão', family: 'Space Grotesk' },
        'roboto': { name: 'Roboto', family: 'Roboto' },
        'poppins': { name: 'Poppins', family: 'Poppins' },
        'montserrat': { name: 'Montserrat', family: 'Montserrat' },
        'oswald': { name: 'Oswald', family: 'Oswald' },
        'raleway': { name: 'Raleway', family: 'Raleway' },
        'ubuntu': { name: 'Ubuntu', family: 'Ubuntu' },
        'quicksand': { name: 'Quicksand', family: 'Quicksand' },
        'comfortaa': { name: 'Comfortaa', family: 'Comfortaa' },
        'righteous': { name: 'Righteous', family: 'Righteous' },
        'orbitron': { name: 'Orbitron', family: 'Orbitron' },
        'pressstart': { name: 'Press Start 2P', family: 'Press Start 2P' }
    };
    window.__proFonts = PRO_FONTS;

    var PRO_BALL_EFFECTS = {
        'none': { name: 'Normal' },
        'rgb': { name: 'RGB' },
        'rainbow': { name: 'Rainbow' },
        'fire': { name: 'Fuego' },
        'ocean': { name: 'Oceano' },
        'sunset': { name: 'Sunset' },
        'neon': { name: 'Neon' },
        'gold': { name: 'Gold' },
        'custom': { name: 'Personalizado' }
    };
    window.__proBallEffects = PRO_BALL_EFFECTS;

    function applyProSnapshotFromStorage() {
        try {
            var snap = JSON.parse(localStorage.getItem('haxclient_pro_snapshot') || 'null');
            if (snap && (snap.is_pro || snap.is_vip)) {
                proStatus = { is_pro: !!snap.is_pro, is_vip: !!snap.is_vip };
                window.__proStatus = proStatus;
                return true;
            }
        } catch (e) {}
        return false;
    }

    function loadProStatus() {
        return fetch(API_BASE + '/vip/status').then(function(r) { return r.json(); }).then(function(data) {
            proStatus = data;
            window.__proStatus = data;
            window.__vipStatus = { is_vip: data.is_vip || data.is_pro };
            try {
                if (data.is_pro || data.is_vip) {
                    localStorage.setItem(
                        'haxclient_pro_snapshot',
                        JSON.stringify({
                            is_pro: !!data.is_pro,
                            is_vip: !!data.is_vip,
                            at: Date.now()
                        })
                    );
                } else {
                    localStorage.removeItem('haxclient_pro_snapshot');
                    if (window.__hxdClearProCustomSoundsLocal) {
                        try {
                            window.__hxdClearProCustomSoundsLocal();
                        } catch (eClr) {}
                    }
                }
            } catch (eSnap) {
                if (!(data.is_pro || data.is_vip) && window.__hxdClearProCustomSoundsLocal) {
                    try {
                        window.__hxdClearProCustomSoundsLocal();
                    } catch (eClr0) {}
                }
            }
            return data;
        }).catch(function() {
            if (applyProSnapshotFromStorage()) {
                window.__vipStatus = { is_vip: !!(proStatus && proStatus.is_vip) };
                return proStatus;
            }
            if (proStatus && (proStatus.is_pro || proStatus.is_vip)) {
                window.__proStatus = proStatus;
                window.__vipStatus = { is_vip: !!(proStatus.is_vip || proStatus.is_pro) };
                return proStatus;
            }
            proStatus = { is_pro: false, is_vip: false };
            window.__proStatus = proStatus;
            window.__vipStatus = { is_vip: false };
            return proStatus;
        });
    }

    function attachDiscordIdToBody(body) {
        var o = body && typeof body === 'object' ? Object.assign({}, body) : {};
        try {
            var id = typeof window !== 'undefined' && window.__haxDiscordId ? String(window.__haxDiscordId).trim() : '';
            if (id) o.discord_id = id;
        } catch (e) {}
        return o;
    }

    function loadProSettings() {
        return fetch(API_BASE + '/vip/settings').then(function(r) { return r.json(); }).then(function(data) {
            var cached = window.__proSettings;
            if (!cached) {
                try { cached = JSON.parse(localStorage.getItem('haxclient_pro_settings') || 'null') || null; } catch(e) {}
            }
            proSettings = Object.assign({}, cached || {}, data || {});
            window.__proSettings = proSettings;
            try { localStorage.setItem('haxclient_pro_settings', JSON.stringify(proSettings)); } catch(e) {}
            if (window.__refreshVerifiedBadges) window.__refreshVerifiedBadges();
            if (window.__refreshProBanners) window.__refreshProBanners();
            if (window.__refreshProFonts) window.__refreshProFonts();
            return proSettings;
        }).catch(function() {
            var fallback = window.__proSettings;
            if (!fallback) {
                try { fallback = JSON.parse(localStorage.getItem('haxclient_pro_settings') || 'null') || null; } catch(e) {}
            }
            proSettings = fallback || {};
            window.__proSettings = proSettings;
            return proSettings;
        });
    }

    function saveProSettings(settings) {
        return fetch(API_BASE + '/vip/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attachDiscordIdToBody(settings))
        }).then(function(r) {
            return r.json().then(function(data) {
                if (!r.ok) {
                    return { success: false, error: (data && data.error) || r.statusText || 'HTTP ' + r.status };
                }
                if (isProSettingsSaveResponseOk(data)) {
                    proSettings = Object.assign({}, proSettings, settings);
                    window.__proSettings = proSettings;
                    try { localStorage.setItem('haxclient_pro_settings', JSON.stringify(proSettings)); } catch(e) {}
                    if (window.__hxdInvalidateProSettingsCache) {
                        try { window.__hxdInvalidateProSettingsCache(); } catch (eInv) {}
                    }
                    if (window.__hxdSyncLocalPersonalizationCache) {
                        try {
                            window.__hxdSyncLocalPersonalizationCache();
                        } catch (eSync) {}
                    }
                    if (window.__refreshVerifiedBadges) window.__refreshVerifiedBadges();
                    if (window.__refreshProBanners) window.__refreshProBanners();
                    if (window.__refreshProFonts) window.__refreshProFonts();
                }
                return data;
            });
        });
    }

    function openPaymentPage() {
        // Desabilitado - pagamento não disponível
    }

    function closePopup() {
        var overlay = document.getElementById('pro-popup-overlay');
        if (overlay) overlay.remove();
    }

    /** Cuando el panel Pro está embebido en la roomlist (iframe), el cierre no usa el overlay del documento principal. */
    var proInpanelContext = null;

    function clearProInpanelContext() {
        proInpanelContext = null;
    }

    function closeProUi() {
        if (proInpanelContext && proInpanelContext.iframeDoc) {
            var doc = proInpanelContext.iframeDoc;
            proInpanelContext = null;
            if (window.__hxdCloseProInpanel) {
                try {
                    window.__hxdCloseProInpanel(doc);
                } catch (eIn) {}
            }
            return;
        }
        closePopup();
    }

    function renderProIntoInpanel(iframeDoc, proWrap) {
        var content = proWrap && proWrap.querySelector('#pro-inpanel-content');
        if (!content || !iframeDoc) return;
        if (window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode()) {
            if (typeof window.showToast === 'function') {
                window.showToast(t('Anonymous mode block pro'), 'info', 2800);
            }
            return;
        }
        proInpanelContext = { iframeDoc: iframeDoc, proWrap: proWrap };
        content.innerHTML = '';
        var popup = iframeDoc.createElement('div');
        popup.className = 'prx-popup-root prx-popup-root--inpanel';
        popup.style.cssText = 'display:flex;flex-direction:column;width:100%;min-height:0;flex:1;box-sizing:border-box;';
        popup.setAttribute('data-pro-inpanel', '1');
        content.appendChild(popup);
        renderProPopupLoading(popup, false);
        popup.style.minHeight = '0';
        loadProStatus().then(function(status) {
            if (status.is_pro || status.is_vip) {
                renderProContent(popup, status);
            } else {
                renderNonProContent(popup);
            }
        }).catch(function() {
            var fallback = proStatus || window.__proStatus || { is_pro: false, is_vip: false };
            if (fallback.is_pro || fallback.is_vip) {
                renderProContent(popup, fallback);
            } else {
                renderNonProContent(popup);
            }
        });
    }

    var PRO_POPUP_LOAD_GEAR_SVG =
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="3"/>' +
        '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' +
        '</svg>';

    function bindProPopupCloseButton(popup) {
        var btn = popup.querySelector('#pro-close-btn');
        if (btn) {
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeProUi();
            };
        }
    }

    /** Mientras /vip/status, settings y /user — engranaje + “Cargando Perfil...” */
    function renderProPopupLoading(popup, subtitleKey) {
        var inpanel = isProInpanelPopup(popup);
        if (inpanel) {
            popup.style.minHeight = '0';
            popup.innerHTML =
                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:140px;gap:14px;padding:28px 20px 24px;box-sizing:border-box;">' +
                '<span class="hxd-loading-gear" style="color:rgba(255,255,255,0.92);display:inline-flex;">' + PRO_POPUP_LOAD_GEAR_SVG + '</span>' +
                '<span class="pro-popup-load-msg" style="color:#aaa;font-size:15px;font-weight:500;text-align:center;"></span>' +
                (subtitleKey
                    ? '<span class="pro-popup-load-sub" style="color:#666;font-size:12px;line-height:1.45;text-align:center;max-width:340px;"></span>'
                    : '') +
                '</div>';
            var msgEl2 = popup.querySelector('.pro-popup-load-msg');
            if (msgEl2) msgEl2.textContent = t('Cargando Perfil...');
            if (subtitleKey) {
                var subEl2 = popup.querySelector('.pro-popup-load-sub');
                if (subEl2) subEl2.textContent = t(subtitleKey);
            }
            return;
        }
        popup.style.minHeight = '320px';
        popup.innerHTML =
            '<div style="padding:20px 28px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="color:#fff;font-size:20px;font-weight:600;">Pro</span>' +
            '<button type="button" id="pro-close-btn" style="background:none;border:none;color:#555;cursor:pointer;padding:4px;display:flex;transition:color 0.15s;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button></div>' +
            '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:240px;gap:16px;padding:32px 24px;box-sizing:border-box;">' +
            '<span class="hxd-loading-gear" style="color:rgba(255,255,255,0.92);display:inline-flex;">' + PRO_POPUP_LOAD_GEAR_SVG + '</span>' +
            '<span class="pro-popup-load-msg" style="color:#aaa;font-size:15px;font-weight:500;text-align:center;"></span>' +
            (subtitleKey
                ? '<span class="pro-popup-load-sub" style="color:#666;font-size:12px;line-height:1.45;text-align:center;max-width:340px;"></span>'
                : '') +
            '</div>';
        var msgEl = popup.querySelector('.pro-popup-load-msg');
        if (msgEl) msgEl.textContent = t('Cargando Perfil...');
        if (subtitleKey) {
            var subEl = popup.querySelector('.pro-popup-load-sub');
            if (subEl) subEl.textContent = t(subtitleKey);
        }
        bindProPopupCloseButton(popup);
        var xb = popup.querySelector('#pro-close-btn');
        if (xb) {
            xb.onmouseenter = function() { xb.style.color = '#fff'; };
            xb.onmouseleave = function() { xb.style.color = '#555'; };
        }
    }

    function showProPopup() {
        if (window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode()) {
            if (typeof window.showToast === 'function') {
                window.showToast(t('Anonymous mode block pro'), 'info', 2800);
            }
            return;
        }
        clearProInpanelContext();
        closePopup();
        var overlay = document.createElement('div');
        overlay.id = 'pro-popup-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10001;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        var popup = document.createElement('div');
        popup.className = 'prx-popup-root';
        popup.style.cssText =
            'background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:10px;width:min(420px,96vw);max-width:96vw;max-height:90vh;min-height:0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.55);';
        renderProPopupLoading(popup, false);
        loadProStatus().then(function(status) {
            if (status.is_pro || status.is_vip) {
                renderProContent(popup, status);
            } else {
                renderNonProContent(popup);
            }
        }).catch(function() {
            var fallback = proStatus || window.__proStatus || { is_pro: false, is_vip: false };
            if (fallback.is_pro || fallback.is_vip) {
                renderProContent(popup, fallback);
            } else {
                renderNonProContent(popup);
            }
        });
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopup(); });
        document.addEventListener('keydown', function escH(e) { if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', escH); } });
    }

    function openHaxzeroDiscord() {
        if (typeof window.__hxdOpenExternalUrl === 'function') {
            window.__hxdOpenExternalUrl('https://discord.gg/haxzero');
            return;
        }
        var url = 'https://discord.gg/haxzero';
        fetch(API_BASE + '/open-external', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        }).catch(function() {
            try {
                window.open(url, '_blank', 'noopener,noreferrer');
            } catch (e) {}
        });
    }

    /** Lista de beneficios + precio + Discord (estilo oscuro con barra verde tipo asistente Equipo). */
    function renderNonProContent(popup) {
        var inpanelNp = isProInpanelPopup(popup);

        var icPalette =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.6"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/><circle cx="17.66" cy="17.66" r="2" fill="#22c55e" stroke="none"/></svg>';
        var icChat =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
        var icVerified =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>';
        var icTeam =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>';
        var icSpark =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.6"><path d="M12 3v4M12 17v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M3 12h4M17 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3" fill="#22c55e" stroke="none"/></svg>';

        function benefitRow(iconSvg, textKey) {
            return (
                '<div style="display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<span style="flex-shrink:0;margin-top:1px;opacity:0.95;">' +
                iconSvg +
                '</span>' +
                '<span style="color:#b8b8b8;font-size:13px;line-height:1.45;">' +
                escapeAttr(t(textKey)) +
                '</span></div>'
            );
        }

        var padX = inpanelNp ? '14px' : '18px';
        var stepsLine =
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px ' +
            padX +
            ' 0;gap:10px;">' +
            '<div style="flex:1;height:3px;border-radius:999px;background:linear-gradient(90deg,#22c55e,#16a34a);opacity:0.95;"></div>' +
            '<span style="flex-shrink:0;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#86efac;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);padding:4px 8px;border-radius:999px;">PRO</span>' +
            '</div>';

        var innerTitle = inpanelNp
            ? '<div style="color:#fff;font-size:14px;font-weight:700;margin-bottom:10px;letter-spacing:-0.02em;">' +
              escapeAttr(t('Pro upsell title')) +
              '</div>'
            : '';

        var headerHtml = inpanelNp
            ? ''
            : '<div style="padding:16px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
                '<span style="color:#fff;font-size:18px;font-weight:600;">Pro</span>' +
                '<button id="pro-close-btn" type="button" style="background:none;border:none;color:#6b7280;cursor:pointer;padding:4px;display:flex;border-radius:6px;">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
                '</button></div>';

        var bodyWrap =
            '<div style="padding:14px 18px 20px;max-height:min(78vh,560px);overflow-y:auto;box-sizing:border-box;">' +
            innerTitle +
            '<p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0 0 4px;">' +
            escapeAttr(t('Pro upsell short')) +
            '</p>' +
            '<div style="margin:14px 0 6px;">' +
            benefitRow(icPalette, 'Pro benefit row 1') +
            benefitRow(icChat, 'Pro benefit row 2') +
            benefitRow(icVerified, 'Pro benefit row 3') +
            benefitRow(icTeam, 'Pro benefit row 4') +
            benefitRow(icSpark, 'Pro benefit row 5') +
            '</div>' +
            '<div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:14px;margin-top:4px;">' +
            '<div style="color:#fff;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:0.02em;">' +
            escapeAttr(t('Pro price line')) +
            '</div>' +
            '<p style="color:#888;font-size:11px;line-height:1.45;margin:10px 0 6px;">' +
            escapeAttr(t('Pro discord only note')) +
            '</p>' +
            '<div style="color:#93c5fd;font-size:12px;font-weight:600;margin-bottom:14px;">discord.gg/haxzero</div>' +
            '<button type="button" id="pro-discord-btn" style="width:100%;padding:12px 14px;background:#5865F2;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">' +
            escapeAttr(t('Pro open discord')) +
            '</button></div></div>';

        popup.innerHTML = headerHtml + stepsLine + bodyWrap;

        var closeNp = popup.querySelector('#pro-close-btn');
        if (closeNp) {
            closeNp.onclick = closeProUi;
            closeNp.onmouseenter = function() { closeNp.style.color = '#fff'; };
            closeNp.onmouseleave = function() { closeNp.style.color = '#6b7280'; };
        }

        var discordBtn = popup.querySelector('#pro-discord-btn');
        if (discordBtn) discordBtn.onclick = function() { openHaxzeroDiscord(); };

        popup.style.minHeight = '0';
    }

    function renderProContent(popup, status) {
        renderProPopupLoading(popup, 'Cargando personalización...');
        loadProSettings().then(function(settings) {
            fetch(API_BASE + '/user').then(function(r) { return r.json(); }).then(function(u) {
                renderProUI(popup, status, settings, u.nick || 'Player', u);
            }).catch(function() { renderProUI(popup, status, settings, 'Player', null); });
        });
    }

    function accountFlagOn(v) {
        return v === true || v === 1 || v === '1' || v === 'true';
    }

    function normalizeUserBadgePreview(v) {
        v = (v == null ? '' : String(v)).trim().toUpperCase();
        return v === 'CEO' || v === 'DEV' ? v : '';
    }

    /** Texto/imagen extra junto al nick (no duplicar CEO/DEV: ya van en la pill de staff). */
    function extraAccountBadgeRaw(badgeField) {
        var raw = badgeField != null && String(badgeField).trim() ? String(badgeField).trim() : '';
        if (!raw) return '';
        var st = normalizeUserBadgePreview(raw);
        if (st && raw.toUpperCase() === st) return '';
        return raw;
    }

    /** Misma apariencia que `createRoleBadge` en verified.js (lista de sala). */
    function applyUserRoleBadgePreview(el, role) {
        if (!el) return;
        role = normalizeUserBadgePreview(role);
        if (!role) {
            el.textContent = '';
            el.className = 'prx-preview-role-slot';
            el.style.cssText = 'display:none;';
            return;
        }
        el.style.display = 'inline-flex';
        el.className = 'user-role-badge';
        el.textContent = role;
        if (role === 'CEO') {
            el.style.cssText =
                'display:inline-flex;align-items:center;justify-content:center;margin-right:7px;padding:0 6px;min-width:30px;height:16px;border-radius:5px;background:rgba(185,28,28,.10);border:1px solid rgba(239,68,68,.45);color:#fecaca;font-size:8px;font-weight:700;letter-spacing:.08em;line-height:1;font-family:Inter,system-ui,sans-serif;vertical-align:middle;text-transform:uppercase;box-sizing:border-box;';
        } else {
            el.style.cssText =
                'display:inline-flex;align-items:center;justify-content:center;margin-right:7px;padding:0 6px;min-width:30px;height:16px;border-radius:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.22);color:#e5e7eb;font-size:8px;font-weight:700;letter-spacing:.08em;line-height:1;font-family:Inter,system-ui,sans-serif;vertical-align:middle;text-transform:uppercase;box-sizing:border-box;';
        }
    }

    function isProSettingsSaveResponseOk(data) {
        if (!data || typeof data !== 'object') return false;
        if (data.error) return false;
        if (data.success === false) return false;
        if (data.success === true) return true;
        return typeof data.banner !== 'undefined' || typeof data.font !== 'undefined' || data.discord_id != null;
    }

    function sanitizeProSoundDataUrl(v) {
        if (v == null) return '';
        v = String(v).trim();
        if (v.indexOf('data:') !== 0) return '';
        return v;
    }

    function loadProCustomSoundsFromStorage() {
        try {
            var o = JSON.parse(localStorage.getItem('haxclient_pro_custom_sounds') || 'null');
            if (!o || typeof o !== 'object') return {};
            var keys = ['chat', 'highlight', 'kick', 'goal', 'join', 'leave'];
            for (var i = 0; i < keys.length; i++) {
                o[keys[i]] = sanitizeProSoundDataUrl(o[keys[i]]);
            }
            return o;
        } catch (e) {
            return {};
        }
    }

    function saveProCustomSoundsToStorage(cfg) {
        try {
            localStorage.setItem('haxclient_pro_custom_sounds', JSON.stringify(cfg));
            return true;
        } catch (e) {
            return false;
        }
    }

    function buildProSoundRowHtml(key, label, valueRaw) {
        var raw = sanitizeProSoundDataUrl(valueRaw);
        var v = escapeAttr(raw);
        var hasFile = raw.length > 0;
        return (
            '<div class="prx-snd" data-sound="' +
            key +
            '">' +
            '<span class="prx-snd__name">' +
            label +
            '</span>' +
            '<div class="prx-snd__tools">' +
            '<input type="hidden" class="prx-snd-url" data-sound="' +
            key +
            '" value="' +
            v +
            '" />' +
            '<span class="prx-snd-hint" data-sound-hint="' +
            key +
            '">' +
            (hasFile ? t('Pro sounds file loaded') : t('Pro sounds silent hint')) +
            '</span>' +
            '<button type="button" class="prx-snd-play" data-sound="' +
            key +
            '" title="' +
            escapeAttr(t('Pro sounds test')) +
            '">▶</button>' +
            '<label class="prx-snd-pick">' +
            '<input type="file" class="prx-snd-file" data-sound="' +
            key +
            '" accept="audio/*,.wav,.mp3,.ogg,.m4a" />' +
            '<span>' +
            t('Pro sounds pick file') +
            '</span></label>' +
            '<button type="button" class="prx-snd-muted" data-sound="' +
            key +
            '">' +
            escapeAttr(t('Pro sounds silent btn')) +
            '</button>' +
            '<button type="button" class="prx-snd-clear" data-sound="' +
            key +
            '"' +
            (hasFile ? '' : ' disabled') +
            '>' +
            escapeAttr(t('Pro sounds remove btn')) +
            '</button>' +
            '</div></div>'
        );
    }

    function syncProSoundRowUi(popup, key) {
        var ur = popup.querySelector('.prx-snd-url[data-sound="' + key + '"]');
        var hint = popup.querySelector('[data-sound-hint="' + key + '"]');
        var clr = popup.querySelector('.prx-snd-clear[data-sound="' + key + '"]');
        var raw = ur ? sanitizeProSoundDataUrl(ur.value) : '';
        var has = raw.length > 0;
        if (hint) hint.textContent = has ? t('Pro sounds file loaded') : t('Pro sounds silent hint');
        if (clr) clr.disabled = !has;
    }

    function clearProSoundSlot(popup, key) {
        var ur = popup.querySelector('.prx-snd-url[data-sound="' + key + '"]');
        var fi = popup.querySelector('.prx-snd-file[data-sound="' + key + '"]');
        if (ur) ur.value = '';
        if (fi) fi.value = '';
        syncProSoundRowUi(popup, key);
    }

    function renderProUI(popup, status, settings, userNick, userProfile) {
        var up = userProfile || {};
        var inpanelUi = isProInpanelPopup(popup);
        var hasVerifiedAccount = accountFlagOn(up.is_verified) || accountFlagOn(up.verified);
        var extraBadgeRaw = extraAccountBadgeRaw(up.badge);

        var shellHead = inpanelUi
            ? ''
            : '<header class="prx-head">' +
                '<span class="prx-mark">Pro</span>' +
                '<button type="button" id="pro-close-btn" class="prx-ghost" title="' +
                escapeAttr(t('Fechar')) +
                '">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
                '</header>';

        var currentBanner = settings.banner || 'none';
        var currentFont = settings.font || 'default';
        var currentBallEffect = settings.ball_effect || 'none';
        var currentBallC1 = settings.ball_color1 || '#60a5fa';
        var currentBallC2 = settings.ball_color2 || '#7c3aed';
        var verifiedColor = settings.verified_color || '#249EF0';
        var nickColor = settings.nick_color || '#249EF0';
        var verifiedGradient = settings.verified_gradient || '';
        var nickGradient = settings.nick_gradient || '';
        var customBannerC1 = settings.custom_banner_color1 || '#6366f1';
        var customBannerC2 = settings.custom_banner_color2 || '#8b5cf6';
        var goalAnthemEn = !!(settings.goal_anthem_enabled === true || settings.goal_anthem_enabled === 1 || settings.goal_anthem_enabled === '1');
        var goalAnthemUrl = settings.goal_anthem_audio_url != null ? String(settings.goal_anthem_audio_url) : '';

        var bannerOpts = '';
        for (var bk in PRO_BANNERS) bannerOpts += '<option value="' + bk + '"' + (bk === currentBanner ? ' selected' : '') + '>' + t(PRO_BANNERS[bk].name) + '</option>';
        var fontOpts = '';
        for (var fk in PRO_FONTS) fontOpts += '<option value="' + fk + '"' + (fk === currentFont ? ' selected' : '') + '>' + t(PRO_FONTS[fk].name) + '</option>';
        var ballEffectOpts = '';
        for (var ek in PRO_BALL_EFFECTS) ballEffectOpts += '<option value="' + ek + '"' + (ek === currentBallEffect ? ' selected' : '') + '>' + t(PRO_BALL_EFFECTS[ek].name) + '</option>';

        var sndCfg = loadProCustomSoundsFromStorage();
        var sndEn = !!sndCfg.enabled;

        popup.innerHTML =
            '<div class="prx">' +
            shellHead +
            '<nav class="tm-tabs" id="pro-hub-tabs" role="tablist">' +
            '<button type="button" class="tm-tab tm-tab--on" data-pro-tab="profile">' +
            t('Pro nav perfil') +
            '</button>' +
            '<button type="button" class="tm-tab" data-pro-tab="sounds">' +
            t('Pro nav sonidos') +
            '</button>' +
            '<button type="button" class="tm-tab" data-pro-tab="goal">' +
            t('Pro nav goal') +
            '</button></nav>' +
            '<div class="prx-scroll">' +
            '<div id="pro-tab-profile" class="prx-tab">' +
            '<section class="prx-sec">' +
            '<p class="prx-cap">' +
            t('Preview') +
            '</p>' +
            '<div id="pro-preview" class="prx-stage">' +
            '<span id="preview-role-badge" class="prx-preview-role-slot" style="display:none" aria-hidden="true"></span>' +
            '<span id="preview-nick" class="prx-nick" style="color:' +
            nickColor +
            ';">' +
            userNick +
            '</span>' +
            '<span id="preview-badge" class="prx-check"></span>' +
            '<span id="preview-account-badge-extra" class="prx-extra"></span>' +
            '<span id="preview-ball" class="prx-ball"></span>' +
            '</div>' +
            '<p id="preview-badge-legend" class="prx-note prx-note--ctr"></p>' +
            '</section>' +
            '<div class="prx-rule"></div>' +
            '<section class="prx-sec">' +
            '<p class="prx-cap">' +
            t('Pro sec colors') +
            '</p>' +
            '<div class="prx-duo">' +
            '<div class="prx-cell">' +
            '<div class="prx-row">' +
            '<span class="prx-tag">' + t('Pro lbl nick') + '</span>' +
            '<label class="prx-mini"><input type="checkbox" id="nick-grad-check"' +
            (nickGradient ? ' checked' : '') +
            '><span>' +
            t('Gradiente') +
            '</span></label>' +
            '</div>' +
            '<div class="prx-palette">' +
            '<label class="prx-dot"><input type="color" id="nick-color" value="' +
            nickColor +
            '"></label>' +
            '<div id="nick-grad-colors" class="prx-grad" style="display:' +
            (nickGradient ? 'flex' : 'none') +
            '">' +
            '<span class="prx-grad-sep"></span>' +
            '<label class="prx-dot"><input type="color" id="nick-grad1" value="' +
            (nickGradient.split(',')[0] || '#f59e0b') +
            '"></label>' +
            '<label class="prx-dot"><input type="color" id="nick-grad2" value="' +
            (nickGradient.split(',')[1] || '#ef4444') +
            '"></label>' +
            '</div></div></div>' +
            '<div class="prx-cell">' +
            '<div class="prx-row">' +
            '<span class="prx-tag">' +
            t('Pro lbl verified') +
            '</span>' +
            '<label class="prx-mini"><input type="checkbox" id="verified-grad-check"' +
            (verifiedGradient ? ' checked' : '') +
            '><span>' +
            t('Gradiente') +
            '</span></label>' +
            '</div>' +
            '<div class="prx-palette">' +
            '<label class="prx-dot"><input type="color" id="verified-color" value="' +
            verifiedColor +
            '"></label>' +
            '<div id="verified-grad-colors" class="prx-grad" style="display:' +
            (verifiedGradient ? 'flex' : 'none') +
            '">' +
            '<span class="prx-grad-sep"></span>' +
            '<label class="prx-dot"><input type="color" id="verified-grad1" value="' +
            (verifiedGradient.split(',')[0] || '#6366f1') +
            '"></label>' +
            '<label class="prx-dot"><input type="color" id="verified-grad2" value="' +
            (verifiedGradient.split(',')[1] || '#ec4899') +
            '"></label>' +
            '</div></div></div></div>' +
            '<button type="button" id="sync-colors-btn" class="prx-sync">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>' +
            t('Sincronizar cores (Nick → Verificado)') +
            '</button>' +
            '</section>' +
            '<div class="prx-rule"></div>' +
            '<section class="prx-sec">' +
            '<p class="prx-cap">' +
            t('Pro sec look') +
            '</p>' +
            '<div class="prx-stack">' +
            '<div class="prx-field">' +
            '<label class="prx-lbl" for="font-select">' +
            t('Fonte') +
            '</label>' +
            '<select id="font-select" class="prx-select">' +
            fontOpts +
            '</select></div>' +
            '<div class="prx-field">' +
            '<label class="prx-lbl" for="banner-select">' +
            t('Banner') +
            '</label>' +
            '<select id="banner-select" class="prx-select">' +
            bannerOpts +
            '</select></div>' +
            '<div class="prx-field">' +
            '<label class="prx-lbl" for="ball-effect-select">' +
            t('Pelota') +
            '</label>' +
            '<select id="ball-effect-select" class="prx-select">' +
            ballEffectOpts +
            '</select>' +
            '<p class="prx-hint">' +
            t('Efecto visual local de la pelota para usuarios Pro.') +
            '</p></div></div>' +
            '<div id="custom-ball-colors" class="prx-inline" style="display:' +
            (currentBallEffect === 'custom' ? 'flex' : 'none') +
            '">' +
            '<span class="prx-inline-lbl">' +
            t('Colores de la pelota:') +
            '</span>' +
            '<label class="prx-dot prx-dot--round"><input type="color" id="ball-c1" value="' +
            currentBallC1 +
            '"></label>' +
            '<label class="prx-dot prx-dot--round"><input type="color" id="ball-c2" value="' +
            currentBallC2 +
            '"></label></div>' +
            '<div id="custom-banner-colors" class="prx-inline" style="display:' +
            (currentBanner === 'custom' ? 'flex' : 'none') +
            '">' +
            '<span class="prx-inline-lbl">' +
            t('Cores do banner:') +
            '</span>' +
            '<label class="prx-dot prx-dot--sq"><input type="color" id="banner-c1" value="' +
            customBannerC1 +
            '"></label>' +
            '<label class="prx-dot prx-dot--sq"><input type="color" id="banner-c2" value="' +
            customBannerC2 +
            '"></label></div>' +
            '</section>' +
            '<button id="pro-save-btn" class="prx-btn" type="button">' +
            t('Salvar Alterações') +
            '</button>' +
            '<p class="prx-note prx-note--ctr prx-foot">' +
            t('Válido até') +
            ': ' +
            (status.expires_at ? new Date(status.expires_at).toLocaleDateString() : t('Vitalício')) +
            '</p>' +
            '</div>' +
            '<div id="pro-tab-sounds" class="prx-tab" style="display:none">' +
            '<p class="prx-lead">' +
            t('Pro sounds intro') +
            '</p>' +
            '<label class="prx-toggle">' +
            '<input type="checkbox" id="pro-sounds-enabled"' +
            (sndEn ? ' checked' : '') +
            ' />' +
            '<span>' +
            t('Pro sounds enable') +
            '</span></label>' +
            '<div class="prx-sndlist">' +
            buildProSoundRowHtml('chat', t('Sonido del chat'), sndCfg.chat) +
            buildProSoundRowHtml('highlight', t('Mention / highlight sound'), sndCfg.highlight) +
            buildProSoundRowHtml('kick', t('Kick / ball hit sound'), sndCfg.kick) +
            buildProSoundRowHtml('goal', t('Goal sound'), sndCfg.goal) +
            buildProSoundRowHtml('join', t('Player join sound'), sndCfg.join) +
            buildProSoundRowHtml('leave', t('Player leave sound'), sndCfg.leave) +
            '</div>' +
            '<button type="button" id="pro-sounds-save" class="prx-btn prx-btn--line">' +
            t('Pro sounds save') +
            '</button>' +
            '<p id="pro-sounds-msg" class="prx-toast"></p></div>' +
            '<div id="pro-tab-goal" class="prx-tab" style="display:none">' +
            '<section class="prx-sec">' +
            '<p class="prx-cap">' +
            t('Pro goal sec about') +
            '</p>' +
            '<p class="prx-note">' +
            t('Pro goal intro') +
            '</p></section>' +
            '<div class="prx-rule"></div>' +
            '<section class="prx-sec">' +
            '<p class="prx-cap">' +
            t('Pro goal sec opts') +
            '</p>' +
            '<div class="prx-stack">' +
            '<div class="prx-field">' +
            '<div class="prx-row">' +
            '<span class="prx-tag">' +
            t('Pro goal enable tag') +
            '</span>' +
            '<label class="prx-mini"><input type="checkbox" id="goal-anthem-enabled"' +
            (goalAnthemEn ? ' checked' : '') +
            '><span>' +
            t('Pro goal enable act') +
            '</span></label>' +
            '</div>' +
            '<p class="prx-hint">' +
            t('Pro goal enable') +
            '</p></div>' +
            '<div class="prx-field">' +
            '<label class="prx-lbl" for="goal-anthem-text">' +
            t('Pro goal text lbl') +
            '</label>' +
            '<input id="goal-anthem-text" class="prx-input" maxlength="20" placeholder="' +
            escapeAttr(t('Pro goal text ph')) +
            '" />' +
            '<p class="prx-hint">' +
            t('Pro goal text hint') +
            '</p></div>' +
            '<div class="prx-field">' +
            '<label class="prx-lbl" for="goal-anthem-url">' +
            t('Pro goal url lbl') +
            '</label>' +
            '<input type="url" id="goal-anthem-url" class="prx-input" value="' +
            escapeAttr(goalAnthemUrl) +
            '" placeholder="https://…" maxlength="600" />' +
            '<p class="prx-hint">' +
            t('Pro goal url hint') +
            '</p></div></div></section>' +
            '<button type="button" id="pro-goal-save" class="prx-btn">' +
            t('Pro goal save') +
            '</button>' +
            '<p id="pro-goal-msg" class="prx-toast"></p>' +
            '<p class="prx-note prx-note--ctr prx-foot">' +
            t('Pro goal foot hint') +
            '</p></div></div></div>';

        var goalTxtEl0 = popup.querySelector('#goal-anthem-text');
        if (goalTxtEl0 && settings.goal_anthem_text != null) goalTxtEl0.value = String(settings.goal_anthem_text).slice(0, 20);

        var legEl = popup.querySelector('#preview-badge-legend');
        if (legEl) {
            legEl.textContent = hasVerifiedAccount ? t('Pro preview badge verificado sí') : t('Pro preview badge verificado no');
        }
        var exEl = popup.querySelector('#preview-account-badge-extra');
        if (exEl) {
            if (extraBadgeRaw) {
                if (/^https?:\/\//i.test(extraBadgeRaw)) {
                    exEl.innerHTML =
                        '<img src="' +
                        escapeAttr(extraBadgeRaw) +
                        '" alt="" style="height:18px;width:auto;max-width:44px;border-radius:4px;object-fit:contain;vertical-align:middle;" />';
                } else {
                    exEl.textContent = extraBadgeRaw.length > 10 ? extraBadgeRaw.slice(0, 10) + '…' : extraBadgeRaw;
                }
            } else {
                exEl.textContent = '';
                exEl.innerHTML = '';
            }
        }

        var rolePrev = popup.querySelector('#preview-role-badge');
        if (rolePrev) {
            applyUserRoleBadgePreview(rolePrev, up.badge);
        }

        setupProHandlers(popup, userNick);
    }

    function setupProHandlers(popup, userNick) {
        var closeBtn = popup.querySelector('#pro-close-btn');
        var verifiedColor = popup.querySelector('#verified-color');
        var verifiedGradCheck = popup.querySelector('#verified-grad-check');
        var verifiedGradColors = popup.querySelector('#verified-grad-colors');
        var verifiedGrad1 = popup.querySelector('#verified-grad1');
        var verifiedGrad2 = popup.querySelector('#verified-grad2');
        var nickColor = popup.querySelector('#nick-color');
        var nickGradCheck = popup.querySelector('#nick-grad-check');
        var nickGradColors = popup.querySelector('#nick-grad-colors');
        var nickGrad1 = popup.querySelector('#nick-grad1');
        var nickGrad2 = popup.querySelector('#nick-grad2');
        var fontSelect = popup.querySelector('#font-select');
        var bannerSelect = popup.querySelector('#banner-select');
        var ballEffectSelect = popup.querySelector('#ball-effect-select');
        var customBallColors = popup.querySelector('#custom-ball-colors');
        var ballC1 = popup.querySelector('#ball-c1');
        var ballC2 = popup.querySelector('#ball-c2');
        var customBannerColors = popup.querySelector('#custom-banner-colors');
        var bannerC1 = popup.querySelector('#banner-c1');
        var bannerC2 = popup.querySelector('#banner-c2');
        var syncBtn = popup.querySelector('#sync-colors-btn');
        var saveBtn = popup.querySelector('#pro-save-btn');
        var previewEl = popup.querySelector('#pro-preview');
        var previewNick = popup.querySelector('#preview-nick');
        var previewBadge = popup.querySelector('#preview-badge');
        var previewBall = popup.querySelector('#preview-ball');
        var goalAnthemEnEl = popup.querySelector('#goal-anthem-enabled');
        var goalAnthemTextEl = popup.querySelector('#goal-anthem-text');
        var goalAnthemUrlEl = popup.querySelector('#goal-anthem-url');

        if (closeBtn) closeBtn.onclick = closeProUi;

        function buildVipSettingsPostBodyFromForm() {
            return {
                verified_color: verifiedColor.value,
                nick_color: nickColor.value,
                banner: bannerSelect.value,
                font: fontSelect.value,
                ball_effect: ballEffectSelect.value,
                ball_color1: ballC1.value,
                ball_color2: ballC2.value,
                verified_gradient: verifiedGradCheck.checked ? verifiedGrad1.value + ',' + verifiedGrad2.value : '',
                nick_gradient: nickGradCheck.checked ? nickGrad1.value + ',' + nickGrad2.value : '',
                custom_banner_color1: bannerC1.value,
                custom_banner_color2: bannerC2.value,
                goal_anthem_enabled: !!(goalAnthemEnEl && goalAnthemEnEl.checked),
                goal_anthem_text: goalAnthemTextEl ? String(goalAnthemTextEl.value || '').slice(0, 20) : '',
                goal_anthem_audio_url: goalAnthemUrlEl ? String(goalAnthemUrlEl.value || '').trim().slice(0, 600) : ''
            };
        }

        function getBallPreviewBackground() {
            switch (ballEffectSelect.value) {
                case 'rgb':
                    return 'linear-gradient(135deg, #ff3b30 0%, #34c759 50%, #0a84ff 100%)';
                case 'rainbow':
                    return 'linear-gradient(135deg, #ff003c 0%, #ff8a00 18%, #f8ff00 36%, #00ff85 54%, #00c2ff 72%, #8f00ff 100%)';
                case 'fire':
                    return 'radial-gradient(circle at 30% 30%, #ffd166 0%, #ff7b00 45%, #ef4444 100%)';
                case 'ocean':
                    return 'radial-gradient(circle at 30% 30%, #7dd3fc 0%, #0ea5e9 48%, #1d4ed8 100%)';
                case 'sunset':
                    return 'radial-gradient(circle at 30% 30%, #fde68a 0%, #fb7185 52%, #7c3aed 100%)';
                case 'neon':
                    return 'radial-gradient(circle at 30% 30%, #67e8f9 0%, #22c55e 48%, #0f172a 100%)';
                case 'gold':
                    return 'radial-gradient(circle at 30% 30%, #fef3c7 0%, #f59e0b 55%, #b45309 100%)';
                case 'custom':
                    return 'radial-gradient(circle at 30% 30%, ' + ballC1.value + ' 0%, ' + ballC2.value + ' 100%)';
                default:
                    return '#ffffff';
            }
        }

        function updatePreview() {
            var font = PRO_FONTS[fontSelect.value] ? PRO_FONTS[fontSelect.value].family : 'Space Grotesk';
            previewNick.style.setProperty('font-family', "'" + font + "', sans-serif", 'important');

            if (nickGradCheck.checked) {
                var ng = 'linear-gradient(90deg, ' + nickGrad1.value + ', ' + nickGrad2.value + ')';
                previewNick.style.background = ng;
                previewNick.style.webkitBackgroundClip = 'text';
                previewNick.style.webkitTextFillColor = 'transparent';
                previewNick.style.backgroundClip = 'text';
            } else {
                previewNick.style.background = 'none';
                previewNick.style.webkitBackgroundClip = 'unset';
                previewNick.style.webkitTextFillColor = 'unset';
                previewNick.style.backgroundClip = 'unset';
                previewNick.style.color = nickColor.value;
            }

            var gid = 'vgpr-' + String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7);
            if (verifiedGradCheck.checked) {
                previewBadge.innerHTML =
                    '<svg width="12" height="12" viewBox="0 0 22 22"><defs><linearGradient id="' +
                    gid +
                    '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' +
                    verifiedGrad1.value +
                    '"/><stop offset="100%" stop-color="' +
                    verifiedGrad2.value +
                    '"/></linearGradient></defs><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="url(#' +
                    gid +
                    ')"/><path d="M15 9l-4.5 4.5L8 11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            } else {
                previewBadge.innerHTML =
                    '<svg width="12" height="12" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="' +
                    verifiedColor.value +
                    '"/><path d="M15 9l-4.5 4.5L8 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            }

            var bannerKey = bannerSelect.value;
            if (bannerKey === 'custom') {
                previewEl.style.background = 'linear-gradient(90deg, ' + bannerC1.value + '33 0%, ' + bannerC2.value + '44 50%, ' + bannerC1.value + '33 100%)';
            } else if (PRO_BANNERS[bannerKey] && PRO_BANNERS[bannerKey].gradient !== 'none') {
                previewEl.style.background = PRO_BANNERS[bannerKey].gradient;
            } else {
                previewEl.style.background = '#111';
            }

            previewBall.style.background = getBallPreviewBackground();
            previewBall.style.boxShadow = ballEffectSelect.value === 'none'
                ? '0 0 0 1px rgba(255,255,255,0.08)'
                : '0 0 12px rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.12)';
        }

        // Sincronizar cores (Nick → Verificado)
        if (syncBtn) {
            syncBtn.onclick = function() {
                verifiedColor.value = nickColor.value;
                verifiedGradCheck.checked = nickGradCheck.checked;
                verifiedGradColors.style.display = nickGradColors.style.display;
                verifiedGrad1.value = nickGrad1.value;
                verifiedGrad2.value = nickGrad2.value;
                updatePreview();
                syncBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' + t('Sincronizado!');
                setTimeout(function() {
                    syncBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>' + t('Sincronizar cores (Nick → Verificado)');
                }, 1500);
            };
        }

        verifiedGradCheck.onchange = function() { verifiedGradColors.style.display = verifiedGradCheck.checked ? 'flex' : 'none'; updatePreview(); };
        nickGradCheck.onchange = function() { nickGradColors.style.display = nickGradCheck.checked ? 'flex' : 'none'; updatePreview(); };
        bannerSelect.onchange = function() { customBannerColors.style.display = bannerSelect.value === 'custom' ? 'flex' : 'none'; updatePreview(); };
        ballEffectSelect.onchange = function() { customBallColors.style.display = ballEffectSelect.value === 'custom' ? 'flex' : 'none'; updatePreview(); };

        verifiedColor.oninput = updatePreview;
        verifiedGrad1.oninput = updatePreview;
        verifiedGrad2.oninput = updatePreview;
        nickColor.oninput = updatePreview;
        nickGrad1.oninput = updatePreview;
        nickGrad2.oninput = updatePreview;
        fontSelect.onchange = updatePreview;
        ballC1.oninput = updatePreview;
        ballC2.oninput = updatePreview;
        bannerC1.oninput = updatePreview;
        bannerC2.oninput = updatePreview;

        function setProTab(tab) {
            var p = popup.querySelector('#pro-tab-profile');
            var s = popup.querySelector('#pro-tab-sounds');
            var g = popup.querySelector('#pro-tab-goal');
            var hub = popup.querySelector('#pro-hub-tabs');
            var navBtns = hub ? hub.querySelectorAll('.tm-tab[data-pro-tab]') : popup.querySelectorAll('.tm-tab[data-pro-tab]');
            for (var i = 0; i < navBtns.length; i++) {
                navBtns[i].classList.toggle('tm-tab--on', navBtns[i].getAttribute('data-pro-tab') === tab);
            }
            if (p) p.style.display = tab === 'profile' ? 'block' : 'none';
            if (s) s.style.display = tab === 'sounds' ? 'block' : 'none';
            if (g) g.style.display = tab === 'goal' ? 'block' : 'none';
        }
        var navProf = popup.querySelector('[data-pro-tab="profile"]');
        var navSnd = popup.querySelector('[data-pro-tab="sounds"]');
        var navGoal = popup.querySelector('[data-pro-tab="goal"]');
        if (navProf) navProf.onclick = function() { setProTab('profile'); };
        if (navSnd) navSnd.onclick = function() { setProTab('sounds'); };
        if (navGoal) navGoal.onclick = function() { setProTab('goal'); };

        var saveSnd = popup.querySelector('#pro-sounds-save');
        if (saveSnd) {
            saveSnd.onclick = function() {
                var enEl = popup.querySelector('#pro-sounds-enabled');
                var cfg = { enabled: !!(enEl && enEl.checked) };
                var keys = ['chat', 'highlight', 'kick', 'goal', 'join', 'leave'];
                for (var ks = 0; ks < keys.length; ks++) {
                    var kk = keys[ks];
                    var inp = popup.querySelector('.prx-snd-url[data-sound="' + kk + '"]');
                    cfg[kk] = sanitizeProSoundDataUrl(inp && inp.value ? inp.value : '');
                }
                var ok = saveProCustomSoundsToStorage(cfg);
                var smsg = popup.querySelector('#pro-sounds-msg');
                if (smsg) {
                    smsg.classList.remove('prx-toast--ok', 'prx-toast--err');
                    smsg.classList.add(ok ? 'prx-toast--ok' : 'prx-toast--err');
                    smsg.textContent = ok ? t('Pro sounds saved') : t('Pro sounds save error');
                    setTimeout(function() {
                        if (smsg) {
                            smsg.textContent = '';
                            smsg.classList.remove('prx-toast--ok', 'prx-toast--err');
                        }
                    }, 3200);
                }
            };
        }

        var fileInputs = popup.querySelectorAll('.prx-snd-file');
        for (var fi = 0; fi < fileInputs.length; fi++) {
            (function(inputEl) {
                inputEl.addEventListener('change', function() {
                    var f = inputEl.files && inputEl.files[0];
                    var key = inputEl.getAttribute('data-sound');
                    if (!f || !key) return;
                    var reader = new FileReader();
                    reader.onload = function() {
                        var dataUrl = sanitizeProSoundDataUrl(reader.result);
                        var ur = popup.querySelector('.prx-snd-url[data-sound="' + key + '"]');
                        if (ur) ur.value = dataUrl;
                        syncProSoundRowUi(popup, key);
                    };
                    reader.readAsDataURL(f);
                });
            })(fileInputs[fi]);
        }

        var muteBtns = popup.querySelectorAll('.prx-snd-muted');
        for (var mi = 0; mi < muteBtns.length; mi++) {
            (function(btnEl) {
                btnEl.onclick = function() {
                    var k = btnEl.getAttribute('data-sound');
                    if (k) clearProSoundSlot(popup, k);
                };
            })(muteBtns[mi]);
        }
        var clearBtns = popup.querySelectorAll('.prx-snd-clear');
        for (var ci = 0; ci < clearBtns.length; ci++) {
            (function(btnEl) {
                btnEl.onclick = function() {
                    if (btnEl.disabled) return;
                    var k = btnEl.getAttribute('data-sound');
                    if (k) clearProSoundSlot(popup, k);
                };
            })(clearBtns[ci]);
        }

        var testBtns = popup.querySelectorAll('.prx-snd-play');
        for (var tb = 0; tb < testBtns.length; tb++) {
            (function(btnEl) {
                btnEl.onclick = function() {
                    var key = btnEl.getAttribute('data-sound');
                    var ur = popup.querySelector('.prx-snd-url[data-sound="' + key + '"]');
                    var uval = ur && ur.value ? String(ur.value).trim() : '';
                    uval = sanitizeProSoundDataUrl(uval);
                    if (!uval) return;
                    var a = new Audio(uval);
                    a.volume = 0.88;
                    a.play().catch(function() {});
                };
            })(testBtns[tb]);
        }

        var saveGoalBtn = popup.querySelector('#pro-goal-save');
        if (saveGoalBtn) {
            saveGoalBtn.onclick = function() {
                var gmsg = popup.querySelector('#pro-goal-msg');
                saveGoalBtn.disabled = true;
                saveProSettings(buildVipSettingsPostBodyFromForm())
                    .then(function(result) {
                        if (gmsg) {
                            gmsg.classList.remove('prx-toast--ok', 'prx-toast--err');
                            gmsg.classList.add(isProSettingsSaveResponseOk(result) ? 'prx-toast--ok' : 'prx-toast--err');
                            gmsg.textContent = isProSettingsSaveResponseOk(result) ? t('Pro goal saved') : t('Pro goal save err');
                            setTimeout(function() {
                                if (gmsg) {
                                    gmsg.textContent = '';
                                    gmsg.classList.remove('prx-toast--ok', 'prx-toast--err');
                                }
                            }, 3200);
                        }
                    })
                    .catch(function() {
                        if (gmsg) {
                            gmsg.classList.remove('prx-toast--ok');
                            gmsg.classList.add('prx-toast--err');
                            gmsg.textContent = t('Pro goal save err');
                        }
                    })
                    .then(function() {
                        saveGoalBtn.disabled = false;
                    });
            };
        }

        saveBtn.onclick = function() {
            saveBtn.textContent = t('Salvando...');
            saveBtn.disabled = true;
            saveBtn.classList.remove('prx-btn--flash-ok', 'prx-btn--flash-err');

            var settingsToSave = buildVipSettingsPostBodyFromForm();

            saveProSettings(settingsToSave).then(function(result) {
                if (isProSettingsSaveResponseOk(result)) {
                    saveBtn.textContent = t('Salvo!');
                    saveBtn.classList.remove('prx-btn--flash-err');
                    saveBtn.classList.add('prx-btn--flash-ok');
                } else {
                    saveBtn.textContent = t('Erro');
                    saveBtn.classList.remove('prx-btn--flash-ok');
                    saveBtn.classList.add('prx-btn--flash-err');
                }
                setTimeout(function() {
                    saveBtn.textContent = t('Salvar Alterações');
                    saveBtn.classList.remove('prx-btn--flash-ok', 'prx-btn--flash-err');
                    saveBtn.disabled = false;
                }, 1500);
            }).catch(function() {
                saveBtn.textContent = t('Erro');
                saveBtn.classList.remove('prx-btn--flash-ok');
                saveBtn.classList.add('prx-btn--flash-err');
                setTimeout(function() {
                    saveBtn.textContent = t('Salvar Alterações');
                    saveBtn.classList.remove('prx-btn--flash-ok', 'prx-btn--flash-err');
                    saveBtn.disabled = false;
                }, 1500);
            });
        };

        updatePreview();
    }

    function init() {
        if (!Injector.isGameFrame()) return;
        applyProSnapshotFromStorage();
        fetch(API_BASE + '/user').then(function(r) { return r.json(); }).then(function(data) {
            if (data.nick) {
                window.__myNick = data.nick;
                try { localStorage.setItem('haxclient_my_nick', data.nick); } catch(e) {}
            }
        }).catch(function() {});
        loadProStatus().then(function(status) {
            if (status.is_pro || status.is_vip) loadProSettings();
        });
        window.__showProPopup = showProPopup;
        window.__hxdRenderProIntoInpanel = renderProIntoInpanel;
        window.__hxdClearProInpanelContext = clearProInpanelContext;
        window.__proLoadStatus = loadProStatus;
        window.__proLoadSettings = loadProSettings;
        window.__proIsPro = function() {
            if (proStatus && (proStatus.is_pro || proStatus.is_vip)) return true;
            return applyProSnapshotFromStorage();
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
