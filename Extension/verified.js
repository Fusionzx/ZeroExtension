// ============================================
// VERIFIED - Badge de verificado (v2)
// Usa player ID para identificar usuários reais
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var LOCAL_SERVER = 'http://127.0.0.1:5483';
    var BADGE_SVG = '<svg width="12" height="12" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="#249EF0"/><path d="M15 9l-4.5 4.5L8 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var verifiedCache = {};
    window.__verifiedCache = verifiedCache; // Expõe globalmente desde o início
    window.__hxdAvatarProfilesByPlayerId = window.__hxdAvatarProfilesByPlayerId || {};
    var myVerified = false;
    var myDiscordId = null; // Discord ID do usuário local
    var myBadge = null;
    var myIsPro = false;
    var myAvatarUrl = null;
    var myAvatarDisabled = false;
    var myAvatarVisibleSelfOnly = true;
    var myAvatarVisibleTeam = false;
    var myAvatarVisibleRival = false;
    var myAvatarTeamBorder = false;
    var myAvatarTeamBorderRed = 1;
    var myAvatarTeamBorderBlue = 1;
    var myAvatarTeamBorderWidth = 3;
    var myAvatarTeamBorderInset = false;

    var statusLoaded = false;
    var listObservers = [];
    var isActive = false;
    var lastSentPlayerId = null;
    var lastSentPlayerRoomId = null;
    var lastSentPlayerAt = 0;
    var observerInitialized = false;
    var refreshTimer = null;
    var remoteAvatarPollTimer = null;
    var processDebounceTimer = null;
    var avatarPublishTimer = null;
    var observerRetryTimer = null;
    var observerWatchdogTimer = null;
    var VERIFIED_CACHE_TTL_MS = 400;
    var REMOTE_AVATAR_POLL_MS = 500;
    var verifiedFetchInFlight = 0;
    var VERIFIED_DISABLED_KEY = 'hax_verified_disabled';
    var activeRoomId = null;
    var lastSentNicknameInput = '';
    var nicknameInputWatcherStarted = false;
    var nicknameInputWatchTimer = null;
    var nicknameInputDebounceTimer = null;
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

    function resolveEffectivePlayerId(rowPlayerId, fallbackId) {
        if (rowPlayerId != null && !isNaN(rowPlayerId)) return rowPlayerId;
        if (fallbackId != null && !isNaN(fallbackId)) return fallbackId;
        return null;
    }

    function hasAvatarDiscordSession() {
        return Boolean(myDiscordId || window.__haxDiscordId || window.__hxdAvatarDiscordAllowed);
    }

    function getResolvedMyAvatarUrl() {
        if (!hasAvatarDiscordSession()) return null;
        try {
            var fromStorage = localStorage.getItem('hxd_settings_preview_avatar');
            if (fromStorage) return fromStorage;
        } catch (e) {}
        if (myAvatarUrl) return myAvatarUrl;
        if (window.__hxdMyAvatarUrl) return window.__hxdMyAvatarUrl;
        return null;
    }

    function syncLocalAvatarFromStorage() {
        try {
            var fromStorage = localStorage.getItem('hxd_settings_preview_avatar');
            if (fromStorage) myAvatarUrl = fromStorage;
        } catch (eStorage) {}
    }

    function escapeScriptString(value) {
        return String(value == null ? '' : value)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/</g, '\\u003c');
    }

    var avatarRuntimeBridgeInjected = false;

    function getExtensionResourceUrl(path) {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                return chrome.runtime.getURL(path);
            }
        } catch (eUrl) {}
        return path;
    }

    function ensureAvatarRuntimeBridge() {
        try {
            if (document.getElementById('hxd-avatar-runtime-bridge')) {
                avatarRuntimeBridgeInjected = true;
                return;
            }
            var root = document.documentElement || document.head || document.body;
            if (!root) return;
            var script = document.createElement('script');
            script.id = 'hxd-avatar-runtime-bridge';
            script.src = getExtensionResourceUrl('avatar-runtime-bridge.js');
            script.async = false;
            root.appendChild(script);
            avatarRuntimeBridgeInjected = true;
        } catch (eBridge) {}
    }

    function postAvatarRuntimeMessage(message) {
        ensureAvatarRuntimeBridge();
        try { window.postMessage(message, '*'); } catch (ePost) {}
        setTimeout(function () {
            try { window.postMessage(message, '*'); } catch (ePostLater) {}
        }, avatarRuntimeBridgeInjected ? 40 : 120);
    }

    var lastLocalPlayerIdRequestAt = 0;
    var localPlayerIdRequestSeq = 0;

    window.addEventListener('message', function(event) {
        var data = event && event.data;
        if (event.source !== window || !data || data.__hxdLocalPlayerIdResponse !== true) return;
        var id = parseInt(data.player_id, 10);
        if (!isNaN(id)) {
            window.__myLocalPlayerId = id;
            syncAvatarRuntimeForLocalPlayer();
            publishAvatarProfilesToRuntime();
        }
    });

    function requestLocalPlayerIdFromRuntime() {
        var now = Date.now();
        if (now - lastLocalPlayerIdRequestAt < 120) return;
        lastLocalPlayerIdRequestAt = now;
        localPlayerIdRequestSeq++;
        postAvatarRuntimeMessage({
            __hxdRequestLocalPlayerId: true,
            requestId: localPlayerIdRequestSeq
        });
    }

    function injectAvatarGlobalsToRuntime() {
        try {
            var avatarUrl = getResolvedMyAvatarUrl();
            var visibleAll = getAvatarVisibleAllToggle();
            var borderStyle = getAvatarBorderStyleFromStorage();
            var discordAllowed = hasAvatarDiscordSession();
            postAvatarRuntimeMessage({
                __hxdAvatarGlobals: true,
                globals: {
                    discord_id: myDiscordId || window.__haxDiscordId || null,
                    avatar_discord_allowed: discordAllowed,
                    avatar_url: avatarUrl || null,
                    avatar_disabled: getAvatarStorageToggle('hxd_avatar_disabled', myAvatarDisabled),
                    avatar_visible_self_only: getAvatarStorageToggle('hxd_avatar_visible_self_only', myAvatarVisibleSelfOnly),
                    avatar_visible_team: visibleAll,
                    avatar_visible_rival: visibleAll,
                    avatar_team_border: getAvatarStorageToggle('hxd_avatar_team_border', myAvatarTeamBorder),
                    avatar_team_border_red: borderStyle.avatar_team_border_red,
                    avatar_team_border_blue: borderStyle.avatar_team_border_blue,
                    avatar_team_border_width: borderStyle.avatar_team_border_width,
                    avatar_team_border_inset: borderStyle.avatar_team_border_inset
                }
            });
        } catch (eInject) {}
    }

    function getAvatarStorageShade(key, fallback) {
        try {
            var v = localStorage.getItem(key);
            if (v === null || v === '') return fallback;
            var n = parseInt(v, 10);
            if (isNaN(n)) return fallback;
            return Math.min(2, Math.max(0, n));
        } catch (e) {
            return fallback;
        }
    }

    function getAvatarStorageWidth(key, fallback) {
        try {
            var v = localStorage.getItem(key);
            if (v === null || v === '') return fallback;
            var n = parseInt(v, 10);
            if (isNaN(n)) return fallback;
            return Math.min(8, Math.max(1, n));
        } catch (e) {
            return fallback;
        }
    }

    function getAvatarBorderStyleFromStorage() {
        return {
            avatar_team_border_red: getAvatarStorageShade('hxd_avatar_team_border_red', myAvatarTeamBorderRed),
            avatar_team_border_blue: getAvatarStorageShade('hxd_avatar_team_border_blue', myAvatarTeamBorderBlue),
            avatar_team_border_width: getAvatarStorageWidth('hxd_avatar_team_border_width', myAvatarTeamBorderWidth),
            avatar_team_border_inset: getAvatarStorageToggle('hxd_avatar_team_border_inset', myAvatarTeamBorderInset)
        };
    }

    function getAvatarStorageToggle(key, fallback) {
        try {
            var value = localStorage.getItem(key);
            if (value !== null && value !== '') return value === '1';
        } catch (e) {}
        return Boolean(fallback);
    }

    function readAvatarBool(value, defaultValue) {
        if (value === undefined || value === null || value === '') return Boolean(defaultValue);
        if (value === true || value === 1) return true;
        if (value === false || value === 0) return false;
        var s = String(value).trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true;
        if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
        return Boolean(defaultValue);
    }

    function getAvatarVisibleAllToggle() {
        return getAvatarStorageToggle('hxd_avatar_visible_all', false) ||
            (
                getAvatarStorageToggle('hxd_avatar_visible_team', myAvatarVisibleTeam) &&
                getAvatarStorageToggle('hxd_avatar_visible_rival', myAvatarVisibleRival)
            );
    }

    function publishAvatarGlobals() {
        var avatarUrl = getResolvedMyAvatarUrl();
        var visibleAll = getAvatarVisibleAllToggle();
        window.__hxdAvatarDiscordAllowed = hasAvatarDiscordSession();
        window.__hxdMyAvatarUrl = avatarUrl || null;
        window.__hxdAvatarDisabled = getAvatarStorageToggle('hxd_avatar_disabled', myAvatarDisabled);
        window.__hxdAvatarVisibleSelfOnly = getAvatarStorageToggle('hxd_avatar_visible_self_only', myAvatarVisibleSelfOnly);
        window.__hxdAvatarVisibleTeam = visibleAll;
        window.__hxdAvatarVisibleRival = visibleAll;
        window.__hxdAvatarTeamBorder = getAvatarStorageToggle('hxd_avatar_team_border', myAvatarTeamBorder);
        var borderStyle = getAvatarBorderStyleFromStorage();
        window.__hxdAvatarTeamBorderRed = borderStyle.avatar_team_border_red;
        window.__hxdAvatarTeamBorderBlue = borderStyle.avatar_team_border_blue;
        window.__hxdAvatarTeamBorderWidth = borderStyle.avatar_team_border_width;
        window.__hxdAvatarTeamBorderInset = borderStyle.avatar_team_border_inset;
        if (myDiscordId) window.__haxDiscordId = myDiscordId;
        injectAvatarGlobalsToRuntime();
    }

    function syncAvatarRuntimeForLocalPlayer() {
        publishAvatarGlobals();
        var avatarUrl = getResolvedMyAvatarUrl();
        if (!avatarUrl) return;

        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) {
            localPlayerId = getLocalPlayerIdFromPage();
        }
        if (localPlayerId == null) {
            var markedRow = document.querySelector('[class^="player-list-item"][data-hax-local-player="1"]');
            if (markedRow) {
                localPlayerId = parseInt(markedRow.dataset.playerId, 10);
            }
        }
        if (localPlayerId == null || isNaN(localPlayerId)) return;

        window.__myLocalPlayerId = localPlayerId;
        var nick = cleanNick(window.__haxLocalGameNick || '') || getStoredLocalNick() || '';
        setAvatarRuntimeProfile(localPlayerId, nick, buildLocalPersonalizationEntry(), true);
    }

    function buildLocalPersonalizationEntry() {
        var localProSettings = getLocalProSettings() || {};
        var visibleAll = getAvatarVisibleAllToggle();
        var borderStyle = getAvatarBorderStyleFromStorage();
        return {
            discord_id: myDiscordId || null,
            avatar_url: getResolvedMyAvatarUrl(),
            avatar_disabled: getAvatarStorageToggle('hxd_avatar_disabled', myAvatarDisabled),
            avatar_visible_self_only: getAvatarStorageToggle('hxd_avatar_visible_self_only', myAvatarVisibleSelfOnly),
            avatar_visible_team: visibleAll,
            avatar_visible_rival: visibleAll,
            avatar_team_border: getAvatarStorageToggle('hxd_avatar_team_border', myAvatarTeamBorder),
            avatar_team_border_red: borderStyle.avatar_team_border_red,
            avatar_team_border_blue: borderStyle.avatar_team_border_blue,
            avatar_team_border_width: borderStyle.avatar_team_border_width,
            avatar_team_border_inset: borderStyle.avatar_team_border_inset,
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
        syncAvatarRuntimeForLocalPlayer();
    }

    function getLocalPlayerIdFromPage() {
        var cached = getLocalPlayerId();
        if (cached != null && !isNaN(cached)) return cached;
        requestLocalPlayerIdFromRuntime();
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
        if (info.avatar_url && !readAvatarBool(info.avatar_disabled, false)) return true;
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
            avatar_url: incoming.avatar_url ?? base.avatar_url ?? null,
            avatar_disabled: incoming.avatar_disabled ?? base.avatar_disabled ?? false,
            avatar_visible_self_only: incoming.avatar_visible_self_only ?? base.avatar_visible_self_only ?? true,
            avatar_visible_team: incoming.avatar_visible_team ?? base.avatar_visible_team ?? false,
            avatar_visible_rival: incoming.avatar_visible_rival ?? base.avatar_visible_rival ?? false,
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
                        myIsPro = Boolean(data.is_pro || data.is_vip);
                        myAvatarUrl = data.avatar_url || null;
                        myAvatarDisabled = readAvatarBool(data.avatar_disabled, false);
                        myAvatarVisibleSelfOnly = readAvatarBool(data.avatar_visible_self_only, true);
                        myAvatarVisibleTeam = readAvatarBool(data.avatar_visible_team, false);
                        myAvatarVisibleRival = readAvatarBool(data.avatar_visible_rival, false);
                        myAvatarTeamBorder = readAvatarBool(data.avatar_team_border, false);
                        var skipBorderStyleSync = window.__hxdAvatarBorderEditUntil &&
                          Date.now() < window.__hxdAvatarBorderEditUntil;
                        if (!skipBorderStyleSync) {
                          myAvatarTeamBorderRed = Math.min(2, Math.max(0, parseInt(data.avatar_team_border_red, 10) || 1));
                          myAvatarTeamBorderBlue = Math.min(2, Math.max(0, parseInt(data.avatar_team_border_blue, 10) || 1));
                          myAvatarTeamBorderWidth = Math.min(8, Math.max(1, parseInt(data.avatar_team_border_width, 10) || 3));
                          myAvatarTeamBorderInset = readAvatarBool(data.avatar_team_border_inset, false);
                          try {
                            localStorage.setItem('hxd_avatar_team_border_red', String(myAvatarTeamBorderRed));
                            localStorage.setItem('hxd_avatar_team_border_blue', String(myAvatarTeamBorderBlue));
                            localStorage.setItem('hxd_avatar_team_border_width', String(myAvatarTeamBorderWidth));
                            localStorage.setItem('hxd_avatar_team_border_inset', myAvatarTeamBorderInset ? '1' : '0');
                          } catch (eBorderStore) {}
                        }
                        if (data.game_nick) {
                            storeLocalGameNick(data.game_nick);
                        }

                        window.__proStatus = {
                            is_pro: Boolean(data.is_pro),
                            is_vip: Boolean(data.is_vip)
                        };

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
                        publishAvatarGlobals();
                        syncAvatarRuntimeForLocalPlayer();
                        if (isActive) {
                            scheduleFullRefresh(20);
                        }
                    } else {
                        myVerified = false;
                        myDiscordId = null;
                        myBadge = null;
                        myIsPro = false;
                        myAvatarUrl = null;
                        myAvatarDisabled = false;
                        myAvatarVisibleSelfOnly = true;
                        myAvatarVisibleTeam = false;
                        myAvatarVisibleRival = false;
                        myAvatarTeamBorder = false;
                        publishAvatarGlobals();
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
        var now = Date.now();
        var normalizedRoomId = roomId || null;
        if (playerId === lastSentPlayerId && normalizedRoomId === lastSentPlayerRoomId && now - lastSentPlayerAt < 5000) return;
        lastSentPlayerId = playerId;
        lastSentPlayerRoomId = normalizedRoomId;
        lastSentPlayerAt = now;
        
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
        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) localPlayerId = getLocalPlayerIdFromPage();
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', LOCAL_SERVER + '/session/game-nick', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ game_nick: gameNick, room_id: roomId, player_id: localPlayerId }));
    }

    function readNicknameInputNick() {
        var root = document.querySelector('.choose-nickname-view') || document;
        var inputs = root.querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var type = String(input.getAttribute('type') || 'text').toLowerCase();
            if (type === 'hidden' || type === 'password' || type === 'checkbox' || type === 'radio') continue;
            var nick = cleanNick(String(input.value || '').trim());
            if (nick) return nick;
        }
        return null;
    }

    function syncNicknameInputToServer() {
        var nick = readNicknameInputNick();
        if (!nick || nick === lastSentNicknameInput) return;
        lastSentNicknameInput = nick;
        sendGameNickToServer(nick, getRoomId());
    }

    function scheduleNicknameInputSync() {
        if (nicknameInputDebounceTimer) clearTimeout(nicknameInputDebounceTimer);
        nicknameInputDebounceTimer = setTimeout(function() {
            nicknameInputDebounceTimer = null;
            syncNicknameInputToServer();
        }, 1500);
    }

    function startNicknameInputWatcher() {
        if (nicknameInputWatcherStarted) return;
        nicknameInputWatcherStarted = true;
        document.addEventListener('input', scheduleNicknameInputSync, true);
        document.addEventListener('change', syncNicknameInputToServer, true);
        nicknameInputWatchTimer = setInterval(scheduleNicknameInputSync, 1000);
        scheduleNicknameInputSync();
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

        verifiedFetchInFlight++;

        function finishFetch(result) {
            verifiedFetchInFlight = Math.max(0, verifiedFetchInFlight - 1);
            callback(result);
        }

        function normalizeRemoteProfile(data) {
            if (!data || typeof data !== 'object') return null;
            return {
                discord_id: data.discord_id != null ? String(data.discord_id) : null,
                avatar_url: data.avatar_url != null ? String(data.avatar_url) : null,
                avatar_disabled: readAvatarBool(data.avatar_disabled, false),
                avatar_visible_self_only: readAvatarBool(data.avatar_visible_self_only, true),
                avatar_visible_team: readAvatarBool(data.avatar_visible_team, false),
                avatar_visible_rival: readAvatarBool(data.avatar_visible_rival, false),
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
                finishFetch(existingResult);
                return;
            }

            var remaining = missingNicks.length;
            var merged = Object.assign({}, existingResult);

            function finishOne() {
                remaining--;
                if (remaining <= 0) {
                    finishFetch(merged);
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

    function forcePresenceSync() {
        lastSentPlayerId = null;
        lastSentPlayerAt = 0;
        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) {
            localPlayerId = getLocalPlayerIdFromPage();
        }
        if (localPlayerId != null && !isNaN(localPlayerId)) {
            sendPlayerIdToServer(localPlayerId, getRoomId());
        }
    }

    function runFastRoomBootstrap() {
        forcePresenceSync();
        processPlayers(true, true);
    }

    function avatarUrlFingerprint(url) {
        if (!url || typeof url !== 'string') return '';
        if (url.indexOf('blob:') === 0) return url;
        var len = url.length;
        if (len <= 256) return url;
        if (url.indexOf('data:') === 0) {
            return 'd:' + len + ':' + url.charCodeAt(len - 1) + ':' + url.slice(-96);
        }
        return url.slice(-128);
    }

    function pruneAvatarBlobCacheForOwner(ownerKey) {
        if (!ownerKey) return;
        var owner = String(ownerKey);
        var prefix = owner + '|';
        for (var key in avatarBlobUrlCache) {
            if (key === owner || key.indexOf(prefix) === 0) {
                try { URL.revokeObjectURL(avatarBlobUrlCache[key]); } catch (eRevoke) {}
                delete avatarBlobUrlCache[key];
            }
        }
    }

    function setVerifiedCacheEntry(nick, data, playerId) {
        if (!nick) return;
        var prev = verifiedCache[nick];
        var incoming = data || {};
        var entry = Object.assign({}, prev || {}, incoming);

        if (prev) {
            if (prev.discord_id && !incoming.discord_id) entry.discord_id = prev.discord_id;
            if (prev.avatar_url && !incoming.avatar_url) entry.avatar_url = prev.avatar_url;
            if (prev.__proLocked || prev.isPro) {
                entry.isPro = Boolean(prev.isPro || incoming.isPro);
                entry.__proLocked = true;
            } else if (incoming.isPro) {
                entry.__proLocked = true;
            }
            if (prev.__verifiedLocked || prev.verified) {
                entry.verified = Boolean(prev.verified || incoming.verified);
                entry.__verifiedLocked = true;
            } else if (incoming.verified) {
                entry.__verifiedLocked = true;
            }
            if (prev.badge && !incoming.badge) entry.badge = prev.badge;
            var stickyVisualKeys = [
                'banner', 'font', 'nick_color', 'nick_gradient',
                'verified_color', 'verified_gradient',
                'custom_banner_color1', 'custom_banner_color2'
            ];
            for (var sk = 0; sk < stickyVisualKeys.length; sk++) {
                var vKey = stickyVisualKeys[sk];
                if (prev[vKey] && (incoming[vKey] === null || incoming[vKey] === undefined || incoming[vKey] === '')) {
                    entry[vKey] = prev[vKey];
                }
            }
        } else {
            if (entry.isPro) entry.__proLocked = true;
            if (entry.verified) entry.__verifiedLocked = true;
        }

        entry.__fetchedAt = Date.now();
        entry.__avatarFp = avatarUrlFingerprint(entry.avatar_url);
        if (prev && prev.__avatarFp && prev.__avatarFp !== entry.__avatarFp) {
            pruneAvatarBlobCacheForOwner(entry.discord_id || prev.discord_id || ('n:' + nick));
        }
        if (playerId != null && !isNaN(playerId)) {
            entry.__playerId = playerId;
        }
        verifiedCache[nick] = entry;
    }

    function applyRemoteAvatarPollUpdate(prev, next) {
        if (!next) return prev || null;
        var entry = Object.assign({}, prev || {});
        if (next.avatar_url) entry.avatar_url = next.avatar_url;
        if (next.avatar_disabled !== undefined && next.avatar_disabled !== null) {
            entry.avatar_disabled = next.avatar_disabled;
        }
        if (next.avatar_visible_self_only !== undefined && next.avatar_visible_self_only !== null) {
            entry.avatar_visible_self_only = next.avatar_visible_self_only;
        }
        if (next.avatar_visible_team !== undefined && next.avatar_visible_team !== null) {
            entry.avatar_visible_team = next.avatar_visible_team;
        }
        if (next.avatar_visible_rival !== undefined && next.avatar_visible_rival !== null) {
            entry.avatar_visible_rival = next.avatar_visible_rival;
        }
        if (next.discord_id && !entry.discord_id) entry.discord_id = next.discord_id;
        if (!entry.__proLocked) {
            if (next.isPro) {
                entry.isPro = true;
                entry.__proLocked = true;
            }
            if (next.verified) {
                entry.verified = true;
                entry.__verifiedLocked = true;
            }
            if (next.badge && !entry.badge) entry.badge = next.badge;
        }
        entry.__fetchedAt = Date.now();
        entry.__avatarFp = avatarUrlFingerprint(entry.avatar_url);
        return entry;
    }

    function getVerifiedCacheEntry(nick) {
        if (!nick || !verifiedCache[nick]) return null;
        return verifiedCache[nick];
    }

    function ensureAvatarRuntimeReceiver() {
        ensureAvatarRuntimeBridge();
    }

    var avatarBlobUrlCache = {};
    var avatarPrefetchStarted = {};

    function resolveRuntimeAvatarUrl(url, cacheKey) {
        if (!url || typeof url !== 'string') return null;
        if (url.indexOf('data:') !== 0) return url;
        var ownerKey = String(cacheKey || 'u');
        var key = ownerKey + '|' + avatarUrlFingerprint(url);
        if (avatarBlobUrlCache[key]) return avatarBlobUrlCache[key];
        try {
            var parts = url.split(',');
            if (parts.length < 2) return url;
            var mimeMatch = parts[0].match(/data:([^;]+)/);
            var mime = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/jpeg';
            var binary = atob(parts[1]);
            var bytes = new Uint8Array(binary.length);
            for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            var blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
            avatarBlobUrlCache[key] = blobUrl;
            return blobUrl;
        } catch (eBlob) {
            return url;
        }
    }

    function prefetchAvatarImage(url, cacheKey) {
        var resolved = resolveRuntimeAvatarUrl(url, cacheKey);
        if (!resolved) return;
        if (avatarPrefetchStarted[resolved]) return;
        avatarPrefetchStarted[resolved] = true;
        try {
            var img = new Image();
            img.onload = function() {
                try { window.dispatchEvent(new Event('hxd-avatar-image-loaded')); } catch (eOn) {}
            };
            img.onerror = function() {
                delete avatarPrefetchStarted[resolved];
            };
            img.src = resolved;
        } catch (ePre) {}
    }

    function buildRuntimeAvatarProfile(playerId, nick, profile, isLocal) {
        var data = profile || {};
        var disabled = data.avatar_disabled !== undefined ? readAvatarBool(data.avatar_disabled, false) : (isLocal ? getAvatarStorageToggle('hxd_avatar_disabled', myAvatarDisabled) : false);
        var avatarUrl = data.avatar_url || (isLocal ? getResolvedMyAvatarUrl() : null);
        if (disabled || !avatarUrl) return null;
        var discordId = data.discord_id || (isLocal ? myDiscordId : null);
        var runtimeUrl = resolveRuntimeAvatarUrl(avatarUrl, discordId || ('p' + playerId));
        prefetchAvatarImage(avatarUrl, discordId || ('p' + playerId));
        var visibleTeam = isLocal
            ? (data.avatar_visible_team !== undefined ? readAvatarBool(data.avatar_visible_team, false) : getAvatarStorageToggle('hxd_avatar_visible_team', myAvatarVisibleTeam))
            : readAvatarBool(data.avatar_visible_team, false);
        var visibleRival = isLocal
            ? (data.avatar_visible_rival !== undefined ? readAvatarBool(data.avatar_visible_rival, false) : getAvatarStorageToggle('hxd_avatar_visible_rival', myAvatarVisibleRival))
            : readAvatarBool(data.avatar_visible_rival, false);
        if (!isLocal && visibleTeam && visibleRival) {
            // API puede marcar visible para todos con ambos flags en true.
        }
        return {
            nick: nick || '',
            discord_id: discordId,
            avatar_url: runtimeUrl,
            avatar_disabled: disabled,
            avatar_visible_self_only: isLocal
                ? (data.avatar_visible_self_only !== undefined ? readAvatarBool(data.avatar_visible_self_only, true) : getAvatarStorageToggle('hxd_avatar_visible_self_only', myAvatarVisibleSelfOnly))
                : readAvatarBool(data.avatar_visible_self_only, false),
            avatar_visible_team: visibleTeam,
            avatar_visible_rival: visibleRival,
            is_local: Boolean(isLocal),
            __avatarFp: avatarUrlFingerprint(avatarUrl),
            updated_at: Date.now()
        };
    }

    function publishAvatarProfilesToRuntime() {
        ensureAvatarRuntimeReceiver();
        try {
            postAvatarRuntimeMessage({
                __hxdAvatars: true,
                profiles: window.__hxdAvatarProfilesByPlayerId || {}
            });
        } catch (e) {}
    }

    function scheduleAvatarPublish(immediate) {
        if (immediate) {
            if (avatarPublishTimer) {
                clearTimeout(avatarPublishTimer);
                avatarPublishTimer = null;
            }
            publishAvatarProfilesToRuntime();
            return;
        }
        if (avatarPublishTimer) clearTimeout(avatarPublishTimer);
        avatarPublishTimer = setTimeout(function() {
            avatarPublishTimer = null;
            publishAvatarProfilesToRuntime();
        }, 40);
    }

    function setAvatarRuntimeProfile(playerId, nick, profile, isLocal) {
        if (playerId == null || isNaN(playerId)) return;
        var existing = window.__hxdAvatarProfilesByPlayerId &&
            window.__hxdAvatarProfilesByPlayerId[playerId];
        var runtimeProfile = buildRuntimeAvatarProfile(playerId, nick, profile, isLocal);
        if (!runtimeProfile) {
            if (existing && existing.avatar_url && !isLocal) {
                return;
            }
            if (existing && existing.avatar_url && isLocal) {
                var explicitlyDisabled = profile && readAvatarBool(profile.avatar_disabled, false);
                if (!explicitlyDisabled && getResolvedMyAvatarUrl()) {
                    runtimeProfile = buildRuntimeAvatarProfile(playerId, nick, buildLocalPersonalizationEntry(), true);
                }
            }
            if (!runtimeProfile) {
                if (window.__hxdAvatarProfilesByPlayerId) delete window.__hxdAvatarProfilesByPlayerId[playerId];
                scheduleAvatarPublish(true);
                return;
            }
        }
        window.__hxdAvatarProfilesByPlayerId = window.__hxdAvatarProfilesByPlayerId || {};
        window.__hxdAvatarProfilesByPlayerId[playerId] = runtimeProfile;
        scheduleAvatarPublish(true);
    }

    function isVerifiedCacheStale(nick, playerId) {
        var entry = getVerifiedCacheEntry(nick);
        if (!entry) return true;
        if (!entry.__fetchedAt || (Date.now() - entry.__fetchedAt > VERIFIED_CACHE_TTL_MS)) return true;
        if (playerId != null && !isNaN(playerId) && entry.__playerId != null &&
            Number(entry.__playerId) !== Number(playerId)) {
            return true;
        }
        return false;
    }

    function remotePlayerNeedsAvatarFetch(nick, playerId) {
        if (!nick || playerId == null || isNaN(playerId)) return false;
        if (isVerifiedCacheStale(nick, playerId)) return true;
        var cacheEntry = verifiedCache[nick];
        var runtimeProfile = window.__hxdAvatarProfilesByPlayerId &&
            window.__hxdAvatarProfilesByPlayerId[playerId];
        if (!cacheEntry || !cacheEntry.avatar_url) return true;
        if (!runtimeProfile || !runtimeProfile.avatar_url) return true;
        if (cacheEntry.__avatarFp && runtimeProfile.__avatarFp &&
            cacheEntry.__avatarFp !== runtimeProfile.__avatarFp) {
            return true;
        }
        return false;
    }

    function getRemotePlayersInRoom() {
        var players = document.querySelectorAll('[class^="player-list-item"]');
        if (!players.length) return [];

        var localPlayerId = getLocalPlayerId();
        var remotePlayers = [];
        for (var i = 0; i < players.length; i++) {
            if (isLocalPlayerRow(players[i], localPlayerId)) continue;
            var nameEl = players[i].querySelector('[data-hook="name"]');
            if (!nameEl) continue;
            var nick = cleanNick(getNickText(nameEl));
            var playerId = parseInt(players[i].dataset.playerId, 10);
            if (nick && !isNaN(playerId)) {
                remotePlayers.push({ nick: nick, playerId: playerId });
            }
        }
        return remotePlayers;
    }

    function remoteAvatarProfileChanged(prev, next) {
        if (!prev && !next) return false;
        if (!prev || !next) return true;
        if (avatarUrlFingerprint(prev.avatar_url) !== avatarUrlFingerprint(next.avatar_url)) return true;
        if (readAvatarBool(prev.avatar_disabled, false) !== readAvatarBool(next.avatar_disabled, false)) return true;
        if (readAvatarBool(prev.avatar_visible_self_only, true) !== readAvatarBool(next.avatar_visible_self_only, true)) return true;
        if (readAvatarBool(prev.avatar_visible_team, false) !== readAvatarBool(next.avatar_visible_team, false)) return true;
        if (readAvatarBool(prev.avatar_visible_rival, false) !== readAvatarBool(next.avatar_visible_rival, false)) return true;
        return false;
    }

    function remotePlayerProfileChanged(prev, next) {
        if (remoteAvatarProfileChanged(prev, next)) return true;
        if (!prev || !next) return true;
        if (Boolean(prev.verified) !== Boolean(next.verified)) return true;
        if (Boolean(prev.isPro) !== Boolean(next.isPro)) return true;
        if (String(prev.badge || '') !== String(next.badge || '')) return true;
        if (String(prev.banner || '') !== String(next.banner || '')) return true;
        if (String(prev.font || '') !== String(next.font || '')) return true;
        if (String(prev.nick_color || '') !== String(next.nick_color || '')) return true;
        if (String(prev.nick_gradient || '') !== String(next.nick_gradient || '')) return true;
        if (String(prev.verified_color || '') !== String(next.verified_color || '')) return true;
        if (String(prev.verified_gradient || '') !== String(next.verified_gradient || '')) return true;
        return false;
    }

    function refreshRemoteAvatarsInRoom(force) {
        if (!isActive && !force) return;
        if (!document.querySelector('.room-view') && !document.querySelector('.game-view')) return;
        if (!force && verifiedFetchInFlight > 0) return;

        var remotePlayers = getRemotePlayersInRoom();
        if (!remotePlayers.length) return;

        var roomId = getRoomId();
        fetchVerifiedUsers(remotePlayers, roomId, function(result) {
            var changed = false;
            for (var i = 0; i < remotePlayers.length; i++) {
                var nick = remotePlayers[i].nick;
                var playerId = remotePlayers[i].playerId;
                var prev = verifiedCache[nick] || null;
                var next = result[nick];
                if (!next) continue;
                var merged = applyRemoteAvatarPollUpdate(prev, next);
                if (remoteAvatarProfileChanged(prev, merged)) changed = true;
                verifiedCache[nick] = merged;
                if (merged.__playerId == null && playerId != null && !isNaN(playerId)) {
                    merged.__playerId = playerId;
                }
                setAvatarRuntimeProfile(playerId, nick, merged, false);
            }
            window.__verifiedCache = verifiedCache;
            if (changed) {
                publishAvatarProfilesToRuntime();
                try { window.dispatchEvent(new Event('hxd-avatar-image-loaded')); } catch (eLoaded) {}
            }
        });
    }

    function startRemoteAvatarPoll() {
        if (remoteAvatarPollTimer) return;
        remoteAvatarPollTimer = setInterval(function() {
            refreshRemoteAvatarsInRoom(false);
        }, REMOTE_AVATAR_POLL_MS);
    }

    function stopRemoteAvatarPoll() {
        if (!remoteAvatarPollTimer) return;
        clearInterval(remoteAvatarPollTimer);
        remoteAvatarPollTimer = null;
    }

    function republishRoomAvatarsFromList() {
        var players = document.querySelectorAll('[class^="player-list-item"]');
        if (!players.length) return false;

        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) {
            var runtimeLocalId = getLocalPlayerIdFromPage();
            if (runtimeLocalId != null && !isNaN(runtimeLocalId)) {
                window.__myLocalPlayerId = runtimeLocalId;
                localPlayerId = runtimeLocalId;
            }
        }

        var publishedAny = false;
        for (var i = 0; i < players.length; i++) {
            var item = players[i];
            var nameEl = item.querySelector('[data-hook="name"]');
            if (!nameEl) continue;
            var nick = cleanNick(getNickText(nameEl));
            var playerId = parseInt(item.dataset.playerId, 10);
            if (isNaN(playerId)) continue;

            if (isLocalPlayerRow(item, localPlayerId)) {
                window.__myLocalPlayerId = playerId;
                setAvatarRuntimeProfile(playerId, nick, buildLocalPersonalizationEntry(), true);
                publishedAny = true;
            } else if (nick) {
                var cacheEntry = verifiedCache[nick];
                if (cacheEntry && cacheEntry.avatar_url) {
                    setAvatarRuntimeProfile(playerId, nick, cacheEntry, false);
                    publishedAny = true;
                }
            }
        }

        publishAvatarProfilesToRuntime();
        return publishedAny;
    }

    function scheduleFullRefresh(delay) {
        if (processDebounceTimer) {
            clearTimeout(processDebounceTimer);
        }
        processDebounceTimer = setTimeout(function() {
            processDebounceTimer = null;
            processPlayers();
        }, delay == null ? 40 : delay);
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

        if (isLocalRow && !isNaN(playerId)) {
            window.__myLocalPlayerId = playerId;
            setAvatarRuntimeProfile(playerId, name, buildLocalPersonalizationEntry(), true);
        } else if (!isNaN(playerId)) {
            var avatarCacheInfo = verifiedCache[name];
            if (avatarCacheInfo && avatarCacheInfo.avatar_url) {
                setAvatarRuntimeProfile(playerId, name, avatarCacheInfo, false);
            }
        }

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
                if ((info.verified || info.isPro) && !info.__proLocked) {
                    info.__proLocked = true;
                    verifiedCache[name] = info;
                }
                var remoteQualifies = info.__proLocked || remoteHasPersonalization(info);
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

    function processPlayers(allowInactive, forceFetchAll) {
        var inRoom = Boolean(document.querySelector('.room-view') || document.querySelector('.game-view'));
        var hasPlayers = Boolean(document.querySelector('[class^="player-list-item"]'));
        if (!isActive && !allowInactive && !(inRoom && hasPlayers)) return;
        
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
            window.__hxdAvatarProfilesByPlayerId = {};
            scheduleAvatarPublish();
            lastSentPlayerId = null;
            lastSentPlayerAt = 0;
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
                var localRowPlayerId = parseInt(localRow.dataset.playerId, 10);
                var effectiveLocalId = resolveEffectivePlayerId(localRowPlayerId, localPlayerId);
                if (effectiveLocalId != null && !isNaN(effectiveLocalId)) {
                    window.__myLocalPlayerId = effectiveLocalId;
                    if (localPlayerId == null) localPlayerId = effectiveLocalId;
                }
                setAvatarRuntimeProfile(effectiveLocalId, localNick, buildLocalPersonalizationEntry(), true);
                
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
                
                // Busca pelo nick limpo (só se não tiver no cache ou faltar perfil runtime)
                var remotePlayerId = parseInt(players[i].dataset.playerId, 10);
                if (nick && (forceFetchAll || remotePlayerNeedsAvatarFetch(nick, remotePlayerId))) {
                    playersToResolve.push({
                        nick: nick,
                        playerId: remotePlayerId
                    });
                }
            }
        }

        republishRoomAvatarsFromList();

        if (playersToResolve.length === 0) return;

        fetchVerifiedUsers(playersToResolve, roomId, function(result) {
            for (var nick in result) {
                var matchedPlayer = null;
                for (var rp = 0; rp < playersToResolve.length; rp++) {
                    if (playersToResolve[rp].nick === nick) {
                        matchedPlayer = playersToResolve[rp];
                        break;
                    }
                }
                setVerifiedCacheEntry(nick, result[nick], matchedPlayer ? matchedPlayer.playerId : null);
            }
            for (var k = 0; k < playersToResolve.length; k++) {
                var pendingNick = playersToResolve[k].nick;
                if (!result[pendingNick] && !verifiedCache[pendingNick]) {
                    setVerifiedCacheEntry(pendingNick, { verified: false, playerId: null, discordId: null, isPro: false }, playersToResolve[k].playerId);
                }
                if (verifiedCache[pendingNick]) {
                    setAvatarRuntimeProfile(
                        playersToResolve[k].playerId,
                        pendingNick,
                        verifiedCache[pendingNick],
                        false
                    );
                }
            }
            window.__verifiedCache = verifiedCache;
            var ps = document.querySelectorAll('[class^="player-list-item"]');
            for (var m = 0; m < ps.length; m++) {
                var psNameEl = ps[m].querySelector('[data-hook="name"]');
                if (psNameEl) {
                    var rawNick = getNickText(psNameEl);
                    var nick = cleanNick(rawNick);
                    if (result[nick] || playersToResolve.some(function(entry) { return entry.nick === nick; })) {
                        setAvatarRuntimeProfile(parseInt(ps[m].dataset.playerId, 10), nick, verifiedCache[nick], isLocalPlayerRow(ps[m], localPlayerId));
                        applyBadge(ps[m]);
                    }
                }
            }
            republishRoomAvatarsFromList();
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
                setAvatarRuntimeProfile(parseInt(localCandidate.dataset.playerId, 10), nick, buildLocalPersonalizationEntry(), true);
                sendGameNickToServer(nick, roomId);
            }
        }
        for (var i = 0; i < items.length; i++) {
            applyBadge(items[i]);
            if (items[i] === localCandidate || isLocalPlayerRow(items[i], localPlayerId)) continue;
            var remoteNameEl = items[i].querySelector('[data-hook="name"]');
            if (!remoteNameEl) continue;
            var remoteNick = cleanNick(getNickText(remoteNameEl));
            var remotePlayerId = parseInt(items[i].dataset.playerId, 10);
            if (!remoteNick || !remotePlayerNeedsAvatarFetch(remoteNick, remotePlayerId)) continue;
            newPlayersToResolve.push({
                nick: remoteNick,
                playerId: remotePlayerId
            });
        }
        if (newPlayersToResolve.length) {
            fetchVerifiedUsers(newPlayersToResolve, roomId, function(result) {
                for (var nick in result) {
                    var matchedNewPlayer = null;
                    for (var np = 0; np < newPlayersToResolve.length; np++) {
                        if (newPlayersToResolve[np].nick === nick) {
                            matchedNewPlayer = newPlayersToResolve[np];
                            break;
                        }
                    }
                    setVerifiedCacheEntry(nick, result[nick], matchedNewPlayer ? matchedNewPlayer.playerId : null);
                }
                for (var k = 0; k < newPlayersToResolve.length; k++) {
                    var pendingNick = newPlayersToResolve[k].nick;
                    if (!result[pendingNick] && !verifiedCache[pendingNick]) {
                        setVerifiedCacheEntry(pendingNick, { verified: false, playerId: null, discordId: null, isPro: false }, newPlayersToResolve[k].playerId);
                    }
                    if (verifiedCache[pendingNick]) {
                        setAvatarRuntimeProfile(
                            newPlayersToResolve[k].playerId,
                            pendingNick,
                            verifiedCache[pendingNick],
                            false
                        );
                    }
                }
                window.__verifiedCache = verifiedCache;
                for (var m = 0; m < items.length; m++) {
                    var itemNameEl = items[m].querySelector('[data-hook="name"]');
                    var itemNick = itemNameEl ? cleanNick(getNickText(itemNameEl)) : '';
                    setAvatarRuntimeProfile(parseInt(items[m].dataset.playerId, 10), itemNick, verifiedCache[itemNick], isLocalPlayerRow(items[m], localPlayerId));
                    applyBadge(items[m]);
                }
                republishRoomAvatarsFromList();
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
        if (!localSettingsLoaded) {
            ensureLocalProSettings(function() {
                refreshBadges();
                refreshBanners();
                refreshFonts();
            });
        }
        if (typeof window.__proLoadSettings === 'function') {
            window.__proLoadSettings().then(function() {
                scheduleFullRefresh(0);
            }).catch(function() {});
        }

        if (!refreshTimer) {
            refreshTimer = setInterval(function() {
                if (!isActive) return;
                ensureApplyProfileButton();
                processPlayers();
            }, 600);
        }
        startRemoteAvatarPoll();

        runFastRoomBootstrap();
        fetchMyStatus(true, function() {
            runFastRoomBootstrap();
        });
    }

    function resetObserver() {
        isActive = false;
        observerInitialized = false;
        window.__myLocalPlayerId = null;
        lastSentPlayerId = null;
        lastSentPlayerRoomId = null;
        lastSentPlayerAt = 0;
        activeRoomId = null;
        verifiedCache = {};
        window.__verifiedCache = verifiedCache;
        window.__hxdAvatarProfilesByPlayerId = {};
        scheduleAvatarPublish();
        clearLocalPlayerMarks();
        var applyBtn = document.getElementById('hax-apply-profile-btn');
        if (applyBtn) applyBtn.remove();
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        stopRemoteAvatarPoll();
        if (processDebounceTimer) {
            clearTimeout(processDebounceTimer);
            processDebounceTimer = null;
        }
        if (avatarPublishTimer) {
            clearTimeout(avatarPublishTimer);
            avatarPublishTimer = null;
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
        syncLocalAvatarFromStorage();
        if (myDiscordId) pruneAvatarBlobCacheForOwner(myDiscordId);
        publishAvatarGlobals();
        var localPlayerId = getLocalPlayerId();
        if (localPlayerId == null) localPlayerId = getLocalPlayerIdFromPage();
        if (localPlayerId != null && !isNaN(localPlayerId)) {
            var localNick = getLocalNick() || cleanNick(window.__haxLocalGameNick || '') || '';
            setAvatarRuntimeProfile(localPlayerId, localNick, buildLocalPersonalizationEntry(), true);
        }
        resyncRoomAvatarProfiles(true);
        refreshRemoteAvatarsInRoom(true);
    }

    function resyncRoomAvatarProfiles(forceStatus) {
        function runResync() {
            publishAvatarGlobals();
            syncAvatarRuntimeForLocalPlayer();
            republishRoomAvatarsFromList();
            var hasPlayers = Boolean(document.querySelector('[class^="player-list-item"]'));
            if (isActive) {
                processPlayers(false, true);
            } else if (hasPlayers) {
                processPlayers(true, true);
            }
            publishAvatarProfilesToRuntime();
            refreshBadges();
            refreshBanners();
            refreshFonts();
        }
        runResync();
        if (forceStatus) {
            fetchMyStatus(true, runResync);
            if (!localSettingsLoaded) {
                ensureLocalProSettings(runResync);
            }
        }
    }

    function scheduleRoomAvatarResync(delayMs) {
        delayMs = delayMs == null ? 0 : delayMs;
        setTimeout(function() {
            runFastRoomBootstrap();
            resyncRoomAvatarProfiles(true);
            setTimeout(runFastRoomBootstrap, 50);
            setTimeout(function() { resyncRoomAvatarProfiles(false); }, 150);
            setTimeout(runFastRoomBootstrap, 300);
            setTimeout(function() { resyncRoomAvatarProfiles(false); }, 550);
        }, delayMs);
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
        publishAvatarGlobals();
        startNicknameInputWatcher();
        window.addEventListener('hxd-avatar-profile-changed', applyProfilesNow);
        window.addEventListener('storage', function() {
            applyProfilesNow();
        });
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
                startObserver();
                scheduleRoomAvatarResync(0);
            });

            Injector.onView('game-view', function() {
                scheduleRoomAvatarResync(0);
                recoverRoomProfilesIfNeeded();
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
                startObserver();
            }

            recoverRoomProfilesIfNeeded();
            if (!observerWatchdogTimer) {
                observerWatchdogTimer = setInterval(function() {
                    try {
                        recoverRoomProfilesIfNeeded();
                    } catch (e) {}
                }, 400);
            }

        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
