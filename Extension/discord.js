// ============================================
// LOCAL PROFILE - no Discord/auth dependency
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var LOCAL_USER_ID = 'zero-local-test';
    var userStatusReady = false;
    var isLoaded = false;

    function cleanName(value) {
        return String(value || '').replace(/\u200B/g, '').trim();
    }

    function isDefaultPlayerName(value) {
        return cleanName(value).toLowerCase() === 'player';
    }

    function clearDefaultPlayerName() {
        try {
            var keys = ['haxball_nick', 'player_name', 'haxclient_my_nick'];
            for (var i = 0; i < keys.length; i++) {
                if (isDefaultPlayerName(localStorage.getItem(keys[i]))) {
                    localStorage.removeItem(keys[i]);
                }
            }
        } catch (e) {}
    }

    function getStoredGameNick() {
        try {
            var nick = cleanName(
                localStorage.getItem('haxball_nick') ||
                localStorage.getItem('player_name') ||
                localStorage.getItem('haxclient_my_nick') ||
                ''
            );
            return isDefaultPlayerName(nick) ? '' : nick;
        } catch (e) {
            return '';
        }
    }

    function clearAnonymousFlags() {
        try {
            localStorage.removeItem('hxd_anonymous_mode');
            localStorage.removeItem('ghost_mode');
        } catch (e) {}
    }

    function getLocalUser() {
        var nick = getStoredGameNick();
        return {
            logged_in: true,
            nick: nick,
            username: nick,
            game_nick: nick,
            discord_id: LOCAL_USER_ID,
            is_verified: true,
            is_pro: true,
            is_vip: true,
            __hxd_local_user: true
        };
    }

    function publishLocalUser() {
        clearAnonymousFlags();
        var data = getLocalUser();
        window.__haxDiscordId = LOCAL_USER_ID;
        window.__hxdAvatarDiscordAllowed = true;
        window.__proStatus = { is_pro: true, is_vip: true, allpro: true };
        window.__vipStatus = { is_vip: true };
        try {
            localStorage.setItem('haxclient_user', JSON.stringify(data));
            localStorage.setItem('haxclient_pro_snapshot', JSON.stringify({
                is_pro: true,
                is_vip: true,
                allpro: true,
                at: Date.now()
            }));
        } catch (e) {}
        return data;
    }

    function storeNick(nick) {
        nick = cleanName(nick);
        if (!nick || isDefaultPlayerName(nick)) return;
        try {
            localStorage.setItem('haxball_nick', nick);
            localStorage.setItem('player_name', nick);
            localStorage.setItem('haxclient_my_nick', nick);
        } catch (e) {}
        publishLocalUser();
    }

    function bindNickDialog(doc) {
        doc = doc || document;
        var dialog = doc.querySelector('.choose-nickname-view .dialog');
        if (!dialog || dialog.dataset.hxdLocalNickBound === '1') return;
        var nickInput = dialog.querySelector('input[data-hook="input"]');
        var okBtn = dialog.querySelector('button[data-hook="ok"]');
        if (!nickInput || !okBtn) return;

        dialog.dataset.hxdLocalNickBound = '1';
        if (isDefaultPlayerName(nickInput.value)) {
            try {
                nickInput.value = '';
                nickInput.dispatchEvent(new Event('input', { bubbles: true }));
                nickInput.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (eClear) {}
        }
        var savedNick = getStoredGameNick();
        if (savedNick && !cleanName(nickInput.value)) {
            try {
                nickInput.value = savedNick;
                nickInput.dispatchEvent(new Event('input', { bubbles: true }));
                nickInput.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (eSet) {}
        }

        function sync() {
            storeNick(nickInput.value);
        }

        nickInput.addEventListener('input', sync, true);
        nickInput.addEventListener('change', sync, true);
        okBtn.addEventListener('click', sync, true);
    }

    function watchNickDialog() {
        if (!document.body) return;
        bindNickDialog(document);
        var scheduled = false;
        var observer = new MutationObserver(function(mutations) {
            if (scheduled) return;
            for (var i = 0; i < mutations.length; i++) {
                var nodes = mutations[i].addedNodes;
                for (var j = 0; j < nodes.length; j++) {
                    var node = nodes[j];
                    if (!node || node.nodeType !== 1) continue;
                    if (
                        (node.matches && node.matches('.choose-nickname-view, .choose-nickname-view *')) ||
                        (node.querySelector && node.querySelector('.choose-nickname-view'))
                    ) {
                        scheduled = true;
                        requestAnimationFrame(function() {
                            scheduled = false;
                            bindNickDialog(document);
                        });
                        return;
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function refreshLocalUser() {
        return Promise.resolve(publishLocalUser());
    }

    function init() {
        if (isLoaded) return;
        isLoaded = true;
        clearDefaultPlayerName();
        publishLocalUser();
        userStatusReady = true;
        if (document.body) watchNickDialog();
        else document.addEventListener('DOMContentLoaded', watchNickDialog);
    }

    window.HaxDiscord = {
        getNick: function() { return getStoredGameNick() || 'Zero'; },
        getId: function() { return LOCAL_USER_ID; },
        isVerified: function() { return true; },
        isGhostMode: function() { return false; },
        updatePresence: function() {},
        refresh: refreshLocalUser,
        isReady: function() { return userStatusReady; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
