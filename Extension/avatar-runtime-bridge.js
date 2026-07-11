'use strict';
(function () {
    if (window.__hxdAvatarRuntimeBridgeReady) return;
    window.__hxdAvatarRuntimeBridgeReady = true;
    window.__hxdAvatarProfilesByPlayerId = window.__hxdAvatarProfilesByPlayerId || {};

    function setOrDelete(name, value) {
        if (value == null || value === '') {
            try { delete window[name]; } catch (eDel) { window[name] = null; }
            return;
        }
        window[name] = value;
    }

    function applyGlobals(globals) {
        globals = globals || {};
        setOrDelete('__haxDiscordId', globals.discord_id ? String(globals.discord_id) : null);
        window.__hxdAvatarDiscordAllowed = Boolean(globals.avatar_discord_allowed);
        window.__hxdMyAvatarUrl = globals.avatar_url || null;
        window.__hxdAvatarDisabled = Boolean(globals.avatar_disabled);
        window.__hxdAvatarVisibleSelfOnly = Boolean(globals.avatar_visible_self_only);
        window.__hxdAvatarVisibleTeam = Boolean(globals.avatar_visible_team);
        window.__hxdAvatarVisibleRival = Boolean(globals.avatar_visible_rival);
        window.__hxdAvatarTeamBorder = Boolean(globals.avatar_team_border);
        window.__hxdAvatarTeamBorderRed = Number(globals.avatar_team_border_red) || 0;
        window.__hxdAvatarTeamBorderBlue = Number(globals.avatar_team_border_blue) || 0;
        window.__hxdAvatarTeamBorderWidth = Number(globals.avatar_team_border_width) || 3;
        window.__hxdAvatarTeamBorderInset = Boolean(globals.avatar_team_border_inset);
        if (!window.__hxdMyAvatarUrl && typeof window.__hxdClearAvatarOverlay === 'function') {
            try { window.__hxdClearAvatarOverlay(); } catch (eClearOverlay) {}
        }
        try { window.dispatchEvent(new Event('hxd-avatar-image-loaded')); } catch (eEvt) {}
    }

    window.addEventListener('message', function (event) {
        var data = event && event.data;
        if (event.source !== window || !data) return;
        if (data.__hxdAvatarGlobals === true) {
            applyGlobals(data.globals);
            return;
        }
        if (data.__hxdRequestLocalPlayerId === true) {
            var playerId = window.__haxLocalPlayerId;
            window.postMessage({
                __hxdLocalPlayerIdResponse: true,
                requestId: data.requestId || null,
                player_id: playerId == null ? null : playerId
            }, '*');
            return;
        }
        if (data.__hxdAvatars === true) {
            window.__hxdAvatarProfilesByPlayerId = data.profiles || {};
            try { window.dispatchEvent(new Event('hxd-avatar-image-loaded')); } catch (eProfiles) {}
        }
    });
})();
