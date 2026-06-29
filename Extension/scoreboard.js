// ============================================

// SCOREBOARD - Marcador en partida (réplica de scoreboard-preview.html)

// ============================================

(function () {

    if (!Injector.isGameFrame()) return;

    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;



    var THEME_VAR_KEYS = [

        '--theme-bg-primary', '--theme-bg-secondary', '--theme-bg-tertiary',

        '--theme-bg-primary-rgb', '--theme-bg-hover', '--theme-bg-selected',

        '--theme-border', '--theme-border-light',

        '--theme-text-primary', '--theme-text-secondary', '--theme-text-muted',

        '--theme-scrollbar-track', '--theme-scrollbar-thumb', '--theme-scrollbar-thumb-hover',

        '--theme-tooltip-bg', '--theme-tooltip-border', '--theme-app-background-image'

    ];



    var SVG_MENU =

        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +

            '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>' +

        '</svg>';



    var SVG_SETTINGS =

        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +

            '<circle cx="12" cy="12" r="3"/>' +

            '<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' +

        '</svg>';



    var SCORE_CHIP =

        '<div class="nav-chip score-board" role="status" aria-live="polite" aria-label="Marcador">' +

            '<div class="score-side score-side--red">' +

                '<span class="team-dot team-dot--red" aria-hidden="true"></span>' +

                '<span class="team-score" id="hxd-sb-score-red">0</span>' +

            '</div>' +

            '<span class="score-timer" id="hxd-sb-timer">00:00</span>' +

            '<div class="score-side score-side--blue">' +

                '<span class="team-score" id="hxd-sb-score-blue">0</span>' +

                '<span class="team-dot team-dot--blue" aria-hidden="true"></span>' +

            '</div>' +

        '</div>';



    var OVERTIME_BANNER = '<div class="hxd-sb-overtime" id="hxd-sb-overtime-banner" hidden>OVERTIME</div>';



    var lastPushSig = '';

    var lastScores = { red: -1, blue: -1 };

    var syncIv = null;

    var bootMo = null;

    var mounting = false;



    function buildScoreboardHtml(layout) {

        if (layout === 'integrated') {

            return (

                '<div class="hxd-sb-navbar">' +

                    '<div class="nav-left">' +

                        '<button type="button" class="nav-circle" id="hxd-sb-btn-menu" title="Menu" aria-label="Menu">' + SVG_MENU + '</button>' +

                    '</div>' +

                    '<div class="nav-center">' + SCORE_CHIP + '</div>' +

                    '<div class="nav-right">' +

                        '<button type="button" class="nav-circle" id="hxd-sb-btn-settings" title="Ajustes" aria-label="Ajustes">' + SVG_SETTINGS + '</button>' +

                    '</div>' +

                '</div>' +

                OVERTIME_BANNER

            );

        }

        return SCORE_CHIP + OVERTIME_BANNER;

    }



    function getStylesCss() {

        return (

            'html.hxd-scoreboard-active .game-state-view .bar-container,' +

            'html.hxd-scoreboard-active .game-state-view .bar{' +

                'opacity:0!important;visibility:hidden!important;pointer-events:none!important;' +

                'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important;' +

            '}' +

            'html.hxd-scoreboard-active.hxd-sb-buttons-integrated .game-view>.buttons{' +

                'opacity:0!important;visibility:hidden!important;pointer-events:none!important;' +

                'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important;' +

            '}' +

            '#hxd-scoreboard-root{' +

                '--theme-bg-primary:#141414;--theme-bg-secondary:#1a1a1a;--theme-bg-tertiary:#272727;' +

                '--theme-bg-hover:#333;--theme-border:#232323;--theme-border-light:#333;' +

                '--theme-text-primary:#fff;--team-red:#cf3c47;--team-blue:#4099ff;' +

                '--scoreboard-opacity:1;' +

                'position:fixed!important;top:8px!important;left:0!important;right:0!important;' +

                'width:fit-content!important;max-width:calc(100vw - 24px)!important;margin:0 auto!important;' +

                'transform:none!important;z-index:2147483620!important;' +

                'font-family:Inter,system-ui,sans-serif!important;-webkit-font-smoothing:antialiased;' +

                'user-select:none!important;-webkit-user-select:none!important;' +

                'opacity:var(--scoreboard-opacity)!important;transition:opacity .2s ease;' +

                'display:flex!important;flex-direction:column!important;align-items:center!important;gap:6px!important;' +

                'visibility:visible!important;' +

            '}' +

            '#hxd-scoreboard-root[hidden]{display:none!important;}' +

            '#hxd-scoreboard-root *,#hxd-scoreboard-root *::before,#hxd-scoreboard-root *::after{box-sizing:border-box;margin:0;padding:0;}' +

            '#hxd-scoreboard-root .hxd-sb-navbar{width:fit-content!important;max-width:100%!important;display:inline-flex!important;align-items:center!important;gap:10px!important;background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;pointer-events:auto!important;}' +

            '#hxd-scoreboard-root .nav-left,#hxd-scoreboard-root .nav-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}' +

            '#hxd-scoreboard-root .nav-center{display:flex;justify-content:center;flex-shrink:0;pointer-events:none;}' +

            '#hxd-scoreboard-root .nav-circle{all:unset!important;box-sizing:border-box!important;width:40px!important;height:40px!important;border-radius:50%!important;border:1px solid var(--theme-border)!important;background:var(--theme-bg-tertiary)!important;color:var(--theme-text-primary)!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:background .15s,border-color .15s,color .15s,transform .12s!important;outline:none!important;flex-shrink:0!important;pointer-events:auto!important;}' +

            '#hxd-scoreboard-root .nav-circle:hover{background:var(--theme-bg-hover);border-color:var(--theme-border-light);}' +

            '#hxd-scoreboard-root .nav-circle:active{transform:scale(.96);}' +

            '#hxd-scoreboard-root .nav-circle svg{width:18px!important;height:18px!important;display:block!important;flex-shrink:0!important;}' +

            '#hxd-scoreboard-root .nav-chip{display:inline-flex!important;align-items:stretch;background:var(--theme-bg-primary);border:1px solid var(--theme-border);border-radius:6px;overflow:hidden;}' +

            '#hxd-scoreboard-root .nav-chip.score-board{border-radius:8px;height:40px;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--theme-text-primary) 5%,transparent);}' +

            '#hxd-scoreboard-root .score-board{display:inline-flex!important;align-items:stretch;}' +

            '#hxd-scoreboard-root .score-side{display:flex;align-items:center;gap:8px;padding:0 14px;min-width:64px;height:100%;position:relative;}' +

            '#hxd-scoreboard-root .score-side--red{justify-content:flex-end;background:linear-gradient(135deg,color-mix(in srgb,var(--team-red) 24%,var(--theme-bg-primary)) 0%,color-mix(in srgb,var(--team-red) 8%,var(--theme-bg-secondary)) 100%);}' +

            '#hxd-scoreboard-root .score-side--red::after{content:"";position:absolute;right:0;top:22%;bottom:22%;width:1px;background:color-mix(in srgb,var(--theme-border-light) 65%,transparent);}' +

            '#hxd-scoreboard-root .score-side--blue{justify-content:flex-start;background:linear-gradient(225deg,color-mix(in srgb,var(--team-blue) 24%,var(--theme-bg-primary)) 0%,color-mix(in srgb,var(--team-blue) 8%,var(--theme-bg-secondary)) 100%);}' +

            '#hxd-scoreboard-root .score-side--blue::before{content:"";position:absolute;left:0;top:22%;bottom:22%;width:1px;background:color-mix(in srgb,var(--theme-border-light) 65%,transparent);}' +

            '#hxd-scoreboard-root .score-timer{display:flex;align-items:center;justify-content:center;padding:0 14px;min-width:68px;height:100%;background:var(--theme-bg-tertiary);font-size:12px;font-weight:800;letter-spacing:.1em;font-variant-numeric:tabular-nums;color:var(--theme-text-primary);white-space:nowrap;line-height:1;flex-shrink:0;transition:color .2s ease;}' +

            '#hxd-scoreboard-root .score-timer.time-warn{color:#e74c3c!important;}' +

            '#hxd-scoreboard-root .team-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}' +

            '#hxd-scoreboard-root .team-dot--red{background:var(--team-red);box-shadow:0 0 0 2px color-mix(in srgb,var(--team-red) 28%,transparent),0 0 10px color-mix(in srgb,var(--team-red) 55%,transparent);}' +

            '#hxd-scoreboard-root .team-dot--blue{background:var(--team-blue);box-shadow:0 0 0 2px color-mix(in srgb,var(--team-blue) 28%,transparent),0 0 10px color-mix(in srgb,var(--team-blue) 55%,transparent);}' +

            '#hxd-scoreboard-root .team-score{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--theme-text-primary);line-height:1;min-width:1.2ch;text-align:center;letter-spacing:-.02em;}' +

            '#hxd-scoreboard-root .team-score.pop{animation:hxd-score-pop .35s cubic-bezier(.34,1.4,.64,1);}' +

            '#hxd-scoreboard-root .hxd-sb-overtime{display:inline-flex!important;align-items:center!important;gap:7px!important;margin-top:-1px!important;padding:5px 13px 6px!important;border-radius:999px!important;background:linear-gradient(180deg,color-mix(in srgb,#e74c3c 16%,var(--theme-bg-tertiary)),color-mix(in srgb,#e74c3c 8%,var(--theme-bg-primary)))!important;border:1px solid color-mix(in srgb,#e74c3c 38%,var(--theme-border))!important;box-shadow:0 8px 22px rgba(0,0,0,.24),0 0 18px color-mix(in srgb,#e74c3c 18%,transparent),inset 0 1px 0 color-mix(in srgb,var(--theme-text-primary) 7%,transparent)!important;font-size:9px!important;font-weight:800!important;letter-spacing:.16em!important;text-transform:uppercase!important;color:#ff6872!important;text-shadow:0 0 10px color-mix(in srgb,#e74c3c 45%,transparent)!important;line-height:1!important;pointer-events:none!important;}' +
            '#hxd-scoreboard-root .hxd-sb-overtime::before{content:"";width:6px;height:6px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 0 2px color-mix(in srgb,#ff4d5a 20%,transparent),0 0 10px color-mix(in srgb,#ff4d5a 60%,transparent);}' +

            '#hxd-scoreboard-root .hxd-sb-overtime[hidden]{display:none!important;}' +

            '@keyframes hxd-score-pop{0%{transform:scale(1)}40%{transform:scale(1.2)}100%{transform:scale(1)}}'

        );

    }



    function readOldScoreboard() {

        try { return localStorage.getItem('hxd_scoreboard_old') === '1'; } catch (e) { return false; }

    }



    function readButtonsLayout() {

        try {

            return localStorage.getItem('hxd_scoreboard_buttons_layout') === 'integrated' ? 'integrated' : 'default';

        } catch (e) { return 'default'; }

    }



    function getThemeColors(doc) {

        var win = doc.defaultView || window;

        if (win.HaxThemes && typeof win.HaxThemes.getCurrent === 'function' && typeof win.HaxThemes.getThemeColors === 'function') {

            try { return win.HaxThemes.getThemeColors(win.HaxThemes.getCurrent()) || {}; } catch (e) {}

        }

        var root = doc.documentElement;

        var out = {};

        for (var i = 0; i < THEME_VAR_KEYS.length; i++) {

            var key = THEME_VAR_KEYS[i];

            var val = root.style.getPropertyValue(key);

            if (!val) {

                try { val = win.getComputedStyle(root).getPropertyValue(key); } catch (eCs) {}

            }

            val = String(val || '').trim();

            if (val) out[key] = val;

        }

        return out;

    }



    function applyThemeToRoot(root, doc) {

        if (!root) return;

        var colors = getThemeColors(doc);

        for (var i = 0; i < THEME_VAR_KEYS.length; i++) {

            var key = THEME_VAR_KEYS[i];

            if (colors[key]) root.style.setProperty(key, colors[key]);

        }

    }



    function ensureStyles(doc) {

        var style = doc.getElementById('hxd-scoreboard-styles');

        var css = getStylesCss();

        if (style) { style.textContent = css; return; }

        style = doc.createElement('style');

        style.id = 'hxd-scoreboard-styles';

        style.textContent = css;

        (doc.head || doc.documentElement).appendChild(style);

    }



    function ensureFont(doc) {

        if (doc.getElementById('hxd-scoreboard-font')) return;

        var link = doc.createElement('link');

        link.id = 'hxd-scoreboard-font';

        link.rel = 'stylesheet';

        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap';

        (doc.head || doc.documentElement).appendChild(link);

    }



    function applyLayoutClasses(doc, customActive) {

        var integrated = customActive && readButtonsLayout() === 'integrated';

        doc.documentElement.classList.toggle('hxd-sb-buttons-integrated', integrated);

    }



    function markActive(doc, on) {

        try {

            var root = doc.getElementById('hxd-scoreboard-root');

            if (on && (!root || root.hidden)) on = false;

            if (on) doc.documentElement.classList.add('hxd-scoreboard-active');

            else {

                doc.documentElement.classList.remove('hxd-scoreboard-active');

                doc.documentElement.classList.remove('hxd-sb-buttons-integrated');

            }

        } catch (e) {}

    }



    function isHiddenByUser() {

        try {

            var s = JSON.parse(localStorage.getItem('hideui_settings') || '{}');

            return !!s.hideScoreboard;

        } catch (e) { return false; }

    }



    function readOpacity() {

        try {

            var v = localStorage.getItem('hxd_ui_scoreboard_opacity');

            if (v != null && v !== '') return parseInt(v, 10);

        } catch (e) {}

        return 100;

    }



    function readGameScores(doc) {

        var gs = doc.querySelector('.game-state-view');

        if (!gs) return { red: 0, blue: 0 };

        return {

            red: parseInt(gs.querySelector('[data-hook="red-score"]') && gs.querySelector('[data-hook="red-score"]').textContent, 10) || 0,

            blue: parseInt(gs.querySelector('[data-hook="blue-score"]') && gs.querySelector('[data-hook="blue-score"]').textContent, 10) || 0

        };

    }



    function readGameTimerView(doc) {

        return doc.querySelector('.game-state-view [data-hook="timer"] .game-timer-view') ||

            doc.querySelector('.game-state-view .game-timer-view');

    }



    function readGameTimer(doc) {

        var view = readGameTimerView(doc);

        if (!view) return 0;

        var digits = view.querySelectorAll('.digit');

        if (digits.length >= 4) {

            var min = (parseInt(digits[0].textContent, 10) || 0) * 10 + (parseInt(digits[1].textContent, 10) || 0);

            var sec = (parseInt(digits[2].textContent, 10) || 0) * 10 + (parseInt(digits[3].textContent, 10) || 0);

            return min * 60 + sec;

        }

        var m = (view.textContent || '').replace(/\s+/g, '').match(/(\d{1,2}):(\d{2})/);

        return m ? (parseInt(m[1], 10) || 0) * 60 + (parseInt(m[2], 10) || 0) : 0;

    }



    function readGameTimerState(doc) {

        var view = readGameTimerView(doc);

        if (!view) return { warn: false, overtime: false };

        var ot = view.querySelector('.overtime');

        return {

            warn: view.classList.contains('time-warn'),

            overtime: !!(ot && ot.classList.contains('on'))

        };

    }



    function formatTimer(sec) {

        var s = Math.max(0, sec | 0);

        var m = Math.floor(s / 60);

        var r = s % 60;

        return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;

    }



    function popScore(el) {

        if (!el) return;

        el.classList.remove('pop');

        void el.offsetWidth;

        el.classList.add('pop');

        el.addEventListener('animationend', function onEnd() {

            el.classList.remove('pop');

            el.removeEventListener('animationend', onEnd);

        });

    }



    function pushSync(doc, force) {

        var root = doc.getElementById('hxd-scoreboard-root');

        if (!root) return;



        root.hidden = isHiddenByUser();

        applyThemeToRoot(root, doc);

        applyLayoutClasses(doc, !root.hidden);

        root.style.setProperty('--scoreboard-opacity', String(readOpacity() / 100));

        markActive(doc, !root.hidden);



        var scores = readGameScores(doc);

        var timer = readGameTimer(doc);

        var timerState = readGameTimerState(doc);

        var sig = scores.red + ':' + scores.blue + '|' + timer + '|' + readOpacity() + '|' +

            (timerState.warn ? 'w' : '') + (timerState.overtime ? 'o' : '');



        var changedTeam = null;

        if (!force && lastScores.red !== -1) {

            if (scores.red !== lastScores.red) changedTeam = 'red';

            else if (scores.blue !== lastScores.blue) changedTeam = 'blue';

        }

        lastScores = { red: scores.red, blue: scores.blue };



        if (!force && sig === lastPushSig) return;

        lastPushSig = sig;



        var redEl = doc.getElementById('hxd-sb-score-red');

        var blueEl = doc.getElementById('hxd-sb-score-blue');

        var timerEl = doc.getElementById('hxd-sb-timer');

        var otBanner = doc.getElementById('hxd-sb-overtime-banner');

        if (redEl) redEl.textContent = String(scores.red);

        if (blueEl) blueEl.textContent = String(scores.blue);

        if (timerEl) {

            timerEl.textContent = formatTimer(timer);

            timerEl.classList.toggle('time-warn', timerState.warn);

        }

        if (otBanner) otBanner.hidden = !timerState.overtime;

        if (changedTeam === 'red') popScore(redEl);

        if (changedTeam === 'blue') popScore(blueEl);

    }



    function bindTheme(doc) {

        if (doc.hxdScoreboardThemeBound) return;

        doc.hxdScoreboardThemeBound = true;

        var onTheme = function () {

            var root = doc.getElementById('hxd-scoreboard-root');

            if (root) {

                lastPushSig = '';

                pushSync(doc, true);

            }

        };

        window.addEventListener('themeChanged', onTheme);

        window.addEventListener('storage', onTheme);

    }



    function bindIntegratedButtons(doc) {

        if (doc.hxdScoreboardButtonsBound) return;

        doc.hxdScoreboardButtonsBound = true;

        doc.addEventListener('click', function (e) {

            if (readButtonsLayout() !== 'integrated') return;

            if (e.target.closest('#hxd-sb-btn-menu')) {

                var menu = doc.querySelector('.game-view button[data-hook="menu"]');

                if (menu) menu.click();

                e.preventDefault();

                e.stopPropagation();

            } else if (e.target.closest('#hxd-sb-btn-settings')) {

                var settings = doc.querySelector('.game-view button[data-hook="settings"]');

                if (settings) settings.click();

                e.preventDefault();

                e.stopPropagation();

            }

        }, true);

    }



    function startSync(doc) {

        if (syncIv) return;

        syncIv = setInterval(function () {

            if (doc.querySelector('.game-state-view')) pushSync(doc, false);

        }, 200);

    }



    function stopSync() {

        if (syncIv) { clearInterval(syncIv); syncIv = null; }

    }



    function observeGameState(doc) {

        var gs = doc.querySelector('.game-state-view');

        if (!gs || gs.hxdScoreboardObserved) return;

        gs.hxdScoreboardObserved = true;

        var mo = new MutationObserver(function () {

            lastPushSig = '';

            pushSync(doc, false);

        });

        mo.observe(gs, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });

    }



    function teardown(doc) {

        stopSync();

        mounting = false;

        lastPushSig = '';

        lastScores = { red: -1, blue: -1 };

        var root = doc.getElementById('hxd-scoreboard-root');

        if (root) root.remove();

        markActive(doc, false);

        var gs = doc.querySelector('.game-state-view');

        if (gs) gs.hxdScoreboardObserved = false;

    }



    function mountScoreboard(doc) {

        if (doc.getElementById('hxd-scoreboard-root')) return true;

        if (mounting) return false;

        if (!doc.querySelector('.game-state-view')) return false;



        mounting = true;

        ensureStyles(doc);

        ensureFont(doc);



        var layout = readButtonsLayout();

        var root = doc.createElement('div');

        root.id = 'hxd-scoreboard-root';

        root.setAttribute('data-layout', layout);

        root.innerHTML = buildScoreboardHtml(layout);



        doc.body.appendChild(root);



        markActive(doc, true);

        applyLayoutClasses(doc, true);

        observeGameState(doc);

        bindTheme(doc);

        bindIntegratedButtons(doc);

        startSync(doc);

        pushSync(doc, true);

        mounting = false;

        return true;

    }



    function ensureScoreboard(doc) {

        if (readOldScoreboard()) {

            teardown(doc);

            return;

        }

        if (!doc.querySelector('.game-state-view')) {

            teardown(doc);

            return;

        }

        ensureStyles(doc);

        var layout = readButtonsLayout();

        var root = doc.getElementById('hxd-scoreboard-root');

        if (root && root.getAttribute('data-layout') !== layout) {

            teardown(doc);

            root = null;

        }

        if (!root) {

            mountScoreboard(doc);

        } else {

            applyLayoutClasses(doc, !root.hidden);

            markActive(doc, true);

            observeGameState(doc);

            pushSync(doc, false);

        }

    }



    function bootPipeline(doc) {

        ensureStyles(doc);

        bindTheme(doc);

        bindIntegratedButtons(doc);



        var tick = function () {

            if (doc.querySelector('.game-state-view')) ensureScoreboard(doc);

            else teardown(doc);

        };



        tick();



        if (!bootMo) {

            bootMo = new MutationObserver(tick);

            bootMo.observe(doc.documentElement, { childList: true, subtree: true });

        }



        window.addEventListener('storage', function () {

            lastPushSig = '';

            tick();

        });

    }



    function init() {

        bootPipeline(document);



        Injector.onView('game-view', function () {

            ensureScoreboard(document);

        });



        Injector.onView('roomlist-view', function () {

            teardown(document);

        });



        Injector.onView('room-view', function () {

            teardown(document);

        });

    }



    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', init);

    } else {

        init();

    }

})();

