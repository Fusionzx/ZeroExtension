// ============================================
// HEADER - Barra customizada com link de sala
// ============================================
(function() {
    if (typeof window.__hxdIsAnonymousMode !== 'function') {
        window.__hxdIsAnonymousMode = function() {
            return false;
        };
    }
    if (typeof window.__hxdSetAnonymousMode !== 'function') {
        window.__hxdSetAnonymousMode = function() {
            try {
                localStorage.removeItem('hxd_anonymous_mode');
                localStorage.removeItem('ghost_mode');
            } catch (eS) {}
            try {
                window.dispatchEvent(new CustomEvent('hxd-anonymous-mode-changed', { detail: { on: false } }));
            } catch (eE) {}
        };
    }

    if (typeof window.__hxdPostAnonymousToGameFrame !== 'function') {
        window.__hxdPostAnonymousToGameFrame = function() {
            try {
                var ifr = document.querySelector('iframe[src*="game.html"], iframe[src*="html5.haxball"], iframe[src*="haxball.com"]');
                if (ifr && ifr.contentWindow) {
                    ifr.contentWindow.postMessage({ type: 'hxd-sync-anonymous', on: false }, '*');
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


    var HEADER_BAR_PX = 48;
    /** Franja entre barra e iframe; 0 = sin banda oscura extra debajo del header. */
    var HEADER_GAME_GAP_PX = 0;

    /** Logo del cliente (navbar negra). */
    var LOGO_IMG =
        '<img class="header-logo" src="https://i.ibb.co/YF3Ln83r/logo-haxballapp.png" alt="HaxBall Zero" height="28" decoding="async" draggable="false" />';

    /** Windows + Electron: una sola barra (nativa). Si electronAPI aún no existe, inferir por UA. */
    function hxdDetectWindowsNativeShell() {
        // Chrome extension: sem Electron, sem titlebar
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && !window.electronAPI) return true;
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
        #custom-titlebar {\
            position: fixed; top: 0; left: 0; right: 0; height: ' + tbPx + 'px;\
            z-index: 100001;\
            background: #ffffff;\
            border-bottom: 1px solid #e2e2e2;\
            display: flex; align-items: center; justify-content: space-between;\
            padding: 0 0 0 12px;\
            box-sizing: border-box;\
            font-family: system-ui, "Segoe UI", -apple-system, sans-serif;\
            -webkit-app-region: drag;\
        }\
        #custom-titlebar .hxd-titlebar-brand {\
            display: flex; align-items: center; gap: 8px; min-width: 0;\
            -webkit-app-region: drag;\
        }\
        #custom-titlebar .hxd-titlebar-logo {\
            width: 18px; height: 18px; object-fit: contain; flex-shrink: 0;\
            display: block; border-radius: 2px; pointer-events: none;\
        }\
        #custom-titlebar .hxd-titlebar-text {\
            font-size: 12px; font-weight: 500; color: #111; letter-spacing: 0.02em;\
            white-space: nowrap;\
        }\
        #custom-titlebar .hxd-titlebar-controls {\
            display: flex; align-items: stretch; height: 100%; flex-shrink: 0;\
            -webkit-app-region: no-drag;\
        }\
        #custom-titlebar .hxd-win-btn {\
            width: 46px; min-height: 100%; border: none; background: transparent;\
            color: #1a1a1a; cursor: pointer; padding: 0; display: flex;\
            align-items: center; justify-content: center;\
        }\
        #custom-titlebar .hxd-win-btn:hover { background: #ececec; }\
        #custom-titlebar #hxd-window-close-btn:hover { background: #e81123; color: #fff; }\
        #custom-titlebar #hxd-window-max-btn .hxd-icon-restore { display: none; }\
        #custom-titlebar #hxd-window-max-btn.is-maximized .hxd-icon-max { display: none; }\
        #custom-titlebar #hxd-window-max-btn.is-maximized .hxd-icon-restore { display: block; }\
        #custom-titlebar .hxd-min-line {\
            display: block; width: 10px; height: 0; border: none; border-top: 1px solid currentColor;\
        }\
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
            display: none !important;\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px;\
            transition: color 0.12s ease;\
        }\
        #custom-header #discord-btn:hover { color: #5865F2; }\
        #custom-header #ghost-mode-btn {\
            display: none !important;\
            background: transparent; border: none; color: var(--theme-text-muted, #666); cursor: pointer; padding: 4px; align-items: center; justify-content: center;\
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
        var TITLEBAR_PX = shellUsesNativeFrame ? 0 : 32;
        var DARK_HEADER_PX = HEADER_BAR_PX;
        var CONTENT_TOP_PX = TITLEBAR_PX + DARK_HEADER_PX + HEADER_GAME_GAP_PX;
        Injector.injectCSS(
            'header-css',
            buildHeaderCss(TITLEBAR_PX, DARK_HEADER_PX)
        );

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

        window.addEventListener('themeChanged', function(e) {
            var detail = e && e.detail ? e.detail : null;
            if (!detail || !detail.theme) return;
            try {
                if (detail.theme) localStorage.setItem('haxball-theme', String(detail.theme));
            } catch (errThemeEv) {}
            applyThemeToMainFrame(detail.theme, detail.colors);
        });

        // Escuta mudanças de tema del iframe (o del mismo documento vía postMessage)
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'themeChanged') {
                try {
                    if (e.data.theme) localStorage.setItem('haxball-theme', String(e.data.theme));
                } catch (err) {}
                applyThemeToMainFrame(e.data.theme, e.data.colors);
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

        if (shellUsesNativeFrame) {
            var staleTb = document.getElementById('custom-titlebar');
            if (staleTb && staleTb.parentNode) {
                staleTb.parentNode.removeChild(staleTb);
            }
        }

        if (document.getElementById('custom-header') || document.getElementById('custom-titlebar')) return;

        var titlebar = null;
        var tbLogoSrc = chrome.runtime.getURL('icons/icon32.png');
        if (!shellUsesNativeFrame) {
            titlebar = document.createElement('div');
            titlebar.id = 'custom-titlebar';
            titlebar.setAttribute('role', 'banner');
            titlebar.innerHTML =
                '\
                <div class="hxd-titlebar-brand">\
                    <img class="hxd-titlebar-logo" src="' +
                tbLogoSrc +
                '" alt="" width="18" height="18" decoding="async" draggable="false" />\
                    <span class="hxd-titlebar-text">zEro</span>\
                </div>\
                <div class="hxd-titlebar-controls">\
                    <button type="button" id="hxd-window-min-btn" class="hxd-win-btn hxd-win-btn-min" data-translate-title="Minimizar" aria-label="Minimizar"><span class="hxd-min-line"></span></button>\
                    <button type="button" id="hxd-window-max-btn" class="hxd-win-btn" data-translate-title="Maximizar" aria-label="Maximizar">\
                        <svg class="hxd-icon-max" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>\
                        <svg class="hxd-icon-restore" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="12" height="12" rx="1"/><rect x="3" y="9" width="12" height="12" rx="1"/></svg>\
                    </button>\
                    <button type="button" id="hxd-window-close-btn" class="hxd-win-btn" data-translate-title="Cerrar ventana" aria-label="Cerrar ventana">\
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>\
                    </button>\
                </div>\
            ';
            document.body.insertBefore(titlebar, document.body.firstChild);
        }

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
                <button type="button" id="hxd-toggle-chrome-btn" data-translate-title="Ocultar barra de menú" aria-label="Toggle menu bar">\
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>\
                </button>\
            </div>\
        ';
        if (titlebar) {
            document.body.insertBefore(header, titlebar.nextSibling);
        } else {
            document.body.insertBefore(header, document.body.firstChild);
        }

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

        ['hxd-window-min-btn', 'hxd-window-close-btn'].forEach(function(id) {
            var b = document.getElementById(id);
            if (b) {
                var tk = b.getAttribute('data-translate-title');
                if (tk) b.title = t(tk);
            }
        });

        var maxBtnTr2 = document.getElementById('hxd-window-max-btn');
        if (maxBtnTr2) {
            var maxOn = maxBtnTr2.classList.contains('is-maximized');
            var maxTitle = t(maxOn ? 'Restaurar ventana' : 'Maximizar');
            maxBtnTr2.title = maxTitle;
            maxBtnTr2.setAttribute('aria-label', maxTitle);
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

        var winMinBtn = document.getElementById('hxd-window-min-btn');
        var winMaxBtn = document.getElementById('hxd-window-max-btn');
        var winCloseBtn = document.getElementById('hxd-window-close-btn');

        function minimizeWindowNow() {
            if (window.electronAPI && typeof window.electronAPI.minimizeWindow === 'function') {
                window.electronAPI.minimizeWindow();
            } else {
                fetch(LOCAL_HEADER_API + '/window/minimize', { method: 'POST' }).catch(function() {});
            }
        }

        function setMaximizeBtnUi(maximized) {
            if (!winMaxBtn) return;
            if (maximized) winMaxBtn.classList.add('is-maximized');
            else winMaxBtn.classList.remove('is-maximized');
            applyHeaderTranslations();
        }

        if (winMinBtn) {
            winMinBtn.addEventListener('click', function() {
                minimizeWindowNow();
            });
        }
        if (winMaxBtn) {
            winMaxBtn.addEventListener('click', function() {
                if (window.electronAPI && typeof window.electronAPI.toggleMaximizeWindow === 'function') {
                    window.electronAPI
                        .toggleMaximizeWindow()
                        .then(function(r) {
                            if (r && typeof r.maximized === 'boolean') setMaximizeBtnUi(r.maximized);
                        })
                        .catch(function() {});
                } else {
                    fetch(LOCAL_HEADER_API + '/window/toggle-maximize', { method: 'POST' })
                        .then(function(res) {
                            return res.json();
                        })
                        .then(function(data) {
                            if (data && typeof data.maximized === 'boolean') setMaximizeBtnUi(data.maximized);
                        })
                        .catch(function() {});
                }
            });
            if (window.electronAPI && typeof window.electronAPI.onWindowMaximizedChanged === 'function') {
                window.electronAPI.onWindowMaximizedChanged(function(m) {
                    setMaximizeBtnUi(m);
                });
            }
            if (window.electronAPI && typeof window.electronAPI.isWindowMaximized === 'function') {
                window.electronAPI
                    .isWindowMaximized()
                    .then(function(r) {
                        if (r && typeof r.maximized === 'boolean') setMaximizeBtnUi(r.maximized);
                    })
                    .catch(function() {});
            }
        }
        if (winCloseBtn) {
            winCloseBtn.addEventListener('click', function() {
                if (window.electronAPI && typeof window.electronAPI.closeApp === 'function') {
                    window.electronAPI.closeApp();
                } else {
                    fetch(LOCAL_HEADER_API + '/quit-app', { method: 'POST' }).catch(function() {});
                }
            });
        }

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
