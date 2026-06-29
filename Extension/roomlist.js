// ============================================
// ROOMLIST - Lista de salas com pesquisa e filtros
// ============================================
(function() {
    if (!window.__hxdRoomlistAnonSyncBound) {
        window.__hxdRoomlistAnonSyncBound = true;
        window.addEventListener('hxd-anonymous-mode-changed', function() {
            try {
                var anon = window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode();
                var ids = ['pro-sidebar-btn'];
                for (var i = 0; i < ids.length; i++) {
                    var el = document.getElementById(ids[i]);
                    if (el) el.style.display = anon ? 'none' : '';
                }
                if (document.getElementById('hxd-roomlist-preview-frame')) {
                    invalidateRoomlistPreviewSync(document);
                    pushRoomlistPreviewSyncNow(document);
                }
            } catch (eAn) {}
        });
    }

    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    if (!document.hxdRoomlistPreviewCmdBound) {
        document.hxdRoomlistPreviewCmdBound = true;
        document.addEventListener('hxd-roomlist-preview-cmd', function (e) {
            var detail = e && e.detail ? e.detail : {};
            handleRoomlistPreviewCmd(document, detail.action, detail.payload || {});
        });
    }

    var roomListObserver = null;
    var cachedRows = null;
    var selectedCountry = 'all';
    var searchTimeout = null;
    var isFilteringFavs = false;
    var LOCAL_API = 'http://127.0.0.1:5483';
    var profileDataCache = null;
    var profileDataPromise = null;

    function safeJsonParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (e) {
            return fallback;
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function fetchJson(path) {
        return fetch(LOCAL_API + path).then(function(res) {
            return res.text();
        }).then(function(text) {
            return safeJsonParse(text, null);
        });
    }

    function getLocalProfileUser() {
        var nick = 'Player';
        try {
            nick = localStorage.getItem('haxball_nick') ||
                localStorage.getItem('ghost_nick') ||
                localStorage.getItem('haxclient_my_nick') ||
                nick;
        } catch (eNick) {}
        var stored = null;
        try {
            stored = safeJsonParse(localStorage.getItem('haxclient_user') || 'null', null);
        } catch (eStored) {}
        return Object.assign({}, stored || {}, {
            logged_in: true,
            nick: (stored && (stored.nick || stored.username)) || nick,
            username: (stored && (stored.username || stored.nick)) || nick,
            discord_id: (stored && stored.discord_id) || 'zero-local-test',
            is_verified: true,
            is_pro: true,
            is_vip: true
        });
    }

    function getUiLang() {
        try {
            var w = window.top || window;
            if (w.__haxLang === 'es' || w.__haxLang === 'pt' || w.__haxLang === 'en') return w.__haxLang;
            var stored = w.localStorage && w.localStorage.getItem('haxball_language');
            if (stored === 'es' || stored === 'pt' || stored === 'en') return stored;
        } catch (e) {}
        return 'es';
    }

    var PLAY_HAXBALL = 'https://www.haxball.com/play';

    function getZipProfileStrings(lang) {
        lang = (lang === 'pt' || lang === 'en') ? lang : 'es';
        var S = {
            es: {
                loginTitle: 'Iniciá sesión',
                loginMsg: 'Para ver tu perfil con foto de Discord y datos automáticos, entrá con Discord desde HaxBall Zero y volvé a la lista de salas. Después abrí de nuevo el perfil desde el avatar.',
                loginBtn: 'Ir al juego',
                backRooms: 'Volver a salas',
                pageTitle: 'Mi perfil',
                pageLead: 'Tu cuenta y estado en HaxBall Zero.',
                statusLbl: 'Estado',
                roomLbl: 'Sala actual',
                accountLbl: 'Cuenta',
                online: 'En línea',
                inRoom: 'En sala',
                notInRoom: 'Sin sala',
                accountDiscord: 'Discord',
                accountGuest: 'Invitado',
                detailsLbl: 'Detalles',
                statsLbl: 'Estadísticas',
                playTimeLbl: 'Horas jugadas',
                createdLbl: 'Fecha de creación',
                streakLbl: 'Racha de días',
                proCta: 'PRO',
                proTitle: 'Pro'
            },
            pt: {
                loginTitle: 'Inicia sessão',
                loginMsg: 'Para ver o teu perfil com foto do Discord e dados automáticos, entra com Discord no HaxBall Zero e volta à lista de salas. Depois abre de novo o perfil pelo avatar.',
                loginBtn: 'Ir ao jogo',
                backRooms: 'Voltar às salas',
                pageTitle: 'Meu perfil',
                pageLead: 'Sua conta e status no HaxBall Zero.',
                statusLbl: 'Estado',
                roomLbl: 'Sala atual',
                accountLbl: 'Conta',
                online: 'Online',
                inRoom: 'Na sala',
                notInRoom: 'Sem sala',
                accountDiscord: 'Discord',
                accountGuest: 'Convidado',
                detailsLbl: 'Detalhes',
                statsLbl: 'Estatísticas',
                playTimeLbl: 'Horas jogadas',
                createdLbl: 'Data de criação',
                streakLbl: 'Sequência de dias',
                proCta: 'PRO',
                proTitle: 'Pro'
            },
            en: {
                loginTitle: 'Sign in',
                loginMsg: 'To see your profile with Discord avatar and auto-filled data, sign in with Discord from HaxBall Zero and return to the room list. Then open your profile again from the avatar.',
                loginBtn: 'Go to game',
                backRooms: 'Back to rooms',
                pageTitle: 'My profile',
                pageLead: 'Your account and status in HaxBall Zero.',
                statusLbl: 'Status',
                roomLbl: 'Current room',
                accountLbl: 'Account',
                online: 'Online',
                inRoom: 'In room',
                notInRoom: 'Not in a room',
                accountDiscord: 'Discord',
                accountGuest: 'Guest',
                detailsLbl: 'Details',
                statsLbl: 'Statistics',
                playTimeLbl: 'Hours played',
                createdLbl: 'Account created',
                streakLbl: 'Day streak',
                proCta: 'PRO',
                proTitle: 'Pro'
            }
        };
        return S[lang] || S.es;
    }

    function formatPlayStreakDays(days, lang) {
        lang = (lang === 'pt' || lang === 'en') ? lang : 'es';
        var n = Math.max(0, Math.floor(Number(days) || 0));
        if (lang === 'en') return n + (n === 1 ? ' day' : ' days');
        if (lang === 'pt') return n + (n === 1 ? ' dia' : ' dias');
        return n + (n === 1 ? ' día' : ' días');
    }

    function formatPlayTimeMinutes(minutes, lang) {
        lang = (lang === 'pt' || lang === 'en') ? lang : 'es';
        var m = Math.max(0, Math.floor(Number(minutes) || 0));
        if (m <= 0) return '0 min';
        var h = Math.floor(m / 60);
        var rem = m % 60;
        if (h <= 0) return rem + ' min';
        if (rem === 0) {
            if (lang === 'en') return h + (h === 1 ? ' hr' : ' hrs');
            return h + ' h';
        }
        if (lang === 'en') return h + (h === 1 ? ' hr' : ' hrs') + ' ' + rem + ' min';
        return h + ' h ' + rem + ' min';
    }

    function formatCreatedAt(value, lang) {
        if (!value) return '—';
        var d = new Date(value);
        if (isNaN(d.getTime())) return '—';
        var loc = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-AR';
        try {
            return d.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (eFmt) {
            return d.toISOString().slice(0, 10);
        }
    }

    function zipVerifiedBadgeSvg(size) {
        var s = String(size || 18);
        return (
            '<svg width="' +
            s +
            '" height="' +
            s +
            '" viewBox="0 0 22 22" fill="none" aria-hidden="true">' +
            '<path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="currentColor"></path>' +
            '<path d="M15 9l-4.5 4.5L8 11" stroke="#0d0d0d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
        );
    }

    function openProFromZipPanel(iframeDoc) {
        if (window.__hxdOpenProInpanel) {
            try {
                window.__hxdOpenProInpanel(iframeDoc);
                return;
            } catch (eZip) {}
        }
        showProPopupFromIframe();
    }

    function showProPopupFromIframe() {
        if (window.__showProPopup) {
            window.__showProPopup();
        } else if (window.top && window.top.__showProPopup) {
            window.top.__showProPopup();
        }
    }

    function goHaxballPlay() {
        try {
            (window.top || window).location.href = PLAY_HAXBALL;
        } catch (e) {
            window.location.href = PLAY_HAXBALL;
        }
    }

    function defaultAvatarZip(id) {
        try {
            var idx = Number((BigInt(String(id)) >> 22n) % 6n);
            return 'https://cdn.discordapp.com/embed/avatars/' + idx + '.png';
        } catch (e) {
            return 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }

    function hideInpanelProfile(iframeDoc) {
        window.__hxdRoomlistPreviewInpanelMode = '';
        delete iframeDoc.hxdRoomlistProfileSnapshot;
        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (dialog) {
            dialog.classList.remove('zero-profile-mode');
            scheduleRoomlistDialogOverlayUnlock(dialog);
        }
        var root = iframeDoc.getElementById('zero-inpanel-profile');
        if (root) root.style.display = 'none';
        if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
            try {
                JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc);
            } catch (eZj) {}
        }
    }

    /** Igual que wad/resources/extensions/roomlist.js (Pro): guarda/restaura display inline. */
    function setSwapVisibility(el, visible) {
        if (!el) return;
        if (visible) {
            if (el.dataset && Object.prototype.hasOwnProperty.call(el.dataset, 'zeroPrevDisplay')) {
                el.style.display = el.dataset.zeroPrevDisplay;
                delete el.dataset.zeroPrevDisplay;
            } else {
                el.style.removeProperty('display');
            }
            return;
        }
        if (el.dataset && !Object.prototype.hasOwnProperty.call(el.dataset, 'zeroPrevDisplay')) {
            el.dataset.zeroPrevDisplay = el.style.display || '';
        }
        el.style.display = 'none';
    }

    /**
     * Tranca ancho/alto do diálogo unha vez por sesión de overlay (equipos/amigos/perfil/Pro).
     * Ao saír do último modo, restáurase no seguinte frame para evitar saltos ao trocar entre paneles.
     */
    function ensureRoomlistDialogOverlayLocked(dialog) {
        if (!dialog || dialog.dataset.zeroRlOverlayLock === '1') return;
        if (dialog.dataset.zeroRlPrevW == null) {
            dialog.dataset.zeroRlPrevW = dialog.style.width || '';
            dialog.dataset.zeroRlPrevH = dialog.style.height || '';
            dialog.dataset.zeroRlPrevMaxW = dialog.style.maxWidth || '';
            dialog.dataset.zeroRlPrevMinH = dialog.style.minHeight || '';
        }
        var r = dialog.getBoundingClientRect();
        var w = Math.max(320, Math.round(r.width));
        var h = Math.max(240, Math.round(r.height));
        dialog.style.width = w + 'px';
        dialog.style.maxWidth = w + 'px';
        dialog.style.height = h + 'px';
        dialog.style.minHeight = h + 'px';
        dialog.dataset.zeroRlOverlayLock = '1';
    }

    function scheduleRoomlistDialogOverlayUnlock(dialog) {
        if (!dialog) return;
        if (dialog.__zeroRlUnlockTimer) {
            clearTimeout(dialog.__zeroRlUnlockTimer);
        }
        dialog.__zeroRlUnlockTimer = setTimeout(function() {
            dialog.__zeroRlUnlockTimer = null;
            if (!dialog || !dialog.classList) return;
            if (dialog.classList.contains('zero-profile-mode')) return;
            if (dialog.classList.contains('zero-pro-mode')) return;
            if (dialog.classList.contains('zero-kit-mode')) return;
            if (dialog.dataset.zeroRlOverlayLock !== '1') return;
            dialog.style.width = dialog.dataset.zeroRlPrevW || '';
            dialog.style.maxWidth = dialog.dataset.zeroRlPrevMaxW || '';
            dialog.style.height = dialog.dataset.zeroRlPrevH || '';
            dialog.style.minHeight = dialog.dataset.zeroRlPrevMinH || '';
            delete dialog.dataset.zeroRlOverlayLock;
            delete dialog.dataset.zeroRlPrevW;
            delete dialog.dataset.zeroRlPrevH;
            delete dialog.dataset.zeroRlPrevMaxW;
            delete dialog.dataset.zeroRlPrevMinH;
        }, 0);
    }

    /**
     * Modo Pro embebido (misma lógica de visibilidad que perfil / kit).
     */
    function setRoomlistDialogProMode(iframeDoc, dialog, active) {
        if (!iframeDoc || !dialog) return;
        if (active) {
            ensureRoomlistDialogOverlayLocked(dialog);
        } else {
            scheduleRoomlistDialogOverlayUnlock(dialog);
        }

        var chP = dialog.children;
        for (var k = 0; k < chP.length; k++) {
            var c = chP[k];
            if (!c || !c.id) {
                setSwapVisibility(c, !active);
                continue;
            }
            if (c.id === 'sidebar-panel') {
                if (c.dataset && Object.prototype.hasOwnProperty.call(c.dataset, 'zeroPrevDisplay')) {
                    delete c.dataset.zeroPrevDisplay;
                }
                c.style.display = 'flex';
                c.style.flexDirection = 'column';
                continue;
            }
            if (c.id === 'zero-inpanel-pro') {
                setSwapVisibility(c, active);
                continue;
            }
            if (c.id === 'zero-inpanel-jersey') {
                setSwapVisibility(c, !active);
                continue;
            }
            if (c.id === 'zero-inpanel-ranked') {
                setSwapVisibility(c, !active);
                continue;
            }
            setSwapVisibility(c, !active);
        }

        var profileRootP = iframeDoc.getElementById('zero-inpanel-profile');
        if (profileRootP) {
            if (active) profileRootP.style.display = 'none';
            else if (dialog.classList.contains('zero-profile-mode')) profileRootP.style.display = 'flex';
        }
        var proHostP = iframeDoc.getElementById('zero-inpanel-pro');
        if (proHostP) proHostP.style.display = active ? 'flex' : 'none';
        var jerseySyncP = iframeDoc.getElementById('zero-inpanel-jersey');
        if (jerseySyncP) {
            jerseySyncP.style.display = active ? 'none' : (dialog.classList.contains('zero-kit-mode') ? 'flex' : 'none');
        }
        if (!active) {
            var rsP = iframeDoc.getElementById('room-search');
            if (rsP && rsP.style) rsP.style.display = 'flex';
        }
    }

    window.__hxdSetRoomlistDialogProMode = setRoomlistDialogProMode;

    /**
     * Modo creador de camiseta (/colors) incrustado na roomlist.
     */
    function setRoomlistDialogKitMode(iframeDoc, dialog, active) {
        if (!iframeDoc || !dialog) return;
        if (active) {
            ensureRoomlistDialogOverlayLocked(dialog);
        } else {
            scheduleRoomlistDialogOverlayUnlock(dialog);
        }

        var kitCh = dialog.children;
        for (var ki = 0; ki < kitCh.length; ki++) {
            var ck = kitCh[ki];
            if (!ck || !ck.id) {
                setSwapVisibility(ck, !active);
                continue;
            }
            if (ck.id === 'sidebar-panel') {
                if (ck.dataset && Object.prototype.hasOwnProperty.call(ck.dataset, 'zeroPrevDisplay')) {
                    delete ck.dataset.zeroPrevDisplay;
                }
                ck.style.display = 'flex';
                ck.style.flexDirection = 'column';
                continue;
            }
            if (ck.id === 'zero-inpanel-jersey') {
                setSwapVisibility(ck, active);
                continue;
            }
            if (ck.id === 'zero-inpanel-pro') {
                setSwapVisibility(ck, !active);
                continue;
            }
            if (ck.id === 'zero-inpanel-ranked') {
                setSwapVisibility(ck, !active);
                continue;
            }
            setSwapVisibility(ck, !active);
        }

        var profileRootK = iframeDoc.getElementById('zero-inpanel-profile');
        if (profileRootK) {
            if (active) profileRootK.style.display = 'none';
            else if (dialog.classList.contains('zero-profile-mode')) profileRootK.style.display = 'flex';
        }
        var proRootK = iframeDoc.getElementById('zero-inpanel-pro');
        if (proRootK) proRootK.style.display = active ? 'none' : (dialog.classList.contains('zero-pro-mode') ? 'flex' : 'none');
        var jerseyHostK = iframeDoc.getElementById('zero-inpanel-jersey');
        if (jerseyHostK) jerseyHostK.style.display = active ? 'flex' : 'none';
        if (!active) {
            var rsK = iframeDoc.getElementById('room-search');
            if (rsK && rsK.style) rsK.style.display = 'flex';
        }
    }

    window.__hxdSetRoomlistDialogKitMode = setRoomlistDialogKitMode;

    function ensureZeroInpanelPro(iframeDoc, dialog) {
        var existing = iframeDoc.getElementById('zero-inpanel-pro');
        if (existing) return existing;
        var wrap = iframeDoc.createElement('div');
        wrap.id = 'zero-inpanel-pro';
        wrap.style.display = 'none';
        wrap.style.flexDirection = 'column';
        wrap.style.width = '100%';
        wrap.style.height = '100%';
        wrap.style.boxSizing = 'border-box';
        wrap.style.margin = '0';
        wrap.style.padding = '0';
        wrap.style.minHeight = '0';
        wrap.style.maxHeight = 'none';
        wrap.style.overflow = 'hidden';
        wrap.style.flex = '1 1 auto';
        wrap.style.background = 'var(--theme-bg-primary, #141414)';
        wrap.style.fontFamily = '"Space Grotesk", sans-serif';
        wrap.style.fontSize = '12px';
        wrap.style.color = '#fff';
        wrap.innerHTML =
            '<div style="padding:10px 12px 0 12px;position:relative;flex-shrink:0;border-bottom:1px solid #232323;">' +
            '<button type="button" id="close-pro-inpanel-btn" style="position:absolute;top:8px;right:10px;background:none;border:none;color:#666;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;" title="×">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
            '<h1 style="color:#fff;font-size:16px;font-weight:600;margin:0 0 10px 0;padding:4px 28px 0 0;text-align:center;font-family:inherit;">Pro</h1></div>' +
            '<div id="pro-inpanel-content" style="flex:1;min-height:0;overflow-y:auto;padding:0 12px 14px;"></div>';
        var sb = iframeDoc.getElementById('sidebar-panel');
        if (sb && sb.parentNode === dialog) {
            dialog.insertBefore(wrap, sb);
        } else {
            dialog.appendChild(wrap);
        }
        var cb = wrap.querySelector('#close-pro-inpanel-btn');
        if (cb) {
            cb.addEventListener('click', function() {
                closeInpanelPro(iframeDoc);
            });
        }
        return wrap;
    }

    function closeInpanelPro(iframeDoc) {
        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (!dialog) return;
        if (window.__hxdClearProInpanelContext) {
            try {
                window.__hxdClearProInpanelContext();
            } catch (eCtx) {}
        }
        dialog.classList.remove('zero-pro-mode');
        if (window.__hxdSetRoomlistDialogProMode) {
            try {
                window.__hxdSetRoomlistDialogProMode(iframeDoc, dialog, false);
            } catch (ePr) {}
        }
        var proContent = iframeDoc.getElementById('pro-inpanel-content');
        if (proContent) proContent.innerHTML = '';
        scheduleRoomlistDialogOverlayUnlock(dialog);
    }

    function openInpanelProFromRoomlist(iframeDoc) {
        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (!dialog) {
            showProPopupFromIframe();
            return;
        }
        if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
            try {
                JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc);
            } catch (eJk) {}
        }
        dialog.classList.remove('zero-profile-mode', 'zero-kit-mode');
        var zipRoot = iframeDoc.getElementById('zero-inpanel-profile');
        if (zipRoot) zipRoot.style.display = 'none';

        var proWrap = ensureZeroInpanelPro(iframeDoc, dialog);
        ensureRoomlistDialogOverlayLocked(dialog);
        if (window.__hxdSetRoomlistDialogProMode) {
            try {
                window.__hxdSetRoomlistDialogProMode(iframeDoc, dialog, true);
            } catch (e3) {}
        }
        dialog.classList.add('zero-pro-mode');
        if (window.__hxdRenderProIntoInpanel) {
            try {
                window.__hxdRenderProIntoInpanel(iframeDoc, proWrap);
            } catch (e4) {
                showProPopupFromIframe();
            }
        } else {
            showProPopupFromIframe();
        }
    }

    function openInpanelProfileFromRoomlist(iframeDoc) {
        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (!dialog) return;
        if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
            try {
                JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc);
            } catch (eJk2) {}
        }
        dialog.classList.remove('zero-pro-mode', 'zero-kit-mode');
        if (window.__hxdSetRoomlistDialogProMode) {
            try {
                window.__hxdSetRoomlistDialogProMode(iframeDoc, dialog, false);
            } catch (e3) {}
        }
        if (window.__hxdSetRoomlistDialogKitMode) {
            try {
                window.__hxdSetRoomlistDialogKitMode(iframeDoc, dialog, false);
            } catch (eKp) {}
        }
        var proW = iframeDoc.getElementById('zero-inpanel-pro');
        if (proW) proW.style.display = 'none';

        if (iframeDoc.getElementById('hxd-roomlist-preview-frame')) {
            window.__hxdRoomlistPreviewInpanelMode = 'profile';
            dialog.classList.remove('zero-profile-mode');
            var zipRoot = iframeDoc.getElementById('zero-inpanel-profile');
            if (zipRoot) zipRoot.style.display = 'none';
            fetchProfileBundle(true).then(function(data) {
                iframeDoc.hxdRoomlistProfileSnapshot = buildProfileSnapshotForPreview(iframeDoc, data && data.user);
                pushRoomlistPreviewSyncNow(iframeDoc, true);
            }).catch(function() {
                iframeDoc.hxdRoomlistProfileSnapshot = buildProfileSnapshotForPreview(iframeDoc, profileDataCache && profileDataCache.user);
                pushRoomlistPreviewSyncNow(iframeDoc, true);
            });
            return;
        }

        dialog.classList.add('zero-profile-mode');
        ensureRoomlistDialogOverlayLocked(dialog);
        var root = iframeDoc.getElementById('zero-inpanel-profile');
        if (root) {
            root.style.display = 'flex';
            fetchProfileBundle(true).then(function(data) {
                renderZipProfile(iframeDoc, data);
            }).catch(function() {});
        }
    }

    window.__hxdOpenRoomlistProfile = openInpanelProfileFromRoomlist;
    window.__hxdOpenProInpanel = openInpanelProFromRoomlist;
    window.__hxdCloseProInpanel = closeInpanelPro;

    function renderZipProfile(iframeDoc, data) {
        var lang = getUiLang();
        var T = getZipProfileStrings(lang);
        var wall = iframeDoc.getElementById('zip-login-wall');
        var main = iframeDoc.getElementById('zip-main-wrap');
        var user = data && data.user;

        function setText(id, text) {
            var el = iframeDoc.getElementById(id);
            if (el) el.textContent = text;
        }

        setText('zip-login-title', T.loginTitle);
        setText('zip-login-msg', T.loginMsg);
        setText('zip-login-goto', T.loginBtn);
        var loginPro = iframeDoc.getElementById('zip-login-pro');
        if (loginPro) {
            loginPro.innerHTML =
                '<span class="zip-login-pro-ic">' + zipVerifiedBadgeSvg(16) + '</span><span class="zip-login-pro-txt">' + escapeHtml(T.proCta) + '</span>';
            loginPro.setAttribute('title', T.proTitle);
            loginPro.setAttribute('aria-label', T.proTitle);
        }
        if (loginPro) loginPro.style.display = '';
        var backBtn = iframeDoc.getElementById('zip-back-salas');
        if (backBtn) {
            backBtn.title = T.backRooms;
            backBtn.setAttribute('aria-label', T.backRooms);
        }
        setText('zip-profile-title', T.pageTitle);
        setText('zip-profile-lead', T.pageLead);
        setText('zip-lbl-stats', T.statsLbl);
        setText('zip-lbl-playtime', T.playTimeLbl);
        setText('zip-lbl-created', T.createdLbl);
        setText('zip-lbl-streak', T.streakLbl);
        if (!user || !user.discord_id) {
            user = getLocalProfileUser();
        }
        if (!user || !user.discord_id) {
            if (wall) wall.style.display = 'flex';
            if (main) main.style.display = 'none';
            return;
        }
        if (wall) wall.style.display = 'none';
        if (main) main.style.display = 'block';

        var nick = user.nick || user.username || 'Player';
        setText('zip-display', nick);
        var handleEl = iframeDoc.getElementById('zip-handle');
        var handleName = user.username || user.discord_username || '';
        if (handleEl) {
            if (handleName) {
                handleEl.textContent = '@' + handleName;
                handleEl.style.display = '';
            } else {
                handleEl.textContent = '';
                handleEl.style.display = 'none';
            }
        }
        var avEl = iframeDoc.getElementById('zip-avatar');
        var avFb = iframeDoc.getElementById('zip-avatar-fb');
        if (avEl) {
            avEl.src = user.discord_avatar || defaultAvatarZip(user.discord_id);
            avEl.alt = nick;
            avEl.hidden = false;
        }
        if (avFb) {
            avFb.textContent = nick.slice(0, 2).toUpperCase();
            avFb.style.display = avEl && avEl.src ? 'none' : '';
        }
        var tierEl = iframeDoc.getElementById('zip-tier');
        if (tierEl) {
            tierEl.className = 'zip-tier';
            if (user.is_pro) {
                tierEl.textContent = 'PRO';
                tierEl.classList.add('zip-tier--pro');
            } else if (user.is_vip) {
                tierEl.textContent = 'VIP';
                tierEl.classList.add('zip-tier--vip');
            } else {
                tierEl.textContent = 'NOVATO+';
                tierEl.classList.add('zip-tier--default');
            }
        }
        setText('zip-playtime', formatPlayTimeMinutes(user.play_time_minutes, lang));
        setText('zip-created', formatCreatedAt(user.created_at, lang));
        setText('zip-streak', formatPlayStreakDays(user.play_streak_days, lang));
    }

    function bindZipProfilePanel(iframeDoc) {
        var root = iframeDoc.getElementById('zero-inpanel-profile');
        if (!root || root.getAttribute('data-bound') === '1') return;
        root.setAttribute('data-bound', '1');
        var back = iframeDoc.getElementById('zip-back-salas');
        var gotoBtn = iframeDoc.getElementById('zip-login-goto');
        if (back) back.onclick = function() { hideInpanelProfile(iframeDoc); };
        if (gotoBtn) gotoBtn.onclick = goHaxballPlay;
        var loginProBtn = iframeDoc.getElementById('zip-login-pro');
        if (loginProBtn) loginProBtn.onclick = function() { openProFromZipPanel(iframeDoc); };
    }

    function buildZeroInpanelProfileHtml() {
        return (
            '<div id="zip-login-wall" class="zip-login-wall">' +
            '<div class="zip-login-card">' +
            '<h1 id="zip-login-title" class="zip-login-h1"></h1>' +
            '<p id="zip-login-msg" class="zip-login-p"></p>' +
            '<button type="button" id="zip-login-goto" class="zip-login-btn"></button>' +
            '<button type="button" id="zip-login-pro" class="zip-login-pro-btn"></button>' +
            '</div></div>' +
            '<div id="zip-main-wrap" class="zip-main-wrap">' +
            '<div class="zip-toolbar">' +
            '<button type="button" id="zip-back-salas" class="zip-back-btn" title="">←</button>' +
            '<div class="zip-toolbar-mid"></div>' +
            '<span class="zip-toolbar-spacer"></span></div>' +
            '<div class="zip-profile-zero">' +
            '<h2 id="zip-profile-title" class="zip-profile-h2"></h2>' +
            '<p id="zip-profile-lead" class="zip-profile-lead"></p>' +
            '<div class="zip-list-block">' +
            '<div class="zip-zero-list">' +
            '<div class="zip-zero-row zip-profile-identity-row">' +
            '<div class="zip-profile-avatar-wrap">' +
            '<img id="zip-avatar" src="" alt="" hidden />' +
            '<div class="zip-avatar-fb" id="zip-avatar-fb">GZ</div>' +
            '<span class="zip-dot"></span></div>' +
            '<div class="zip-profile-meta">' +
            '<div class="zip-profile-name-row">' +
            '<span class="zip-name" id="zip-display">—</span>' +
            '<span class="zip-tier zip-tier--default" id="zip-tier">NOVATO+</span></div>' +
            '<p class="zip-pp-handle" id="zip-handle" style="display:none"></p>' +
            '</div></div></div></div>' +
            '<div class="zip-list-block">' +
            '<div class="zip-section-title" id="zip-lbl-stats"></div>' +
            '<div class="zip-zero-list">' +
            '<div class="zip-zero-row"><span class="zip-row-label" id="zip-lbl-playtime"></span><span class="zip-row-hint" id="zip-playtime"></span></div>' +
            '<div class="zip-zero-row"><span class="zip-row-label" id="zip-lbl-created"></span><span class="zip-row-hint" id="zip-created"></span></div>' +
            '<div class="zip-zero-row"><span class="zip-row-label" id="zip-lbl-streak"></span><span class="zip-row-hint" id="zip-streak"></span></div>' +
            '</div></div></div></div>'
        );
    }

    function fetchProfileBundle(forceRefresh) {
        if (forceRefresh) {
            profileDataPromise = null;
            profileDataCache = null;
        }
        if (profileDataPromise) return profileDataPromise;
        profileDataPromise = fetchJson('/user').then(function(user) {
            var loggedIn = user && user.logged_in ? user : getLocalProfileUser();
            profileDataCache = { user: loggedIn };
            profileDataPromise = null;
            return profileDataCache;
        }).catch(function(error) {
            profileDataPromise = null;
            profileDataCache = { user: getLocalProfileUser() };
            return profileDataCache;
        });
        return profileDataPromise;
    }

    // === FAVORITOS ===
    var FAV_STORAGE_KEY = 'fav_rooms';

    function getFavRooms() {
        try {
            return JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveFavRooms(rooms) {
        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(rooms));
    }

    function toggleFavRoom(roomName) {
        var cleanName = roomName.trim();
        var favRooms = getFavRooms();
        var index = favRooms.indexOf(cleanName);
        
        if (index === -1) {
            favRooms.push(cleanName);
            saveFavRooms(favRooms);
            return true;
        } else {
            favRooms.splice(index, 1);
            saveFavRooms(favRooms);
            return false;
        }
    }

    function isFavRoom(roomName) {
        return getFavRooms().indexOf(roomName) !== -1;
    }

    // === SALAS FIXADAS (PIN) ===
    var PINNED_STORAGE_KEY = 'pinned_rooms';

    function getPinnedRooms() {
        try {
            return JSON.parse(sessionStorage.getItem(PINNED_STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function savePinnedRooms(rooms) {
        sessionStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(rooms));
    }

    function togglePinnedRoom(roomName) {
        var cleanName = roomName.trim();
        var pinnedRooms = getPinnedRooms();
        var index = pinnedRooms.indexOf(cleanName);
        
        if (index === -1) {
            pinnedRooms.push(cleanName);
            savePinnedRooms(pinnedRooms);
            return true;
        } else {
            pinnedRooms.splice(index, 1);
            savePinnedRooms(pinnedRooms);
            return false;
        }
    }

    function isPinnedRoom(roomName) {
        return getPinnedRooms().indexOf(roomName.trim()) !== -1;
    }

    function clearPinnedRooms() {
        sessionStorage.removeItem(PINNED_STORAGE_KEY);
    }

    function movePinnedToTop(listContainer) {
        if (!listContainer) return;
        var pinnedRooms = getPinnedRooms();
        if (pinnedRooms.length === 0) return;

        var rows = Array.prototype.slice.call(listContainer.querySelectorAll('tr'));
        var pinnedRows = [];
        var normalRows = [];
        
        // Separa as rows em fixadas e normais
        for (var i = 0; i < rows.length; i++) {
            var nameCell = rows[i].querySelector('[data-hook="name"]');
            if (nameCell) {
                var roomName = (nameCell.textContent || '').trim();
                if (pinnedRooms.indexOf(roomName) !== -1) {
                    pinnedRows.push(rows[i]);
                } else {
                    normalRows.push(rows[i]);
                }
            } else {
                normalRows.push(rows[i]);
            }
        }

        // Verifica se já está na ordem correta (evita loop infinito)
        var needsReorder = false;
        for (var j = 0; j < pinnedRows.length; j++) {
            if (rows[j] !== pinnedRows[j]) {
                needsReorder = true;
                break;
            }
        }

        if (!needsReorder) return;

        // Remove todas as rows
        for (var k = 0; k < rows.length; k++) {
            rows[k].remove();
        }

        // Adiciona fixadas primeiro, depois normais
        for (var m = 0; m < pinnedRows.length; m++) {
            listContainer.appendChild(pinnedRows[m]);
        }
        for (var n = 0; n < normalRows.length; n++) {
            listContainer.appendChild(normalRows[n]);
        }
    }

    function updatePinnedHighlight(container) {
        var rows = container.querySelectorAll('tr');
        var pinnedRooms = getPinnedRooms();
        
        for (var i = 0; i < rows.length; i++) {
            var nameCell = rows[i].querySelector('[data-hook="name"]');
            if (!nameCell) continue;
            var name = (nameCell.textContent || '').trim();
            if (pinnedRooms.indexOf(name) !== -1) {
                rows[i].classList.add('pinned-room');
            } else {
                rows[i].classList.remove('pinned-room');
            }
        }
    }

    function cleanupRoomList() {
        if (roomListObserver) {
            roomListObserver.disconnect();
            roomListObserver = null;
        }
        cachedRows = null;
    }

    function teardownRoomListLoadingOverlay(iframeDoc) {
        var overlay = iframeDoc.getElementById('hxd-roomlist-loading');
        if (!overlay) return;
        if (overlay._hxdRoomlistLoadMo) {
            overlay._hxdRoomlistLoadMo.disconnect();
            overlay._hxdRoomlistLoadMo = null;
        }
        if (overlay._hxdRoomlistLoadIv) {
            clearInterval(overlay._hxdRoomlistLoadIv);
            overlay._hxdRoomlistLoadIv = null;
        }
        overlay.remove();
    }

    function buildCache(iframeDoc) {
        var table = iframeDoc.querySelector("[data-hook='list']");
        if (!table) return [];

        cachedRows = [];
        var rows = table.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var nameCell = row.querySelector("[data-hook='name']");
            var flagCell = row.querySelector("[data-hook='flag']");
            cachedRows.push({
                row: row,
                name: nameCell ? (nameCell.textContent || '').toLowerCase() : '',
                country: flagCell ? flagCell.className.replace('flagico f-', '').trim() : ''
            });
        }
        return cachedRows;
    }

    function doSearch(iframeDoc, searchTerm) {
        var rows = cachedRows || buildCache(iframeDoc);
        if (!rows.length) return;

        for (var i = 0; i < rows.length; i++) {
            var item = rows[i];
            var matchesSearch = searchTerm === '' || item.name.indexOf(searchTerm) !== -1;
            var matchesCountry = selectedCountry === 'all' || item.country === selectedCountry;

            if (matchesSearch && matchesCountry) {
                item.row.classList.remove('search-hidden');
            } else {
                item.row.classList.add('search-hidden');
            }
        }
    }

    // === ROOMLIST PREVIEW (iframe UI) ===
    var roomlistPreviewHtmlCache = null;
    var roomlistPreviewFetchPending = null;

    function injectRoomlistPreviewBootStyles(doc) {
        var css =
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) > h1,' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) > p,' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) > .content,' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) table.header,' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) .buttons,' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) #room-search,' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) #sidebar-panel,' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog > h1,' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog > p,' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog > .content,' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog table.header,' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog .buttons,' +
            'html.hxd-roomlist-preview-pending .roomlist-view #room-search,' +
            'html.hxd-roomlist-preview-pending .roomlist-view #sidebar-panel{' +
                'display:none!important;' +
            '}' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)) > .splitter,' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog > .splitter{' +
                'position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;' +
                'overflow:hidden!important;opacity:0!important;visibility:hidden!important;' +
                'pointer-events:none!important;z-index:-1!important;' +
            '}' +
            '.roomlist-view .dialog:not(:has(#hxd-roomlist-preview-frame)),' +
            'html.hxd-roomlist-preview-pending .roomlist-view .dialog{' +
                'background:var(--theme-bg-secondary,#1a1a1a)!important;' +
                'border:none!important;box-shadow:none!important;padding:0!important;overflow:hidden!important;' +
            '}' +
            '#hxd-roomlist-preview-root:not(:has(#hxd-roomlist-preview-frame)){' +
                'position:relative;width:100%;height:100%;' +
                'background:var(--theme-bg-secondary,#1a1a1a);' +
            '}';
        var style = doc.getElementById('hxd-roomlist-preview-boot-styles');
        if (style) {
            style.textContent = css;
            return;
        }
        style = doc.createElement('style');
        style.id = 'hxd-roomlist-preview-boot-styles';
        style.textContent = css;
        var head = doc.head || doc.getElementsByTagName('head')[0];
        if (head) head.appendChild(style);
        else doc.documentElement.appendChild(style);
    }

    function markRoomlistPreviewPending(doc) {
        try { doc.documentElement.classList.add('hxd-roomlist-preview-pending'); } catch (eP) {}
    }

    function clearRoomlistPreviewPending(doc) {
        try { doc.documentElement.classList.remove('hxd-roomlist-preview-pending'); } catch (eC) {}
    }

    function prepareRoomlistPreviewDialog(doc, dialog, options) {
        if (!dialog) return;
        options = options || {};
        injectRoomlistPreviewBootStyles(doc);
        if (options.markPending && !doc.getElementById('hxd-roomlist-preview-frame')) {
            markRoomlistPreviewPending(doc);
        }
        ensureRoomlistPreviewStyles(doc);
        applyRoomlistPreviewDialogSize(dialog);
        removeLegacyRoomlistChrome(doc);
        try { doc.documentElement.classList.add('hxd-roomlist-preview-active'); } catch (eA) {}
    }

    function ensureRoomlistPreviewShell(doc, dialog) {
        if (!dialog) return null;
        var root = doc.getElementById('hxd-roomlist-preview-root');
        if (root) return root;
        root = doc.createElement('div');
        root.id = 'hxd-roomlist-preview-root';
        root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:transparent;';
        dialog.appendChild(root);
        return root;
    }

    function bootRoomlistPreviewPipeline(doc) {
        if (!Injector.isGameFrame()) return;
        injectRoomlistPreviewBootStyles(doc);
        fetchRoomlistPreviewHtml(function () {});

        var tick = function () {
            var view = doc.querySelector('.roomlist-view');
            if (!view) return;
            var dialog = view.querySelector('.dialog');
            if (!dialog) return;
            prepareRoomlistPreviewDialog(doc, dialog);
            ensureRoomlistPreviewShell(doc, dialog);
            if (!doc.getElementById('hxd-roomlist-preview-frame') && dialog.dataset.hxdPreviewMounting !== '1') {
                ensureRoomlistPreview(doc);
            }
        };

        if (!doc.hxdRoomlistPreviewBootMo) {
            doc.hxdRoomlistPreviewBootMo = new MutationObserver(tick);
            doc.hxdRoomlistPreviewBootMo.observe(doc.documentElement, { childList: true, subtree: true });
        }
        tick();
    }

    function getRoomlistPreviewUrl() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                return chrome.runtime.getURL('roomlist-preview.html');
            }
        } catch (eUrl) {}
        return null;
    }

    function fetchRoomlistPreviewHtml(done) {
        if (roomlistPreviewHtmlCache) {
            done(null, roomlistPreviewHtmlCache);
            return;
        }
        if (roomlistPreviewFetchPending) {
            roomlistPreviewFetchPending.push(done);
            return;
        }
        roomlistPreviewFetchPending = [done];
        var url = getRoomlistPreviewUrl();
        if (!url) {
            roomlistPreviewFetchPending.forEach(function (cb) { cb(new Error('no preview url')); });
            roomlistPreviewFetchPending = null;
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
            var pending = roomlistPreviewFetchPending || [];
            roomlistPreviewFetchPending = null;
            if (xhr.status === 200 && xhr.responseText) {
                roomlistPreviewHtmlCache = xhr.responseText;
                pending.forEach(function (cb) { cb(null, roomlistPreviewHtmlCache); });
            } else {
                pending.forEach(function (cb) { cb(new Error('preview fetch failed')); });
            }
        };
        xhr.onerror = function () {
            var pending = roomlistPreviewFetchPending || [];
            roomlistPreviewFetchPending = null;
            pending.forEach(function (cb) { cb(new Error('preview xhr error')); });
        };
        xhr.send();
    }

    function getRoomlistPreviewStylesCss() {
        return '.roomlist-view .dialog.hxd-roomlist-preview-dialog{' +
            'background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;overflow:hidden!important;' +
            'max-width:none!important;' +
        '}' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog > h1,' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog > p{display:none!important;}' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog > .splitter{' +
            'position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;' +
            'overflow:hidden!important;opacity:0!important;pointer-events:none!important;z-index:0!important;' +
        '}' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog #hxd-roomlist-preview-root{display:block!important;position:relative;z-index:2!important;}' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog #sidebar-panel{display:none!important;}' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog.zero-kit-mode #hxd-roomlist-preview-root{display:none!important;}' +
        '.roomlist-view .dialog.hxd-roomlist-preview-dialog.zero-profile-mode #zero-inpanel-profile{' +
            'position:absolute!important;inset:0!important;z-index:4!important;display:flex!important;' +
        '}' +
        '#hxd-roomlist-preview-root{display:block!important;position:relative;z-index:2;width:100%;height:100%;background:transparent!important;}' +
        '#hxd-roomlist-preview-frame{width:100%;height:100%;border:none;display:block;background:transparent;}' +
        'html.hxd-roomlist-preview-active .create-room-view{' +
            'position:fixed!important;left:-10000px!important;top:0!important;' +
            'opacity:0!important;visibility:hidden!important;pointer-events:none!important;' +
        '}';
    }

    function ensureRoomlistPreviewStyles(doc) {
        var style = doc.getElementById('hxd-roomlist-preview-styles');
        var css = getRoomlistPreviewStylesCss();
        if (style) {
            style.textContent = css;
            return;
        }
        style = doc.createElement('style');
        style.id = 'hxd-roomlist-preview-styles';
        style.textContent = css;
        doc.head.appendChild(style);
    }

    function applyRoomlistPreviewDialogSize(dialog) {
        Injector.applyPreviewShellSize(dialog, 'hxd-roomlist-preview-dialog');
    }

    function bindRoomlistPreviewResize(doc) {
        if (doc.hxdRoomlistPreviewResizeBound) return;
        doc.hxdRoomlistPreviewResizeBound = true;
        var resizeTick = null;
        var onResize = function () {
            if (resizeTick) clearTimeout(resizeTick);
            resizeTick = setTimeout(function () {
                var dialog = doc.querySelector('.roomlist-view .dialog.hxd-roomlist-preview-dialog');
                if (dialog) applyRoomlistPreviewDialogSize(dialog);
            }, 60);
        };
        doc.defaultView.addEventListener('resize', onResize);
        if (doc.defaultView.parent && doc.defaultView.parent !== doc.defaultView) {
            try { doc.defaultView.parent.addEventListener('resize', onResize); } catch (eParent) {}
        }
    }

    function getRoomListRoot(iframeDoc) {
        var view = iframeDoc.querySelector('.roomlist-view');
        if (!view) return null;
        return view.querySelector('[data-hook="list"]') ||
            view.querySelector('.content [data-hook="list"]') ||
            iframeDoc.querySelector("[data-hook='list']");
    }

    function getRoomListRows(iframeDoc) {
        var root = getRoomListRoot(iframeDoc);
        if (!root) return [];
        return root.querySelectorAll('tr');
    }

    function isRoomLocked(passEl) {
        if (!passEl) return false;
        var txt = (passEl.textContent || '').trim();
        if (/yes|si|sí|sim|locked|password|senha|contraseña/i.test(txt)) return true;
        if (passEl.querySelector('.icon-lock, [class*="lock"]')) return true;
        var html = passEl.innerHTML || '';
        return html.indexOf('icon-lock') !== -1;
    }

    var hxdRoomRowStatic = new WeakMap();
    var hxdPreviewScanCache = null;

    function invalidatePreviewScanCache() {
        hxdPreviewScanCache = null;
    }

    function readRowMetrics(row, room) {
        if (!row || !room) return false;
        var changed = false;

        var playersEl = row.querySelector('[data-hook="players"]');
        var playersText = playersEl ? (playersEl.textContent || '').trim() : '';
        var players = 0;
        var max = 0;
        var pm = playersText.match(/(\d+)\s*\/\s*(\d+)/);
        if (pm) {
            players = parseInt(pm[1], 10) || 0;
            max = parseInt(pm[2], 10) || 0;
        } else {
            var single = playersText.match(/(\d+)/);
            if (single) players = parseInt(single[1], 10) || 0;
            max = players;
        }
        if (room.players !== players) { room.players = players; changed = true; }
        if (room.max !== (max || Math.max(players, 1))) { room.max = max || Math.max(players, 1); changed = true; }

        var distEl = row.querySelector('[data-hook="distance"]');
        var distance = 0;
        if (distEl) {
            var distText = String(distEl.textContent || distEl.innerText || '').trim();
            var dm = distText.match(/(\d+)/);
            if (dm) distance = parseInt(dm[1], 10) || 0;
        }
        if (room.distance !== distance) { room.distance = distance; changed = true; }

        var sel = row.classList.contains('selected');
        if (room.selected !== sel) { room.selected = sel; changed = true; }

        return changed;
    }

    function parseRoomRow(row, index) {
        var staticPart = hxdRoomRowStatic.get(row);
        var name;
        var country;

        if (staticPart) {
            name = staticPart.name;
            country = staticPart.country;
        } else {
            var nameEl = row.querySelector('[data-hook="name"]');
            name = nameEl ? (nameEl.textContent || nameEl.innerText || '').replace(/\s+/g, ' ').trim() : '';
            if (!name) {
                var firstTd = row.querySelector('td');
                if (firstTd) name = (firstTd.textContent || '').replace(/\s+/g, ' ').trim();
            }
            if (!name) return null;

            var flagEl = row.querySelector('[data-hook="flag"]');
            country = '';
            if (flagEl) {
                var cls = String(flagEl.className || '');
                var m = cls.match(/\bf-([a-z]{2})\b/i);
                if (m) country = m[1].toLowerCase();
                else {
                    country = cls.replace(/.*\bf-/, '').replace(/\s+.*/, '').trim().toLowerCase();
                    if (country.length !== 2) country = '';
                }
            }
            hxdRoomRowStatic.set(row, { name: name, country: country });
        }

        var passEl = row.querySelector('[data-hook="pass"]');
        var locked = isRoomLocked(passEl);

        var distEl = row.querySelector('[data-hook="distance"]');
        var distance = 0;
        if (distEl) {
            var distText = String(distEl.textContent || distEl.innerText || '').trim();
            var dm = distText.match(/(\d+)/);
            if (dm) distance = parseInt(dm[1], 10) || 0;
        }

        var playersEl = row.querySelector('[data-hook="players"]');
        var playersText = playersEl ? (playersEl.textContent || '').trim() : '';
        var players = 0;
        var max = 0;
        var pm = playersText.match(/(\d+)\s*\/\s*(\d+)/);
        if (pm) {
            players = parseInt(pm[1], 10) || 0;
            max = parseInt(pm[2], 10) || 0;
        } else {
            var single = playersText.match(/(\d+)/);
            if (single) players = parseInt(single[1], 10) || 0;
            max = players;
        }

        return {
            id: 'row-' + index,
            name: name,
            country: country,
            players: players,
            max: max || Math.max(players, 1),
            distance: distance,
            domIndex: index,
            locked: locked,
            fav: isFavRoom(name),
            pinned: isPinnedRoom(name),
            selected: row.classList.contains('selected')
        };
    }

    function scanRoomsForPreview(iframeDoc) {
        var rows = getRoomListRows(iframeDoc);
        var n = rows.length;

        if (hxdPreviewScanCache && hxdPreviewScanCache.count === n) {
            var data = hxdPreviewScanCache.data;
            var any = false;
            for (var i = 0; i < n; i++) {
                if (readRowMetrics(rows[i], data[i])) any = true;
                var fav = isFavRoom(data[i].name);
                var pin = isPinnedRoom(data[i].name);
                if (data[i].fav !== fav) { data[i].fav = fav; any = true; }
                if (data[i].pinned !== pin) { data[i].pinned = pin; any = true; }
            }
            hxdPreviewScanCache.dirty = hxdPreviewScanCache.dirty || any;
            return data;
        }

        var out = [];
        for (var j = 0; j < n; j++) {
            var parsed = parseRoomRow(rows[j], j);
            if (parsed) out.push(parsed);
        }
        hxdPreviewScanCache = { count: n, data: out, dirty: true };
        return out;
    }

    function selectRoomByName(iframeDoc, roomName) {
        var rows = getRoomListRows(iframeDoc);
        for (var i = 0; i < rows.length; i++) {
            var nameEl = rows[i].querySelector('[data-hook="name"]');
            if (nameEl && (nameEl.textContent || '').trim() === roomName) {
                rows[i].click();
                return true;
            }
        }
        return false;
    }

    var THEME_VAR_KEYS = [
        '--theme-bg-primary', '--theme-bg-secondary', '--theme-bg-tertiary',
        '--theme-bg-primary-rgb', '--theme-bg-hover', '--theme-bg-selected',
        '--theme-border', '--theme-border-light',
        '--theme-text-primary', '--theme-text-secondary', '--theme-text-muted',
        '--theme-scrollbar-track', '--theme-scrollbar-thumb', '--theme-scrollbar-thumb-hover',
        '--theme-tooltip-bg', '--theme-tooltip-border', '--theme-app-background-image'
    ];

    function getThemeColorsForPreview(iframeDoc) {
        var win = iframeDoc.defaultView || window;
        if (win.HaxThemes && typeof win.HaxThemes.getCurrent === 'function' && typeof win.HaxThemes.getThemeColors === 'function') {
            try {
                return win.HaxThemes.getThemeColors(win.HaxThemes.getCurrent()) || {};
            } catch (eTheme) {}
        }
        var root = iframeDoc.documentElement;
        var out = {};
        for (var i = 0; i < THEME_VAR_KEYS.length; i++) {
            var key = THEME_VAR_KEYS[i];
            var val = root.style.getPropertyValue(key);
            if (!val) {
                try {
                    val = win.getComputedStyle(root).getPropertyValue(key);
                } catch (eCs) {}
            }
            val = String(val || '').trim();
            if (val) out[key] = val;
        }
        return out;
    }

    function getInpanelModeForPreview(iframeDoc) {
        if (window.__hxdRoomlistPreviewInpanelMode) return window.__hxdRoomlistPreviewInpanelMode;
        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (!dialog) return null;
        if (dialog.classList.contains('zero-profile-mode')) return 'profile';
        if (dialog.classList.contains('zero-kit-mode')) return 'kit';
        return null;
    }

    function getThemeIdForPreview(iframeDoc) {
        var win = iframeDoc.defaultView || window;
        if (win.HaxThemes && typeof win.HaxThemes.getCurrent === 'function') {
            try { return win.HaxThemes.getCurrent() || 'dark'; } catch (eId) {}
        }
        try {
            return iframeDoc.documentElement.getAttribute('data-theme') || 'dark';
        } catch (eAttr) {
            return 'dark';
        }
    }

    function getThemeSignatureForPreview(iframeDoc) {
        var colors = getThemeColorsForPreview(iframeDoc);
        var parts = [];
        for (var i = 0; i < THEME_VAR_KEYS.length; i++) {
            var key = THEME_VAR_KEYS[i];
            if (colors[key]) parts.push(key + ':' + colors[key]);
        }
        return parts.join('|');
    }

    function buildPreviewBootThemeCss(iframeDoc) {
        var colors = getThemeColorsForPreview(iframeDoc);
        var parts = [];
        for (var i = 0; i < THEME_VAR_KEYS.length; i++) {
            var key = THEME_VAR_KEYS[i];
            if (colors[key]) parts.push(key + ':' + colors[key]);
        }
        return ':root{' + parts.join(';') + (parts.length ? ';' : '') + '}';
    }

    function injectThemeIntoPreviewHtml(html, iframeDoc) {
        if (!html) return html;
        var themeId = getThemeIdForPreview(iframeDoc);
        var colors = getThemeColorsForPreview(iframeDoc);
        var inject = '<style id="hxd-boot-theme">' + buildPreviewBootThemeCss(iframeDoc) + '</style>';
        var htmlTag = '<html';
        var idx = html.indexOf(htmlTag);
        if (idx !== -1) {
            var tagEnd = html.indexOf('>', idx);
            if (tagEnd !== -1) html = html.slice(0, tagEnd + 1) + inject + html.slice(tagEnd + 1);
        } else if (html.indexOf('<head>') !== -1) {
            html = html.replace('<head>', '<head>' + inject);
        }
        if (themeId && html.indexOf('data-theme=') === -1) {
            html = html.replace('<html', '<html data-theme="' + themeId + '"');
        }
        if (colors['--theme-app-background-image'] && String(colors['--theme-app-background-image']).trim() &&
            html.indexOf('data-app-bg-image=') === -1) {
            html = html.replace('<html', '<html data-app-bg-image="1"');
        }
        return html;
    }

    function applyThemeToPreviewFrameDirect(frame, iframeDoc) {
        if (!frame || !frame.contentDocument) return false;
        var previewRoot = frame.contentDocument.documentElement;
        if (!previewRoot) return false;
        var colors = getThemeColorsForPreview(iframeDoc);
        var themeId = getThemeIdForPreview(iframeDoc);
        for (var i = 0; i < THEME_VAR_KEYS.length; i++) {
            var key = THEME_VAR_KEYS[i];
            if (colors[key]) previewRoot.style.setProperty(key, colors[key]);
        }
        if (themeId) previewRoot.setAttribute('data-theme', themeId);
        var bgImg = colors['--theme-app-background-image'];
        if (bgImg && String(bgImg).trim()) previewRoot.setAttribute('data-app-bg-image', '1');
        else previewRoot.removeAttribute('data-app-bg-image');
        return true;
    }

    function revealRoomlistPreviewAfterTheme(doc) {
        applyThemeToPreviewFrameDirect(doc.getElementById('hxd-roomlist-preview-frame'), doc);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                clearRoomlistPreviewPending(doc);
            });
        });
    }

    function getRoomlistTransitionBg(doc) {
        try {
            var value = doc.defaultView.getComputedStyle(doc.documentElement).getPropertyValue('--theme-bg-primary');
            if (value && value.trim()) return value.trim();
        } catch (eBg) {}
        return '#141414';
    }

    function createRoomlistTransitionCover(doc) {
        var old = doc.getElementById('hxd-roomlist-return-cover');
        if (old) old.remove();
        var cover = doc.createElement('div');
        cover.id = 'hxd-roomlist-return-cover';
        cover.style.cssText =
            'position:fixed;inset:0;z-index:2147483000;pointer-events:none;' +
            'background:' + getRoomlistTransitionBg(doc) + ';opacity:0;' +
            'transition:opacity 0.14s ease-out;';
        doc.body.appendChild(cover);
        requestAnimationFrame(function () {
            cover.style.opacity = '1';
        });
        return cover;
    }

    function fadeOutRoomlistTransitionCover(doc, cover) {
        if (!cover || !cover.isConnected) return;
        var attempts = 0;
        var finish = function () {
            var frame = doc.getElementById('hxd-roomlist-preview-frame');
            if (frame) {
                applyThemeToPreviewFrameDirect(frame, doc);
                pushRoomlistPreviewSyncNow(doc, true);
            }
            clearRoomlistPreviewPending(doc);
            cover.style.transition = 'opacity 0.18s ease-out';
            cover.style.opacity = '0';
            setTimeout(function () {
                if (cover && cover.isConnected) cover.remove();
            }, 200);
        };
        var waitForRoomlist = function () {
            attempts++;
            if (doc.getElementById('hxd-roomlist-preview-frame') || attempts > 24) {
                finish();
                return;
            }
            setTimeout(waitForRoomlist, 25);
        };
        waitForRoomlist();
    }

    function getGameAvatarForPreview() {
        try {
            var fromStorage = localStorage.getItem('hxd_settings_preview_avatar');
            if (fromStorage) return fromStorage;
        } catch (eAv) {}
        if (window.__hxdMyAvatarUrl) return window.__hxdMyAvatarUrl;
        return '';
    }

    function getPlayerNickForPreview() {
        try {
            return String(
                localStorage.getItem('haxball_nick') ||
                localStorage.getItem('haxclient_my_nick') ||
                window.__haxLocalGameNick ||
                window.__myNick ||
                ''
            ).replace(/\u200B/g, '').trim();
        } catch (eNick) {
            return '';
        }
    }

    function buildProfileSnapshotForPreview(iframeDoc, user) {
        var nick = getPlayerNickForPreview();
        var avatarUrl = getGameAvatarForPreview();
        if (user && user.discord_id) {
            nick = user.nick || user.username || nick || 'Player';
            if (user.discord_avatar) avatarUrl = user.discord_avatar;
        }
        var tier = 'NOVATO+';
        if (user) {
            if (user.is_pro) tier = 'PRO';
            else if (user.is_vip) tier = 'VIP';
        }
        return {
            loggedIn: !!(user && user.discord_id),
            nick: nick || 'Player',
            handle: user && (user.username || user.discord_username) ? String(user.username || user.discord_username) : '',
            avatarUrl: avatarUrl || '',
            tier: tier,
            online: true,
            roomName: user && user.room_name ? String(user.room_name) : null,
            playTimeMinutes: user ? Number(user.play_time_minutes) || 0 : 0,
            createdAt: user && user.created_at ? user.created_at : null,
            playStreakDays: user ? Number(user.play_streak_days) || 0 : 0
        };
    }

    function roomsStructureCrc(rooms) {
        var len = rooms.length;
        if (!len) return '0';
        var h = len;
        var step = Math.max(1, Math.floor(len / 24));
        for (var i = 0; i < len; i += step) {
            var r = rooms[i];
            h = ((h * 33) + r.name.length + r.name.charCodeAt(0)) | 0;
        }
        return String(h) + ':' + len;
    }

    function roomsChecksum(rooms) {
        var len = rooms.length;
        if (!len) return '0';
        var h = len;
        var step = Math.max(1, Math.floor(len / 32));
        for (var i = 0; i < len; i += step) {
            var r = rooms[i];
            h = ((h * 31) + r.players + ((r.distance || 0) << 4) + (r.selected ? 256 : 0) + (r.fav ? 512 : 0) + (r.pinned ? 1024 : 0)) | 0;
        }
        var a = rooms[0];
        var b = rooms[len - 1];
        return h + ':' + len + ':' + a.players + '/' + a.distance + ':' + b.players + '/' + b.distance;
    }

    function compactRoomsForPreview(rooms) {
        var out = new Array(rooms.length);
        for (var i = 0; i < rooms.length; i++) {
            var r = rooms[i];
            out[i] = [
                r.name, r.players, r.max, r.distance || 0, r.country || '',
                r.locked ? 1 : 0, r.fav ? 1 : 0, r.pinned ? 1 : 0, r.selected ? 1 : 0, r.domIndex || i
            ];
        }
        return out;
    }

    function roomsSignature(rooms) {
        return roomsChecksum(rooms);
    }

    function invalidateRoomlistPreviewSync(iframeDoc) {
        if (!iframeDoc) return;
        delete iframeDoc.hxdRoomlistLastPushSig;
    }

    function isRoomlistLoading(iframeDoc) {
        var refreshBtn = iframeDoc.querySelector('.roomlist-view [data-hook="refresh"]');
        return !!(refreshBtn && refreshBtn.disabled);
    }

    function pushRoomlistPreviewSyncNow(iframeDoc, force) {
        var frame = iframeDoc.getElementById('hxd-roomlist-preview-frame');
        if (!frame || !frame.contentWindow) {
            if (force) iframeDoc.hxdRoomlistThemePending = true;
            return;
        }
        if (force) delete iframeDoc.hxdRoomlistLastPushSig;

        var rooms = scanRoomsForPreview(iframeDoc);
        var roomsLoading = isRoomlistLoading(iframeDoc);
        var inpanelMode = getInpanelModeForPreview(iframeDoc) || '';
        var avatarUrl = getGameAvatarForPreview();
        var playerNick = getPlayerNickForPreview();
        var themeSig = getThemeSignatureForPreview(iframeDoc);
        var roomsSig = roomsChecksum(rooms);
        var sig = roomsSig + '\nmode:' + inpanelMode + '\nlang:' + getUiLang() +
            '\ntheme:' + themeSig + '\navatar:' + (avatarUrl ? avatarUrl.length : 0) + ':' + playerNick +
            '\nload:' + (roomsLoading ? '1' : '0');
        var payload = {
            type: 'hxd-roomlist-sync',
            rooms: compactRoomsForPreview(rooms),
            roomsCrc: roomsSig,
            roomsStructCrc: roomsStructureCrc(rooms),
            roomsLoading: roomsLoading,
            forceFull: !!force,
            inpanelMode: inpanelMode || null,
            anonymous: !!(window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode()),
            lang: getUiLang(),
            theme: getThemeColorsForPreview(iframeDoc),
            themeId: getThemeIdForPreview(iframeDoc),
            avatarUrl: avatarUrl,
            playerNick: playerNick
        };

        if (inpanelMode === 'profile') {
            payload.profile = iframeDoc.hxdRoomlistProfileSnapshot ||
                buildProfileSnapshotForPreview(iframeDoc, profileDataCache && profileDataCache.user);
            sig += '\nprof:' + (payload.profile.nick || '');
        }

        if (sig === iframeDoc.hxdRoomlistLastPushSig) return;
        iframeDoc.hxdRoomlistLastPushSig = sig;
        if (hxdPreviewScanCache) hxdPreviewScanCache.dirty = false;

        try {
            frame.contentWindow.postMessage(payload, '*');
        } catch (ePush) {}
    }

    function submitCreateRoomFromPreview(iframeDoc, payload) {
        payload = payload || {};
        var name = String(payload.name || '').trim();
        if (!name) return false;

        var createBtn = iframeDoc.querySelector('.roomlist-view [data-hook="create"]');
        if (!createBtn) return false;
        createBtn.click();

        var attempts = 0;
        var timer = setInterval(function () {
            attempts++;
            var view = iframeDoc.querySelector('.create-room-view');
            if (!view) {
                if (attempts < 50) return;
                clearInterval(timer);
                return;
            }
            clearInterval(timer);

            var nameEl = view.querySelector('[data-hook="name"]');
            var passEl = view.querySelector('[data-hook="pass"]');
            var maxEl = view.querySelector('[data-hook="max-pl"]');
            var unlistedBtn = view.querySelector('[data-hook="unlisted"]');
            var submitBtn = view.querySelector('[data-hook="create"]');

            if (nameEl) {
                nameEl.value = name;
                try { nameEl.dispatchEvent(new Event('input', { bubbles: true })); } catch (eIn) {}
            }
            if (passEl) passEl.value = String(payload.password || '');
            if (maxEl) {
                var max = parseInt(payload.max, 10) || 12;
                var idx = Math.max(0, Math.min(max - 2, maxEl.options.length - 1));
                maxEl.selectedIndex = idx;
            }
            if (unlistedBtn && payload.unlisted) unlistedBtn.click();

            setTimeout(function () {
                if (submitBtn && !submitBtn.disabled) submitBtn.click();
            }, 30);
        }, 20);
        return true;
    }

    function scheduleRoomlistPreviewSync(iframeDoc, structureChange) {
        if (structureChange) invalidatePreviewScanCache();
        if (iframeDoc.hxdRoomlistPushTimer) return;
        iframeDoc.hxdRoomlistPushTimer = setTimeout(function () {
            iframeDoc.hxdRoomlistPushTimer = null;
            var push = function () { pushRoomlistPreviewSyncNow(iframeDoc); };
            if (structureChange || typeof requestIdleCallback !== 'function') {
                push();
            } else {
                requestIdleCallback(push, { timeout: 2500 });
            }
        }, structureChange ? 400 : 1500);
    }

    function pushRoomlistPreviewSync(iframeDoc) {
        scheduleRoomlistPreviewSync(iframeDoc);
    }

    function handleRoomlistPreviewCmd(iframeDoc, action, payload) {
        payload = payload || {};
        if (action === 'refresh') {
            cachedRows = null;
            isFilteringFavs = false;
            invalidatePreviewScanCache();
            var refreshBtn = iframeDoc.querySelector('.roomlist-view [data-hook="refresh"]');
            if (refreshBtn) refreshBtn.click();
            setTimeout(function () { pushRoomlistPreviewSyncNow(iframeDoc); }, 500);
        } else if (action === 'select' && payload.name) {
            selectRoomByName(iframeDoc, payload.name);
        } else if (action === 'join' && payload.name) {
            selectRoomByName(iframeDoc, payload.name);
            var joinBtn = iframeDoc.querySelector('.roomlist-view [data-hook="join"]');
            if (joinBtn) joinBtn.click();
        } else if (action === 'create') {
            if (payload && payload.name) {
                submitCreateRoomFromPreview(iframeDoc, payload);
            } else {
                var createBtn = iframeDoc.querySelector('.roomlist-view [data-hook="create"]');
                if (createBtn) createBtn.click();
            }
        } else if (action === 'settings') {
            if (typeof window.__hxdMarkSettingsOpenedFromRoomlist === 'function') {
                window.__hxdMarkSettingsOpenedFromRoomlist(iframeDoc);
            } else {
                var rlNow = Date.now();
                iframeDoc.__hxdSettingsOpenedFromRoomlist = true;
                iframeDoc.__hxdSettingsOpenedFromRoomlistUntil = rlNow + 60000;
                iframeDoc.hxdSettingsRoomlistSession = true;
                try {
                    window.__hxdSettingsOpenedFromRoomlist = true;
                    window.__hxdSettingsOpenedFromRoomlistUntil = rlNow + 60000;
                    window.__hxdSettingsRoomlistSession = true;
                } catch (eRlFlag) {}
            }
            var settingsBtn = iframeDoc.querySelector('.roomlist-view [data-hook="settings"]');
            if (settingsBtn) settingsBtn.click();
        } else if (action === 'replays') {
            var replaysLabel = iframeDoc.querySelector('.roomlist-view label[for="replayfile"]');
            if (replaysLabel) replaysLabel.click();
            else {
                var replayInput = iframeDoc.querySelector('#replayfile');
                if (replayInput) replayInput.click();
            }
        } else if (action === 'toggleFav' && payload.name) {
            toggleFavRoom(payload.name);
            invalidateRoomlistPreviewSync(iframeDoc);
            pushRoomlistPreviewSyncNow(iframeDoc, true);
        } else if (action === 'togglePin' && payload.name) {
            togglePinnedRoom(payload.name);
            invalidateRoomlistPreviewSync(iframeDoc);
            pushRoomlistPreviewSyncNow(iframeDoc, true);
        } else if (action === 'openProfile') {
            openInpanelProfileFromRoomlist(iframeDoc);
            setTimeout(function () { pushRoomlistPreviewSyncNow(iframeDoc); }, 80);
        } else if (action === 'openKit') {
            if (window.JerseyKitSystem && typeof JerseyKitSystem.toggleJerseyPanel === 'function') {
                JerseyKitSystem.toggleJerseyPanel(iframeDoc);
            }
        } else if (action === 'openPro') {
            if (iframeDoc.getElementById('hxd-roomlist-preview-frame')) {
                window.__hxdRoomlistPreviewInpanelMode = 'pro';
                var dlgPro = iframeDoc.querySelector('.roomlist-view .dialog');
                if (dlgPro) dlgPro.classList.remove('zero-pro-mode');
                setTimeout(function () { pushRoomlistPreviewSyncNow(iframeDoc); }, 40);
            } else {
                openInpanelProFromRoomlist(iframeDoc);
                setTimeout(function () { pushRoomlistPreviewSyncNow(iframeDoc); }, 80);
            }
        } else if (action === 'openDiscord') {
            var discordUrl = 'https://discord.gg/haxzero';
            if (typeof window.__hxdOpenExternalUrl === 'function') {
                window.__hxdOpenExternalUrl(discordUrl);
            } else {
                fetch('http://127.0.0.1:5483/open-external', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: discordUrl })
                }).catch(function () {
                    try { window.open(discordUrl, '_blank', 'noopener,noreferrer'); } catch (eD) {}
                });
            }
        } else if (action === 'closeInpanel') {
            window.__hxdRoomlistPreviewInpanelMode = '';
            delete iframeDoc.hxdRoomlistProfileSnapshot;
            closeInpanelPro(iframeDoc);
            if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
                try { JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc); } catch (eJ) {}
            }
            var dlg = iframeDoc.querySelector('.roomlist-view .dialog');
            if (dlg) dlg.classList.remove('zero-profile-mode', 'zero-kit-mode', 'zero-pro-mode');
            setTimeout(function () { pushRoomlistPreviewSyncNow(iframeDoc); }, 80);
        }
    }

    function bindRoomlistSettingsVisibility(doc) {
        if (doc.hxdRoomlistSettingsVisBound) return;
        doc.hxdRoomlistSettingsVisBound = true;

        doc.__hxdCloseSettingsPreviewAnimated = function () {
            var settingsDialog = doc.querySelector('.dialog.settings-view.hxd-settings-preview-dialog');
            var closeBtn = settingsDialog && settingsDialog.querySelector('button[data-hook="close"]');
            if (!settingsDialog || !closeBtn) {
                if (doc.defaultView && typeof doc.defaultView.__hxdCloseSettingsPreview === 'function') {
                    doc.defaultView.__hxdCloseSettingsPreview();
                }
                return;
            }
            if (settingsDialog.dataset.hxdSettingsClosing === '1') return;
            settingsDialog.dataset.hxdSettingsClosing = '1';
            invalidateRoomlistPreviewSync(doc);
            doc.hxdRoomlistThemePending = true;
            var cover = createRoomlistTransitionCover(doc);
            settingsDialog.classList.add('hxd-settings-preview-closing');
            try {
                if (typeof window.__hxdClearSettingsOpenedFromRoomlist === 'function') {
                    window.__hxdClearSettingsOpenedFromRoomlist(doc);
                }
            } catch (eClr) {}
            try { doc.defaultView.__hxdSuppressSettingsEscUntil = Date.now() + 900; } catch (eEsc) {}
            setTimeout(function () {
                delete settingsDialog.dataset.hxdSettingsClosing;
                settingsDialog.classList.remove('hxd-settings-preview-closing');
                closeBtn.click();
                fadeOutRoomlistTransitionCover(doc, cover);
                try {
                    var restore = doc.defaultView && doc.defaultView.__hxdRestoreGameFocusAfterSettingsClose;
                    if (typeof restore === 'function') restore();
                } catch (eRestore) {}
            }, 150);
        };
    }

    function bindRoomlistPreviewBridge(iframeDoc) {
        if (!iframeDoc.getElementById('hxd-roomlist-preview-frame')) return;
        if (iframeDoc.hxdRoomlistPreviewBridgeReady) return;
        iframeDoc.hxdRoomlistPreviewBridgeReady = true;

        bindRoomlistSettingsVisibility(iframeDoc);

        if (!window.hxdRoomlistPreviewThemeBound) {
            window.hxdRoomlistPreviewThemeBound = true;
            var onThemeOrAvatarChange = function (targetDoc) {
                invalidateRoomlistPreviewSync(targetDoc);
                var frame = targetDoc.getElementById('hxd-roomlist-preview-frame');
                if (frame) {
                    applyThemeToPreviewFrameDirect(frame, targetDoc);
                    pushRoomlistPreviewSyncNow(targetDoc, true);
                } else {
                    targetDoc.hxdRoomlistThemePending = true;
                }
            };
            window.addEventListener('themeChanged', function () { onThemeOrAvatarChange(document); });
            window.addEventListener('storage', function () { onThemeOrAvatarChange(document); });
            window.addEventListener('message', function (e) {
                var data = e.data;
                if (!data || data.type !== 'themeChanged') return;
                onThemeOrAvatarChange(document);
            });
            window.addEventListener('hxd-avatar-profile-changed', function () { onThemeOrAvatarChange(document); });
        }

        if (!window.hxdRoomlistPreviewMsgBound) {
            window.hxdRoomlistPreviewMsgBound = true;
            window.addEventListener('message', function (e) {
                var data = e.data;
                if (!data || data.type !== 'hxd-roomlist-preview-cmd') return;
                var frame = document.getElementById('hxd-roomlist-preview-frame');
                if (!frame || e.source !== frame.contentWindow) return;
                handleRoomlistPreviewCmd(document, data.action, data.payload);
            });
        }

        var listRoot = getRoomListRoot(iframeDoc);
        if (listRoot && !listRoot.dataset.hxdPreviewBridgeMo) {
            listRoot.dataset.hxdPreviewBridgeMo = '1';
            var bridgeMo = new MutationObserver(function () {
                scheduleRoomlistPreviewSync(iframeDoc, true);
            });
            bridgeMo.observe(listRoot, { childList: true });
            iframeDoc.hxdRoomlistPreviewBridgeMo = bridgeMo;
        }

        if (!iframeDoc.hxdRoomlistMetricsIv) {
            iframeDoc.hxdRoomlistMetricsIv = setInterval(function () {
                if (!iframeDoc.getElementById('hxd-roomlist-preview-frame')) return;
                scheduleRoomlistPreviewSync(iframeDoc, false);
            }, 8000);
        }

        pushRoomlistPreviewSyncNow(iframeDoc);

        if (!iframeDoc.hxdRoomlistPreviewRefreshDone) {
            iframeDoc.hxdRoomlistPreviewRefreshDone = true;
            setTimeout(function () {
                var refreshBtn = iframeDoc.querySelector('.roomlist-view [data-hook="refresh"]');
                if (refreshBtn) refreshBtn.click();
                setTimeout(function () { pushRoomlistPreviewSyncNow(iframeDoc); }, 700);
            }, 200);
        }
    }

    function countRoomListRows(iframeDoc) {
        return getRoomListRows(iframeDoc).length;
    }

    function warmRoomListFetch(iframeDoc) {
        if (iframeDoc.hxdRoomlistWarmTs) return;
        iframeDoc.hxdRoomlistWarmTs = Date.now();
        var refreshBtn = iframeDoc.querySelector('.roomlist-view [data-hook="refresh"]');
        if (refreshBtn) refreshBtn.click();
    }

    function installRoomlistPreviewApi(iframeDoc) {
        window.__hxdRoomlistPreviewApi = {
            isLive: function () { return true; },
            scanRooms: function () { return scanRoomsForPreview(iframeDoc); },
            clickHook: function (name) {
                var el = iframeDoc.querySelector('.roomlist-view [data-hook="' + name + '"]');
                if (el) el.click();
            },
            refresh: function () {
                cachedRows = null;
                isFilteringFavs = false;
                this.clickHook('refresh');
            },
            joinSelected: function () {
                this.clickHook('join');
            },
            openCreate: function () { this.clickHook('create'); },
            openSettings: function () { this.clickHook('settings'); },
            openReplays: function () {
                var label = iframeDoc.querySelector('.roomlist-view label[for="replayfile"]');
                if (label) label.click();
                else {
                    var input = iframeDoc.querySelector('#replayfile');
                    if (input) input.click();
                }
            },
            openPro: function () {
                window.__hxdRoomlistPreviewInpanelMode = 'pro';
                var dlg = iframeDoc.querySelector('.roomlist-view .dialog');
                if (dlg) dlg.classList.remove('zero-pro-mode');
                pushRoomlistPreviewSyncNow(iframeDoc);
            },
            closeInpanelModes: function () {
                window.__hxdRoomlistPreviewInpanelMode = '';
                closeInpanelPro(iframeDoc);
                if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
                    try { JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc); } catch (eJ) {}
                }
                var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
                if (dialog) {
                    dialog.classList.remove('zero-profile-mode', 'zero-kit-mode', 'zero-pro-mode');
                }
            },
            getInpanelMode: function () {
                if (window.__hxdRoomlistPreviewInpanelMode) return window.__hxdRoomlistPreviewInpanelMode;
                var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
                if (!dialog) return null;
                if (dialog.classList.contains('zero-profile-mode')) return 'profile';
                if (dialog.classList.contains('zero-kit-mode')) return 'kit';
                return null;
            },
            selectRoomByName: function (name) { return selectRoomByName(iframeDoc, name); },
            toggleFav: function (name) { return toggleFavRoom(name); },
            togglePinned: function (name) { return togglePinnedRoom(name); },
            getFavs: getFavRooms,
            isFav: isFavRoom,
            isPinned: isPinnedRoom,
            isAnonymous: function () {
                return !!(window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode());
            },
            syncThemeVars: function () {
                return getThemeColorsForPreview(iframeDoc);
            },
            setLanguage: function (lang) {
                try {
                    iframeDoc.defaultView.__haxLang = lang;
                    iframeDoc.defaultView.localStorage.setItem('haxball_language', lang);
                    if (typeof iframeDoc.defaultView.__applyTranslations === 'function') {
                        iframeDoc.defaultView.__applyTranslations(lang);
                    }
                } catch (eLang) {}
            }
        };
    }

    function ensureRoomlistPreviewInpanelHosts(iframeDoc, dialog) {
        if (!iframeDoc.getElementById('zero-inpanel-profile')) {
            var zipRoot = iframeDoc.createElement('div');
            zipRoot.id = 'zero-inpanel-profile';
            zipRoot.innerHTML = buildZeroInpanelProfileHtml();
            zipRoot.style.display = 'none';
            dialog.appendChild(zipRoot);
            bindZipProfilePanel(iframeDoc);
        }
    }

    function removeLegacyRoomlistChrome(iframeDoc) {
        var ids = ['sidebar-panel', 'sidebar-tooltip', 'room-context-menu', 'country-filter-btn', 'country-dropdown', 'room-search'];
        for (var i = 0; i < ids.length; i++) {
            var el = iframeDoc.getElementById(ids[i]);
            if (el) el.remove();
        }
        var legacySearch = iframeDoc.querySelector('.roomlist-view .room-search-bar');
        if (legacySearch) legacySearch.remove();
    }

    function ensureRoomlistPreview(iframeDoc) {
        var roomlistView = iframeDoc.querySelector('.roomlist-view');
        if (!roomlistView) return;

        var dialog = roomlistView.querySelector('.dialog');
        if (!dialog) return;

        prepareRoomlistPreviewDialog(iframeDoc, dialog);

        var existingFrame = iframeDoc.getElementById('hxd-roomlist-preview-frame');
        if (existingFrame) {
            try { iframeDoc.documentElement.classList.add('hxd-roomlist-preview-active'); } catch (eCls2) {}
            clearRoomlistPreviewPending(iframeDoc);
            if (iframeDoc.hxdRoomlistThemePending) {
                delete iframeDoc.hxdRoomlistThemePending;
                applyThemeToPreviewFrameDirect(existingFrame, iframeDoc);
                pushRoomlistPreviewSyncNow(iframeDoc, true);
            }
            modifyRoomListPreviewMode(iframeDoc);
            return;
        }

        ensureRoomlistPreviewShell(iframeDoc, dialog);

        if (dialog.dataset.hxdPreviewMounting === '1') return;
        dialog.dataset.hxdPreviewMounting = '1';

        mountRoomlistPreview(iframeDoc, dialog, function (ok) {
            delete dialog.dataset.hxdPreviewMounting;
            if (ok) {
                installRoomlistPreviewApi(iframeDoc);
                warmRoomListFetch(iframeDoc);
            }
        });
    }

    function modifyRoomListPreviewMode(iframeDoc) {
        var listContainer = getRoomListRoot(iframeDoc);
        var roomlistView = iframeDoc.querySelector('.roomlist-view');
        if (!listContainer || !roomlistView) {
            cleanupRoomList();
            return;
        }

        var dialog = roomlistView.querySelector('.dialog');
        if (!dialog) return;

        if (listContainer.dataset.hxdPreviewObserving === '1') {
            return;
        }
        listContainer.dataset.hxdPreviewObserving = '1';

        ensureRoomlistPreviewInpanelHosts(iframeDoc, dialog);

        var sidebar = iframeDoc.getElementById('sidebar-panel');
        if (sidebar) sidebar.style.display = 'none';

        bindRoomlistPreviewBridge(iframeDoc);
    }

    function mountRoomlistPreview(doc, dialog, done) {
        if (!dialog) {
            done(false);
            return;
        }
        if (doc.getElementById('hxd-roomlist-preview-frame')) {
            done(true);
            return;
        }

        fetchRoomlistPreviewHtml(function (err, html) {
            if (err || !html) {
                Injector.log('Roomlist preview fetch failed: ' + (err && err.message ? err.message : 'empty'));
                done(false);
                return;
            }
            if (!dialog.isConnected || doc.getElementById('hxd-roomlist-preview-frame')) {
                done(!!doc.getElementById('hxd-roomlist-preview-frame'));
                return;
            }

            prepareRoomlistPreviewDialog(doc, dialog, { markPending: true });
            bindRoomlistPreviewResize(doc);
            ensureRoomlistPreviewInpanelHosts(doc, dialog);

            var root = ensureRoomlistPreviewShell(doc, dialog);

            var iframe = doc.createElement('iframe');
            iframe.id = 'hxd-roomlist-preview-frame';
            iframe.setAttribute('title', 'Room list');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
            iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;background:transparent;';
            var pendingFallback = setTimeout(function () {
                clearRoomlistPreviewPending(doc);
            }, 2500);
            iframe.onload = function () {
                clearTimeout(pendingFallback);
                applyThemeToPreviewFrameDirect(iframe, doc);
                delete doc.hxdRoomlistThemePending;
                pushRoomlistPreviewSyncNow(doc, true);
                revealRoomlistPreviewAfterTheme(doc);
                installRoomlistPreviewApi(doc);
                modifyRoomListPreviewMode(doc);
            };
            iframe.srcdoc = html;

            root.appendChild(iframe);
            if (!root.isConnected) dialog.appendChild(root);
            dialog.dataset.hxdRoomlistPreview = '1';
            try { doc.documentElement.classList.add('hxd-roomlist-preview-active'); } catch (eCls) {}

            installRoomlistPreviewApi(doc);
            modifyRoomListPreviewMode(doc);

            Injector.log('Roomlist preview mounted');
            done(true);
        });
    }

    function teardownRoomlistPreview(iframeDoc) {
        var root = iframeDoc.getElementById('hxd-roomlist-preview-root');
        if (!root) return;

        if (iframeDoc.hxdRoomlistPreviewSyncIv) {
            clearInterval(iframeDoc.hxdRoomlistPreviewSyncIv);
            iframeDoc.hxdRoomlistPreviewSyncIv = null;
        }
        if (iframeDoc.hxdRoomlistMetricsIv) {
            clearInterval(iframeDoc.hxdRoomlistMetricsIv);
            iframeDoc.hxdRoomlistMetricsIv = null;
        }
        if (iframeDoc.hxdRoomlistPushTimer) {
            clearTimeout(iframeDoc.hxdRoomlistPushTimer);
            iframeDoc.hxdRoomlistPushTimer = null;
        }
        if (iframeDoc.hxdRoomlistPreviewBridgeMo) {
            iframeDoc.hxdRoomlistPreviewBridgeMo.disconnect();
            iframeDoc.hxdRoomlistPreviewBridgeMo = null;
        }

        var listRoot = getRoomListRoot(iframeDoc);
        if (listRoot) {
            delete listRoot.dataset.hxdPreviewBridgeMo;
            delete listRoot.dataset.hxdPreviewObserving;
        }

        iframeDoc.hxdRoomlistPreviewBridgeReady = false;
        iframeDoc.hxdRoomlistPreviewRefreshDone = false;
        delete iframeDoc.hxdRoomlistLastPushSig;
        delete iframeDoc.hxdRoomlistThemeSent;
        delete iframeDoc.hxdRoomlistMountDeadline;
        delete iframeDoc.hxdRoomlistWarmTs;
        invalidatePreviewScanCache();

        root.remove();
        clearRoomlistPreviewPending(iframeDoc);
        try { iframeDoc.documentElement.classList.remove('hxd-roomlist-preview-active'); } catch (eClsOff) {}

        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (dialog) {
            dialog.classList.remove('hxd-roomlist-preview-dialog');
            dialog.style.removeProperty('width');
            dialog.style.removeProperty('min-width');
            dialog.style.removeProperty('max-width');
            dialog.style.removeProperty('height');
            dialog.style.removeProperty('min-height');
            dialog.style.removeProperty('max-height');
            dialog.style.removeProperty('padding');
            dialog.style.removeProperty('overflow');
            dialog.style.removeProperty('border-radius');
            dialog.style.removeProperty('box-sizing');
            dialog.style.removeProperty('position');
            delete dialog.dataset.hxdRoomlistPreview;
            delete dialog.dataset.hxdPreviewMounting;
        }

        var previewStyles = iframeDoc.getElementById('hxd-roomlist-preview-styles');
        if (previewStyles) previewStyles.remove();
    }

    function modifyRoomList(iframeDoc) {
        var listContainer = iframeDoc.querySelector('.roomlist-view tbody[data-hook="list"]');
        var roomlistView = iframeDoc.querySelector('.roomlist-view');

        if (!listContainer || !roomlistView) {
            cleanupRoomList();
            return;
        }

        var dialog = roomlistView.querySelector('.dialog');
        if (!dialog) return;

        if (iframeDoc.getElementById('hxd-roomlist-preview-root')) {
            teardownRoomlistPreview(iframeDoc);
        }

        dialog.style.overflow = 'visible';
        var existingSidebarRm = iframeDoc.getElementById('sidebar-panel');
        if (existingSidebarRm) {
            existingSidebarRm.style.zIndex = '3';
        }

        if (!iframeDoc.getElementById('zero-inpanel-profile')) {
            var sbExisting = iframeDoc.getElementById('sidebar-panel');
            if (sbExisting && sbExisting.parentNode === dialog) {
                var zipFix = iframeDoc.createElement('div');
                zipFix.id = 'zero-inpanel-profile';
                zipFix.innerHTML = buildZeroInpanelProfileHtml();
                zipFix.style.display = 'none';
                dialog.insertBefore(zipFix, sbExisting);
                bindZipProfilePanel(iframeDoc);
            }
        }

        // Cria painel lateral se não existir
        if (!iframeDoc.getElementById('sidebar-panel')) {
            // Cria tooltip customizado
            var tooltip = iframeDoc.createElement('div');
            tooltip.id = 'sidebar-tooltip';
            tooltip.style.cssText = 'position:fixed;background:var(--theme-tooltip-bg, #222);color:var(--theme-text-primary, #fff);padding:6px 10px;border-radius:6px;font-size:12px;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:10000;white-space:nowrap;border:1px solid var(--theme-tooltip-border, #333);box-shadow:0 4px 16px rgba(0,0,0,0.3);';
            iframeDoc.body.appendChild(tooltip);

            function showTooltip(el, text) {
                var rect = el.getBoundingClientRect();
                tooltip.textContent = text;
                // Posiciona à direita do botão (fora do dialog)
                tooltip.style.left = (rect.right + 8) + 'px';
                tooltip.style.top = (rect.top + rect.height / 2 - 12) + 'px';
                tooltip.style.opacity = '1';
            }

            function hideTooltip() {
                tooltip.style.opacity = '0';
            }

            function addTooltip(el, text) {
                if (!el) return;
                el.addEventListener('mouseenter', function() { showTooltip(el, text); });
                el.addEventListener('mouseleave', hideTooltip);
                el.addEventListener('click', hideTooltip); // Esconde ao clicar
            }

            var sidebar = iframeDoc.createElement('div');
            sidebar.id = 'sidebar-panel';
            sidebar.style.cssText = 'position:absolute;right:-50px;top:5px;bottom:5px;width:50px;min-width:50px;max-width:50px;background:var(--theme-bg-primary, #141414);border:1px solid var(--theme-border, #232323);border-radius:0 8px 8px 0;display:flex;flex-direction:column;gap:8px;padding:10px 6px;box-sizing:border-box;z-index:3;';

            var hxdAnonHide = window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode();
            
            // Esconde tooltip quando mouse sai do sidebar
            sidebar.addEventListener('mouseleave', hideTooltip);

            // Pega botões originais
            var refreshBtn = iframeDoc.querySelector('.roomlist-view button[data-hook="refresh"]');
            var joinBtn = iframeDoc.querySelector('.roomlist-view button[data-hook="join"]');
            var createBtn = iframeDoc.querySelector('.roomlist-view button[data-hook="create"]');
            var replaysLabel = iframeDoc.querySelector('.roomlist-view label[for="replayfile"]');
            var settingsBtn = iframeDoc.querySelector('.roomlist-view button[data-hook="settings"]');

            // Adiciona ícones e move pro sidebar
            if (refreshBtn) {
                refreshBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
                var t = window.__t || function(k) { return k; };
                addTooltip(refreshBtn, t('Atualizar'));
                sidebar.appendChild(refreshBtn);
            }
            if (joinBtn) {
                // Wrapper para o botão de entrar (tooltip funciona mesmo desabilitado)
                var joinWrapper = iframeDoc.createElement('div');
                joinWrapper.style.cssText = 'display:flex;justify-content:center;';
                joinBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>';
                addTooltip(joinWrapper, t('Entrar'));
                joinWrapper.appendChild(joinBtn);
                sidebar.appendChild(joinWrapper);
            }
            if (createBtn) {
                createBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';
                addTooltip(createBtn, t('Criar Sala'));
                sidebar.appendChild(createBtn);
            }

            // Botão de favoritos (bookmark)
            var favBtn = iframeDoc.createElement('button');
            favBtn.id = 'fav-filter-btn';
            addTooltip(favBtn, t('Favoritos'));
            favBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
            favBtn.onclick = function() {
                var rows = listContainer.querySelectorAll('tr');
                var favRooms = getFavRooms();

                if (!isFilteringFavs) {
                    if (favRooms.length === 0) return;
                    
                    for (var i = 0; i < rows.length; i++) {
                        var nameEl = rows[i].querySelector('[data-hook="name"]');
                        if (!nameEl) continue;
                        var roomName = (nameEl.textContent || '').trim();
                        if (favRooms.indexOf(roomName) !== -1) {
                            rows[i].classList.remove('fav-hidden');
                        } else {
                            rows[i].classList.add('fav-hidden');
                        }
                    }
                    isFilteringFavs = true;
                    var svg = favBtn.querySelector('svg');
                    svg.setAttribute('fill', '#f59e0b');
                    svg.setAttribute('stroke', '#f59e0b');
                } else {
                    for (var j = 0; j < rows.length; j++) {
                        rows[j].classList.remove('fav-hidden');
                    }
                    isFilteringFavs = false;
                    var svg = favBtn.querySelector('svg');
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                }
            };
            sidebar.appendChild(favBtn);

            // Creador de camiseta (/colors)
            var jerseyBtn = iframeDoc.createElement('button');
            jerseyBtn.id = 'jersey-kit-btn';
            addTooltip(jerseyBtn, t('Camiseta'));
            jerseyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2l-4 3-4-3-4.38 1.46A2 2 0 002 5.27V20a2 2 0 002 2h16a2 2 0 002-2V5.27a2 2 0 00-1.62-1.81z"/><path d="M12 8v11M8 11h8"/></svg>';
            jerseyBtn.onclick = function() {
                if (window.JerseyKitSystem) {
                    window.JerseyKitSystem.toggleJerseyPanel(iframeDoc);
                }
            };
            sidebar.appendChild(jerseyBtn);

            // Pro (in-panel) — icono verificado
            var proSidebarBtn = iframeDoc.createElement('button');
            proSidebarBtn.id = 'pro-sidebar-btn';
            proSidebarBtn.type = 'button';
            proSidebarBtn.className = 'pro-sidebar-verified-btn';
            proSidebarBtn.innerHTML = zipVerifiedBadgeSvg(18);
            var zipTip = getZipProfileStrings(getUiLang());
            addTooltip(proSidebarBtn, zipTip.proTitle);
            proSidebarBtn.onclick = function() {
                openInpanelProFromRoomlist(iframeDoc);
            };
            if (hxdAnonHide) {
                proSidebarBtn.style.display = 'none';
            }
            sidebar.appendChild(proSidebarBtn);

            // Espaçador
            var spacer = iframeDoc.createElement('div');
            spacer.style.cssText = 'flex:1;';
            sidebar.appendChild(spacer);

            // Replays e Settings no final
            if (replaysLabel) {
                replaysLabel.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                addTooltip(replaysLabel, t('Replays'));
                sidebar.appendChild(replaysLabel);
            }
            if (settingsBtn) {
                settingsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
                addTooltip(settingsBtn, t('Configurações'));
                sidebar.appendChild(settingsBtn);
            }

            // Esconde container original dos botões
            var buttonsContainer = iframeDoc.querySelector('.roomlist-view .buttons');
            if (buttonsContainer) {
                buttonsContainer.style.display = 'none';
            }

            // Botão de voltar para página principal (no topo)
            var backBtn = iframeDoc.createElement('button');
            backBtn.id = 'back-btn';
            addTooltip(backBtn, t('Voltar'));
            backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
            backBtn.onclick = function() {
                window.top.location.reload();
            };
            sidebar.insertBefore(backBtn, sidebar.firstChild);

            dialog.style.position = 'relative';
            if (!iframeDoc.getElementById('zero-inpanel-profile')) {
                var zipRoot = iframeDoc.createElement('div');
                zipRoot.id = 'zero-inpanel-profile';
                zipRoot.innerHTML = buildZeroInpanelProfileHtml();
                zipRoot.style.display = 'none';
                dialog.appendChild(zipRoot);
                bindZipProfilePanel(iframeDoc);
            }
            dialog.appendChild(sidebar);

            // Listener pro refresh limpar cache e resetar filtro
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() { 
                    cachedRows = null;
                    isFilteringFavs = false;
                    var favBtnEl = iframeDoc.getElementById('fav-filter-btn');
                    if (favBtnEl) {
                        var svg = favBtnEl.querySelector('svg');
                        if (svg) {
                            svg.setAttribute('fill', 'none');
                            svg.setAttribute('stroke', 'currentColor');
                        }
                    }
                });
            }

            // Menu de contexto para favoritos
            var contextMenu = null;
            
            function createContextMenu() {
                var menu = iframeDoc.createElement('div');
                menu.id = 'room-context-menu';
                menu.style.cssText = 'position:fixed;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:8px;padding:6px;min-width:180px;z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,0.5);display:none;';
                iframeDoc.body.appendChild(menu);
                return menu;
            }

            function showContextMenu(e, roomName) {
                e.preventDefault();
                if (!contextMenu) contextMenu = createContextMenu();

                var isFav = isFavRoom(roomName);
                var isPinned = isPinnedRoom(roomName);
                var bookmarkIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (isFav ? '#f59e0b' : 'none') + '" stroke="' + (isFav ? '#f59e0b' : 'var(--theme-text-secondary, #888)') + '" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
                var pinIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (isPinned ? '#3b82f6' : 'none') + '" stroke="' + (isPinned ? '#3b82f6' : 'var(--theme-text-secondary, #888)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>';
                
                var t = window.__t || function(k) { return k; };
                contextMenu.innerHTML = '<div class="ctx-item ctx-pin" style="padding:10px 14px;cursor:pointer;color:var(--theme-text-primary, #fff);font-size:13px;display:flex;align-items:center;gap:10px;border-radius:6px;transition:background 0.1s;">' + pinIcon + '<span>' + (isPinned ? t('Desafixar Sala') : t('Fixar no Topo')) + '</span></div>' +
                    '<div class="ctx-item ctx-fav" style="padding:10px 14px;cursor:pointer;color:var(--theme-text-primary, #fff);font-size:13px;display:flex;align-items:center;gap:10px;border-radius:6px;transition:background 0.1s;">' + bookmarkIcon + '<span>' + (isFav ? t('Remover dos Favoritos') : t('Adicionar aos Favoritos')) + '</span></div>';

                var items = contextMenu.querySelectorAll('.ctx-item');
                for (var i = 0; i < items.length; i++) {
                    (function(item) {
                        item.onmouseenter = function() { item.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                        item.onmouseleave = function() { item.style.background = ''; };
                    })(items[i]);
                }

                // Handler para fixar sala
                var pinItem = contextMenu.querySelector('.ctx-pin');
                pinItem.onclick = function() {
                    togglePinnedRoom(roomName);
                    contextMenu.style.display = 'none';
                    updatePinnedHighlight(listContainer);
                    movePinnedToTop(listContainer);
                };

                // Handler para favoritos
                var favItem = contextMenu.querySelector('.ctx-fav');
                favItem.onclick = function() {
                    toggleFavRoom(roomName);
                    contextMenu.style.display = 'none';
                    updateFavHighlight(listContainer);
                    
                    if (isFilteringFavs && !isFavRoom(roomName)) {
                        var rows = listContainer.querySelectorAll('tr');
                        for (var i = 0; i < rows.length; i++) {
                            var nameCell = rows[i].querySelector('[data-hook="name"]');
                            if (nameCell && (nameCell.textContent || '').trim() === roomName) {
                                rows[i].classList.add('fav-hidden');
                            }
                        }
                    }
                };

                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = e.clientY + 'px';
                contextMenu.style.display = 'block';
            }

            iframeDoc.addEventListener('click', function() {
                if (contextMenu) contextMenu.style.display = 'none';
            });

            iframeDoc.addEventListener('contextmenu', function(e) {
                var target = e.target;
                var row = target.closest ? target.closest('tr') : null;
                if (!row) {
                    var el = target;
                    while (el && el.tagName !== 'TR') el = el.parentElement;
                    row = el;
                }
                
                if (row && listContainer.contains(row)) {
                    var nameCell = row.querySelector('[data-hook="name"]');
                    if (nameCell) {
                        var roomName = (nameCell.textContent || '').trim();
                        if (roomName) showContextMenu(e, roomName);
                    }
                }
            });

            // Destaca salas favoritas
            function updateFavHighlight(container) {
                var rows = container.querySelectorAll('tr');
                var favRooms = getFavRooms();
                
                for (var i = 0; i < rows.length; i++) {
                    var nameCell = rows[i].querySelector('[data-hook="name"]');
                    if (!nameCell) continue;
                    var name = (nameCell.textContent || '').trim();
                    if (favRooms.indexOf(name) !== -1) {
                        nameCell.classList.add('fav-room');
                    } else {
                        nameCell.classList.remove('fav-room');
                    }
                }
            }

            // Observer pra destacar favoritos e fixados quando lista muda
            var observerTimeout = null;
            var isReordering = false;
            var favObserver = new MutationObserver(function(mutations) {
                // Ignora mutações durante reordenação
                if (isReordering) return;
                
                if (observerTimeout) clearTimeout(observerTimeout);
                observerTimeout = setTimeout(function() {
                    updateFavHighlight(listContainer);
                    updatePinnedHighlight(listContainer);
                    isReordering = true;
                    movePinnedToTop(listContainer);
                    isReordering = false;
                }, 100);
            });
            favObserver.observe(listContainer, { childList: true });
            updateFavHighlight(listContainer);
            updatePinnedHighlight(listContainer);
            movePinnedToTop(listContainer);
        }

        // Adiciona barra de pesquisa
        if (!iframeDoc.getElementById('room-search-input')) {
            var searchContainer = iframeDoc.createElement('div');
            searchContainer.id = 'room-search';
            searchContainer.style.cssText = 'padding:0px 16px 8px 16px;display:flex;gap:10px;align-items:center;';

            // Ícone de busca
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = iframeDoc.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', '16');
            svg.setAttribute('height', '16');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', '#666');
            svg.setAttribute('stroke-width', '2');
            var circle = iframeDoc.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', '11');
            circle.setAttribute('cy', '11');
            circle.setAttribute('r', '8');
            var path = iframeDoc.createElementNS(svgNS, 'path');
            path.setAttribute('d', 'm21 21-4.35-4.35');
            svg.appendChild(circle);
            svg.appendChild(path);

            // Input de pesquisa
            var input = iframeDoc.createElement('input');
            input.type = 'text';
            input.id = 'room-search-input';
            var t = window.__t || function(k) { return k; };
            input.placeholder = t('Pesquisar salas...');
            input.autocomplete = 'off';
            input.style.cssText = 'flex:1;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:4px;padding:8px 12px;color:var(--theme-text-primary, #fff);font-size:13px;outline:none;';

            input.oninput = function() {
                if (searchTimeout) clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    var searchValue = input.value.toLowerCase();
                    doSearch(iframeDoc, searchValue);
                    // Salva o termo de pesquisa
                    sessionStorage.setItem('roomlist_search_term', input.value);
                }, 50);
            };

            input.onfocus = function() { input.style.borderColor = 'var(--theme-border-light, #444)'; };
            input.onblur = function() { input.style.borderColor = 'var(--theme-border-light, #333)'; };

            // Restaura termo de pesquisa salvo
            var savedSearch = sessionStorage.getItem('roomlist_search_term');
            if (savedSearch) {
                input.value = savedSearch;
                // Aguarda a lista carregar e aplica a pesquisa
                setTimeout(function() {
                    doSearch(iframeDoc, savedSearch.toLowerCase());
                }, 100);
            }

            // Botão refresh limpa cache mas mantém pesquisa
            var refreshBtn = iframeDoc.querySelector('[data-hook="refresh"]');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() { 
                    cachedRows = null;
                    // Reaplica pesquisa após refresh
                    setTimeout(function() {
                        var currentSearch = input.value.toLowerCase();
                        if (currentSearch) {
                            doSearch(iframeDoc, currentSearch);
                        }
                    }, 200);
                });
            }

            // Filtro por país - design simplificado
            var filterBtn = iframeDoc.createElement('button');
            filterBtn.id = 'country-filter-btn';
            filterBtn.style.cssText = 'background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);padding:0 10px;color:var(--theme-text-muted, #666);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:12px;font-weight:600;height:34px;';
            filterBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
            filterBtn.onmouseenter = function() { filterBtn.style.background = 'var(--theme-bg-hover, #333)'; filterBtn.style.color = 'var(--theme-text-primary, #fff)'; };
            filterBtn.onmouseleave = function() { if (selectedCountry === 'all') { filterBtn.style.background = 'var(--theme-bg-secondary, #1a1a1a)'; filterBtn.style.color = 'var(--theme-text-muted, #666)'; } };

            var dropdown = iframeDoc.createElement('div');
            dropdown.id = 'country-dropdown';
            dropdown.style.cssText = 'display:none;position:absolute;top:100%;right:0;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:8px;max-height:240px;overflow-y:auto;z-index:1000;min-width:160px;margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,0.4);padding:4px 0;';

            var filterWrapper = iframeDoc.createElement('div');
            filterWrapper.style.cssText = 'position:relative;';
            filterWrapper.appendChild(filterBtn);
            filterWrapper.appendChild(dropdown);

            function updateCountryList() {
                var table = iframeDoc.querySelector("[data-hook='list']");
                if (!table) return;

                var countries = {};
                var rows = table.querySelectorAll('tr');
                for (var i = 0; i < rows.length; i++) {
                    var flagCell = rows[i].querySelector("[data-hook='flag']");
                    if (flagCell) {
                        var code = flagCell.className.replace('flagico f-', '').trim();
                        if (code) countries[code] = true;
                    }
                }

                dropdown.innerHTML = '';
                
                // Ordena os países alfabeticamente
                var sortedCountries = [];
                for (var c in countries) {
                    sortedCountries.push(c);
                }
                sortedCountries.sort();

                // Adiciona "Todos" primeiro
                var t = window.__t || function(k) { return k; };
                var allItem = iframeDoc.createElement('div');
                allItem.style.cssText = 'padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;border-radius:4px;margin:0 4px;';
                allItem.onmouseenter = function() { allItem.style.background = 'var(--theme-bg-hover, #333)'; };
                allItem.onmouseleave = function() { allItem.style.background = ''; };
                allItem.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-muted, #666)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span style="color:var(--theme-text-primary, #fff);font-size:13px;">' + t('Todos os países') + '</span>';
                allItem.onclick = function() {
                    selectedCountry = 'all';
                    dropdown.style.display = 'none';
                    filterBtn.style.background = 'var(--theme-bg-secondary, #1a1a1a)';
                    filterBtn.style.color = 'var(--theme-text-muted, #666)';
                    filterBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                    // Limpa salas fixadas ao mudar filtro de país
                    clearPinnedRooms();
                    updatePinnedHighlight(listContainer);
                    doSearch(iframeDoc, input.value.toLowerCase());
                };
                dropdown.appendChild(allItem);

                // Adiciona os países ordenados
                for (var j = 0; j < sortedCountries.length; j++) {
                    (function(code) {
                        var item = iframeDoc.createElement('div');
                        item.style.cssText = 'padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;border-radius:4px;margin:0 4px;';
                        item.onmouseenter = function() { item.style.background = 'var(--theme-bg-hover, #333)'; };
                        item.onmouseleave = function() { item.style.background = ''; };
                        item.innerHTML = '<span class="flagico f-' + code + '" style="width:20px;height:15px;display:inline-block;"></span><span style="color:var(--theme-text-primary, #fff);font-size:13px;">' + code.toUpperCase() + '</span>';

                        item.onclick = function() {
                            selectedCountry = code;
                            dropdown.style.display = 'none';
                            filterBtn.style.background = 'var(--theme-bg-hover, #333)';
                            filterBtn.style.color = 'var(--theme-text-primary, #fff)';
                            filterBtn.innerHTML = '<span style="font-size:12px;font-weight:600;">' + code.toUpperCase() + '</span>';
                            // Limpa salas fixadas ao mudar filtro de país
                            clearPinnedRooms();
                            updatePinnedHighlight(listContainer);
                            doSearch(iframeDoc, input.value.toLowerCase());
                        };

                        dropdown.appendChild(item);
                    })(sortedCountries[j]);
                }
            }

            filterBtn.onclick = function(e) {
                e.stopPropagation();
                updateCountryList();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            };

            iframeDoc.addEventListener('click', function() {
                dropdown.style.display = 'none';
            });

            searchContainer.appendChild(svg);
            searchContainer.appendChild(input);
            searchContainer.appendChild(filterWrapper);

            var dialog = roomlistView.querySelector('.dialog');
            if (dialog) {
                // Design 1.3: Barra de pesquisa acima do header da tabela
                var headerTable = dialog.querySelector('table.header');
                if (headerTable && headerTable.parentNode) {
                    headerTable.parentNode.insertBefore(searchContainer, headerTable);
                } else {
                    // Fallback: insere antes do content
                    var content = dialog.querySelector('.content');
                    if (content && content.parentNode) {
                        content.parentNode.insertBefore(searchContainer, content);
                    }
                }
            }
        }

        if (roomListObserver && listContainer.dataset.observing) return;
        listContainer.dataset.observing = 'true';

        function applyPasswordOpacity() {
            try {
                var rows = listContainer.querySelectorAll('tr');
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var passCell = row.querySelector('[data-hook="pass"]');
                    if (passCell) {
                        row.style.opacity = (passCell.textContent || '').indexOf('Yes') !== -1 ? '0.5' : '1';
                    }
                }
            } catch (e) {}
        }

        cleanupRoomList();

        roomListObserver = new MutationObserver(applyPasswordOpacity);
        roomListObserver.observe(listContainer, { childList: true });

        applyPasswordOpacity();
    }

    // Observer otimizado - desconecta durante gameplay
    function init() {
        if (!Injector.isGameFrame()) return;
        
        var checkInterval = null;
        
        var hideTooltipAndMenu = function() {
            var tooltip = document.getElementById('sidebar-tooltip');
            if (tooltip) tooltip.style.opacity = '0';
            var ctxMenu = document.getElementById('room-context-menu');
            if (ctxMenu) ctxMenu.remove();
        };
        
        var checkAndModify = function() {
            var roomlistView = document.querySelector('.roomlist-view');

            if (roomlistView) {
                ensureRoomlistPreview(document);
            } else {
                teardownRoomlistPreview(document);
                teardownRoomListLoadingOverlay(document);
                hideTooltipAndMenu();
            }
        };
        
        var startChecking = function() {
            if (checkInterval) return;
            Injector.log('Roomlist: startChecking');
            checkInterval = setInterval(checkAndModify, 50);
            checkAndModify();
        };
        
        var stopChecking = function() {
            if (checkInterval) {
                Injector.log('Roomlist: stopChecking');
                clearInterval(checkInterval);
                checkInterval = null;
            }
            teardownRoomListLoadingOverlay(document);
            hideTooltipAndMenu();
        };
        
        // Usa o sistema de views do core
        Injector.onView('roomlist-view', function() {
            Injector.log('Roomlist: onView roomlist-view');
            startChecking();
        });
        
        Injector.onView('room-view', function() {
            Injector.log('Roomlist: onView room-view');
            startChecking();
        });
        
        Injector.onView('game-view', function() {
            Injector.log('Roomlist: onView game-view');
            stopChecking();
        });
        
        // Inicia se não estiver em game-view
        if (!document.querySelector('.game-view')) {
            startChecking();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    bootRoomlistPreviewPipeline(document);

    try {
        window.__hxdForceRoomlistPreviewSync = function (doc, force) {
            if (!doc) doc = document;
            if (force !== false) invalidateRoomlistPreviewSync(doc);
            var frame = doc.getElementById('hxd-roomlist-preview-frame');
            if (frame) applyThemeToPreviewFrameDirect(frame, doc);
            pushRoomlistPreviewSyncNow(doc, force !== false);
        };
    } catch (eApi) {}

    Injector.log('Roomlist module loaded');
})();
