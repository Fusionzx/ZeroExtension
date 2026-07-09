// ============================================
// DISCORD - Autenticação via servidor local
// ============================================
(function() {
    if (!Injector.isMainFrame()) return;

    /** Mismo puerto que `main.js` / preload (`meta[name="hxd-local-api"]`); antes quedaba fijo en 5483 y rompía varias cuentas. */
    function getLocalServerOrigin() {
        try {
            var m = document.querySelector('meta[name="hxd-local-api"]');
            if (m && m.getAttribute('content')) {
                return String(m.getAttribute('content')).replace(/\/+$/, '');
            }
        } catch (eM) {}
        try {
            if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                return String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/+$/, '');
            }
        } catch (eC) {}
        return 'http://127.0.0.1:5483';
    }

    var LOCAL_SERVER = getLocalServerOrigin();
    var discordNick = null;
    var discordUsername = null;
    var discordId = null;
    var isVerified = false;
    var isLoaded = false;
    var userStatusReady = false;
    var LOCAL_DISCORD_NAME_KEY = 'hxd_local_discord_name';
    var DISCORD_SVG = '<svg width="24" height="24" viewBox="0 0 71 55" fill="#5865F2"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg>';

    function getLanguage() {
        var saved = localStorage.getItem('haxball_language');
        if (saved === 'pt' || saved === 'es' || saved === 'en') return saved;
        var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.indexOf('en') === 0) return 'en';
        if (browserLang.indexOf('pt') === 0) return 'pt';
        return 'es';
    }

    function t(key) {
        var lang = getLanguage();
        var messages = {
            loginDiscord: { pt: 'Entrar com Discord', es: 'Entrar con Discord', en: 'Sign in with Discord' },
            waitingAuth: { pt: 'Aguardando...', es: 'Esperando...', en: 'Waiting...' },
            authOpenFailed: { pt: 'Não foi possível abrir Discord. Tente novamente.', es: 'No se pudo abrir Discord. Intentá de nuevo.', en: 'Could not open Discord. Try again.' },
            loading: { pt: 'Carregando...', es: 'Cargando...', en: 'Loading...' },
            authFailed: { pt: 'Falha no login do Discord. Tente novamente.', es: 'Falló el login de Discord. Intentá de nuevo.', en: 'Discord login failed. Try again.' },
            accessDenied: { pt: 'Acesso Negado', es: 'Acceso denegado', en: 'Access denied' },
            playAnonymous: { pt: 'Jogar Anônimo', es: 'Jugar en anónimo', en: 'Play anonymously' },
            ghostNickPlaceholder: { pt: 'Digite seu nick...', es: 'Escribe tu apodo...', en: 'Enter your nickname...' },
            ghostTooltipAnonymous: { pt: 'Anônimo', es: 'Anónimo', en: 'Anonymous' },
            authTitle: { pt: 'Bem-vindo ao HaxBall Zero', es: 'Bienvenido a HaxBall Zero', en: 'Welcome to HaxBall Zero' },
            authConnected: { pt: 'sua sessão ficou vinculada ao Discord.', es: 'tu sesión quedó vinculada con Discord.', en: 'your session is linked with Discord.' },
            authDisconnected: { pt: 'Entre com Discord para sincronizar seu perfil.', es: 'Entrá con Discord para sincronizar tu perfil.', en: 'Sign in with Discord to sync your profile.' },
            authHint: { pt: 'Escolha seu nick de partida e entre no jogo.', es: 'Elegí tu apodo de partida y entrá al juego.', en: 'Choose your match nickname and enter the game.' },
            guestHint: { pt: 'Jogá sem conta usando um nick local.', es: 'Jugá sin cuenta usando un apodo local.', en: 'Play without an account using a local nickname.' },
            nickLabel: { pt: 'Apelido', es: 'Apodo', en: 'Nickname' },
            enterGame: { pt: 'Entrar no jogo', es: 'Entrar al juego', en: 'Enter game' },
            logout: { pt: 'Sair', es: 'Salir', en: 'Log out' }
        };
        var entry = messages[key];
        if (!entry) return key;
        return entry[lang] || entry.es || key;
    }

    // Busca status do usuário no servidor local
    function cleanLocalName(value) {
        return String(value || '').replace(/\u200B/g, '').trim();
    }

    function getStoredGameNick() {
        try {
            return cleanLocalName(
                localStorage.getItem('haxball_nick') ||
                localStorage.getItem('player_name') ||
                localStorage.getItem('ghost_nick') ||
                ''
            );
        } catch (eNick) {
            return '';
        }
    }

    function getStoredLocalDiscordName(fallback) {
        var fb = cleanLocalName(fallback) || 'Zero';
        try {
            var storedName = cleanLocalName(localStorage.getItem(LOCAL_DISCORD_NAME_KEY));
            if (storedName) return storedName;
        } catch (eLocalName) {}
        try {
            var storedUser = JSON.parse(localStorage.getItem('haxclient_user') || 'null');
            if (storedUser && String(storedUser.discord_id || '') === 'zero-local-test') {
                var userName = cleanLocalName(storedUser.username || storedUser.nick);
                if (userName) return userName;
            }
        } catch (eStoredUser) {}
        return fb;
    }

    function isLocalDiscordUser(id) {
        return !id || String(id) === 'zero-local-test';
    }

    function saveLocalDiscordName(name) {
        var clean = cleanLocalName(name) || 'Zero';
        try { localStorage.setItem(LOCAL_DISCORD_NAME_KEY, clean); } catch (eSaveName) {}
        return clean;
    }

    function getLocalTestUser() {
        var gameNick = getStoredGameNick() || 'Zero';
        var discordName = getStoredLocalDiscordName(gameNick);
        return {
            logged_in: true,
            nick: discordName,
            username: discordName,
            game_nick: gameNick,
            discord_id: 'zero-local-test',
            is_verified: true,
            is_pro: true,
            is_vip: true,
            __hxd_local_user: true
        };
    }

    function applyUserStatus(data) {
        if (!data || !data.logged_in) data = getLocalTestUser();
        if (data.__hxd_local_user || isLocalDiscordUser(data.discord_id)) {
            var localDiscordName = getStoredLocalDiscordName(data.username || data.nick || getStoredGameNick() || 'Zero');
            data = Object.assign({}, data, {
                nick: localDiscordName,
                username: localDiscordName,
                game_nick: getStoredGameNick() || data.game_nick || ''
            });
        }
        discordNick = data.nick || data.username || 'Zero';
        discordUsername = data.username || discordNick;
        discordId = data.discord_id || 'zero-local-test';
        isVerified = data.is_verified !== false;
        window.__haxDiscordId = discordId;
        window.__hxdAvatarDiscordAllowed = true;
        try {
            localStorage.setItem('haxclient_user', JSON.stringify(Object.assign({}, data, {
                logged_in: true,
                nick: discordNick,
                username: discordUsername,
                discord_id: discordId,
                is_verified: isVerified
            })));
        } catch (eStoreUser) {}
        return Object.assign({}, data, {
            logged_in: true,
            nick: discordNick,
            username: discordUsername,
            discord_id: discordId,
            is_verified: isVerified
        });
    }

    function fetchUserStatus() {
        return new Promise(function(resolve) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', LOCAL_SERVER + '/user', true);
            xhr.timeout = 8000;
            xhr.ontimeout = function() { resolve(applyUserStatus(getLocalTestUser())); };
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        resolve(applyUserStatus(data));
                    } catch (e) {
                        resolve(applyUserStatus(getLocalTestUser()));
                    }
                }
            };
            xhr.onerror = function() { resolve(applyUserStatus(getLocalTestUser())); };
            xhr.send();
        });
    }

    // Abre URL de auth no browser padrão (servidor abre automaticamente)
    function startAuth() {
        return new Promise(function(resolve) {
            try {
                if (window.electronAPI && typeof window.electronAPI.startAuth === 'function') {
                    window.electronAPI.startAuth()
                        .then(function(result) {
                            resolve(!result || result.success !== false);
                        })
                        .catch(function() {
                            resolve(false);
                        });
                    return;
                }
            } catch (eApi) {}

            var xhr = new XMLHttpRequest();
            xhr.open('GET', LOCAL_SERVER + '/auth', true);
            xhr.timeout = 8000;
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;
                resolve(xhr.status >= 200 && xhr.status < 300);
            };
            xhr.onerror = function() { resolve(false); };
            xhr.ontimeout = function() { resolve(false); };
            try {
                xhr.send();
            } catch (e) {
                resolve(false);
            }
        });
    }

    function fetchAuthStatus() {
        return new Promise(function(resolve) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', LOCAL_SERVER + '/auth-status', true);
            xhr.timeout = 4000;
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    resolve(null);
                }
            };
            xhr.onerror = function() { resolve(null); };
            xhr.ontimeout = function() { resolve(null); };
            try {
                xhr.send();
            } catch (e2) {
                resolve(null);
            }
        });
    }

    function removeNickDialogLoading(dialog) {
        var el = dialog.querySelector('#hxd-nick-wait-status');
        if (el) el.remove();
        dialog.removeAttribute('data-hxd-nick-loading');
        var nickView = dialog.closest && dialog.closest('.choose-nickname-view');
        if (nickView) nickView.removeAttribute('data-hxd-nick-loading');
    }

    function ensureNickDialogLoading(iframeDoc, dialog) {
        if (dialog.querySelector('#hxd-nick-wait-status')) return;
        dialog.setAttribute('data-hxd-nick-loading', '1');
        var nickView = dialog.closest && dialog.closest('.choose-nickname-view');
        if (nickView) nickView.setAttribute('data-hxd-nick-loading', '1');
        var wrap = iframeDoc.createElement('div');
        wrap.id = 'hxd-nick-wait-status';
        wrap.className = 'hxd-nick-wait-wrap';
        wrap.innerHTML = '<div class="hxd-spinner" aria-hidden="true"></div><span class="hxd-nick-wait-text">' + t('loading') + '</span>';
        dialog.appendChild(wrap);
    }

    function reprocessNickDialogIfOpen() {
        var iframe = document.querySelector('iframe[src*="game.html"], iframe[src*="html5.haxball"], iframe[src*="haxball.com"]');
        if (!iframe) return;
        try {
            var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            if (doc && doc.body) handleNickDialog(doc);
        } catch (eRe) {}
    }

    function isShellAnonymousMode() {
        try {
            return localStorage.getItem('hxd_anonymous_mode') === '1' || localStorage.getItem('ghost_mode') === 'true';
        } catch (e) {
            return false;
        }
    }

    function stripDiscordInjectionsFromDialog(dialog) {
        var ids = ['#discord-logged', '#discord-login-shell', '#discord-login-btn', '#ghost-mode-login-btn', '#ghost-mode-container', '#hxd-nick-wait-status'];
        for (var si = 0; si < ids.length; si++) {
            var el = dialog.querySelector(ids[si]);
            if (el) el.remove();
        }
        dialog.removeAttribute('data-hxd-nick-loading');
    }

    /** Oculta título / fila Nick / Ok nativos del juego (no depender solo del CSS del iframe). */
    function hideNativeNickDialogChrome(dialog) {
        if (!dialog) return;
        var h1 = dialog.querySelector('h1');
        var li = dialog.querySelector('.label-input');
        var ok = dialog.querySelector('button[data-hook="ok"]');
        if (h1) h1.style.setProperty('display', 'none', 'important');
        if (li) li.style.setProperty('display', 'none', 'important');
        if (ok) ok.style.setProperty('display', 'none', 'important');
    }

    // The game keeps the nickname in its own input state.  Assigning .value and
    // clicking immediately works in some Chromium builds, but not in all of them.
    // Update it through the native setter and submit on the following animation frame.
    function submitNativeNick(iframeDoc, dialog, nickInput, okBtn, nickname) {
        var value = String(nickname || '').trim();
        if (!value || !iframeDoc || !nickInput || !okBtn) return false;

        try {
            var inputPrototype = iframeDoc.defaultView && iframeDoc.defaultView.HTMLInputElement ?
                iframeDoc.defaultView.HTMLInputElement.prototype : Object.getPrototypeOf(nickInput);
            var valueDescriptor = inputPrototype && Object.getOwnPropertyDescriptor(inputPrototype, 'value');
            if (valueDescriptor && valueDescriptor.set) valueDescriptor.set.call(nickInput, value);
            else nickInput.value = value;

            var EventCtor = (iframeDoc.defaultView && iframeDoc.defaultView.Event) || Event;
            nickInput.dispatchEvent(new EventCtor('input', { bubbles: true }));
            nickInput.dispatchEvent(new EventCtor('change', { bubbles: true }));

            okBtn.disabled = false;
            okBtn.style.setProperty('display', 'flex', 'important');

            var submit = function() {
                if (!okBtn.isConnected) return;
                try { okBtn.focus(); } catch (eFocus) {}
                okBtn.click();
            };
            var frame = iframeDoc.defaultView && iframeDoc.defaultView.requestAnimationFrame;
            if (typeof frame === 'function') frame.call(iframeDoc.defaultView, submit);
            else setTimeout(submit, 0);
            return true;
        } catch (eSubmit) {
            return false;
        }
    }

    function ensureNickDialogStyles(iframeDoc) {
        if (!iframeDoc || !iframeDoc.head || iframeDoc.getElementById('hxd-zero-auth-styles')) return;
        var style = iframeDoc.createElement('style');
        style.id = 'hxd-zero-auth-styles';
        style.textContent =
            '.choose-nickname-view{background:radial-gradient(ellipse 80% 60% at 50% 100%,color-mix(in srgb,var(--theme-border-light,#333) 35%,transparent),transparent 55%),radial-gradient(ellipse 50% 40% at 80% 20%,color-mix(in srgb,var(--theme-text-muted,#666) 18%,transparent),transparent 50%),linear-gradient(180deg,var(--theme-bg-tertiary,#272727) 0%,var(--theme-bg-primary,#141414) 58%,var(--theme-bg-primary,#141414) 100%)!important;color:var(--theme-text-primary,#fff)!important;font-family:Inter,system-ui,sans-serif!important;-webkit-font-smoothing:antialiased!important;}' +
            '.choose-nickname-view>img{display:none!important}' +
            '.choose-nickname-view .dialog.hxd-zero-auth{width:min(340px,calc(100vw - 40px))!important;min-width:0!important;max-width:min(340px,calc(100vw - 40px))!important;padding:24px 24px 20px!important;border-radius:16px!important;border:1px solid var(--theme-border,#232323)!important;background:color-mix(in srgb,var(--theme-bg-secondary,#1a1a1a) 86%,transparent)!important;box-shadow:var(--shadow-soft,0 20px 60px rgba(0,0,0,.35))!important;text-align:center!important;overflow:visible!important;}' +
            '.hxd-zero-auth-shell{display:flex;flex-direction:column;align-items:stretch;gap:13px;width:100%;}' +
            '.hxd-zero-auth-brand{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:1px;}' +
            '.hxd-zero-auth-logo{width:50px;height:50px;border-radius:50%;object-fit:cover;border:1px solid var(--theme-border-light,#333);box-shadow:0 0 0 4px color-mix(in srgb,var(--theme-bg-tertiary,#272727) 72%,transparent);background:var(--theme-bg-tertiary,#272727);}' +
            '.hxd-zero-auth-kicker{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--theme-text-muted,#666);}' +
            '.hxd-zero-auth-title{margin:0;color:var(--theme-text-primary,#fff);font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:1.15;}' +
            '.hxd-zero-auth-copy{margin:0;color:var(--theme-text-secondary,#888);font-size:12px;line-height:1.45;}' +
            '.hxd-zero-auth-copy strong{color:var(--theme-text-primary,#fff);font-weight:700;}' +
            '.hxd-zero-field{text-align:left;display:flex;flex-direction:column;gap:7px;}' +
            '.hxd-zero-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--theme-text-muted,#666);}' +
            '.hxd-zero-input-wrap{position:relative;display:flex;align-items:center;}' +
            '.hxd-zero-input{width:100%!important;height:40px!important;padding:0 42px 0 12px!important;border-radius:10px!important;border:1px solid var(--theme-border,#232323)!important;background:var(--theme-bg-primary,#141414)!important;color:var(--theme-text-primary,#fff)!important;font:inherit!important;font-size:13px!important;outline:none!important;box-shadow:none!important;}' +
            '.hxd-zero-input:focus{border-color:var(--theme-border-light,#333)!important;background:var(--theme-bg-secondary,#1a1a1a)!important;}' +
            '.hxd-zero-field-icon{position:absolute;right:12px;display:flex;align-items:center;justify-content:center;color:#5865f2;}' +
            '.hxd-zero-tooltip{position:absolute;right:0;bottom:calc(100% + 9px);min-width:130px;padding:8px 10px;border:1px solid var(--theme-border,#232323);border-radius:10px;background:var(--theme-bg-secondary,#1a1a1a);box-shadow:var(--shadow-nav,0 8px 32px rgba(0,0,0,.18));opacity:0;transform:translateY(2px);pointer-events:none;transition:opacity .14s ease,transform .14s ease;z-index:20;text-align:left;}' +
            '.hxd-zero-field-icon:hover .hxd-zero-tooltip{opacity:1;transform:translateY(0);}' +
            '.hxd-zero-tooltip-k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5865f2;margin-bottom:2px;}' +
            '.hxd-zero-tooltip-v{font-size:12px;color:var(--theme-text-primary,#fff);white-space:nowrap;}' +
            '.hxd-zero-actions{display:flex;gap:8px;width:100%;}' +
            '.hxd-zero-btn{height:40px;border-radius:10px!important;border:1px solid var(--theme-border,#232323)!important;background:var(--theme-bg-tertiary,#272727)!important;color:var(--theme-text-primary,#fff)!important;font:inherit!important;font-size:13px!important;font-weight:700!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;transition:background .14s ease,border-color .14s ease,color .14s ease,transform .1s ease!important;}' +
            '.hxd-zero-btn:hover:not(:disabled){background:var(--theme-bg-hover,#333)!important;border-color:var(--theme-border-light,#333)!important;}' +
            '.hxd-zero-btn:active:not(:disabled){transform:scale(.985);}' +
            '.hxd-zero-btn:disabled{opacity:.65!important;cursor:default!important;}' +
            '.hxd-zero-btn-primary{flex:1;background:var(--theme-bg-tertiary,#272727)!important;}' +
            '.hxd-zero-btn-discord{width:100%!important;background:#5865f2!important;border-color:#5865f2!important;color:#fff!important;}' +
            '.hxd-zero-btn-discord:hover:not(:disabled){background:#4752c4!important;border-color:#4752c4!important;}' +
            '.hxd-zero-btn-ghost{width:100%!important;background:rgba(139,92,246,.12)!important;border-color:rgba(139,92,246,.28)!important;color:#c4b5fd!important;}' +
            '.hxd-zero-btn-ghost:hover:not(:disabled){background:rgba(139,92,246,.2)!important;color:#ddd6fe!important;}' +
            '.hxd-zero-btn-icon{width:42px;flex:0 0 42px;padding:0!important;color:var(--theme-text-secondary,#888)!important;}' +
            '.hxd-zero-btn-icon:hover:not(:disabled){color:var(--theme-text-primary,#fff)!important;}' +
            '.hxd-zero-separator{height:1px;background:var(--theme-border,#232323);margin:0;}' +
            '.hxd-zero-hint{display:none!important;}' +
            '.hxd-zero-auth-login{gap:10px;}' +
            '.hxd-zero-auth-login .hxd-zero-auth-copy{margin-bottom:2px;}';
        iframeDoc.head.appendChild(style);
    }

    // Atualiza presença (sala atual) - não envia no modo anônimo
    var lastPresence = { roomName: null, roomLink: null, isOnline: null };
    
    function updatePresence(roomName, roomLink, isOnline) {
        if (!discordId || isShellAnonymousMode()) return;
        
        // Só envia se houver mudança
        if (lastPresence.roomName === roomName && 
            lastPresence.roomLink === roomLink && 
            lastPresence.isOnline === isOnline) {
            return;
        }
        
        lastPresence = { roomName: roomName, roomLink: roomLink, isOnline: isOnline };
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', LOCAL_SERVER + '/presence', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            room_name: roomName || null,
            room_link: roomLink || null,
            is_online: isOnline !== false
        }));
    }

    // Injeta UI de login no dialog de nick (choose-nickname-view quando existe; fallback .dialog como em asd/resources)
    function handleNickDialog(iframeDoc) {
        var nickView = iframeDoc.querySelector('.choose-nickname-view');
        var dialog = nickView ? nickView.querySelector('.dialog') : null;
        if (!dialog) {
            dialog = iframeDoc.querySelector('.dialog');
        }
        if (!dialog) return;

        var nickInput = dialog.querySelector('input[data-hook="input"]');
        var okBtn = dialog.querySelector('button[data-hook="ok"]');
        if (!nickInput || !okBtn) return;

        var dialogTitle = dialog.querySelector('h1');
        var labelInput = dialog.querySelector('.label-input');
        var label = labelInput ? labelInput.querySelector('label') : null;
        var labelText = (label ? label.textContent : '').toLowerCase();
        var titleText = (dialogTitle ? dialogTitle.textContent : '').toLowerCase();

        // Verifica se é dialog de nick (inglês + possíveis traduções). Inclui "Change name", "Nome de usuário", etc.
        var isNickDialog =
            labelText.indexOf('nick') !== -1 ||
            titleText.indexOf('nick') !== -1 ||
            titleText.indexOf('nickname') !== -1 ||
            titleText.indexOf('choose') !== -1 ||
            labelText.indexOf('nombre') !== -1 ||
            titleText.indexOf('nombre') !== -1 ||
            labelText.indexOf('apodo') !== -1 ||
            titleText.indexOf('apodo') !== -1 ||
            labelText.indexOf('pseudo') !== -1 ||
            titleText.indexOf('pseudo') !== -1 ||
            labelText.indexOf('apelido') !== -1 ||
            titleText.indexOf('apelido') !== -1 ||
            titleText.indexOf('username') !== -1 ||
            labelText.indexOf('username') !== -1 ||
            (titleText.indexOf('change') !== -1 && titleText.indexOf('name') !== -1) ||
            (labelText.indexOf('change') !== -1 && labelText.indexOf('name') !== -1) ||
            (titleText.indexOf('cambi') !== -1 && titleText.indexOf('nombre') !== -1);
        if (!isNickDialog) return;

        ensureNickDialogStyles(iframeDoc);
        dialog.classList.add('hxd-zero-auth');

        var shellAnonymous = isShellAnonymousMode();

        if (!userStatusReady && !shellAnonymous) {
            ensureNickDialogLoading(iframeDoc, dialog);
            return;
        }

        removeNickDialogLoading(dialog);

        // Se já montamos UI, não repetir: o MutationObserver + rAF reexecutava strip + append e o input perdía foco (no permitía escribir).
        if (dialog.dataset.discordSetup === 'done') {
            if (shellAnonymous && dialog.querySelector('#ghost-mode-container')) {
                hideNativeNickDialogChrome(dialog);
                return;
            }
            if (!shellAnonymous && discordNick && dialog.querySelector('#discord-logged')) {
                hideNativeNickDialogChrome(dialog);
                return;
            }
            if (!shellAnonymous && !discordNick && dialog.querySelector('#discord-login-btn')) {
                hideNativeNickDialogChrome(dialog);
                return;
            }
        }

        if (shellAnonymous) {
            stripDiscordInjectionsFromDialog(dialog);
            hideNativeNickDialogChrome(dialog);

            var savedGhostNick = '';
            try {
                savedGhostNick = localStorage.getItem('ghost_nick') || localStorage.getItem('haxball_nick') || '';
            } catch (eSn) {}

            var containerGh = iframeDoc.createElement('div');
            containerGh.id = 'ghost-mode-container';
            containerGh.className = 'hxd-zero-auth-shell';

            var brandGh = iframeDoc.createElement('div');
            brandGh.className = 'hxd-zero-auth-brand';
            brandGh.innerHTML =
                '<div class="hxd-zero-auth-kicker">HaxBall Zero</div>' +
                '<h2 class="hxd-zero-auth-title">' + t('playAnonymous') + '</h2>';
            containerGh.appendChild(brandGh);

            var fieldGroupGh = iframeDoc.createElement('div');
            fieldGroupGh.className = 'hxd-zero-field';

            var nickLabelGh = iframeDoc.createElement('label');
            nickLabelGh.textContent = t('nickLabel');
            nickLabelGh.className = 'hxd-zero-label';
            fieldGroupGh.appendChild(nickLabelGh);

            var inputWrapperGh = iframeDoc.createElement('div');
            inputWrapperGh.className = 'hxd-zero-input-wrap';

            var customNickGhost = iframeDoc.createElement('input');
            customNickGhost.type = 'text';
            customNickGhost.value = savedGhostNick;
            customNickGhost.maxLength = 50;
            customNickGhost.placeholder = t('ghostNickPlaceholder');
            customNickGhost.className = 'hxd-zero-input';
            inputWrapperGh.appendChild(customNickGhost);

            var ghostIconGh = iframeDoc.createElement('div');
            ghostIconGh.className = 'hxd-zero-field-icon';
            ghostIconGh.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>';
            var tooltipGh = iframeDoc.createElement('div');
            tooltipGh.className = 'hxd-zero-tooltip';
            tooltipGh.innerHTML = '<div class="hxd-zero-tooltip-k">' + t('ghostTooltipAnonymous') + '</div>';
            ghostIconGh.appendChild(tooltipGh);
            inputWrapperGh.appendChild(ghostIconGh);

            fieldGroupGh.appendChild(inputWrapperGh);
            containerGh.appendChild(fieldGroupGh);

            var enterBtnGh = iframeDoc.createElement('button');
            enterBtnGh.type = 'button';
            enterBtnGh.className = 'hxd-zero-btn hxd-zero-btn-primary';
            enterBtnGh.textContent = t('enterGame');
            enterBtnGh.onclick = function() {
                var cn = customNickGhost.value.trim();
                if (!cn) return;
                gameNick = cn;
                try {
                    localStorage.setItem('ghost_nick', cn);
                    localStorage.setItem('haxball_nick', cn);
                } catch (eLs) {}
                submitNativeNick(iframeDoc, dialog, nickInput, okBtn, cn);
            };
            containerGh.appendChild(enterBtnGh);

            dialog.appendChild(containerGh);
            dialog.dataset.discordSetup = 'done';
            window.setTimeout(function() {
                try {
                    if (customNickGhost && customNickGhost.focus) customNickGhost.focus();
                } catch (ef) {}
            }, 50);
            return;
        }

        if (discordNick) {
            stripDiscordInjectionsFromDialog(dialog);
            hideNativeNickDialogChrome(dialog);
            // Usuário logado - design com ícone Discord no input
            var container = iframeDoc.createElement('div');
            container.id = 'discord-logged';
            container.className = 'hxd-zero-auth-shell';

            var brand = iframeDoc.createElement('div');
            brand.className = 'hxd-zero-auth-brand';
            var avatarUrl = '';
            try {
                avatarUrl = window.__hxdMyAvatarUrl || localStorage.getItem('hxd_settings_preview_avatar') || '';
            } catch (eAv) {}
            brand.innerHTML =
                '<div class="hxd-zero-auth-kicker">HaxBall Zero</div>' +
                (avatarUrl ? '<img class="hxd-zero-auth-logo" src="' + avatarUrl.replace(/"/g, '&quot;') + '" alt=""/>' : '') +
                '<h2 class="hxd-zero-auth-title">' + t('authTitle') + '</h2>' +
                '<p class="hxd-zero-auth-copy"><strong>' + (discordNick || discordUsername || 'Player') + '</strong>, ' + t('authConnected') + '</p>';
            container.appendChild(brand);

            var localDiscordInput = null;

            // Campo de nick com label
            var fieldGroup = iframeDoc.createElement('div');
            fieldGroup.className = 'hxd-zero-field';
            
            var nickLabel = iframeDoc.createElement('label');
            nickLabel.textContent = t('nickLabel');
            nickLabel.className = 'hxd-zero-label';
            fieldGroup.appendChild(nickLabel);

            // Wrapper do input com ícone
            var inputWrapper = iframeDoc.createElement('div');
            inputWrapper.className = 'hxd-zero-input-wrap';

            var customNickInput = iframeDoc.createElement('input');
            customNickInput.type = 'text';
            // Carrega nick salvo ou deixa vazio
            var savedNick = localStorage.getItem('haxball_nick') || '';
            customNickInput.value = savedNick;
            customNickInput.placeholder = discordNick;
            customNickInput.maxLength = 50;
            customNickInput.className = 'hxd-zero-input';
            inputWrapper.appendChild(customNickInput);

            // Ícone Discord à direita do input com tooltip
            var discordIcon = iframeDoc.createElement('div');
            discordIcon.className = 'hxd-zero-field-icon';
            discordIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 71 55" fill="#5865F2"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg>';
            
            // Tooltip customizado - mostra username
            var tooltip = iframeDoc.createElement('div');
            tooltip.className = 'hxd-zero-tooltip';
            tooltip.innerHTML = '<div class="hxd-zero-tooltip-k">Discord</div><div class="hxd-zero-tooltip-v">' + (discordUsername || discordNick) + '</div>';
            discordIcon.appendChild(tooltip);
            inputWrapper.appendChild(discordIcon);

            fieldGroup.appendChild(inputWrapper);
            container.appendChild(fieldGroup);

            if (isLocalDiscordUser(discordId)) {
                var discordFieldGroup = iframeDoc.createElement('div');
                discordFieldGroup.className = 'hxd-zero-field';

                var discordLabel = iframeDoc.createElement('label');
                discordLabel.textContent = 'Discord';
                discordLabel.className = 'hxd-zero-label';
                discordFieldGroup.appendChild(discordLabel);

                var discordInputWrapper = iframeDoc.createElement('div');
                discordInputWrapper.className = 'hxd-zero-input-wrap';

                localDiscordInput = iframeDoc.createElement('input');
                localDiscordInput.type = 'text';
                localDiscordInput.value = getStoredLocalDiscordName(discordUsername || discordNick || savedNick);
                localDiscordInput.placeholder = 'Discord';
                localDiscordInput.maxLength = 50;
                localDiscordInput.className = 'hxd-zero-input';
                discordInputWrapper.appendChild(localDiscordInput);

                var localDiscordIcon = iframeDoc.createElement('div');
                localDiscordIcon.className = 'hxd-zero-field-icon';
                localDiscordIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 71 55" fill="#5865F2"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg>';
                discordInputWrapper.appendChild(localDiscordIcon);
                discordFieldGroup.appendChild(discordInputWrapper);
                container.appendChild(discordFieldGroup);
            }

            // Container dos botões (Ok + Sair)
            var btnContainer = iframeDoc.createElement('div');
            btnContainer.className = 'hxd-zero-actions';

            // Botão Ok
            var enterBtn = iframeDoc.createElement('button');
            enterBtn.className = 'hxd-zero-btn hxd-zero-btn-primary';
            enterBtn.textContent = t('enterGame');
            enterBtn.onclick = function() {
                if (enterBtn.disabled) return;
                enterBtn.disabled = true;
                logoutBtn.disabled = true;
                enterBtn.innerHTML = '';
                var spin = iframeDoc.createElement('span');
                spin.className = 'hxd-spinner hxd-spinner--sm';
                spin.style.verticalAlign = 'middle';
                spin.style.marginRight = '8px';
                enterBtn.appendChild(spin);
                enterBtn.appendChild(iframeDoc.createTextNode(t('loading')));

                var localDiscordName = localDiscordInput ? saveLocalDiscordName(localDiscordInput.value || discordUsername || discordNick) : null;
                if (localDiscordName) {
                    var localUser = Object.assign({}, getLocalTestUser(), {
                        nick: localDiscordName,
                        username: localDiscordName
                    });
                    applyUserStatus(localUser);
                    if (tooltip) {
                        var tooltipValue = tooltip.querySelector('.hxd-zero-tooltip-v');
                        if (tooltipValue) tooltipValue.textContent = localDiscordName;
                    }
                }

                var customNick = customNickInput.value.trim() || discordNick;
                gameNick = customNick;
                if (customNick) {
                    localStorage.setItem('haxball_nick', customNick);
                }
                if (localDiscordName) {
                    applyUserStatus(Object.assign({}, getLocalTestUser(), {
                        nick: localDiscordName,
                        username: localDiscordName,
                        game_nick: customNick
                    }));
                }
                submitNativeNick(iframeDoc, dialog, nickInput, okBtn, customNick);
            };
            btnContainer.appendChild(enterBtn);

            // Botão Sair (só ícone)
            var logoutBtn = iframeDoc.createElement('button');
            logoutBtn.className = 'hxd-zero-btn hxd-zero-btn-icon';
            logoutBtn.title = t('logout');
            logoutBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
            logoutBtn.onclick = function() {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', LOCAL_SERVER + '/logout', true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        // Limpa dados locais
                        discordNick = null;
                        discordUsername = null;
                        discordId = null;
                        isVerified = false;
                        localStorage.removeItem('haxball_nick');
                        // Recarrega a página
                        window.location.reload();
                    }
                };
                xhr.send();
            };
            btnContainer.appendChild(logoutBtn);

            container.appendChild(btnContainer);
            dialog.appendChild(container);
            dialog.dataset.discordSetup = 'done';
        } else {
            stripDiscordInjectionsFromDialog(dialog);
            hideNativeNickDialogChrome(dialog);
            var loginShell = iframeDoc.createElement('div');
            loginShell.id = 'discord-login-shell';
            loginShell.className = 'hxd-zero-auth-shell hxd-zero-auth-login';
            var loginBrand = iframeDoc.createElement('div');
            loginBrand.className = 'hxd-zero-auth-brand';
            loginBrand.innerHTML =
                '<div class="hxd-zero-auth-kicker">HaxBall Zero</div>' +
                '<h2 class="hxd-zero-auth-title">' + t('authTitle') + '</h2>' +
                '<p class="hxd-zero-auth-copy">' + t('authDisconnected') + '</p>';
            loginShell.appendChild(loginBrand);

            // Não logado - mostra botão de login (design igual Electron)
            var discordBtn = iframeDoc.createElement('button');
            discordBtn.id = 'discord-login-btn';
            discordBtn.className = 'hxd-zero-btn hxd-zero-btn-discord';
            discordBtn.innerHTML = '' +
                '<svg width="24" height="24" viewBox="0 0 71 55" fill="#fff"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9a.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg>' +
                t('loginDiscord');
            discordBtn.onclick = function() {
                function restoreDiscordLoginButton(message) {
                    discordBtn.disabled = false;
                    discordBtn.innerHTML = '' +
                        '<svg width="24" height="24" viewBox="0 0 71 55" fill="#fff"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9a.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg>' +
                        t('loginDiscord');
                    if (message && typeof window.showToast === 'function') {
                        window.showToast(message, 'error', 2800);
                    }
                }
                discordBtn.disabled = true;
                discordBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;"><span class="hxd-spinner hxd-spinner--sm" aria-hidden="true"></span><span>' + t('waitingAuth') + '</span></span>';
                var pollInterval = null;
                var stopTimer = null;

                // Poll pra verificar login
                function pollLogin() {
                    fetchUserStatus().then(function(data) {
                        if (data.logged_in) {
                            if (pollInterval) clearInterval(pollInterval);
                            if (stopTimer) clearTimeout(stopTimer);
                            discordNick = data.nick;
                            discordUsername = data.username;
                            discordId = data.discord_id;
                            isVerified = data.is_verified;
                            
                            // Recarrega a página pra aplicar o login
                            window.location.reload();
                            return;
                        }
                        fetchAuthStatus().then(function(status) {
                            var auth = status && status.auth ? status.auth : null;
                            if (auth && auth.state === 'error') {
                                if (pollInterval) clearInterval(pollInterval);
                                if (stopTimer) clearTimeout(stopTimer);
                                restoreDiscordLoginButton(auth.message || t('authFailed'));
                            }
                        });
                    });
                }

                startAuth().then(function(opened) {
                    if (!opened) {
                        restoreDiscordLoginButton(t('authOpenFailed'));
                        return;
                    }
                    pollLogin();
                    pollInterval = setInterval(pollLogin, 1000);
                
                    // Para de verificar después de 45s: si no vuelve el callback, no queda clavado.
                    stopTimer = setTimeout(function() {
                        if (pollInterval) clearInterval(pollInterval);
                        fetchAuthStatus().then(function(status) {
                            var auth = status && status.auth ? status.auth : null;
                            restoreDiscordLoginButton(auth && auth.message ? auth.message : t('authFailed'));
                        });
                    }, 45000);
                });
            };

            loginShell.appendChild(discordBtn);

            var ghostLoginBtn = iframeDoc.createElement('button');
            ghostLoginBtn.id = 'ghost-mode-login-btn';
            ghostLoginBtn.type = 'button';
            ghostLoginBtn.className = 'hxd-zero-btn hxd-zero-btn-ghost';
            ghostLoginBtn.innerHTML = '\
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>\
                ' + t('playAnonymous') + '\
            ';
            ghostLoginBtn.onclick = function(ev) {
                if (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                if (ghostLoginBtn.disabled) return;
                ghostLoginBtn.disabled = true;
                try {
                    localStorage.setItem('hxd_anonymous_mode', '1');
                    localStorage.setItem('ghost_mode', 'true');
                } catch (eAn) {}
                if (typeof window.__hxdSetAnonymousMode === 'function') {
                    try {
                        window.__hxdSetAnonymousMode(true);
                    } catch (eSet) {}
                }
                try {
                    window.dispatchEvent(new CustomEvent('hxd-anonymous-mode-changed', { detail: { on: true } }));
                } catch (eEv) {}
                if (typeof window.__hxdPostAnonymousToGameFrame === 'function') {
                    window.__hxdPostAnonymousToGameFrame(true);
                } else {
                    try {
                        var ifrG = document.querySelector('iframe[src*="game.html"], iframe[src*="html5.haxball"], iframe[src*="haxball.com"]');
                        if (ifrG && ifrG.contentWindow) {
                            ifrG.contentWindow.postMessage({ type: 'hxd-sync-anonymous', on: true }, '*');
                        }
                    } catch (ePm) {}
                }
                function reloadAnonymousSession() {
                    try {
                        window.location.reload();
                    } catch (eRl) {}
                }
                try {
                    var anonXhr = new XMLHttpRequest();
                    anonXhr.open('POST', LOCAL_SERVER + '/session/anonymous', true);
                    anonXhr.setRequestHeader('Content-Type', 'application/json');
                    anonXhr.onreadystatechange = function() {
                        if (anonXhr.readyState === 4) {
                            window.setTimeout(reloadAnonymousSession, 80);
                        }
                    };
                    anonXhr.onerror = function() {
                        window.setTimeout(reloadAnonymousSession, 80);
                    };
                    anonXhr.send(JSON.stringify({ anonymous: true }));
                } catch (eSess) {
                    window.setTimeout(reloadAnonymousSession, 80);
                }
            };
            loginShell.appendChild(ghostLoginBtn);
            dialog.appendChild(loginShell);

            dialog.dataset.discordSetup = 'done';
        }
    }

    // Mostra UI de bloqueado
    function showBlockedUI(iframeDoc) {
        var ghostLogin = iframeDoc.querySelector('#ghost-mode-login-btn');
        if (ghostLogin) ghostLogin.style.display = 'none';
        var ghostPanel = iframeDoc.querySelector('#ghost-mode-container');
        if (ghostPanel) ghostPanel.style.display = 'none';
        var discordBtn = iframeDoc.querySelector('#discord-login-btn');
        if (discordBtn) {
            discordBtn.style.cssText = 'display:flex !important;align-items:center !important;justify-content:center !important;gap:8px !important;width:100% !important;padding:12px 20px !important;background:#2a1a1a !important;border:1px solid #ff4444 !important;border-radius:6px !important;color:#ff4444 !important;font-size:14px !important;cursor:not-allowed !important;margin:16px 0 !important;';
            discordBtn.innerHTML = '' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2">' +
                    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
                    '<line x1="12" y1="9" x2="12" y2="13"/>' +
                    '<line x1="12" y1="17" x2="12.01" y2="17"/>' +
                '</svg>' +
                '<span style="color:#ff4444 !important;">' + t('accessDenied') + '</span>';
            discordBtn.disabled = true;
        }
    }

    // Observa mudanças no iframe do jogo
    function watchGameIframe() {
        var playerListObserver = null;
        var dialogObserver = null;
        var dialogObservedDoc = null;
        var teamsWaitObserver = null;
        var dialogNickScheduled = false;
        var roomDetected = false;
        
        var checkIframe = function() {
            var iframe = document.querySelector('iframe[src*="game.html"], iframe[src*="html5.haxball"], iframe[src*="haxball.com"]');
            if (!iframe) return;

            try {
                var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
                if (!doc || !doc.body) return;

                // Após reload do iframe (ex.: bypass IP), o document muda — voltar a ligar o observer ao body novo.
                if (dialogObservedDoc !== doc) {
                    if (dialogObserver) {
                        dialogObserver.disconnect();
                        dialogObserver = null;
                    }
                    if (teamsWaitObserver) {
                        try {
                            teamsWaitObserver.disconnect();
                        } catch (eTW) {}
                        teamsWaitObserver = null;
                    }
                    if (playerListObserver) {
                        try {
                            playerListObserver.disconnect();
                        } catch (ePL) {}
                        playerListObserver = null;
                    }
                    dialogObservedDoc = doc;
                    dialogNickScheduled = false;
                    var dv = doc.defaultView;
                    dialogObserver = new MutationObserver(function() {
                        var w = dv || window;
                        if (dialogNickScheduled) return;
                        dialogNickScheduled = true;
                        w.requestAnimationFrame(function() {
                            dialogNickScheduled = false;
                            try {
                                handleNickDialog(doc);
                            } catch (eHnd) {}
                        });
                    });
                    dialogObserver.observe(doc.body, { childList: true, subtree: true });
                }

                if (!iframe.dataset.hxdDiscordIframeLoad) {
                    iframe.dataset.hxdDiscordIframeLoad = '1';
                    iframe.addEventListener('load', function() {
                        dialogObservedDoc = null;
                        if (dialogObserver) {
                            dialogObserver.disconnect();
                            dialogObserver = null;
                        }
                        if (teamsWaitObserver) {
                            try {
                                teamsWaitObserver.disconnect();
                            } catch (eTW2) {}
                            teamsWaitObserver = null;
                        }
                        if (playerListObserver) {
                            try {
                                playerListObserver.disconnect();
                            } catch (ePL2) {}
                            playerListObserver = null;
                        }
                        window.setTimeout(checkIframe, 80);
                    });
                }

                // Detecta entrada em sala (só uma vez por iframe)
                if (!roomDetected) {
                    roomDetected = true;
                    detectRoomEntry(doc);
                }

                // Observer 2: Só pra lista de players (observa só quando a lista muda)
                var setupPlayerListObserver = function() {
                    var teamsContainer = doc.querySelector('.teams');
                    if (teamsContainer && !playerListObserver && discordNick) {
                        playerListObserver = new MutationObserver(function() {
                            addPlayerTooltip(doc);
                        });
                        playerListObserver.observe(teamsContainer, { childList: true, subtree: true });
                        // Executa uma vez ao encontrar a lista
                        addPlayerTooltip(doc);
                    }
                };
                
                // Tenta achar a lista de players
                setupPlayerListObserver();
                
                // Um único observer até existir lista de jogadores (evita acumular centenas quando checkIframe reapete).
                if (!playerListObserver && !teamsWaitObserver) {
                    teamsWaitObserver = new MutationObserver(function() {
                        setupPlayerListObserver();
                        if (playerListObserver && teamsWaitObserver) {
                            try {
                                teamsWaitObserver.disconnect();
                            } catch (eDisc) {}
                            teamsWaitObserver = null;
                        }
                    });
                    teamsWaitObserver.observe(doc.body, { childList: true, subtree: true });
                }

                handleNickDialog(doc);
            } catch (e) {}
        };

        // Observa quando iframe aparece
        var mainObserver = new MutationObserver(checkIframe);
        mainObserver.observe(document.body, { childList: true, subtree: true });
        checkIframe();
    }

    // Variável para guardar o nick usado no jogo
    var gameNick = null;

    // Cache de usuários já buscados
    var userCache = {};

    // Busca informações de um usuário pelo nick
    function fetchUserByNick(nick, callback) {
        if (userCache.hasOwnProperty(nick)) {
            callback(userCache[nick]);
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', LOCAL_SERVER + '/user/by-nick?nick=' + encodeURIComponent(nick), true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    userCache[nick] = data;
                    callback(data);
                } catch (e) {
                    userCache[nick] = null;
                    callback(null);
                }
            }
        };
        xhr.onerror = function() {
            userCache[nick] = null;
            callback(null);
        };
        xhr.send();
    }

    // Variável para controlar o elemento atual com hover
    var currentHoverElement = null;
    var tooltipHideTimeout = null;

    // Esconde tooltip imediatamente
    function hideTooltip(tooltip) {
        if (tooltipHideTimeout) {
            clearTimeout(tooltipHideTimeout);
            tooltipHideTimeout = null;
        }
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        currentHoverElement = null;
    }

    // Adiciona tooltip no nick do jogador na lista de players (não mostra no modo anônimo)
    function addPlayerTooltip(doc) {
        // DESABILITADO - tooltip removido
        return;
        
        // Cria tooltip global se não existir
        var tooltip = doc.getElementById('discord-player-tooltip');
        if (!tooltip) {
            tooltip = doc.createElement('div');
            tooltip.id = 'discord-player-tooltip';
            tooltip.style.cssText = 'position:fixed;background:var(--theme-tooltip-bg, #1a1a1a);border:1px solid var(--theme-tooltip-border, #333);border-radius:6px;padding:8px 12px;z-index:10000;pointer-events:none;opacity:0;visibility:hidden;transition:opacity 0.1s;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            doc.body.appendChild(tooltip);
            
            // Esconde tooltip quando mouse sai do iframe ou documento
            doc.addEventListener('mouseleave', function() {
                hideTooltip(tooltip);
            });
            
            // Esconde tooltip em scroll
            doc.addEventListener('scroll', function() {
                hideTooltip(tooltip);
            }, true);

            // Esconde tooltip quando mouse move para fora da lista de players
            doc.addEventListener('mousemove', function(e) {
                if (tooltip.style.opacity !== '1') return;
                
                // Verifica se o mouse está sobre um player-list-item
                var target = e.target;
                var isOverPlayer = false;
                while (target && target !== doc.body) {
                    if (target.classList && target.classList.contains('player-list-item')) {
                        isOverPlayer = true;
                        break;
                    }
                    target = target.parentElement;
                }
                
                if (!isOverPlayer) {
                    hideTooltip(tooltip);
                }
            });

            // Esconde tooltip quando clicar em qualquer lugar
            doc.addEventListener('mousedown', function() {
                hideTooltip(tooltip);
            });
        }
        
        var playerItems = doc.querySelectorAll('.player-list-item');
        for (var i = 0; i < playerItems.length; i++) {
            var item = playerItems[i];
            var nameEl = item.querySelector('[data-hook="name"]');
            if (!nameEl) continue;
            if (nameEl.dataset.discordTooltip === 'done') continue;
            nameEl.dataset.discordTooltip = 'done';
            
            var playerName = nameEl.textContent;
            
            // Se é o próprio jogador, mostra seu username
            if (discordUsername && (playerName === gameNick || playerName === discordNick)) {
                (function(el, username) {
                    el.addEventListener('mouseenter', function(e) {
                        if (tooltipHideTimeout) {
                            clearTimeout(tooltipHideTimeout);
                            tooltipHideTimeout = null;
                        }
                        currentHoverElement = el;
                        tooltip.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 71 55" fill="#5865F2"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg><span style="color:var(--theme-text-primary, #fff);font-size:12px;">@' + username + '</span></div>';
                        var rect = el.getBoundingClientRect();
                        tooltip.style.left = (rect.right + 8) + 'px';
                        tooltip.style.top = (rect.top + rect.height / 2 - 16) + 'px';
                        tooltip.style.visibility = 'visible';
                        tooltip.style.opacity = '1';
                    });
                    el.addEventListener('mouseleave', function() {
                        hideTooltip(tooltip);
                    });
                    // Fallback: esconde se mouse sair do item pai também
                    el.closest('.player-list-item').addEventListener('mouseleave', function() {
                        if (currentHoverElement === el) {
                            hideTooltip(tooltip);
                        }
                    });
                })(item, discordUsername);
            } else {
                // Para outros jogadores, busca informações do servidor
                (function(el, nick) {
                    el.addEventListener('mouseenter', function(e) {
                        if (tooltipHideTimeout) {
                            clearTimeout(tooltipHideTimeout);
                            tooltipHideTimeout = null;
                        }
                        currentHoverElement = el;
                        fetchUserByNick(nick, function(user) {
                            // Só mostra se ainda estiver com hover no mesmo elemento
                            if (currentHoverElement !== el) return;
                            if (user && user.username) {
                                tooltip.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 71 55" fill="#5865F2"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0018-9.1v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg><span style="color:var(--theme-text-primary, #fff);font-size:12px;">@' + user.username + '</span></div>';
                                var rect = el.getBoundingClientRect();
                                tooltip.style.left = (rect.right + 8) + 'px';
                                tooltip.style.top = (rect.top + rect.height / 2 - 16) + 'px';
                                tooltip.style.visibility = 'visible';
                                tooltip.style.opacity = '1';
                            }
                        });
                    });
                    el.addEventListener('mouseleave', function() {
                        hideTooltip(tooltip);
                    });
                    // Fallback: esconde se mouse sair do item pai também
                    el.closest('.player-list-item').addEventListener('mouseleave', function() {
                        if (currentHoverElement === el) {
                            hideTooltip(tooltip);
                        }
                    });
                })(item, playerName);
            }
        }
    }

    // Inicializa
    function init() {
        if (isLoaded) return;
        isLoaded = true;

        fetchUserStatus()
            .then(function() {
                Injector.log('Discord: ' + (discordNick ? 'Logado como ' + discordNick : 'Não logado'));
                if (discordId) {
                    updatePresence(null, null, true);
                }
            })
            .finally(function() {
                userStatusReady = true;
                reprocessNickDialogIfOpen();
            });

        if (document.body) {
            watchGameIframe();
        } else {
            document.addEventListener('DOMContentLoaded', watchGameIframe);
        }
        
        // Marca offline ao fechar
        window.addEventListener('beforeunload', function() {
            if (discordId) {
                navigator.sendBeacon(LOCAL_SERVER + '/presence', JSON.stringify({
                    room_name: null,
                    room_link: null,
                    is_online: false
                }));
            }
        });
    }

    // Detecta entrada em sala (chamado do game iframe)
    function detectRoomEntry(iframeDoc) {
        // Presença Discord gerida neste módulo
        return;
    }

    window.HaxDiscord = {
        getNick: function() { return discordNick; },
        getId: function() { return discordId; },
        isVerified: function() { return isVerified; },
        isGhostMode: function() { return isShellAnonymousMode(); },
        updatePresence: updatePresence,
        refresh: fetchUserStatus
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    Injector.log('Discord module loaded');
})();
