// ============================================
// HEADER - Barra customizada com link de sala
// ============================================
(function() {
    if (typeof window.__hxdIsAnonymousMode !== 'function') {
        window.__hxdIsAnonymousMode = function() {
            try {
                if (localStorage.getItem('hxd_anonymous_mode') === '1') return true;
                if (localStorage.getItem('ghost_mode') === 'true') return true;
                return false;
            } catch (eA) {
                return false;
            }
        };
    }
    if (typeof window.__hxdSetAnonymousMode !== 'function') {
        window.__hxdSetAnonymousMode = function(on) {
            try {
                if (on) {
                    localStorage.setItem('hxd_anonymous_mode', '1');
                    localStorage.setItem('ghost_mode', 'true');
                } else {
                    localStorage.removeItem('hxd_anonymous_mode');
                    localStorage.removeItem('ghost_mode');
                }
            } catch (eS) {}
            try {
                window.dispatchEvent(new CustomEvent('hxd-anonymous-mode-changed', { detail: { on: !!on } }));
            } catch (eE) {}
        };
    }

    if (typeof window.__hxdPostAnonymousToGameFrame !== 'function') {
        window.__hxdPostAnonymousToGameFrame = function(on) {
            try {
                var ifr = document.querySelector('iframe[src*="game.html"], iframe[src*="html5.haxball"], iframe[src*="haxball.com"]');
                if (ifr && ifr.contentWindow) {
                    ifr.contentWindow.postMessage({ type: 'hxd-sync-anonymous', on: !!on }, '*');
                }
            } catch (eP) {}
        };
    }

    if (typeof window.__hxdOpenExternalUrl !== 'function') {
        window.__hxdOpenExternalUrl = function(url) {
            var u = String(url == null ? '' : url).trim();
            if (!u) return;
            if (!/^https?:\/\//i.test(u)) {
                u = 'https://' + u;
            }
            var base = 'http://127.0.0.1:5483';
            try {
                if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                    base = String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/$/, '');
                }
            } catch (eB) {}
            fetch(base + '/open-external', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: u })
            }).catch(function() {
                try {
                    window.open(u, '_blank', 'noopener,noreferrer');
                } catch (eO) {}
            });
        };
    }

    if (!Injector.isMainFrame()) return;
    if (window.__headerInjected) return;
    window.__headerInjected = true;

    /** Si la caché de extensiones desempaquetadas es vieja, el HTML puede no traer el botón; lo insertamos en la barra derecha (solo icono). */
    var HXD_SPOTIFYToolbar_SVG =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.381-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.02-.181-1.02-.721 0-.439.24-.78.66-.96 4.281-1.261 11.521-1.021 16.201 2.521.539.301.719 1.021.42 1.56-.301.421-1.021.599-1.56.42z"/></svg>';

    function hxdEnsureSpotifyToolbarButton(headerRoot) {
        try {
            if (!headerRoot || headerRoot.ownerDocument !== document) return;
            if (headerRoot.querySelector('#hxd-spotify-header-slot')) return;
            var right = headerRoot.querySelector('.header-right');
            var chromeBtn = headerRoot.querySelector('#hxd-toggle-chrome-btn');
            if (!right || !chromeBtn) return;
            var slot = document.createElement('div');
            slot.id = 'hxd-spotify-header-slot';
            slot.className = 'hxd-spotify-header-slot';
            slot.innerHTML =
                '<button type="button" id="spotify-header-btn" data-translate-title="Spotify" title="Spotify" style="display:flex!important;align-items:center;justify-content:center;min-width:28px;min-height:28px;padding:4px;background:transparent;border:none;color:#1db954;cursor:pointer;visibility:visible!important;opacity:1!important;flex-shrink:0;">' +
                HXD_SPOTIFYToolbar_SVG +
                '</button>';
            right.insertBefore(slot, chromeBtn);
            try {
                Injector.log('Spotify: botón navbar (solo icono)');
            } catch (eL) {}
        } catch (eEns) {}
    }

    var HEADER_BAR_PX = 48;
    /** Franja entre barra e iframe; 0 = sin banda oscura extra debajo del header. */
    var HEADER_GAME_GAP_PX = 0;

    /** Logo del cliente (navbar negra). */
    var LOGO_IMG =
        '<img class="header-logo" src="https://i.ibb.co/YF3Ln83r/logo-haxballapp.png" alt="HaxBall Zero" height="28" decoding="async" draggable="false" />';

    /** Windows + Electron: una sola barra (nativa). Si electronAPI aún no existe, inferir por UA. */
    function hxdDetectWindowsNativeShell() {
        var api = window.electronAPI;
        if (api) {
            if (api.shellUsesNativeFrame === true) return true;
            if (api.platform === 'win32') return true;
        }
        try {
            var ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
            if (/Electron/i.test(ua) && /Windows/i.test(ua)) return true;
        } catch (eU) {}
        return false;
    }

    /** tbPx = barra blanca custom; darkNavPx = barra negra (0 en Windows: solo título nativo). */
    function buildHeaderCss(tbPx, darkNavPx) {
        var ctPx = tbPx + darkNavPx + HEADER_GAME_GAP_PX;
        var spTop = tbPx + darkNavPx;
        return '\
        .header { display: none !important; }\
        #custom-header {\
            position: fixed; top: ' + tbPx + 'px; left: 0; right: 0; height: ' + darkNavPx + 'px;\
            background: var(--theme-bg-primary, #1A2125);\
            border-bottom: 1px solid var(--theme-border, #232323);\
            box-shadow: none;\
            display: grid;\
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);\
            align-items: center;\
            column-gap: 12px;\
            padding: 0 16px 0 20px; z-index: 99999; font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;\
            box-sizing: border-box;\
            -webkit-app-region: drag;\
        }\
        #custom-header button, #custom-header input, #custom-header a, #custom-header textarea, #custom-header select, #custom-header .lang-item, #custom-header .room-link-bar {\
            -webkit-app-region: no-drag;\
        }\
        #custom-header-spacer {\
            position: fixed; top: ' + spTop + 'px; left: 0; right: 0; height: ' + HEADER_GAME_GAP_PX + 'px;\
            z-index: 99998; pointer-events: none; box-sizing: border-box;\
            background: transparent;\
            border: none;\
            box-shadow: none;\
        }\
        [data-theme="default"] #custom-header-spacer { background: transparent; border: none; }\
        [data-theme="onix"] #custom-header-spacer { background: transparent; border: none; }\
        [data-theme="light"] #custom-header-spacer { background: transparent; border: none; box-shadow: none; }\
        [data-theme="light"] #custom-header { box-shadow: none; }\
        [data-theme="default"] #custom-header { background: #1A2125; }\
        [data-theme="default"] #custom-header .room-link-bar { background: #2a3138; }\
        [data-theme="default"] #custom-header #room-link-input { color: #fff; }\
        [data-theme="default"] #custom-header #room-link-input::placeholder { color: #888; }\
        [data-theme="default"] #custom-header #room-link-btn { background: #3a4148; }\
        [data-theme="default"] #custom-header #room-link-btn:hover { background: #4a5158; }\
        [data-theme="default"] #lang-dropdown { background: #1A2125; border-color: rgba(255,255,255,0.08); }\
        [data-theme="default"] #lang-dropdown .lang-item { color: #fff; }\
        [data-theme="default"] #lang-dropdown .lang-item:hover { background: rgba(255,255,255,0.06); }\
        [data-theme="onix"] #custom-header { background: #000000; border-bottom-color: #1a1a1a; }\
        [data-theme="onix"] #custom-header .room-link-bar { background: #000000; }\
        [data-theme="onix"] #custom-header #room-link-input { color: #fff; }\
        [data-theme="onix"] #custom-header #room-link-input::placeholder { color: #555; }\
        [data-theme="onix"] #custom-header #room-link-btn { background: #0a0a0a; }\
        [data-theme="onix"] #custom-header #room-link-btn:hover { background: #111111; }\
        [data-theme="onix"] #lang-dropdown { background: #0a0a0a; border-color: rgba(255,255,255,0.08); }\
        [data-theme="onix"] #lang-dropdown .lang-item { color: #fff; }\
        [data-theme="onix"] #lang-dropdown .lang-item:hover { background: rgba(255,255,255,0.06); }\
        #custom-header .header-left { grid-column: 1; justify-self: start; display: flex; align-items: center; min-width: 0; -webkit-app-region: no-drag; }\
        #custom-header .header-logo {\
            display: block; height: 28px; width: auto; max-width: min(200px, 32vw);\
            object-fit: contain; object-position: left center; flex-shrink: 0;\
            background: transparent; border: none; border-radius: 0; box-shadow: none; pointer-events: none;\
        }\
        #custom-header .header-center { grid-column: 2; justify-self: center; min-width: 0; max-width: 100%; width: min(400px, calc(100vw - 200px)); display: flex; justify-content: center; padding: 0 8px; }\
        #custom-header .room-link-bar {\
            display: flex; background: var(--theme-bg-secondary, #1a1a1a); border-radius: 6px;\
            overflow: hidden; width: 100%; max-width: 400px;\
        }\
        #custom-header #room-link-input {\
            flex: 1; background: transparent; border: none; padding: 8px 12px;\
            color: var(--theme-text-primary, #fff); font-size: 13px; outline: none;\
            user-select: text !important; -webkit-user-select: text !important;\
        }\
        #custom-header #room-link-input::placeholder { color: var(--theme-text-muted, #666); }\
        #custom-header #room-link-btn {\
            background: var(--theme-bg-tertiary, #272727); border: none; padding: 8px 12px;\
            color: var(--theme-text-primary, #fff); cursor: pointer; display: flex; align-items: center;\
        }\
        #custom-header #room-link-btn:hover { background: var(--theme-bg-hover, #333); }\
        #custom-header .header-right { grid-column: 3; justify-self: end; display: flex; justify-content: flex-end; align-items: center; gap: 6px; flex-shrink: 0; }\
        #custom-header #discord-btn {\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px; display: flex;\
            transition: color 0.12s ease;\
        }\
        #custom-header #discord-btn:hover { color: #5865F2; }\
        #custom-header #ghost-mode-btn {\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;\
            transition: color 0.12s ease;\
        }\
        #custom-header #ghost-mode-btn:hover { color: #a78bfa; }\
        #custom-header #ghost-mode-btn.active:hover { color: #c4b5fd; }\
        #custom-header #ghost-mode-btn.active { color: #8b5cf6; }\
        #custom-header #ghost-mode-btn:disabled { opacity: 0.5; cursor: wait; }\
        #custom-header #hxd-toggle-chrome-btn {\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;\
            transition: color 0.12s ease;\
        }\
        #custom-header #hxd-toggle-chrome-btn:hover { color: var(--theme-text-primary, #fff); }\
        #custom-header #lang-btn {\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px; display: flex; position: relative;\
            transition: color 0.12s ease;\
        }\
        #custom-header #lang-btn:hover { color: var(--theme-text-primary, #fff); }\
        #lang-dropdown {\
            position: absolute; top: 100%; right: 0; margin-top: 6px;\
            background: var(--theme-bg-secondary, #1a1a1a); border: 1px solid rgba(255,255,255,0.08);\
            border-radius: 6px; padding: 2px 0; min-width: 108px; z-index: 100010; display: none;\
            box-shadow: none;\
        }\
        #lang-dropdown .lang-item {\
            padding: 6px 12px; cursor: pointer; color: var(--theme-text-primary, #fff); font-size: 12px; line-height: 1.3;\
            display: block; border-radius: 0;\
        }\
        #lang-dropdown .lang-item:hover { background: rgba(255,255,255,0.06); }\
        #lang-dropdown .lang-item.active { color: var(--theme-text-primary, #fff); font-weight: 600; }\
        #show-header-btn {\
            position: fixed; top: 8px; left: 8px;\
            background: transparent; border: none; border-radius: 0;\
            color: rgba(255,255,255,0.45); cursor: pointer; padding: 6px; z-index: 999999; display: none;\
            align-items: center; justify-content: center;\
            pointer-events: auto; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none;\
        }\
        #show-header-btn:hover { color: rgba(255,255,255,0.95); }\
        html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; overflow: hidden !important; }\
        body { background: var(--theme-bg-primary) !important; background-image: var(--theme-app-background-image, none) !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }\
        html[data-app-bg-image="1"] {\
            min-height: 100% !important;\
            background-color: var(--theme-bg-primary, #1A2125) !important;\
            background-image: var(--theme-app-background-image) !important;\
            background-size: cover !important;\
            background-position: center center !important;\
            background-repeat: no-repeat !important;\
        }\
        html[data-app-bg-image="1"] body {\
            background: transparent !important;\
            background-color: transparent !important;\
            background-image: none !important;\
        }\
        .view-wrapper, .game-view { margin-top: 0 !important; padding-top: ' + ctPx + 'px !important; box-sizing: border-box !important; height: 100% !important; }\
        iframe[src*="game.html"], iframe[src*="html5.haxball"] { position: fixed !important; top: ' + ctPx + 'px !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: calc(100vh - ' + ctPx + 'px) !important; border: none !important; z-index: 0 !important; }\
    ';
    }


    var HXD_SPOTIFY_EXTRA_CSS_TEMPLATE = '\
        #custom-header #spotify-header-btn {\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px;\
            display: flex !important; align-items: center; justify-content: center; flex-shrink: 0;\
            visibility: visible !important; opacity: 1 !important; min-width: 28px; min-height: 28px;\
        }\
        #custom-header .hxd-spotify-header-slot { display: flex; align-items: center; flex-shrink: 0; }\
        #custom-header #spotify-header-btn:hover { color: #1ed760; }\
        #custom-header #spotify-header-btn.hxd-spotify-fallback { color: var(--theme-text-muted, #666); }\
        #custom-header #spotify-header-btn.hxd-spotify-fallback:hover { color: #1ed760; }\
        #custom-header #spotify-header-btn.open { color: #1db954; }\
        #custom-header #spotify-header-btn.open:hover { color: #1ed760; }\
        #hxd-spotify-panel {\
            position: fixed; width: min(268px, calc(100vw - 16px));\
            padding: 4px; box-sizing: border-box;\
            background: var(--theme-bg-secondary, #1a1a1a); border: 1px solid var(--theme-border-light, #333);\
            border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 100001;\
            display: none; flex-direction: column; overflow: hidden;\
            font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;\
        }\
        #hxd-spotify-panel.open { display: flex; }\
        #hxd-spotify-panel.hxd-spotify-anchor-tr { top: __PANEL_TOP__px; right: 8px; bottom: auto; left: auto; transform: none; }\
        #hxd-spotify-panel.hxd-spotify-anchor-tl { top: __PANEL_TOP__px; left: 8px; bottom: auto; right: auto; transform: none; }\
        #hxd-spotify-panel.hxd-spotify-anchor-br { bottom: 12px; right: 8px; top: auto; left: auto; transform: none; }\
        #hxd-spotify-panel.hxd-spotify-anchor-bl { bottom: 12px; left: 8px; top: auto; right: auto; transform: none; }\
        #hxd-spotify-panel.hxd-spotify-anchor-mr { top: 50%; right: 8px; bottom: auto; left: auto; transform: translateY(-50%); }\
        #hxd-spotify-panel.hxd-spotify-anchor-ml { top: 50%; left: 8px; bottom: auto; right: auto; transform: translateY(-50%); }\
        .hxd-spotify-dd-head {\
            display: flex; align-items: center; justify-content: space-between; padding: 6px 10px;\
            font-size: 11px; font-weight: 600; color: var(--theme-text-primary, #fff); border-radius: 4px;\
        }\
        .hxd-spotify-dd-body { padding: 0 0 2px; font-size: 11px; color: var(--theme-text-primary, #fff); }\
        .hxd-spotify-dd-gutter { margin: 0 4px 4px; box-sizing: border-box; }\
        .hxd-spotify-connect-box {\
            display: flex; align-items: center; justify-content: center; gap: 8px; width: calc(100% - 8px);\
            padding: 6px 10px; margin: 2px 4px 6px; cursor: pointer; box-sizing: border-box;\
            background: transparent; border: none; border-radius: 4px;\
            color: var(--theme-text-primary, #fff); font-size: 11px; font-weight: 600;\
            transition: background 0.12s;\
        }\
        .hxd-spotify-connect-box:hover { background: var(--theme-bg-hover, #333); }\
        .hxd-spotify-connect-box:disabled { opacity: 0.5; cursor: not-allowed; }\
        .hxd-spotify-connect-icon { color: var(--theme-text-muted, #666); display: flex; flex-shrink: 0; }\
        .hxd-spotify-login-sub { margin: 8px 0 0; font-size: 10px; line-height: 1.45; color: var(--theme-text-muted, #666); text-align: center; }\
        .hxd-spotify-player-wrap { display: none; flex-direction: column; gap: 0; }\
        .hxd-spotify-player-wrap.hxd-spotify-player-wrap--visible { display: flex; }\
        .hxd-spotify-card {\
            display: flex; flex-direction: column; gap: 8px; padding: 0;\
        }\
        .hxd-spotify-card-row {\
            display: flex; flex-direction: row; align-items: flex-start; gap: 8px; width: 100%; min-width: 0;\
        }\
        .hxd-spotify-card-col {\
            flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;\
        }\
        .hxd-spotify-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; justify-content: center; }\
        .hxd-spotify-art-sm {\
            width: 40px; height: 40px; border-radius: 5px; object-fit: cover;\
            background: var(--theme-bg-primary, #141414); flex-shrink: 0;\
            border: 1px solid var(--theme-border, #232323);\
        }\
        .hxd-spotify-title {\
            font-size: 11px; font-weight: 600; color: var(--theme-text-primary, #fff); line-height: 1.25;\
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
        }\
        .hxd-spotify-artist {\
            font-size: 10px; font-weight: 500; color: var(--theme-text-muted, #666); line-height: 1.25;\
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
        }\
        .hxd-spotify-progress-track { width: 100%; }\
        .hxd-spotify-progress-wrap {\
            width: 100%; height: 4px; border-radius: 3px; background: var(--theme-border, #232323);\
            cursor: pointer; position: relative; overflow: hidden;\
        }\
        .hxd-spotify-progress-bar {\
            height: 100%; border-radius: 3px; background: var(--theme-text-secondary, #888); width: 0%; pointer-events: none;\
        }\
        .hxd-spotify-time-row {\
            display: flex; justify-content: space-between; align-items: center;\
            font-size: 10px; font-weight: 500; font-variant-numeric: tabular-nums;\
            color: var(--theme-text-muted, #666); margin-top: -2px;\
        }\
        .hxd-spotify-transport {\
            display: flex; align-items: center; justify-content: center; gap: 10px; padding: 0;\
        }\
        .hxd-spotify-trans-btn {\
            border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;\
            padding: 0; transition: background 0.12s, color 0.12s, transform 0.12s;\
            flex-shrink: 0;\
        }\
        .hxd-spotify-trans-side {\
            width: 28px; height: 28px; border-radius: 4px;\
            background: transparent; color: var(--theme-text-primary, #fff);\
        }\
        .hxd-spotify-trans-side:hover { background: var(--theme-bg-hover, #333); }\
        .hxd-spotify-play-main {\
            width: 30px; height: 30px; border-radius: 4px;\
            background: transparent; color: var(--theme-text-primary, #fff);\
        }\
        .hxd-spotify-play-main:hover { background: var(--theme-bg-hover, #333); }\
        .hxd-spotify-ctrl-btn {\
            background: transparent; border: none; color: var(--theme-text-muted, #888); cursor: pointer;\
            padding: 4px; display: flex; align-items: center; justify-content: center;\
            border-radius: 4px;\
        }\
        .hxd-spotify-ctrl-btn:hover { color: var(--theme-text-primary, #fff); background: var(--theme-bg-hover, #333); }\
        .hxd-spotify-dd-item {\
            display: block; width: calc(100% - 8px); margin: 2px 4px 0; box-sizing: border-box;\
            padding: 6px 10px; border: none; border-radius: 4px; background: transparent;\
            text-align: left; font-size: 11px; font-weight: 500; color: var(--theme-text-secondary, #888);\
            cursor: pointer; font-family: inherit;\
        }\
        .hxd-spotify-dd-item:hover { background: var(--theme-bg-hover, #333); color: var(--theme-text-primary, #fff); }\
        #hxd-spotify-idle-msg { font-size: 10px; line-height: 1.4; color: var(--theme-text-muted, #666); text-align: center; padding: 2px 2px 0; }\
        #hxd-spotify-loading { margin: 0; color: var(--theme-text-secondary, #888); font-size: 11px; }\
        #hxd-spotify-err { font-size: 10px; color: #f87171; text-align: center; margin: 4px 8px 2px; line-height: 1.35; }\
    ';
    Injector.waitForElement('body').then(function() {
        // Desabilita tradução automática do Google
        var noTranslate = document.createElement('meta');
        noTranslate.name = 'google';
        noTranslate.content = 'notranslate';
        document.head.appendChild(noTranslate);
        
        // Adiciona classe notranslate no html
        document.documentElement.classList.add('notranslate');
        document.documentElement.setAttribute('translate', 'no');

        // Carrega fonte Space Grotesk na página principal
        var fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
        document.head.appendChild(fontLink);

        var shellUsesNativeFrame = hxdDetectWindowsNativeShell();
        var TITLEBAR_PX = 0;
        var DARK_HEADER_PX = HEADER_BAR_PX;
        var CONTENT_TOP_PX = TITLEBAR_PX + DARK_HEADER_PX + HEADER_GAME_GAP_PX;
        var spotifyPanelTopPx = CONTENT_TOP_PX + 4;
        Injector.injectCSS(
            'header-css',
            buildHeaderCss(TITLEBAR_PX, DARK_HEADER_PX) +
                HXD_SPOTIFY_EXTRA_CSS_TEMPLATE.split('__PANEL_TOP__').join(String(spotifyPanelTopPx))
        );

        // Version badge removed

        // Observer para detectar quando iframes são adicionados e aplicar estilos
        var iframeObserver = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var addedNodes = mutations[i].addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.tagName === 'IFRAME') {
                        var ch = document.getElementById('custom-header');
                        var navVisible = ch && ch.style.display !== 'none';
                        var topPx = navVisible ? CONTENT_TOP_PX : TITLEBAR_PX;
                        var top = topPx + 'px';
                        var height = 'calc(100vh - ' + topPx + 'px)';
                        node.style.cssText =
                            'position: fixed !important; top: ' +
                            top +
                            ' !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: ' +
                            height +
                            ' !important; border: none !important; z-index: 0 !important;';
                        node.addEventListener('load', function() {
                            setTimeout(function() {
                                try {
                                    if (typeof pingGameFramesAppearanceReady === 'function') pingGameFramesAppearanceReady();
                                } catch (eIf) {}
                            }, 0);
                        });
                    }
                }
            }
        });
        iframeObserver.observe(document.body, { childList: true, subtree: true });

        document.documentElement.setAttribute('data-theme', 'dark');

        function normalizeHexColor(value, fallback) {
            value = String(value || '').trim();
            return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
        }

        function hexToRgbCsv(hex, fallbackRgb) {
            hex = normalizeHexColor(hex, '');
            fallbackRgb = fallbackRgb || '20, 20, 20';
            if (!hex || hex.length !== 7) return fallbackRgb;
            try {
                var r = parseInt(hex.slice(1, 3), 16);
                var g = parseInt(hex.slice(3, 5), 16);
                var b = parseInt(hex.slice(5, 7), 16);
                if (isNaN(r) || isNaN(g) || isNaN(b)) return fallbackRgb;
                return r + ', ' + g + ', ' + b;
            } catch (eRgb) {
                return fallbackRgb;
            }
        }

        function hudRgbPatch(colors) {
            if (!colors || typeof colors !== 'object') return colors;
            var out = {};
            for (var k in colors) {
                if (Object.prototype.hasOwnProperty.call(colors, k)) out[k] = colors[k];
            }
            var p = out['--theme-bg-primary'] ? String(out['--theme-bg-primary']).trim() : '';
            out['--theme-bg-primary-rgb'] = hexToRgbCsv(p, '20, 20, 20');
            return out;
        }

        function mixHexColors(colorA, colorB, weight) {
            colorA = normalizeHexColor(colorA, '#000000');
            colorB = normalizeHexColor(colorB, '#ffffff');
            weight = Math.max(0, Math.min(1, Number(weight)));
            function channel(color, index) {
                return parseInt(color.slice(index, index + 2), 16);
            }
            function toHex(value) {
                var hex = Math.round(value).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }
            var r = channel(colorA, 1) * (1 - weight) + channel(colorB, 1) * weight;
            var g = channel(colorA, 3) * (1 - weight) + channel(colorB, 3) * weight;
            var b = channel(colorA, 5) * (1 - weight) + channel(colorB, 5) * weight;
            return '#' + toHex(r) + toHex(g) + toHex(b);
        }

        function buildBackgroundCssValue(value) {
            value = String(value || '').trim();
            if (!value) return 'none';
            return 'url("' + value.replace(/"/g, '\\"') + '")';
        }

        function getSavedCustomThemeBase() {
            try {
                var parsed = JSON.parse(localStorage.getItem('haxball-custom-theme-base') || '{}');
                return {
                    bgPrimary: parsed.bgPrimary || '#0f1117',
                    bgSecondary: parsed.bgSecondary || '#161b24',
                    bgTertiary: parsed.bgTertiary || '#1f2937',
                    border: parsed.border || '#334155',
                    textPrimary: parsed.textPrimary || '#f8fafc',
                    textSecondary: parsed.textSecondary || '#94a3b8',
                    backgroundImage: ''
                };
            } catch (e) {
                return {
                    bgPrimary: '#0f1117',
                    bgSecondary: '#161b24',
                    bgTertiary: '#1f2937',
                    border: '#334155',
                    textPrimary: '#f8fafc',
                    textSecondary: '#94a3b8',
                    backgroundImage: ''
                };
            }
        }

        function getShellAppWallpaper() {
            try {
                var w = localStorage.getItem('haxball-app-wallpaper');
                if (w) return String(w);
                var parsed = JSON.parse(localStorage.getItem('haxball-custom-theme-base') || '{}');
                return (parsed && parsed.backgroundImage) ? String(parsed.backgroundImage) : '';
            } catch (e) {
                return '';
            }
        }

        function buildCustomThemeColors(base) {
            base = getSavedCustomThemeBase();
            var prim = normalizeHexColor(base.bgPrimary, '#0f1117');
            return {
                '--theme-bg-primary': prim,
                '--theme-bg-secondary': normalizeHexColor(base.bgSecondary, '#161b24'),
                '--theme-bg-tertiary': normalizeHexColor(base.bgTertiary, '#1f2937'),
                '--theme-bg-primary-rgb': hexToRgbCsv(prim, '15, 17, 23'),
                '--theme-bg-hover': mixHexColors(base.bgTertiary, '#ffffff', 0.08),
                '--theme-bg-selected': mixHexColors(base.bgSecondary, '#ffffff', 0.05),
                '--theme-border': normalizeHexColor(base.border, '#334155'),
                '--theme-border-light': mixHexColors(base.border, '#ffffff', 0.18),
                '--theme-text-primary': normalizeHexColor(base.textPrimary, '#f8fafc'),
                '--theme-text-secondary': normalizeHexColor(base.textSecondary, '#94a3b8'),
                '--theme-text-muted': mixHexColors(base.textSecondary, base.bgPrimary, 0.35),
                '--theme-tooltip-bg': mixHexColors(base.bgSecondary, '#000000', 0.08),
                '--theme-tooltip-border': mixHexColors(base.border, '#ffffff', 0.12),
                '--theme-app-background-image': buildBackgroundCssValue(getShellAppWallpaper())
            };
        }

        var themeColors = {
            default: null,
            dark: { '--theme-bg-primary': '#141414', '--theme-bg-secondary': '#1a1a1a', '--theme-bg-tertiary': '#272727', '--theme-bg-hover': '#333', '--theme-bg-selected': '#222', '--theme-border': '#232323', '--theme-border-light': '#333', '--theme-text-primary': '#fff', '--theme-text-secondary': '#888', '--theme-text-muted': '#666', '--theme-tooltip-bg': '#222', '--theme-tooltip-border': '#333' },
            light: { '--theme-bg-primary': '#f5f5f5', '--theme-bg-secondary': '#ffffff', '--theme-bg-tertiary': '#e8e8e8', '--theme-bg-hover': '#ddd', '--theme-bg-selected': '#d0d0d0', '--theme-border': '#ccc', '--theme-border-light': '#ddd', '--theme-text-primary': '#1a1a1a', '--theme-text-secondary': '#666', '--theme-text-muted': '#999', '--theme-tooltip-bg': '#fff', '--theme-tooltip-border': '#ddd' },
            onix: { '--theme-bg-primary': '#000000', '--theme-bg-secondary': '#000000', '--theme-bg-tertiary': '#0a0a0a', '--theme-bg-hover': '#111111', '--theme-bg-selected': '#0d0d0d', '--theme-border': '#1a1a1a', '--theme-border-light': '#222222', '--theme-text-primary': '#ffffff', '--theme-text-secondary': '#888888', '--theme-text-muted': '#555555', '--theme-tooltip-bg': '#0a0a0a', '--theme-tooltip-border': '#1a1a1a' },
            graphite: { '--theme-bg-primary': '#111317', '--theme-bg-secondary': '#171a1f', '--theme-bg-tertiary': '#22262d', '--theme-bg-hover': '#2b313a', '--theme-bg-selected': '#20242b', '--theme-border': '#2a3038', '--theme-border-light': '#39414d', '--theme-text-primary': '#f3f4f6', '--theme-text-secondary': '#9ca3af', '--theme-text-muted': '#6b7280', '--theme-tooltip-bg': '#1c2128', '--theme-tooltip-border': '#323944' },
            nord: { '--theme-bg-primary': '#2b303b', '--theme-bg-secondary': '#323845', '--theme-bg-tertiary': '#3b4252', '--theme-bg-hover': '#434c5e', '--theme-bg-selected': '#394150', '--theme-border': '#4c566a', '--theme-border-light': '#5e6a81', '--theme-text-primary': '#eceff4', '--theme-text-secondary': '#c0c8d6', '--theme-text-muted': '#8b95a7', '--theme-tooltip-bg': '#3b4252', '--theme-tooltip-border': '#5e6a81' },
            emerald: { '--theme-bg-primary': '#061411', '--theme-bg-secondary': '#0a1c18', '--theme-bg-tertiary': '#103129', '--theme-bg-hover': '#144236', '--theme-bg-selected': '#0f2a23', '--theme-border': '#1c4d41', '--theme-border-light': '#24685a', '--theme-text-primary': '#ecfdf5', '--theme-text-secondary': '#a7f3d0', '--theme-text-muted': '#6ee7b7', '--theme-tooltip-bg': '#0d241f', '--theme-tooltip-border': '#24685a' },
            rose: { '--theme-bg-primary': '#160b12', '--theme-bg-secondary': '#1f1019', '--theme-bg-tertiary': '#311726', '--theme-bg-hover': '#432035', '--theme-bg-selected': '#26131e', '--theme-border': '#5a2744', '--theme-border-light': '#7b345d', '--theme-text-primary': '#fff1f7', '--theme-text-secondary': '#f9a8d4', '--theme-text-muted': '#f472b6', '--theme-tooltip-bg': '#28131f', '--theme-tooltip-border': '#7b345d' },
            ocean: { '--theme-bg-primary': '#07131d', '--theme-bg-secondary': '#0b1b29', '--theme-bg-tertiary': '#123149', '--theme-bg-hover': '#18425f', '--theme-bg-selected': '#102536', '--theme-border': '#1d4d6e', '--theme-border-light': '#2a6a96', '--theme-text-primary': '#eff6ff', '--theme-text-secondary': '#93c5fd', '--theme-text-muted': '#60a5fa', '--theme-tooltip-bg': '#102233', '--theme-tooltip-border': '#2a6a96' },
            sunset: { '--theme-bg-primary': '#1b1010', '--theme-bg-secondary': '#241414', '--theme-bg-tertiary': '#3a2020', '--theme-bg-hover': '#4b2a2a', '--theme-bg-selected': '#2e1a1a', '--theme-border': '#6b3528', '--theme-border-light': '#9a4a30', '--theme-text-primary': '#fff7ed', '--theme-text-secondary': '#fdba74', '--theme-text-muted': '#fb923c', '--theme-tooltip-bg': '#2b1717', '--theme-tooltip-border': '#9a4a30' },
            lavender: { '--theme-bg-primary': '#151222', '--theme-bg-secondary': '#1b162b', '--theme-bg-tertiary': '#2a2340', '--theme-bg-hover': '#372d54', '--theme-bg-selected': '#221c35', '--theme-border': '#56427e', '--theme-border-light': '#7258a8', '--theme-text-primary': '#f5f3ff', '--theme-text-secondary': '#c4b5fd', '--theme-text-muted': '#a78bfa', '--theme-tooltip-bg': '#241d38', '--theme-tooltip-border': '#7258a8' },
            cyber: { '--theme-bg-primary': '#080d12', '--theme-bg-secondary': '#0d141b', '--theme-bg-tertiary': '#14212b', '--theme-bg-hover': '#1b2d3a', '--theme-bg-selected': '#101a22', '--theme-border': '#1f4b63', '--theme-border-light': '#2d6f8f', '--theme-text-primary': '#ecfeff', '--theme-text-secondary': '#67e8f9', '--theme-text-muted': '#22d3ee', '--theme-tooltip-bg': '#101a22', '--theme-tooltip-border': '#2d6f8f' },
            coffee: { '--theme-bg-primary': '#16110d', '--theme-bg-secondary': '#1f1712', '--theme-bg-tertiary': '#31231c', '--theme-bg-hover': '#433028', '--theme-bg-selected': '#271c16', '--theme-border': '#5b4335', '--theme-border-light': '#7a5a46', '--theme-text-primary': '#faf5ef', '--theme-text-secondary': '#d6b89b', '--theme-text-muted': '#b08968', '--theme-tooltip-bg': '#241a15', '--theme-tooltip-border': '#7a5a46' }
        };
        themeColors.custom = buildCustomThemeColors();

        var allThemeVars = ['--theme-bg-primary', '--theme-bg-secondary', '--theme-bg-tertiary', '--theme-bg-primary-rgb', '--theme-bg-hover', '--theme-bg-selected', '--theme-border', '--theme-border-light', '--theme-text-primary', '--theme-text-secondary', '--theme-text-muted', '--theme-tooltip-bg', '--theme-tooltip-border', '--theme-app-background-image'];

        /** Payload del último load/save para rehidratar el iframe (origen distinto sin electronAPI). */
        var shellAppearanceDiskCache = null;

        function applyThemeToMainFrame(theme, incomingColors) {
            var root = document.documentElement;
            var i;
            for (i = 0; i < allThemeVars.length; i++) {
                root.style.removeProperty(allThemeVars[i]);
            }
            if (theme === 'custom') {
                themeColors.custom = buildCustomThemeColors();
            }
            var rawColors =
                incomingColors && typeof incomingColors === 'object'
                    ? incomingColors
                    : themeColors[theme] || themeColors.dark;
            var colors = hudRgbPatch(rawColors);
            if (theme !== 'default' && colors) {
                for (var k in colors) {
                    root.style.setProperty(k, colors[k]);
                }
            }
            // El iframe del juego pinta el wallpaper cuando corresponde. Pintarlo también en el
            // frame principal agrega otra capa full-screen detrás del iframe y empeora el lag.
            root.removeAttribute('data-app-bg-image');
            root.style.removeProperty('--theme-app-background-image');
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
        }

        function pingGameFramesAppearanceReady() {
            var list = document.querySelectorAll(
                'iframe[src*="game.html"], iframe[src*="html5.haxball"], iframe[src*="haxball.com"]'
            );
            for (var i = 0; i < list.length; i++) {
                try {
                    var w = list[i].contentWindow;
                    if (!w) continue;
                    if (shellAppearanceDiskCache && typeof shellAppearanceDiskCache === 'object') {
                        w.postMessage({ type: 'hxd-appearance-disk-bootstrap', payload: shellAppearanceDiskCache }, '*');
                    }
                    w.postMessage({ type: 'hxd-shell-appearance-ready' }, '*');
                } catch (ePing) {}
            }
        }

        function bootShellAppearance(data) {
            if (data && typeof data === 'object') {
                shellAppearanceDiskCache = data;
                try {
                    if (data.theme) localStorage.setItem('haxball-theme', String(data.theme));
                    if (Object.prototype.hasOwnProperty.call(data, 'customThemeBase') && data.customThemeBase && typeof data.customThemeBase === 'object') {
                        var o = Object.assign({}, data.customThemeBase);
                        delete o.backgroundImage;
                        localStorage.setItem('haxball-custom-theme-base', JSON.stringify(o));
                    }
                    if (Object.prototype.hasOwnProperty.call(data, 'wallpaper')) {
                        var ww = data.wallpaper == null ? '' : String(data.wallpaper);
                        if (ww.trim()) localStorage.setItem('haxball-app-wallpaper', ww);
                        else localStorage.removeItem('haxball-app-wallpaper');
                    }
                } catch (err) {}
            } else {
                shellAppearanceDiskCache = null;
            }
            themeColors.custom = buildCustomThemeColors();
            applyThemeToMainFrame(localStorage.getItem('haxball-theme') || 'dark');
            pingGameFramesAppearanceReady();
            setTimeout(pingGameFramesAppearanceReady, 50);
            setTimeout(pingGameFramesAppearanceReady, 400);
        }

        if (window.electronAPI && typeof window.electronAPI.loadAppearance === 'function') {
            window.electronAPI.loadAppearance().then(bootShellAppearance).catch(function() {
                shellAppearanceDiskCache = null;
                themeColors.custom = buildCustomThemeColors();
                applyThemeToMainFrame(localStorage.getItem('haxball-theme') || 'dark');
                pingGameFramesAppearanceReady();
                setTimeout(pingGameFramesAppearanceReady, 50);
                setTimeout(pingGameFramesAppearanceReady, 400);
            });
        } else {
            shellAppearanceDiskCache = null;
            themeColors.custom = buildCustomThemeColors();
            applyThemeToMainFrame(localStorage.getItem('haxball-theme') || 'dark');
            pingGameFramesAppearanceReady();
            setTimeout(pingGameFramesAppearanceReady, 50);
            setTimeout(pingGameFramesAppearanceReady, 400);
        }

        // Escuta mudanças de tema do iframe
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'themeChanged') {
                try {
                    if (e.data.theme) localStorage.setItem('haxball-theme', String(e.data.theme));
                } catch (err) {}
                applyThemeToMainFrame(e.data.theme, e.data.colors);
                try {
                    if (e.data.theme) {
                        var ct = JSON.parse(localStorage.getItem('haxball-custom-theme-base') || '{}');
                        shellAppearanceDiskCache = {
                            version: 1,
                            theme: e.data.theme,
                            customThemeBase: ct || {},
                            wallpaper: localStorage.getItem('haxball-app-wallpaper') || ''
                        };
                    }
                } catch (eUpd) {}
            }
            if (e.data && e.data.type === 'hxd-appearance-sync-parent-ls' && e.data.payload) {
                var p = e.data.payload;
                shellAppearanceDiskCache = p;
                try {
                    if (window.electronAPI && typeof window.electronAPI.saveAppearance === 'function') {
                        window.electronAPI.saveAppearance(p).catch(function() {});
                    }
                } catch (errSave) {}
                try {
                    if (p.theme) localStorage.setItem('haxball-theme', String(p.theme));
                    if (p.customThemeBase && typeof p.customThemeBase === 'object') {
                        var o2 = Object.assign({}, p.customThemeBase);
                        delete o2.backgroundImage;
                        localStorage.setItem('haxball-custom-theme-base', JSON.stringify(o2));
                    }
                    if (Object.prototype.hasOwnProperty.call(p, 'wallpaper')) {
                        if (p.wallpaper) localStorage.setItem('haxball-app-wallpaper', String(p.wallpaper));
                        else localStorage.removeItem('haxball-app-wallpaper');
                    }
                } catch (err2) {}
                themeColors.custom = buildCustomThemeColors();
                applyThemeToMainFrame(localStorage.getItem('haxball-theme') || 'dark');
                pingGameFramesAppearanceReady();
            }
            // Version visibility removed
        });

        // Escuta mudanças no localStorage (quando tema muda no iframe)
        window.addEventListener('storage', function(e) {
            if (e.key === 'haxball-theme' && e.newValue) {
                applyThemeToMainFrame(e.newValue);
            }
            if (e.key === 'haxball-custom-theme-base' || e.key === 'haxball-app-wallpaper') {
                applyThemeToMainFrame(localStorage.getItem('haxball-theme') || 'dark');
            }
        });

        var oldHeader = document.querySelector('.header');
        if (oldHeader) oldHeader.style.display = 'none';

        if (document.getElementById('custom-header')) return;

        var header = document.createElement('div');
        header.id = 'custom-header';
        header.innerHTML = '\
            <div class="header-left">' + LOGO_IMG + '</div>\
            <div class="header-center">\
                <div class="room-link-bar">\
                    <input type="text" id="room-link-input" data-translate-placeholder="Cole o link da sala aqui..." />\
                    <button id="room-link-btn">\
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>\
                    </button>\
                </div>\
            </div>\
            <div class="header-right">\
                <button id="lang-btn" title="Idioma">\
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>\
                </button>\
                <button id="discord-btn" title="Discord">\
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>\
                </button>\
                <button type="button" id="ghost-mode-btn" data-translate-title="Modo Anônimo" aria-pressed="false" title="">\
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>\
                </button>\
                <div id="hxd-spotify-header-slot" class="hxd-spotify-header-slot">\
                <button type="button" id="spotify-header-btn" data-translate-title="Spotify" title="Spotify" style="display:flex!important;align-items:center;justify-content:center;min-width:28px;min-height:28px;padding:4px;background:transparent;border:none;color:#1db954;cursor:pointer;visibility:visible!important;opacity:1!important;flex-shrink:0;">' +
            HXD_SPOTIFYToolbar_SVG +
            '</button>\
                </div>\
                <button type="button" id="hxd-toggle-chrome-btn" data-translate-title="Ocultar barra de menú" aria-label="Toggle menu bar">\
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>\
                </button>\
            </div>\
        ';
        hxdEnsureSpotifyToolbarButton(header);
        document.body.insertBefore(header, document.body.firstChild);

        var headerSpacer = document.createElement('div');
        headerSpacer.id = 'custom-header-spacer';
        headerSpacer.setAttribute('aria-hidden', 'true');
        header.parentNode.insertBefore(headerSpacer, header.nextSibling);

        var showBtn = document.createElement('button');
        showBtn.id = 'show-header-btn';
        showBtn.type = 'button';
        showBtn.setAttribute('data-translate-title', 'Mostrar barra de menú');
        showBtn.setAttribute('aria-label', 'Mostrar barra de menú');
        showBtn.title = 'Mostrar barra de menú';
        showBtn.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
        document.body.appendChild(showBtn);

        setupHeaderEvents(header, showBtn, headerSpacer, TITLEBAR_PX, CONTENT_TOP_PX);
        
        // Aplica traduções nos elementos do header
        applyHeaderTranslations();
        
        Injector.log('Header created');
    }).catch(function(e) {
        Injector.log('Header error: ' + e.message);
    });

    function applyHeaderTranslations() {
        // Traduções locais para o main frame (translate.js roda só no game frame)
        var lang = localStorage.getItem('haxball_language') || 'es';
        var translations = {
            'Cole o link da sala aqui...': { pt: 'Cole o link da sala aqui...', es: 'Pega el enlace de la sala aquí...', en: 'Paste the room link here...' },
            'Ocultar barra de menú': {
                pt: "Ocultar barra de menu (atalho: tecla ')",
                es: "Ocultar barra de menú oscura (atajo: tecla ')",
                en: "Hide dark menu bar (shortcut: ' key)"
            },
            'Mostrar barra de menú': {
                pt: 'Mostrar barra de menu',
                es: 'Mostrar barra de menú',
                en: 'Show menu bar'
            },
            'Minimizar': { pt: 'Minimizar', es: 'Minimizar', en: 'Minimize' },
            'Maximizar': { pt: 'Maximizar', es: 'Maximizar', en: 'Maximize' },
            'Restaurar ventana': { pt: 'Restaurar janela', es: 'Restaurar ventana', en: 'Restore window' },
            'Cerrar ventana': { pt: 'Fechar janela', es: 'Cerrar ventana', en: 'Close window' },
            'Modo Anônimo': { pt: 'Modo Anônimo', es: 'Modo Anónimo', en: 'Anonymous mode' }
        };
        
        function t(key) {
            var entry = translations[key];
            if (!entry) return key;
            return entry[lang] || entry['es'] || entry['pt'] || key;
        }
        
        var input = document.getElementById('room-link-input');
        if (input) {
            var placeholderKey = input.getAttribute('data-translate-placeholder');
            if (placeholderKey) input.placeholder = t(placeholderKey);
        }
        
        var chromeToggleTr = document.getElementById('hxd-toggle-chrome-btn');
        if (chromeToggleTr) {
            var tkChrome = chromeToggleTr.getAttribute('data-translate-title');
            if (tkChrome) chromeToggleTr.title = t(tkChrome);
        }

        var showHeaderTr = document.getElementById('show-header-btn');
        if (showHeaderTr) {
            var tkShow = showHeaderTr.getAttribute('data-translate-title');
            if (tkShow) {
                var showLbl = t(tkShow);
                showHeaderTr.title = showLbl;
                showHeaderTr.setAttribute('aria-label', showLbl);
            }
        }

        syncGhostModeButton();
    }

    function syncGhostModeButton() {
        var ghostBtn = document.getElementById('ghost-mode-btn');
        if (!ghostBtn) return;
        var lang = localStorage.getItem('haxball_language') || 'es';
        var translations = {
            'Modo Anônimo': { pt: 'Modo Anônimo', es: 'Modo Anónimo', en: 'Anonymous mode' }
        };
        function t(key) {
            var entry = translations[key];
            if (!entry) return key;
            return entry[lang] || entry['es'] || entry['pt'] || key;
        }
        var on = window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode();
        ghostBtn.classList.toggle('active', on);
        ghostBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        var titleKey = ghostBtn.getAttribute('data-translate-title');
        if (titleKey) ghostBtn.title = t(titleKey);
    }

    function setupHeaderEvents(header, showBtn, headerSpacer, titlebarPx, contentTopPx) {
        function hxdShellLocalOrigin() {
            try {
                if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                    return String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/+$/, '');
                }
            } catch (eLoc) {}
            return 'http://127.0.0.1:5483';
        }
        var LOCAL_HEADER_API = hxdShellLocalOrigin();

        var hxdSpotifyPanelEl = null;
        var hxdSpotifyBtnEl = null;
        var hxdSpotifySlotEl = null;
        /** Intervalo GET playback (navbar + panel); sigue activo con Client ID aunque el panel esté cerrado. */
        var hxdSpotifyPollTimer = null;
        var hxdSpotifyUiTimer = null;
        var hxdSpotifyLastState = { progress_ms: 0, duration_ms: 0, is_playing: false, fetchedAt: 0 };

        var codeRegex = /^[a-zA-Z0-9_-]{6,64}$/;

        function extractRoomCode(rawValue) {
            var link = String(rawValue || '').trim();
            if (!link) return '';

            if (codeRegex.test(link)) {
                return link;
            }

            var normalized = link;
            if (!/^https?:\/\//i.test(normalized)) {
                normalized = 'https://' + normalized;
            }

            try {
                var parsed = new URL(normalized);
                var host = String(parsed.hostname || '').toLowerCase();
                var isHaxballHost = host === 'haxball.com' || host === 'www.haxball.com' || host === 'html5.haxball.com';
                var path = String(parsed.pathname || '').toLowerCase();
                var paramCode = parsed.searchParams.get('c');

                if (isHaxballHost && path === '/play' && paramCode && codeRegex.test(paramCode)) {
                    return paramCode;
                }
            } catch (e) {}

            var looseMatch = link.match(/[?&]c=([a-zA-Z0-9_-]{6,64})/i);
            if (looseMatch && looseMatch[1]) {
                return looseMatch[1];
            }

            return '';
        }

        function navigateToRoom(roomCode) {
            if (!roomCode) return;
            var targetUrl = 'https://www.haxball.com/play?c=' + encodeURIComponent(roomCode);

            try {
                if (window.top && window.top.location) {
                    window.top.location.href = targetUrl;
                    return;
                }
            } catch (e) {}

            try {
                window.location.assign(targetUrl);
            } catch (e) {
                window.location.href = targetUrl;
            }
        }

        function goToRoom() {
            var input = document.getElementById('room-link-input');
            if (!input) return;
            var link = String(input.value || '')
                .trim()
                .replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (!link) return;

            var roomCode = extractRoomCode(link);
            if (roomCode) {
                navigateToRoom(roomCode);
            }
        }

        function updateLayout(navbarVisible) {
            var topPx = navbarVisible ? contentTopPx : titlebarPx;
            var top = topPx + 'px';
            var height = 'calc(100vh - ' + topPx + 'px)';
            var padding = topPx + 'px';

            var iframes = document.querySelectorAll('iframe[src*="game.html"], iframe[src*="html5.haxball"]');
            for (var i = 0; i < iframes.length; i++) {
                iframes[i].style.cssText =
                    'position: fixed !important; top: ' +
                    top +
                    ' !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: ' +
                    height +
                    ' !important; border: none !important; z-index: 0 !important;';
            }

            var viewWrapper = document.querySelector('.view-wrapper');
            if (viewWrapper) viewWrapper.style.paddingTop = padding;

            var gameView = document.querySelector('.game-view');
            if (gameView) gameView.style.paddingTop = padding;

            if (showBtn) {
                if (navbarVisible) {
                    showBtn.style.top = '';
                } else {
                    showBtn.style.top = titlebarPx + 8 + 'px';
                }
            }
        }

        function hideHeader() {
            header.style.display = 'none';
            if (headerSpacer) headerSpacer.style.display = 'none';
            showBtn.style.display = 'flex';
            try {
                document.body.appendChild(showBtn);
            } catch (eSb) {}
            updateLayout(false);
        }

        function showHeaderFn() {
            try {
                header.style.removeProperty('display');
            } catch (eD) {
                header.style.display = '';
            }
            if (headerSpacer) {
                try {
                    headerSpacer.style.removeProperty('display');
                } catch (eS) {
                    headerSpacer.style.display = '';
                }
            }
            showBtn.style.display = 'none';
            updateLayout(true);
        }

        document.getElementById('room-link-btn').addEventListener('click', goToRoom);
        document.getElementById('room-link-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') goToRoom();
        });

        window.__hxdJoinRoomViaToolbar = function(rawLink) {
            var inp = document.getElementById('room-link-input');
            if (!inp) return false;
            inp.value = String(rawLink == null ? '' : rawLink).trim();
            goToRoom();
            return true;
        };

        document.getElementById('discord-btn').addEventListener('click', function() {
            window.__hxdOpenExternalUrl('https://discord.gg/haxzero');
        });

        var ghostBtn = document.getElementById('ghost-mode-btn');
        if (ghostBtn) {
            function toggleGhostMode() {
                var cur = window.__hxdIsAnonymousMode && window.__hxdIsAnonymousMode();
                var next = !cur;
                if (window.__hxdSetAnonymousMode) {
                    window.__hxdSetAnonymousMode(next);
                }
                if (window.__hxdPostAnonymousToGameFrame) {
                    window.__hxdPostAnonymousToGameFrame(next);
                }
                window.setTimeout(function() {
                    try {
                        window.location.reload();
                    } catch (eRl) {}
                }, 150);
            }
            ghostBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleGhostMode();
            });
            syncGhostModeButton();
        }

        hxdSpotifySlotEl = document.getElementById('hxd-spotify-header-slot');
        hxdSpotifyBtnEl = document.getElementById('spotify-header-btn');
        function hxdLocalApiOrigin() {
            var doc = document;
            try {
                if (window.top && window.top !== window) {
                    doc = window.top.document;
                }
            } catch (eTop) {
                doc = document;
            }
            try {
                var meta = doc.querySelector('meta[name="hxd-local-api"]');
                if (meta && meta.getAttribute('content')) {
                    return String(meta.getAttribute('content')).replace(/\/+$/, '');
                }
            } catch (eM) {}
            try {
                if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                    return String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/+$/, '');
                }
            } catch (eH) {}
            return 'http://127.0.0.1:5483';
        }
        var hxdSpotifyBridge = (function() {
            if (window.electronAPI && typeof window.electronAPI.spotifyGetPlayback === 'function') {
                return {
                    getConfig: function() {
                        return window.electronAPI.spotifyGetConfig();
                    },
                    startAuth: function() {
                        return window.electronAPI.spotifyStartAuth();
                    },
                    logout: function() {
                        return window.electronAPI.spotifyLogout();
                    },
                    openWebPlayer: function() {
                        return window.electronAPI.spotifyOpenWebPlayer();
                    },
                    getPlayback: function() {
                        return window.electronAPI.spotifyGetPlayback();
                    },
                    control: function(p) {
                        return window.electronAPI.spotifyControl(p);
                    },
                    onAuthChanged: function(cb) {
                        if (typeof window.electronAPI.onSpotifyAuthChanged === 'function') {
                            return window.electronAPI.onSpotifyAuthChanged(cb);
                        }
                        return function() {};
                    }
                };
            }
            var base = hxdLocalApiOrigin();
            var hxdElectronShell =
                typeof navigator !== 'undefined' && /electron/i.test(String(navigator.userAgent || ''));

            function hxdSpotifyPostMsgInvoke(op, payload) {
                return new Promise(function(resolve) {
                    var rid = 'hxdsp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
                    var finished = false;
                    function done(val) {
                        if (finished) return;
                        finished = true;
                        clearTimeout(tmo);
                        try {
                            window.removeEventListener('message', onReply);
                        } catch (eRm) {}
                        resolve(val);
                    }
                    function onReply(ev) {
                        var d = ev.data;
                        if (!d || d.__hxd !== 1 || d.ns !== 'spotify-ipc' || d.rid !== rid || d.res !== true) return;
                        if (d.error) {
                            done({
                                ok: false,
                                error: String(d.error),
                                hasClientId: true,
                                loggedIn: false
                            });
                        } else {
                            done(
                                d.result != null
                                    ? d.result
                                    : { ok: false, error: 'empty_ipc', hasClientId: true, loggedIn: false }
                            );
                        }
                    }
                    var tmo = setTimeout(function() {
                        done({
                            ok: false,
                            error: 'spotify_postmsg_timeout',
                            hasClientId: true,
                            loggedIn: false
                        });
                    }, 28000);
                    window.addEventListener('message', onReply);
                    try {
                        window.postMessage(
                            {
                                __hxd: 1,
                                ns: 'spotify-ipc',
                                rid: rid,
                                op: op,
                                payload: payload == null ? null : payload
                            },
                            '*'
                        );
                    } catch (eP) {
                        done({
                            ok: false,
                            error: String(eP && eP.message ? eP.message : eP),
                            hasClientId: true,
                            loggedIn: false
                        });
                    }
                });
            }

            function hxdSpotifyRacePostThenFetch(invokePromise, fetchFn) {
                if (!hxdElectronShell) return fetchFn();
                return Promise.race([
                    invokePromise,
                    new Promise(function(resolve) {
                        setTimeout(function() {
                            resolve({ __hxdSkip: true });
                        }, 4500);
                    })
                ]).then(function(v) {
                    if (v && v.__hxdSkip) return fetchFn();
                    return v;
                });
            }

            function hxdSpotifyFetchPlaybackResponse(r) {
                if (!r || !r.ok) {
                    return Promise.resolve({
                        ok: false,
                        error: 'http_' + (r && r.status != null ? r.status : 0),
                        loggedIn: true,
                        hasClientId: true
                    });
                }
                return r.text().then(function(txt) {
                    try {
                        return txt
                            ? JSON.parse(txt)
                            : { ok: false, error: 'empty_body', loggedIn: true, hasClientId: true };
                    } catch (eJ) {
                        return { ok: false, error: 'invalid_json', loggedIn: true, hasClientId: true };
                    }
                });
            }

            return {
                getConfig: function() {
                    return hxdSpotifyRacePostThenFetch(hxdSpotifyPostMsgInvoke('getConfig', null), function() {
                        return fetch(base + '/spotify/config', { credentials: 'omit' }).then(function(r) {
                            return r.json();
                        });
                    });
                },
                startAuth: function() {
                    return hxdSpotifyRacePostThenFetch(hxdSpotifyPostMsgInvoke('startAuth', null), function() {
                        return fetch(base + '/spotify/start-auth', {
                            method: 'POST',
                            credentials: 'omit'
                        }).then(function(r) {
                            return r.json();
                        });
                    });
                },
                logout: function() {
                    return hxdSpotifyRacePostThenFetch(hxdSpotifyPostMsgInvoke('logout', null), function() {
                        return fetch(base + '/spotify/logout', {
                            method: 'POST',
                            credentials: 'omit'
                        }).then(function(r) {
                            return r.json();
                        });
                    });
                },
                openWebPlayer: function() {
                    return hxdSpotifyPostMsgInvoke('openWebPlayer', null);
                },
                getPlayback: function() {
                    /** HTTP al bridge local; si el fetch cuelga (Electron), fallback a IPC del preload. */
                    var viaFetch = fetch(base + '/spotify/playback', { credentials: 'omit' }).then(
                        hxdSpotifyFetchPlaybackResponse
                    );
                    if (!hxdElectronShell) return viaFetch;
                    return Promise.race([
                        viaFetch,
                        new Promise(function(resolve) {
                            setTimeout(function() {
                                resolve({ __hxdPlaybackFetchSlow: true });
                            }, 6500);
                        })
                    ]).then(function(v) {
                        if (v && v.__hxdPlaybackFetchSlow) {
                            return hxdSpotifyPostMsgInvoke('getPlayback', null);
                        }
                        return v;
                    });
                },
                control: function(p) {
                    return hxdSpotifyRacePostThenFetch(hxdSpotifyPostMsgInvoke('control', p), function() {
                        return fetch(base + '/spotify/control', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'omit',
                            body: JSON.stringify(p || {})
                        }).then(function(r) {
                            return r.json();
                        });
                    });
                },
                onAuthChanged: function(cb) {
                    if (!hxdElectronShell) return function() {};
                    function onMsg(ev) {
                        var d = ev.data;
                        if (!d || d.__hxd !== 1 || d.ns !== 'spotify-ipc' || d.ev !== 'auth-changed') return;
                        try {
                            cb(d.payload);
                        } catch (eC) {}
                    }
                    window.addEventListener('message', onMsg);
                    return function() {
                        try {
                            window.removeEventListener('message', onMsg);
                        } catch (eR) {}
                    };
                }
            };
        })();
        if (hxdSpotifyBtnEl) {
            var HXD_SPOTIFY_ANCHOR_LS = 'hxd_spotify_panel_anchor';
            function hxdGetSpotifyPanelAnchor() {
                try {
                    var vA = localStorage.getItem(HXD_SPOTIFY_ANCHOR_LS);
                    if (vA === 'tr' || vA === 'tl' || vA === 'br' || vA === 'bl' || vA === 'mr' || vA === 'ml') return vA;
                } catch (eAnch) {}
                return 'tr';
            }
            function hxdApplySpotifyPanelAnchor() {
                if (!hxdSpotifyPanelEl) return;
                var anchList = ['tr', 'tl', 'br', 'bl', 'mr', 'ml'];
                for (var ai = 0; ai < anchList.length; ai++) {
                    hxdSpotifyPanelEl.classList.remove('hxd-spotify-anchor-' + anchList[ai]);
                }
                hxdSpotifyPanelEl.classList.add('hxd-spotify-anchor-' + hxdGetSpotifyPanelAnchor());
            }
            window.addEventListener('hxd-spotify-panel-anchor-changed', hxdApplySpotifyPanelAnchor);
            hxdSpotifyPanelEl = document.createElement('div');
            hxdSpotifyPanelEl.id = 'hxd-spotify-panel';
            hxdSpotifyPanelEl.innerHTML =
                '<div class="hxd-spotify-dd-head">' +
                '<span id="hxd-spotify-head-title">Spotify</span>' +
                '<button type="button" class="hxd-spotify-ctrl-btn" id="hxd-spotify-close" aria-label="Cerrar">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
                '</button></div>' +
                '<div class="hxd-spotify-dd-body">' +
                '<div id="hxd-spotify-no-client" class="hxd-spotify-dd-gutter" style="display:none"></div>' +
                '<div id="hxd-spotify-login-block" class="hxd-spotify-dd-gutter" style="display:none">' +
                '<button type="button" class="hxd-spotify-connect-box" id="hxd-spotify-connect-btn">' +
                '<span class="hxd-spotify-connect-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02z"/></svg></span>' +
                '<span id="hxd-spotify-connect-label">Conectar tu Spotify</span></button>' +
                '<p class="hxd-spotify-login-sub" id="hxd-spotify-login-hint"></p>' +
                '</div>' +
                '<p id="hxd-spotify-loading" class="hxd-spotify-loading hxd-spotify-dd-gutter" style="display:none;text-align:center;padding:8px 6px;font-size:11px;">…</p>' +
                '<div id="hxd-spotify-player-wrap" class="hxd-spotify-player-wrap hxd-spotify-dd-gutter">' +
                '<div class="hxd-spotify-card">' +
                '<div class="hxd-spotify-card-row">' +
                '<img class="hxd-spotify-art-sm" id="hxd-spotify-art" alt="" />' +
                '<div class="hxd-spotify-card-col">' +
                '<div class="hxd-spotify-meta">' +
                '<div class="hxd-spotify-title" id="hxd-spotify-track-title"></div>' +
                '<div class="hxd-spotify-artist" id="hxd-spotify-track-artist"></div>' +
                '</div>' +
                '<div class="hxd-spotify-progress-track">' +
                '<div class="hxd-spotify-progress-wrap" id="hxd-spotify-progress-hit">' +
                '<div class="hxd-spotify-progress-bar" id="hxd-spotify-progress-bar"></div>' +
                '</div></div>' +
                '<div class="hxd-spotify-time-row">' +
                '<span id="hxd-spotify-t-elapsed">0:00</span>' +
                '<span id="hxd-spotify-t-total">0:00</span>' +
                '</div>' +
                '<div class="hxd-spotify-transport">' +
                '<button type="button" class="hxd-spotify-trans-btn hxd-spotify-trans-side" id="hxd-spotify-prev" aria-label="Anterior">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5-6v12z"/></svg></button>' +
                '<button type="button" class="hxd-spotify-trans-btn hxd-spotify-play-main" id="hxd-spotify-play-toggle" aria-label="Play/Pause">' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" id="hxd-spotify-icon-play"><path d="M8 5v14l11-7z"/></svg>' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" id="hxd-spotify-icon-pause" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>' +
                '<button type="button" class="hxd-spotify-trans-btn hxd-spotify-trans-side" id="hxd-spotify-next" aria-label="Siguiente">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2v12zm-11-6l8.5 6V6z"/></svg></button>' +
                '</div>' +
                '</div></div>' +
                '<div id="hxd-spotify-idle-msg" style="display:none"></div>' +
                '</div></div>' +
                '<button type="button" class="hxd-spotify-dd-item" id="hxd-spotify-disconnect-btn"></button>' +
                '<div id="hxd-spotify-err" class="hxd-spotify-dd-gutter" style="display:none"></div>' +
                '</div>';
            document.body.appendChild(hxdSpotifyPanelEl);
            hxdApplySpotifyPanelAnchor();

            function hxdFormatMs(ms) {
                var totalSec = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
                var m = Math.floor(totalSec / 60);
                var s = totalSec % 60;
                return m + ':' + (s < 10 ? '0' : '') + s;
            }

            function hxdStopSpotifyPoll() {
                /* El polling sigue activo para sincronizar el panel al abrirlo. */
            }

            function hxdUpdateSpotifyProgressVisual() {
                var bar = document.getElementById('hxd-spotify-progress-bar');
                var tEl = document.getElementById('hxd-spotify-t-elapsed');
                var tTot = document.getElementById('hxd-spotify-t-total');
                var dur = hxdSpotifyLastState.duration_ms || 0;
                if (!bar) return;
                var base = hxdSpotifyLastState.progress_ms || 0;
                if (dur > 0 && hxdSpotifyLastState.is_playing && hxdSpotifyLastState.fetchedAt) {
                    base = Math.min(dur, base + (Date.now() - hxdSpotifyLastState.fetchedAt));
                }
                var pct = 0;
                if (dur > 0) {
                    pct = Math.min(100, Math.max(0, (base / dur) * 100));
                }
                bar.style.width = dur > 0 ? pct + '%' : '0%';
                if (tEl) tEl.textContent = hxdFormatMs(base);
                if (tTot) tTot.textContent = hxdFormatMs(dur);
            }

            function hxdSetSpotifyPlayerVisible(on) {
                var playerWrap = document.getElementById('hxd-spotify-player-wrap');
                if (!playerWrap) return;
                if (on) playerWrap.classList.add('hxd-spotify-player-wrap--visible');
                else playerWrap.classList.remove('hxd-spotify-player-wrap--visible');
            }

            function hxdSyncNavStripContent(data, lang) {
                /* Navbar: solo icono; el estado detallado está en el panel (#hxd-spotify-panel). */
            }

            function hxdApplySpotifyPlaybackPayload(data) {
                var lang = localStorage.getItem('haxball_language') || 'es';
                var loadEl = document.getElementById('hxd-spotify-loading');
                if (loadEl) loadEl.style.display = 'none';
                var noClient = document.getElementById('hxd-spotify-no-client');
                var loginBlock = document.getElementById('hxd-spotify-login-block');
                var errEl = document.getElementById('hxd-spotify-err');
                var idleMsg = document.getElementById('hxd-spotify-idle-msg');
                if (errEl) {
                    errEl.style.display = 'none';
                    errEl.textContent = '';
                }
                if (!data || data.ok === false) {
                    if (noClient) {
                        noClient.style.display = 'block';
                        if (!data || data.error === 'missing_client_id') {
                            noClient.innerHTML =
                                '<p style="margin:0;line-height:1.45;">Configurá un Client ID de Spotify: variable <code style="font-size:10px;">HXD_SPOTIFY_CLIENT_ID</code> o archivo <code style="font-size:10px;">spotify-client-id.txt</code> en la carpeta de datos de la app. En el panel de Spotify Developers añadí la redirect: <code style="font-size:10px;word-break:break-all;">' +
                                (data && data.redirectUri ? data.redirectUri : 'http://127.0.0.1:5483/spotify-callback') +
                                '</code></p>';
                        } else {
                            noClient.innerHTML = '';
                            var pErr = document.createElement('p');
                            pErr.style.margin = '0';
                            pErr.style.lineHeight = '1.45';
                            pErr.style.whiteSpace = 'pre-line';
                            var codeRaw = data && data.error ? String(data.error) : '';
                            var isTimeoutErr =
                                codeRaw.indexOf('spotify_request_timeout') !== -1 ||
                                codeRaw.indexOf('spotify_postmsg_timeout') !== -1;
                            var devModeMaybe =
                                /invalid[_ ]?grant|not\s+registered|development|user\s+not\s+in|401:\s*invalid/i.test(
                                    codeRaw
                                );
                            var spotifyDevDash =
                                lang === 'en'
                                    ? 'If the Spotify app is in Development mode, add each user under Users and Access, or request Extended Quota / Production so anyone can connect.'
                                    : lang === 'pt'
                                      ? 'Se a app do Spotify está em Development, adicione cada usuário em Users and Access ou peça modo público/cota estendida.'
                                      : 'Si la app de Spotify está en modo Development, agregá cada cuenta en Users and Access o pedí modo público/cuota extendida para que cualquiera pueda conectar.';
                            var friendly =
                                codeRaw === 'session_expired'
                                    ? lang === 'en'
                                        ? 'Session expired. Use “Connect your Spotify” again.'
                                        : lang === 'pt'
                                          ? 'Sessão expirada. Use “Conectar seu Spotify” de novo.'
                                          : 'Sesión expirada. Volvé a usar “Conectar tu Spotify”.'
                                    : codeRaw === 'not_logged_in'
                                      ? lang === 'en'
                                          ? 'Not logged in to Spotify.'
                                          : lang === 'pt'
                                            ? 'Não conectado ao Spotify.'
                                            : 'No iniciaste sesión en Spotify.'
                                      : isTimeoutErr
                                        ? lang === 'en'
                                          ? 'Spotify took too long to respond. Check your connection and open the panel again.'
                                          : lang === 'pt'
                                            ? 'O Spotify demorou demais. Verifique a conexão e abra o painel de novo.'
                                            : 'Spotify tardó demasiado. Revisá tu conexión y volvé a abrir el panel.'
                                        : lang === 'en'
                                          ? 'Could not load Spotify.'
                                          : lang === 'pt'
                                            ? 'Não foi possível carregar o Spotify.'
                                            : 'No se pudo cargar Spotify.';
                            if (devModeMaybe) {
                                friendly = friendly + '\n\n' + spotifyDevDash;
                            }
                            pErr.textContent =
                                friendly +
                                (codeRaw &&
                                !isTimeoutErr &&
                                codeRaw !== 'session_expired' &&
                                codeRaw !== 'not_logged_in'
                                    ? ' (' + codeRaw + ')'
                                    : '');
                            noClient.appendChild(pErr);
                        }
                    }
                    if (loginBlock) loginBlock.style.display = 'none';
                    hxdSetSpotifyPlayerVisible(false);
                    if (hxdSpotifyBtnEl) hxdSpotifyBtnEl.classList.remove('connected');
                    hxdSyncNavStripContent(data, lang);
                    return;
                }
                if (!data.hasClientId) {
                    if (noClient) {
                        noClient.style.display = 'block';
                        noClient.innerHTML =
                            '<p style="margin:0;line-height:1.45;">Configurá un Client ID de Spotify: variable <code style="font-size:10px;">HXD_SPOTIFY_CLIENT_ID</code> o archivo <code style="font-size:10px;">spotify-client-id.txt</code> en la carpeta de datos de la app. En el panel de Spotify Developers añadí la redirect: <code style="font-size:10px;word-break:break-all;">' +
                            (data.redirectUri || 'http://127.0.0.1:5483/spotify-callback') +
                            '</code></p>';
                    }
                    if (loginBlock) loginBlock.style.display = 'none';
                    hxdSetSpotifyPlayerVisible(false);
                    if (hxdSpotifyBtnEl) hxdSpotifyBtnEl.classList.remove('connected');
                    hxdSyncNavStripContent(data, lang);
                    return;
                }
                if (noClient) {
                    noClient.style.display = 'none';
                    noClient.innerHTML = '';
                }
                if (!data.loggedIn) {
                    if (loginBlock) loginBlock.style.display = 'block';
                    hxdSetSpotifyPlayerVisible(false);
                    if (hxdSpotifyBtnEl) hxdSpotifyBtnEl.classList.remove('connected');
                    hxdSyncNavStripContent(data, lang);
                    return;
                }
                if (hxdSpotifyBtnEl) hxdSpotifyBtnEl.classList.add('connected');
                if (loginBlock) loginBlock.style.display = 'none';
                hxdSetSpotifyPlayerVisible(true);

                if (data.premium_hint && errEl) {
                    errEl.style.display = 'block';
                    errEl.textContent = data.message || '';
                }

                var art = document.getElementById('hxd-spotify-art');
                var titleEl = document.getElementById('hxd-spotify-track-title');
                var artistEl = document.getElementById('hxd-spotify-track-artist');
                var iconPlay = document.getElementById('hxd-spotify-icon-play');
                var iconPause = document.getElementById('hxd-spotify-icon-pause');

                var noPb = data.no_active_playback || !data.track;
                var idleCopy =
                    lang === 'en'
                        ? 'Open Spotify on this PC (app or web) and press play — the bar will update here.'
                        : lang === 'pt'
                          ? 'Abra o Spotify neste PC (app ou web) e dê play — a barra atualiza aqui.'
                          : 'Abrí Spotify en esta PC (app o web) y dale play — la barra se actualiza sola.';
                var reauthTail =
                    lang === 'en'
                        ? ' If it still fails: use “Disconnect Spotify” here, then connect again (refreshes permissions).'
                        : lang === 'pt'
                          ? ' Se ainda falhar: use “Desconectar Spotify” aqui e conecte de novo (atualiza permissões).'
                          : ' Si sigue igual: “Desconectar Spotify” acá y volvé a conectar (actualiza permisos).';

                if (idleMsg) {
                    if (noPb && !data.premium_hint) {
                        idleMsg.style.display = 'block';
                        idleMsg.textContent = idleCopy + (data.spotify_reauth_hint ? reauthTail : '');
                    } else {
                        idleMsg.style.display = 'none';
                    }
                }

                if (!noPb && data.track) {
                    if (art) {
                        if (data.track.image_url) {
                            art.src = data.track.image_url;
                            art.style.visibility = 'visible';
                        } else {
                            art.removeAttribute('src');
                            art.style.visibility = 'hidden';
                        }
                    }
                    if (titleEl) titleEl.textContent = data.track.name || '';
                    if (artistEl) artistEl.textContent = (data.track.artists || []).join(', ');
                } else {
                    if (titleEl) {
                        titleEl.textContent =
                            lang === 'en'
                                ? 'Waiting for Spotify…'
                                : lang === 'pt'
                                  ? 'Aguardando Spotify…'
                                  : 'Esperando a Spotify…';
                    }
                    if (artistEl) {
                        artistEl.textContent =
                            lang === 'en'
                                ? 'No active playback on this account'
                                : lang === 'pt'
                                  ? 'Sem reprodução ativa nesta conta'
                                  : 'Sin reproducción activa en esta cuenta';
                    }
                    if (art) {
                        art.removeAttribute('src');
                        art.style.visibility = 'hidden';
                    }
                }

                var dur = data.duration_ms || 0;
                var prog = data.progress_ms || 0;
                hxdSpotifyLastState = {
                    progress_ms: prog,
                    duration_ms: dur,
                    is_playing: !!data.is_playing && !noPb,
                    fetchedAt: Date.now()
                };
                if (iconPlay && iconPause) {
                    if (hxdSpotifyLastState.is_playing) {
                        iconPlay.style.display = 'none';
                        iconPause.style.display = 'block';
                    } else {
                        iconPlay.style.display = 'block';
                        iconPause.style.display = 'none';
                    }
                }
                hxdUpdateSpotifyProgressVisual();
                hxdSyncNavStripContent(data, lang);
            }

            function hxdFetchSpotifyPlayback() {
                hxdSpotifyBridge
                    .getPlayback()
                    .then(hxdApplySpotifyPlaybackPayload)
                    .catch(function() {
                        var loadEl2 = document.getElementById('hxd-spotify-loading');
                        if (loadEl2) loadEl2.style.display = 'none';
                        var errEl = document.getElementById('hxd-spotify-err');
                        var lgE = localStorage.getItem('haxball_language') || 'es';
                        if (errEl) {
                            errEl.style.display = 'block';
                            errEl.textContent =
                                lgE === 'en'
                                    ? 'Could not reach Spotify (network). Retrying…'
                                    : lgE === 'pt'
                                      ? 'Não foi possível falar com o Spotify (rede). Tentando de novo…'
                                      : 'No se pudo contactar a Spotify (red). Reintentando…';
                        }
                    });
            }

            function hxdStartSpotifyPoll() {
                if (!hxdSpotifyPollTimer) {
                    hxdSpotifyPollTimer = setInterval(hxdFetchSpotifyPlayback, 2800);
                }
                if (!hxdSpotifyUiTimer) {
                    hxdSpotifyUiTimer = setInterval(hxdUpdateSpotifyProgressVisual, 380);
                }
                hxdFetchSpotifyPlayback();
            }

            function hxdSpotifyControlErrorLine(r) {
                var lang = localStorage.getItem('haxball_language') || 'es';
                if (!r || typeof r !== 'object') {
                    return lang === 'en'
                        ? 'No response from Spotify control.'
                        : lang === 'pt'
                          ? 'Sem resposta do controle do Spotify.'
                          : 'Sin respuesta al controlar Spotify.';
                }
                var err = r.error != null ? String(r.error) : '';
                var sm = r.spotify_message ? String(r.spotify_message).trim() : '';
                var tail = '';
                if (sm) tail = sm.length <= 220 ? ' — ' + sm : ' — ' + sm.slice(0, 200) + '…';
                if (err === 'premium_required' || err === 'premium_or_device_required') {
                    if (lang === 'en')
                        return 'Spotify could not start remote playback. Open Spotify on this PC, press play once, then try again.' + tail;
                    if (lang === 'pt')
                        return 'O Spotify não conseguiu iniciar a reprodução remota. Abra o Spotify neste PC, dê play uma vez e tente de novo.' + tail;
                    return 'Spotify no pudo iniciar la reproducción remota. Abrí Spotify en esta PC, dale play una vez y volvé a intentar.' + tail;
                }
                if (err === 'no_active_device') {
                    if (lang === 'en')
                        return 'No active Spotify device on this PC. Open Spotify, press play once, then try again.' + tail;
                    if (lang === 'pt')
                        return 'Nenhum dispositivo Spotify ativo neste PC. Abra o Spotify, dê play uma vez e tente de novo.' + tail;
                    return 'No hay dispositivo activo de Spotify en esta PC. Abrí Spotify, dale play una vez y volvé a intentar.' + tail;
                }
                if (err === 'insufficient_scope') {
                    if (lang === 'en')
                        return 'Spotify needs updated permissions: “Disconnect Spotify”, then connect again.' + tail;
                    if (lang === 'pt')
                        return 'O Spotify precisa de permissões novas: “Desconectar Spotify” e conectar de novo.' + tail;
                    return 'Spotify necesita permisos nuevos: “Desconectar Spotify” y volvé a conectar.' + tail;
                }
                if (err === 'session_expired') {
                    if (lang === 'en') return 'Session expired. Connect your Spotify again.';
                    if (lang === 'pt') return 'Sessão expirada. Conecte o Spotify de novo.';
                    return 'Sesión expirada. Volvé a conectar Spotify.';
                }
                if (err === 'playback_denied') {
                    if (lang === 'en')
                        return 'Spotify did not allow this command. Start playback in the Spotify app on this PC, then try again.' + tail;
                    if (lang === 'pt')
                        return 'O Spotify não permitiu o comando. Inicie a reprodução no app neste PC e tente de novo.' + tail;
                    return 'Spotify no permitió el comando. Iniciá la reproducción en la app en esta PC y volvé a intentar.' + tail;
                }
                if (err === 'spotify_error') {
                    var st = r.spotify_status != null ? String(r.spotify_status) : '?';
                    if (lang === 'en') return 'Spotify error (HTTP ' + st + ').' + tail;
                    if (lang === 'pt') return 'Erro do Spotify (HTTP ' + st + ').' + tail;
                    return 'Error de Spotify (HTTP ' + st + ').' + tail;
                }
                if (err === 'no_state') {
                    if (lang === 'en') return 'Could not read playback state. Open Spotify on this PC and try again.';
                    if (lang === 'pt') return 'Não foi possível ler o estado. Abra o Spotify neste PC e tente de novo.';
                    return 'No se pudo leer el estado de reproducción. Abrí Spotify en esta PC y probá de nuevo.';
                }
                if (lang === 'en') return 'Could not control Spotify (' + (err || '?') + ').' + tail;
                if (lang === 'pt') return 'Não foi possível controlar o Spotify (' + (err || '?') + ').' + tail;
                return 'No se pudo controlar Spotify (' + (err || '?') + ').' + tail;
            }

            function hxdApplySpotifyControlResult(r) {
                var errElCtrl = document.getElementById('hxd-spotify-err');
                if (r && r.ok === true) {
                    if (errElCtrl) {
                        errElCtrl.style.display = 'none';
                        errElCtrl.textContent = '';
                    }
                    return true;
                }
                if (errElCtrl) {
                    errElCtrl.style.display = 'block';
                    errElCtrl.textContent = hxdSpotifyControlErrorLine(r);
                }
                return false;
            }

            document.getElementById('hxd-spotify-close').addEventListener('click', function(e) {
                e.stopPropagation();
                hxdSpotifyPanelEl.classList.remove('open');
                if (hxdSpotifyBtnEl) hxdSpotifyBtnEl.classList.remove('open');
            });

            hxdSpotifyBtnEl.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var open = hxdSpotifyPanelEl.classList.toggle('open');
                if (hxdSpotifyBtnEl) {
                    if (open) hxdSpotifyBtnEl.classList.add('open');
                    else hxdSpotifyBtnEl.classList.remove('open');
                }
                if (open) {
                    hxdApplySpotifyPanelAnchor();
                    var loadOpen = document.getElementById('hxd-spotify-loading');
                    if (loadOpen) {
                        var lg0 = localStorage.getItem('haxball_language') || 'es';
                        loadOpen.style.display = 'block';
                        loadOpen.textContent =
                            lg0 === 'en' ? 'Loading…' : lg0 === 'pt' ? 'Carregando…' : 'Cargando…';
                    }
                    hxdStartSpotifyPoll();
                    hxdSpotifyBridge
                        .getConfig()
                        .then(function(cfg) {
                            var hintEl = document.getElementById('hxd-spotify-login-hint');
                            if (hintEl) {
                                hintEl.textContent =
                                    cfg && cfg.developmentModeHint
                                        ? String(cfg.developmentModeHint)
                                        : '';
                            }
                            if (!cfg || !cfg.hasClientId) {
                                hxdApplySpotifyPlaybackPayload({
                                    ok: true,
                                    hasClientId: false,
                                    redirectUri: cfg && cfg.redirectUri
                                });
                            } else {
                                hxdFetchSpotifyPlayback();
                            }
                        })
                        .catch(function() {});
                }
            });

            document.getElementById('hxd-spotify-connect-btn').addEventListener('click', function() {
                hxdSpotifyBridge.startAuth().then(function(r) {
                    if (r && !r.success && r.error === 'missing_client_id') {
                        var errEl = document.getElementById('hxd-spotify-err');
                        if (errEl) {
                            errEl.style.display = 'block';
                            errEl.textContent =
                                'Falta el Client ID. Configurá HXD_SPOTIFY_CLIENT_ID o spotify-client-id.txt.';
                        }
                    }
                });
            });

            document.getElementById('hxd-spotify-disconnect-btn').addEventListener('click', function() {
                hxdSpotifyBridge.logout().then(function() {
                    hxdApplySpotifyPlaybackPayload({ ok: true, hasClientId: true, loggedIn: false });
                });
            });

            document.getElementById('hxd-spotify-play-toggle').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                hxdSpotifyBridge.control({ action: 'toggle' }).then(function(r) {
                    if (!hxdApplySpotifyControlResult(r)) return;
                    hxdFetchSpotifyPlayback();
                });
            });

            document.getElementById('hxd-spotify-next').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                hxdSpotifyBridge.control({ action: 'next' }).then(function(r) {
                    if (!hxdApplySpotifyControlResult(r)) return;
                    hxdFetchSpotifyPlayback();
                });
            });

            document.getElementById('hxd-spotify-prev').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                hxdSpotifyBridge.control({ action: 'previous' }).then(function(r) {
                    if (!hxdApplySpotifyControlResult(r)) return;
                    hxdFetchSpotifyPlayback();
                });
            });

            document.getElementById('hxd-spotify-progress-hit').addEventListener('click', function(ev) {
                var dur = hxdSpotifyLastState.duration_ms || 0;
                if (!dur) return;
                var rect = ev.currentTarget.getBoundingClientRect();
                var x = ev.clientX - rect.left;
                var ratio = Math.max(0, Math.min(1, x / rect.width));
                var pos = Math.floor(ratio * dur);
                hxdSpotifyBridge.control({ action: 'seek', position_ms: pos }).then(function(r) {
                    if (!hxdApplySpotifyControlResult(r)) return;
                    hxdSpotifyLastState.progress_ms = pos;
                    hxdSpotifyLastState.fetchedAt = Date.now();
                    hxdUpdateSpotifyProgressVisual();
                    hxdFetchSpotifyPlayback();
                });
            });

            hxdSpotifyBridge.onAuthChanged(function() {
                hxdFetchSpotifyPlayback();
            });

            function hxdSyncSpotifyLoginCopy() {
                var lang = localStorage.getItem('haxball_language') || 'es';
                var connectLabel =
                    lang === 'en'
                        ? 'Connect your Spotify'
                        : lang === 'pt'
                          ? 'Conectar seu Spotify'
                          : 'Conectar tu Spotify';
                var connectHint =
                    lang === 'en'
                        ? 'Then keep Spotify open on this PC — this panel syncs your playback (start music once in Spotify if controls fail).'
                        : lang === 'pt'
                          ? 'Depois mantenha o Spotify aberto neste PC — o painel acompanha a reprodução (inicie uma faixa no Spotify se os botões falharem).'
                          : 'Después mantené Spotify abierto en esta PC — el panel sigue tu reproducción (iniciá música en Spotify si los botones fallan).';
                var disconnectTxt =
                    lang === 'en' ? 'Disconnect Spotify' : lang === 'pt' ? 'Desconectar Spotify' : 'Desconectar Spotify';
                var hint = document.getElementById('hxd-spotify-login-hint');
                if (hint) hint.textContent = connectHint;
                var disc = document.getElementById('hxd-spotify-disconnect-btn');
                if (disc) disc.textContent = disconnectTxt;
                var lbl = document.getElementById('hxd-spotify-connect-label');
                if (lbl) lbl.textContent = connectLabel;
            }
            hxdSyncSpotifyLoginCopy();
            hxdSpotifyBridge
                .getConfig()
                .then(function(cfgBoot) {
                    var hintBoot = document.getElementById('hxd-spotify-login-hint');
                    if (hintBoot && cfgBoot && cfgBoot.developmentModeHint) {
                        hintBoot.textContent = String(cfgBoot.developmentModeHint);
                    }
                })
                .catch(function() {})
                .finally(function() {
                    hxdStartSpotifyPoll();
                });
        }

        // Dropdown de idiomas
        var langBtn = document.getElementById('lang-btn');
        var langDropdown = document.createElement('div');
        langDropdown.id = 'lang-dropdown';
        
        var currentLang = localStorage.getItem('haxball_language') || 'es';
        
        langDropdown.innerHTML = '<div class="lang-item' + (currentLang === 'es' ? ' active' : '') + '" data-lang="es">Español</div>' +
            '<div class="lang-item' + (currentLang === 'pt' ? ' active' : '') + '" data-lang="pt">Portugues</div>' +
            '<div class="lang-item' + (currentLang === 'en' ? ' active' : '') + '" data-lang="en">Ingles</div>';
        
        langBtn.style.position = 'relative';
        langBtn.appendChild(langDropdown);
        
        langBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            langDropdown.style.display = langDropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        var langItems = langDropdown.querySelectorAll('.lang-item');
        for (var i = 0; i < langItems.length; i++) {
            (function(item) {
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var lang = item.getAttribute('data-lang');
                    localStorage.setItem('haxball_language', lang);
                    if (window.__haxSetLanguage) window.__haxSetLanguage(lang);
                    langDropdown.style.display = 'none';
                    // Recarrega para aplicar traduções
                    window.location.reload();
                });
            })(langItems[i]);
        }
        
        document.addEventListener('click', function(ev) {
            langDropdown.style.display = 'none';
            try {
                var inSpotifyChrome =
                    (hxdSpotifySlotEl && hxdSpotifySlotEl.contains(ev.target)) ||
                    (hxdSpotifyPanelEl && hxdSpotifyPanelEl.contains(ev.target));
                if (hxdSpotifyPanelEl && hxdSpotifyPanelEl.classList.contains('open') && !inSpotifyChrome) {
                    hxdSpotifyPanelEl.classList.remove('open');
                    if (hxdSpotifyBtnEl) hxdSpotifyBtnEl.classList.remove('open');
                }
            } catch (eCl) {}
        });
        var chromeToggle = document.getElementById('hxd-toggle-chrome-btn');
        if (chromeToggle) chromeToggle.addEventListener('click', hideHeader);
        showBtn.addEventListener('click', showHeaderFn);

        // Atalho de teclado ' para toggle da header
        function handleToggleHeader() {
            if (header.style.display === 'none') {
                showHeaderFn();
            } else {
                hideHeader();
            }
        }

        document.addEventListener('keydown', function(e) {
            // Ignora se estiver digitando em input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === "'") {
                e.preventDefault();
                handleToggleHeader();
            }
        });

        // Escuta mensagens do iframe para toggle da header
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'toggleHeader') {
                handleToggleHeader();
            }
        });
    }
})();
