// ============================================
// VERIFIED - Badge de verificado (v2)
// Usa player ID para identificar usuários reais
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var LOCAL_SERVER = (function resolveVerifiedApiBase() {
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
    var BADGE_SVG = '<svg width="12" height="12" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="#249EF0"/><path d="M15 9l-4.5 4.5L8 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var verifiedCache = {};
    window.__verifiedCache = verifiedCache; // Expõe globalmente desde o início
    var myVerified = false;
    var myDiscordId = null; // Discord ID do usuário local
    var myBadge = null;
    var myIsPro = false;

    var statusLoaded = false;
    var listObservers = [];
    var isActive = false;
    var lastSentPlayerId = null;
    var observerInitialized = false;
    var refreshTimer = null;
    var processDebounceTimer = null;
    var observerRetryTimer = null;
    var observerWatchdogTimer = null;
    var VERIFIED_CACHE_TTL_MS = 1000;
    var VERIFIED_DISABLED_KEY = 'hax_verified_disabled';
    var activeRoomId = null;
    var localSettingsLoaded = false;
    var localSettingsRequestInFlight = false;
    
    
    // Remove o caractere invisível do nick para obter o nick limpo (compatibilidade com nicks antigos)
    function cleanNick(nick) {
        return nick ? nick.replace(/\u200B/g, '') : nick;
    }

    function isGhostMode() {
        return false;
    }

    function hasUsableLocalProSettings(settings) {
        if (!settings || typeof settings !== 'object') return false;
        return Boolean(
            (settings.banner && settings.banner !== 'none') ||
            (settings.font && settings.font !== 'default') ||
            settings.nick_color ||
            settings.nick_gradient ||
            settings.verified_color ||
            settings.verified_gradient ||
            settings.custom_banner_color1 ||
            settings.custom_banner_color2
        );
    }

    function normalizeUserBadge(value) {
        value = cleanNick(value || '').toUpperCase();
        return value === 'CEO' || value === 'DEV' ? value : null;
    }

    function getNickText(nameEl) {
        if (!nameEl) return '';
        var gradientNick = nameEl.querySelector('.nick-gradient');
        if (gradientNick) return cleanNick(gradientNick.textContent || '');
        var textContent = '';
        for (var i = 0; i < nameEl.childNodes.length; i++) {
            var node = nameEl.childNodes[i];
            if (node.nodeType === 3) {
                textContent += node.textContent;
            }
        }
        textContent = cleanNick(textContent.trim());
        if (textContent) return textContent;
        return cleanNick(nameEl.getAttribute('data-base-nick') || '');
    }

    function createRoleBadge(role) {
        role = normalizeUserBadge(role);
        if (!role) return null;
        var el = document.createElement('span');
        el.className = 'user-role-badge';
        if (role === 'CEO') {
            el.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;margin-right:7px;padding:0 6px;min-width:30px;height:16px;border-radius:5px;background:rgba(185,28,28,.10);border:1px solid rgba(239,68,68,.45);color:#fecaca;font-size:8px;font-weight:700;letter-spacing:.08em;line-height:1;font-family:Inter,system-ui,sans-serif;vertical-align:middle;text-transform:uppercase;box-sizing:border-box;';
        } else {
            el.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;margin-right:7px;padding:0 6px;min-width:30px;height:16px;border-radius:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.22);color:#e5e7eb;font-size:8px;font-weight:700;letter-spacing:.08em;line-height:1;font-family:Inter,system-ui,sans-serif;vertical-align:middle;text-transform:uppercase;box-sizing:border-box;';
        }
        el.textContent = role;
        return el;
    }

    function togglePlayerFlag(item, shouldHide) {
        if (!item) return;
        var flagEl = item.querySelector('[data-hook="flag"], .flagico, .flag');
        if (!flagEl) return;
        if (shouldHide) {
            flagEl.style.setProperty('display', 'none', 'important');
        } else {
            flagEl.style.removeProperty('display');
        }
    }

    function isVerifiedEnabled() {
        try {
            return localStorage.getItem(VERIFIED_DISABLED_KEY) !== '1';
        } catch (e) {
            return true;
        }
    }

    function clearNickStyles(nameEl) {
        if (!nameEl) return;

        var gradientWrapper = nameEl.querySelector('.nick-gradient');
        if (gradientWrapper) {
            var text = gradientWrapper.textContent;
            gradientWrapper.replaceWith(document.createTextNode(text));
        }

        nameEl.style.background = '';
        nameEl.style.webkitBackgroundClip = '';
        nameEl.style.webkitTextFillColor = '';
        nameEl.style.backgroundClip = '';
        nameEl.style.display = '';
        nameEl.style.color = '';
        nameEl.style.removeProperty('font-family');
    }

    function clearPlayerDecorations(item) {
        if (!item) return;

        var nameEl = item.querySelector('[data-hook="name"]');
        if (nameEl) {
            clearNickStyles(nameEl);
        }

        var roleBadge = item.querySelector('.user-role-badge');
        if (roleBadge) roleBadge.remove();

        var verifiedBadge = item.querySelector('.verified-badge');
        if (verifiedBadge) verifiedBadge.remove();

        item.classList.remove('pro-banner');
        item.style.removeProperty('--pro-banner-gradient');
        togglePlayerFlag(item, false);
    }

    function getLocalPlayerId() {
        try {
            var a = window.__haxLocalPlayerId;
            if (a != null && a !== '') {
                var n = parseInt(a, 10);
                if (!isNaN(n)) return n;
            }
        } catch (e) {}
        return window.__myLocalPlayerId;
    }

    function getStoredLocalNick() {
        try {
            var nick = localStorage.getItem('haxball_nick') || localStorage.getItem('haxclient_my_nick') || '';
            return cleanNick(String(nick || '').trim());
        } catch (e) {
            return '';
        }
    }

    function storeLocalGameNick(nick) {
        nick = cleanNick(String(nick || '').trim());
        if (!nick) return;
        window.__haxLocalGameNick = nick;
        try {
            localStorage.setItem('haxclient_my_nick', nick);
        } catch (e) {}
        syncLocalPersonalizationCache();
    }

    function isLocalPlayerRow(item, localPlayerId) {
        if (!item) return false;
        if (item.dataset && item.dataset.haxLocalPlayer === '1') return true;
        var rowPlayerId = parseInt(item.dataset.playerId, 10);
        var rowIdValid = !isNaN(rowPlayerId);
        if (localPlayerId != null && !isNaN(localPlayerId) && rowIdValid && rowPlayerId === localPlayerId) {
            return true;
        }
        if (item.dataset && item.dataset.discordId && myDiscordId && String(item.dataset.discordId) === String(myDiscordId)) {
            return true;
        }
        var nameEl = item.querySelector('[data-hook="name"]');
        if (!nameEl) return false;
        var currentNick = cleanNick(getNickText(nameEl));
        // Nunca usar solo el nick si ya sabemos el id local y esta fila es otro jugador (evita tu perfil en admins / otros).
        if (localPlayerId != null && !isNaN(localPlayerId) && rowIdValid && rowPlayerId !== localPlayerId) {
            return false;
        }
        var runtimeNick = cleanNick(window.__haxLocalGameNick || '');
        if (runtimeNick && currentNick === runtimeNick) {
            return localPlayerId == null || !rowIdValid || rowPlayerId === localPlayerId;
        }
        var storedNick = getStoredLocalNick();
        if (!storedNick || currentNick !== storedNick) return false;
        return localPlayerId == null || !rowIdValid || rowPlayerId === localPlayerId;
    }

    function markLocalPlayerItem(item) {
        if (!item || !item.dataset) return;
        item.dataset.haxLocalPlayer = '1';
    }

    function resolveImmediateLocalRow(players, localPlayerId, allowSingleFallback) {
        if (!players || !players.length) return null;
        for (var i = 0; i < players.length; i++) {
            if (isLocalPlayerRow(players[i], localPlayerId)) {
                return players[i];
            }
        }
        // Si acabas de entrar a tu propia room y aún no llegó el playerId,
        // la única fila visible es necesariamente la tuya.
        if (allowSingleFallback && players.length === 1) {
            return players[0];
        }
        return null;
    }

    function clearLocalPlayerMarks() {
        var players = document.querySelectorAll('[class^="player-list-item"]');
        for (var i = 0; i < players.length; i++) {
            if (players[i].dataset) {
                delete players[i].dataset.haxLocalPlayer;
            }
        }
    }

    function getLocalProSettings() {
        if (hasUsableLocalProSettings(window.__proSettings)) return window.__proSettings;
        try {
            var stored = JSON.parse(localStorage.getItem('haxclient_pro_settings') || 'null') || null;
            if (hasUsableLocalProSettings(stored)) return stored;
            return window.__proSettings || stored;
        } catch (e) {
            return window.__proSettings || null;
        }
    }

    function buildLocalPersonalizationEntry() {
        var localProSettings = getLocalProSettings() || {};
        return {
            verified: Boolean(myVerified),
            badge: myBadge || null,
            isPro: Boolean(myIsPro),
            verified_color: localProSettings.verified_color || null,
            verified_gradient: localProSettings.verified_gradient || null,
            nick_color: localProSettings.nick_color || null,
            nick_gradient: localProSettings.nick_gradient || null,
            banner: localProSettings.banner || null,
            font: localProSettings.font || null,
            custom_banner_color1: localProSettings.custom_banner_color1 || null,
            custom_banner_color2: localProSettings.custom_banner_color2 || null,
            goal_anthem_enabled: Boolean(localProSettings.goal_anthem_enabled),
            goal_anthem_text: localProSettings.goal_anthem_text != null ? String(localProSettings.goal_anthem_text) : '',
            goal_anthem_audio_url: localProSettings.goal_anthem_audio_url != null ? String(localProSettings.goal_anthem_audio_url) : ''
        };
    }

    function updateLocalProSettings(incoming) {
        var mergedLocalSettings = mergeProfileSettings(getLocalProSettings() || {}, incoming || {});
        window.__proSettings = mergedLocalSettings;
        try {
            localStorage.setItem('haxclient_pro_settings', JSON.stringify(mergedLocalSettings));
        } catch (e) {}
        syncLocalPersonalizationCache();
        return mergedLocalSettings;
    }

    function mergeProfileSettings(base, incoming) {
        var merged = Object.assign({}, base || {});
        if (!incoming || typeof incoming !== 'object') return merged;

        var keys = [
            'banner',
            'font',
            'nick_color',
            'nick_gradient',
            'verified_color',
            'verified_gradient',
            'custom_banner_color1',
            'custom_banner_color2',
            'goal_anthem_enabled',
            'goal_anthem_text',
            'goal_anthem_audio_url'
        ];

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (incoming[key] !== null && incoming[key] !== undefined) {
                merged[key] = incoming[key];
            }
        }

        return merged;
    }

    function ensureLocalProSettings(callback, force) {
        if (!force && hasUsableLocalProSettings(getLocalProSettings())) {
            localSettingsLoaded = true;
            if (callback) callback(getLocalProSettings());
            return;
        }
        if (localSettingsRequestInFlight) {
            if (callback) setTimeout(function() { ensureLocalProSettings(callback, false); }, 120);
            return;
        }

        localSettingsRequestInFlight = true;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', LOCAL_SERVER + '/vip/settings', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;
            localSettingsRequestInFlight = false;
            localSettingsLoaded = true;
            try {
                var data = JSON.parse(xhr.responseText || '{}');
                if (data && typeof data === 'object') {
                    updateLocalProSettings(data);
                }
            } catch (e) {}
            if (callback) callback(getLocalProSettings());
            if (isActive) scheduleFullRefresh(20);
        };
        xhr.onerror = function() {
            localSettingsRequestInFlight = false;
            localSettingsLoaded = true;
            if (callback) callback(getLocalProSettings());
        };
        xhr.send();
    }

    function syncLocalPersonalizationCache() {
        var aliases = [];
        var runtimeNick = cleanNick(window.__haxLocalGameNick || '');
        var storedNick = getStoredLocalNick();

        if (runtimeNick) aliases.push(runtimeNick);
        if (storedNick && aliases.indexOf(storedNick) === -1) aliases.push(storedNick);
        if (!aliases.length) return;

        var entry = buildLocalPersonalizationEntry();
        for (var i = 0; i < aliases.length; i++) {
            setVerifiedCacheEntry(aliases[i], entry);
        }
        window.__verifiedCache = verifiedCache;
    }

    function getLocalPlayerIdFromPage() {
        var resultEl = document.getElementById('__hax_player_id_result');
        if (!resultEl) {
            resultEl = document.createElement('div');
            resultEl.id = '__hax_player_id_result';
            resultEl.style.display = 'none';
            document.body.appendChild(resultEl);
        }
        
        resultEl.removeAttribute('data-player-id');
        
        var script = document.createElement('script');
        script.textContent = '(function() { var el = document.getElementById("__hax_player_id_result"); if (el) { var id = window.__haxLocalPlayerId; el.setAttribute("data-player-id", id != null ? id : "null"); } })();';
        document.body.appendChild(script);
        script.remove();
        
        var playerIdStr = resultEl.getAttribute('data-player-id');
        if (playerIdStr != null && playerIdStr !== 'null') {
            return parseInt(playerIdStr, 10);
        }
        return null;
    }

    function waitForMyPlayerId(callback, maxAttempts) {
        maxAttempts = maxAttempts || 50;
        var attempts = 0;
        
        function check() {
            var id = getLocalPlayerIdFromPage();
            if (id != null) {
                callback(id);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, 200);
            }
        }
        check();
    }

    function getRoomId() {
        try {
            var url = window.top.location.href;
            var match = url.match(/[?&]c=([^&]+)/);
            if (match) {
                try {
                    return decodeURIComponent(match[1]);
                } catch (e) {
                    return match[1];
                }
            }
        } catch (e) {}
        return null;
    }

    function remoteHasPersonalization(info) {
        if (!info) return false;
        if (info.verified || info.isPro) return true;
        // CEO/DEV en la API (staff) no cuenta solo: sin perfil tocado en la app no mostramos check / pill / colores.
        return remoteHasProfileVisuals(info);
    }

    function remoteHasProfileVisuals(info) {
        if (!info) return false;
        if (info.banner && info.banner !== 'none') return true;
        if (info.font && info.font !== 'default') return true;
        if (info.nick_color || info.nick_gradient) return true;
        if (info.verified_color || info.verified_gradient) return true;
        if (info.custom_banner_color1 || info.custom_banner_color2) return true;
        return false;
    }

    function mergeRemoteProfile(base, incoming) {
        if (!base) return incoming || null;
        if (!incoming) return base;
        return {
            discord_id: incoming.discord_id || base.discord_id || null,
            verified: Boolean(base.verified || incoming.verified),
            badge: normalizeUserBadge(incoming.badge || base.badge),
            isPro: Boolean(base.isPro || incoming.isPro),
            verified_color: incoming.verified_color ?? base.verified_color ?? null,
            verified_gradient: incoming.verified_gradient ?? base.verified_gradient ?? null,
            nick_color: incoming.nick_color ?? base.nick_color ?? null,
            nick_gradient: incoming.nick_gradient ?? base.nick_gradient ?? null,
            banner: incoming.banner ?? base.banner ?? null,
            font: incoming.font ?? base.font ?? null,
            custom_banner_color1: incoming.custom_banner_color1 ?? base.custom_banner_color1 ?? null,
            custom_banner_color2: incoming.custom_banner_color2 ?? base.custom_banner_color2 ?? null,
            goal_anthem_enabled: Boolean(incoming.goal_anthem_enabled ?? base.goal_anthem_enabled),
            goal_anthem_text: incoming.goal_anthem_text != null ? String(incoming.goal_anthem_text) : base.goal_anthem_text != null ? String(base.goal_anthem_text) : '',
            goal_anthem_audio_url:
                incoming.goal_anthem_audio_url != null && String(incoming.goal_anthem_audio_url).length
                    ? String(incoming.goal_anthem_audio_url)
                    : base.goal_anthem_audio_url != null
                      ? String(base.goal_anthem_audio_url)
                      : ''
        };
    }

    function fetchMyStatus(force, callback) {
        if (typeof force === 'function') {
            callback = force;
            force = false;
        }
        if (!force && statusLoaded) { if (callback) callback(); return; }
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', LOCAL_SERVER + '/user', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data && (data.logged_in || data.discord_id)) {
                        myVerified = Boolean(data.is_verified);
                        myDiscordId = data.discord_id || null;
                        myBadge = normalizeUserBadge(data.badge);
                        myIsPro = true;
                        if (data.game_nick) {
                            storeLocalGameNick(data.game_nick);
                        }

                        window.__proStatus = {
                            is_pro: true,
                            is_vip: true,
                            allpro: true
                        };
                        window.__vipStatus = { is_vip: true };

                        var localSettings = {
                            banner: data.banner ?? null,
                            font: data.font ?? null,
                            nick_color: data.nick_color ?? null,
                            nick_gradient: data.nick_gradient ?? null,
                            verified_color: data.verified_color ?? null,
                            verified_gradient: data.verified_gradient ?? null,
                            custom_banner_color1: data.custom_banner_color1 ?? null,
                            custom_banner_color2: data.custom_banner_color2 ?? null,
                            goal_anthem_enabled: data.goal_anthem_enabled,
                            goal_anthem_text: data.goal_anthem_text,
                            goal_anthem_audio_url: data.goal_anthem_audio_url
                        };

                        updateLocalProSettings(localSettings);
                        localSettingsLoaded = true;
                        if (isActive) {
                            scheduleFullRefresh(20);
                        }
                        
                        // Injeta discord_id e flag de debug no contexto do game-min
                        if (myDiscordId) {
                            var script = document.createElement('script');
                            script.textContent = 'window.__haxDiscordId = "' + myDiscordId + '";';
                            document.body.appendChild(script);
                            script.remove();
                        }
                    } else if (force) {
                        myVerified = false;
                        myDiscordId = null;
                        myBadge = null;
                        myIsPro = true;
                    }
                    statusLoaded = true;
                } catch (e) {}
                syncLocalPersonalizationCache();
                if (callback) callback();
            }
        };
        xhr.onerror = function() { 
            if (callback) callback(); 
        };
        xhr.send();
    }

    function sendPlayerIdToServer(playerId, roomId) {
        if (playerId === lastSentPlayerId) return;
        lastSentPlayerId = playerId;
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', LOCAL_SERVER + '/session/player-id', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ player_id: playerId, room_id: roomId }));
    }

    // Pega o nick do jogador local
    function getLocalNick() {
        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) return null;
        
        var players = document.querySelectorAll('[class^="player-list-item"]');
        for (var i = 0; i < players.length; i++) {
            var pid = parseInt(players[i].dataset.playerId, 10);
            if (pid === localPlayerId) {
                var nameEl = players[i].querySelector('[data-hook="name"]');
                if (nameEl) {
                    return cleanNick((nameEl.textContent || '').trim());
                }
            }
        }
        return null;
    }

    // Envia nick do jogo para o servidor (para outros jogadores identificarem)
    function sendGameNickToServer(gameNick, roomId) {
        if (!gameNick) return;
        storeLocalGameNick(gameNick);
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', LOCAL_SERVER + '/session/game-nick', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ game_nick: gameNick, room_id: roomId }));
    }

    function notifyLeaveRoom() {
        lastSentPlayerId = null;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', LOCAL_SERVER + '/session/leave-room', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send('{}');
    }

    function fetchVerifiedUsers(players, roomId, callback) {
        if (!players.length) { callback({}); return; }

        var payloadPlayers = [];
        var nicks = [];
        for (var i = 0; i < players.length; i++) {
            if (!players[i] || !players[i].nick) continue;
            payloadPlayers.push({
                nick: players[i].nick,
                player_id: players[i].playerId
            });
            nicks.push(players[i].nick);
        }
        if (!payloadPlayers.length) { callback({}); return; }

        function normalizeRemoteProfile(data) {
            if (!data || typeof data !== 'object') return null;
            return {
                discord_id: data.discord_id != null ? String(data.discord_id) : null,
                verified: Boolean(data.verified || data.is_verified),
                badge: normalizeUserBadge(data.badge),
                isPro: Boolean(data.isPro || data.is_pro || data.is_vip),
                verified_color: data.verified_color ?? null,
                verified_gradient: data.verified_gradient ?? null,
                nick_color: data.nick_color ?? null,
                nick_gradient: data.nick_gradient ?? null,
                banner: data.banner ?? null,
                font: data.font ?? null,
                custom_banner_color1: data.custom_banner_color1 ?? null,
                custom_banner_color2: data.custom_banner_color2 ?? null,
                goal_anthem_enabled: Boolean(data.goal_anthem_enabled),
                goal_anthem_text: data.goal_anthem_text != null ? String(data.goal_anthem_text) : '',
                goal_anthem_audio_url: data.goal_anthem_audio_url != null ? String(data.goal_anthem_audio_url) : ''
            };
        }

        function fetchByNickFallback(missingNicks, existingResult) {
            if (!missingNicks.length) {
                callback(existingResult);
                return;
            }

            var remaining = missingNicks.length;
            var merged = Object.assign({}, existingResult);

            function finishOne() {
                remaining--;
                if (remaining <= 0) {
                    callback(merged);
                }
            }

            for (var j = 0; j < missingNicks.length; j++) {
                (function(nick) {
                    var existingProfile = merged[nick] || null;
                    if (!existingProfile || !existingProfile.discord_id) {
                        finishOne();
                        return;
                    }
                    var fallbackUrl = LOCAL_SERVER + '/friends/user?discord_id=' + encodeURIComponent(String(existingProfile.discord_id));
                    var fallbackXhr = new XMLHttpRequest();
                    fallbackXhr.open('GET', fallbackUrl, true);
                    fallbackXhr.onreadystatechange = function() {
                        if (fallbackXhr.readyState !== 4) return;
                        try {
                            var fallbackData = JSON.parse(fallbackXhr.responseText);
                            var normalized = normalizeRemoteProfile(fallbackData);
                            if (normalized && remoteHasPersonalization(normalized)) {
                                merged[nick] = mergeRemoteProfile(merged[nick] || null, normalized);
                            }
                        } catch (e) {}
                        finishOne();
                    };
                    fallbackXhr.onerror = finishOne;
                    fallbackXhr.send();
                })(missingNicks[j]);
            }
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', LOCAL_SERVER + '/verified-v2', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;

            var result = {};
            try {
                var parsed = JSON.parse(xhr.responseText);
                if (parsed && typeof parsed === 'object') {
                    for (var nick in parsed) {
                        var normalizedEntry = normalizeRemoteProfile(parsed[nick]);
                        if (normalizedEntry) {
                            result[nick] = normalizedEntry;
                        }
                    }
                }
            } catch (e) {}

            var unresolved = [];
            for (var k = 0; k < nicks.length; k++) {
                if (result[nicks[k]] && result[nicks[k]].discord_id && !remoteHasProfileVisuals(result[nicks[k]])) {
                    unresolved.push(nicks[k]);
                }
            }

            fetchByNickFallback(unresolved, result);
        };
        xhr.onerror = function() {
            fetchByNickFallback(nicks.slice(), {});
        };
        xhr.send(JSON.stringify({ nicks: nicks, players: payloadPlayers, room_id: roomId }));
    }

    function setVerifiedCacheEntry(nick, data) {
        if (!nick) return;
        verifiedCache[nick] = Object.assign({}, data || {}, {
            __fetchedAt: Date.now()
        });
    }

    function getVerifiedCacheEntry(nick) {
        if (!nick || !verifiedCache[nick]) return null;
        return verifiedCache[nick];
    }

    function isVerifiedCacheStale(nick) {
        var entry = getVerifiedCacheEntry(nick);
        if (!entry) return true;
        return !entry.__fetchedAt || (Date.now() - entry.__fetchedAt > VERIFIED_CACHE_TTL_MS);
    }

    function scheduleFullRefresh(delay) {
        if (processDebounceTimer) {
            clearTimeout(processDebounceTimer);
        }
        processDebounceTimer = setTimeout(function() {
            processDebounceTimer = null;
            processPlayers();
        }, delay || 120);
    }

    function applyBadge(item) {
        if (isGhostMode()) {
            return;
        }

        var nameEl = item.querySelector('[data-hook="name"]');
        if (!nameEl) return;
        var verifiedEnabled = isVerifiedEnabled();

        var rawName = getNickText(nameEl);
        var name = cleanNick(rawName); // Nick sem o caractere invisível (compatibilidade)
        var playerId = parseInt(item.dataset.playerId, 10);
        var localPlayerId = getLocalPlayerId();
        var isLocalRow = isLocalPlayerRow(item, localPlayerId);
        var localProSettings = getLocalProSettings();
        var forceVisibleWhenDisabled = false;

        var showBadge = false;
        var userRoleBadge = null;
        var badgeColor = '#249EF0'; // Cor padrão
        var badgeGradient = ''; // Gradiente do badge
        var nickColor = null;
        var nickGradient = ''; // Gradiente do nick
        var banner = null;
        var font = null;
        var customBannerC1 = null;
        var customBannerC2 = null;

        if (isLocalRow) {
            var localQualifies = Boolean(
                myVerified ||
                myIsPro ||
                hasUsableLocalProSettings(localProSettings)
            );
            userRoleBadge = localQualifies ? myBadge : null;
            forceVisibleWhenDisabled = Boolean(localQualifies);
            if (!hasUsableLocalProSettings(localProSettings) && !localSettingsLoaded) {
                ensureLocalProSettings();
            }
            if (localQualifies) {
                showBadge = true;
                if (localProSettings) {
                    if (localProSettings.verified_color) badgeColor = localProSettings.verified_color;
                    if (localProSettings.verified_gradient) badgeGradient = localProSettings.verified_gradient;
                    if (localProSettings.nick_color) nickColor = localProSettings.nick_color;
                    if (localProSettings.nick_gradient) nickGradient = localProSettings.nick_gradient;
                    if (localProSettings.banner) banner = localProSettings.banner;
                    if (localProSettings.font) font = localProSettings.font;
                    if (localProSettings.custom_banner_color1) customBannerC1 = localProSettings.custom_banner_color1;
                    if (localProSettings.custom_banner_color2) customBannerC2 = localProSettings.custom_banner_color2;
                }
            }
        } else {
            var info = verifiedCache[name];
            if (info && myDiscordId && info.discord_id && String(info.discord_id) === String(myDiscordId)) {
                var myNickAliases = [
                    cleanNick(window.__haxLocalGameNick || ''),
                    getStoredLocalNick()
                ].filter(Boolean);
                if (myNickAliases.length && myNickAliases.indexOf(name) === -1) {
                    info = null;
                }
            }
            if (info) {
                var remoteQualifies = remoteHasPersonalization(info);
                userRoleBadge = remoteQualifies ? normalizeUserBadge(info.badge) : null;
                forceVisibleWhenDisabled = Boolean(remoteQualifies);
                if (remoteQualifies) {
                    // Misma condición que remoteHasPersonalization: verificado, Pro o perfil editado en la app.
                    showBadge = true;
                    if (info.verified_color) badgeColor = info.verified_color;
                    if (info.verified_gradient) badgeGradient = info.verified_gradient;
                    if (info.nick_color) nickColor = info.nick_color;
                    if (info.nick_gradient) nickGradient = info.nick_gradient;
                    if (info.banner) banner = info.banner;
                    if (info.font) font = info.font;
                    if (info.custom_banner_color1) customBannerC1 = info.custom_banner_color1;
                    if (info.custom_banner_color2) customBannerC2 = info.custom_banner_color2;
                }
            }
        }

        if (!verifiedEnabled && !forceVisibleWhenDisabled) {
            clearPlayerDecorations(item);
            return;
        }

        // Aplica banner Pro (mesmo sem badge de verificado)
        applyBanner(item, banner, playerId, localPlayerId, name, customBannerC1, customBannerC2);
        
        // Aplica fonte Pro
        applyFont(nameEl, font, playerId, localPlayerId, name);

        nameEl.setAttribute('data-base-nick', name);

        // Cor/gradiente Pro: ANTES se bloqueaba si la fila tenía class "admin" (host en sala).
        // Eso dejaba al host sin nick personalizado. Solo respetamos el color default del juego
        // si NO hay estilos Pro/verificado propios.
        if (nickGradient) {
                var colors = nickGradient.split(',');
                var gradientCSS = 'linear-gradient(90deg, ' + colors[0].trim() + ', ' + colors[1].trim() + ')';
                // Aplica no primeiro nó de texto (span do nick), não no container inteiro
                var nickSpan = nameEl.childNodes[0];
                if (nickSpan && nickSpan.nodeType === 3) {
                    // É um nó de texto, precisa envolver em span
                    var wrapper = document.createElement('span');
                    wrapper.className = 'nick-gradient';
                    wrapper.textContent = nickSpan.textContent;
                    nameEl.replaceChild(wrapper, nickSpan);
                    nickSpan = wrapper;
                } else if (!nickSpan || !nickSpan.classList || !nickSpan.classList.contains('nick-gradient')) {
                    // Procura span existente ou cria um
                    var existingWrapper = nameEl.querySelector('.nick-gradient');
                    if (existingWrapper) {
                        nickSpan = existingWrapper;
                    } else {
                        // Pega o texto do nick (antes das badges)
                        var textContent = '';
                        for (var n = 0; n < nameEl.childNodes.length; n++) {
                            if (nameEl.childNodes[n].nodeType === 3) {
                                textContent += nameEl.childNodes[n].textContent;
                            }
                        }
                        if (textContent.trim()) {
                            var wrapper = document.createElement('span');
                            wrapper.className = 'nick-gradient';
                            wrapper.textContent = textContent.trim();
                            // Remove nós de texto antigos
                            for (var n = nameEl.childNodes.length - 1; n >= 0; n--) {
                                if (nameEl.childNodes[n].nodeType === 3) {
                                    nameEl.removeChild(nameEl.childNodes[n]);
                                }
                            }
                            nameEl.insertBefore(wrapper, nameEl.firstChild);
                            nickSpan = wrapper;
                        }
                    }
                }
                if (nickSpan && nickSpan.style) {
                    nickSpan.style.setProperty('background', gradientCSS, 'important');
                    nickSpan.style.setProperty('-webkit-background-clip', 'text', 'important');
                    nickSpan.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
                    nickSpan.style.setProperty('background-clip', 'text', 'important');
                    nickSpan.style.setProperty('display', 'inline-block', 'important');
                    nickSpan.style.setProperty('color', 'transparent', 'important');
                }
                // Limpa estilos do container
                nameEl.style.color = '';
        } else if (nickColor) {
            var gradientWrapper2 = nameEl.querySelector('.nick-gradient');
            if (gradientWrapper2) {
                var text2 = gradientWrapper2.textContent;
                gradientWrapper2.replaceWith(document.createTextNode(text2));
            }
            nameEl.style.background = '';
            nameEl.style.webkitBackgroundClip = '';
            nameEl.style.webkitTextFillColor = '';
            nameEl.style.backgroundClip = '';
            nameEl.style.display = '';
            nameEl.style.color = nickColor;
        } else {
            // Siempre quitar nuestros estilos de nick si esta pasada no aplica gradiente/color Pro.
            // Antes se exceptuaba .admin (host de sala en HaxBall ≠ staff de la app); eso dejaba pegado
            // el perfil de otro (p. ej. el tuyo) en filas admin. El color nativo del juego vuelve por CSS.
            var gradientWrapper3 = nameEl.querySelector('.nick-gradient');
            if (gradientWrapper3) {
                var text3 = gradientWrapper3.textContent;
                gradientWrapper3.replaceWith(document.createTextNode(text3));
            }
            nameEl.style.background = '';
            nameEl.style.webkitBackgroundClip = '';
            nameEl.style.webkitTextFillColor = '';
            nameEl.style.backgroundClip = '';
            nameEl.style.display = '';
            nameEl.style.color = '';
        }

        var existingRoleBadge = item.querySelector('.user-role-badge');
        if (existingRoleBadge) {
            existingRoleBadge.remove();
        }

        var existingBadge = item.querySelector('.verified-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        var roleBadgeEl = createRoleBadge(userRoleBadge);

        togglePlayerFlag(item, !!roleBadgeEl);

        if (!showBadge) {
            if (roleBadgeEl) {
                item.insertBefore(roleBadgeEl, nameEl);
            }
            return;
        }

        var badge = document.createElement('span');
        badge.className = 'verified-badge';

        // Badge com gradiente ou cor sólida (mesmo SVG 12x12 que na preview Pro)
        if (badgeGradient) {
            var colors = badgeGradient.split(',');
            badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 22 22"><defs><linearGradient id="vg-' + playerId + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + colors[0] + '"/><stop offset="100%" stop-color="' + colors[1] + '"/></linearGradient></defs><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="url(#vg-' + playerId + ')"/><path d="M15 9l-4.5 4.5L8 11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else {
            badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="' + badgeColor + '"/><path d="M15 9l-4.5 4.5L8 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        badge.style.cssText = 'display:inline-flex;align-items:center;margin-left:6px;margin-right:0;vertical-align:middle;';

        var teamBadge = nameEl.querySelector('.team-badge');
        if (roleBadgeEl) {
            nameEl.insertBefore(roleBadgeEl, nameEl.firstChild);
        }
        if (teamBadge) {
            nameEl.insertBefore(badge, teamBadge);
        } else {
            nameEl.appendChild(badge);
        }
    }

    // Aplica fonte Pro no nick
    function applyFont(nameEl, font, playerId, localPlayerId, name) {
        // Fontes disponíveis
        var fonts = window.__proFonts || {
            'default': { family: 'Space Grotesk' },
            'roboto': { family: 'Roboto' },
            'poppins': { family: 'Poppins' },
            'montserrat': { family: 'Montserrat' },
            'oswald': { family: 'Oswald' },
            'raleway': { family: 'Raleway' },
            'ubuntu': { family: 'Ubuntu' },
            'quicksand': { family: 'Quicksand' },
            'comfortaa': { family: 'Comfortaa' },
            'righteous': { family: 'Righteous' },
            'orbitron': { family: 'Orbitron' },
            'pressstart': { family: 'Press Start 2P' }
        };

        // Remove fonte customizada se não tiver fonte válida
        if (!font || font === 'default' || !fonts[font]) {
            nameEl.style.removeProperty('font-family');
            return;
        }

        var fontFamily = fonts[font].family;
        // Usa setProperty com 'important' para sobrescrever o CSS global
        nameEl.style.setProperty('font-family', "'" + fontFamily + "', sans-serif", 'important');
    }

    // Aplica banner Pro no fundo do player-list-item
    function applyBanner(item, banner, playerId, localPlayerId, name, customC1, customC2) {
        // Banners disponíveis
        var banners = window.__proBanners || {
            'none': { gradient: 'none' },
            'gold': { gradient: 'linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,193,7,0.25) 50%, rgba(255,215,0,0.15) 100%)' },
            'diamond': { gradient: 'linear-gradient(90deg, rgba(185,242,255,0.15) 0%, rgba(0,191,255,0.25) 50%, rgba(185,242,255,0.15) 100%)' },
            'fire': { gradient: 'linear-gradient(90deg, rgba(255,69,0,0.15) 0%, rgba(255,140,0,0.25) 50%, rgba(255,69,0,0.15) 100%)' },
            'emerald': { gradient: 'linear-gradient(90deg, rgba(0,201,87,0.15) 0%, rgba(80,200,120,0.25) 50%, rgba(0,201,87,0.15) 100%)' },
            'purple': { gradient: 'linear-gradient(90deg, rgba(138,43,226,0.15) 0%, rgba(186,85,211,0.25) 50%, rgba(138,43,226,0.15) 100%)' },
            'rainbow': { gradient: 'linear-gradient(90deg, rgba(255,0,0,0.2) 0%, rgba(255,127,0,0.2) 17%, rgba(255,255,0,0.2) 33%, rgba(0,255,0,0.2) 50%, rgba(0,127,255,0.2) 67%, rgba(139,0,255,0.2) 83%, rgba(255,0,0,0.2) 100%)' },
            'neon': { gradient: 'linear-gradient(90deg, rgba(57,255,20,0.15) 0%, rgba(0,255,255,0.25) 50%, rgba(57,255,20,0.15) 100%)' },
            'sunset': { gradient: 'linear-gradient(90deg, rgba(255,94,77,0.15) 0%, rgba(255,154,0,0.25) 50%, rgba(255,94,77,0.15) 100%)' },
            'ocean': { gradient: 'linear-gradient(90deg, rgba(0,105,148,0.15) 0%, rgba(0,168,232,0.25) 50%, rgba(0,105,148,0.15) 100%)' },
            'midnight': { gradient: 'linear-gradient(90deg, rgba(25,25,112,0.2) 0%, rgba(72,61,139,0.3) 50%, rgba(25,25,112,0.2) 100%)' },
            'cherry': { gradient: 'linear-gradient(90deg, rgba(222,49,99,0.15) 0%, rgba(255,105,180,0.25) 50%, rgba(222,49,99,0.15) 100%)' },
            'custom': { gradient: 'none' }
        };

        // Remove banner existente
        item.classList.remove('pro-banner');
        item.style.removeProperty('--pro-banner-gradient');

        // Verifica se tem banner válido
        if (!banner || banner === 'none') {
            return;
        }

        var gradient;
        if (banner === 'custom' && customC1 && customC2) {
            // Banner personalizado
            gradient = 'linear-gradient(90deg, ' + customC1 + '33 0%, ' + customC2 + '44 50%, ' + customC1 + '33 100%)';
        } else if (banners[banner] && banners[banner].gradient !== 'none') {
            gradient = banners[banner].gradient;
        }

        if (gradient) {
            item.classList.add('pro-banner');
            item.style.setProperty('--pro-banner-gradient', gradient);
        }
    }

    // Função para reprocessar banners
    function refreshBanners() {
        if (!isActive) return;
        if (!isVerifiedEnabled()) {
            refreshBadges();
            return;
        }
        var players = document.querySelectorAll('[class^="player-list-item"]');
        var localPlayerId = getLocalPlayerId();
        var localProSettings = getLocalProSettings();
        
        for (var i = 0; i < players.length; i++) {
            var item = players[i];
            var nameEl = item.querySelector('[data-hook="name"]');
            if (!nameEl) continue;
            
            var name = cleanNick(getNickText(nameEl));
            var playerId = parseInt(item.dataset.playerId, 10);
            var banner = null;
            var customBannerC1 = null;
            var customBannerC2 = null;
            
            if (isLocalPlayerRow(item, localPlayerId) && localProSettings) {
                banner = localProSettings.banner;
                customBannerC1 = localProSettings.custom_banner_color1;
                customBannerC2 = localProSettings.custom_banner_color2;
            } else {
                var info = getVerifiedCacheEntry(name);
                if (info && info.banner) {
                    banner = info.banner;
                    customBannerC1 = info.custom_banner_color1;
                    customBannerC2 = info.custom_banner_color2;
                }
            }
            
            applyBanner(item, banner, playerId, localPlayerId, name, customBannerC1, customBannerC2);
        }
    }

    // Função para reprocessar fontes
    function refreshFonts() {
        if (!isActive) return;
        if (!isVerifiedEnabled()) {
            refreshBadges();
            return;
        }
        var players = document.querySelectorAll('[class^="player-list-item"]');
        var localPlayerId = getLocalPlayerId();
        var localProSettings = getLocalProSettings();
        
        for (var i = 0; i < players.length; i++) {
            var item = players[i];
            var nameEl = item.querySelector('[data-hook="name"]');
            if (!nameEl) continue;
            
            var name = cleanNick(getNickText(nameEl));
            var playerId = parseInt(item.dataset.playerId, 10);
            var font = null;
            
            if (isLocalPlayerRow(item, localPlayerId) && localProSettings) {
                font = localProSettings.font;
            } else {
                var info = getVerifiedCacheEntry(name);
                if (info && info.font) {
                    font = info.font;
                }
            }
            
            applyFont(nameEl, font, playerId, localPlayerId, name);
        }
    }

    function processPlayers() {
        if (!isActive) return;
        
        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) {
            var runtimeLocalId = getLocalPlayerIdFromPage();
            if (runtimeLocalId != null && !isNaN(runtimeLocalId)) {
                window.__myLocalPlayerId = runtimeLocalId;
                localPlayerId = runtimeLocalId;
            }
        }
        var roomId = getRoomId();
        if (roomId !== activeRoomId) {
            activeRoomId = roomId || null;
            verifiedCache = {};
            window.__verifiedCache = verifiedCache;
        }
        syncLocalPersonalizationCache();
        
        if (localPlayerId != null && localPlayerId !== lastSentPlayerId) {
            sendPlayerIdToServer(localPlayerId, roomId);
        }
        
        var players = document.querySelectorAll('[class^="player-list-item"]');
        if (!players.length) return;
        clearLocalPlayerMarks();

        var playersToResolve = [];
        var localNickSent = false;
        var localRow = resolveImmediateLocalRow(players, localPlayerId, true);
        
        // Processa jogador local primeiro para mostrar badge instantaneamente
        if (localRow) {
            markLocalPlayerItem(localRow);
            var localNameEl = localRow.querySelector('[data-hook="name"]');
            if (localNameEl) {
                var localRawNick = getNickText(localNameEl);
                var localNick = cleanNick(localRawNick);
                storeLocalGameNick(localNick);
                
                if (!localNickSent) {
                    sendGameNickToServer(localNick, roomId);
                    localNickSent = true;
                }
                
                applyBadge(localRow);
            }
        }

        // Depois processa os outros jogadores
        for (var i = 0; i < players.length; i++) {
            var nameEl = players[i].querySelector('[data-hook="name"]');
            // Pula jogador local (já processado)
            if (players[i] === localRow || isLocalPlayerRow(players[i], localPlayerId)) continue;
            
            if (nameEl) {
                var rawNick = getNickText(nameEl);
                var nick = cleanNick(rawNick); // Nick limpo para busca
                
                // Sempre aplica badge (applyBadge já verifica se precisa)
                applyBadge(players[i]);
                
                // Busca pelo nick limpo (só se não tiver no cache)
                if (nick && isVerifiedCacheStale(nick)) {
                    playersToResolve.push({
                        nick: nick,
                        playerId: parseInt(players[i].dataset.playerId, 10)
                    });
                }
            }
        }

        if (playersToResolve.length === 0) return;

        fetchVerifiedUsers(playersToResolve, roomId, function(result) {
            for (var nick in result) {
                setVerifiedCacheEntry(nick, result[nick]);
            }
            for (var k = 0; k < playersToResolve.length; k++) {
                var pendingNick = playersToResolve[k].nick;
                if (!verifiedCache[pendingNick] || !verifiedCache[pendingNick].__fetchedAt) {
                    setVerifiedCacheEntry(pendingNick, { verified: false, playerId: null, discordId: null, isPro: false });
                }
            }
            window.__verifiedCache = verifiedCache;
            try {
                localStorage.setItem('haxclient_verified_cache', JSON.stringify(verifiedCache));
            } catch(e) {}
            
            // Aplica só nos jogadores que buscamos
            var ps = document.querySelectorAll('[class^="player-list-item"]');
            for (var m = 0; m < ps.length; m++) {
                var nameEl = ps[m].querySelector('[data-hook="name"]');
                if (nameEl) {
                    var rawNick = getNickText(nameEl);
                    var nick = cleanNick(rawNick); // Nick limpo para comparação
                    if (result[nick] || playersToResolve.some(function(entry) { return entry.nick === nick; })) {
                        applyBadge(ps[m]);
                    }
                }
            }
        });
    }

    // Processa só jogadores novos (chamado pelo MutationObserver)
    function processNewPlayers(items) {
        if (!isActive) return;
        var localPlayerId = getLocalPlayerId();
        var localCandidate = resolveImmediateLocalRow(items, localPlayerId, false);
        var roomId = getRoomId();
        var newPlayersToResolve = [];
        if (localCandidate) {
            markLocalPlayerItem(localCandidate);
            var nameEl = localCandidate.querySelector('[data-hook="name"]');
            if (nameEl) {
                var nick = cleanNick(getNickText(nameEl));
                storeLocalGameNick(nick);
                sendGameNickToServer(nick, roomId);
            }
        }
        for (var i = 0; i < items.length; i++) {
            applyBadge(items[i]);
            if (items[i] === localCandidate || isLocalPlayerRow(items[i], localPlayerId)) continue;
            var remoteNameEl = items[i].querySelector('[data-hook="name"]');
            if (!remoteNameEl) continue;
            var remoteNick = cleanNick(getNickText(remoteNameEl));
            if (!remoteNick || !isVerifiedCacheStale(remoteNick)) continue;
            newPlayersToResolve.push({
                nick: remoteNick,
                playerId: parseInt(items[i].dataset.playerId, 10)
            });
        }
        if (newPlayersToResolve.length) {
            fetchVerifiedUsers(newPlayersToResolve, roomId, function(result) {
                for (var nick in result) {
                    setVerifiedCacheEntry(nick, result[nick]);
                }
                for (var k = 0; k < newPlayersToResolve.length; k++) {
                    var pendingNick = newPlayersToResolve[k].nick;
                    if (!verifiedCache[pendingNick] || !verifiedCache[pendingNick].__fetchedAt) {
                        setVerifiedCacheEntry(pendingNick, { verified: false, playerId: null, discordId: null, isPro: false });
                    }
                }
                window.__verifiedCache = verifiedCache;
                for (var m = 0; m < items.length; m++) {
                    applyBadge(items[m]);
                }
            });
        }
        scheduleFullRefresh(40);
    }

    function attachListObservers(lists) {
        if (listObservers.length !== 0) return;
        for (var i = 0; i < lists.length; i++) {
            var observer = new MutationObserver(function(mutations) {
                var addedItems = [];
                var shouldRefreshAll = false;
                for (var j = 0; j < mutations.length; j++) {
                    if (mutations[j].removedNodes && mutations[j].removedNodes.length > 0) {
                        shouldRefreshAll = true;
                    }
                    var added = mutations[j].addedNodes;
                    for (var k = 0; k < added.length; k++) {
                        if (added[k].nodeType === 1 && added[k].className && added[k].className.indexOf('player-list-item') !== -1) {
                            addedItems.push(added[k]);
                        }
                    }
                }
                if (shouldRefreshAll) {
                    scheduleFullRefresh(60);
                }
                if (addedItems.length > 0) {
                    processNewPlayers(addedItems);
                }
            });
            observer.observe(lists[i], { childList: true });
            listObservers.push(observer);
        }
    }

    function scheduleObserverRetry(delay) {
        if (observerRetryTimer) return;
        observerRetryTimer = setTimeout(function() {
            observerRetryTimer = null;
            startObserver();
        }, delay || 250);
    }

    function startObserver() {
        if (observerInitialized && isActive && listObservers.length) {
            ensureApplyProfileButton();
            processPlayers();
            return;
        }
        var lists = document.querySelectorAll('.player-list-view .list[data-hook="list"]');
        if (!lists.length) {
            scheduleObserverRetry(200);
            return;
        }

        observerInitialized = true;
        isActive = true;
        attachListObservers(lists);
        ensureApplyProfileButton();
        ensureLocalProSettings();
        if (typeof window.__proLoadSettings === 'function') {
            window.__proLoadSettings().then(function() {
                scheduleFullRefresh(20);
            }).catch(function() {});
        }

        if (!refreshTimer) {
            refreshTimer = setInterval(function() {
                if (!isActive) return;
                ensureApplyProfileButton();
                processPlayers();
            }, 1200);
        }

        fetchMyStatus(true, function() {
            processPlayers();
        });
    }

    function resetObserver() {
        isActive = false;
        observerInitialized = false;
        window.__myLocalPlayerId = null;
        lastSentPlayerId = null;
        activeRoomId = null;
        verifiedCache = {};
        window.__verifiedCache = verifiedCache;
        clearLocalPlayerMarks();
        var applyBtn = document.getElementById('hax-apply-profile-btn');
        if (applyBtn) applyBtn.remove();
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        if (processDebounceTimer) {
            clearTimeout(processDebounceTimer);
            processDebounceTimer = null;
        }
        if (observerRetryTimer) {
            clearTimeout(observerRetryTimer);
            observerRetryTimer = null;
        }
        for (var i = 0; i < listObservers.length; i++) {
            listObservers[i].disconnect();
        }
        listObservers = [];
    }

    // Função para reprocessar badges (chamada quando configurações Pro são carregadas)
    function refreshBadges() {
        if (!isActive) return;
        var players = document.querySelectorAll('[class^="player-list-item"]');
        for (var i = 0; i < players.length; i++) {
            applyBadge(players[i]);
        }
    }

    function applyProfilesNow() {
        fetchMyStatus(true, function() {
            processPlayers();
            refreshBadges();
            refreshBanners();
            refreshFonts();
        });
    }

    function findRoomToolbarHost() {
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var label = cleanNick((buttons[i].textContent || '').trim()).toLowerCase();
            if (label === 'rec') {
                return buttons[i].parentElement || null;
            }
        }
        return null;
    }

    function ensureApplyProfileButton() {
        var existing = document.getElementById('hax-apply-profile-btn');
        if (existing) existing.remove();
    }

    function recoverRoomProfilesIfNeeded() {
        var hasRoomView = Boolean(document.querySelector('.room-view'));
        var hasGameView = Boolean(document.querySelector('.game-view'));
        var hasPlayerLists = Boolean(document.querySelector('.player-list-view .list[data-hook="list"]'));

        if (!hasRoomView && !hasGameView) {
            if (observerInitialized || isActive || listObservers.length) {
                resetObserver();
            }
            return;
        }

        if (!hasPlayerLists) {
            if (!observerInitialized) {
                scheduleObserverRetry(250);
            }
            return;
        }

        if (!observerInitialized || !isActive || listObservers.length === 0) {
            startObserver();
            return;
        }

        ensureApplyProfileButton();
    }

    function init() {
        if (!Injector.isGameFrame()) {
            return;
        }
        
        // Exporta função de refresh globalmente
        window.__refreshVerifiedBadges = refreshBadges;
        window.__refreshProBanners = refreshBanners;
        window.__refreshProFonts = refreshFonts;
        window.__hxdSyncLocalPersonalizationCache = syncLocalPersonalizationCache;
        window.addEventListener('hax-verified-toggle-changed', function() {
            if (isVerifiedEnabled()) {
                processPlayers();
            } else {
                refreshBadges();
            }
        });
        
        fetchMyStatus(function() {
            Injector.onView('room-view', function() {
                ensureApplyProfileButton();
                setTimeout(startObserver, 100);
            });

            Injector.onView('game-view', function() {
                setTimeout(recoverRoomProfilesIfNeeded, 120);
            });
            
            Injector.onViewLeave('room-view', function() {
                setTimeout(function() {
                    if (document.querySelector('.room-view') || document.querySelector('.game-view')) {
                        return;
                    }
                    resetObserver();
                    notifyLeaveRoom();
                }, 150);
            });
            
            if (document.querySelector('.room-view')) {
                setTimeout(startObserver, 100);
            }

            recoverRoomProfilesIfNeeded();
            if (!observerWatchdogTimer) {
                observerWatchdogTimer = setInterval(function() {
                    try {
                        recoverRoomProfilesIfNeeded();
                    } catch (e) {}
                }, 750);
            }

        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
