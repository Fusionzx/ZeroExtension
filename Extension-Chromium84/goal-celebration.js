// Celebración de gol: texto + audio opcional por URL HTTPS.
// Quien tenga el cliente ve el cartel; el audio suena al ~60% del volumen maestro del juego.
(function() {
    if (typeof Injector !== 'undefined' && Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var ANT_VOL = 0.6;

    function cleanNick(n) {
        return String(n || '')
            .replace(/\u200B/g, '')
            .trim();
    }

    function myGameNick() {
        try {
            return cleanNick(localStorage.getItem('haxball_nick') || localStorage.getItem('haxclient_my_nick') || '');
        } catch (e) {
            return '';
        }
    }

    function getVerifiedCache() {
        try {
            return JSON.parse(localStorage.getItem('haxclient_verified_cache') || 'null') || {};
        } catch (e) {
            return {};
        }
    }

    function goalAnthemEnabledFlag(c) {
        if (!c) return false;
        var v = c.goal_anthem_enabled;
        return !!(
            v === true ||
            v === 1 ||
            v === '1' ||
            (typeof v === 'string' && v.toLowerCase() === 'true')
        );
    }

    function getLocalProGoalSlice() {
        try {
            if (typeof window !== 'undefined' && window.__proSettings && typeof window.__proSettings === 'object') {
                return window.__proSettings;
            }
        } catch (e0) {}
        try {
            var raw = localStorage.getItem('haxclient_pro_settings');
            if (raw) return JSON.parse(raw);
        } catch (e1) {}
        return null;
    }

    function getCfgFromCache(nick) {
        var cache = getVerifiedCache();
        var clean = cleanNick(nick);
        var c = cache[clean] || cache[nick] || null;
        if (!c && clean === myGameNick()) {
            var allowLocalAnthem = false;
            try {
                if (window.__proIsPro && typeof window.__proIsPro === 'function') {
                    allowLocalAnthem = !!window.__proIsPro();
                }
            } catch (eP) {}
            if (allowLocalAnthem) c = getLocalProGoalSlice();
        }
        if (!c) return null;
        return {
            enabled: goalAnthemEnabledFlag(c),
            text: c.goal_anthem_text != null ? String(c.goal_anthem_text).trim() : '',
            audioUrl: c.goal_anthem_audio_url != null ? String(c.goal_anthem_audio_url).trim() : ''
        };
    }

    function getLocalAudioDataForNick(nick) {
        if (cleanNick(nick) !== myGameNick()) return '';
        try {
            var d = localStorage.getItem(LS_GOAL_AUDIO);
            if (d && String(d).indexOf('data:audio') === 0) return String(d);
        } catch (e) {}
        return '';
    }

    function getPlayersK(roomState) {
        if (!roomState) return [];
        var k = roomState.K;
        if (k && k.length != null) return k;
        try {
            if (roomState.U && roomState.U.K && roomState.U.K.length != null) return roomState.U.K;
        } catch (eU) {}
        return [];
    }

    /**
     * Primer argumento del juego: equipo al que le entró el gol (defensa).
     * El que marcó es firstArg.Dg (oponente).
     */
    function resolveScoringTeam(firstArg) {
        if (!firstArg) return null;
        try {
            if (firstArg.Dg != null && firstArg.Dg !== firstArg) return firstArg.Dg;
        } catch (eR) {}
        return firstArg;
    }

    function pickCelebrationNick(scoringTeam, playersK) {
        if (!scoringTeam || !playersK || !playersK.length) return null;
        var onTeam = [];
        for (var i = 0; i < playersK.length; i++) {
            var p = playersK[i];
            if (!p || p.fa !== scoringTeam) continue;
            var n = cleanNick(p.D);
            if (n) onTeam.push(n);
        }
        if (!onTeam.length) return null;
        var me = myGameNick();
        var order = [];
        var j;
        if (me) {
            for (j = 0; j < onTeam.length; j++) {
                if (onTeam[j] === me) order.push(me);
            }
        }
        for (j = 0; j < onTeam.length; j++) {
            if (order.indexOf(onTeam[j]) === -1) order.push(onTeam[j]);
        }
        for (var m = 0; m < order.length; m++) {
            var nick = order[m];
            var cfg = getCfgFromCache(nick);
            if (cfg && cfg.enabled && (cfg.text || (cfg.audioUrl && cfg.audioUrl.indexOf('https://') === 0))) {
                return nick;
            }
        }
        return null;
    }

    function formatText(template, nick, scoringTeam) {
        var t = template || '';
        var teamName = scoringTeam && scoringTeam.D != null ? String(scoringTeam.D) : '';
        t = t.split('{nick}').join(nick || '');
        t = t.split('{team}').join(teamName);
        if (t.length > 20) t = t.slice(0, 20);
        return t;
    }

    function defaultGoalCaption(nick) {
        var n = cleanNick(nick) || '';
        var lang = typeof window !== 'undefined' && window.__haxLang ? String(window.__haxLang) : 'es';
        if (lang === 'pt') return n ? n.slice(0, 20) : 'GOLO';
        if (lang === 'en') return n ? n.slice(0, 20) : 'GOAL';
        return n ? n.slice(0, 20) : 'GOL';
    }

    function removeOverlay() {
        var root = document.getElementById('hxd-goal-anthem-overlay-root');
        if (root && root.parentNode) root.parentNode.removeChild(root);
        var old = document.getElementById('hxd-goal-anthem-overlay');
        if (old && old.parentNode) old.parentNode.removeChild(old);
    }

    /**
     * El "Red Scores!" del juego se dibuja EN el canvas (clase ea). Cualquier div dentro del body
     * puede quedar por debajo de capas del motor. Hijo de <html> después de <body> se pinta encima de todo el juego.
     */
    function mountOverlayNode(node) {
        try {
            document.documentElement.appendChild(node);
            return;
        } catch (eHtml) {}
        try {
            var canvases = document.getElementsByTagName('canvas');
            var best = null;
            var bestArea = 0;
            for (var i = 0; i < canvases.length; i++) {
                var c = canvases[i];
                try {
                    var r = c.getBoundingClientRect();
                    var area = r.width * r.height;
                    if (area > bestArea && r.width > 80 && r.height > 80) {
                        bestArea = area;
                        best = c;
                    }
                } catch (eC) {}
            }
            if (best && best.parentNode) {
                best.parentNode.appendChild(node);
                return;
            }
        } catch (e2) {}
        (document.body || document.documentElement).appendChild(node);
    }

    function showOverlay(text) {
        if (!text) return;
        removeOverlay();
        var root = document.createElement('div');
        root.id = 'hxd-goal-anthem-overlay-root';
        root.setAttribute(
            'style',
            'position:fixed;inset:0;margin:0;padding:0;z-index:2147483647;pointer-events:none;display:flex;align-items:flex-start;justify-content:center;box-sizing:border-box;padding-top:11vh;background:transparent;'
        );
        var w = document.createElement('div');
        w.id = 'hxd-goal-anthem-overlay';
        w.setAttribute(
            'style',
            'max-width:min(92vw,720px);pointer-events:none;text-align:center;padding:20px 32px;background:linear-gradient(180deg,rgba(12,14,22,0.97) 0%,rgba(6,8,14,0.98) 100%);border:1px solid rgba(255,255,255,0.18);color:#fafafa;font-size:clamp(18px,4.2vw,28px);font-weight:800;letter-spacing:0.03em;line-height:1.25;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 24px 64px rgba(0,0,0,0.85),0 0 0 1px rgba(0,0,0,0.4);text-shadow:0 2px 14px rgba(0,0,0,1),0 0 3px rgba(0,0,0,1);border-radius:12px;visibility:visible;opacity:1;'
        );
        w.textContent = text;
        root.appendChild(w);
        function doMount() {
            mountOverlayNode(root);
        }
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function() {
                requestAnimationFrame(doMount);
            });
        } else {
            doMount();
        }
        setTimeout(removeOverlay, 4500);
    }

    function masterVol() {
        try {
            if (typeof m !== 'undefined' && m.j && m.j.Yi && typeof m.j.Yi.v === 'function') {
                var v = Number(m.j.Yi.v());
                if (!isFinite(v)) return 1;
                return Math.max(0, Math.min(1, v));
            }
        } catch (e) {}
        return 1;
    }

    /**
     * @returns {boolean} true si ya se reprodujo audio custom y hay que omitir el goal.wav por defecto.
     */
    window.__hxdGoalCelebrationHandle = function(concededTeam, c, roomState) {
        try {
            if (!concededTeam || !roomState) return false;
            var scoringTeam = resolveScoringTeam(concededTeam);
            if (!scoringTeam) return false;
            var playersK = getPlayersK(roomState);
            if (!playersK.length) return false;
            var nick = pickCelebrationNick(scoringTeam, playersK);
            if (!nick) return false;
            var cfg = getCfgFromCache(nick);
            if (!cfg || !cfg.enabled) return false;
            var src = cfg.audioUrl && cfg.audioUrl.indexOf('https://') === 0 ? cfg.audioUrl : '';
            var line = formatText(cfg.text, nick, scoringTeam).trim();
            if (!line) line = defaultGoalCaption(nick);
            try {
                window.__hxdGoalCelebrateMuteNative = true;
                if (window.__hxdGoalCelebrateMuteTimer) {
                    clearTimeout(window.__hxdGoalCelebrateMuteTimer);
                }
                window.__hxdGoalCelebrateMuteTimer = setTimeout(function() {
                    try {
                        window.__hxdGoalCelebrateMuteNative = false;
                    } catch (eT) {}
                }, 5200);
            } catch (eMute) {}
            showOverlay(line);
            if (src) {
                var au = new Audio(src);
                au.volume = Math.min(1, ANT_VOL * masterVol());
                au.play().catch(function() {});
                return true;
            }
            return false;
        } catch (e2) {
            return false;
        }
    };
})();
