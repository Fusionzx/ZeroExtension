(function() {
    if (!Injector.isGameFrame()) return;

    var roomListObservers = [];
    var roomRefreshInterval = null;
    var roomRetryTimer = null;
    var escFixInstalled = false;
    var refreshActionBarsScheduled = null;
    var localProfileMenuTarget = null;
    var localProfileMenuCleanup = null;
    var lastHoveredPlayerItem = null;
    var hxdHostDockTimer = null;
    var hxdHostDockResizeBound = false;
    var hostHotkeysInstalled = false;
    var hostBtnDomObserver = null;
    var cachedHostStartBtn = null;
    var cachedHostStopBtn = null;
    /** True si en esta sesión vimos start/stop en el DOM. */
    var hxdHostMatchSession = false;
    /** True si en algún momento hubo sala con permisos de admin (host suele serlo en el lobby). */
    var hxdWasAdminInRoom = false;

    function getLocalPlayerId() {
        return window.__myLocalPlayerId;
    }

    function getGameLocalPlayerId() {
        var a = window.__haxLocalPlayerId;
        if (a != null && a !== '' && !isNaN(parseInt(a, 10))) {
            return parseInt(a, 10);
        }
        var b = getLocalPlayerId();
        if (b != null && !isNaN(parseInt(b, 10))) {
            return parseInt(b, 10);
        }
        return null;
    }

    /** Solo true si el propio cliente del juego marcó anfitrión (sin heurísticas DOM: evita falsos positivos). */
    function isRoomAdmin() {
        if (!document.querySelector('.room-view') && !document.querySelector('.game-view')) return false;
        try {
            if (document.querySelector('.room-view.admin')) return true;
        } catch (eA) {}
        try {
            return window.__haxRoomAdmin === true;
        } catch (e) {
            return false;
        }
    }

    function findNativeRoomButton(hook) {
        var sel = 'button[data-hook="' + hook + '"]';
        var scoped = document.querySelector('.room-view ' + sel);
        if (scoped) return scoped;
        var gv = document.querySelector('.game-view');
        if (gv) {
            var inGame = gv.querySelector(sel);
            if (inGame) return inGame;
        }
        return document.querySelector(sel);
    }

    function refreshHostMatchButtonCache() {
        var s = findNativeRoomButton('start-btn');
        var t = findNativeRoomButton('stop-btn');
        if (s) {
            cachedHostStartBtn = s;
            hxdHostMatchSession = true;
        }
        if (t) {
            cachedHostStopBtn = t;
            hxdHostMatchSession = true;
        }
    }

    function clearHostMatchButtonCache() {
        cachedHostStartBtn = null;
        cachedHostStopBtn = null;
        hxdHostMatchSession = false;
        hxdWasAdminInRoom = false;
        try {
            delete window.__haxRoomAdmin;
        } catch (e) {}
    }

    function hasHostMatchControls() {
        refreshHostMatchButtonCache();
        if (!isRoomAdmin()) return false;
        hxdWasAdminInRoom = true;
        // Admin: dock siempre en partida; los nativos pueden estar solo dentro del panel (Escape)
        return true;
    }

    /** Ancla para posición del dock: chat o, si falla, barra inferior del layout */
    function getHostDockLayoutAnchor() {
        var el = getGameChatboxEl();
        if (el) {
            var r0 = el.getBoundingClientRect();
            if (r0.width >= 4 && r0.height >= 4) return el;
        }
        var gv = document.querySelector('.game-view');
        if (!gv) return null;
        return gv.querySelector('.bottom-section') || gv.querySelector('.chatbox-view') || null;
    }

    /** Alinea el dock al ancho del chat; fixed al viewport para no quedar clipado por overflow del layout */
    function syncGameHostDockLayout() {
        var dock = document.querySelector('#hxd-game-host-dock');
        if (!dock) return;
        var chatHost = getHostDockLayoutAnchor();
        if (chatHost) {
            var r = chatHost.getBoundingClientRect();
            if (r.width >= 4 && r.height >= 4) {
                var gap = 4;
                dock.style.left = Math.round(r.left) + 'px';
                dock.style.width = Math.round(r.width) + 'px';
                dock.style.right = 'auto';
                dock.style.top = 'auto';
                dock.style.bottom = Math.round(window.innerHeight - r.top + gap) + 'px';
                dock.style.transform = '';
                return;
            }
        }
        dock.style.left = '50%';
        dock.style.transform = 'translateX(-50%)';
        dock.style.width = 'min(420px, calc(100vw - 24px))';
        dock.style.right = 'auto';
        dock.style.top = 'auto';
        dock.style.bottom = '12px';
    }

    function resolveHostMatchButton(hook) {
        refreshHostMatchButtonCache();
        if (hook === 'start-btn') {
            return findNativeRoomButton('start-btn') || cachedHostStartBtn;
        }
        return findNativeRoomButton('stop-btn') || cachedHostStopBtn;
    }

    function isRoomPanelOpen() {
        var gv = document.querySelector('.game-view');
        return gv && gv.classList && gv.classList.contains('showing-room-view');
    }

    function clickNativeRoomButton(hook) {
        refreshHostMatchButtonCache();
        if (!isRoomAdmin()) return false;

        function tryDirect() {
            var btn = resolveHostMatchButton(hook);
            if (btn && !btn.disabled) {
                try {
                    btn.click();
                    return true;
                } catch (ex1) {}
            }
            return false;
        }

        if (tryDirect()) return true;

        var menuBtn = document.querySelector('.game-view button[data-hook="menu"]');
        if (!menuBtn) return false;

        var wasOpen = isRoomPanelOpen();
        if (!wasOpen) {
            menuBtn.click();
        }

        var attempts = 0;
        function afterOpen() {
            attempts++;
            refreshHostMatchButtonCache();
            var btn = findNativeRoomButton(hook) || (hook === 'start-btn' ? cachedHostStartBtn : cachedHostStopBtn);
            if (btn && !btn.disabled) {
                try {
                    btn.click();
                } catch (ex2) {}
                if (!wasOpen && isRoomPanelOpen()) {
                    setTimeout(function() {
                        menuBtn.click();
                    }, 100);
                }
                return;
            }
            if (attempts < 12) {
                setTimeout(afterOpen, 45);
            } else if (!wasOpen && isRoomPanelOpen()) {
                menuBtn.click();
            }
        }

        setTimeout(afterOpen, wasOpen ? 0 : 90);
        return true;
    }

    function getPlayerItems() {
        var a = document.querySelectorAll('[class^="player-list-item"]');
        if (a && a.length) return a;
        return document.querySelectorAll('.player-list-item');
    }

    function parsePlayerId(item) {
        if (!item) return NaN;
        var raw = item.dataset && item.dataset.playerId;
        if (raw === undefined || raw === '') {
            try {
                raw = item.getAttribute('data-player-id');
            } catch (e) {}
        }
        if (raw === undefined || raw === '') return NaN;
        var n = parseInt(raw, 10);
        return isNaN(n) ? NaN : n;
    }

    function hasValidPlayerId(item) {
        return !isNaN(parsePlayerId(item));
    }

    function cleanNick(nick) {
        return nick ? String(nick).replace(/\u200B/g, '').trim() : '';
    }

    function getStoredLocalNick() {
        try {
            return cleanNick(localStorage.getItem('haxclient_my_nick') || localStorage.getItem('haxball_nick') || '');
        } catch (e) {
            return '';
        }
    }

    function isLocalPlayerItem(item) {
        if (item && item.dataset && item.dataset.haxLocalPlayer === '1') {
            return true;
        }
        var pid = parsePlayerId(item);
        var lid = getGameLocalPlayerId();
        if (!isNaN(pid) && lid != null && !isNaN(lid)) {
            return pid === lid;
        }
        var localDiscordId = window.__haxDiscordId;
        if (item.dataset && item.dataset.discordId && localDiscordId && String(item.dataset.discordId) === String(localDiscordId)) {
            return true;
        }
        var currentNick = cleanNick(getPlayerName(item));
        var runtimeNick = cleanNick(window.__haxLocalGameNick || '');
        if (runtimeNick && currentNick === runtimeNick) {
            return true;
        }
        var storedNick = getStoredLocalNick();
        if (storedNick && currentNick === storedNick) {
            return true;
        }
        return false;
    }

    function getPlayerName(item) {
        if (!item) return '';
        var nameEl = item.querySelector('[data-hook="name"]');
        if (!nameEl) return '';
        var base = nameEl.getAttribute('data-base-nick');
        if (base && String(base).trim()) return String(base).trim();
        var raw = nameEl.textContent || nameEl.innerText || '';
        return String(raw).replace(/\s+/g, ' ').trim();
    }

    function dialogLooksActive(el) {
        if (!el) return false;
        try {
            var s = window.getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') return false;
            if (parseFloat(s.opacity || '1') === 0) return false;
        } catch (e) {
            return true;
        }
        return true;
    }

    function setPingPassthrough(item, on) {
        if (!item) return;
        var ping = item.querySelector('[data-hook="ping"]');
        if (!ping) return;
        if (on) {
            if (!ping.dataset.hxdShortcutsPe) ping.dataset.hxdShortcutsPe = '1';
            ping.style.setProperty('pointer-events', 'none', 'important');
        } else if (ping.dataset.hxdShortcutsPe) {
            ping.style.removeProperty('pointer-events');
            delete ping.dataset.hxdShortcutsPe;
        }
    }

    function getMutedPlayers() {
        try {
            var raw = JSON.parse(localStorage.getItem('haxclient_muted_players') || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch (e) {
            return [];
        }
    }

    function saveMutedPlayers(list) {
        try {
            localStorage.setItem('haxclient_muted_players', JSON.stringify(list));
        } catch (e) {}
    }

    function isPlayerMuted(name) {
        if (!name) return false;
        return getMutedPlayers().indexOf(name.toLowerCase()) !== -1;
    }

    function removeActionBar(item) {
        var bar = item.querySelector('.room-action-shortcuts');
        if (bar) bar.remove();
        var kb = item.querySelector('.hxd-host-kb-actions');
        if (kb) kb.remove();
        if (item.dataset) delete item.dataset.hxdShortcutsKey;
        setPingPassthrough(item, false);
    }

    function isTargetAdmin(item) {
        if (!item) return false;
        if (item.classList && item.classList.contains('admin')) return true;

        var nameEl = item.querySelector('[data-hook="name"]');
        if (!nameEl) return false;

        var target = nameEl.querySelector('.nick-gradient') || nameEl;
        var color = '';
        try {
            color = window.getComputedStyle(target).color || '';
        } catch (e) {}

        return color.indexOf('231, 185, 14') !== -1 ||
            color.indexOf('184, 134, 11') !== -1 ||
            color.indexOf('255, 215, 0') !== -1;
    }

    function setAdminButtonState(btn, isActive) {
        if (!btn) return;
        btn.dataset.activeAdmin = isActive ? 'true' : 'false';
        if (isActive) {
            btn.title = 'Remove Admin';
            btn.style.borderColor = 'rgba(248,113,113,.30)';
            btn.style.background = 'rgba(127,29,29,.18)';
            btn.style.color = '#fecaca';
        } else {
            btn.title = 'Give Admin';
            btn.style.borderColor = 'rgba(255,255,255,.16)';
            btn.style.background = 'rgba(255,255,255,.04)';
            btn.style.color = '#d1d5db';
        }
    }

    function setMuteButtonState(btn, isMuted) {
        if (!btn) return;
        btn.dataset.muted = isMuted ? 'true' : 'false';
        btn.title = isMuted ? 'Unmute Chat' : 'Mute Chat';
        btn.style.borderColor = isMuted ? 'rgba(248,113,113,.24)' : 'rgba(255,255,255,.14)';
        btn.style.background = isMuted ? 'rgba(127,29,29,.16)' : 'rgba(255,255,255,.03)';
        btn.style.color = isMuted ? '#fecaca' : '#cbd5e1';
        btn.innerHTML = isMuted
            ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10"/><line x1="22" y1="2" x2="11" y2="13"/><line x1="11" y1="2" x2="22" y2="13"/></svg>'
            : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    }

    function createActionButton(label, tone, onClick) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.draggable = false;
        btn.textContent = label;
        btn.className = 'room-action-btn room-action-btn-' + tone;
        btn.style.cssText = [
            'width:18px',
            'height:18px',
            'padding:0',
            'display:inline-flex',
            'align-items:center',
            'justify-content:center',
            'border-radius:4px',
            'border:1px solid rgba(255,255,255,.12)',
            'background:rgba(255,255,255,.04)',
            'color:#f3f4f6',
            'font-size:9px',
            'font-weight:700',
            'line-height:1',
            'cursor:pointer',
            'box-sizing:border-box',
            'transition:all .12s ease'
        ].join(';');

        if (tone === 'kick') {
            btn.style.borderColor = 'rgba(251,191,36,.22)';
            btn.style.color = '#fde68a';
        } else if (tone === 'ban') {
            btn.style.borderColor = 'rgba(248,113,113,.24)';
            btn.style.color = '#fecaca';
        } else if (tone === 'admin') {
            setAdminButtonState(btn, false);
        } else if (tone === 'mute') {
            setMuteButtonState(btn, false);
        }

        btn.onmouseenter = function() {
            if (tone === 'admin' && btn.dataset.activeAdmin === 'true') {
                btn.style.background = 'rgba(127,29,29,.28)';
            } else if (tone === 'mute' && btn.dataset.muted === 'true') {
                btn.style.background = 'rgba(127,29,29,.24)';
            } else {
                btn.style.background = 'rgba(255,255,255,.09)';
            }
            btn.style.transform = 'translateY(-1px)';
        };
        btn.onmouseleave = function() {
            if (tone === 'admin') {
                setAdminButtonState(btn, btn.dataset.activeAdmin === 'true');
            } else if (tone === 'mute') {
                setMuteButtonState(btn, btn.dataset.muted === 'true');
            } else {
                btn.style.background = 'rgba(255,255,255,.04)';
            }
            btn.style.transform = 'translateY(0)';
        };
        function runClick(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            }
            onClick();
        }
        var handledPointerDownAt = 0;
        btn.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            handledPointerDownAt = Date.now();
            runClick(e);
        }, true);
        btn.addEventListener('click', function(e) {
            if (Date.now() - handledPointerDownAt < 400) {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                return;
            }
            runClick(e);
        }, true);
        btn.addEventListener('dragstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);
        return btn;
    }

    function waitForElement(getter, timeoutMs, callback) {
        var startedAt = Date.now();
        (function poll() {
            var element = getter();
            if (element) {
                callback(element);
                return;
            }
            if (Date.now() - startedAt >= timeoutMs) {
                callback(null);
                return;
            }
            setTimeout(poll, 25);
        })();
    }

    function getPlayerMenuDialog() {
        var dialogs = document.querySelectorAll('.dialog');
        var last = null;
        for (var i = dialogs.length - 1; i >= 0; i--) {
            var d = dialogs[i];
            if (!d.querySelector('[data-hook="admin"]') || !d.querySelector('[data-hook="kick"]')) continue;
            if (d.classList && d.classList.contains('kick-player-view')) continue;
            if (!dialogLooksActive(d)) continue;
            last = d;
            break;
        }
        return last;
    }

    function getKickDialog() {
        return document.querySelector('.dialog.kick-player-view');
    }

    function closeDialog(dialog) {
        if (!dialog) return;
        var closeBtn = dialog.querySelector('[data-hook="close"]');
        if (closeBtn) closeBtn.click();
    }

    function closePlayerMenuIfOpen() {
        closeDialog(getPlayerMenuDialog());
    }

    function restoreOriginalPlayerContextMenu(item) {
        if (!item) return;
        if (Object.prototype.hasOwnProperty.call(item, '__hxdOriginalContextMenu')) {
            item.oncontextmenu = item.__hxdOriginalContextMenu;
            delete item.__hxdOriginalContextMenu;
        }
        if (item.dataset) {
            delete item.dataset.hxdLocalProfileContextMenu;
        }
    }

    function clearCustomProfileMenu() {
        if (typeof localProfileMenuCleanup === 'function') {
            localProfileMenuCleanup();
        }
        localProfileMenuCleanup = null;
        var existing = document.getElementById('hax-local-profile-menu');
        if (existing) existing.remove();
    }

    function customizePlayerMenu(dialog, localOnlyMode) {
        if (!dialog) return;

        if (!localOnlyMode) return;

        var hooksToHide = ['admin', 'kick', 'close'];
        for (var i = 0; i < hooksToHide.length; i++) {
            var el = dialog.querySelector('[data-hook="' + hooksToHide[i] + '"]');
            if (el) {
                el.style.display = 'none';
            }
        }
    }

    function getPlayerItemFromTarget(target) {
        if (!target) return null;
        if (target.closest) {
            return target.closest('[class^="player-list-item"]') || target.closest('.player-list-item');
        }

        var current = target;
        while (current && current !== document.body) {
            if (current.className && String(current.className).indexOf('player-list-item') !== -1) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    function openNativePlayerMenu(item) {
        if (!item) return;
        if (typeof item.__haxOpenMenu === 'function') {
            item.__haxOpenMenu();
            return;
        }
        var rect = item.getBoundingClientRect();
        var cx = Math.round(rect.left + Math.min(20, Math.max(4, rect.width * 0.2)));
        var cy = Math.round(rect.top + rect.height / 2);
        var ev = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            clientX: cx,
            clientY: cy,
            screenX: cx,
            screenY: cy,
            button: 2,
            buttons: 2
        });
        var nativeHandler = item.__hxdOriginalContextMenu || item.oncontextmenu;
        if (typeof nativeHandler === 'function') {
            nativeHandler.call(item, ev);
        } else {
            item.dispatchEvent(ev);
        }
    }

    function installLocalProfileContextMenu(item) {
        if (!item || !item.dataset) return;
        if (item.dataset.hxdLocalProfileContextMenu === '1') return;

        item.__hxdOriginalContextMenu = item.oncontextmenu || null;
        item.dataset.hxdLocalProfileContextMenu = '1';
        item.oncontextmenu = function(e) {
            localProfileMenuTarget = item;
            clearCustomProfileMenu();

            if (typeof item.__hxdOriginalContextMenu === 'function') {
                item.__hxdOriginalContextMenu.call(item, e);
            }

            waitForElement(getPlayerMenuDialog, 700, function(menu) {
                if (localProfileMenuTarget !== item) return;
                if (menu) {
                    customizePlayerMenu(menu, false);
                }
            });

            return false;
        };
    }

    function runPlayerAction(item, action) {
        if (!isRoomAdmin()) return;

        function tryMenu(attempt) {
            closePlayerMenuIfOpen();
            requestAnimationFrame(function() {
                openNativePlayerMenu(item);
                waitForElement(getPlayerMenuDialog, 1100, function(menu) {
                    if (!menu && attempt > 0) {
                        setTimeout(function() { tryMenu(attempt - 1); }, 140);
                        return;
                    }
                    if (!menu) return;

                    if (action === 'admin') {
                        var adminBtn = menu.querySelector('[data-hook="admin"]');
                        if (adminBtn && !adminBtn.disabled) {
                            adminBtn.click();
                        }
                        setTimeout(refreshActionBars, 120);
                        setTimeout(function() { closeDialog(menu); }, 80);
                        return;
                    }

                    var kickBtn = menu.querySelector('[data-hook="kick"]');
                    if (!kickBtn || kickBtn.disabled) {
                        closeDialog(menu);
                        return;
                    }
                    kickBtn.click();

                    waitForElement(getKickDialog, 900, function(kickDialog) {
                        if (!kickDialog) return;

                        if (action === 'ban') {
                            var banBtn = kickDialog.querySelector('[data-hook="ban-btn"]');
                            if (banBtn) banBtn.click();
                        }

                        var confirmKickBtn = kickDialog.querySelector('[data-hook="kick"]');
                        if (confirmKickBtn && !confirmKickBtn.disabled) {
                            confirmKickBtn.click();
                        } else {
                            closeDialog(kickDialog);
                        }
                    });
                });
            });
        }

        tryMenu(2);
    }

    function installHostAdminHotkeys() {
        if (hostHotkeysInstalled) return;
        hostHotkeysInstalled = true;

        document.addEventListener('mouseover', function(e) {
            try {
                var it = getPlayerItemFromTarget(e.target);
                if (it && hasValidPlayerId(it)) {
                    lastHoveredPlayerItem = it;
                }
            } catch (exH) {}
        }, true);

        document.addEventListener('keydown', function(e) {
            if (e.altKey || e.metaKey) return;
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            if (!document.querySelector('.game-view') && !document.querySelector('.room-view')) return;

            var c = e.code;

            if (!e.ctrlKey && !e.shiftKey && (c === 'KeyK' || c === 'KeyB')) {
                if (!isRoomAdmin()) return;
                if (!lastHoveredPlayerItem || isLocalPlayerItem(lastHoveredPlayerItem)) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                runPlayerAction(lastHoveredPlayerItem, c === 'KeyK' ? 'kick' : 'ban');
                return;
            }

            if (!e.ctrlKey || !e.shiftKey) return;

            var c2 = e.code;
            if (c2 === 'KeyE' || c2 === 'KeyX') {
                if (!hasHostMatchControls()) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                clickNativeRoomButton(c2 === 'KeyE' ? 'start-btn' : 'stop-btn');
                return;
            }
            if (c2 === 'KeyK' || c2 === 'KeyB') {
                if (!isRoomAdmin()) return;
                if (!lastHoveredPlayerItem || isLocalPlayerItem(lastHoveredPlayerItem)) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                runPlayerAction(lastHoveredPlayerItem, c2 === 'KeyK' ? 'kick' : 'ban');
            }
        }, true);
    }

    function toggleMutePlayer(item, btn) {
        var playerName = getPlayerName(item);
        if (!playerName) return;

        var muted = getMutedPlayers();
        var key = playerName.toLowerCase();
        var idx = muted.indexOf(key);
        if (idx === -1) {
            muted.push(key);
            setMuteButtonState(btn, true);
        } else {
            muted.splice(idx, 1);
            setMuteButtonState(btn, false);
        }
        saveMutedPlayers(muted);
    }

    function ensureActionBar(item) {
        if (!item || !item.dataset) return;

        var nameEl = item.querySelector('[data-hook="name"]');
        var validPlayer = hasValidPlayerId(item);
        var localPlayer = isLocalPlayerItem(item);
        var roomAdmin = isRoomAdmin();
        var nextKey = [
            validPlayer ? 'v1' : 'v0',
            localPlayer ? 'l1' : 'l0',
            roomAdmin ? 'a1' : 'a0',
            getPlayerName(item)
        ].join('|');

        if (item.dataset.hxdShortcutsKey === nextKey) {
            var existingMute = item.querySelector('.room-mute-shortcut');
            if (existingMute) {
                setMuteButtonState(existingMute, isPlayerMuted(getPlayerName(item)));
            }
            return;
        }

        removeActionBar(item);
        item.dataset.hxdShortcutsKey = nextKey;

        restoreOriginalPlayerContextMenu(item);

        if (nameEl && validPlayer && !localPlayer && !item.querySelector('.room-mute-shortcut')) {
            var muteBtn = createActionButton('', 'mute', function() {
                toggleMutePlayer(item, muteBtn);
            });
            muteBtn.className += ' room-mute-shortcut';
            muteBtn.style.marginRight = '6px';
            muteBtn.style.flexShrink = '0';
            setMuteButtonState(muteBtn, isPlayerMuted(getPlayerName(item)));
            item.insertBefore(muteBtn, nameEl);
        }

        if (roomAdmin && nameEl && validPlayer && !localPlayer && nameEl.parentNode) {
            var wrap = document.createElement('span');
            wrap.className = 'hxd-host-kb-actions';
            wrap.style.cssText = 'display:inline-flex;gap:3px;align-items:center;margin-left:6px;vertical-align:middle;flex-shrink:0;';
            var kickB = createActionButton('K', 'kick', function() {
                runPlayerAction(item, 'kick');
            });
            var banB = createActionButton('B', 'ban', function() {
                runPlayerAction(item, 'ban');
            });
            kickB.title =
                (window.__t && window.__t('Kick btn tooltip')) ||
                'Expulsar · tecla K (o Ctrl+Shift+K). Pasá el mouse por el jugador.';
            banB.title =
                (window.__t && window.__t('Ban btn tooltip')) ||
                'Banear · tecla B (o Ctrl+Shift+B). Pasá el mouse por el jugador.';
            wrap.appendChild(kickB);
            wrap.appendChild(banB);
            var par = nameEl.parentNode;
            if (nameEl.nextSibling) {
                par.insertBefore(wrap, nameEl.nextSibling);
            } else {
                par.appendChild(wrap);
            }
        }
    }

    function refreshActionBars() {
        if (isRoomAdmin()) {
            hxdWasAdminInRoom = true;
        }
        var items = getPlayerItems();
        for (var i = 0; i < items.length; i++) {
            ensureActionBar(items[i]);
            var muteBtn = items[i].querySelector('.room-mute-shortcut');
            if (muteBtn) {
                setMuteButtonState(muteBtn, isPlayerMuted(getPlayerName(items[i])));
            }
        }
    }

    function scheduleRefreshActionBars() {
        if (refreshActionBarsScheduled !== null) return;
        refreshActionBarsScheduled = setTimeout(function() {
            refreshActionBarsScheduled = null;
            try {
                refreshActionBars();
            } catch (e) {}
        }, 48);
    }

    function cleanupActionBars() {
        var items = getPlayerItems();
        for (var i = 0; i < items.length; i++) {
            restoreOriginalPlayerContextMenu(items[i]);
            removeActionBar(items[i]);
            var muteBtn = items[i].querySelector('.room-mute-shortcut');
            if (muteBtn) muteBtn.remove();
            items[i].style.removeProperty('padding-right');
            items[i].style.removeProperty('position');
            items[i].style.removeProperty('overflow');
        }
    }

    function stopRoomListTracking() {
        if (refreshActionBarsScheduled !== null) {
            clearTimeout(refreshActionBarsScheduled);
            refreshActionBarsScheduled = null;
        }
        if (roomRetryTimer) {
            clearTimeout(roomRetryTimer);
            roomRetryTimer = null;
        }
        if (roomRefreshInterval) {
            clearInterval(roomRefreshInterval);
            roomRefreshInterval = null;
        }
        for (var i = 0; i < roomListObservers.length; i++) {
            roomListObservers[i].disconnect();
        }
        roomListObservers = [];
        cleanupActionBars();
    }

    function scheduleRoomListRetry() {
        if (roomRetryTimer) return;
        roomRetryTimer = setTimeout(function() {
            roomRetryTimer = null;
            observeRoomLists();
        }, 250);
    }

    /**
     * Contenedor del chat en partida. El juego hace replaceWith(chatbox, chatbox-view),
     * así que [data-hook="chatbox"] desaparece del DOM y hay que usar .chatbox-view.
     */
    function getGameChatboxEl() {
        var gv = document.querySelector('.game-view');
        if (!gv) return null;
        var hook = gv.querySelector('[data-hook="chatbox"]');
        if (hook) return hook;
        return gv.querySelector('.chatbox-view');
    }

    function getScoreboardBarEl() {
        return document.querySelector('.game-state-view .bar-container .bar') ||
            document.querySelector('.game-state-view .bar');
    }

    function removeGameHostDock() {
        var strayDock = document.querySelector('#hxd-game-host-dock');
        if (strayDock) strayDock.remove();

        var host = getGameChatboxEl();
        if (host) {
            if (host.dataset.hxdHostDockPatched === '1') {
                host.style.display = '';
                host.style.flexDirection = '';
                host.style.alignItems = '';
                host.style.gap = '';
                host.style.position = '';
                delete host.dataset.hxdHostDockPatched;
            }
            var Lc = host.querySelector('#hxd-chat-host-left');
            var Rc = host.querySelector('#hxd-chat-host-right');
            if (Lc) Lc.remove();
            if (Rc) Rc.remove();
            if (host.dataset.hxdHostChatPatched === '1') {
                host.style.display = '';
                host.style.flexDirection = '';
                host.style.alignItems = '';
                host.style.gap = '';
                host.style.flexWrap = '';
                host.style.flex = '';
                host.style.minWidth = '';
                delete host.dataset.hxdHostChatPatched;
            }
            var cv = host.querySelector('.chatbox-view');
            if (cv) {
                cv.style.flex = '';
                cv.style.minWidth = '';
                cv.style.minHeight = '';
            }
        }
        var bar = getScoreboardBarEl();
        if (bar) {
            var Ls = bar.querySelector('#hxd-scoreboard-host-left');
            var Rs = bar.querySelector('#hxd-scoreboard-host-right');
            if (Ls) Ls.remove();
            if (Rs) Rs.remove();
            if (bar.dataset.hxdScorebarPatched === '1') {
                bar.style.display = '';
                bar.style.alignItems = '';
                bar.style.gap = '';
                bar.style.flexWrap = '';
                delete bar.dataset.hxdScorebarPatched;
            }
        }
    }

    function makeHostMatchButton(glyph, label, title, hook) {
        var b = document.createElement('button');
        b.type = 'button';
        b.title = title;
        b.setAttribute('data-hxd-host-ctl', hook);
        b.className = 'hxd-host-match-btn';
        b.style.cssText = [
            'position:relative',
            'z-index:1',
            'flex-shrink:0',
            'display:inline-flex',
            'align-items:center',
            'justify-content:center',
            'font-weight:600',
            'letter-spacing:0.02em',
            'border:1px solid rgba(255,255,255,.16)',
            'background:rgba(18,22,26,.88)',
            'color:#eceff1',
            'cursor:pointer',
            'backdrop-filter:blur(8px)',
            '-webkit-backdrop-filter:blur(8px)',
            'box-sizing:border-box',
            'pointer-events:auto',
            'transition:background .12s ease,border-color .12s ease',
            'min-width:96px',
            'height:30px',
            'padding:0 10px',
            'font-size:11px',
            'gap:5px',
            'border-radius:7px'
        ].join(';');
        var glyphIsIcon = typeof glyph === 'string' && glyph.indexOf('icon-') === 0;
        var em = glyphIsIcon ? document.createElement('i') : document.createElement('span');
        if (glyphIsIcon) {
            em.className = glyph;
        } else {
            em.textContent = glyph;
        }
        em.setAttribute('aria-hidden', 'true');
        em.style.cssText = glyphIsIcon
            ? 'font-size:13px;line-height:1'
            : 'font-size:14px;line-height:1;display:inline-flex;';
        var tx = document.createElement('span');
        tx.textContent = label;
        b.appendChild(em);
        b.appendChild(tx);
        b.onmouseenter = function() {
            if (b.disabled) return;
            b.style.background = 'rgba(38,44,52,.92)';
            b.style.borderColor = 'rgba(255,255,255,.24)';
        };
        b.onmouseleave = function() {
            if (b.disabled) return;
            b.style.background = 'rgba(18,22,26,.88)';
            b.style.borderColor = 'rgba(255,255,255,.16)';
        };
        b.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            clickNativeRoomButton(hook);
        }, false);
        return b;
    }

    function syncHostMatchButtons() {
        if (!document.querySelector('.game-view')) return;
        var dock = document.getElementById('hxd-game-host-dock');
        if (!dock) return;
        var stopB = dock.querySelector('[data-hxd-host-ctl="stop-btn"]');
        var startB = dock.querySelector('[data-hxd-host-ctl="start-btn"]');
        if (!stopB || !startB) return;
        var nStop = resolveHostMatchButton('stop-btn');
        var nStart = resolveHostMatchButton('start-btn');
        stopB.disabled = nStop ? !!nStop.disabled : false;
        startB.disabled = nStart ? !!nStart.disabled : false;
        stopB.style.opacity = stopB.disabled ? '0.38' : '1';
        stopB.style.cursor = stopB.disabled ? 'default' : 'pointer';
        startB.style.opacity = startB.disabled ? '0.38' : '1';
        startB.style.cursor = startB.disabled ? 'default' : 'pointer';
    }

    /** Terminar + Empezar: hijo de document.body para que fixed no quede roto por transform/overflow del .game-view */
    function mountGameHostDock() {
        if (!document.querySelector('.game-view')) return;

        var dock = document.getElementById('hxd-game-host-dock');
        if (dock) {
            if (dock.parentNode !== document.body) {
                document.body.appendChild(dock);
            }
            syncGameHostDockLayout();
            syncHostMatchButtons();
            return;
        }

        dock = document.createElement('div');
        dock.id = 'hxd-game-host-dock';
        dock.setAttribute('data-hxd-host-dock', '1');
        dock.setAttribute('aria-label', 'Controles de anfitrión');
        dock.appendChild(makeHostMatchButton('icon-pause', 'Terminar', 'Terminar partido · Ctrl+Shift+X', 'stop-btn'));
        dock.appendChild(makeHostMatchButton('icon-play', 'Empezar', 'Empezar partido · Ctrl+Shift+E', 'start-btn'));
        document.body.appendChild(dock);
        syncGameHostDockLayout();
        syncHostMatchButtons();
        requestAnimationFrame(function() {
            syncGameHostDockLayout();
            syncHostMatchButtons();
        });
    }

    function tickGameHostDock() {
        if (!document.querySelector('.game-view')) {
            endGameHostDockTracking();
            return;
        }
        refreshHostMatchButtonCache();
        if (!hasHostMatchControls()) {
            removeGameHostDock();
            return;
        }
        mountGameHostDock();
    }

    function beginGameHostDockTracking() {
        // Los controles nativos de sala ya existen; mantenemos solo los hotkeys Ctrl+Shift+E/X.
        removeGameHostDock();
    }

    function endGameHostDockTracking() {
        if (hxdHostDockTimer) {
            clearInterval(hxdHostDockTimer);
            hxdHostDockTimer = null;
        }
        if (hostBtnDomObserver) {
            try {
                hostBtnDomObserver.disconnect();
            } catch (exObs) {}
            hostBtnDomObserver = null;
        }
        removeGameHostDock();
        clearHostMatchButtonCache();
    }

    function ensureHostStartStopDomObserver() {
        if (hostBtnDomObserver) return;
        hostBtnDomObserver = new MutationObserver(function() {
            refreshHostMatchButtonCache();
        });
        try {
            hostBtnDomObserver.observe(document.documentElement, { childList: true, subtree: true });
        } catch (exOb2) {}
    }

    function observeRoomLists() {
        if (!document.querySelector('.room-view') && !document.querySelector('.game-view')) {
            stopRoomListTracking();
            return;
        }

        var listRoots = document.querySelectorAll('.player-list-view .list[data-hook="list"]');
        if (!listRoots.length) {
            listRoots = document.querySelectorAll('.room-view .list[data-hook="list"], .game-view .list[data-hook="list"]');
        }
        if (!listRoots.length) {
            scheduleRoomListRetry();
            return;
        }

        scheduleRefreshActionBars();

        for (var i = 0; i < roomListObservers.length; i++) {
            roomListObservers[i].disconnect();
        }
        roomListObservers = [];

        for (var j = 0; j < listRoots.length; j++) {
            var observer = new MutationObserver(function() {
                scheduleRefreshActionBars();
            });
            // Sin attributes: injectar botones cambia el DOM hijo y con subtree+síncrono reentraba en bucle.
            observer.observe(listRoots[j], { childList: true });
            roomListObservers.push(observer);
        }

        if (!roomRefreshInterval) {
            roomRefreshInterval = setInterval(function() {
                if (!document.querySelector('.room-view') && !document.querySelector('.game-view')) {
                    stopRoomListTracking();
                    return;
                }
                scheduleRefreshActionBars();
            }, 1500);
        }
    }

    function installSafeEscapeHandler() {
        if (escFixInstalled) return;
        escFixInstalled = true;

        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Escape') return;
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            if (!document.querySelector('.game-view')) return;
            if (document.querySelector('.dialog')) return;

            var menuBtn = document.querySelector('.game-view button[data-hook="menu"]');
            if (!menuBtn) return;

            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            menuBtn.click();
        }, true);
    }

    function installPlayerContextMenuGuard() {
        return;
    }

    Injector.onView('room-view', function() {
        observeRoomLists();
    });
    Injector.onViewLeave('room-view', function() {
        stopRoomListTracking();
    });

    Injector.onView('game-view', function() {
        beginGameHostDockTracking();
        observeRoomLists();
    });
    Injector.onViewLeave('game-view', function() {
        endGameHostDockTracking();
    });

    installHostAdminHotkeys();
    installSafeEscapeHandler();
    installPlayerContextMenuGuard();
    observeRoomLists();

    if (document.querySelector('.game-view')) {
        beginGameHostDockTracking();
        observeRoomLists();
    }

    setInterval(function() {
        try {
            if (!document.querySelector('.game-view')) return;
            if (!hxdHostDockTimer) {
                beginGameHostDockTracking();
            }
        } catch (exGameDockPoll) {}
    }, 2000);

    // Si Injector._initViewObserver falló (p.ej. bug del selector antiguo), recuperar al enganchar listas
    setInterval(function() {
        try {
            if (!document.querySelector('.room-view') && !document.querySelector('.game-view')) return;
            if (!document.querySelector('.player-list-view .list[data-hook="list"]') && !document.querySelector('.game-view .list[data-hook="list"]')) return;
            if (roomListObservers.length === 0) {
                observeRoomLists();
            }
        } catch (e) {}
    }, 2000);
})();
(function() {
    'use strict';

    function clampExtrapolation(value) {
        value = parseInt(value, 10);
        if (isNaN(value)) value = 0;
        if (value < -200) value = -200;
        if (value > 1000) value = 1000;
        return value;
    }

    function loadExtrapolationBindings() {
        var STORAGE_KEY = 'hax_extrapolation_binds';
        var LEGACY_KEY = 'hax_extrapolation_bind_key';
        var LEGACY_VALUE = 'hax_extrapolation_bind_value';
        var bindings = [];

        try {
            bindings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            bindings = [];
        }

        if (!Array.isArray(bindings)) bindings = [];

        if (!bindings.length) {
            var legacyKey = localStorage.getItem(LEGACY_KEY) || '';
            if (legacyKey) {
                bindings = [{
                    key: legacyKey,
                    value: clampExtrapolation(localStorage.getItem(LEGACY_VALUE) || '0')
                }];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
            }
        }

        return bindings.filter(function(binding) {
            return binding && binding.key;
        }).map(function(binding) {
            return {
                key: binding.key,
                value: clampExtrapolation(binding.value)
            };
        });
    }

    function applyExtrapolationValue(value) {
        var extrapolation = clampExtrapolation(value);

        localStorage.setItem('haxball_extrapolation', String(extrapolation));

        var cmdInput = document.querySelector('input[data-hook="input"]') || document.querySelector('.chatbox-view input[type="text"]');
        if (cmdInput) {
            cmdInput.value = '/extrapolation ' + extrapolation;
            var event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true });
            cmdInput.dispatchEvent(event);
        }
    }

    var CAMERA_EXTRA_STORAGE = 'hax_input_camera_extra_v2';

    function defaultCameraExtraBinds() {
        var out = [];
        var z;
        for (z = 0; z < 9; z++) out.push([]);
        return out;
    }

    function loadCameraExtraBinds() {
        try {
            var raw = localStorage.getItem(CAMERA_EXTRA_STORAGE);
            if (raw) {
                var arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length === 9) {
                    var def = defaultCameraExtraBinds();
                    for (var k = 0; k < 9; k++) {
                        var row = arr[k];
                        if (Array.isArray(row)) {
                            var seen = {};
                            var clean = [];
                            var j;
                            for (j = 0; j < row.length; j++) {
                                var code = row[j] != null ? String(row[j]) : '';
                                if (code && !seen[code]) {
                                    seen[code] = 1;
                                    clean.push(code);
                                }
                            }
                            def[k] = clean;
                        }
                    }
                    return def;
                }
            }
        } catch (e1) {}
        return defaultCameraExtraBinds();
    }

    function saveCameraExtraBinds(binds) {
        try {
            localStorage.setItem(CAMERA_EXTRA_STORAGE, JSON.stringify(binds));
        } catch (e2) {}
    }

    /** Índice de modo de cámara 0..8 → misma acción que tecla 0..8 del teclado (48+k). */
    function fireCameraMode(modeIndex) {
        if (modeIndex < 0 || modeIndex > 8) return;
        var kc = 48 + modeIndex;
        var keyChar = modeIndex === 0 ? '0' : String(modeIndex);
        var code = 'Digit' + modeIndex;
        try {
            var ev = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: keyChar,
                code: code,
                keyCode: kc,
                which: kc
            });
            document.dispatchEvent(ev);
        } catch (e3) {}
    }

    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.isTrusted && !e.ctrlKey && !e.altKey && !e.metaKey) {
            var camBinds = loadCameraExtraBinds();
            var ci;
            for (ci = 0; ci < camBinds.length; ci++) {
                var row = camBinds[ci];
                var cj;
                for (cj = 0; cj < row.length; cj++) {
                    if (e.code === row[cj]) {
                        e.preventDefault();
                        e.stopPropagation();
                        fireCameraMode(ci);
                        return;
                    }
                }
            }
        }

        var extrapolation = parseInt(localStorage.getItem('haxball_extrapolation') || '0');
        var extrapBindings = loadExtrapolationBindings();

        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
            for (var i = 0; i < extrapBindings.length; i++) {
                if (e.code === extrapBindings[i].key) {
                    e.preventDefault();
                    e.stopPropagation();
                    applyExtrapolationValue(extrapBindings[i].value);
                    return;
                }
            }
        }

        if (e.ctrlKey && e.key.toUpperCase() === 'E') {
            e.preventDefault();
            e.stopPropagation();
            extrapolation = extrapolation - 50;
            if (extrapolation < -200) extrapolation = -200;
            applyExtrapolationValue(extrapolation);
            return;
        }
        
    }, true);
    
    (function hxdSyncZeroZoomBoot() {
        try {
            if (typeof window.electronAPI === 'undefined' || typeof window.electronAPI.setZeroZoomClientEnabled !== 'function') {
                return;
            }
            // Camera zoom must not scale the surrounding application UI.
            window.electronAPI.setZeroZoomClientEnabled(false).catch(function() {});
        } catch (eBootZ) {}
    })();

    Injector.log('Shortcuts loaded');
})();
