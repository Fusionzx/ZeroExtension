// ============================================
// FRIENDS - Sistema de amizades
// ============================================
(function() {
    var API_BASE = (function resolveFriendsApiBase() {
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
    var FRIENDS_REFRESH_MS = 4000;
    var friendsPanelOpen = false;
    var friendsInterval = null;
    var requestsInterval = null;
    var presenceInterval = null;
    var presenceObserver = null;
    var presenceDebounceTimer = null;
    var searchTimeout = null;
    var roomHeaderObserver = null;
    var autoInvitePasswordTimer = null;
    var ROOM_INVITE_PASSWORD_KEY = 'hax_room_invite_password';
    var ROOM_INVITE_ROOM_KEY = 'hax_room_invite_room';
    var cachedRoomInviteLink = '';

    // Função de tradução
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /** GET /friends devuelve `friend_discord_id`; la UI no debe usar solo `discord_id`. */
    function hxdFriendDiscordId(friend) {
        if (!friend || typeof friend !== 'object') return '';
        var a = friend.friend_discord_id;
        var b = friend.discord_id;
        if (a != null && String(a).trim() !== '') return String(a).trim();
        if (b != null && String(b).trim() !== '') return String(b).trim();
        return '';
    }

    var HX_IC_USER =
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.6">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' +
        '</svg>';

    var HX_IC_USER_SM =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' +
        '</svg>';

    /** Misma línea + pill que PENDIENTES (texto ya escapado). */
    function hxdFriendsSectionDividerHtml(labelEscaped) {
        return (
            '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px;">' +
            '<span style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></span>' +
            '<span style="flex-shrink:0;font-size:8px;font-weight:700;letter-spacing:0.14em;color:#86efac;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.28);padding:3px 9px;border-radius:999px;">' +
            labelEscaped +
            '</span>' +
            '<span style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></span>' +
            '</div>'
        );
    }

    function getFriendBannerBackground(friend) {
        var banners = window.__proBanners || {
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
            'cherry': { gradient: 'linear-gradient(90deg, rgba(222,49,99,0.15) 0%, rgba(255,105,180,0.25) 50%, rgba(222,49,99,0.15) 100%)' }
        };

        if (!friend || !friend.banner || friend.banner === 'none') return '#0f0f0f';
        if (friend.banner === 'custom' && friend.custom_banner_color1 && friend.custom_banner_color2) {
            return 'linear-gradient(90deg, ' + friend.custom_banner_color1 + '33 0%, ' + friend.custom_banner_color2 + '44 50%, ' + friend.custom_banner_color1 + '33 100%)';
        }
        return banners[friend.banner] && banners[friend.banner].gradient ? banners[friend.banner].gradient : '#0f0f0f';
    }

    function getFriendNameHtml(friend) {
        var displayName = escapeHtml(friend.discord_name || hxdFriendDiscordId(friend) || '');
        var fontMap = window.__proFonts || {};
        var fontFamily = fontMap[friend.font] && fontMap[friend.font].family
            ? "'" + fontMap[friend.font].family + "', sans-serif;"
            : "'Space Grotesk', sans-serif;";

        if (friend.nick_gradient) {
            var colors = String(friend.nick_gradient).split(',');
            if (colors.length >= 2) {
                return '<span style="font-family:' + fontFamily + 'background:linear-gradient(90deg, ' + colors[0].trim() + ', ' + colors[1].trim() + ');-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;display:inline-block;">' + displayName + '</span>';
            }
        }

        var color = friend.nick_color || ((friend.is_verified || friend.is_pro) ? (friend.verified_color || '#249EF0') : '#fff');
        return '<span style="font-family:' + fontFamily + 'color:' + color + ';">' + displayName + '</span>';
    }

    function friendHasPersonalizationOrBadge(friend) {
        if (!friend) return false;
        if (friend.is_verified || friend.is_pro) return true;
        var b = String(friend.badge || '').toUpperCase();
        if (b === 'CEO' || b === 'DEV') return true;
        if (friend.banner && friend.banner !== 'none') return true;
        if (friend.font && friend.font !== 'default') return true;
        if (friend.nick_color || friend.nick_gradient) return true;
        if (friend.verified_color || friend.verified_gradient) return true;
        if (friend.custom_banner_color1 || friend.custom_banner_color2) return true;
        return false;
    }

    function getFriendRoleBadge(friend) {
        if (!friend) return '';
        var role = String(friend.badge || '').toUpperCase();
        if (role !== 'DEV' && role !== 'CEO') return '';

        var style = role === 'CEO'
            ? 'display:inline-flex;align-items:center;justify-content:center;margin-right:6px;padding:0 6px;min-width:30px;height:16px;border-radius:5px;background:rgba(185,28,28,.10);border:1px solid rgba(239,68,68,.45);color:#fecaca;font-size:8px;font-weight:700;letter-spacing:.08em;line-height:1;text-transform:uppercase;box-sizing:border-box;flex-shrink:0;'
            : 'display:inline-flex;align-items:center;justify-content:center;margin-right:6px;padding:0 6px;min-width:30px;height:16px;border-radius:5px;background:rgba(37,99,235,.10);border:1px solid rgba(96,165,250,.45);color:#bfdbfe;font-size:8px;font-weight:700;letter-spacing:.08em;line-height:1;text-transform:uppercase;box-sizing:border-box;flex-shrink:0;';

        return '<span style="' + style + '">' + role + '</span>';
    }

    function getFriendVerifiedBadge(friend) {
        if (!friend || !friendHasPersonalizationOrBadge(friend)) return '';

        if (friend.verified_gradient) {
            var colors = String(friend.verified_gradient).split(',');
            var vgId = escapeHtml(hxdFriendDiscordId(friend) || 'u');
            if (colors.length >= 2) {
                return '<svg width="12" height="12" viewBox="0 0 22 22" fill="none" style="margin-left:4px;flex-shrink:0;"><defs><linearGradient id="friend-vg-' + vgId + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + colors[0].trim() + '"/><stop offset="100%" stop-color="' + colors[1].trim() + '"/></linearGradient></defs><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="url(#friend-vg-' + vgId + ')"/><path d="M15 9l-4.5 4.5L8 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            }
        }

        return '<svg width="12" height="12" viewBox="0 0 22 22" fill="none" style="margin-left:4px;flex-shrink:0;"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="' + (friend.verified_color || '#249EF0') + '"/><path d="M15 9l-4.5 4.5L8 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function getFriendJoinLink(friend) {
        if (!friend || !friend.is_online) return '';

        if (friend.room_link) {
            return String(friend.room_link);
        }

        if (friend.room_id) {
            return 'https://www.haxball.com/play?c=' + encodeURIComponent(String(friend.room_id));
        }

        return '';
    }

    function extractRoomCode(link) {
        var s = String(link || '').trim();
        if (!s) return '';
        var m = s.match(/[?&]c=([^&]+)/);
        if (m) {
            try {
                return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
            } catch (e) {
                return m[1].trim();
            }
        }
        try {
            var parsed = new URL(s, window.location.href);
            return String(parsed.searchParams.get('c') || '').trim();
        } catch (e2) {
            return '';
        }
    }

    /** Nombre de sala para la lista; si la API no manda room_name, usamos room_id o el código del link (nunca texto genérico). */
    function getFriendRoomDisplayName(friend) {
        if (!friend) return '';
        var fromApi = friend.room_name || friend.room_title || friend.current_room_name;
        if (fromApi && String(fromApi).trim()) return String(fromApi).trim();
        if (friend.room_id != null && String(friend.room_id).trim()) return String(friend.room_id).trim();
        if (friend.room_link) {
            var code = extractRoomCode(friend.room_link);
            if (code) return code;
        }
        return '';
    }

    function roomLinkRequiresPassword(link) {
        try {
            var parsed = new URL(String(link || ''), window.location.origin);
            return parsed.searchParams.get('p') === '1';
        } catch (e) {
            return false;
        }
    }

    function isRoomAdmin() {
        if (!document.querySelector('.game-view')) return false;
        try {
            return window.__haxRoomAdmin === true;
        } catch (e) {
            return false;
        }
    }

    function getCurrentRoomInviteData() {
        if (!(document.querySelector('.room-view') || document.querySelector('.game-view'))) return null;
        var roomLink = cachedRoomInviteLink || getCurrentRoomLink();
        var roomId = extractRoomCode(roomLink);
        if (!roomId) return null;
        return {
            room_id: roomId,
            room_name: getCurrentRoomName() || 'Sala',
            room_link: roomLink,
            requires_password: roomLinkRequiresPassword(roomLink),
            is_admin: isRoomAdmin()
        };
    }

    function resolveCurrentRoomInviteData(doc) {
        var immediate = getCurrentRoomInviteData();
        if (immediate) return Promise.resolve(immediate);

        return new Promise(function(resolve) {
            var linkBtn = doc && doc.querySelector ? doc.querySelector('[data-hook="link-btn"]') : null;
            if (!linkBtn) {
                resolve(getCurrentRoomInviteData());
                return;
            }

            try {
                linkBtn.click();
            } catch (e) {
                resolve(getCurrentRoomInviteData());
                return;
            }

            setTimeout(function() {
                try {
                    var roomLinkDialog = doc.querySelector('.room-link-view');
                    var linkInput = roomLinkDialog && roomLinkDialog.querySelector('[data-hook="link"]');
                    if (linkInput && linkInput.value) {
                        cachedRoomInviteLink = String(linkInput.value || '').trim();
                    }
                    var closeBtn = roomLinkDialog && roomLinkDialog.querySelector('[data-hook="close"]');
                    if (closeBtn) closeBtn.click();
                } catch (e) {}
                resolve(getCurrentRoomInviteData());
            }, 120);
        });
    }

    function promptInvitePasswordIfNeeded(inviteData) {
        if (!inviteData || !inviteData.requires_password || !inviteData.is_admin) return Promise.resolve(null);
        try {
            var runtimePassword = String(window.__haxRoomPassword || '');
            if (runtimePassword) return Promise.resolve(runtimePassword);
        } catch (e) {}
        var password = window.prompt(t('Esta sala tiene código. Escribilo para que tu amigo entre sin que se lo pida.'), '');
        if (password == null) return Promise.resolve(undefined);
        password = String(password).trim();
        return Promise.resolve(password || null);
    }

    function savePendingInvitePassword(roomId, password) {
        if (!roomId || !password) return;
        try {
            localStorage.setItem(ROOM_INVITE_ROOM_KEY, String(roomId));
            localStorage.setItem(ROOM_INVITE_PASSWORD_KEY, String(password));
        } catch (e) {}
    }

    function consumePendingInvitePassword(roomId) {
        try {
            var savedRoomId = localStorage.getItem(ROOM_INVITE_ROOM_KEY) || '';
            var savedPassword = localStorage.getItem(ROOM_INVITE_PASSWORD_KEY) || '';
            if (!savedRoomId || !savedPassword || String(savedRoomId) !== String(roomId || '')) return '';
            localStorage.removeItem(ROOM_INVITE_ROOM_KEY);
            localStorage.removeItem(ROOM_INVITE_PASSWORD_KEY);
            return savedPassword;
        } catch (e) {
            return '';
        }
    }

    function navigateToRoomLink(roomLink) {
        if (!roomLink) return;
        try {
            if (window.top && typeof window.top.__hxdJoinRoomViaToolbar === 'function') {
                if (window.top.__hxdJoinRoomViaToolbar(roomLink)) return;
            }
        } catch (eHb) {}

        try {
            if (window.top && window.top.location) {
                window.top.location.href = roomLink;
            } else {
                window.location.href = roomLink;
            }
        } catch (e) {
            window.location.href = roomLink;
        }
    }

    // Limpa intervals
    function cleanupIntervals() {
        if (friendsInterval) {
            clearInterval(friendsInterval);
            friendsInterval = null;
        }
        if (requestsInterval) {
            clearInterval(requestsInterval);
            requestsInterval = null;
        }
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }
    }

    function hxdDocIsInsideRoomSession(doc) {
        if (!doc || !doc.querySelector) return false;
        return !!(doc.querySelector('.room-view') || doc.querySelector('.game-view'));
    }

    /** Quita overlay modal antiguo (reemplazado por panel derecho). */
    function hxdRemoveLegacyFriendsRoomOverlay(doc) {
        try {
            var old = doc.getElementById('friends-room-overlay');
            if (old) old.remove();
        } catch (eOv) {}
    }

    // Fecha painel de amizades
    function closeFriendsPanel(doc, forceRoomPanelClose) {
        if (!doc) return;

        hxdRemoveLegacyFriendsRoomOverlay(doc);

        if (hxdDocIsInsideRoomSession(doc) && !forceRoomPanelClose) {
            return;
        }

        var dialog = doc.querySelector && doc.querySelector('.roomlist-view .dialog');
        if (dialog && doc.getElementById('zero-inpanel-friends') && window.__hxdSetRoomlistDialogFriendsMode) {
            if (friendsPanelOpen || dialog.classList.contains('zero-friends-mode')) {
                try {
                    window.__hxdSetRoomlistDialogFriendsMode(doc, dialog, false);
                } catch (eHxdFr) {}
                dialog.classList.remove('zero-friends-mode');
                friendsPanelOpen = false;
                cleanupIntervals();
            }
            return;
        }

        var panel = doc.getElementById('friends-panel');
        if (panel) panel.remove();
        friendsPanelOpen = false;
        cleanupIntervals();
    }

    function getFriendsPanelInnerHtml() {
        var pillTop = escapeHtml(t('Friends pending pill'));
        return (
            '<div style="position:relative;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.07);">' +
            '<button id="close-friends-btn" type="button" style="position:absolute;top:8px;right:10px;background:none;border:none;color:#6b7280;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;border-radius:6px;" title="' +
            escapeHtml(t('Fechar')) +
            '">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
            '<h1 style="color:#fff;font-size:15px;font-weight:600;margin:0;padding:11px 36px 7px;text-align:center;letter-spacing:-0.02em;">' +
            escapeHtml(t('Amizades')) +
            '</h1></div>' +
            '<div style="flex-shrink:0;padding:8px 14px 12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
            '<div style="flex:1;height:2px;border-radius:999px;background:linear-gradient(90deg,#22c55e,#16a34a);opacity:0.95;"></div>' +
            '<span style="flex-shrink:0;font-size:9px;font-weight:700;letter-spacing:0.12em;color:#86efac;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);padding:3px 8px;border-radius:999px;">' +
            pillTop +
            '</span></div>' +
            '<div style="color:#4ade80;font-size:13px;font-weight:700;margin-top:10px;margin-bottom:4px;letter-spacing:-0.02em;">' +
            escapeHtml(t('Friends brand line')) +
            '</div>' +
            '<p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.5;">' +
            escapeHtml(t('Friends panel blurb')) +
            '</p></div>' +
            '<div id="add-friend-section" style="flex-shrink:0;padding:0 14px 10px;">' +
            '<div style="display:flex;gap:8px;align-items:center;padding:7px 10px;border-radius:8px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid rgba(255,255,255,0.08);box-sizing:border-box;">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="flex-shrink:0;opacity:0.9;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
            '<input id="friend-id-input" type="text" placeholder="' +
            t('Username do Discord') +
            '" autocomplete="off" style="flex:1;min-width:0;padding:7px 10px;background:var(--theme-bg-tertiary, #272727);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#fff;font-size:12px;font-family:\'Space Grotesk\',system-ui,sans-serif;outline:none;">' +
            '<button id="add-friend-btn" type="button" style="flex-shrink:0;padding:7px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
            '</button></div></div>' +
            '<div id="search-results" style="padding:0 14px;max-height:130px;overflow-y:auto;"></div>' +
            '<p id="add-friend-status" style="color:#8ED2AB;font-size:11px;margin:0;padding:3px 14px 8px;text-align:center;min-height:16px;line-height:1.35;"></p>' +
            '<div id="pending-room-invites" style="padding:0 14px;"></div>' +
            '<div id="pending-requests" style="padding:0 14px;"></div>' +
            '<div id="friends-list" style="flex:1;min-height:0;overflow-y:auto;padding:10px 14px 14px;"></div>'
        );
    }

    function createFriendsInpanel(doc, dialog) {
        var existing = doc.getElementById('zero-inpanel-friends');
        if (existing) {
            if (!existing.querySelector('#friends-list')) {
                existing.innerHTML = getFriendsPanelInnerHtml();
                setupPanelListeners(doc, existing);
            }
            return existing;
        }
        var bodyPan = doc.getElementById('friends-panel');
        if (bodyPan && bodyPan.parentNode === doc.body) {
            bodyPan.remove();
        }
        var wrap = doc.createElement('div');
        wrap.id = 'zero-inpanel-friends';
        wrap.setAttribute('aria-hidden', 'true');
        wrap.style.display = 'none';
        wrap.style.flexDirection = 'column';
        wrap.innerHTML = getFriendsPanelInnerHtml();
        var sb = doc.getElementById('sidebar-panel');
        if (sb && sb.parentNode === dialog) {
            dialog.insertBefore(wrap, sb);
        } else {
            dialog.appendChild(wrap);
        }
        setupPanelListeners(doc, wrap);
        return wrap;
    }

    // Cria painel de amizades
    function createFriendsPanel(doc) {
        var existing = doc.getElementById('friends-panel');
        if (existing) return existing;

        var panel = doc.createElement('div');
        panel.id = 'friends-panel';
        panel.style.cssText =
            'position:fixed;top:0;right:-320px;width:320px;height:100vh;max-height:100vh;box-sizing:border-box;background:#141414;border-left:1px solid #232323;z-index:100002;transition:right 0.3s ease;display:flex;flex-direction:column;font-family:"Space Grotesk",sans-serif;user-select:none;';

        panel.innerHTML = getFriendsPanelInnerHtml();

        doc.body.appendChild(panel);
        
        // Configura event listeners imediatamente após criar
        setupPanelListeners(doc, panel);
        
        return panel;
    }
    
    // Configura os event listeners do painel (chamado apenas uma vez na criação)
    function setupPanelListeners(doc, panel) {
        // Botão de fechar
        var closeBtn = panel.querySelector('#close-friends-btn');
        if (closeBtn) {
            closeBtn.addEventListener('mouseenter', function() { closeBtn.style.color = '#fff'; });
            closeBtn.addEventListener('mouseleave', function() { closeBtn.style.color = '#666'; });
            closeBtn.addEventListener('click', function() {
                closeFriendsPanel(doc, true);
            });
        }

        var addBtn = panel.querySelector('#add-friend-btn');
        var input = panel.querySelector('#friend-id-input');
        var status = panel.querySelector('#add-friend-status');

        if (addBtn && input && status) {
            addBtn.addEventListener('mouseenter', function() { addBtn.style.background = '#333'; });
            addBtn.addEventListener('mouseleave', function() { addBtn.style.background = '#272727'; });

            var searchResults = panel.querySelector('#search-results');

            // Busca enquanto digita
            input.addEventListener('input', function() {
                var query = input.value.trim();
                if (searchTimeout) clearTimeout(searchTimeout);
                
                if (query.length < 2) {
                    searchResults.innerHTML = '';
                    return;
                }

                searchTimeout = setTimeout(function() {
                    fetch(API_BASE + '/friends/search?q=' + encodeURIComponent(query))
                        .then(function(r) { return r.json(); })
                        .then(function(users) {
                            // Garante que users seja um array
                            if (!Array.isArray(users)) {
                                console.error('Resposta inválida da API:', users);
                                searchResults.innerHTML = '<div style="padding:8px;color:#666;font-size:12px;">' + t('Erro ao buscar usuários') + '</div>';
                                return;
                            }

                            if (users.length === 0) {
                                searchResults.innerHTML = '<div style="padding:8px;color:#666;font-size:12px;">' + t('Nenhum usuário encontrado') + '</div>';
                                return;
                            }

                            var html = '';
                            users.forEach(function(user) {
                                var verifiedBadge = getFriendVerifiedBadge(user);
                                var roleBadge = getFriendRoleBadge(user);
                                var hasDecoratedProfile = friendHasPersonalizationOrBadge(user);
                                var cardBackground = hasDecoratedProfile ? getFriendBannerBackground(user) : '#1a1a1a';
                                var cardBorder = hasDecoratedProfile
                                    ? '1px solid rgba(255,255,255,0.10)'
                                    : '1px solid rgba(255,255,255,0.06)';
                                var buttonBackground = hasDecoratedProfile ? 'rgba(0,0,0,0.26)' : '#272727';
                                var nameHtml = getFriendNameHtml(user);
                                html += '<div class="search-result-item" data-id="' + user.discord_id + '" data-name="' + (user.discord_name || user.username) + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:' + cardBackground + ';border:' + cardBorder + ';border-radius:6px;margin-bottom:6px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,0.03);">' +
                                    '<div style="flex:1;min-width:0;">' +
                                    '<div style="display:flex;align-items:center;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + roleBadge + nameHtml + verifiedBadge + '</div>' +
                                    '<div style="color:rgba(255,255,255,0.58);font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">@' + user.username + '</div>' +
                                    '</div>' +
                                    '<button class="add-from-search" data-id="' + user.discord_id + '" style="padding:4px 10px;background:' + buttonBackground + ';border:1px solid rgba(255,255,255,0.14);border-radius:4px;color:#fff;cursor:pointer;font-size:11px;flex-shrink:0;">' + t('Adicionar') + '</button>' +
                                    '</div>';
                            });
                            searchResults.innerHTML = html;

                            // Event listeners para adicionar
                            searchResults.querySelectorAll('.add-from-search').forEach(function(btn) {
                                btn.addEventListener('click', function(e) {
                                    e.stopPropagation();
                                    var discordId = btn.dataset.id;
                                    var item = btn.closest('.search-result-item');
                                    var name = item.dataset.name;

                                    btn.textContent = '...';
                                    fetch(API_BASE + '/friends/requests/send', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ to_discord_id: discordId })
                                    })
                                    .then(function(r) { return r.json(); })
                                    .then(function(result) {
                                        if (result.success) {
                                            status.textContent = t('Solicitação enviada para') + ' ' + name + '!';
                                            status.style.color = '#8ED2AB';
                                            searchResults.innerHTML = '';
                                            input.value = '';
                                        } else {
                                            status.textContent = result.error || t('Erro ao enviar');
                                            status.style.color = '#ff6b6b';
                                            btn.textContent = t('Adicionar');
                                        }
                                    });
                                });
                            });
                        });
                }, 300);
            });

            // Botão de adicionar (fallback para Discord ID direto)
            addBtn.addEventListener('click', function() {
                var friendId = input.value.trim();
                if (!friendId) {
                    status.textContent = t('Digite um username');
                    status.style.color = '#ff6b6b';
                    return;
                }

                status.textContent = t('Buscando...');
                status.style.color = '#8ED2AB';

                // Tenta buscar por username primeiro
                fetch(API_BASE + '/friends/user?username=' + encodeURIComponent(friendId))
                    .then(function(r) { return r.json(); })
                    .then(function(user) {
                        if (!user) {
                            // Tenta por Discord ID
                            return fetch(API_BASE + '/friends/user?discord_id=' + encodeURIComponent(friendId))
                                .then(function(r) { return r.json(); });
                        }
                        return user;
                    })
                    .then(function(user) {
                        console.log('Usuário retornado da API:', user);
                        
                        if (!user) {
                            status.textContent = t('Usuário não encontrado');
                            status.style.color = '#ff6b6b';
                            return;
                        }

                        // Validação: verifica se o usuário tem discord_id
                        if (!user.discord_id) {
                            status.textContent = t('Erro: dados do usuário inválidos');
                            status.style.color = '#ff6b6b';
                            console.error('Usuário sem discord_id:', JSON.stringify(user));
                            return;
                        }

                        // Envia solicitação de amizade
                        fetch(API_BASE + '/friends/requests/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ to_discord_id: user.discord_id })
                        })
                        .then(function(r) { return r.json(); })
                        .then(function(result) {
                            if (result.success) {
                                status.textContent = t('Solicitação enviada para') + ' ' + (user.discord_name || user.username || friendId) + '!';
                                status.style.color = '#8ED2AB';
                                input.value = '';
                                searchResults.innerHTML = '';
                            } else {
                                status.textContent = result.error || 'Erro ao enviar solicitação';
                                status.style.color = '#ff6b6b';
                            }
                        })
                        .catch(function(err) {
                            status.textContent = t('Erro ao enviar solicitação');
                            status.style.color = '#ff6b6b';
                            console.error('Erro:', err);
                        });
                    })
                    .catch(function() {
                        status.textContent = t('Erro ao buscar usuário');
                        status.style.color = '#ff6b6b';
                    });
            });
        }
    }

    // Renderiza lista de amigos
    function renderFriendsList(doc, friends) {
        var list = doc.getElementById('friends-list');
        if (!list) return;
        var activeInvite = getCurrentRoomInviteData();
        var isInsideRoom = Boolean(document.querySelector('.room-view') || document.querySelector('.game-view'));
        var canInviteFromRoom = Boolean(activeInvite || isInsideRoom);
        var canJoinFromList = !isInsideRoom;

        if (!friends || friends.length === 0) {
            list.innerHTML =
                '<p style="margin:0;padding:22px 12px;color:#737373;text-align:center;font-size:11px;line-height:1.5;border:1px dashed rgba(255,255,255,0.12);border-radius:8px;background:transparent;">' +
                escapeHtml(t('Nenhum amigo adicionado')) +
                '</p>';
            return;
        }

        // Ordena: online primeiro, depois por nome
        var sorted = friends.slice().sort(function(a, b) {
            if (a.is_online && !b.is_online) return -1;
            if (!a.is_online && b.is_online) return 1;
            return (a.discord_name || '').localeCompare(b.discord_name || '');
        });

        var tagAmigos = escapeHtml(t('Friends list section tag'));
        var html =
            '<div style="margin:4px 0 10px;">' +
            hxdFriendsSectionDividerHtml(tagAmigos) +
            '<p style="margin:0;font-size:10px;font-weight:700;color:#fff;letter-spacing:-0.01em;">' +
            escapeHtml(t('Amigos')) +
            '</p></div>';

        sorted.forEach(function(friend) {
            var fid = hxdFriendDiscordId(friend);
            if (!fid) return;

            var fidEsc = escapeHtml(fid);
            var verifiedBadge = getFriendVerifiedBadge(friend);
            var roleBadge = getFriendRoleBadge(friend);
            var friendNameHtml = getFriendNameHtml(friend);
            var friendCardBackground = getFriendBannerBackground(friend);
            var joinLink = getFriendJoinLink(friend);
            var inRoom = Boolean(
                joinLink ||
                friend.room_id ||
                (friend.room_name && String(friend.room_name).trim())
            );
            var descLine;
            if (!friend.is_online) {
                descLine = t('Offline');
            } else if (inRoom) {
                descLine = getFriendRoomDisplayName(friend) || t('Online');
            } else {
                descLine = t('Online');
            }

            var unameLine =
                friend.username && String(friend.username).trim()
                    ? '<div style="color:rgba(255,255,255,0.5);font-size:10px;margin-top:3px;font-weight:500;">@' +
                      escapeHtml(String(friend.username).trim()) +
                      '</div>'
                    : '';

            var joinBtnHtml =
                canJoinFromList && joinLink
                    ? '<button type="button" class="join-friend-btn" data-link="' +
                      escapeHtml(joinLink) +
                      '" style="flex:1;min-width:0;padding:7px 6px;background:#22c55e;border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">' +
                      escapeHtml(t('Entrar')) +
                      '</button>'
                    : '';

            var inviteBtnHtml = canInviteFromRoom
                ? '<button type="button" class="invite-friend-btn" data-id="' +
                  fidEsc +
                  '" style="flex:1;min-width:0;padding:7px 6px;background:rgba(59,130,246,0.12);border:1px solid rgba(96,165,250,0.45);border-radius:6px;color:#93c5fd;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">' +
                  escapeHtml(t('Invitar')) +
                  '</button>'
                : '';

            var actionsRow =
                joinBtnHtml || inviteBtnHtml
                    ? '<div style="display:flex;flex-wrap:wrap;gap:6px;padding:7px 10px 8px;border-top:1px solid rgba(255,255,255,0.06);">' +
                      joinBtnHtml +
                      inviteBtnHtml +
                      '</div>'
                    : '';

            html +=
                '<div class="friend-item" data-id="' +
                fidEsc +
                '" style="margin-bottom:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.09);overflow:hidden;background:var(--theme-bg-secondary, #1a1a1a);box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);">' +
                '<div style="display:flex;gap:10px;padding:10px;background:' +
                friendCardBackground +
                ';border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<span style="flex-shrink:0;margin-top:0;width:31px;height:31px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.22);">' +
                HX_IC_USER_SM +
                '</span>' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;font-size:13px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                roleBadge +
                friendNameHtml +
                verifiedBadge +
                '</div>' +
                unameLine +
                '<div style="color:rgba(255,255,255,0.62);font-size:11px;margin-top:5px;line-height:1.35;">' +
                escapeHtml(descLine) +
                '</div></div></div>' +
                actionsRow +
                '<div style="padding:0 10px 10px;">' +
                '<button type="button" class="remove-friend-btn" data-id="' +
                fidEsc +
                '" title="' +
                escapeHtml(t('Remover')) +
                '" style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.11);border-radius:6px;color:#e8e8e8;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">' +
                escapeHtml(t('Remover')) +
                '</button></div></div>';
        });

        list.innerHTML = html;

        // Event listeners para botões de entrar
        list.querySelectorAll('.join-friend-btn').forEach(function(btn) {
            btn.addEventListener('mouseenter', function() { btn.style.background = '#16a34a'; });
            btn.addEventListener('mouseleave', function() { btn.style.background = '#22c55e'; });
            btn.addEventListener('click', function() {
                var roomLink = btn.dataset.link;
                if (roomLink) {
                    closeFriendsPanel(doc, true);
                    navigateToRoomLink(roomLink);
                }
            });
        });

        list.querySelectorAll('.invite-friend-btn').forEach(function(btn) {
            btn.addEventListener('mouseenter', function() {
                if (btn.disabled) return;
                btn.style.background = 'rgba(59,130,246,0.22)';
                btn.style.borderColor = 'rgba(147,197,253,0.55)';
            });
            btn.addEventListener('mouseleave', function() {
                if (btn.disabled) return;
                btn.style.background = 'rgba(59,130,246,0.12)';
                btn.style.borderColor = 'rgba(96,165,250,0.45)';
            });
            btn.addEventListener('click', function() {
                btn.disabled = true;
                btn.textContent = '...';
                resolveCurrentRoomInviteData(doc).then(function(inviteData) {
                    if (!inviteData) {
                        btn.disabled = false;
                        btn.textContent = t('Invitar');
                        btn.style.background = 'rgba(59,130,246,0.12)';
                        btn.style.borderColor = 'rgba(96,165,250,0.45)';
                        return;
                    }
                    return promptInvitePasswordIfNeeded(inviteData).then(function(roomPassword) {
                    if (roomPassword === undefined) {
                        btn.disabled = false;
                        btn.textContent = t('Invitar');
                        btn.style.background = 'rgba(59,130,246,0.12)';
                        btn.style.borderColor = 'rgba(96,165,250,0.45)';
                        return;
                    }
                    return fetch(API_BASE + '/friends/room-invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to_discord_id: btn.dataset.id,
                            room_id: inviteData.room_id,
                            room_name: inviteData.room_name,
                            room_link: inviteData.room_link,
                            requires_password: inviteData.requires_password,
                            room_password: inviteData.is_admin ? roomPassword : null
                        })
                    }).then(function(r) { return r.json(); })
                    .then(function(result) {
                        if (result && result.success) {
                            btn.textContent = t('Invitado');
                            btn.style.background = 'rgba(30,58,138,0.65)';
                            btn.style.borderColor = 'rgba(96,165,250,0.35)';
                            setTimeout(function() {
                                btn.disabled = false;
                                btn.textContent = t('Invitar');
                                btn.style.background = 'rgba(59,130,246,0.12)';
                                btn.style.borderColor = 'rgba(96,165,250,0.45)';
                            }, 1800);
                        } else {
                            btn.disabled = false;
                            btn.textContent = t('Invitar');
                            btn.style.background = 'rgba(220,38,38,0.2)';
                            btn.style.borderColor = 'rgba(248,113,113,0.5)';
                            setTimeout(function() {
                                btn.style.background = 'rgba(59,130,246,0.12)';
                                btn.style.borderColor = 'rgba(96,165,250,0.45)';
                            }, 1800);
                        }
                    }).catch(function() {
                        btn.disabled = false;
                        btn.textContent = t('Invitar');
                        btn.style.background = 'rgba(59,130,246,0.12)';
                        btn.style.borderColor = 'rgba(96,165,250,0.45)';
                    });
                    });
                });
            });
        });

        // Event listeners para botões de remover
        list.querySelectorAll('.remove-friend-btn').forEach(function(btn) {
            btn.addEventListener('mouseenter', function() {
                if (btn.disabled) return;
                btn.style.background = 'rgba(255,255,255,0.11)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            });
            btn.addEventListener('mouseleave', function() {
                if (btn.disabled) return;
                btn.style.background = 'rgba(255,255,255,0.06)';
                btn.style.borderColor = 'rgba(255,255,255,0.11)';
            });
            btn.addEventListener('click', function() {
                var friendId = String(btn.dataset.id || '').trim();
                if (!friendId) return;
                var statusLine = doc.getElementById('add-friend-status');
                btn.disabled = true;
                btn.textContent = '...';
                fetch(API_BASE + '/friends/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ friend_discord_id: friendId })
                })
                    .then(function(r) {
                        return r.text().then(function(tx) {
                            var parsed = {};
                            try {
                                parsed = tx ? JSON.parse(tx) : {};
                            } catch (jz) {}
                            return { ok: r.ok, data: parsed };
                        });
                    })
                    .then(function(wrapped) {
                        btn.disabled = false;
                        btn.textContent = t('Remover');
                        var result = wrapped.data || {};
                        if (result.success) {
                            if (statusLine) {
                                statusLine.textContent = t('Friends remove ok');
                                statusLine.style.color = '#9ca3af';
                            }
                            loadFriends(doc);
                        } else {
                            var errMsg =
                                result.error ||
                                (wrapped.ok ? t('Friends remove fail') : t('Erro de conexão'));
                            if (statusLine) {
                                statusLine.textContent = errMsg;
                                statusLine.style.color = '#ff6b6b';
                            }
                            if (typeof window.showToast === 'function') {
                                window.showToast(errMsg, 'error', 2600);
                            }
                        }
                    })
                    .catch(function() {
                        btn.disabled = false;
                        btn.textContent = t('Remover');
                        var errMsg = t('Erro de conexão');
                        if (statusLine) {
                            statusLine.textContent = errMsg;
                            statusLine.style.color = '#ff6b6b';
                        }
                    });
            });
        });
    }

    // Carrega lista de amigos
    function loadFriends(doc) {
        fetch(API_BASE + '/friends')
            .then(function(r) { return r.json(); })
            .then(function(friends) { renderFriendsList(doc, friends); })
            .catch(function() {});
    }

    function renderPendingRoomInvites(doc, invites) {
        var container = doc.getElementById('pending-room-invites');
        if (!container) return;

        if (!invites || invites.length === 0) {
            container.innerHTML = '';
            return;
        }

        var html = '<div style="margin-bottom:10px;">' +
            '<div style="color:#737373;font-size:10px;margin-bottom:6px;padding-left:2px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">' + t('Invitaciones de sala') + '</div>';

        invites.forEach(function(invite) {
            var rlEnc = '';
            try {
                rlEnc = invite.room_link ? encodeURIComponent(String(invite.room_link)) : '';
            } catch (eRl) {}
            html += '<div class="room-invite-item" data-id="' + invite.id + '" style="display:flex;align-items:center;padding:9px 11px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:6px;">' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="color:#fff;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(invite.room_name || t('Sala privada')) + '</div>' +
                '<div style="color:#737373;font-size:10px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t('Invitación de') + ' ' + escapeHtml(invite.from_name || invite.from_discord_id || '') + (invite.requires_password ? ' • ' + t('Con código') : '') + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:5px;">' +
                '<button type="button" class="accept-room-invite-btn" data-id="' + invite.id + '" data-hxd-room-link="' + rlEnc + '" style="padding:6px 10px;background:#22c55e;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-family:\'Space Grotesk\',sans-serif;font-weight:600;">' + t('Entrar') + '</button>' +
                '<button type="button" class="reject-room-invite-btn" data-id="' + invite.id + '" style="padding:6px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#e5e5e5;cursor:pointer;font-size:11px;font-family:\'Space Grotesk\',sans-serif;font-weight:600;">' + t('Recusar') + '</button>' +
                '</div>' +
                '</div>';
        });

        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.accept-room-invite-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                function hxdFallbackRoomLink() {
                    var enc = btn.getAttribute('data-hxd-room-link') || '';
                    if (!enc) return '';
                    try {
                        return decodeURIComponent(enc);
                    } catch (eDec) {
                        return '';
                    }
                }
                function hxdToastFail(msg) {
                    var text = msg || t('Room invite accept failed');
                    if (typeof window.showToast === 'function') {
                        window.showToast(text, 'error', 3200);
                    }
                }
                if (btn.disabled) return;
                btn.disabled = true;
                var prevLabel = btn.textContent;
                btn.textContent = '…';
                fetch(API_BASE + '/friends/room-invites/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invite_id: btn.getAttribute('data-id') })
                })
                .then(function(r) {
                    return r.text().then(function(tx) {
                        try {
                            return tx ? JSON.parse(tx) : {};
                        } catch (eJ) {
                            return {};
                        }
                    });
                })
                .then(function(result) {
                    if (!result || !result.success) {
                        btn.disabled = false;
                        btn.textContent = prevLabel;
                        hxdToastFail(result && result.error ? String(result.error) : '');
                        return;
                    }
                    var invite = result.invite || {};
                    var roomLink = String(invite.room_link || '').trim() || hxdFallbackRoomLink();
                    if (!roomLink) {
                        btn.disabled = false;
                        btn.textContent = prevLabel;
                        hxdToastFail(t('Room invite missing link'));
                        return;
                    }
                    if (invite.room_password && invite.room_id) {
                        savePendingInvitePassword(invite.room_id, invite.room_password);
                    }
                    closeFriendsPanel(doc, true);
                    navigateToRoomLink(roomLink);
                })
                .catch(function() {
                    btn.disabled = false;
                    btn.textContent = prevLabel;
                    hxdToastFail('');
                });
            });
        });

        container.querySelectorAll('.reject-room-invite-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fetch(API_BASE + '/friends/room-invites/reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invite_id: btn.getAttribute('data-id') })
                })
                .then(function(r) { return r.json(); })
                .then(function(result) {
                    if (result && result.success) loadRoomInvites(doc);
                })
                .catch(function() {});
            });
        });
    }

    function loadRoomInvites(doc) {
        fetch(API_BASE + '/friends/room-invites')
            .then(function(r) { return r.json(); })
            .then(function(invites) { renderPendingRoomInvites(doc, invites); })
            .catch(function() {});
    }

    function hxdFriendRequestStatusPending(row) {
        return String(row && row.status != null ? row.status : 'pending').trim().toLowerCase() === 'pending';
    }

    // Renderiza solicitações pendentes (estilo tipo upsell Pro: barra verde, pill, bloques claros)
    function renderPendingRequests(doc, requests) {
        var container = doc.getElementById('pending-requests');
        if (!container) return;

        var pendingOnly = !requests
            ? []
            : requests.filter(function(row) {
                return row && typeof row === 'object' && hxdFriendRequestStatusPending(row);
            });

        if (pendingOnly.length === 0) {
            container.innerHTML = '';
            return;
        }

        pendingOnly.sort(function(a, b) {
            var ta = a && a.created_at ? String(a.created_at) : '';
            var tb = b && b.created_at ? String(b.created_at) : '';
            return tb.localeCompare(ta);
        });

        var seenPair = {};
        var uniqueRequests = [];
        for (var j = 0; j < pendingOnly.length; j++) {
            var rq = pendingOnly[j];
            var pairKey = String(rq.from_discord_id || '') + '|' + String(rq.to_discord_id || '');
            if (seenPair[pairKey]) continue;
            seenPair[pairKey] = true;
            uniqueRequests.push(rq);
        }

        var introHtml = escapeHtml(t('Friends pending intro'));
        var hintHtml = escapeHtml(t('Friends request card hint'));
        var tagPend = escapeHtml(t('Friends pending section tag'));

        var html =
            '<div style="margin:12px 0 10px;">' +
            hxdFriendsSectionDividerHtml(tagPend) +
            '<p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#fff;letter-spacing:-0.02em;">' +
            escapeHtml(t('Solicitações pendentes')) +
            '</p>' +
            '<p style="margin:0;color:#9ca3af;font-size:10px;line-height:1.45;">' +
            introHtml +
            '</p></div>';

        uniqueRequests.forEach(function(req) {
            var rid = escapeHtml(req.id != null ? String(req.id) : '');
            var displayName = escapeHtml(req.from_discord_name || req.from_discord_id || '—');
            var subUser =
                req.from_username && String(req.from_username).trim()
                    ? '<div style="color:rgba(255,255,255,0.52);font-size:10px;margin-top:3px;font-weight:500;">@' +
                      escapeHtml(String(req.from_username).trim()) +
                      '</div>'
                    : '';

            html +=
                '<div class="request-item" data-id="' +
                rid +
                '" style="margin-bottom:8px;padding:10px;border-radius:8px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);">' +
                '<div style="display:flex;gap:10px;align-items:flex-start;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<span style="flex-shrink:0;margin-top:1px;">' +
                HX_IC_USER_SM +
                '</span>' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="color:#fff;font-size:13px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                displayName +
                '</div>' +
                subUser +
                '<div style="color:#b8b8b8;font-size:10px;line-height:1.4;margin-top:6px;">' +
                hintHtml +
                '</div></div></div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
                '<button type="button" class="accept-request-btn" data-id="' +
                rid +
                '" style="padding:8px 8px;background:#22c55e;border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;">' +
                t('Aceitar') +
                '</button>' +
                '<button type="button" class="reject-request-btn" data-id="' +
                rid +
                '" style="padding:8px 8px;background:transparent;border:1px solid rgba(255,255,255,0.14);border-radius:6px;color:#e5e5e5;font-size:12px;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;">' +
                t('Recusar') +
                '</button></div></div>';
        });

        container.innerHTML = html;

        // Event listeners para aceitar (id = UUID do Supabase — nunca usar parseInt)
        container.querySelectorAll('.accept-request-btn').forEach(function(btn) {
            btn.type = 'button';
            btn.addEventListener('mouseenter', function() {
                if (btn.disabled) return;
                btn.style.background = '#16a34a';
            });
            btn.addEventListener('mouseleave', function() {
                if (btn.disabled) return;
                btn.style.background = '#22c55e';
            });
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var requestId = String(btn.getAttribute('data-id') || '').trim();
                if (!requestId) return;
                var statusLine = doc.getElementById('add-friend-status');
                btn.disabled = true;
                btn.textContent = '...';
                fetch(API_BASE + '/friends/requests/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ request_id: requestId })
                })
                .then(function(r) {
                    return r.text().then(function(t) {
                        var parsed = {};
                        try {
                            parsed = t ? JSON.parse(t) : {};
                        } catch (pe) {}
                        return { ok: r.ok, data: parsed };
                    });
                })
                .then(function(wrapped) {
                    btn.disabled = false;
                    btn.textContent = t('Aceitar');
                    var result = wrapped.data || {};
                    if (result.success) {
                        if (statusLine) {
                            statusLine.textContent = t('Friends accept ok');
                            statusLine.style.color = '#8ED2AB';
                        }
                        loadPendingRequests(doc);
                        loadFriends(doc);
                    } else {
                        var errMsg =
                            result.error ||
                            (wrapped.ok ? t('Erro ao aceitar solicitação') : t('Erro de conexão'));
                        if (statusLine) {
                            statusLine.textContent = errMsg;
                            statusLine.style.color = '#ff6b6b';
                        }
                        if (typeof window.showToast === 'function') {
                            window.showToast(errMsg, 'error', 2800);
                        }
                    }
                })
                .catch(function() {
                    btn.disabled = false;
                    btn.textContent = t('Aceitar');
                    var errMsg = t('Erro de conexão');
                    if (statusLine) {
                        statusLine.textContent = errMsg;
                        statusLine.style.color = '#ff6b6b';
                    }
                });
            });
        });

        // Event listeners para recusar
        container.querySelectorAll('.reject-request-btn').forEach(function(btn) {
            btn.type = 'button';
            btn.addEventListener('mouseenter', function() {
                if (btn.disabled) return;
                btn.style.background = 'rgba(255,255,255,0.06)';
                btn.style.borderColor = 'rgba(255,255,255,0.22)';
            });
            btn.addEventListener('mouseleave', function() {
                btn.style.background = 'transparent';
                btn.style.borderColor = 'rgba(255,255,255,0.14)';
            });
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var requestId = String(btn.getAttribute('data-id') || '').trim();
                if (!requestId) return;
                var statusLine = doc.getElementById('add-friend-status');
                btn.disabled = true;
                btn.textContent = '...';
                fetch(API_BASE + '/friends/requests/reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ request_id: requestId })
                })
                .then(function(r) {
                    return r.text().then(function(tx) {
                        var parsed = {};
                        try {
                            parsed = tx ? JSON.parse(tx) : {};
                        } catch (pj) {}
                        return { ok: r.ok, data: parsed };
                    });
                })
                .then(function(wrapped) {
                    btn.disabled = false;
                    btn.textContent = t('Recusar');
                    if ((wrapped.data || {}).success) {
                        if (statusLine) {
                            statusLine.textContent = t('Friends reject ok');
                            statusLine.style.color = '#9ca3af';
                        }
                        loadPendingRequests(doc);
                        loadFriends(doc);
                    } else {
                        var errMsg =
                            (wrapped.data && wrapped.data.error) ||
                            (wrapped.ok ? t('Erro ao recusar') : t('Erro de conexão'));
                        if (statusLine) {
                            statusLine.textContent = errMsg;
                            statusLine.style.color = '#ff6b6b';
                        }
                    }
                })
                .catch(function() {
                    btn.disabled = false;
                    btn.textContent = t('Recusar');
                });
            });
        });
    }

    // Carrega solicitações pendentes
    function loadPendingRequests(doc) {
        fetch(API_BASE + '/friends/requests')
            .then(function(r) { return r.json(); })
            .then(function(requests) { renderPendingRequests(doc, requests); })
            .catch(function() {});
    }

    // Toggle painel de amizades
    function toggleFriendsPanel(doc) {
        if (!doc) return;
        if (hxdDocIsInsideRoomSession(doc)) {
            hxdRemoveLegacyFriendsRoomOverlay(doc);

            var openingRoom = !friendsPanelOpen;
            if (openingRoom && window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
                try {
                    TeamsSystem.closeRoomlistTeamsIfOpen(doc);
                } catch (eCtR) {}
            }
            if (openingRoom && window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
                try {
                    JerseyKitSystem.closeRoomlistJerseyIfOpen(doc);
                } catch (eJfR) {}
            }

            friendsPanelOpen = !friendsPanelOpen;

            var panel = doc.getElementById('friends-panel') || createFriendsPanel(doc);

            if (friendsPanelOpen) {
                panel.style.right = '0';
                panel.style.zIndex = '100002';
                loadFriends(doc);
                loadRoomInvites(doc);
                loadPendingRequests(doc);

                cleanupIntervals();

                friendsInterval = setInterval(function() { loadFriends(doc); }, FRIENDS_REFRESH_MS);
                requestsInterval = setInterval(function() {
                    loadRoomInvites(doc);
                    loadPendingRequests(doc);
                }, FRIENDS_REFRESH_MS);
            } else {
                panel.style.right = '-320px';
                cleanupIntervals();
            }
            return;
        }

        var dialog = doc.querySelector('.roomlist-view .dialog');
        if (dialog) {
            var opening = !friendsPanelOpen;
            if (opening && window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
                try {
                    TeamsSystem.closeRoomlistTeamsIfOpen(doc);
                } catch (eCt) {}
            }
            if (opening && window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
                try {
                    JerseyKitSystem.closeRoomlistJerseyIfOpen(doc);
                } catch (eJf) {}
            }
            friendsPanelOpen = !friendsPanelOpen;
            if (friendsPanelOpen) {
                dialog.classList.remove('zero-profile-mode');
                dialog.classList.remove('zero-teams-mode');
                dialog.classList.remove('zero-pro-mode');
                dialog.classList.remove('zero-kit-mode');
                if (window.__hxdSetRoomlistDialogProMode) {
                    try {
                        window.__hxdSetRoomlistDialogProMode(doc, dialog, false);
                    } catch (ePro) {}
                }
                if (window.__hxdClearProInpanelContext) {
                    try {
                        window.__hxdClearProInpanelContext();
                    } catch (ePc) {}
                }
                var proEl = doc.getElementById('zero-inpanel-pro');
                if (proEl) proEl.style.display = 'none';
                doc.getElementById('zero-inpanel-friends') || createFriendsInpanel(doc, dialog);
                if (window.__hxdSetRoomlistDialogFriendsMode) {
                    try {
                        window.__hxdSetRoomlistDialogFriendsMode(doc, dialog, true);
                    } catch (eHxdFr2) {}
                }
                dialog.classList.add('zero-friends-mode');
                loadFriends(doc);
                loadRoomInvites(doc);
                loadPendingRequests(doc);
                cleanupIntervals();
                friendsInterval = setInterval(function() { loadFriends(doc); }, FRIENDS_REFRESH_MS);
                requestsInterval = setInterval(function() {
                    loadRoomInvites(doc);
                    loadPendingRequests(doc);
                }, FRIENDS_REFRESH_MS);
            } else {
                if (window.__hxdSetRoomlistDialogFriendsMode) {
                    try {
                        window.__hxdSetRoomlistDialogFriendsMode(doc, dialog, false);
                    } catch (eHxdFr3) {}
                }
                dialog.classList.remove('zero-friends-mode');
                cleanupIntervals();
            }
            return;
        }

        var panel = doc.getElementById('friends-panel') || createFriendsPanel(doc);
        var openingLegacy = !friendsPanelOpen;
        if (openingLegacy && window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
            try {
                TeamsSystem.closeRoomlistTeamsIfOpen(doc);
            } catch (eCt2) {}
        }
        if (openingLegacy && window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
            try {
                JerseyKitSystem.closeRoomlistJerseyIfOpen(doc);
            } catch (eJf2) {}
        }
        friendsPanelOpen = !friendsPanelOpen;

        if (friendsPanelOpen) {
            panel.style.right = '0';
            loadFriends(doc);
            loadRoomInvites(doc);
            loadPendingRequests(doc);

            cleanupIntervals();

            friendsInterval = setInterval(function() { loadFriends(doc); }, FRIENDS_REFRESH_MS);
            requestsInterval = setInterval(function() {
                loadRoomInvites(doc);
                loadPendingRequests(doc);
            }, FRIENDS_REFRESH_MS);
        } else {
            panel.style.right = '-320px';
            cleanupIntervals();
        }
    }

    // Configura painel de amizades (apenas garante que existe)
    function setupFriendsPanel(doc) {
        if (doc && doc.querySelector('.roomlist-view .dialog')) return;
        createFriendsPanel(doc);
    }

    // Injeta botão de amizades na roomlist
    function injectFriendsButton(iframeDoc) {
        if (!iframeDoc || iframeDoc.getElementById('friends-btn')) return;
        var roomlistView = iframeDoc.querySelector('.roomlist-view');
        if (!roomlistView) return;

        var createRoomBtn = roomlistView.querySelector('[data-hook="create"]');
        if (!createRoomBtn) return;

        var buttonsContainer = createRoomBtn.parentElement;
        if (!buttonsContainer || buttonsContainer.querySelector('#friends-btn')) return;

        var btn = iframeDoc.createElement('button');
        btn.id = 'friends-btn';
        btn.innerHTML = '<i class="icon-heart"></i><div>Amizades</div>';

        btn.addEventListener('click', function() {
            setupFriendsPanel(iframeDoc);
            toggleFriendsPanel(iframeDoc);
        });

        createRoomBtn.after(btn);
    }

    // Atualiza presença quando entra em uma sala
    function updateRoomPresence(roomName, roomLink) {
        fetch(API_BASE + '/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_name: roomName, room_link: roomLink, is_online: true })
        }).catch(function() {});
    }

    // Marca como offline quando sai
    function setOfflinePresence() {
        fetch(API_BASE + '/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_name: null, room_link: null, is_online: false })
        }).catch(function() {});
    }

    function getCurrentRoomLink() {
        try {
            return window.top ? window.top.location.href : window.location.href;
        } catch (e) {
            return window.location.href;
        }
    }

    function normalizeRoomName(name) {
        var value = String(name || '').replace(/\s+/g, ' ').trim();
        if (!value) return null;

        var lowered = value.toLowerCase();
        if (lowered === 'sala' || lowered === 'room' || lowered === 'principal') {
            return null;
        }

        return value;
    }

    function getCurrentRoomName() {
        var selectors = [
            '.room-view [data-hook="room-name"]',
            '[data-hook="room-name"]',
            '.room-view h1',
            '.game-view .top-section h1'
        ];

        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (!el) continue;

            var text = normalizeRoomName(el.textContent);
            if (text) return text;
        }

        return null;
    }

    function clearPresenceObserver() {
        if (presenceObserver) {
            presenceObserver.disconnect();
            presenceObserver = null;
        }
        if (presenceDebounceTimer) {
            clearTimeout(presenceDebounceTimer);
            presenceDebounceTimer = null;
        }
        if (presenceInterval) {
            clearInterval(presenceInterval);
            presenceInterval = null;
        }
    }

    function schedulePresenceSync(fn) {
        if (presenceDebounceTimer) {
            clearTimeout(presenceDebounceTimer);
        }
        presenceDebounceTimer = setTimeout(function() {
            presenceDebounceTimer = null;
            fn();
        }, 120);
    }

    function injectRoomFriendsButton(doc) {
        var headerBtns = doc.querySelector('.room-view .header-btns');
        if (!headerBtns) return;
        var btn = headerBtns.querySelector('[data-hook="friends-room-btn"]');
        if (!btn) return;

        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-2px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span>' + t('Amizades') + '</span>';
        btn.style.display = '';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        btn.style.minWidth = '96px';
        btn.style.whiteSpace = 'nowrap';
        if (btn.dataset.friendsBound !== '1') {
            btn.dataset.friendsBound = '1';
            // El toggle lo hace installRoomFriendsButtonDelegate (captura): evitar doble apertura/cierre en un clic.
        }
    }

    function installRoomFriendsButtonDelegate(doc) {
        if (!doc || !doc.addEventListener || doc.__haxRoomFriendsDelegateInstalled) return;
        doc.__haxRoomFriendsDelegateInstalled = true;
        doc.addEventListener('click', function(e) {
            var target = e.target;
            if (!target || !target.closest) return;
            var btn = target.closest('[data-hook="friends-room-btn"]');
            if (!btn) return;
            e.preventDefault();
            e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
            setupFriendsPanel(doc);
            toggleFriendsPanel(doc);
        }, true);
    }

    function setupRoomHeaderFriendsButton(doc) {
        injectRoomFriendsButton(doc);
    }

    function setupRoomInvitePasswordAutofill(doc) {
        if (autoInvitePasswordTimer) return;
        autoInvitePasswordTimer = setInterval(function() {
            var dialog = doc.querySelector('.room-password-view');
            if (!dialog) return;
            var roomId = extractRoomCode(getCurrentRoomLink());
            var password = consumePendingInvitePassword(roomId);
            if (!password) return;
            var input = dialog.querySelector('[data-hook="input"]');
            var okBtn = dialog.querySelector('[data-hook="ok"]');
            if (!input || !okBtn) return;
            input.value = password;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            setTimeout(function() {
                okBtn.click();
            }, 30);
        }, 250);
    }

    function bootstrapRoomUi(doc) {
        if (!doc) return;
        hxdRemoveLegacyFriendsRoomOverlay(doc);
        installRoomFriendsButtonDelegate(doc);
        setupRoomHeaderFriendsButton(doc);
        setupRoomInvitePasswordAutofill(doc);
        injectRoomFriendsButton(doc);
    }

    // Exporta funções
    window.FriendsSystem = {
        injectFriendsButton: injectFriendsButton,
        injectRoomFriendsButton: injectRoomFriendsButton,
        closeFriendsPanel: closeFriendsPanel,
        closeRoomlistFriendsIfOpen: closeFriendsPanel,
        updateRoomPresence: updateRoomPresence,
        setOfflinePresence: setOfflinePresence,
        toggleFriendsPanel: function(doc) {
            setupFriendsPanel(doc);
            toggleFriendsPanel(doc);
        }
    };

    // Intercepta o modal de link da sala para compartilhar com amigos
    function setupRoomLinkSharing(doc) {
        // Intercepta clique no botão de Link
        var linkBtn = doc.querySelector('[data-hook="link-btn"]');
        if (!linkBtn || linkBtn.dataset.shareSetup === 'done') return;
        linkBtn.dataset.shareSetup = 'done';

        linkBtn.addEventListener('click', function() {
            // Espera o modal aparecer
            setTimeout(function() {
                var roomLinkDialog = doc.querySelector('.room-link-view');
                if (!roomLinkDialog || roomLinkDialog.dataset.shareSetup === 'done') return;
                roomLinkDialog.dataset.shareSetup = 'done';

                var linkInput = roomLinkDialog.querySelector('[data-hook="link"]');
                var buttonsDiv = roomLinkDialog.querySelector('.buttons');
                if (!linkInput || !buttonsDiv) return;

                var roomLink = linkInput.value;
                if (!roomLink) return;
                cachedRoomInviteLink = String(roomLink || '').trim();

                // Pega nome da sala
                var roomNameEl = doc.querySelector('[data-hook="room-name"]');
                var roomName = roomNameEl ? roomNameEl.textContent.trim() : 'Sala';

                // Adiciona botão de compartilhar
                var shareBtn = doc.createElement('button');
                shareBtn.setAttribute('data-hook', 'share-friends');
                shareBtn.textContent = t('Compartilhar');
                shareBtn.style.cssText = 'background:#22c55e;color:#fff;';
                shareBtn.onmouseenter = function() { shareBtn.style.background = '#16a34a'; };
                shareBtn.onmouseleave = function() { shareBtn.style.background = '#22c55e'; };
                shareBtn.onclick = function() {
                    fetch(API_BASE + '/presence', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ room_name: roomName, room_link: roomLink, is_online: true })
                    })
                    .then(function(r) { return r.json(); })
                    .then(function() {
                        shareBtn.textContent = t('Compartilhado!');
                        shareBtn.style.background = '#166534';
                        setTimeout(function() {
                            shareBtn.textContent = t('Compartilhar');
                            shareBtn.style.background = '#22c55e';
                        }, 2000);
                    })
                    .catch(function() {
                        shareBtn.textContent = t('Erro');
                        shareBtn.style.background = '#dc2626';
                    });
                };

                buttonsDiv.appendChild(shareBtn);
                Injector.log('Share button added');
            }, 100);
        });

        Injector.log('Link button click intercepted');
    }

    bootstrapRoomUi(document);

    // Auto-detecta entrada/saída de sala (só no game frame)
    if (typeof Injector !== 'undefined' && Injector.isGameFrame && Injector.isGameFrame()) {
        var lastRoomName = null;
        var lastRoomLink = null;
        var linkSharingSetup = false;

        function isInsideRoomSession() {
            return !!(document.querySelector('.room-view') || document.querySelector('.game-view'));
        }

        function checkAndUpdatePresence() {
            var roomView = document.querySelector('.room-view');
            var gameView = document.querySelector('.game-view');
            
            if (roomView || gameView) {
                var roomName = getCurrentRoomName() || lastRoomName;
                var roomLink = getCurrentRoomLink();
                
                if (roomName && (roomName !== lastRoomName || roomLink !== lastRoomLink)) {
                    lastRoomName = roomName;
                    lastRoomLink = roomLink;
                    updateRoomPresence(roomName, roomLink);
                    Injector.log('Presence: online em ' + roomName);
                }

                // Configura interceptação do botão de link
                if (!linkSharingSetup) {
                    var linkBtn = document.querySelector('[data-hook="link-btn"]');
                    if (linkBtn) {
                        setupRoomLinkSharing(document);
                        linkSharingSetup = true;
                    }
                }
            } else if (lastRoomName !== null) {
                // Saiu da sala
                lastRoomName = null;
                lastRoomLink = null;
                cachedRoomInviteLink = '';
                linkSharingSetup = false;
                setOfflinePresence();
                Injector.log('Presence: offline');
            }
        }

        function startPresenceTracking() {
            clearPresenceObserver();
            checkAndUpdatePresence();

            presenceObserver = new MutationObserver(function() {
                schedulePresenceSync(checkAndUpdatePresence);
            });
            presenceObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

            presenceInterval = setInterval(checkAndUpdatePresence, 2000);
        }

        startPresenceTracking();
        Injector.onView('room-view', function() {
            injectRoomFriendsButton(document);
            startPresenceTracking();
            setTimeout(checkAndUpdatePresence, 150);
            setTimeout(checkAndUpdatePresence, 500);
        });
        Injector.onView('game-view', function() {
            injectRoomFriendsButton(document);
            startPresenceTracking();
            setTimeout(checkAndUpdatePresence, 80);
            setTimeout(checkAndUpdatePresence, 250);
        });
        Injector.onViewLeave('room-view', function() {
            setTimeout(function() {
                if (isInsideRoomSession()) {
                    checkAndUpdatePresence();
                    return;
                }
                clearPresenceObserver();
                lastRoomName = null;
                lastRoomLink = null;
                cachedRoomInviteLink = '';
                linkSharingSetup = false;
                setOfflinePresence();
            }, 150);
        });
        Injector.onViewLeave('game-view', function() {
            setTimeout(function() {
                if (isInsideRoomSession()) {
                    checkAndUpdatePresence();
                    return;
                }
                clearPresenceObserver();
                lastRoomName = null;
                lastRoomLink = null;
                cachedRoomInviteLink = '';
                linkSharingSetup = false;
                setOfflinePresence();
            }, 150);
        });

        // Marca offline quando fecha a página
        window.addEventListener('beforeunload', function() {
            clearPresenceObserver();
            cachedRoomInviteLink = '';
            setOfflinePresence();
        });
    }

    Injector.log('Friends system loaded');
})();
