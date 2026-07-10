// ============================================
// STYLES - Estilos customizados (igual Electron)
// ============================================
(function() {
    // Só executa dentro do iframe do jogo
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    // Códigos de países para bandeiras
    var COUNTRY_CODES = [
        'ad','ae','af','ag','ai','al','am','ao','aq','ar','as','at','au','aw','ax','az',
        'ba','bb','bd','be','bf','bg','bh','bi','bj','bl','bm','bn','bo','bq','br','bs','bt','bv','bw','by','bz',
        'ca','cc','cd','cf','cg','ch','ci','ck','cl','cm','cn','co','cr','cu','cv','cw','cx','cy','cz',
        'de','dj','dk','dm','do','dz','ec','ee','eg','eh','er','es','et',
        'fi','fj','fk','fm','fo','fr','ga','gb','gd','ge','gf','gg','gh','gi','gl','gm','gn','gp','gq','gr','gs','gt','gu','gw','gy',
        'hk','hm','hn','hr','ht','hu','id','ie','il','im','in','io','iq','ir','is','it',
        'je','jm','jo','jp','ke','kg','kh','ki','km','kn','kp','kr','kw','ky','kz',
        'la','lb','lc','li','lk','lr','ls','lt','lu','lv','ly','ma','mc','md','me','mf','mg','mh','mk','ml','mm','mn','mo','mp','mq','mr','ms','mt','mu','mv','mw','mx','my','mz',
        'na','nc','ne','nf','ng','ni','nl','no','np','nr','nu','nz','om',
        'pa','pe','pf','pg','ph','pk','pl','pm','pn','pr','ps','pt','pw','py','qa','re','ro','rs','ru','rw',
        'sa','sb','sc','sd','se','sg','sh','si','sj','sk','sl','sm','sn','so','sr','ss','st','sv','sx','sy','sz',
        'tc','td','tf','tg','th','tj','tk','tl','tm','tn','to','tr','tt','tv','tw','tz',
        'ua','ug','um','us','uy','uz','va','vc','ve','vg','vi','vn','vu','wf','ws','xk','ye','yt','za','zm','zw'
    ];

    // Gera CSS das bandeiras
    function generateFlagCSS() {
        var css = '';
        for (var i = 0; i < COUNTRY_CODES.length; i++) {
            var code = COUNTRY_CODES[i];
            css += '.flagico.f-' + code + ' { background-image: url("https://flagicons.lipis.dev/flags/4x3/' + code + '.svg") !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; } ';
        }
        return css;
    }

    var MAIN_STYLES = '\
        /* Variáveis de tema - só aplica se não for tema padrão */\
        :root:not([data-theme="default"]) {\
            --theme-bg-primary: #141414;\
            --theme-bg-secondary: #1a1a1a;\
            --theme-bg-tertiary: #272727;\
            --theme-bg-hover: #333;\
            --theme-bg-selected: #222;\
            --theme-border: #232323;\
            --theme-border-light: #333;\
            --theme-text-primary: #fff;\
            --theme-text-secondary: #888;\
            --theme-text-muted: #666;\
            --theme-scrollbar-track: #1a1a1a;\
            --theme-scrollbar-thumb: #555;\
            --theme-scrollbar-thumb-hover: #666;\
            --theme-tooltip-bg: #222;\
            --theme-tooltip-border: #333;\
        }\
        \
        /* Background do iframe - só aplica se não for tema padrão */\
        html:not([data-theme="default"]) body,\
        body:not([data-theme="default"]) {\
            background: var(--theme-bg-primary) !important;\
            background-color: var(--theme-bg-primary) !important;\
        }\
        \
        /* Fonte global */\
        * { font-family: "Space Grotesk", sans-serif !important; }\
        \
        /* Scrollbars: finas, sin flechas, track transparente (ajustes + resto del cliente) */\
        html {\
            scrollbar-width: thin;\
            scrollbar-color: rgba(255, 255, 255, 0.26) transparent;\
        }\
        html[data-theme="light"] {\
            scrollbar-color: rgba(0, 0, 0, 0.22) transparent;\
        }\
        *::-webkit-scrollbar {\
            width: 6px;\
            height: 6px;\
        }\
        *::-webkit-scrollbar-track {\
            background: transparent;\
        }\
        *::-webkit-scrollbar-thumb {\
            background-color: rgba(255, 255, 255, 0.28);\
            border-radius: 999px;\
            border: 2px solid transparent;\
            background-clip: padding-box;\
        }\
        *::-webkit-scrollbar-thumb:hover {\
            background-color: rgba(255, 255, 255, 0.42);\
        }\
        html[data-theme="light"] *::-webkit-scrollbar-thumb {\
            background-color: rgba(0, 0, 0, 0.2);\
        }\
        html[data-theme="light"] *::-webkit-scrollbar-thumb:hover {\
            background-color: rgba(0, 0, 0, 0.32);\
        }\
        *::-webkit-scrollbar-button {\
            display: none;\
            width: 0;\
            height: 0;\
        }\
        *::-webkit-scrollbar-corner {\
            background: transparent;\
        }\
        \
        /* Botões - só aplica tema se não for default */\
        html:not([data-theme="default"]) button {\
            background: var(--theme-bg-tertiary) !important;\
            border: none !important;\
            border-radius: 4px !important;\
            color: var(--theme-text-primary) !important;\
        }\
        html:not([data-theme="default"]) button:hover {\
            background: var(--theme-bg-hover) !important;\
        }\
        /* Barra del cliente (Electron): no pintar cajas grises sobre los iconos del header/titlebar. */\
        #custom-header button,\
        #custom-titlebar .hxd-win-btn,\
        #show-header-btn {\
            background: transparent !important;\
            border: none !important;\
            border-radius: 4px !important;\
            box-shadow: none !important;\
        }\
        /* Iconos navbar shell: gris por defecto y hover como haxzero-v1.2.0 (solo color, sin caja). */\
        #custom-header button {\
            color: var(--theme-text-muted, #666) !important;\
            transition: color 0.12s ease !important;\
        }\
        #custom-header #discord-btn:hover {\
            color: #5865F2 !important;\
        }\
        #custom-header #lang-btn:hover,\
        #custom-header #hxd-toggle-chrome-btn:hover {\
            color: var(--theme-text-primary, #fff) !important;\
        }\
        #custom-header #ghost-mode-btn:hover {\
            color: #a78bfa !important;\
        }\
        #custom-header #ghost-mode-btn.active:hover {\
            color: #c4b5fd !important;\
        }\
        #custom-header #ghost-mode-btn.active {\
            color: #8b5cf6 !important;\
        }\
        html:not([data-theme="default"]) #custom-header button:hover {\
            background: transparent !important;\
        }\
        html:not([data-theme="default"]) #show-header-btn:hover {\
            background: rgba(255, 255, 255, 0.08) !important;\
        }\
        button#discord-login-btn {\
            background: #5865F2 !important;\
            color: #fff !important;\
        }\
        button#discord-login-btn:hover {\
            background: #4752C4 !important;\
        }\
        \
        /* Dialog base - cor sólida (sem blur pra não afetar FPS) */\
        html:not([data-theme="default"]) .dialog,\
        html:not([data-theme="default"]) .dialog.section {\
            background: var(--theme-bg-primary) !important;\
            background-color: var(--theme-bg-primary) !important;\
            border: 1px solid var(--theme-border) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        \
        /* Esconde elementos desnecessários */\
        img[src="images/haxball.png"] { display: none !important; }\
        button[data-hook="changenick"] { display: none !important; }\
        #translateDisclaimer { display: none !important; }\
        #toggleChat > span { display: none !important; }\
        .navbar { display: none !important; }\
        \
        /* Separadores - esconde */\
        .separator {\
            display: none !important;\
        }\
        \
        /* Resolución estirada (ajustes): layout minimalista */\
        .resolution-section .hxd-res-wrap {\
            box-sizing: border-box;\
            padding: 12px 14px 16px;\
            display: flex;\
            flex-direction: column;\
            gap: 12px;\
            max-width: 100%;\
        }\
        .resolution-section .hxd-res-hint {\
            margin: 0;\
            font-size: 11px;\
            line-height: 1.4;\
            color: var(--theme-text-muted, #666);\
        }\
        .resolution-section .hxd-res-status {\
            display: flex;\
            align-items: center;\
            justify-content: space-between;\
            gap: 12px;\
            padding: 10px 12px;\
            border-radius: 10px;\
            border: 1px solid var(--theme-border, #232323);\
            background: var(--theme-bg-secondary, #1a1a1a);\
        }\
        .resolution-section .hxd-res-status-l {\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.04em;\
            text-transform: uppercase;\
            color: var(--theme-text-muted, #666);\
        }\
        .resolution-section [data-hook="resolution-current-label"] {\
            font-size: 14px;\
            font-weight: 600;\
            font-variant-numeric: tabular-nums;\
            color: var(--theme-text-primary, #fff);\
        }\
        .resolution-section .hxd-res-label {\
            display: block;\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.04em;\
            text-transform: uppercase;\
            color: var(--theme-text-muted, #666);\
            margin: 0 0 6px 0;\
        }\
        .resolution-section select[data-hook="stretched-preset"],\
        .resolution-section input[data-hook="stretched-width"],\
        .resolution-section input[data-hook="stretched-height"] {\
            width: 100%;\
            box-sizing: border-box;\
            height: 36px;\
            border-radius: 8px;\
            border: 1px solid var(--theme-border, #232323);\
            background: var(--theme-bg-primary, #141414);\
            color: var(--theme-text-primary, #fff);\
            padding: 0 10px;\
            font-size: 13px;\
            outline: none;\
        }\
        .resolution-section select[data-hook="stretched-preset"] {\
            cursor: pointer;\
        }\
        .resolution-section .hxd-res-dim-row {\
            display: flex;\
            align-items: center;\
            gap: 8px;\
        }\
        .resolution-section .hxd-res-dim-row input {\
            flex: 1;\
            min-width: 0;\
        }\
        .resolution-section .hxd-res-x {\
            flex-shrink: 0;\
            font-size: 12px;\
            color: var(--theme-text-muted, #666);\
            user-select: none;\
        }\
        .resolution-section .hxd-res-foot {\
            margin: 0;\
            font-size: 10px;\
            line-height: 1.35;\
            color: var(--theme-text-muted, #666);\
        }\
        .resolution-section .hxd-res-actions {\
            display: flex;\
            gap: 8px;\
        }\
        .resolution-section .hxd-res-btn {\
            flex: 1;\
            min-height: 36px;\
            border-radius: 8px;\
            font-size: 12px;\
            font-weight: 600;\
            cursor: pointer;\
            border: 1px solid var(--theme-border, #232323);\
            background: transparent;\
            color: var(--theme-text-primary, #fff);\
            transition: background 0.12s, border-color 0.12s;\
        }\
        .resolution-section .hxd-res-btn:hover {\
            background: var(--theme-bg-hover, #333);\
        }\
        .resolution-section .hxd-res-btn--primary {\
            background: var(--theme-bg-tertiary, #272727);\
            border-color: var(--theme-border-light, #333);\
        }\
        .resolution-section .hxd-res-btn--primary:hover {\
            background: var(--theme-bg-hover, #333);\
        }\
        \
        /* Fondos HUD: marcador (.bar unificado) y chat — rgba + --hxd-*-bg-alpha (0–1). 1 = opaco, 0 = invisible. */\
        html {\
            --hxd-scoreboard-bg-alpha: 1;\
            --hxd-chat-bg-alpha: 1;\
            --hxd-browser-zoom: 1;\
            --hxd-browser-zoom-inverse: 1;\
        }\
        html:not([data-theme="default"]) .game-state-view .bar {\
            background: rgba(var(--theme-bg-primary-rgb, 20, 20, 20), var(--hxd-scoreboard-bg-alpha, 1)) !important;\
        }\
        html[data-theme="default"] .game-state-view .bar,\
        html:not([data-theme]) .game-state-view .bar {\
            background: rgba(26, 33, 37, var(--hxd-scoreboard-bg-alpha, 1)) !important;\
        }\
        html:not([data-theme="default"]) .game-state-view .scoreboard,\
        html:not([data-theme="default"]) .game-state-view .game-timer-view,\
        html:not([data-theme="default"]) .game-state-view .fps-limit-fix {\
            background: transparent !important;\
        }\
        html[data-theme="default"] .game-state-view .scoreboard,\
        html[data-theme="default"] .game-state-view .game-timer-view,\
        html[data-theme="default"] .game-state-view .fps-limit-fix,\
        html:not([data-theme]) .game-state-view .scoreboard,\
        html:not([data-theme]) .game-state-view .game-timer-view,\
        html:not([data-theme]) .game-state-view .fps-limit-fix {\
            background: transparent !important;\
        }\
        /* Replay player: mismo lenguaje visual que roomlist/settings preview */\
        .game-view.replayer .replay-controls-view {\
            position: fixed !important;\
            left: var(--hxd-replay-left, 50%) !important;\
            bottom: var(--hxd-replay-bottom, 156px) !important;\
            transform: none !important;\
            z-index: 100 !important;\
            display: flex !important;\
            align-items: center !important;\
            gap: 8px !important;\
            width: var(--hxd-replay-width, min(760px, calc(100vw - 48px))) !important;\
            min-height: 50px !important;\
            padding: 8px 10px !important;\
            background: var(--theme-bg-secondary, #1a1a1a) !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            border-radius: 14px !important;\
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08) !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font-family: Inter, system-ui, sans-serif !important;\
            box-sizing: border-box !important;\
        }\
        .game-view.replayer .replay-controls-view button {\
            width: 34px !important;\
            height: 34px !important;\
            min-width: 34px !important;\
            padding: 0 !important;\
            display: inline-flex !important;\
            align-items: center !important;\
            justify-content: center !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            border-radius: 999px !important;\
            background: var(--theme-bg-tertiary, #272727) !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font-size: 13px !important;\
            font-weight: 700 !important;\
            line-height: 1 !important;\
            cursor: pointer !important;\
            transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s !important;\
        }\
        .game-view.replayer .replay-controls-view button:hover {\
            background: var(--theme-bg-hover, #333) !important;\
            border-color: var(--theme-border-light, #333) !important;\
        }\
        .game-view.replayer .replay-controls-view button:active {\
            transform: translateY(1px) !important;\
        }\
        .game-view.replayer .replay-controls-view button[data-hook="leave"] {\
            width: auto !important;\
            min-width: 76px !important;\
            padding: 0 14px !important;\
            border-radius: 999px !important;\
        }\
        .game-view.replayer .replay-controls-view [data-hook="spd"],\
        .game-view.replayer .replay-controls-view [data-hook="time"] {\
            min-width: 50px !important;\
            height: 32px !important;\
            display: inline-flex !important;\
            align-items: center !important;\
            justify-content: center !important;\
            padding: 0 10px !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            border-radius: 999px !important;\
            background: var(--theme-bg-primary, #141414) !important;\
            color: var(--theme-text-secondary, #888) !important;\
            font-size: 12px !important;\
            font-weight: 800 !important;\
            letter-spacing: 0.02em !important;\
            white-space: nowrap !important;\
        }\
        .game-view.replayer .replay-controls-view [data-hook="time"] {\
            min-width: 62px !important;\
            color: var(--theme-text-primary, #fff) !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar {\
            position: relative !important;\
            flex: 1 1 auto !important;\
            min-width: 120px !important;\
            height: 32px !important;\
            display: flex !important;\
            align-items: center !important;\
            padding: 0 10px !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            border-radius: 999px !important;\
            background: var(--theme-bg-primary, #141414) !important;\
            cursor: pointer !important;\
            overflow: hidden !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar .barbg {\
            width: 100% !important;\
            height: 6px !important;\
            border-radius: 999px !important;\
            background: var(--theme-bg-tertiary, #272727) !important;\
            overflow: hidden !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar .bar {\
            height: 100% !important;\
            border-radius: 999px !important;\
            background: var(--theme-text-primary, #fff) !important;\
            box-shadow: 0 0 16px color-mix(in srgb, var(--theme-text-primary, #fff) 28%, transparent) !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar .marker {\
            position: absolute !important;\
            top: 50% !important;\
            width: 4px !important;\
            height: 18px !important;\
            margin-left: -2px !important;\
            border-radius: 999px !important;\
            background: rgba(255, 255, 255, 0.72) !important;\
            border: 1px solid rgba(0, 0, 0, 0.26) !important;\
            box-shadow: 0 0 0 2px rgba(var(--theme-bg-primary-rgb, 20, 20, 20), 0.75), 0 0 10px rgba(255, 255, 255, 0.28) !important;\
            transform: translateY(-50%) !important;\
            pointer-events: none !important;\
            z-index: 4 !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar .marker.k0 {\
            background: #22c55e !important;\
            box-shadow: 0 0 0 2px rgba(var(--theme-bg-primary-rgb, 20, 20, 20), 0.75), 0 0 12px rgba(34, 197, 94, 0.55) !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar .marker.k1 {\
            background: #38bdf8 !important;\
            box-shadow: 0 0 0 2px rgba(var(--theme-bg-primary-rgb, 20, 20, 20), 0.75), 0 0 12px rgba(56, 189, 248, 0.55) !important;\
        }\
        .game-view.replayer .replay-controls-view .timebar .marker.k2 {\
            background: #f59e0b !important;\
            box-shadow: 0 0 0 2px rgba(var(--theme-bg-primary-rgb, 20, 20, 20), 0.75), 0 0 12px rgba(245, 158, 11, 0.55) !important;\
        }\
        .game-view.replayer .replay-controls-view .timetooltip {\
            display: none !important;\
        }\
        @media (max-height: 640px) {\
            .game-view.replayer .replay-controls-view {\
                bottom: var(--hxd-replay-bottom, 128px) !important;\
            }\
        }\
        @media (max-width: 760px) {\
            .game-view.replayer .replay-controls-view {\
                width: var(--hxd-replay-width, calc(100vw - 24px)) !important;\
                gap: 6px !important;\
                padding: 7px 8px !important;\
            }\
            .game-view.replayer .replay-controls-view [data-hook="spd"] {\
                min-width: 42px !important;\
                padding: 0 7px !important;\
            }\
            .game-view.replayer .replay-controls-view [data-hook="time"] {\
                min-width: 54px !important;\
                padding: 0 7px !important;\
            }\
            .game-view.replayer .replay-controls-view button[data-hook="leave"] {\
                min-width: 64px !important;\
                padding: 0 10px !important;\
            }\
        }\
        .disconnected-view .dialog.basic-dialog,\
        .simple-dialog-view .dialog.basic-dialog {\
            min-width: min(420px, calc(100vw - 48px)) !important;\
            padding: 24px !important;\
            border-radius: 16px !important;\
            background: var(--theme-bg-primary, #141414) !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35) !important;\
        }\
        .disconnected-view .dialog.basic-dialog .buttons,\
        .simple-dialog-view .dialog.basic-dialog .buttons {\
            display: flex !important;\
            justify-content: flex-end !important;\
            gap: 10px !important;\
            margin-top: 18px !important;\
        }\
        .disconnected-view .dialog.basic-dialog button,\
        .simple-dialog-view .dialog.basic-dialog button {\
            height: 38px !important;\
            padding: 0 16px !important;\
            border-radius: 999px !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            background: var(--theme-bg-tertiary, #272727) !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font-weight: 700 !important;\
        }\
        .scoreboard, .scoreboard *, .game-timer-view, .game-timer-view * {\
            font-family: "Space Grotesk", sans-serif !important;\
        }\
        .scoreboard, .scoreboard * { font-weight: bold !important; }\
        html:not([data-theme="default"]) .scoreboard {\
            color: var(--theme-text-primary) !important;\
        }\
        \
        /* Desabilita animação do timer (melhora ~150 FPS) */\
        .game-timer-view, .game-timer-view * {\
            animation: none !important;\
            -webkit-animation: none !important;\
        }\
        html:not([data-theme="default"]) .game-timer-view:not(.time-warn),\
        html:not([data-theme="default"]) .game-timer-view:not(.time-warn) * {\
            color: var(--theme-text-primary) !important;\
        }\
        .game-timer-view .digit {\
            opacity: 1 !important;\
            visibility: visible !important;\
        }\
        /* Timer vermelho quando tempo acabando */\
        .game-timer-view.time-warn, .game-timer-view.time-warn * {\
            color: #e74c3c !important;\
        }\
        \
        /* Canvas del partido: sin forzar pixelado al escalar (mejor nitidez percibida) */\
        .game-state-view canvas {\
            image-rendering: auto !important;\
        }\
        \
        /* Host: Terminar / Empezar encima del chat; position+left+width+bottom los pone JS (fixed, sin clip) */\
        #hxd-game-host-dock {\
            position: fixed !important;\
            display: flex !important;\
            flex-direction: row !important;\
            flex-wrap: nowrap !important;\
            align-items: center !important;\
            justify-content: space-between !important;\
            gap: 8px !important;\
            box-sizing: border-box !important;\
            padding: 0 2px !important;\
            z-index: 2147483630 !important;\
            visibility: visible !important;\
            opacity: 1 !important;\
            pointer-events: none !important;\
        }\
        #hxd-game-host-dock > button {\
            pointer-events: auto !important;\
        }\
        \
        /* Dialog base */\
        .dialog {\
            position: fixed !important;\
            top: 50% !important;\
            left: 50% !important;\
            transform: translate(-50%, -50%) !important;\
            margin: 0 !important;\
            overflow: visible !important;\
        }\
        html:not([data-theme="default"]) .dialog {\
            background: var(--theme-bg-primary) !important;\
            border-color: var(--theme-border) !important;\
        }\
        /* Fondo en capa fija aparte: menos invalidación al animar UI / canvas encima (antes: mismo paint que html). */\
        html[data-app-bg-image="1"] {\
            min-height: 100% !important;\
            height: 100% !important;\
            background-color: var(--theme-bg-primary, #1A2125) !important;\
            background-image: none !important;\
            isolation: isolate !important;\
        }\
        html[data-app-bg-image="1"]::before {\
            content: "" !important;\
            position: fixed !important;\
            top: 0 !important;\
            left: 0 !important;\
            width: 100% !important;\
            height: 100% !important;\
            z-index: 0 !important;\
            pointer-events: none !important;\
            background-image: var(--theme-app-background-image) !important;\
            background-size: cover !important;\
            background-position: center center !important;\
            background-repeat: no-repeat !important;\
            opacity: 0.58 !important;\
            transform: translateZ(0) !important;\
            backface-visibility: hidden !important;\
            contain: strict !important;\
        }\
        html[data-app-bg-image="1"]::after {\
            content: "" !important;\
            position: fixed !important;\
            inset: 0 !important;\
            z-index: 0 !important;\
            pointer-events: none !important;\
            background: rgba(0, 0, 0, 0.38) !important;\
        }\
        html[data-app-bg-image="1"]:has(.game-view):not(:has(.roomlist-view)):not(:has(.choose-nickname-view))::before,\
        html[data-app-bg-image="1"]:has(.game-view):not(:has(.roomlist-view)):not(:has(.choose-nickname-view))::after {\
            display: none !important;\
            content: none !important;\
        }\
        html[data-app-bg-image="1"]:has(.roomlist-view) .game-view,\
        html[data-app-bg-image="1"]:has(.choose-nickname-view) .game-view {\
            background: transparent !important;\
            background-color: transparent !important;\
            background-image: none !important;\
        }\
        html[data-app-bg-image="1"]:has(.roomlist-view) .game-view canvas,\
        html[data-app-bg-image="1"]:has(.choose-nickname-view) .game-view canvas {\
            visibility: hidden !important;\
            opacity: 0 !important;\
        }\
        html[data-app-bg-image="1"] body {\
            position: relative !important;\
            z-index: 1 !important;\
            background: transparent !important;\
            background-color: transparent !important;\
            background-image: none !important;\
        }\
        html[data-app-bg-image="1"] .view-wrapper,\
        html[data-app-bg-image="1"] .roomlist-view,\
        html[data-app-bg-image="1"] .choose-nickname-view {\
            background: transparent !important;\
            background-color: transparent !important;\
            background-image: none !important;\
        }\
        html[data-app-bg-image="1"] .game-view {\
            background: #000 !important;\
            background-color: #000 !important;\
            background-image: none !important;\
        }\
        html[data-app-bg-image="1"] .dialog,\
        html[data-app-bg-image="1"] .dialog.section {\
            background-image: none !important;\
            background-color: rgba(var(--theme-bg-primary-rgb, 15, 15, 18), 0.92) !important;\
            border-color: var(--theme-border, #3a4148) !important;\
            color: var(--theme-text-primary, #fff) !important;\
        }\
        html[data-app-bg-image="1"] .roomlist-view .dialog {\
            background-color: rgba(var(--theme-bg-primary-rgb, 15, 15, 18), 0.94) !important;\
            box-shadow: 0 18px 48px rgba(0, 0, 0, 0.46) !important;\
        }\
        html[data-app-bg-image="1"] .roomlist-view .splitter,\
        html[data-app-bg-image="1"] .roomlist-view .list,\
        html[data-app-bg-image="1"] .roomlist-view .content,\
        html[data-app-bg-image="1"] .roomlist-view table.header {\
            background-color: rgba(var(--theme-bg-primary-rgb, 15, 15, 18), 0.88) !important;\
        }\
        html[data-app-bg-image="1"] .roomlist-view #room-search,\
        html[data-app-bg-image="1"] .roomlist-view #room-search input,\
        html[data-app-bg-image="1"] .roomlist-view #sidebar-panel {\
            background-color: rgba(var(--theme-bg-secondary-rgb, 18, 18, 22), 0.94) !important;\
        }\
        .dialog * {\
            user-select: none !important;\
        }\
        .dialog input, .dialog textarea { user-select: text !important; -webkit-user-select: text !important; }\
        .chatbox-view, .chatbox-view *, .chatbox-view p, .log, .log *, .log p, .log-contents, .log-contents *, .log-contents p { user-select: text !important; -webkit-user-select: text !important; cursor: text !important; }\
        /* Un solo fondo semitransparente en .contents; hijos transparentes para no “doblar” capas al bajar alpha. */\
        .chatbox-view {\
            background: transparent !important;\
        }\
        html:not([data-theme="default"]) .chatbox-view .chatbox-view-contents {\
            background: rgba(var(--theme-bg-primary-rgb, 20, 20, 20), var(--hxd-chat-bg-alpha, 1)) !important;\
        }\
        html:not([data-theme="default"]) .chatbox-view .drag,\
        html:not([data-theme="default"]) .chatbox-view .log,\
        html:not([data-theme="default"]) .chatbox-view .log-contents,\
        html:not([data-theme="default"]) .chatbox-view .input,\
        html:not([data-theme="default"]) .chatbox-view .autocompletebox {\
            background: transparent !important;\
        }\
        html[data-theme="default"] .chatbox-view .chatbox-view-contents,\
        html:not([data-theme]) .chatbox-view .chatbox-view-contents {\
            background: rgba(26, 33, 37, var(--hxd-chat-bg-alpha, 1)) !important;\
        }\
        html[data-theme="default"] .chatbox-view .drag,\
        html[data-theme="default"] .chatbox-view .log,\
        html[data-theme="default"] .chatbox-view .log-contents,\
        html[data-theme="default"] .chatbox-view .input,\
        html[data-theme="default"] .chatbox-view .autocompletebox,\
        html:not([data-theme]) .chatbox-view .drag,\
        html:not([data-theme]) .chatbox-view .log,\
        html:not([data-theme]) .chatbox-view .log-contents,\
        html:not([data-theme]) .chatbox-view .input,\
        html:not([data-theme]) .chatbox-view .autocompletebox {\
            background: transparent !important;\
        }\
        html:not([data-theme="default"]) .chatbox-view .input {\
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;\
        }\
        html[data-theme="default"] .chatbox-view .input,\
        html:not([data-theme]) .chatbox-view .input {\
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;\
        }\
        html:not([data-theme="default"]) .dialog h1 {\
            text-align: center !important;\
            border-bottom-color: var(--theme-border) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .roomlist-view .dialog h1 {\
            margin-bottom: 12px !important;\
        }\
        .dialog button {\
            background: var(--theme-bg-tertiary) !important;\
            border: none !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .dialog button:hover { background: var(--theme-bg-selected) !important; }\
        .dialog button#discord-login-btn {\
            background: #5865F2 !important;\
            border: none !important;\
            color: #fff !important;\
        }\
        .dialog button#discord-login-btn:hover { background: #4752C4 !important; }\
        \
        /* Selects */\
        .dialog select, select {\
            background: var(--theme-bg-secondary) !important;\
            border: 1px solid var(--theme-border-light) !important;\
            border-radius: 4px !important;\
            color: var(--theme-text-primary) !important;\
            padding: 8px 30px 8px 12px !important;\
            font-size: 13px !important;\
            line-height: 1.4 !important;\
            min-height: 36px !important;\
            -webkit-appearance: none !important;\
            appearance: none !important;\
            cursor: pointer !important;\
        }\
        .dialog select option {\
            background: var(--theme-bg-secondary) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        \
        /* Inputs */\
        .label-input {\
            border: none !important;\
            box-shadow: none !important;\
            background: transparent !important;\
            padding: 0 !important;\
            margin: 0 0 15px 0 !important;\
        }\
        .label-input label { display: none !important; }\
        .label-input input, .label-input input[data-hook="input"] {\
            width: 100% !important;\
            box-sizing: border-box !important;\
            background: var(--theme-bg-secondary) !important;\
            border: 1px solid var(--theme-border-light) !important;\
            border-radius: 4px !important;\
            padding: 8px 10px !important;\
            color: var(--theme-text-primary) !important;\
            font-size: 13px !important;\
            outline: none !important;\
        }\
        .label-input input:focus { border-color: #444 !important; }\
        .label-input input::placeholder { color: var(--theme-text-muted) !important; }\
        \
        /* Room view e Game view (menu ESC) */\
        .room-view .container,\
        .game-view .container {\
            background: var(--theme-bg-primary) !important;\
            border: 1px solid var(--theme-border) !important;\
            border-radius: 8px !important;\
        }\
        .room-view select,\
        .game-view select {\
            background: var(--theme-bg-secondary) !important;\
            border: 1px solid var(--theme-border-light) !important;\
            border-radius: 4px !important;\
            color: var(--theme-text-primary) !important;\
            padding: 0 30px 0 12px !important;\
            font-size: 13px !important;\
            line-height: 36px !important;\
            min-width: 120px !important;\
            height: 36px !important;\
            box-sizing: border-box !important;\
            -webkit-appearance: none !important;\
            appearance: none !important;\
        }\
        .room-view select:disabled,\
        .game-view select:disabled {\
            opacity: 0.6 !important;\
            cursor: not-allowed !important;\
        }\
        .room-view button,\
        .game-view button {\
            background: var(--theme-bg-tertiary) !important;\
            border: none !important;\
            border-radius: 4px !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .room-view button:hover,\
        .game-view button:hover {\
            background: var(--theme-bg-selected) !important;\
        }\
        .room-view .list.thin-scrollbar,\
        .game-view .list.thin-scrollbar {\
            background: var(--theme-bg-primary) !important;\
            border: 1px solid var(--theme-border) !important;\
            border-radius: 4px !important;\
        }\
        .room-view .list tr:hover,\
        .game-view .list tr:hover {\
            background: var(--theme-bg-selected) !important;\
        }\
        .room-view .list tr.highlight,\
        .game-view .list tr.highlight,\
        .room-view .list tr.selected,\
        .game-view .list tr.selected,\
        .room-view .list tr:focus,\
        .game-view .list tr:focus,\
        .room-view .list tr[class*="select"],\
        .game-view .list tr[class*="select"] {\
            background: var(--theme-bg-selected) !important;\
            outline: none !important;\
        }\
        .room-view .list tr::selection,\
        .game-view .list tr::selection,\
        .room-view .list td::selection,\
        .game-view .list td::selection {\
            background: var(--theme-bg-selected) !important;\
        }\
        .room-view .list,\
        .game-view .list {\
            user-select: none !important;\
        }\
        .room-view .settings,\
        .game-view .settings {\
            background: var(--theme-bg-secondary) !important;\
            border: 1px solid var(--theme-border) !important;\
            border-radius: 4px !important;\
            min-width: 350px !important;\
            padding: 15px 20px !important;\
        }\
        h1[data-hook="room-name"] {\
            border-bottom: 1px solid var(--theme-border) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        div.buttons {\
            background: var(--theme-bg-primary) !important;\
        }\
        \
        /* Room list */\
        .roomlist-view .dialog > p:not([data-hook]) { display: none !important; }\
        .roomlist-view span.bool { display: none !important; }\
        .roomlist-view .dialog:not(.hxd-roomlist-preview-dialog) { width: 900px !important; max-width: 95vw !important; }\
        .roomlist-view table.header {\
            background: #1a1a1a !important;\
            border-radius: 6px !important;\
            padding: 8px 0 !important;\
            margin-bottom: 8px !important;\
        }\
        body[data-theme="light"] .roomlist-view table.header {\
            background: #d5d5d5 !important;\
        }\
        body[data-theme="onix"] .roomlist-view table.header {\
            background: #000000 !important;\
        }\
        .roomlist-view span[data-hook="distance"] { display: none !important; }\
        .roomlist-view [data-hook="flag"] { display: block !important; margin: 0 auto !important; }\
        .roomlist-view td[data-hook="pass"],\
        .roomlist-view table.header td:nth-child(3) { display: none !important; }\
        .roomlist-view table.header tr,\
        .roomlist-view .content table tr {\
            display: flex !important;\
            width: 100% !important;\
            gap: 10px !important;\
            align-items: center !important;\
            position: relative !important;\
            padding-right: 170px !important;\
        }\
        .roomlist-view .content table tr.search-hidden { display: none !important; }\
        .roomlist-view .content table tr.fav-hidden { display: none !important; }\
        .roomlist-view .content table tr.selected {\
            background: var(--theme-bg-tertiary) !important;\
            border-radius: 4px !important;\
        }\
        .roomlist-view .content table tr:hover {\
            background: var(--theme-bg-selected) !important;\
            border-radius: 4px !important;\
        }\
        /* Preserva cor amarela dos favoritos */\
        .roomlist-view td[data-hook="name"][style*="f59e0b"],\
        .roomlist-view .fav-room,\
        td.fav-room,\
        [data-hook="name"].fav-room {\
            color: #f59e0b !important;\
        }\
        /* Salas fixadas - destaque azul */\
        .roomlist-view .content table tr.pinned-room {\
            background: rgba(59, 130, 246, 0.1) !important;\
            border-left: 3px solid #3b82f6 !important;\
        }\
        .roomlist-view .content table tr.pinned-room:hover {\
            background: rgba(59, 130, 246, 0.2) !important;\
        }\
        .roomlist-view table.header td:last-child,\
        .roomlist-view .content table td:last-child {\
            order: -1 !important;\
            width: 40px !important;\
            text-align: center !important;\
            flex-shrink: 0 !important;\
        }\
        .roomlist-view table.header td:first-child {\
            flex: 1 !important;\
            text-align: left !important;\
            padding-left: 80px !important;\
        }\
        .roomlist-view .content table td:first-child { flex: 1 !important; text-align: left !important; }\
        .roomlist-view td[data-hook="players"],\
        .roomlist-view table.header td:nth-child(2) {\
            position: absolute !important;\
            right: 0 !important;\
            width: 90px !important;\
            text-align: center !important;\
        }\
        /* Botões do sidebar - só ícone */\
        #sidebar-panel button,\
        #sidebar-panel label[for="replayfile"] {\
            display: flex !important;\
            align-items: center !important;\
            justify-content: center !important;\
            width: 36px !important;\
            height: 36px !important;\
            padding: 0 !important;\
            font-size: 0 !important;\
            background: var(--theme-bg-tertiary) !important;\
            border: none !important;\
            border-radius: 4px !important;\
            cursor: pointer !important;\
            color: var(--theme-text-primary) !important;\
        }\
        #sidebar-panel button:hover,\
        #sidebar-panel label[for="replayfile"]:hover {\
            background: var(--theme-bg-hover) !important;\
        }\
        #sidebar-panel svg {\
            width: 16px !important;\
            height: 16px !important;\
        }\
        #pro-sidebar-btn svg {\
            width: 18px !important;\
            height: 18px !important;\
        }\
        #pro-sidebar-btn {\
            color: #a5b4fc !important;\
        }\
        .room-view [data-hook="friends-room-btn"] { display: none !important; }\
        .roomlist-view .dialog.zero-profile-mode { overflow: hidden auto !important; max-height: 85vh !important; }\
        .roomlist-view .dialog.zero-profile-mode > h1,\
        .roomlist-view .dialog.zero-profile-mode > p:not([data-hook]),\
        .roomlist-view .dialog.zero-profile-mode #room-search,\
        .roomlist-view .dialog.zero-profile-mode table.header,\
        .roomlist-view .dialog.zero-profile-mode > .content {\
            display: none !important;\
        }\
        .roomlist-view .dialog.zero-pro-mode,\
        .roomlist-view .dialog.zero-kit-mode { overflow: visible !important; max-height: 85vh !important; }\
        .roomlist-view .dialog.zero-pro-mode > h1,\
        .roomlist-view .dialog.zero-pro-mode > p:not([data-hook]),\
        .roomlist-view .dialog.zero-pro-mode #room-search,\
        .roomlist-view .dialog.zero-pro-mode table.header,\
        .roomlist-view .dialog.zero-pro-mode > .content,\
        .roomlist-view .dialog.zero-pro-mode #zero-inpanel-profile,\
        .roomlist-view .dialog.zero-pro-mode #zero-inpanel-jersey {\
            display: none !important;\
        }\
        .roomlist-view .dialog.zero-kit-mode > h1,\
        .roomlist-view .dialog.zero-kit-mode > p:not([data-hook]),\
        .roomlist-view .dialog.zero-kit-mode #room-search,\
        .roomlist-view .dialog.zero-kit-mode table.header,\
        .roomlist-view .dialog.zero-kit-mode > .content,\
        .roomlist-view .dialog.zero-kit-mode #zero-inpanel-profile,\
        .roomlist-view .dialog.zero-kit-mode #zero-inpanel-pro {\
            display: none !important;\
        }\
        #zero-inpanel-profile {\
            display: none;\
            flex-direction: column;\
            flex: 1 1 auto;\
            min-height: 0;\
            max-height: min(72vh, 640px);\
            margin: 0 0 8px 0;\
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;\
            font-size: 12px;\
            color: #fff;\
            --zip-bg: #000000;\
            --zip-card: #111111;\
            --zip-inset: #0c0c0c;\
            --zip-input: #161616;\
            --zip-btn: #1a1a1a;\
            --zip-btn-hover: #242424;\
            --zip-border: #1f1f1f;\
            --zip-muted: #9ca3af;\
            --zip-muted2: #6b7280;\
            --zip-green: #2ee66d;\
            --zip-green-soft: rgba(46, 230, 109, 0.12);\
            --zip-red: #f87171;\
            --zip-red-soft: rgba(248, 113, 113, 0.12);\
            --zip-discord: #5865f2;\
            --zip-r: 8px;\
            --zip-rsm: 5px;\
        }\
        .roomlist-view .dialog.zero-profile-mode #zero-inpanel-profile { display: flex !important; }\
        .roomlist-view .dialog.zero-profile-mode #zero-inpanel-pro { display: none !important; }\
        .roomlist-view .dialog.zero-profile-mode #zero-inpanel-jersey { display: none !important; }\
        #zero-inpanel-pro {\
            display: none;\
            width: 100%;\
            height: 100%;\
            box-sizing: border-box;\
            margin: 0;\
            padding: 0;\
            flex: 1 1 auto;\
            flex-direction: column;\
            min-height: 0;\
            max-height: none;\
            font-size: 12px;\
            color: #fff;\
            background: var(--theme-bg-primary, #141414);\
            border-radius: 0;\
            overflow: hidden;\
            pointer-events: auto;\
        }\
        .roomlist-view .dialog.zero-pro-mode #zero-inpanel-pro { display: flex !important; }\
        #zero-inpanel-pro #pro-inpanel-content {\
            scrollbar-width: thin;\
            scrollbar-color: var(--theme-scrollbar-thumb, #555) var(--theme-scrollbar-track, #1a1a1a);\
            -webkit-overflow-scrolling: touch;\
        }\
        #zero-inpanel-pro #pro-inpanel-content::-webkit-scrollbar { width: 8px; }\
        #zero-inpanel-pro #pro-inpanel-content::-webkit-scrollbar-track { background: var(--theme-scrollbar-track, #1a1a1a); }\
        #zero-inpanel-pro #pro-inpanel-content::-webkit-scrollbar-thumb { background: var(--theme-scrollbar-thumb, #555); border-radius: 4px; }\
        #zero-inpanel-pro #pro-inpanel-content > div[data-pro-inpanel="1"] {\
            display: flex !important;\
            flex: 1 !important;\
            min-height: 0 !important;\
            flex-direction: column !important;\
        }\
        #zero-inpanel-pro .prx,\
        #pro-popup-overlay .prx {\
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;\
            -webkit-font-smoothing: antialiased;\
            display: flex;\
            flex-direction: column;\
            min-height: 0;\
            flex: 1;\
            width: 100%;\
            box-sizing: border-box;\
        }\
        #pro-popup-overlay .prx-popup-root {\
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;\
            -webkit-font-smoothing: antialiased;\
        }\
        #zero-inpanel-pro .prx-popup-root--inpanel {\
            background: transparent;\
        }\
        .prx-head {\
            flex-shrink: 0;\
            display: flex;\
            align-items: center;\
            justify-content: space-between;\
            padding: 14px 18px 12px;\
            border-bottom: 1px solid rgba(255,255,255,0.06);\
            box-sizing: border-box;\
        }\
        .prx-mark {\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.22em;\
            text-transform: uppercase;\
            color: #737373;\
        }\
        .prx-ghost {\
            border: none;\
            background: transparent;\
            color: #525252;\
            cursor: pointer;\
            padding: 6px;\
            line-height: 0;\
            border-radius: 6px;\
            transition: color 0.15s, background 0.15s;\
        }\
        .prx-ghost:hover { color: #e5e5e5; background: rgba(255,255,255,0.04); }\
        .prx-scroll {\
            flex: 1;\
            min-height: 0;\
            overflow-y: auto;\
            overflow-x: hidden;\
            padding: 16px 18px 22px;\
            box-sizing: border-box;\
            scrollbar-width: thin;\
            scrollbar-color: rgba(255,255,255,0.15) transparent;\
        }\
        .prx-scroll::-webkit-scrollbar { width: 6px; }\
        .prx-scroll::-webkit-scrollbar-thumb {\
            background: rgba(255,255,255,0.12);\
            border-radius: 99px;\
        }\
        .prx-seg {\
            display: grid;\
            grid-template-columns: repeat(3, minmax(0, 1fr));\
            gap: 8px;\
            margin: 0 0 20px 0;\
            padding: 0;\
            border: none;\
            border-radius: 0;\
            box-sizing: border-box;\
        }\
        .prx-seg__btn {\
            margin: 0;\
            padding: 11px 10px 12px;\
            border: 1px solid rgba(255,255,255,0.1);\
            border-radius: 0;\
            background: rgba(0,0,0,0.18);\
            color: #737373;\
            font-size: 12px;\
            font-weight: 500;\
            cursor: pointer;\
            box-shadow: inset 0 -2px 0 transparent;\
            transition: color 0.15s, background 0.15s, box-shadow 0.15s;\
        }\
        .prx-seg__btn:hover { color: #a3a3a3; background: rgba(255,255,255,0.03); }\
        .prx-seg__btn--on {\
            color: #fafafa;\
            background: rgba(255,255,255,0.05);\
            box-shadow: inset 0 -2px 0 #fafafa;\
        }\
        @media (max-width: 520px) {\
            .prx-seg { grid-template-columns: 1fr; }\
        }\
        .prx-tab { padding-top: 2px; }\
        .prx-sec { margin-bottom: 0; }\
        .prx-cap {\
            margin: 0 0 12px 0;\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.16em;\
            text-transform: uppercase;\
            color: #525252;\
        }\
        .prx-rule {\
            height: 0;\
            border: 0;\
            border-top: 1px solid rgba(255,255,255,0.06);\
            margin: 20px 0;\
        }\
        .prx-stage {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            justify-content: center;\
            gap: 8px 10px;\
            padding: 16px 14px;\
            background: rgba(255,255,255,0.02);\
            border: 1px solid rgba(255,255,255,0.06);\
            border-radius: 0;\
            text-align: center;\
            box-sizing: border-box;\
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);\
        }\
        .prx-nick {\
            font-size: 15px;\
            font-weight: 600;\
            line-height: 1.25;\
        }\
        .prx-check { display: inline-flex; align-items: center; vertical-align: middle; }\
        .prx-extra { display: inline-flex; align-items: center; min-height: 18px; }\
        .prx-ball {\
            width: 14px;\
            height: 14px;\
            border-radius: 999px;\
            background: #fff;\
            display: inline-block;\
            flex-shrink: 0;\
        }\
        .prx-badge {\
            display: none;\
            align-items: center;\
            justify-content: center;\
            padding: 0 5px;\
            min-width: 26px;\
            height: 15px;\
            font-size: 7px;\
            font-weight: 700;\
            letter-spacing: 0.1em;\
            text-transform: uppercase;\
            border: 1px solid rgba(255,255,255,0.12);\
            color: #d4d4d4;\
            background: rgba(255,255,255,0.04);\
            box-sizing: border-box;\
        }\
        .prx-badge--ceo {\
            border-color: rgba(248,113,113,0.35);\
            color: #fecaca;\
            background: rgba(127,29,29,0.15);\
        }\
        .prx-badge--dev {\
            border-color: rgba(255,255,255,0.18);\
            color: #e5e7eb;\
            background: rgba(255,255,255,0.05);\
        }\
        .prx-note {\
            margin: 12px 0 0;\
            font-size: 11px;\
            line-height: 1.45;\
            color: #525252;\
        }\
        .prx-note--ctr { text-align: center; }\
        .prx-foot { margin-top: 14px; }\
        .prx-duo {\
            display: grid;\
            grid-template-columns: 1fr 1fr;\
            gap: 16px 20px;\
            margin-bottom: 14px;\
        }\
        @media (max-width: 420px) {\
            .prx-duo { grid-template-columns: 1fr; }\
        }\
        .prx-cell { min-width: 0; }\
        .prx-row {\
            display: flex;\
            align-items: center;\
            justify-content: space-between;\
            gap: 10px;\
            margin-bottom: 10px;\
        }\
        .prx-tag {\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.12em;\
            text-transform: uppercase;\
            color: #525252;\
        }\
        .prx-mini {\
            display: inline-flex;\
            align-items: center;\
            gap: 6px;\
            font-size: 11px;\
            color: #737373;\
            cursor: pointer;\
            user-select: none;\
        }\
        .prx-mini input {\
            width: 13px;\
            height: 13px;\
            margin: 0;\
            accent-color: #a3a3a3;\
            cursor: pointer;\
        }\
        .prx-palette { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }\
        .prx-grad { display: none; gap: 8px; align-items: center; }\
        .prx-grad-sep {\
            width: 10px;\
            height: 1px;\
            background: rgba(255,255,255,0.12);\
            flex-shrink: 0;\
        }\
        .prx-dot {\
            position: relative;\
            width: 34px;\
            height: 34px;\
            flex-shrink: 0;\
            overflow: hidden;\
            border: 1px solid rgba(255,255,255,0.1);\
            border-radius: 6px;\
            cursor: pointer;\
            box-sizing: border-box;\
            display: block;\
        }\
        .prx-dot--round { border-radius: 999px; }\
        .prx-dot--sq { border-radius: 4px; }\
        .prx-dot input[type="color"] {\
            position: absolute;\
            top: -8px;\
            left: -8px;\
            width: 52px;\
            height: 52px;\
            border: none;\
            padding: 0;\
            cursor: pointer;\
        }\
        .prx-sync {\
            width: 100%;\
            box-sizing: border-box;\
            margin: 0 0 4px 0;\
            padding: 10px 12px;\
            border: none;\
            border-bottom: 1px solid rgba(255,255,255,0.08);\
            background: transparent;\
            color: #737373;\
            font-size: 12px;\
            font-weight: 500;\
            cursor: pointer;\
            display: flex;\
            align-items: center;\
            justify-content: center;\
            gap: 8px;\
            transition: color 0.15s, border-color 0.15s;\
        }\
        .prx-sync:hover { color: #e5e5e5; border-bottom-color: rgba(255,255,255,0.14); }\
        .prx-stack { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }\
        .prx-field { min-width: 0; }\
        .prx-lbl {\
            display: block;\
            margin-bottom: 6px;\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.1em;\
            text-transform: uppercase;\
            color: #525252;\
        }\
        .prx-select {\
            width: 100%;\
            box-sizing: border-box;\
            padding: 10px 36px 10px 12px;\
            border: 1px solid rgba(255,255,255,0.14);\
            border-radius: 8px;\
            background-color: #262626;\
            background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a3a3a3%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E");\
            background-repeat: no-repeat;\
            background-position: right 10px center;\
            color: #f5f5f5;\
            font-size: 13px;\
            font-weight: 500;\
            cursor: pointer;\
            outline: none;\
            appearance: none;\
            -webkit-appearance: none;\
            transition: border-color 0.15s, box-shadow 0.15s;\
        }\
        .prx-select:hover { border-color: rgba(255,255,255,0.24); }\
        .prx-select:focus {\
            border-color: #2563eb;\
            box-shadow: 0 0 0 2px rgba(37,99,235,0.38);\
        }\
        .prx-select option { background: #1e1e1e; color: #fafafa; padding: 8px; }\
        html[data-theme="light"] #pro-popup-overlay .prx-select,\
        html[data-theme="light"] #zero-inpanel-pro .prx-select {\
            background-color: #f1f5f9 !important;\
            background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E") !important;\
            color: #0f172a !important;\
            border-color: rgba(15,23,42,0.18) !important;\
        }\
        html[data-theme="light"] #pro-popup-overlay .prx-select option,\
        html[data-theme="light"] #zero-inpanel-pro .prx-select option {\
            background: #fff !important;\
            color: #0f172a !important;\
        }\
        .prx-input {\
            width: 100%;\
            box-sizing: border-box;\
            padding: 10px 0 11px;\
            border: none;\
            border-bottom: 1px solid rgba(255,255,255,0.1);\
            border-radius: 0;\
            background: transparent;\
            color: #e5e5e5;\
            font-size: 14px;\
            outline: none;\
            transition: border-color 0.15s;\
        }\
        .prx-input:hover, .prx-input:focus { border-bottom-color: rgba(255,255,255,0.22); }\
        .prx-textarea {\
            width: 100%;\
            box-sizing: border-box;\
            margin-top: 4px;\
            padding: 12px 12px;\
            border: 1px solid rgba(255,255,255,0.1);\
            border-radius: 0;\
            background: rgba(0,0,0,0.22);\
            color: #e5e5e5;\
            font-size: 13px;\
            line-height: 1.45;\
            resize: vertical;\
            min-height: 72px;\
            outline: none;\
            font-family: inherit;\
        }\
        .prx-textarea:focus { border-color: rgba(255,255,255,0.2); }\
        .prx-hint {\
            margin: 8px 0 0;\
            font-size: 11px;\
            line-height: 1.45;\
            color: #525252;\
        }\
        .prx-inline {\
            display: none;\
            flex-wrap: wrap;\
            align-items: center;\
            gap: 12px;\
            margin-top: 14px;\
            padding-top: 14px;\
            border-top: 1px solid rgba(255,255,255,0.06);\
        }\
        .prx-inline-lbl {\
            flex: 1 0 100%;\
            font-size: 11px;\
            color: #737373;\
        }\
        .prx-btn {\
            width: 100%;\
            box-sizing: border-box;\
            margin-top: 22px;\
            padding: 12px 16px;\
            border: 1px solid rgba(255,255,255,0.14);\
            border-radius: 6px;\
            background: #fafafa;\
            color: #0a0a0a;\
            font-size: 12px;\
            font-weight: 600;\
            letter-spacing: 0.04em;\
            text-transform: uppercase;\
            cursor: pointer;\
            transition: opacity 0.15s, border-color 0.15s, background 0.15s, color 0.15s;\
        }\
        .prx-btn:hover { opacity: 0.9; }\
        .prx-btn--line {\
            margin-top: 18px;\
            background: transparent;\
            color: #e5e5e5;\
            border-color: rgba(255,255,255,0.12);\
            text-transform: none;\
            font-weight: 500;\
            letter-spacing: 0;\
        }\
        .prx-btn--line:hover {\
            background: rgba(255,255,255,0.04);\
            border-color: rgba(255,255,255,0.18);\
        }\
        .prx-btn--flash-ok {\
            background: rgba(250,250,250,0.12) !important;\
            color: #e5e5e5 !important;\
            border-color: rgba(255,255,255,0.2) !important;\
        }\
        .prx-btn--flash-err {\
            background: rgba(248,113,113,0.12) !important;\
            color: #fecaca !important;\
            border-color: rgba(248,113,113,0.35) !important;\
        }\
        #pro-popup-overlay #pro-save-btn.prx-btn,\
        #zero-inpanel-pro #pro-save-btn.prx-btn {\
            background: #2a3138;\
            color: #fff;\
            border: 1px solid #3a4148;\
            text-transform: none;\
            letter-spacing: 0.01em;\
            font-size: 13px;\
            font-weight: 600;\
        }\
        #pro-popup-overlay #pro-save-btn.prx-btn:hover,\
        #zero-inpanel-pro #pro-save-btn.prx-btn:hover {\
            opacity: 1;\
            background: #3a4148;\
            border-color: #4a5158;\
        }\
        #pro-popup-overlay #pro-goal-save.prx-btn,\
        #zero-inpanel-pro #pro-goal-save.prx-btn {\
            background: #2a3138;\
            color: #fff;\
            border: 1px solid #3a4148;\
            text-transform: none;\
            letter-spacing: 0.01em;\
            font-size: 13px;\
            font-weight: 600;\
        }\
        #pro-popup-overlay #pro-goal-save.prx-btn:hover,\
        #zero-inpanel-pro #pro-goal-save.prx-btn:hover {\
            opacity: 1;\
            background: #3a4148;\
            border-color: #4a5158;\
        }\
        #pro-popup-overlay #pro-save-btn.prx-btn--flash-ok,\
        #zero-inpanel-pro #pro-save-btn.prx-btn--flash-ok {\
            background: rgba(22, 163, 74, 0.22) !important;\
            color: #ecfdf3 !important;\
            border-color: rgba(74, 222, 128, 0.45) !important;\
        }\
        #pro-popup-overlay #pro-save-btn.prx-btn--flash-err,\
        #zero-inpanel-pro #pro-save-btn.prx-btn--flash-err {\
            background: rgba(185, 28, 28, 0.25) !important;\
            color: #fecaca !important;\
            border-color: rgba(248, 113, 113, 0.45) !important;\
        }\
        .prx-lead {\
            margin: 0 0 10px 0;\
            font-size: 11px;\
            line-height: 1.4;\
            color: #737373;\
        }\
        .prx-toggle {\
            display: flex;\
            align-items: center;\
            gap: 10px;\
            margin-bottom: 10px;\
            padding: 8px 0;\
            border-bottom: 1px solid rgba(255,255,255,0.05);\
            font-size: 12px;\
            color: #a3a3a3;\
            cursor: pointer;\
            user-select: none;\
        }\
        .prx-toggle input {\
            width: 15px;\
            height: 15px;\
            margin: 0;\
            accent-color: #d4d4d4;\
            cursor: pointer;\
        }\
        .prx-sndlist { display: flex; flex-direction: column; gap: 0; }\
        .prx-snd {\
            padding: 10px 0;\
            border-bottom: 1px solid rgba(255,255,255,0.05);\
            box-sizing: border-box;\
        }\
        .prx-snd__name {\
            display: block;\
            margin-bottom: 6px;\
            font-size: 9px;\
            font-weight: 600;\
            letter-spacing: 0.1em;\
            text-transform: uppercase;\
            color: #525252;\
        }\
        .prx-snd__tools {\
            display: flex;\
            flex-wrap: wrap;\
            gap: 6px;\
            align-items: center;\
        }\
        .prx-snd-url {\
            position: absolute;\
            width: 0;\
            height: 0;\
            opacity: 0;\
            pointer-events: none;\
            border: 0;\
            padding: 0;\
            margin: 0;\
            overflow: hidden;\
        }\
        .prx-snd-hint {\
            flex: 1;\
            min-width: 80px;\
            font-size: 10px;\
            color: #737373;\
            line-height: 1.35;\
        }\
        .prx-snd-pick {\
            position: relative;\
            overflow: hidden;\
            display: inline-flex;\
            align-items: center;\
            justify-content: center;\
            padding: 6px 10px;\
            border: 1px solid rgba(255,255,255,0.1);\
            border-radius: 4px;\
            color: #a3a3a3;\
            font-size: 10px;\
            font-weight: 500;\
            cursor: pointer;\
            transition: border-color 0.15s, color 0.15s;\
        }\
        .prx-snd-pick:hover { border-color: rgba(255,255,255,0.18); color: #e5e5e5; }\
        .prx-snd-file {\
            position: absolute;\
            left: 0;\
            top: 0;\
            opacity: 0;\
            width: 100%;\
            height: 100%;\
            cursor: pointer;\
        }\
        .prx-snd-play {\
            width: 32px;\
            height: 30px;\
            flex-shrink: 0;\
            border-radius: 4px;\
            border: 1px solid rgba(255,255,255,0.1);\
            background: transparent;\
            color: #d4d4d4;\
            cursor: pointer;\
            font-size: 10px;\
            transition: border-color 0.15s, color 0.15s;\
        }\
        .prx-snd-play:hover { border-color: rgba(255,255,255,0.2); color: #fafafa; }\
        .prx-snd-muted,\
        .prx-snd-clear {\
            padding: 6px 10px;\
            border-radius: 4px;\
            border: 1px solid rgba(255,255,255,0.08);\
            background: transparent;\
            color: #a3a3a3;\
            font-size: 10px;\
            font-weight: 500;\
            cursor: pointer;\
            transition: border-color 0.12s, color 0.12s;\
        }\
        .prx-snd-muted:hover,\
        .prx-snd-clear:hover { border-color: rgba(255,255,255,0.16); color: #e5e5e5; }\
        .prx-snd-clear:disabled {\
            opacity: 0.35;\
            cursor: default;\
            pointer-events: none;\
        }\
        .prx-toast {\
            min-height: 18px;\
            margin-top: 12px;\
            font-size: 12px;\
            text-align: center;\
            color: #737373;\
        }\
        .prx-toast--ok { color: #a3a3a3; }\
        .prx-toast--err { color: #f87171; }\
        #zero-inpanel-jersey {\
            display: none;\
            width: 100%;\
            height: 100%;\
            box-sizing: border-box;\
            margin: 0;\
            padding: 0;\
            flex-direction: column;\
            min-height: 0;\
            max-height: none;\
            font-size: 12px;\
            color: #fff;\
            background: var(--theme-bg-primary, #141414);\
            border-radius: 0;\
            overflow: hidden;\
            pointer-events: auto;\
        }\
        .roomlist-view .dialog.zero-kit-mode #zero-inpanel-jersey { display: flex !important; }\
        #zero-inpanel-jersey #jersey-preview-wrap,\
        #zero-inpanel-jersey #jersey-preview-wrap svg { width: 100%; height: 100%; display: block; }\
        /* Barras de scroll en paneles laterales (tema oscuro, sin flechas nativas feas) */\
        #teams-panel #teams-content,\
        #zero-inpanel-teams #teams-content,\
        #zero-inpanel-jersey #jersey-kit-content,\
        #friends-panel #friends-list,\
        #zero-inpanel-friends #friends-list,\
        #friends-panel #search-results,\
        #zero-inpanel-friends #search-results {\
            scrollbar-width: thin;\
            scrollbar-color: var(--theme-scrollbar-thumb, #555) var(--theme-scrollbar-track, #1a1a1a);\
            -webkit-overflow-scrolling: touch;\
        }\
        #teams-panel #teams-content::-webkit-scrollbar,\
        #zero-inpanel-teams #teams-content::-webkit-scrollbar,#zero-inpanel-jersey #jersey-kit-content::-webkit-scrollbar,\
        #jersey-kit-content::-webkit-scrollbar,\
        #friends-panel #friends-list::-webkit-scrollbar,\
        #zero-inpanel-friends #friends-list::-webkit-scrollbar,\
        #friends-panel #search-results::-webkit-scrollbar,\
        #zero-inpanel-friends #search-results::-webkit-scrollbar {\
            width: 10px;\
            height: 10px;\
        }\
        #teams-panel #teams-content::-webkit-scrollbar-track,\
        #zero-inpanel-teams #teams-content::-webkit-scrollbar-track,#zero-inpanel-jersey #jersey-kit-content::-webkit-scrollbar-track,\
        #jersey-kit-content::-webkit-scrollbar-track,\
        #friends-panel #friends-list::-webkit-scrollbar-track,\
        #zero-inpanel-friends #friends-list::-webkit-scrollbar-track,\
        #friends-panel #search-results::-webkit-scrollbar-track,\
        #zero-inpanel-friends #search-results::-webkit-scrollbar-track {\
            background: var(--theme-scrollbar-track, #1a1a1a);\
            border-radius: 999px;\
            margin: 4px 0;\
        }\
        #teams-panel #teams-content::-webkit-scrollbar-thumb,\
        #zero-inpanel-teams #teams-content::-webkit-scrollbar-thumb,#zero-inpanel-jersey #jersey-kit-content::-webkit-scrollbar-thumb,\
        #jersey-kit-content::-webkit-scrollbar-thumb,\
        #friends-panel #friends-list::-webkit-scrollbar-thumb,\
        #zero-inpanel-friends #friends-list::-webkit-scrollbar-thumb,\
        #friends-panel #search-results::-webkit-scrollbar-thumb,\
        #zero-inpanel-friends #search-results::-webkit-scrollbar-thumb {\
            background: linear-gradient(180deg, var(--theme-scrollbar-thumb, #555), var(--theme-scrollbar-thumb-hover, #666));\
            border-radius: 999px;\
            border: 2px solid transparent;\
            background-clip: padding-box;\
        }\
        #teams-panel #teams-content::-webkit-scrollbar-thumb:hover,\
        #zero-inpanel-teams #teams-content::-webkit-scrollbar-thumb:hover,#zero-inpanel-jersey #jersey-kit-content::-webkit-scrollbar-thumb:hover,\
        #jersey-kit-content::-webkit-scrollbar-thumb:hover,\
        #friends-panel #friends-list::-webkit-scrollbar-thumb:hover,\
        #zero-inpanel-friends #friends-list::-webkit-scrollbar-thumb:hover,\
        #friends-panel #search-results::-webkit-scrollbar-thumb:hover,\
        #zero-inpanel-friends #search-results::-webkit-scrollbar-thumb:hover {\
            background: linear-gradient(180deg, var(--theme-scrollbar-thumb-hover, #666), var(--theme-scrollbar-thumb-hover, #777));\
            background-clip: padding-box;\
        }\
        #teams-panel {\
            box-shadow: -12px 0 40px rgba(0, 0, 0, 0.42);\
        }\
        #teams-panel #teams-content,\
        #zero-inpanel-teams #teams-content,#zero-inpanel-jersey #jersey-kit-content {\
            display: flex;\
            flex-direction: column;\
            min-height: 0;\
        }\
        #teams-panel #teams-content > .tm-shell,\
        #zero-inpanel-teams #teams-content > .tm-shell,#zero-inpanel-jersey #jersey-kit-content > .tm-shell {\
            flex: 1 1 auto;\
            min-height: 0;\
            display: flex;\
            flex-direction: column;\
            width: 100%;\
            box-sizing: border-box;\
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;\
            font-size: 13px;\
            color: #e4e4e7;\
            letter-spacing: -0.01em;\
        }\
        #zero-inpanel-teams .tm-shell .tm-head,\
        #zero-inpanel-jersey .tm-shell .tm-head,\
        #teams-panel .tm-shell .tm-head {\
            display: flex;\
            align-items: center;\
            gap: 14px;\
            padding: 0 0 16px;\
            margin: 0 0 4px;\
            border-bottom: 1px solid rgba(255,255,255,0.08);\
            flex-shrink: 0;\
        }\
        #zero-inpanel-teams .tm-avatar,\
        #zero-inpanel-jersey .tm-avatar,\
        #teams-panel .tm-avatar {\
            width: 48px;\
            height: 48px;\
            border-radius: 12px;\
            overflow: hidden;\
            flex-shrink: 0;\
            background: #18181b;\
            border: 1px solid rgba(255,255,255,0.07);\
        }\
        #zero-inpanel-teams .tm-avatar img,\
        #zero-inpanel-jersey .tm-avatar img,\
        #teams-panel .tm-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }\
        #zero-inpanel-teams .tm-avatar__ph,\
        #zero-inpanel-jersey .tm-avatar__ph,\
        #teams-panel .tm-avatar__ph {\
            width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;\
            color: #52525b;\
        }\
        #zero-inpanel-teams .tm-kicker,\
        #zero-inpanel-jersey .tm-kicker,\
        #teams-panel .tm-kicker {\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.14em;\
            text-transform: uppercase;\
            color: #71717a;\
            margin: 0 0 4px;\
        }\
        #zero-inpanel-teams .tm-title,\
        #zero-inpanel-jersey .tm-title,\
        #teams-panel .tm-title {\
            margin: 0;\
            font-size: 1.25rem;\
            font-weight: 600;\
            color: #fafafa;\
            line-height: 1.2;\
        }\
        #zero-inpanel-teams .tm-meta,\
        #zero-inpanel-jersey .tm-meta,\
        #teams-panel .tm-meta {\
            margin-top: 6px;\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            gap: 6px 8px;\
            font-size: 12px;\
            color: #a1a1aa;\
        }\
        #zero-inpanel-teams .tm-meta__dot,\
        #zero-inpanel-jersey .tm-meta__dot,\
        #teams-panel .tm-meta__dot { opacity: 0.45; }\
        #zero-inpanel-teams .tm-badge,\
        #zero-inpanel-jersey .tm-badge,\
        #teams-panel .tm-badge {\
            font-size: 10px;\
            font-weight: 600;\
            letter-spacing: 0.06em;\
            text-transform: uppercase;\
            color: #fbbf24;\
            border: 1px solid rgba(251,191,36,0.35);\
            padding: 2px 8px;\
            border-radius: 999px;\
        }\
        #zero-inpanel-teams .tm-stack,\
        #zero-inpanel-jersey .tm-stack,\
        #teams-panel .tm-stack {\
            flex: 1;\
            min-height: 0;\
            display: flex;\
            flex-direction: column;\
            overflow: hidden;\
        }\
        #zero-inpanel-teams .tm-tabs,\
        #zero-inpanel-jersey .tm-tabs,\
        #zero-inpanel-pro .tm-tabs,\
        #pro-popup-overlay .tm-tabs,\
        #teams-panel .tm-tabs {\
            display: flex;\
            gap: 0;\
            border-bottom: 1px solid rgba(255,255,255,0.08);\
            flex-shrink: 0;\
            margin-bottom: 0;\
        }\
        #zero-inpanel-teams .tm-tab,\
        #zero-inpanel-jersey .tm-tab,\
        #zero-inpanel-pro .tm-tab,\
        #pro-popup-overlay .tm-tab,\
        #teams-panel .tm-tab {\
            flex: 1;\
            margin: 0;\
            padding: 12px 8px;\
            border: none;\
            border-radius: 0;\
            background: transparent !important;\
            color: #71717a !important;\
            font-size: 12px;\
            font-weight: 500;\
            cursor: pointer;\
            position: relative;\
            box-shadow: none !important;\
        }\
        #zero-inpanel-teams .tm-tab:hover,\
        #zero-inpanel-jersey .tm-tab:hover,\
        #zero-inpanel-pro .tm-tab:hover,\
        #pro-popup-overlay .tm-tab:hover,\
        #teams-panel .tm-tab:hover { color: #d4d4d8 !important; }\
        #zero-inpanel-teams .tm-tab--on,\
        #zero-inpanel-jersey .tm-tab--on,\
        #zero-inpanel-pro .tm-tab--on,\
        #pro-popup-overlay .tm-tab--on,\
        #teams-panel .tm-tab--on {\
            color: #fafafa !important;\
        }\
        #zero-inpanel-teams .tm-tab--on::after,\
        #zero-inpanel-jersey .tm-tab--on::after,\
        #zero-inpanel-pro .tm-tab--on::after,\
        #pro-popup-overlay .tm-tab--on::after,\
        #teams-panel .tm-tab--on::after {\
            content: "";\
            position: absolute;\
            left: 12%;\
            right: 12%;\
            bottom: 0;\
            height: 2px;\
            background: #fafafa;\
            border-radius: 2px 2px 0 0;\
        }\
        #zero-inpanel-teams .tm-panel,\
        #zero-inpanel-jersey .tm-panel,\
        #teams-panel .tm-panel {\
            display: none;\
            flex: 1;\
            min-height: 0;\
            flex-direction: column;\
            overflow: hidden;\
        }\
        #zero-inpanel-teams .tm-panel--on,\
        #zero-inpanel-jersey .tm-panel--on,\
        #teams-panel .tm-panel--on { display: flex; }\
        #zero-inpanel-teams .tm-scroll,\
        #zero-inpanel-jersey .tm-scroll,\
        #teams-panel .tm-scroll {\
            flex: 1;\
            min-height: 0;\
            overflow-y: auto;\
            overflow-x: hidden;\
            padding: 14px 2px 18px;\
            box-sizing: border-box;\
        }\
        #zero-inpanel-teams .tm-scroll--chat,\
        #zero-inpanel-jersey .tm-scroll--chat,\
        #teams-panel .tm-scroll--chat {\
            display: flex;\
            flex-direction: column;\
            padding-top: 10px;\
        }\
        #zero-inpanel-teams .tm-chat-hint,\
        #zero-inpanel-jersey .tm-chat-hint,\
        #teams-panel .tm-chat-hint { flex-shrink: 0; margin: 0 0 8px !important; opacity: 0.85; }\
        #zero-inpanel-teams .tm-chatpane,\
        #zero-inpanel-jersey .tm-chatpane,\
        #teams-panel .tm-chatpane {\
            display: flex;\
            flex: 1;\
            min-height: 220px;\
            gap: 0;\
            align-items: stretch;\
            overflow: hidden;\
            border-radius: 12px;\
            border: 1px solid rgba(255,255,255,0.07);\
            background: rgba(0,0,0,0.22);\
        }\
        #zero-inpanel-teams .tm-chatpane__side,\
        #zero-inpanel-jersey .tm-chatpane__side,\
        #teams-panel .tm-chatpane__side {\
            width: 132px;\
            flex-shrink: 0;\
            border: none;\
            border-radius: 0;\
            border-right: 1px solid rgba(255,255,255,0.06);\
            background: rgba(0,0,0,0.14);\
            padding: 10px 8px;\
            overflow-y: auto;\
            font-size: 12px;\
            color: #a1a1aa;\
            min-height: 0;\
        }\
        #zero-inpanel-teams .tm-chatpane__body,\
        #zero-inpanel-jersey .tm-chatpane__body,\
        #teams-panel .tm-chatpane__body {\
            flex: 1;\
            min-width: 0;\
            min-height: 0;\
            display: flex;\
            flex-direction: column;\
            border: none;\
            border-radius: 0;\
            background: transparent;\
            overflow: hidden;\
        }\
        #zero-inpanel-teams .tm-chatpane__msgs,\
        #zero-inpanel-jersey .tm-chatpane__msgs,\
        #teams-panel .tm-chatpane__msgs {\
            flex: 1;\
            min-height: 160px;\
            overflow-y: auto;\
            overflow-x: hidden;\
            padding: 10px 4px 14px;\
            display: flex;\
            flex-direction: column;\
            gap: 0;\
        }\
        #zero-inpanel-teams .tm-chatpane__send.tm-chatcomposer,\
        #zero-inpanel-jersey .tm-chatpane__send.tm-chatcomposer,\
        #teams-panel .tm-chatpane__send.tm-chatcomposer {\
            display: flex;\
            padding: 10px 12px 12px;\
            border-top: 1px solid rgba(255,255,255,0.06);\
            flex-shrink: 0;\
            align-items: stretch;\
            background: rgba(0,0,0,0.08);\
            gap: 0;\
        }\
        #zero-inpanel-teams .tm-chatcomposer__shell,\
        #zero-inpanel-jersey .tm-chatcomposer__shell,\
        #teams-panel .tm-chatcomposer__shell {\
            display: flex;\
            flex: 1;\
            min-width: 0;\
            align-items: center;\
            gap: 6px;\
            border-radius: 10px;\
            padding: 2px 4px 2px 10px;\
            background: hsl(223 9% 16% / 0.85);\
            border: none;\
            box-sizing: border-box;\
        }\
        #zero-inpanel-teams .tm-input.tm-input--chat,\
        #zero-inpanel-jersey .tm-input.tm-input--chat,\
        #teams-panel .tm-input.tm-input--chat {\
            flex: 1;\
            margin: 0;\
            min-width: 0;\
            border: none;\
            background: transparent !important;\
            box-shadow: none;\
            padding: 8px 4px;\
            font-size: 14px;\
            line-height: 1.35;\
            border-radius: 0;\
            color: #f4f4f5;\
        }\
        #zero-inpanel-teams .tm-input.tm-input--chat:focus,\
        #zero-inpanel-jersey .tm-input.tm-input--chat:focus,\
        #teams-panel .tm-input.tm-input--chat:focus {\
            outline: none;\
            border: none;\
            border-color: transparent;\
            box-shadow: none;\
        }\
        #zero-inpanel-teams .tm-chatcomposer__send,\
        #zero-inpanel-jersey .tm-chatcomposer__send,\
        #teams-panel .tm-chatcomposer__send {\
            flex-shrink: 0;\
            display: inline-flex;\
            align-items: center;\
            justify-content: center;\
            width: 36px;\
            height: 36px;\
            padding: 0;\
            margin: 0 2px 0 0;\
            border: none;\
            border-radius: 999px;\
            background: hsl(235 46% 45%);\
            color: #fff;\
            cursor: pointer;\
            transition: background 0.12s ease, opacity 0.12s ease, transform 0.08s ease;\
        }\
        #zero-inpanel-teams .tm-chatcomposer__send:hover,\
        #zero-inpanel-jersey .tm-chatcomposer__send:hover,\
        #teams-panel .tm-chatcomposer__send:hover { background: hsl(235 52% 52%); }\
        #zero-inpanel-teams .tm-chatcomposer__send:active,\
        #zero-inpanel-jersey .tm-chatcomposer__send:active,\
        #teams-panel .tm-chatcomposer__send:active { transform: scale(0.96); opacity: 0.92; }\
        #zero-inpanel-teams .tm-msg,\
        #zero-inpanel-jersey .tm-msg,\
        #teams-panel .tm-msg {\
            display: flex;\
            flex-direction: row;\
            align-items: flex-start;\
            gap: 12px;\
            padding: 4px 10px 2px;\
            margin: 0;\
            border: none;\
            border-radius: 4px;\
            background: transparent;\
            box-sizing: border-box;\
        }\
        #zero-inpanel-teams .tm-msg:hover,\
        #zero-inpanel-jersey .tm-msg:hover,\
        #teams-panel .tm-msg:hover { background: rgba(255,255,255,0.04); }\
        #zero-inpanel-teams .tm-msg--compact,\
        #zero-inpanel-jersey .tm-msg--compact,\
        #teams-panel .tm-msg--compact { padding-top: 2px; padding-bottom: 2px; }\
        #zero-inpanel-teams .tm-msg__gutter,\
        #zero-inpanel-jersey .tm-msg__gutter,\
        #teams-panel .tm-msg__gutter {\
            width: 40px;\
            flex-shrink: 0;\
            display: flex;\
            justify-content: center;\
            padding-top: 2px;\
        }\
        #zero-inpanel-teams .tm-msg__avatar,\
        #zero-inpanel-jersey .tm-msg__avatar,\
        #teams-panel .tm-msg__avatar {\
            width: 38px;\
            height: 38px;\
            border-radius: 50%;\
            display: flex;\
            align-items: center;\
            justify-content: center;\
            font-size: 14px;\
            font-weight: 700;\
            color: #fff;\
            letter-spacing: 0.02em;\
            background: linear-gradient(145deg,\
                hsl(var(--tm-msg-av, 210) 45% 50%),\
                hsl(calc(var(--tm-msg-av, 210) + 22) 40% 40%));\
            box-shadow: 0 1px 0 rgba(0,0,0,0.35) inset;\
        }\
        #zero-inpanel-teams .tm-msg__main,\
        #zero-inpanel-jersey .tm-msg__main,\
        #teams-panel .tm-msg__main {\
            flex: 1;\
            min-width: 0;\
            padding-right: 4px;\
        }\
        #zero-inpanel-teams .tm-msg__hdr,\
        #zero-inpanel-jersey .tm-msg__hdr,\
        #teams-panel .tm-msg__hdr {\
            display: flex;\
            align-items: baseline;\
            flex-wrap: wrap;\
            gap: 6px 8px;\
            margin: 0 0 3px;\
        }\
        #zero-inpanel-teams .tm-msg--me .tm-msg__who,\
        #zero-inpanel-jersey .tm-msg--me .tm-msg__who,\
        #teams-panel .tm-msg--me .tm-msg__who { color: #93c5fd; }\
        #zero-inpanel-teams .tm-msg__who,\
        #zero-inpanel-jersey .tm-msg__who,\
        #teams-panel .tm-msg__who {\
            font-size: 15px;\
            font-weight: 600;\
            text-transform: none;\
            letter-spacing: 0;\
            color: #f4f4f5;\
        }\
        #zero-inpanel-teams .tm-msg__time,\
        #zero-inpanel-jersey .tm-msg__time,\
        #teams-panel .tm-msg__time {\
            font-size: 11px;\
            font-weight: 500;\
            color: #71717a;\
            margin-top: 0;\
        }\
        #zero-inpanel-teams .tm-msg__text,\
        #zero-inpanel-jersey .tm-msg__text,\
        #teams-panel .tm-msg__text {\
            font-size: 15px;\
            line-height: 1.45;\
            color: #e4e4e7;\
            white-space: pre-wrap;\
            word-break: break-word;\
        }\
        #zero-inpanel-teams .tm-roster__line,\
        #zero-inpanel-jersey .tm-roster__line,\
        #teams-panel .tm-roster__line {\
            display: flex;\
            align-items: flex-start;\
            gap: 6px;\
            padding: 4px 0;\
            line-height: 1.35;\
            word-break: break-word;\
        }\
        #zero-inpanel-teams .tm-roster__dot,\
        #zero-inpanel-jersey .tm-roster__dot,\
        #teams-panel .tm-roster__dot {\
            width: 6px;\
            height: 6px;\
            border-radius: 50%;\
            background: #3f3f46;\
            margin-top: 4px;\
            flex-shrink: 0;\
        }\
        #zero-inpanel-teams .tm-roster__dot--on,\
        #zero-inpanel-jersey .tm-roster__dot--on,\
        #teams-panel .tm-roster__dot--on { background: #4ade80; box-shadow: 0 0 0 2px rgba(74,222,128,0.25); }\
        #zero-inpanel-teams .tm-roster__name,\
        #zero-inpanel-jersey .tm-roster__name,\
        #teams-panel .tm-roster__name { font-weight: 500; color: #e4e4e7; }\
        #zero-inpanel-teams .tm-foot,\
        #zero-inpanel-jersey .tm-foot,\
        #teams-panel .tm-foot {\
            flex-shrink: 0;\
            padding: 16px 0 8px;\
            margin-top: auto;\
            border-top: 1px solid rgba(255,255,255,0.08);\
        }\
        #zero-inpanel-teams .tm-muted,\
        #zero-inpanel-jersey .tm-muted,\
        #teams-panel .tm-muted { color: #a1a1aa; font-size: 12px; line-height: 1.45; margin: 0 0 12px; }\
        #zero-inpanel-teams .tm-muted--sm,\
        #zero-inpanel-jersey .tm-muted--sm,\
        #teams-panel .tm-muted--sm { font-size: 11px; margin: 0; }\
        #zero-inpanel-teams .tm-h3,\
        #zero-inpanel-jersey .tm-h3,\
        #teams-panel .tm-h3 {\
            font-size: 11px;\
            font-weight: 600;\
            letter-spacing: 0.12em;\
            text-transform: uppercase;\
            color: #71717a;\
            margin: 18px 0 10px;\
        }\
        #zero-inpanel-teams .tm-h3--tight,\
        #zero-inpanel-jersey .tm-h3--tight,\
        #teams-panel .tm-h3--tight { margin-top: 0; }\
        #zero-inpanel-teams .tm-rule,\
        #zero-inpanel-jersey .tm-rule,\
        #teams-panel .tm-rule {\
            border: none;\
            height: 1px;\
            background: rgba(255,255,255,0.08);\
            margin: 16px 0;\
        }\
        #zero-inpanel-teams .tm-field,\
        #zero-inpanel-jersey .tm-field,\
        #teams-panel .tm-field { margin-bottom: 14px; }\
        #zero-inpanel-teams .tm-label,\
        #zero-inpanel-jersey .tm-label,\
        #teams-panel .tm-label {\
            display: block;\
            font-size: 11px;\
            font-weight: 500;\
            color: #a1a1aa;\
            margin-bottom: 6px;\
        }\
        #zero-inpanel-teams .tm-label--solo,\
        #zero-inpanel-jersey .tm-label--solo,\
        #teams-panel .tm-label--solo { margin-top: 4px; }\
        #zero-inpanel-teams .tm-input,\
        #zero-inpanel-jersey .tm-input,\
        #teams-panel .tm-input {\
            width: 100%;\
            box-sizing: border-box;\
            padding: 10px 12px;\
            border-radius: 8px;\
            border: 1px solid rgba(255,255,255,0.1);\
            background: rgba(0,0,0,0.25);\
            color: #fafafa;\
            font-size: 13px;\
            outline: none;\
        }\
        #zero-inpanel-teams .tm-input:focus,\
        #zero-inpanel-jersey .tm-input:focus,\
        #teams-panel .tm-input:focus { border-color: rgba(255,255,255,0.22); }\
        #zero-inpanel-teams .tm-input--tag,\
        #zero-inpanel-jersey .tm-input--tag,\
        #teams-panel .tm-input--tag { max-width: 120px; text-transform: uppercase; }\
        #zero-inpanel-teams .tm-file,\
        #zero-inpanel-jersey .tm-file,\
        #teams-panel .tm-file { display: none; }\
        #zero-inpanel-teams .tm-rowline,\
        #zero-inpanel-jersey .tm-rowline,\
        #teams-panel .tm-rowline { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }\
        #zero-inpanel-teams .tm-pills,\
        #zero-inpanel-jersey .tm-pills,\
        #teams-panel .tm-pills { display: flex; gap: 8px; margin: 8px 0 14px; }\
        #zero-inpanel-teams .tm-pill,\
        #zero-inpanel-jersey .tm-pill,\
        #teams-panel .tm-pill {\
            flex: 1;\
            padding: 9px 10px;\
            border-radius: 8px;\
            border: 1px solid rgba(255,255,255,0.1);\
            background: transparent !important;\
            color: #a1a1aa !important;\
            font-size: 12px;\
            cursor: pointer;\
            box-shadow: none !important;\
        }\
        #zero-inpanel-teams .tm-pill--on,\
        #zero-inpanel-jersey .tm-pill--on,\
        #teams-panel .tm-pill--on {\
            border-color: rgba(255,255,255,0.35);\
            color: #fafafa !important;\
            background: rgba(255,255,255,0.06) !important;\
        }\
        #zero-inpanel-teams .tm-btn,\
        #zero-inpanel-jersey .tm-btn,\
        #teams-panel .tm-btn {\
            margin: 0;\
            padding: 10px 16px;\
            border-radius: 8px;\
            font-size: 13px;\
            font-weight: 500;\
            cursor: pointer;\
            border: 1px solid transparent;\
            box-sizing: border-box;\
        }\
        #zero-inpanel-teams .tm-btn--solid,\
        #zero-inpanel-jersey .tm-btn--solid,\
        #teams-panel .tm-btn--solid {\
            background: #fafafa !important;\
            color: #18181b !important;\
            border-color: #fafafa !important;\
        }\
        #zero-inpanel-teams .tm-btn--ghost,\
        #zero-inpanel-jersey .tm-btn--ghost,\
        #teams-panel .tm-btn--ghost {\
            background: transparent !important;\
            color: #d4d4d8 !important;\
            border-color: rgba(255,255,255,0.12) !important;\
        }\
        #zero-inpanel-teams .tm-btn--ghost:hover,\
        #zero-inpanel-jersey .tm-btn--ghost:hover,\
        #teams-panel .tm-btn--ghost:hover { border-color: rgba(255,255,255,0.22) !important; }\
        #zero-inpanel-teams .tm-btn--block,\
        #zero-inpanel-jersey .tm-btn--block,\
        #teams-panel .tm-btn--block { width: 100%; display: block; text-align: center; }\
        #zero-inpanel-teams .tm-btn--sm,\
        #zero-inpanel-jersey .tm-btn--sm,\
        #teams-panel .tm-btn--sm { padding: 8px 12px; font-size: 12px; }\
        #zero-inpanel-teams .tm-btn--danger,\
        #zero-inpanel-jersey .tm-btn--danger,\
        #teams-panel .tm-btn--danger { color: #fca5a5 !important; border-color: rgba(248,113,113,0.3) !important; }\
        #zero-inpanel-teams .tm-btn--kick,\
        #zero-inpanel-jersey .tm-btn--kick,\
        #teams-panel .tm-btn--kick { padding: 6px 10px; font-size: 11px; }\
        #zero-inpanel-teams .tm-feedback,\
        #zero-inpanel-jersey .tm-feedback,\
        #teams-panel .tm-feedback { font-size: 12px; margin: 10px 0 0; min-height: 1em; }\
        #zero-inpanel-teams .tm-feedback--center,\
        #zero-inpanel-jersey .tm-feedback--center,\
        #teams-panel .tm-feedback--center { text-align: center; }\
        #zero-inpanel-teams .tm-member,\
        #zero-inpanel-jersey .tm-member,\
        #teams-panel .tm-member {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            justify-content: space-between;\
            gap: 10px;\
            padding: 12px 0;\
            border-bottom: 1px solid rgba(255,255,255,0.06);\
        }\
        #zero-inpanel-teams .tm-member--browse,\
        #zero-inpanel-jersey .tm-member--browse,\
        #teams-panel .tm-member--browse {\
            justify-content: flex-start;\
            padding: 8px 0;\
            gap: 8px;\
        }\
        #zero-inpanel-teams .tm-admin-hint,\
        #zero-inpanel-jersey .tm-admin-hint,\
        #teams-panel .tm-admin-hint { margin: 0 0 14px !important; }\
        #zero-inpanel-teams .tm-adm,\
        #zero-inpanel-jersey .tm-adm,\
        #teams-panel .tm-adm {\
            display: flex;\
            flex-direction: column;\
            gap: 8px;\
        }\
        #zero-inpanel-teams .tm-adm-card,\
        #zero-inpanel-jersey .tm-adm-card,\
        #teams-panel .tm-adm-card {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            justify-content: space-between;\
            gap: 10px 12px;\
            padding: 11px 12px;\
            border-radius: 10px;\
            border: 1px solid rgba(255,255,255,0.07);\
            background: rgba(0,0,0,0.14);\
            box-sizing: border-box;\
        }\
        #zero-inpanel-teams .tm-adm-card__person,\
        #zero-inpanel-jersey .tm-adm-card__person,\
        #teams-panel .tm-adm-card__person {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            gap: 8px;\
            min-width: 0;\
            flex: 1;\
        }\
        #zero-inpanel-teams .tm-adm-card__controls,\
        #zero-inpanel-jersey .tm-adm-card__controls,\
        #teams-panel .tm-adm-card__controls {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            gap: 8px;\
            flex-shrink: 0;\
        }\
        #zero-inpanel-teams .tm-member:last-child,\
        #zero-inpanel-jersey .tm-member:last-child,\
        #teams-panel .tm-member:last-child { border-bottom: none; }\
        #zero-inpanel-teams .tm-member__row,\
        #zero-inpanel-jersey .tm-member__row,\
        #teams-panel .tm-member__row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0; }\
        #zero-inpanel-teams .tm-member__name,\
        #zero-inpanel-jersey .tm-member__name,\
        #teams-panel .tm-member__name { word-break: break-word; display: inline-flex; align-items: center; gap: 6px; }\
        #zero-inpanel-teams .tm-member__actions,\
        #zero-inpanel-jersey .tm-member__actions,\
        #teams-panel .tm-member__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }\
        #zero-inpanel-teams .tm-dot,\
        #zero-inpanel-jersey .tm-dot,\
        #teams-panel .tm-dot {\
            width: 7px;\
            height: 7px;\
            border-radius: 50%;\
            background: #3f3f46;\
            flex-shrink: 0;\
            display: inline-block;\
        }\
        #zero-inpanel-teams .tm-dot--on,\
        #zero-inpanel-jersey .tm-dot--on,\
        #teams-panel .tm-dot--on { background: #4ade80; }\
        #zero-inpanel-teams .tm-tag,\
        #zero-inpanel-jersey .tm-tag,\
        #teams-panel .tm-tag {\
            font-size: 10px;\
            font-weight: 600;\
            text-transform: uppercase;\
            letter-spacing: 0.04em;\
            padding: 2px 7px;\
            border-radius: 4px;\
            border: 1px solid rgba(255,255,255,0.12);\
            color: #a1a1aa;\
        }\
        #zero-inpanel-teams .tm-tag--owner,\
        #zero-inpanel-jersey .tm-tag--owner,\
        #teams-panel .tm-tag--owner { color: #fbbf24; border-color: rgba(251,191,36,0.35); }\
        #zero-inpanel-teams .tm-tag--mod,\
        #zero-inpanel-jersey .tm-tag--mod,\
        #teams-panel .tm-tag--mod { color: #93c5fd; border-color: rgba(147,197,253,0.35); }\
        #zero-inpanel-teams .tm-select,\
        #zero-inpanel-jersey .tm-select,\
        #teams-panel .tm-select {\
            box-sizing: border-box;\
            padding: 7px 30px 7px 10px;\
            border-radius: 8px;\
            border: 1px solid rgba(255,255,255,0.14);\
            background-color: rgba(30,30,30,0.95);\
            background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a1a1aa%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E");\
            background-repeat: no-repeat;\
            background-position: right 8px center;\
            color: #f4f4f5;\
            font-size: 12px;\
            cursor: pointer;\
            outline: none;\
            appearance: none;\
            -webkit-appearance: none;\
            transition: border-color 0.15s, box-shadow 0.15s;\
        }\
        #zero-inpanel-teams .tm-select:hover,\
        #zero-inpanel-jersey .tm-select:hover,\
        #teams-panel .tm-select:hover { border-color: rgba(255,255,255,0.22); }\
        #zero-inpanel-teams .tm-select:focus,\
        #zero-inpanel-jersey .tm-select:focus,\
        #teams-panel .tm-select:focus {\
            border-color: #2563eb;\
            box-shadow: 0 0 0 2px rgba(37,99,235,0.35);\
        }\
        #zero-inpanel-jersey select.tm-input {\
            box-sizing: border-box;\
            padding: 7px 30px 7px 10px;\
            border-radius: 8px;\
            border: 1px solid rgba(255,255,255,0.14);\
            background-color: rgba(30,30,30,0.95);\
            background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a1a1aa%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E");\
            background-repeat: no-repeat;\
            background-position: right 8px center;\
            color: #f4f4f5;\
            font-size: 12px;\
            cursor: pointer;\
            outline: none;\
            appearance: none;\
            -webkit-appearance: none;\
        }\
        #zero-inpanel-jersey select.tm-input:focus {\
            border-color: #2563eb;\
            box-shadow: 0 0 0 2px rgba(37,99,235,0.35);\
        }\
        #zero-inpanel-teams .tm-invwrap,\
        #zero-inpanel-jersey .tm-invwrap,\
        #teams-panel .tm-invwrap { margin-bottom: 16px; }\
        #zero-inpanel-teams .tm-invcard,\
        #zero-inpanel-jersey .tm-invcard,\
        #teams-panel .tm-invcard {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            justify-content: space-between;\
            gap: 12px;\
            padding: 12px 0;\
            border-bottom: 1px solid rgba(255,255,255,0.06);\
        }\
        #zero-inpanel-teams .tm-invcard:last-child,\
        #zero-inpanel-jersey .tm-invcard:last-child,\
        #teams-panel .tm-invcard:last-child { border-bottom: none; }\
        #zero-inpanel-teams .tm-invcard__title,\
        #zero-inpanel-jersey .tm-invcard__title,\
        #teams-panel .tm-invcard__title { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #fafafa; }\
        #zero-inpanel-teams .tm-invcard__sub,\
        #zero-inpanel-jersey .tm-invcard__sub,\
        #teams-panel .tm-invcard__sub { margin: 0; font-size: 12px; color: #a1a1aa; }\
        #zero-inpanel-teams .tm-invcard__btns,\
        #zero-inpanel-jersey .tm-invcard__btns,\
        #teams-panel .tm-invcard__btns { display: flex; gap: 8px; flex-shrink: 0; }\
        #zero-inpanel-teams .tm-linkcard,\
        #zero-inpanel-jersey .tm-linkcard,\
        #teams-panel .tm-linkcard {\
            margin: 0 0 20px;\
            padding: 14px 0 18px;\
            border-bottom: 1px solid rgba(255,255,255,0.08);\
        }\
        #zero-inpanel-teams .tm-link-actions,\
        #zero-inpanel-jersey .tm-link-actions,\
        #teams-panel .tm-link-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }\
        #zero-inpanel-teams .tm-token-row,\
        #zero-inpanel-jersey .tm-token-row,\
        #teams-panel .tm-token-row,\
        #teams-content .tm-token-row { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; }\
        #zero-inpanel-teams .tm-token-row .tm-input,\
        #zero-inpanel-jersey .tm-token-row .tm-input,\
        #teams-panel .tm-token-row .tm-input,\
        #teams-content .tm-token-row .tm-input { flex: 1; min-width: 0; }\
        #zero-inpanel-teams .tm-input--mono,\
        #zero-inpanel-jersey .tm-input--mono,\
        #teams-panel .tm-input--mono,\
        #teams-content .tm-input--mono {\
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\
            font-size: 12px;\
            letter-spacing: 0.02em;\
        }\
        #zero-inpanel-teams .tm-details,\
        #zero-inpanel-jersey .tm-details,\
        #teams-panel .tm-details {\
            margin-top: 8px;\
            border-radius: 10px;\
            border: 1px solid rgba(255,255,255,0.08);\
            background: rgba(255,255,255,0.02);\
            overflow: hidden;\
        }\
        #zero-inpanel-teams .tm-details__sum,\
        #zero-inpanel-jersey .tm-details__sum,\
        #teams-panel .tm-details__sum {\
            padding: 12px 14px;\
            cursor: pointer;\
            font-size: 12px;\
            font-weight: 500;\
            color: #d4d4d8;\
            list-style: none;\
        }\
        #zero-inpanel-teams .tm-details__sum::-webkit-details-marker,\
        #zero-inpanel-jersey .tm-details__sum::-webkit-details-marker,\
        #teams-panel .tm-details__sum::-webkit-details-marker { display: none; }\
        #zero-inpanel-teams .tm-details__body,\
        #zero-inpanel-jersey .tm-details__body,\
        #teams-panel .tm-details__body { padding: 0 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); }\
        #zero-inpanel-teams .tm-joinbox,\
        #zero-inpanel-jersey .tm-joinbox,\
        #teams-panel .tm-joinbox,\
        #teams-content .tm-joinbox {\
            margin: 16px 4px 20px;\
            padding: 14px 12px 16px;\
            border-radius: 10px;\
            border: 1px solid rgba(255,255,255,0.08);\
            background: rgba(255,255,255,0.03);\
            box-sizing: border-box;\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-shell,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-shell,\
        html[data-theme="light"] #teams-panel .tm-shell { color: #18181b; }\
        html[data-theme="light"] #zero-inpanel-teams .tm-title,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-title,\
        html[data-theme="light"] #teams-panel .tm-title { color: #09090b; }\
        html[data-theme="light"] #zero-inpanel-teams .tm-input,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-input,\
        html[data-theme="light"] #teams-panel .tm-input {\
            background: #fff;\
            border-color: #e4e4e7;\
            color: #09090b;\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-chatpane,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-chatpane,\
        html[data-theme="light"] #teams-panel .tm-chatpane {\
            border-color: #e4e4e7;\
            background: #f6f7f9;\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-chatpane__side,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-chatpane__side,\
        html[data-theme="light"] #teams-panel .tm-chatpane__side {\
            background: rgba(0,0,0,0.03);\
            border-right-color: #e7e8ec;\
            color: #52525b;\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-chatpane__msgs,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-chatpane__msgs,\
        html[data-theme="light"] #teams-panel .tm-chatpane__msgs { background: transparent; }\
        html[data-theme="light"] #zero-inpanel-teams .tm-msg:hover,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-msg:hover,\
        html[data-theme="light"] #teams-panel .tm-msg:hover { background: rgba(0,0,0,0.035); }\
        html[data-theme="light"] #zero-inpanel-teams .tm-msg__text,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-msg__text,\
        html[data-theme="light"] #teams-panel .tm-msg__text { color: #27272a; }\
        html[data-theme="light"] #zero-inpanel-teams .tm-msg__who,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-msg__who,\
        html[data-theme="light"] #teams-panel .tm-msg__who { color: #09090b; }\
        html[data-theme="light"] #zero-inpanel-teams .tm-msg__time,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-msg__time,\
        html[data-theme="light"] #teams-panel .tm-msg__time { color: #71717a; }\
        html[data-theme="light"] #zero-inpanel-teams .tm-chatcomposer__shell,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-chatcomposer__shell,\
        html[data-theme="light"] #teams-panel .tm-chatcomposer__shell {\
            background: #ebecee;\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-input.tm-input--chat,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-input.tm-input--chat,\
        html[data-theme="light"] #teams-panel .tm-input.tm-input--chat {\
            color: #18181b;\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-chatpane__send.tm-chatcomposer,\
        html[data-theme="light"] #zero-inpanel-jersey .tm-chatpane__send.tm-chatcomposer,\
        html[data-theme="light"] #teams-panel .tm-chatpane__send.tm-chatcomposer {\
            border-top-color: #e7e8ec;\
            background: rgba(255,255,255,0.55);\
        }\
        html[data-theme="light"] #zero-inpanel-teams .tm-adm-card,\
        html[data-theme="light"] #teams-panel .tm-adm-card {\
            background: rgba(0,0,0,0.03);\
            border-color: #e4e4e7;\
        }\
        /* Panel mi equipo (hero, tarjetas, invitar con rango, roster) */\
        #teams-content .ztp-root {\
            padding: 4px 2px 20px;\
            box-sizing: border-box;\
        }\
        #teams-content .ztp-hero {\
            display: flex;\
            gap: 14px;\
            align-items: center;\
            padding: 16px 16px 18px;\
            margin-bottom: 14px;\
            border-radius: 14px;\
            background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, transparent 100%),\
                var(--theme-bg-secondary, #1a1a1a);\
            border: 1px solid var(--theme-border-light, #2e2e2e);\
            box-shadow: 0 8px 28px rgba(0,0,0,0.35);\
        }\
        #teams-content .ztp-hero__logo {\
            flex-shrink: 0;\
            width: 56px;\
            height: 56px;\
            border-radius: 14px;\
            overflow: hidden;\
            border: 2px solid rgba(255,255,255,0.08);\
            background: #0d0d0d;\
        }\
        #teams-content .ztp-hero__logo img {\
            width: 100%;\
            height: 100%;\
            object-fit: cover;\
            display: block;\
        }\
        #teams-content .ztp-hero__meta {\
            flex: 1;\
            min-width: 0;\
        }\
        #teams-content .ztp-hero__title {\
            color: var(--theme-text-primary, #fff);\
            font-size: 17px;\
            font-weight: 700;\
            letter-spacing: -0.02em;\
            line-height: 1.2;\
            margin: 0 0 6px 0;\
        }\
        #teams-content .ztp-hero__sub {\
            color: var(--theme-text-muted, #737373);\
            font-size: 12px;\
            margin: 0;\
            display: flex;\
            align-items: center;\
            gap: 8px;\
            flex-wrap: wrap;\
        }\
        #teams-content .ztp-chip {\
            display: inline-flex;\
            align-items: center;\
            padding: 3px 10px;\
            border-radius: 999px;\
            font-size: 11px;\
            font-weight: 700;\
            letter-spacing: 0.04em;\
            border: 1px solid rgba(255,255,255,0.12);\
            color: #e5e5e5;\
            background: rgba(0,0,0,0.35);\
        }\
        #teams-content .ztp-card {\
            margin-bottom: 12px;\
            padding: 14px 14px 16px;\
            border-radius: 12px;\
            background: var(--theme-bg-secondary, #1a1a1a);\
            border: 1px solid var(--theme-border, #232323);\
        }\
        #teams-content .ztp-card__head {\
            display: flex;\
            align-items: center;\
            justify-content: space-between;\
            gap: 10px;\
            margin-bottom: 12px;\
            padding-bottom: 10px;\
            border-bottom: 1px solid var(--theme-border, #232323);\
        }\
        #teams-content .ztp-card__title {\
            margin: 0;\
            font-size: 11px;\
            font-weight: 700;\
            text-transform: uppercase;\
            letter-spacing: 0.08em;\
            color: var(--theme-text-secondary, #888);\
        }\
        #teams-content .ztp-card__hint {\
            margin: 0 0 12px 0;\
            font-size: 12px;\
            line-height: 1.45;\
            color: var(--theme-text-muted, #737373);\
        }\
        #teams-content .ztp-label {\
            display: block;\
            font-size: 10px;\
            font-weight: 600;\
            text-transform: uppercase;\
            letter-spacing: 0.06em;\
            color: var(--theme-text-muted, #666);\
            margin: 0 0 6px 0;\
        }\
        #teams-content .ztp-input {\
            width: 100%;\
            box-sizing: border-box;\
            padding: 10px 12px;\
            border-radius: 10px;\
            border: 1px solid var(--theme-border-light, #333);\
            background: var(--theme-bg-tertiary, #141414);\
            color: var(--theme-text-primary, #fff);\
            font-size: 13px;\
            font-family: inherit;\
            outline: none;\
        }\
        #teams-content .ztp-input:focus {\
            border-color: #3b82f6;\
            box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.35);\
        }\
        #teams-content .ztp-row {\
            display: flex;\
            gap: 10px;\
            align-items: stretch;\
            margin-bottom: 12px;\
        }\
        #teams-content .ztp-row > * { flex: 1; min-width: 0; }\
        #teams-content .ztp-pill-wrap {\
            display: flex;\
            gap: 8px;\
            margin-bottom: 12px;\
        }\
        #teams-content .ztp-pill {\
            flex: 1;\
            padding: 10px 8px;\
            border-radius: 10px;\
            border: 1px solid var(--theme-border-light, #333);\
            background: var(--theme-bg-tertiary, #141414);\
            color: var(--theme-text-secondary, #a3a3a3);\
            font-size: 12px;\
            font-weight: 600;\
            font-family: inherit;\
            cursor: pointer;\
            transition: background 0.15s, border-color 0.15s, color 0.15s;\
        }\
        #teams-content .ztp-pill:hover {\
            color: var(--theme-text-primary, #fff);\
            border-color: #444;\
        }\
        #teams-content .ztp-pill.is-active {\
            background: rgba(59, 130, 246, 0.15);\
            border-color: rgba(59, 130, 246, 0.55);\
            color: #93c5fd;\
        }\
        #teams-content .ztp-btn-primary {\
            width: 100%;\
            padding: 11px 14px;\
            border: none;\
            border-radius: 10px;\
            background: linear-gradient(180deg, #3b82f6, #2563eb);\
            color: #fff;\
            font-size: 13px;\
            font-weight: 700;\
            font-family: inherit;\
            cursor: pointer;\
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);\
        }\
        #teams-content .ztp-btn-primary:hover {\
            filter: brightness(1.06);\
        }\
        #teams-content .ztp-btn-primary:disabled {\
            opacity: 0.55;\
            cursor: not-allowed;\
            filter: none;\
        }\
        #teams-content .ztp-btn-ghost {\
            padding: 8px 12px;\
            border-radius: 8px;\
            border: 1px solid var(--theme-border-light, #333);\
            background: transparent;\
            color: var(--theme-text-secondary, #a3a3a3);\
            font-size: 12px;\
            font-family: inherit;\
            cursor: pointer;\
        }\
        #teams-content .ztp-btn-ghost:hover {\
            color: #fff;\
            border-color: #555;\
        }\
        #teams-content .ztp-status {\
            font-size: 12px;\
            min-height: 18px;\
            margin: 8px 0 0 0;\
            text-align: center;\
        }\
        #teams-content .ztp-member {\
            display: flex;\
            align-items: center;\
            gap: 10px;\
            padding: 11px 12px;\
            margin-bottom: 8px;\
            border-radius: 10px;\
            background: rgba(0,0,0,0.25);\
            border: 1px solid var(--theme-border, #262626);\
        }\
        #teams-content .ztp-member:last-child { margin-bottom: 0; }\
        #teams-content .ztp-member__name {\
            flex: 1;\
            min-width: 0;\
            color: var(--theme-text-primary, #fff);\
            font-size: 13px;\
            font-weight: 500;\
        }\
        #teams-content .ztp-member__actions {\
            display: flex;\
            align-items: center;\
            gap: 8px;\
            flex-shrink: 0;\
        }\
        #teams-content .ztp-role-select {\
            padding: 6px 8px;\
            border-radius: 8px;\
            border: 1px solid var(--theme-border-light, #333);\
            background: var(--theme-bg-primary, #111);\
            color: #e5e5e5;\
            font-size: 11px;\
            font-family: inherit;\
            cursor: pointer;\
            max-width: 118px;\
        }\
        #teams-content .ztp-badge {\
            font-size: 10px;\
            font-weight: 700;\
            text-transform: uppercase;\
            letter-spacing: 0.05em;\
            padding: 3px 8px;\
            border-radius: 999px;\
            border: 1px solid rgba(255,255,255,0.1);\
            white-space: nowrap;\
        }\
        #teams-content .ztp-badge--owner {\
            color: #fdba74;\
            background: rgba(251, 146, 60, 0.12);\
            border-color: rgba(251, 146, 60, 0.35);\
        }\
        #teams-content .ztp-badge--mod {\
            color: #a5b4fc;\
            background: rgba(99, 102, 241, 0.15);\
            border-color: rgba(129, 140, 248, 0.4);\
        }\
        #teams-content .ztp-badge--member {\
            color: #a3a3a3;\
            background: rgba(255,255,255,0.04);\
        }\
        #teams-content .ztp-danger {\
            margin-top: 6px;\
            padding-top: 4px;\
        }\
        #teams-content .ztp-btn-danger {\
            width: 100%;\
            padding: 11px;\
            border-radius: 10px;\
            border: 1px solid rgba(248, 113, 113, 0.35);\
            background: rgba(248, 113, 113, 0.08);\
            color: #fca5a5;\
            font-size: 13px;\
            font-weight: 600;\
            font-family: inherit;\
            cursor: pointer;\
        }\
        #teams-content .ztp-btn-danger:hover {\
            background: rgba(248, 113, 113, 0.14);\
        }\
        #teams-content .ztp-inv-card {\
            background: linear-gradient(160deg, rgba(59, 130, 246, 0.08), transparent 55%),\
                var(--theme-bg-secondary, #1a1a1a);\
            border-color: rgba(59, 130, 246, 0.22);\
        }\
        #teams-content .ztp-inv-pending {\
            margin-top: 10px;\
            padding-top: 12px;\
            border-top: 1px dashed var(--theme-border, #333);\
        }\
        #teams-content .ztp-inv-row {\
            display: flex;\
            align-items: center;\
            gap: 10px;\
            flex-wrap: wrap;\
            padding: 10px 12px;\
            margin-bottom: 8px;\
            border-radius: 10px;\
            background: rgba(0,0,0,0.2);\
            border: 1px solid var(--theme-border, #2a2a2a);\
        }\
        #teams-content .ztp-inv-row:last-child { margin-bottom: 0; }\
        #teams-content .ztp-inv-row__meta { flex: 1; min-width: 140px; }\
        #teams-content .ztp-inv-row__title {\
            color: #fff;\
            font-size: 13px;\
            font-weight: 600;\
            margin: 0 0 4px 0;\
        }\
        #teams-content .ztp-inv-row__sub {\
            color: var(--theme-text-muted, #737373);\
            font-size: 11px;\
            margin: 0;\
        }\
        #teams-content .ztp-inv-actions { display: flex; gap: 8px; flex-shrink: 0; }\
        #teams-content .ztp-inv-btn-ok {\
            padding: 7px 14px;\
            border: none;\
            border-radius: 8px;\
            background: #22c55e;\
            color: #fff;\
            font-size: 12px;\
            font-weight: 700;\
            font-family: inherit;\
            cursor: pointer;\
        }\
        #teams-content .ztp-inv-btn-no {\
            padding: 7px 12px;\
            border: 1px solid var(--theme-border-light, #333);\
            border-radius: 8px;\
            background: transparent;\
            color: var(--theme-text-secondary, #a3a3a3);\
            font-size: 12px;\
            font-family: inherit;\
            cursor: pointer;\
        }\
        .roomlist-view .dialog.zero-pro-mode #sidebar-panel,\
        .roomlist-view .dialog.zero-kit-mode #sidebar-panel {\
            display: flex !important;\
            flex-direction: column !important;\
            width: 50px !important;\
            min-width: 50px !important;\
            max-width: 50px !important;\
            box-sizing: border-box !important;\
            flex-shrink: 0 !important;\
        }\
        #zero-inpanel-profile .zip-login-wall {\
            display: none;\
            flex: 1;\
            align-items: center;\
            justify-content: center;\
            padding: 20px;\
            text-align: center;\
            background: rgba(17, 17, 17, 0.96);\
            border-radius: var(--zip-r);\
            border: 1px solid var(--zip-border);\
            min-height: 280px;\
        }\
        #zero-inpanel-profile .zip-login-card { max-width: 380px; }\
        #zero-inpanel-profile .zip-login-h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; }\
        #zero-inpanel-profile .zip-login-p { color: var(--zip-muted); font-size: 13px; line-height: 1.5; margin: 0 0 16px 0; }\
        #zero-inpanel-profile .zip-login-btn {\
            padding: 10px 20px;\
            border-radius: 4px;\
            border: none;\
            background: var(--zip-discord);\
            color: #fff;\
            font-weight: 700;\
            cursor: pointer;\
            font-size: 13px;\
        }\
        #zero-inpanel-profile .zip-login-btn:hover { background: #4752c4; }\
        #zero-inpanel-profile .zip-login-pro-btn {\
            width: 100%;\
            margin-top: 10px;\
            padding: 10px 14px;\
            border-radius: 6px;\
            border: 1px solid rgba(99,102,241,0.45);\
            background: rgba(99,102,241,0.12);\
            color: #c7d2fe;\
            font-weight: 700;\
            font-size: 12px;\
            letter-spacing: 0.06em;\
            cursor: pointer;\
            display: flex;\
            align-items: center;\
            justify-content: center;\
            gap: 8px;\
        }\
        #zero-inpanel-profile .zip-login-pro-btn:hover { background: rgba(99,102,241,0.22); color: #e0e7ff; }\
        #zero-inpanel-profile .zip-login-pro-ic { display: inline-flex; color: #c7d2fe; flex-shrink: 0; }\
        #zero-inpanel-profile .zip-login-pro-txt { font-size: 12px; letter-spacing: 0.06em; }\
        #zero-inpanel-profile .zip-main-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; }\
        #zero-inpanel-profile .zip-toolbar {\
            display: flex;\
            align-items: center;\
            gap: 10px;\
            padding: 0 0 10px 0;\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-back-btn {\
            width: 34px; height: 34px;\
            border-radius: 6px;\
            border: 1px solid var(--zip-border);\
            background: var(--zip-btn);\
            color: #fff;\
            cursor: pointer;\
            font-size: 16px;\
            line-height: 1;\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-back-btn:hover { background: var(--zip-btn-hover); }\
        #zero-inpanel-profile .zip-toolbar-mid {\
            flex: 1;\
            min-width: 0;\
        }\
        #zero-inpanel-profile .zip-pro-btn {\
            flex-shrink: 0;\
            min-width: 52px;\
            height: 34px;\
            padding: 0 10px;\
            border-radius: 6px;\
            border: 1px solid rgba(99,102,241,0.5);\
            background: linear-gradient(135deg, rgba(79,70,229,0.35), rgba(99,102,241,0.25));\
            color: #e0e7ff;\
            font-size: 11px;\
            font-weight: 800;\
            letter-spacing: 0.08em;\
            cursor: pointer;\
        }\
        #zero-inpanel-profile .zip-pro-btn-icon {\
            min-width: 34px;\
            width: 34px;\
            padding: 0;\
            display: inline-flex;\
            align-items: center;\
            justify-content: center;\
        }\
        #zero-inpanel-profile .zip-pro-btn-icon svg { display: block; }\
        #zero-inpanel-profile .zip-pro-btn:hover {\
            background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(129,140,248,0.35));\
            border-color: rgba(129,140,248,0.65);\
        }\
        #zero-inpanel-profile .zip-toolbar-spacer { display: none; }\
        #zero-inpanel-profile .zip-card {\
            flex: 1;\
            min-height: 0;\
            display: flex;\
            flex-direction: column;\
            background: var(--zip-card);\
            border: 1px solid var(--zip-border);\
            border-radius: var(--zip-r);\
            overflow: hidden;\
        }\
        #zero-inpanel-profile .zip-card-title {\
            text-align: center;\
            font-size: 16px;\
            font-weight: 700;\
            padding: 12px 14px 10px;\
            border-bottom: 1px solid var(--zip-border);\
            margin: 0;\
        }\
        #zero-inpanel-profile .zip-profile-zero {\
            flex: 1;\
            min-height: 0;\
            overflow: auto;\
            padding: 4px 2px 16px;\
        }\
        #zero-inpanel-profile .zip-profile-h2 {\
            font-size: 24px;\
            font-weight: 700;\
            letter-spacing: -0.03em;\
            color: #fff;\
            margin: 0 0 6px;\
        }\
        #zero-inpanel-profile .zip-profile-lead {\
            font-size: 14px;\
            color: var(--zip-muted);\
            line-height: 1.5;\
            margin: 0 0 24px;\
            max-width: 520px;\
        }\
        #zero-inpanel-profile .zip-list-block + .zip-list-block { margin-top: 24px; }\
        #zero-inpanel-profile .zip-section-title {\
            font-size: 11px;\
            font-weight: 700;\
            letter-spacing: 0.08em;\
            text-transform: uppercase;\
            color: var(--zip-muted);\
            margin: 0 0 12px;\
        }\
        #zero-inpanel-profile .zip-zero-list {\
            border: 1px solid var(--zip-border);\
            border-radius: 10px;\
            overflow: hidden;\
            background: var(--zip-card);\
        }\
        #zero-inpanel-profile .zip-zero-row {\
            display: flex;\
            align-items: center;\
            justify-content: space-between;\
            gap: 20px;\
            padding: 16px 18px;\
            border-bottom: 1px solid var(--zip-border);\
            background: var(--zip-inset);\
        }\
        #zero-inpanel-profile .zip-zero-row:last-child { border-bottom: none; }\
        #zero-inpanel-profile .zip-row-label {\
            font-size: 13px;\
            font-weight: 600;\
            color: #fff;\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-row-hint {\
            font-size: 13px;\
            color: var(--zip-muted);\
            text-align: right;\
            word-break: break-word;\
        }\
        #zero-inpanel-profile .zip-profile-identity-row {\
            justify-content: flex-start;\
            gap: 16px;\
            padding: 18px;\
        }\
        #zero-inpanel-profile .zip-profile-meta {\
            min-width: 0;\
            flex: 1;\
        }\
        #zero-inpanel-profile .zip-profile-name-row {\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            gap: 8px;\
        }\
        #zero-inpanel-profile .zip-profile-avatar-wrap {\
            position: relative;\
            flex-shrink: 0;\
            width: 56px;\
            height: 56px;\
        }\
        #zero-inpanel-profile .zip-profile-avatar-wrap img {\
            width: 56px;\
            height: 56px;\
            border-radius: 10px;\
            object-fit: cover;\
            border: 1px solid var(--zip-border);\
            display: block;\
        }\
        #zero-inpanel-profile .zip-avatar-fb {\
            width: 56px;\
            height: 56px;\
            border-radius: 10px;\
            display: flex;\
            align-items: center;\
            justify-content: center;\
            font-size: 18px;\
            font-weight: 700;\
            color: #fff;\
            background: var(--zip-inset);\
            border: 1px solid var(--zip-border);\
        }\
        #zero-inpanel-profile .zip-dot {\
            position: absolute;\
            bottom: -2px;\
            right: -2px;\
            width: 11px;\
            height: 11px;\
            border-radius: 50%;\
            background: #4ade80;\
            border: 2px solid var(--zip-inset);\
            box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.35);\
        }\
        #zero-inpanel-profile .zip-profile-name-row .zip-name {\
            font-size: 18px;\
            font-weight: 700;\
            letter-spacing: -0.03em;\
            word-break: break-word;\
            color: #fff;\
        }\
        #zero-inpanel-profile .zip-pp-handle {\
            margin: 4px 0 0;\
            font-size: 13px;\
            color: var(--zip-muted);\
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\
        }\
        #zero-inpanel-profile .zip-tier {\
            display: inline-block;\
            padding: 2px 8px;\
            border-radius: 999px;\
            font-size: 10px;\
            font-weight: 700;\
            letter-spacing: 0.06em;\
            text-transform: uppercase;\
            vertical-align: middle;\
        }\
        #zero-inpanel-profile .zip-tier--pro {\
            color: #1a1200;\
            background: linear-gradient(135deg, #ffd76a, #ffb347);\
        }\
        #zero-inpanel-profile .zip-tier--vip {\
            color: #fef3c7;\
            background: rgba(245, 158, 11, 0.2);\
            border: 1px solid rgba(251, 191, 36, 0.35);\
        }\
        #zero-inpanel-profile .zip-tier--default {\
            color: var(--zip-muted);\
            background: var(--zip-card);\
            border: 1px solid var(--zip-border);\
        }\
        #zero-inpanel-profile .zip-meta-list .zip-kv span {\
            display: block;\
            font-size: 11px;\
            letter-spacing: 0.06em;\
            text-transform: uppercase;\
            color: var(--zip-muted);\
        }\
        #zero-inpanel-profile .zip-meta-list .zip-kv strong {\
            display: block;\
            margin-top: 3px;\
            font-size: 14px;\
            font-weight: 500;\
            color: #fff;\
            word-break: break-word;\
        }\
        #zero-inpanel-profile .zip-columns {\
            display: grid;\
            grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr) minmax(0, 1fr);\
            flex: 1;\
            min-height: 0;\
            overflow: auto;\
        }\
        @media (max-width: 780px) {\
            #zero-inpanel-profile .zip-columns { grid-template-columns: 1fr; }\
        }\
        #zero-inpanel-profile .zip-col {\
            display: flex;\
            flex-direction: column;\
            min-height: 0;\
            border-right: 1px solid var(--zip-border);\
        }\
        #zero-inpanel-profile .zip-col:last-child { border-right: none; }\
        #zero-inpanel-profile .zip-col-main { min-height: 200px; }\
        #zero-inpanel-profile .zip-col-head {\
            padding: 8px 10px;\
            border-bottom: 1px solid var(--zip-border);\
            background: var(--zip-inset);\
            font-size: 10px;\
            font-weight: 700;\
            letter-spacing: 0.06em;\
            text-transform: uppercase;\
            color: var(--zip-muted);\
            display: flex;\
            align-items: center;\
            justify-content: space-between;\
            gap: 6px;\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-col-head strong { color: #fff; }\
        #zero-inpanel-profile .zip-badge-live {\
            font-size: 10px;\
            font-weight: 600;\
            color: var(--zip-green);\
            padding: 3px 6px;\
            border-radius: 999px;\
            background: var(--zip-green-soft);\
            border: 1px solid rgba(46, 230, 109, 0.22);\
        }\
        #zero-inpanel-profile .zip-rank {\
            display: flex;\
            align-items: center;\
            gap: 12px;\
            padding: 12px 12px;\
            border-bottom: 1px solid var(--zip-border);\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-ring {\
            width: 64px; height: 64px;\
            border-radius: 50%;\
            flex-shrink: 0;\
            display: flex;\
            flex-direction: column;\
            align-items: center;\
            justify-content: center;\
            background: var(--zip-inset);\
            border: 2px solid var(--zip-border);\
        }\
        #zero-inpanel-profile .zip-lvl { font-size: 22px; font-weight: 700; line-height: 1; }\
        #zero-inpanel-profile .zip-xp { font-size: 10px; color: var(--zip-muted); margin-top: 2px; }\
        #zero-inpanel-profile .zip-tier { font-size: 17px; font-weight: 700; line-height: 1.15; }\
        #zero-inpanel-profile .zip-tier-sub { margin-top: 4px; font-size: 12px; color: var(--zip-muted); }\
        #zero-inpanel-profile .zip-id {\
            display: flex;\
            align-items: center;\
            gap: 12px;\
            padding: 12px;\
            border-bottom: 1px solid var(--zip-border);\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-id img {\
            width: 48px; height: 48px;\
            border-radius: var(--zip-rsm);\
            object-fit: cover;\
            background: var(--zip-inset);\
            border: 1px solid rgba(46, 230, 109, 0.35);\
        }\
        #zero-inpanel-profile .zip-name { font-size: 15px; font-weight: 700; word-break: break-word; }\
        #zero-inpanel-profile .zip-tag { margin-top: 2px; font-size: 10px; font-weight: 600; color: var(--zip-muted); letter-spacing: 0.1em; }\
        #zero-inpanel-profile .zip-team-line { margin-top: 4px; font-size: 11px; color: var(--zip-green); font-weight: 600; }\
        #zero-inpanel-profile .zip-block { padding: 10px 12px; border-bottom: 1px solid var(--zip-border); flex-shrink: 0; }\
        #zero-inpanel-profile .zip-row-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }\
        #zero-inpanel-profile .zip-row-label > span { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; color: var(--zip-muted); text-transform: uppercase; }\
        #zero-inpanel-profile .zip-pills { display: flex; gap: 5px; }\
        #zero-inpanel-profile .zip-pill { min-width: 30px; padding: 4px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; text-align: center; }\
        #zero-inpanel-profile .zip-pill-g { background: var(--zip-green-soft); color: var(--zip-green); border: 1px solid rgba(46, 230, 109, 0.2); }\
        #zero-inpanel-profile .zip-pill-r { background: var(--zip-red-soft); color: var(--zip-red); }\
        #zero-inpanel-profile .zip-bars { display: flex; gap: 2px; margin-bottom: 8px; height: 3px; }\
        #zero-inpanel-profile .zip-bars i { flex: 1; max-width: 22px; border-radius: 1px; background: var(--zip-inset); }\
        #zero-inpanel-profile .zip-kv { display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; font-size: 12px; border-top: 1px solid var(--zip-border); }\
        #zero-inpanel-profile .zip-kv:first-of-type { border-top: none; padding-top: 0; }\
        #zero-inpanel-profile .zip-kv span { color: var(--zip-muted); }\
        #zero-inpanel-profile .zip-kv strong { font-weight: 600; color: #fff; }\
        #zero-inpanel-profile .zip-kv strong.zip-delta { color: var(--zip-green); }\
        #zero-inpanel-profile .zip-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }\
        #zero-inpanel-profile .zip-stat-grid-sub { margin-top: 6px; }\
        #zero-inpanel-profile .zip-stat { text-align: center; padding: 8px 4px; border-radius: var(--zip-rsm); background: var(--zip-inset); border: 1px solid var(--zip-border); }\
        #zero-inpanel-profile .zip-stat .zip-n { font-size: 14px; font-weight: 700; display: block; color: #fff; }\
        #zero-inpanel-profile .zip-stat--sm .zip-n, #zero-inpanel-profile .zip-st-sm .zip-n { font-size: 12px; }\
        #zero-inpanel-profile .zip-stat .zip-lbl { display: block; margin-top: 4px; font-size: 9px; font-weight: 600; color: var(--zip-muted); letter-spacing: 0.04em; text-transform: uppercase; }\
        #zero-inpanel-profile .zip-btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px; }\
        #zero-inpanel-profile .zip-btn-flat {\
            padding: 8px 10px;\
            border-radius: 4px;\
            border: none;\
            background: var(--zip-btn);\
            color: #fff;\
            font-size: 11px;\
            font-weight: 600;\
            cursor: pointer;\
        }\
        #zero-inpanel-profile .zip-btn-flat:hover { background: var(--zip-btn-hover); }\
        #zero-inpanel-profile .zip-footer {\
            margin-top: auto;\
            display: flex;\
            flex-wrap: wrap;\
            align-items: center;\
            justify-content: space-between;\
            gap: 8px;\
            padding: 10px 12px;\
            border-top: 1px solid var(--zip-border);\
            background: var(--zip-inset);\
            flex-shrink: 0;\
        }\
        #zero-inpanel-profile .zip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--zip-green); box-shadow: 0 0 6px rgba(46, 230, 109, 0.45); flex-shrink: 0; }\
        #zero-inpanel-profile .zip-online-txt { font-size: 12px; font-weight: 600; }\
        #zero-inpanel-profile .zip-room-txt { font-size: 12px; color: var(--zip-muted); }\
        #zero-inpanel-profile .zip-footer-cta { display: flex; gap: 6px; flex-shrink: 0; }\
        #zero-inpanel-profile .zip-btn-primary {\
            padding: 8px 14px;\
            border-radius: 4px;\
            border: 1px solid rgba(46, 230, 109, 0.35);\
            background: linear-gradient(180deg, rgba(46, 230, 109, 0.18), rgba(34, 197, 94, 0.08));\
            color: #fff;\
            font-weight: 700;\
            font-size: 11px;\
            cursor: pointer;\
        }\
        #zero-inpanel-profile .zip-btn-primary:hover {\
            background: linear-gradient(180deg, rgba(46, 230, 109, 0.28), rgba(34, 197, 94, 0.14));\
            border-color: rgba(46, 230, 109, 0.5);\
        }\
        #zero-inpanel-profile .zip-btn-secondary {\
            padding: 8px 12px;\
            border-radius: 4px;\
            border: none;\
            background: var(--zip-btn);\
            color: #fff;\
            font-weight: 600;\
            font-size: 11px;\
            cursor: pointer;\
        }\
        #zero-inpanel-profile .zip-btn-secondary:hover { background: var(--zip-btn-hover); }\
        #zero-inpanel-profile .zip-chat-body {\
            flex: 1;\
            min-height: 120px;\
            padding: 12px 10px;\
            font-size: 12px;\
            color: var(--zip-muted);\
            display: flex;\
            align-items: center;\
            justify-content: center;\
            text-align: center;\
            line-height: 1.45;\
        }\
        #zero-inpanel-profile .zip-chat-foot { padding: 8px 10px 10px; border-top: 1px solid var(--zip-border); flex-shrink: 0; }\
        #zero-inpanel-profile .zip-chat-row { display: flex; gap: 5px; }\
        #zero-inpanel-profile .zip-chat-row input {\
            flex: 1;\
            min-width: 0;\
            padding: 7px 10px;\
            border-radius: var(--zip-rsm);\
            border: 1px solid var(--zip-border);\
            background: var(--zip-input);\
            color: #fff;\
            font-size: 12px;\
        }\
        #zero-inpanel-profile .zip-send {\
            width: 34px;\
            flex-shrink: 0;\
            border-radius: var(--zip-rsm);\
            border: none;\
            background: var(--zip-btn);\
            color: var(--zip-muted);\
            cursor: not-allowed;\
            font-size: 12px;\
        }\
        #zero-inpanel-profile .zip-char { text-align: right; font-size: 10px; color: var(--zip-muted2); margin-top: 4px; }\
        #zero-inpanel-profile .zip-friends { flex: 1; min-height: 100px; padding: 0 10px 10px; overflow-y: auto; }\
        #zero-inpanel-profile .zip-friend-row { padding: 8px 0; border-bottom: 1px solid var(--zip-border); font-size: 12px; font-weight: 500; color: #fff; }\
        #zero-inpanel-profile .zip-empty { padding: 20px 8px; text-align: center; color: var(--zip-muted); font-size: 12px; }\
        #room-search-input { border: none !important; background: var(--theme-bg-tertiary) !important; color: var(--theme-text-primary) !important; }\
        #room-search-input:focus { border: none !important; outline: none !important; }\
        #country-filter-btn { background: var(--theme-bg-tertiary) !important; border: none !important; }\
        #country-filter-btn:hover { background: var(--theme-bg-hover) !important; }\
        #country-dropdown {\
            background: var(--theme-bg-secondary) !important;\
            border: 1px solid var(--theme-border-light) !important;\
            overflow-y: scroll !important;\
        }\
        #country-dropdown::-webkit-scrollbar { width: 8px !important; }\
        #country-dropdown::-webkit-scrollbar-track { background: var(--theme-scrollbar-track) !important; border-radius: 4px !important; }\
        #country-dropdown::-webkit-scrollbar-thumb { background: var(--theme-scrollbar-thumb) !important; border-radius: 4px !important; }\
        #country-dropdown::-webkit-scrollbar-thumb:hover { background: var(--theme-scrollbar-thumb-hover) !important; }\
        \
        /* Choose nickname: só esconde UI nativa depois do módulo Discord injetar o custom (evita retângulo vazio enquanto /user demora) */\
        .choose-nickname-view.hxd-zero-nickname-view {\
            background: radial-gradient(ellipse 80% 60% at 50% 100%, color-mix(in srgb, var(--theme-border-light, #333) 35%, transparent), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 20%, color-mix(in srgb, var(--theme-text-muted, #666) 18%, transparent), transparent 50%), linear-gradient(180deg, var(--theme-bg-tertiary, #272727) 0%, var(--theme-bg-primary, #141414) 58%, var(--theme-bg-primary, #141414) 100%) !important;\
            font-family: Inter, system-ui, sans-serif !important;\
            -webkit-font-smoothing: antialiased !important;\
        }\
        .choose-nickname-view .hxd-zero-native-logo {\
            display: none !important;\
        }\
        .choose-nickname-view .dialog.hxd-zero-native-auth {\
            width: min(340px, calc(100vw - 40px)) !important;\
            min-width: 0 !important;\
            max-width: min(340px, calc(100vw - 40px)) !important;\
            padding: 24px !important;\
            border-radius: 16px !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            background: color-mix(in srgb, var(--theme-bg-secondary, #1a1a1a) 86%, transparent) !important;\
            box-shadow: var(--shadow-soft, 0 20px 60px rgba(0,0,0,.35)) !important;\
            text-align: center !important;\
        }\
        .choose-nickname-view .dialog.hxd-zero-native-auth h1 {\
            margin: 0 0 14px !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font-size: 18px !important;\
            font-weight: 700 !important;\
            letter-spacing: -0.02em !important;\
        }\
        .choose-nickname-view .hxd-zero-native-field {\
            margin: 0 0 12px !important;\
            text-align: left !important;\
        }\
        .choose-nickname-view .hxd-zero-native-field label {\
            display: block !important;\
            margin: 0 0 7px !important;\
            color: var(--theme-text-muted, #666) !important;\
            font-size: 11px !important;\
            font-weight: 700 !important;\
            letter-spacing: .06em !important;\
            text-transform: uppercase !important;\
        }\
        .choose-nickname-view .hxd-zero-native-field input {\
            width: 100% !important;\
            height: 40px !important;\
            padding: 0 12px !important;\
            border-radius: 10px !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            background: var(--theme-bg-primary, #141414) !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font: inherit !important;\
            font-size: 13px !important;\
            outline: none !important;\
            box-shadow: none !important;\
        }\
        .choose-nickname-view .hxd-zero-native-btn {\
            width: 100% !important;\
            height: 40px !important;\
            border-radius: 10px !important;\
            border: 1px solid var(--theme-border, #232323) !important;\
            background: var(--theme-bg-tertiary, #272727) !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font: inherit !important;\
            font-size: 13px !important;\
            font-weight: 700 !important;\
            cursor: pointer !important;\
        }\
        .choose-nickname-view .dialog[data-discord-setup="done"] h1,\
        .choose-nickname-view .dialog[data-discord-setup="done"] .label-input,\
        .choose-nickname-view .dialog[data-discord-setup="done"] button[data-hook="ok"] {\
            display: none !important;\
        }\
        /* Fase inicial (/user): só círculo + Cargando — atributo no JS (compatível sem :has() no Chromium) */\
        .choose-nickname-view .dialog[data-hxd-nick-loading="1"] h1,\
        .choose-nickname-view .dialog[data-hxd-nick-loading="1"] .label-input,\
        .choose-nickname-view .dialog[data-hxd-nick-loading="1"] button[data-hook="ok"] {\
            display: none !important;\
        }\
        .choose-nickname-view[data-hxd-nick-loading="1"] > img {\
            display: none !important;\
        }\
        @keyframes hxd-spin {\
            to { transform: rotate(360deg); }\
        }\
        .hxd-spinner {\
            width: 28px;\
            height: 28px;\
            border: 3px solid rgba(255,255,255,0.2);\
            border-top-color: rgba(255,255,255,0.9);\
            border-radius: 50%;\
            animation: hxd-spin 0.7s linear infinite;\
            flex-shrink: 0;\
            box-sizing: border-box;\
        }\
        .hxd-spinner--sm {\
            width: 20px;\
            height: 20px;\
            border-width: 2px;\
        }\
        .hxd-nick-wait-wrap {\
            display: flex !important;\
            align-items: center;\
            justify-content: center;\
            gap: 12px;\
            padding: 24px 20px;\
            box-sizing: border-box;\
        }\
        .hxd-nick-wait-text {\
            color: var(--theme-text-secondary, #aaa);\
            font-size: 14px;\
        }\
        .hxd-loading-gear {\
            display: inline-flex !important;\
            align-items: center !important;\
            justify-content: center !important;\
            flex-shrink: 0 !important;\
            color: rgba(255, 255, 255, 0.92) !important;\
            animation: hxd-spin 1.05s linear infinite !important;\
        }\
        .hxd-loading-gear svg {\
            display: block !important;\
            width: 28px !important;\
            height: 28px !important;\
        }\
        \
        /* Settings sidebar */\
        .settings-view .dialog {\
            overflow: visible !important;\
        }\
        #settings-sidebar-panel {\
            background: var(--theme-bg-primary) !important;\
            border: 1px solid var(--theme-border) !important;\
        }\
        .settings-sidebar-btn {\
            display: flex !important;\
            align-items: center !important;\
            justify-content: center !important;\
            width: 36px !important;\
            height: 36px !important;\
            padding: 0 !important;\
            font-size: 0 !important;\
            background: var(--theme-bg-tertiary) !important;\
            border: none !important;\
            border-radius: 4px !important;\
            cursor: pointer !important;\
            color: var(--theme-text-secondary) !important;\
            transition: all 0.15s !important;\
        }\
        .settings-sidebar-btn:hover {\
            background: var(--theme-bg-hover) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .settings-sidebar-btn.selected {\
            background: var(--theme-bg-hover) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .settings-sidebar-btn svg {\
            width: 16px !important;\
            height: 16px !important;\
        }\
        \
        /* Theme / appearance settings (sidebar tab) */\
        .theme-section,\
        .appearance-section {\
            padding: 14px 16px !important;\
        }\
        .theme-container {\
            display: flex !important;\
            flex-direction: column !important;\
            gap: 24px !important;\
        }\
        .settings-group {\
            display: flex !important;\
            flex-direction: column !important;\
            gap: 12px !important;\
        }\
        .settings-group-label {\
            font-size: 13px !important;\
            font-weight: 500 !important;\
            color: var(--theme-text-secondary) !important;\
            padding-left: 2px !important;\
        }\
        .theme-options {\
            display: flex !important;\
            flex-direction: column !important;\
            gap: 6px !important;\
        }\
        .theme-option {\
            display: flex !important;\
            align-items: center !important;\
            gap: 10px !important;\
            padding: 10px 12px !important;\
            background: var(--theme-bg-secondary) !important;\
            border: 1px solid var(--theme-border) !important;\
            border-radius: 6px !important;\
            cursor: pointer !important;\
            transition: background 0.12s, border-color 0.12s !important;\
            position: relative !important;\
        }\
        .theme-option:hover {\
            background: var(--theme-bg-tertiary) !important;\
            border-color: var(--theme-border-light) !important;\
        }\
        .theme-option.selected {\
            border-color: #4ade80 !important;\
            background: var(--theme-bg-tertiary) !important;\
        }\
        .theme-text {\
            display: flex !important;\
            flex-direction: column !important;\
            gap: 2px !important;\
            flex: 1 !important;\
        }\
        .theme-name {\
            font-size: 13px !important;\
            font-weight: 600 !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .theme-desc {\
            font-size: 10px !important;\
            color: var(--theme-text-muted) !important;\
            line-height: 1.25 !important;\
            display: -webkit-box !important;\
            -webkit-line-clamp: 2 !important;\
            -webkit-box-orient: vertical !important;\
            overflow: hidden !important;\
        }\
        .theme-check {\
            display: none !important;\
            align-items: center !important;\
            justify-content: center !important;\
            width: 22px !important;\
            height: 22px !important;\
            background: #4ade80 !important;\
            border-radius: 50% !important;\
            color: #000 !important;\
            flex-shrink: 0 !important;\
        }\
        .theme-option.selected .theme-check {\
            display: flex !important;\
        }\
        \
        /* Range/Slider inputs */\
        input[type="range"] {\
            -webkit-appearance: none !important;\
            appearance: none !important;\
            background: var(--theme-bg-tertiary) !important;\
            border-radius: 4px !important;\
            height: 6px !important;\
            cursor: pointer !important;\
        }\
        input[type="range"]::-webkit-slider-thumb {\
            -webkit-appearance: none !important;\
            appearance: none !important;\
            width: 16px !important;\
            height: 16px !important;\
            background: var(--theme-text-primary) !important;\
            border-radius: 50% !important;\
            cursor: pointer !important;\
            border: 2px solid var(--theme-bg-primary) !important;\
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;\
        }\
        input[type="range"]::-moz-range-thumb {\
            width: 16px !important;\
            height: 16px !important;\
            background: var(--theme-text-primary) !important;\
            border-radius: 50% !important;\
            cursor: pointer !important;\
            border: 2px solid var(--theme-bg-primary) !important;\
        }\
        input[type="range"]::-webkit-slider-runnable-track {\
            background: var(--theme-bg-tertiary) !important;\
            border-radius: 4px !important;\
        }\
        \
        /* Cursor pointer para elementos clicáveis */\
        a, button, [role="button"], label[for], select, .clickable {\
            cursor: pointer !important;\
        }\
        \
        /* Links */\
        a {\
            color: var(--theme-text-primary) !important;\
        }\
        a:hover {\
            color: var(--theme-text-secondary) !important;\
        }\
        \
        /* Settings sections */\
        .settings-view .section {\
            background: var(--theme-bg-primary) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .settings-view .section label,\
        .settings-view .section .lbl,\
        .tabcontents label {\
            color: var(--theme-text-secondary) !important;\
        }\
        .settings-view .section .val {\
            color: var(--theme-text-primary) !important;\
        }\
        \
        /* Input rows (keybinds) */\
        .inputrow {\
            background: var(--theme-bg-secondary) !important;\
            border-color: var(--theme-border) !important;\
        }\
        .inputrow > div:first-child {\
            color: var(--theme-text-primary) !important;\
        }\
        .inputrow > div:not(:first-child) {\
            background: var(--theme-bg-tertiary) !important;\
            color: var(--theme-text-primary) !important;\
            border-color: var(--theme-border) !important;\
        }\
        .inputrow > i.icon-plus {\
            background: var(--theme-bg-tertiary) !important;\
            color: var(--theme-text-primary) !important;\
        }\
        .inputrow > div:not(:first-child):hover,\
        .inputrow > i.icon-plus:hover {\
            background: var(--theme-bg-hover) !important;\
        }\
        \
        /* Tema claro - força transparência nos elementos do jogo */\
        body[data-theme="light"] .section,\
        body[data-theme="light"] .section *,\
        body[data-theme="light"] .tabcontents,\
        body[data-theme="light"] .tabcontents * {\
            background-color: transparent !important;\
        }\
        body[data-theme="light"] .section > label,\
        body[data-theme="light"] .tabcontents > label,\
        body[data-theme="light"] .section label[style],\
        body[data-theme="light"] .tabcontents label[style] {\
            background: transparent !important;\
            background-color: transparent !important;\
            color: var(--theme-text-primary) !important;\
        }\
        body[data-theme="light"] .section > label:hover,\
        body[data-theme="light"] .tabcontents > label:hover {\
            background: var(--theme-bg-hover) !important;\
            background-color: var(--theme-bg-hover) !important;\
        }\
        body[data-theme="light"] .inputrow {\
            background: var(--theme-bg-secondary) !important;\
        }\
        body[data-theme="light"] .inputrow > div:not(:first-child),\
        body[data-theme="light"] .inputrow > i.icon-plus {\
            background: var(--theme-bg-tertiary) !important;\
            background-color: var(--theme-bg-tertiary) !important;\
        }\
        \
        /* Desplegables (estilo Calidad): caja oscura, bordes redondeados, foco azul */\
        .dialog.settings-view select,\
        #stretched-res-row select,\
        .hxd-res-wrap select {\
            box-sizing: border-box !important;\
            max-width: 100% !important;\
            margin: 2px 0 6px !important;\
            padding: 9px 36px 9px 12px !important;\
            border-radius: 8px !important;\
            border: 1px solid rgba(255,255,255,0.14) !important;\
            background-color: var(--theme-bg-tertiary, #2a2a2a) !important;\
            background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a3a3a3%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E") !important;\
            background-repeat: no-repeat !important;\
            background-position: right 10px center !important;\
            color: var(--theme-text-primary, #fff) !important;\
            font-size: 13px !important;\
            font-family: inherit !important;\
            cursor: pointer !important;\
            outline: none !important;\
            appearance: none !important;\
            -webkit-appearance: none !important;\
            transition: border-color 0.15s, box-shadow 0.15s !important;\
        }\
        .dialog.settings-view select,\
        .hxd-res-wrap select { width: 100% !important; }\
        #stretched-res-row select {\
            width: auto !important;\
            flex: 1 1 220px !important;\
            min-width: 180px !important;\
            margin: 0 !important;\
        }\
        .dialog.settings-view select:hover,\
        #stretched-res-row select:hover,\
        .hxd-res-wrap select:hover { border-color: rgba(255,255,255,0.24) !important; }\
        .dialog.settings-view select:focus,\
        #stretched-res-row select:focus,\
        .hxd-res-wrap select:focus {\
            border-color: #2563eb !important;\
            box-shadow: 0 0 0 2px rgba(37,99,235,0.38) !important;\
        }\
        .dialog.settings-view select option,\
        #stretched-res-row select option,\
        .hxd-res-wrap select option {\
            background: #1e1e1e !important;\
            color: #fafafa !important;\
        }\
        body[data-theme="light"] .dialog.settings-view select,\
        body[data-theme="light"] #stretched-res-row select,\
        body[data-theme="light"] .hxd-res-wrap select {\
            background-color: #f1f5f9 !important;\
            background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23475569%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E") !important;\
            color: #0f172a !important;\
            border-color: rgba(15,23,42,0.18) !important;\
        }\
        body[data-theme="light"] .dialog.settings-view select:focus,\
        body[data-theme="light"] #stretched-res-row select:focus,\
        body[data-theme="light"] .hxd-res-wrap select:focus {\
            border-color: #2563eb !important;\
            box-shadow: 0 0 0 2px rgba(37,99,235,0.28) !important;\
        }\
        body[data-theme="light"] .dialog.settings-view select option,\
        body[data-theme="light"] #stretched-res-row select option,\
        body[data-theme="light"] .hxd-res-wrap select option {\
            background: #fff !important;\
            color: #0f172a !important;\
        }\
        \
        /* Lista de jogadores - hover */\
        .player-list-item {\
            background: transparent !important;\
        }\
        .player-list-item:hover {\
            background: var(--theme-bg-hover) !important;\
        }\
        /* Banners Pro exclusivos */\
        .player-list-item.pro-banner {\
            background: var(--pro-banner-gradient) !important;\
            border-radius: 4px !important;\
        }\
        .player-list-item.pro-banner:hover {\
            filter: brightness(1.1) !important;\
        }\
        /* Logo do equipamento à direita (antes do ping) */\
        .player-list-item .hxd-team-logo-wrap {\
            display: inline-flex !important;\
            align-items: center !important;\
            justify-content: center !important;\
            flex-shrink: 0 !important;\
            width: 22px !important;\
            height: 22px !important;\
            margin: 0 2px 0 4px !important;\
            pointer-events: auto !important;\
        }\
        .player-list-item .hxd-team-logo-wrap img {\
            width: 20px !important;\
            height: 20px !important;\
            border-radius: 4px !important;\
            object-fit: cover !important;\
            vertical-align: middle !important;\
        }\
        .player-list-item .hxd-team-logo-wrap svg {\
            width: 14px !important;\
            height: 14px !important;\
            vertical-align: middle !important;\
        }\
        .player-list-item [data-hook="ping"] {\
            display: inline-flex !important;\
            align-items: center !important;\
            justify-content: flex-end !important;\
            gap: 5px !important;\
            flex-shrink: 0 !important;\
        }\
        /* Tooltip do Discord - usa variáveis de tema */\
        #discord-player-tooltip {\
            background: var(--theme-tooltip-bg) !important;\
            border-color: var(--theme-tooltip-border) !important;\
        }\
        #discord-player-tooltip span {\
            color: var(--theme-text-primary) !important;\
        }\
        \
        /* Cor de admin mais escura no modo claro */\
        body[data-theme="light"] .player-list-item [style*="color: rgb(231, 185, 14)"],\
        body[data-theme="light"] .player-list-item [style*="color:#e7b90e"],\
        body[data-theme="light"] .player-list-item [style*="color: #e7b90e"] {\
            color: #b8860b !important;\
        }\
        \
        /* TEMA PADRÃO - Remove apenas fundo do body, mantém elementos customizados com cor da header */\
        html[data-theme="default"] body,\
        body[data-theme="default"] {\
            background: unset !important;\
            background-color: unset !important;\
        }\
        html[data-app-bg-image="1"] body[data-theme="default"],\
        html[data-app-bg-image="1"][data-theme="default"] body {\
            position: relative !important;\
            z-index: 1 !important;\
            background: transparent !important;\
            background-color: transparent !important;\
            background-image: none !important;\
        }\
        /* Input do nick - mesma cor do input da header */\
        html[data-theme="default"] .label-input input,\
        html[data-theme="default"] .label-input input[data-hook="input"],\
        html[data-theme="default"] .choose-nickname-view input,\
        html[data-theme="default"] .choose-nickname-view input[type="text"] {\
            background: #2a3138 !important;\
            border-color: #3a4148 !important;\
            color: #fff !important;\
        }\
        /* Selects no tema default */\
        html[data-theme="default"] select,\
        html[data-theme="default"] .dialog select,\
        html[data-theme="default"] .room-view select,\
        html[data-theme="default"] .game-view select,\
        html[data-theme="default"] .create-room-view select {\
            background: #2a3138 !important;\
            border-color: #3a4148 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] select option,\
        html[data-theme="default"] .dialog select option {\
            background: #1A2125 !important;\
            color: #fff !important;\
        }\
        /* Botões - visíveis */\
        html[data-theme="default"] button,\
        html[data-theme="default"] .dialog button {\
            background: #2a3138 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] button:hover,\
        html[data-theme="default"] .dialog button:hover {\
            background: #3a4148 !important;\
        }\
        html[data-theme="default"] #custom-header button,\
        html[data-theme="default"] #custom-titlebar .hxd-win-btn,\
        html[data-theme="default"] #show-header-btn {\
            background: transparent !important;\
            border: none !important;\
            box-shadow: none !important;\
        }\
        html[data-theme="default"] #custom-header button {\
            color: #888 !important;\
            transition: color 0.12s ease !important;\
        }\
        html[data-theme="default"] #custom-header #discord-btn:hover {\
            color: #5865F2 !important;\
        }\
        html[data-theme="default"] #custom-header #lang-btn:hover,\
        html[data-theme="default"] #custom-header #hxd-toggle-chrome-btn:hover {\
            color: #fff !important;\
        }\
        html[data-theme="default"] #custom-header #ghost-mode-btn:hover {\
            color: #a78bfa !important;\
        }\
        html[data-theme="default"] #custom-header #ghost-mode-btn.active:hover {\
            color: #c4b5fd !important;\
        }\
        html[data-theme="default"] #custom-header #ghost-mode-btn.active {\
            color: #8b5cf6 !important;\
        }\
        html[data-theme="default"] #custom-header button:hover {\
            background: transparent !important;\
        }\
        html[data-theme="default"] #show-header-btn:hover {\
            background: rgba(255, 255, 255, 0.1) !important;\
        }\
        /* Header da roomlist (País, Nome, Jogadores) */\
        html[data-theme="default"] .roomlist-view table.header {\
            background: #1A2125 !important;\
        }\
        /* Sidebar da room list - mesma cor da header */\
        html[data-theme="default"] #sidebar-panel {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        html[data-theme="default"] #sidebar-panel button,\
        html[data-theme="default"] #sidebar-panel label[for="replayfile"] {\
            background: #2a3138 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] #sidebar-panel button:hover,\
        html[data-theme="default"] #sidebar-panel label[for="replayfile"]:hover {\
            background: #3a4148 !important;\
        }\
        /* Input de busca e filtro de país */\
        html[data-theme="default"] #room-search-input {\
            background: #2a3138 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] #country-filter-btn {\
            background: #2a3138 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] #country-filter-btn:hover {\
            background: #3a4148 !important;\
        }\
        html[data-theme="default"] #country-dropdown {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        html[data-theme="default"] #country-dropdown .country-item:hover {\
            background: #2a3138 !important;\
        }\
        /* Settings sidebar - mesma cor da header */\
        html[data-theme="default"] #settings-sidebar-panel {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        html[data-theme="default"] .settings-sidebar-btn {\
            background: #2a3138 !important;\
            color: #888 !important;\
        }\
        html[data-theme="default"] .settings-sidebar-btn:hover,\
        html[data-theme="default"] .settings-sidebar-btn.selected {\
            background: #3a4148 !important;\
            color: #fff !important;\
        }\
        /* Theme options no tema default */\
        html[data-theme="default"] .theme-option {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        html[data-theme="default"] .theme-option:hover {\
            background: #2a3138 !important;\
        }\
        html[data-theme="default"] .theme-option.selected {\
            border-color: #4ade80 !important;\
            background: #2a3138 !important;\
        }\
        /* Host token input */\
        html[data-theme="default"] .hosttoken-section input,\
        html[data-theme="default"] [data-hook="token-section"] input,\
        html[data-theme="default"] .section input[type="text"] {\
            background: #2a3138 !important;\
            border-color: #3a4148 !important;\
            color: #fff !important;\
        }\
        /* Painéis laterais (Pro, Amizades, Equipes) */\
        html[data-theme="default"] #pro-panel,\
        html[data-theme="default"] #friends-panel,\
        html[data-theme="default"] #teams-panel {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        html[data-theme="default"] #pro-panel input,\
        html[data-theme="default"] #pro-panel select,\
        html[data-theme="default"] #friends-panel input,\
        html[data-theme="default"] #teams-panel input {\
            background: #2a3138 !important;\
            border-color: #3a4148 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] #pro-panel button,\
        html[data-theme="default"] #friends-panel button,\
        html[data-theme="default"] #teams-panel button {\
            background: #2a3138 !important;\
            color: #fff !important;\
        }\
        html[data-theme="default"] #pro-panel button:hover,\
        html[data-theme="default"] #friends-panel button:hover,\
        html[data-theme="default"] #teams-panel button:hover {\
            background: #3a4148 !important;\
        }\
        /* Elementos internos dos painéis */\
        html[data-theme="default"] #pro-preview,\
        html[data-theme="default"] #custom-banner-colors,\
        html[data-theme="default"] .friend-item,\
        html[data-theme="default"] .team-item,\
        html[data-theme="default"] [style*="background:#111"],\
        html[data-theme="default"] [style*="background: #111"],\
        html[data-theme="default"] [style*="background:#1a1a1a"],\
        html[data-theme="default"] [style*="background: #1a1a1a"] {\
            background: #2a3138 !important;\
        }\
        /* Tooltip do Discord */\
        html[data-theme="default"] #discord-player-tooltip {\
            background: #1A2125 !important;\
            border-color: #3a4148 !important;\
        }\
        /* Lista de jogadores na sala */\
        html[data-theme="default"] .player-list-view,\
        html[data-theme="default"] .player-list-view .list {\
            background: #1A2125 !important;\
        }\
        html[data-theme="default"] .player-list-item:hover {\
            background: #2a3138 !important;\
        }\
        /* Container da sala */\
        html[data-theme="default"] .room-view .container,\
        html[data-theme="default"] .game-view .container {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        /* Settings da sala */\
        html[data-theme="default"] .room-view .settings,\
        html[data-theme="default"] .game-view .settings {\
            background: #1A2125 !important;\
            border-color: #2a3138 !important;\
        }\
        /* Lista thin-scrollbar */\
        html[data-theme="default"] .room-view .list.thin-scrollbar,\
        html[data-theme="default"] .game-view .list.thin-scrollbar,\
        html[data-theme="default"] .player-list-view .list.thin-scrollbar {\
            background: #1A2125 !important;\
            border: 1px solid #2a3138 !important;\
        }\
        /* Listas de times (Red, Spectators, Blue) */\
        html[data-theme="default"] .player-list-view {\
            background: transparent !important;\
        }\
        html[data-theme="default"] .player-list-view .list {\
            background: #1A2125 !important;\
            border: 1px solid #2a3138 !important;\
        }\
        /* Checkboxes de desempenho no tema default */\
        html[data-theme="default"] .perf-checkbox {\
            border-color: #3a4148 !important;\
        }\
        html[data-theme="default"] .perf-option-row:hover {\
            background: #2a3138 !important;\
        }\
    ';

    /* Glass UI: frame only (radius, border, soft shadow). Does not override theme backgrounds. */
    var GLASS_UI_STYLES = '\
        html[data-glass-ui="1"] .dialog,\
        html[data-glass-ui="1"] .dialog.section {\
            border-radius: 18px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
            box-shadow: 0 10px 36px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;\
        }\
        html[data-glass-ui="1"][data-theme="light"] .dialog,\
        html[data-glass-ui="1"][data-theme="light"] .dialog.section {\
            box-shadow: 0 10px 36px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;\
        }\
        html[data-glass-ui="1"] .dialog.settings-view { border-radius: 20px !important; }\
        html[data-glass-ui="1"] #settings-sidebar-panel {\
            border-radius: 14px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;\
        }\
        html[data-glass-ui="1"][data-theme="light"] #settings-sidebar-panel {\
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;\
        }\
        html[data-glass-ui="1"] #sidebar-panel {\
            border-radius: 12px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16) !important;\
        }\
        html[data-glass-ui="1"] .chatbox-view .chatbox-view-contents {\
            border-radius: 14px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.18) !important;\
        }\
        html[data-glass-ui="1"] .game-state-view .bar {\
            border-radius: 14px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16) !important;\
        }\
        html[data-glass-ui="1"] .player-list-view,\
        html[data-glass-ui="1"] .player-list-view .list {\
            border-radius: 12px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
        }\
        html[data-glass-ui="1"] .roomlist-view .content {\
            border-radius: 10px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
        }\
        html[data-glass-ui="1"] #pro-popup-overlay .prx {\
            border-radius: 18px !important;\
            border: 1px solid var(--theme-border-light, #333) !important;\
            box-shadow: 0 14px 44px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;\
        }\
        html[data-glass-ui="1"][data-theme="light"] #pro-popup-overlay .prx {\
            box-shadow: 0 14px 44px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;\
        }\
    ';

    // Fontes disponíveis para usuários Pro
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

    // Exporta fontes globalmente
    window.__proFonts = PRO_FONTS;

    function injectStyles() {
        Injector.waitForHead().then(function(head) {
            if (document.getElementById('haxball-custom-styles')) return;
            
            // Carrega todas as fontes de forma assíncrona
            var fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Ubuntu:wght@400;500;700&family=Quicksand:wght@400;500;600;700&family=Comfortaa:wght@400;500;600;700&family=Righteous&family=Orbitron:wght@400;500;600;700&family=Press+Start+2P&display=swap';
            head.appendChild(fontLink);
            
            var style = document.createElement('style');
            style.id = 'haxball-custom-styles';
            style.textContent = generateFlagCSS() + MAIN_STYLES + GLASS_UI_STYLES;
            head.appendChild(style);
            try {
                (function applyHxdUiOpacityBoot() {
                    function clamp100(v) {
                        v = parseInt(v, 10);
                        if (isNaN(v)) return 100;
                        if (v < 0) return 0;
                        if (v > 100) return 100;
                        return v;
                    }
                    var de = document.documentElement;
                    var rs = localStorage.getItem('hxd_ui_scoreboard_opacity');
                    var rc = localStorage.getItem('hxd_ui_chatbox_opacity');
                    var s = rs == null ? 100 : clamp100(rs);
                    var c = rc == null ? 100 : clamp100(rc);
                    de.style.setProperty('--hxd-scoreboard-bg-alpha', String(s / 100));
                    de.style.setProperty('--hxd-chat-bg-alpha', String(c / 100));
                })();
            } catch (eHxdOx) {}
            try {
                window.__hxdApplyGlassUiFromStorage = function() {
                    var on = false;
                    try { on = localStorage.getItem('hax_glass_ui') === '1'; } catch (eGls) {}
                    var de = document.documentElement;
                    if (on) de.setAttribute('data-glass-ui', '1');
                    else de.removeAttribute('data-glass-ui');
                };
                window.__hxdApplyGlassUiFromStorage();
            } catch (eGlassBoot) {}
            installReplayControlsAligner();
            installReplayHideShortcut();
            
            Injector.log('Custom styles injected');
        });
    }

    function installReplayControlsAligner() {
        if (document.hxdReplayControlsAlignerInstalled) return;
        document.hxdReplayControlsAlignerInstalled = true;

        var raf = 0;

        function getChatBoxRect() {
            var chat = document.querySelector('.game-view.replayer .chatbox-view .chatbox-view-contents') ||
                document.querySelector('.game-view.replayer .chatbox-view');
            if (!chat) return null;
            var rect = chat.getBoundingClientRect();
            if (!rect || rect.width < 80 || rect.height < 20) return null;
            return rect;
        }

        function clampTooltip(ctrl) {
            var bar = ctrl && ctrl.querySelector ? ctrl.querySelector('.timebar') : null;
            var tip = ctrl && ctrl.querySelector ? ctrl.querySelector('.timetooltip') : null;
            if (!bar || !tip) return;

            var rawLeft = parseFloat(tip.style.left || '');
            var barW = bar.clientWidth || 0;
            var tipW = tip.offsetWidth || 0;
            if (!(barW > 0)) return;

            var min = 8 + (tipW / 2);
            var max = Math.max(min, barW - 8 - (tipW / 2));
            var left = isNaN(rawLeft) ? (barW / 2) : rawLeft;
            if (left < min) left = min;
            if (left > max) left = max;
            bar.style.setProperty('--hxd-replay-tooltip-left', left + 'px');
        }

        function alignNow() {
            raf = 0;
            var ctrl = document.querySelector('.game-view.replayer .replay-controls-view');
            if (!ctrl) return;

            var chatRect = getChatBoxRect();
            if (chatRect) {
                var width = Math.max(260, Math.round(chatRect.width));
                var left = Math.round(chatRect.left);
                var bottom = Math.max(12, Math.round(window.innerHeight - chatRect.top + 8));
                ctrl.style.setProperty('--hxd-replay-left', left + 'px');
                ctrl.style.setProperty('--hxd-replay-width', width + 'px');
                ctrl.style.setProperty('--hxd-replay-bottom', bottom + 'px');
            } else {
                ctrl.style.removeProperty('--hxd-replay-left');
                ctrl.style.removeProperty('--hxd-replay-width');
                ctrl.style.removeProperty('--hxd-replay-bottom');
            }

            clampTooltip(ctrl);
        }

        function scheduleAlign() {
            if (raf) return;
            raf = requestAnimationFrame(alignNow);
        }

        window.addEventListener('resize', scheduleAlign);
        window.addEventListener('mousemove', function(e) {
            var bar = e.target && e.target.closest ? e.target.closest('.game-view.replayer .replay-controls-view .timebar') : null;
            if (bar) scheduleAlign();
        }, true);
        window.addEventListener('mouseup', scheduleAlign, true);
        window.addEventListener('scroll', scheduleAlign, true);

        var mo = new MutationObserver(scheduleAlign);
        mo.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        setInterval(scheduleAlign, 500);
        scheduleAlign();
    }

    // Tecla H en replays: oculta/muestra la línea de tiempo y los controles.
    // Muestra un aviso fijo abajo a la izquierda con el atajo.
    function installReplayHideShortcut() {
        if (document.hxdReplayHideInstalled) return;
        document.hxdReplayHideInstalled = true;

        var hidden = false;
        var hint = null;

        function isReplay() {
            return !!document.querySelector('.game-view.replayer');
        }
        function getCtrl() {
            return document.querySelector('.game-view.replayer .replay-controls-view');
        }
        function ensureHint() {
            if (hint && document.body && document.body.contains(hint)) return hint;
            hint = document.createElement('div');
            hint.className = 'hxd-replay-hide-hint';
            hint.style.cssText = [
                'position:fixed', 'left:14px', 'bottom:12px', 'z-index:2147483646',
                'font:600 11px/1.2 Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
                'letter-spacing:.5px', 'color:rgba(255,255,255,.82)',
                'background:rgba(0,0,0,.45)', 'padding:6px 10px', 'border-radius:8px',
                'pointer-events:none', 'user-select:none', 'text-transform:uppercase',
                'box-shadow:0 4px 16px rgba(0,0,0,.25)',
                'transition:opacity .2s ease', 'opacity:0', 'display:none'
            ].join(';');
            if (document.body) document.body.appendChild(hint);
            return hint;
        }
        function updateHintText() {
            var h = ensureHint();
            h.textContent = hidden
                ? 'Muestra la línea de tiempo con la H'
                : 'Oculta la línea de tiempo con la H';
        }
        function applyHidden() {
            var ctrl = getCtrl();
            if (ctrl) {
                if (hidden) ctrl.style.setProperty('display', 'none', 'important');
                else ctrl.style.removeProperty('display');
            }
            updateHintText();
        }
        function refreshPresence() {
            var h = ensureHint();
            if (isReplay()) {
                h.style.display = 'block';
                h.style.opacity = '1';
                updateHintText();
                var ctrl = getCtrl();
                if (ctrl && hidden) ctrl.style.setProperty('display', 'none', 'important');
            } else {
                h.style.opacity = '0';
                h.style.display = 'none';
                hidden = false;
            }
        }

        document.addEventListener('keydown', function(e) {
            if (!isReplay()) return;
            var k = (e.key || '').toLowerCase();
            if (k !== 'h') return;
            var ae = document.activeElement;
            if (ae) {
                var tag = (ae.tagName || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || ae.isContentEditable) return;
            }
            e.preventDefault();
            e.stopPropagation();
            hidden = !hidden;
            applyHidden();
        }, true);

        setInterval(refreshPresence, 600);
        refreshPresence();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }
})();
