// ============================================
// ROOMLIST - Lista de salas com pesquisa e filtros
// ============================================
(function() {
    if (!window.__hxdRoomlistAnonSyncBound) {
        window.__hxdRoomlistAnonSyncBound = true;
        window.addEventListener('hxd-anonymous-mode-changed', function() {
            try {
                var ids = ['friends-btn', 'teams-btn', 'pro-sidebar-btn'];
                for (var i = 0; i < ids.length; i++) {
                    var el = document.getElementById(ids[i]);
                    if (el) el.style.display = '';
                }
            } catch (eAn) {}
        });
    }

    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var roomListObserver = null;
    var cachedRows = null;
    var selectedCountry = 'all';
    var searchTimeout = null;
    var isFilteringFavs = false;
    var LOCAL_API = (function resolveRoomlistApiBase() {
        try {
            var meta = document.querySelector('meta[name="hxd-local-api"]');
            if (meta && meta.content) return String(meta.content).replace(/\/+$/, '');
        } catch (eMeta) {}
        try {
            var parentMeta = window.parent.document.querySelector('meta[name="hxd-local-api"]');
            if (parentMeta && parentMeta.content) return String(parentMeta.content).replace(/\/+$/, '');
        } catch (eParent) {}
        return 'http://127.0.0.1:5483';
    })();
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
                loginMsg: 'Para ver tu perfil con foto de Discord y datos automáticos, entrá con Discord desde HaxBall Zero y volvé a la lista de salas. Después abrí de nuevo el perfil desde el botón lateral.',
                loginBtn: 'Ir al juego',
                backRooms: 'Volver a salas',
                pageTitle: 'Pro',
                tierSub: ' partidas · ',
                wins: '% wins',
                online: 'ONLINE',
                inRoom: ' en sala',
                chatSoon: 'El chat global estará disponible pronto.',
                chatPh: 'Mensaje...',
                noFriends: 'Sin amigos aún',
                rend: 'RENDIMIENTO',
                elo: 'RANGO ELO',
                delta: 'CAMBIO ELO',
                vict: 'VICTORIAS',
                der: 'DERROTAS',
                emp: 'EMPATES',
                winp: 'WIN %',
                kd: 'K/D',
                pj: 'PARTIDAS',
                global: 'GLOBAL',
                amigos: 'AMIGOS',
                amigosBtn: '❤ AMIGOS',
                reports: 'REPORTES',
                buscar: '▶ BUSCAR',
                crear: '+ CREAR',
                haxball: 'HAXBALL',
                proCta: 'PRO',
                proTitle: 'Pro',
                communityInvite: 'discord.gg/haxzero',
                communityOpenLabel: 'Comunidad (Discord)'
            },
            pt: {
                loginTitle: 'Inicia sessão',
                loginMsg: 'Para ver o teu perfil com foto do Discord e dados automáticos, entra com Discord no HaxBall Zero e volta à lista de salas. Depois abre de novo o perfil pelo botão lateral.',
                loginBtn: 'Ir ao jogo',
                backRooms: 'Voltar às salas',
                pageTitle: 'Pro',
                tierSub: ' partidas · ',
                wins: '% vitórias',
                online: 'ONLINE',
                inRoom: ' na sala',
                chatSoon: 'O chat global estará disponível em breve.',
                chatPh: 'Mensagem...',
                noFriends: 'Sem amigos ainda',
                rend: 'DESEMPENHO',
                elo: 'ELO',
                delta: 'VARIAÇÃO ELO',
                vict: 'VITÓRIAS',
                der: 'DERROTAS',
                emp: 'EMPATES',
                winp: 'WIN %',
                kd: 'K/D',
                pj: 'PARTIDAS',
                global: 'GLOBAL',
                amigos: 'AMIGOS',
                amigosBtn: '❤ AMIGOS',
                reports: 'RELATÓRIOS',
                buscar: '▶ JOGAR',
                crear: '+ CRIAR',
                haxball: 'HAXBALL',
                proCta: 'PRO',
                proTitle: 'Pro',
                communityInvite: 'discord.gg/haxzero',
                communityOpenLabel: 'Comunidade (Discord)'
            },
            en: {
                loginTitle: 'Sign in',
                loginMsg: 'To see your profile with Discord avatar and auto-filled data, sign in with Discord from HaxBall Zero and return to the room list. Then open your profile again from the side button.',
                loginBtn: 'Go to game',
                backRooms: 'Back to rooms',
                pageTitle: 'Pro',
                tierSub: ' matches · ',
                wins: '% wins',
                online: 'ONLINE',
                inRoom: ' in room',
                chatSoon: 'Global chat will be available soon.',
                chatPh: 'Message...',
                noFriends: 'No friends yet',
                rend: 'PERFORMANCE',
                elo: 'ELO RANK',
                delta: 'ELO CHANGE',
                vict: 'WINS',
                der: 'LOSSES',
                emp: 'DRAWS',
                winp: 'WIN %',
                kd: 'K/D',
                pj: 'MATCHES',
                global: 'GLOBAL',
                amigos: 'FRIENDS',
                amigosBtn: '❤ FRIENDS',
                reports: 'REPORTS',
                buscar: '▶ FIND',
                crear: '+ CREATE',
                haxball: 'HAXBALL',
                proCta: 'PRO',
                proTitle: 'Pro',
                communityInvite: 'discord.gg/haxzero',
                communityOpenLabel: 'Community (Discord)'
            }
        };
        return S[lang] || S.es;
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
        var dialog = iframeDoc.querySelector('.roomlist-view .dialog');
        if (dialog) {
            dialog.classList.remove('zero-profile-mode');
            scheduleRoomlistDialogOverlayUnlock(dialog);
        }
        var root = iframeDoc.getElementById('zero-inpanel-profile');
        if (root) root.style.display = 'none';
        if (window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
            try {
                TeamsSystem.closeRoomlistTeamsIfOpen(iframeDoc);
            } catch (eZt) {}
        }
        if (window.FriendsSystem && typeof FriendsSystem.closeFriendsPanel === 'function') {
            try {
                FriendsSystem.closeFriendsPanel(iframeDoc);
            } catch (eZf) {}
        }
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
            if (dialog.classList.contains('zero-teams-mode')) return;
            if (dialog.classList.contains('zero-friends-mode')) return;
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
     * Modo equipos embebido na roomlist: mantén sidebar; mostra só #zero-inpanel-teams.
     */
    function setRoomlistDialogTeamsMode(iframeDoc, dialog, active) {
        if (!iframeDoc || !dialog) return;
        if (active) {
            ensureRoomlistDialogOverlayLocked(dialog);
        } else {
            scheduleRoomlistDialogOverlayUnlock(dialog);
        }

        var children = dialog.children;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!child || !child.id) {
                setSwapVisibility(child, !active);
                continue;
            }
            if (child.id === 'sidebar-panel') {
                if (child.dataset && Object.prototype.hasOwnProperty.call(child.dataset, 'zeroPrevDisplay')) {
                    delete child.dataset.zeroPrevDisplay;
                }
                child.style.display = 'flex';
                child.style.flexDirection = 'column';
                continue;
            }
            if (child.id === 'zero-inpanel-friends') {
                setSwapVisibility(child, !active);
                continue;
            }
            if (child.id === 'zero-inpanel-teams') {
                setSwapVisibility(child, active);
                continue;
            }
            if (child.id === 'zero-inpanel-pro') {
                setSwapVisibility(child, !active);
                continue;
            }
            if (child.id === 'zero-inpanel-jersey') {
                setSwapVisibility(child, !active);
                continue;
            }
            if (child.id === 'zero-inpanel-ranked') {
                setSwapVisibility(child, !active);
                continue;
            }
            setSwapVisibility(child, !active);
        }

        var profileRoot = iframeDoc.getElementById('zero-inpanel-profile');
        if (profileRoot) {
            if (active) profileRoot.style.display = 'none';
            else if (dialog.classList.contains('zero-profile-mode')) profileRoot.style.display = 'flex';
        }
        var proRootT = iframeDoc.getElementById('zero-inpanel-pro');
        if (proRootT) proRootT.style.display = active ? 'none' : (dialog.classList.contains('zero-pro-mode') ? 'flex' : 'none');
        var teamsHost = iframeDoc.getElementById('zero-inpanel-teams');
        if (teamsHost) teamsHost.style.display = active ? 'flex' : 'none';
        var friendsSyncT = iframeDoc.getElementById('zero-inpanel-friends');
        if (friendsSyncT) {
            friendsSyncT.style.display = active ? 'none' : (dialog.classList.contains('zero-friends-mode') ? 'flex' : 'none');
        }
        var jerseySyncT = iframeDoc.getElementById('zero-inpanel-jersey');
        if (jerseySyncT) {
            jerseySyncT.style.display = active ? 'none' : (dialog.classList.contains('zero-kit-mode') ? 'flex' : 'none');
        }
        if (!active) {
            var rsT = iframeDoc.getElementById('room-search');
            if (rsT && rsT.style) rsT.style.display = 'flex';
        }
    }

    window.__hxdSetRoomlistDialogTeamsMode = setRoomlistDialogTeamsMode;

    /**
     * Modo amigos embebido na roomlist (igual caixa que equipos / Pro en wad).
     */
    function setRoomlistDialogFriendsMode(iframeDoc, dialog, active) {
        if (!iframeDoc || !dialog) return;
        if (active) {
            ensureRoomlistDialogOverlayLocked(dialog);
        } else {
            scheduleRoomlistDialogOverlayUnlock(dialog);
        }

        var childrenF = dialog.children;
        for (var j = 0; j < childrenF.length; j++) {
            var ch = childrenF[j];
            if (!ch || !ch.id) {
                setSwapVisibility(ch, !active);
                continue;
            }
            if (ch.id === 'sidebar-panel') {
                if (ch.dataset && Object.prototype.hasOwnProperty.call(ch.dataset, 'zeroPrevDisplay')) {
                    delete ch.dataset.zeroPrevDisplay;
                }
                ch.style.display = 'flex';
                ch.style.flexDirection = 'column';
                continue;
            }
            if (ch.id === 'zero-inpanel-friends') {
                setSwapVisibility(ch, active);
                continue;
            }
            if (ch.id === 'zero-inpanel-teams') {
                setSwapVisibility(ch, !active);
                continue;
            }
            if (ch.id === 'zero-inpanel-pro') {
                setSwapVisibility(ch, !active);
                continue;
            }
            if (ch.id === 'zero-inpanel-jersey') {
                setSwapVisibility(ch, !active);
                continue;
            }
            if (ch.id === 'zero-inpanel-ranked') {
                setSwapVisibility(ch, !active);
                continue;
            }
            setSwapVisibility(ch, !active);
        }

        var profileRootF = iframeDoc.getElementById('zero-inpanel-profile');
        if (profileRootF) {
            if (active) profileRootF.style.display = 'none';
            else if (dialog.classList.contains('zero-profile-mode')) profileRootF.style.display = 'flex';
        }
        var proRootF = iframeDoc.getElementById('zero-inpanel-pro');
        if (proRootF) proRootF.style.display = active ? 'none' : (dialog.classList.contains('zero-pro-mode') ? 'flex' : 'none');
        var friendsHost = iframeDoc.getElementById('zero-inpanel-friends');
        if (friendsHost) friendsHost.style.display = active ? 'flex' : 'none';
        var teamsSyncF = iframeDoc.getElementById('zero-inpanel-teams');
        if (teamsSyncF) {
            teamsSyncF.style.display = active ? 'none' : (dialog.classList.contains('zero-teams-mode') ? 'flex' : 'none');
        }
        var jerseySyncF = iframeDoc.getElementById('zero-inpanel-jersey');
        if (jerseySyncF) {
            jerseySyncF.style.display = active ? 'none' : (dialog.classList.contains('zero-kit-mode') ? 'flex' : 'none');
        }
        if (!active) {
            var rsF = iframeDoc.getElementById('room-search');
            if (rsF && rsF.style) rsF.style.display = 'flex';
        }
    }

    window.__hxdSetRoomlistDialogFriendsMode = setRoomlistDialogFriendsMode;

    /**
     * Modo Pro embebido (misma lógica de visibilidad que equipos/amigos).
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
            if (c.id === 'zero-inpanel-friends') {
                setSwapVisibility(c, !active);
                continue;
            }
            if (c.id === 'zero-inpanel-teams') {
                setSwapVisibility(c, !active);
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
        var teamsSyncP = iframeDoc.getElementById('zero-inpanel-teams');
        if (teamsSyncP) {
            teamsSyncP.style.display = active ? 'none' : (dialog.classList.contains('zero-teams-mode') ? 'flex' : 'none');
        }
        var friendsSyncP = iframeDoc.getElementById('zero-inpanel-friends');
        if (friendsSyncP) {
            friendsSyncP.style.display = active ? 'none' : (dialog.classList.contains('zero-friends-mode') ? 'flex' : 'none');
        }
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
            if (ck.id === 'zero-inpanel-friends') {
                setSwapVisibility(ck, !active);
                continue;
            }
            if (ck.id === 'zero-inpanel-teams') {
                setSwapVisibility(ck, !active);
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
        var teamsSyncK = iframeDoc.getElementById('zero-inpanel-teams');
        if (teamsSyncK) {
            teamsSyncK.style.display = active ? 'none' : (dialog.classList.contains('zero-teams-mode') ? 'flex' : 'none');
        }
        var friendsSyncK = iframeDoc.getElementById('zero-inpanel-friends');
        if (friendsSyncK) {
            friendsSyncK.style.display = active ? 'none' : (dialog.classList.contains('zero-friends-mode') ? 'flex' : 'none');
        }
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
        if (window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
            try {
                TeamsSystem.closeRoomlistTeamsIfOpen(iframeDoc);
            } catch (e1) {}
        }
        if (window.FriendsSystem && typeof FriendsSystem.closeFriendsPanel === 'function') {
            try {
                FriendsSystem.closeFriendsPanel(iframeDoc);
            } catch (e2) {}
        }
        if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
            try {
                JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc);
            } catch (eJk) {}
        }
        dialog.classList.remove('zero-teams-mode', 'zero-friends-mode', 'zero-profile-mode', 'zero-kit-mode');
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
        if (window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
            try {
                TeamsSystem.closeRoomlistTeamsIfOpen(iframeDoc);
            } catch (e1) {}
        }
        if (window.FriendsSystem && typeof FriendsSystem.closeFriendsPanel === 'function') {
            try {
                FriendsSystem.closeFriendsPanel(iframeDoc);
            } catch (e2) {}
        }
        if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
            try {
                JerseyKitSystem.closeRoomlistJerseyIfOpen(iframeDoc);
            } catch (eJk2) {}
        }
        dialog.classList.remove('zero-teams-mode', 'zero-friends-mode', 'zero-pro-mode', 'zero-kit-mode');
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

        dialog.classList.add('zero-profile-mode');
        ensureRoomlistDialogOverlayLocked(dialog);
        var root = iframeDoc.getElementById('zero-inpanel-profile');
        if (root) {
            root.style.display = 'flex';
            fetchProfileBundle().then(function(data) {
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
        var friends = data && Array.isArray(data.friends) ? data.friends : [];
        var team = data && data.team;

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
        var proToolbar = iframeDoc.getElementById('zip-btn-pro');
        if (proToolbar) {
            proToolbar.innerHTML = zipVerifiedBadgeSvg(17);
            proToolbar.setAttribute('title', T.proTitle);
            proToolbar.setAttribute('aria-label', T.proTitle);
        }
        if (loginPro) loginPro.style.display = '';
        if (proToolbar) proToolbar.style.display = '';
        var backBtn = iframeDoc.getElementById('zip-back-salas');
        if (backBtn) {
            backBtn.title = T.backRooms;
            backBtn.setAttribute('aria-label', T.backRooms);
        }
        setText('zip-page-title', T.pageTitle);
        setText('zip-lbl-rend', T.rend);
        setText('zip-lbl-elo', T.elo);
        setText('zip-lbl-delta', T.delta);
        setText('zip-lbl-v', T.vict);
        setText('zip-lbl-d', T.der);
        setText('zip-lbl-e', T.emp);
        setText('zip-lbl-winp', T.winp);
        setText('zip-lbl-kd', T.kd);
        setText('zip-lbl-pj', T.pj);
        setText('zip-lbl-global', T.global);
        setText('zip-pill-global-on', '● ' + T.online);
        setText('zip-lbl-online', T.online);
        setText('zip-lbl-amigos-col', T.amigos);
        setText('zip-chat-log', T.chatSoon);
        var chatInp = iframeDoc.getElementById('zip-chat-inp');
        if (chatInp) chatInp.placeholder = T.chatPh || '';
        var bbf = iframeDoc.getElementById('zip-btn-friends');
        var bbr = iframeDoc.getElementById('zip-btn-reports');
        var bbus = iframeDoc.getElementById('zip-btn-buscar');
        var bcre = iframeDoc.getElementById('zip-btn-crear');
        if (bbf) {
            bbf.textContent = T.amigosBtn;
            bbf.style.display = anonZip ? 'none' : '';
        }
        if (bbr) bbr.textContent = T.reports;
        if (bbus) bbus.textContent = T.buscar;
        if (bcre) bcre.textContent = T.crear;
        setText('zip-game-lbl', T.haxball);

        if (!user || !user.discord_id) {
            if (wall) wall.style.display = 'flex';
            if (main) main.style.display = 'none';
            return;
        }
        if (wall) wall.style.display = 'none';
        if (main) main.style.display = 'block';

        var nick = user.nick || user.username || 'Player';
        setText('zip-display', nick);
        var avEl = iframeDoc.getElementById('zip-avatar');
        if (avEl) {
            avEl.src = user.discord_avatar || defaultAvatarZip(user.discord_id);
            avEl.alt = nick;
        }
        var tierEl = iframeDoc.getElementById('zip-tier');
        if (tierEl) {
            if (user.is_pro) tierEl.textContent = 'PRO';
            else if (user.is_vip) tierEl.textContent = 'VIP';
            else tierEl.textContent = 'NOVATO+';
        }
        setText('zip-tier-sub', '0' + T.tierSub + '0' + T.wins);
        var roomTxt = '0' + T.inRoom;
        if (user.room_name) roomTxt = '1' + T.inRoom;
        setText('zip-inroom', roomTxt);

        var teamEl = iframeDoc.getElementById('zip-team-line');
        if (teamEl) {
            if (team && (team.name || team.team_name)) {
                teamEl.style.display = 'block';
                teamEl.textContent = String(team.name || team.team_name);
            } else {
                teamEl.style.display = 'none';
                teamEl.textContent = '';
            }
        }

        var fl = iframeDoc.getElementById('zip-friends-list');
        if (fl) {
            if (!friends.length) {
                fl.innerHTML = '<div class="zip-empty">' + escapeHtml(T.noFriends) + '</div>';
            } else {
                fl.innerHTML = '';
                for (var i = 0; i < friends.length; i++) {
                    var f = friends[i];
                    var row = iframeDoc.createElement('div');
                    row.className = 'zip-friend-row';
                    row.textContent = f.username || f.nick || f.discord_id || '—';
                    fl.appendChild(row);
                }
            }
        }
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
        var proBtn = iframeDoc.getElementById('zip-btn-pro');
        if (proBtn) proBtn.onclick = function() { openProFromZipPanel(iframeDoc); };
        var bb = iframeDoc.getElementById('zip-btn-buscar');
        var bc = iframeDoc.getElementById('zip-btn-crear');
        var bf = iframeDoc.getElementById('zip-btn-friends');
        var br = iframeDoc.getElementById('zip-btn-reports');
        if (bb) bb.onclick = goHaxballPlay;
        if (bc) bc.onclick = goHaxballPlay;
        if (bf) bf.onclick = goHaxballPlay;
        if (br) br.onclick = goHaxballPlay;
        var inp = iframeDoc.getElementById('zip-chat-inp');
        if (inp) {
            inp.addEventListener('input', function() {
                var cc = iframeDoc.getElementById('zip-cc-n');
                if (cc) cc.textContent = String(inp.value.length);
            });
        }
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
            '<button type="button" id="zip-btn-pro" class="zip-pro-btn zip-pro-btn-icon" aria-label=""></button>' +
            '<span class="zip-toolbar-spacer"></span></div>' +
            '<div class="zip-card">' +
            '<h1 class="zip-card-title" id="zip-page-title"></h1>' +
            '<div class="zip-columns">' +
            '<div class="zip-col zip-col-main">' +
            '<div class="zip-rank">' +
            '<div class="zip-ring"><span class="zip-lvl" id="zip-lvl">3</span><span class="zip-xp" id="zip-xp">1000</span></div>' +
            '<div class="zip-rank-meta">' +
            '<div class="zip-tier" id="zip-tier">NOVATO+</div>' +
            '<div class="zip-tier-sub" id="zip-tier-sub"></div></div></div>' +
            '<div class="zip-id">' +
            '<img id="zip-avatar" src="" alt="" width="48" height="48" />' +
            '<div><div class="zip-name" id="zip-display">—</div>' +
            '<div class="zip-tag" id="zip-game-lbl"></div>' +
            '<div class="zip-team-line" id="zip-team-line" style="display:none"></div></div></div>' +
            '<div class="zip-block">' +
            '<div class="zip-row-label"><span id="zip-lbl-rend"></span>' +
            '<div class="zip-pills"><div class="zip-pill zip-pill-g" id="zip-wcell">0</div><div class="zip-pill zip-pill-r" id="zip-lcell">0</div></div></div>' +
            '<div class="zip-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
            '<div class="zip-kv"><span id="zip-lbl-elo"></span><strong id="zip-elo">951 / 1100</strong></div>' +
            '<div class="zip-kv"><span id="zip-lbl-delta"></span><strong class="zip-delta" id="zip-elo-delta">0</strong></div></div>' +
            '<div class="zip-block">' +
            '<div class="zip-stat-grid">' +
            '<div class="zip-stat"><span class="zip-n" id="zip-st-v">0</span><span class="zip-lbl" id="zip-lbl-v"></span></div>' +
            '<div class="zip-stat"><span class="zip-n" id="zip-st-d">0</span><span class="zip-lbl" id="zip-lbl-d"></span></div>' +
            '<div class="zip-stat"><span class="zip-n" id="zip-st-e">0</span><span class="zip-lbl" id="zip-lbl-e"></span></div></div>' +
            '<div class="zip-stat-grid zip-stat-grid-sub">' +
            '<div class="zip-stat zip-st-sm"><span class="zip-n" id="zip-st-winp">0%</span><span class="zip-lbl" id="zip-lbl-winp"></span></div>' +
            '<div class="zip-stat zip-st-sm"><span class="zip-n" id="zip-st-kd">—</span><span class="zip-lbl" id="zip-lbl-kd"></span></div>' +
            '<div class="zip-stat zip-st-sm"><span class="zip-n" id="zip-st-pj">0</span><span class="zip-lbl" id="zip-lbl-pj"></span></div></div>' +
            '<div class="zip-btn-row">' +
            '<button type="button" class="zip-btn-flat" id="zip-btn-friends"></button>' +
            '<button type="button" class="zip-btn-flat" id="zip-btn-reports"></button></div></div>' +
            '<div class="zip-footer">' +
            '<div class="zip-footer-left">' +
            '<span class="zip-dot"></span>' +
            '<span class="zip-online-txt" id="zip-lbl-online"></span>' +
            '<span class="zip-room-txt" id="zip-inroom"></span></div>' +
            '<div class="zip-footer-cta">' +
            '<button type="button" class="zip-btn-primary" id="zip-btn-buscar"></button>' +
            '<button type="button" class="zip-btn-secondary" id="zip-btn-crear"></button></div></div></div>' +
            '<div class="zip-col">' +
            '<div class="zip-col-head"><strong id="zip-lbl-global"></strong><span class="zip-badge-live" id="zip-pill-global-on"></span></div>' +
            '<div class="zip-chat-body" id="zip-chat-log"></div>' +
            '<div class="zip-chat-foot">' +
            '<div class="zip-chat-row">' +
            '<input type="text" id="zip-chat-inp" maxlength="120" placeholder="" readonly />' +
            '<button type="button" class="zip-send" title="">➤</button></div>' +
            '<div class="zip-char"><span id="zip-cc-n">0</span> / 120</div></div></div>' +
            '<div class="zip-col">' +
            '<div class="zip-col-head" id="zip-lbl-amigos-col"></div>' +
            '<div class="zip-friends" id="zip-friends-list"></div></div></div></div></div>'
        );
    }

    function fetchProfileBundle() {
        if (profileDataPromise) return profileDataPromise;
        profileDataPromise = Promise.all([
            fetchJson('/user').catch(function() { return null; }),
            fetchJson('/friends').catch(function() { return []; }),
            fetchJson('/teams/my').catch(function() { return null; })
        ]).then(function(results) {
            var user = results[0] && results[0].logged_in ? results[0] : null;
            var friends = Array.isArray(results[1]) ? results[1] : [];
            var team = results[2] && typeof results[2] === 'object' ? results[2] : null;
            profileDataCache = { user: user, friends: friends, team: team };
            profileDataPromise = null;
            return profileDataCache;
        }).catch(function(error) {
            profileDataPromise = null;
            throw error;
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

    function modifyRoomList(iframeDoc) {
        var listContainer = iframeDoc.querySelector('.roomlist-view tbody[data-hook="list"]');
        var roomlistView = iframeDoc.querySelector('.roomlist-view');

        if (!listContainer || !roomlistView) {
            cleanupRoomList();
            return;
        }

        var dialog = roomlistView.querySelector('.dialog');
        if (!dialog) return;

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

            // Botão de amizades
            var friendsBtn = iframeDoc.createElement('button');
            friendsBtn.id = 'friends-btn';
            addTooltip(friendsBtn, t('Amizades'));
            friendsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
            friendsBtn.onclick = function() {
                if (window.FriendsSystem) {
                    window.FriendsSystem.injectFriendsButton(iframeDoc);
                    // Simula clique no botão injetado ou abre diretamente
                    var injectedBtn = iframeDoc.getElementById('friends-btn-panel');
                    if (injectedBtn) {
                        injectedBtn.click();
                    } else {
                        // Abre painel diretamente
                        window.FriendsSystem.toggleFriendsPanel(iframeDoc);
                    }
                }
            };
            sidebar.appendChild(friendsBtn);

            // Botão de equipes
            var teamsBtn = iframeDoc.createElement('button');
            teamsBtn.id = 'teams-btn';
            addTooltip(teamsBtn, t('Equipe'));
            teamsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
            teamsBtn.onclick = function() {
                if (window.TeamsSystem) {
                    window.TeamsSystem.toggleTeamsPanel(iframeDoc);
                }
            };
            sidebar.appendChild(teamsBtn);

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
            var sidebar = document.getElementById('sidebar-panel');

            if (roomlistView) {
                if (!sidebar) {
                    modifyRoomList(document);
                }
            } else {
                teardownRoomListLoadingOverlay(document);
                hideTooltipAndMenu();
                if (window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
                    try {
                        TeamsSystem.closeRoomlistTeamsIfOpen(document);
                    } catch (eRtl) {}
                }
                if (window.FriendsSystem && typeof FriendsSystem.closeFriendsPanel === 'function') {
                    try {
                        FriendsSystem.closeFriendsPanel(document);
                    } catch (eRfl) {}
                }
            }
        };
        
        var startChecking = function() {
            if (checkInterval) return;
            Injector.log('Roomlist: startChecking');
            checkInterval = setInterval(checkAndModify, 300);
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

    Injector.log('Roomlist module loaded');
})();
