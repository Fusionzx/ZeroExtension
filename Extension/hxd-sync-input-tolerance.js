// ============================================
// HXD SYNC INPUT TOLERANCE — tolerancia HaxBall = 0 (mínimo delay permitido por el juego)
//
// Solo localStorage "input_tolerance" (0|1|2). Ya no se envía /input 0 por el chat (evitaba el
// mensaje del sistema "Tolerância de input definida para 0" en cada start/stop).
//
// Opt-out (poder usar 1 o 2): localStorage.setItem('hxd_input_tolerance_unlock','1')
// Modo Zero: localStorage.removeItem('hxd_input_tolerance_unlock')
// ============================================
(function () {
    'use strict';
    if (typeof Injector === 'undefined' || (Injector.isMainFrame() && !Injector.isGameDocument())) return;
    if (!Injector.isGameFrame()) return;

    var UNLOCK_KEY = 'hxd_input_tolerance_unlock';

    function isUnlocked() {
        try {
            return localStorage.getItem(UNLOCK_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function clampTolerance(value) {
        var v = parseInt(value, 10);
        if (isNaN(v) || v < 0) return 0;
        if (v > 2) return 2;
        return v;
    }

    function readTolerance() {
        try {
            return clampTolerance(localStorage.getItem('input_tolerance'));
        } catch (e) {
            return 0;
        }
    }

    function applyStorageZero() {
        if (isUnlocked()) return;
        try {
            localStorage.setItem('input_tolerance', '0');
        } catch (e) {}
    }

    function applyToleranceLive(value) {
        var v = clampTolerance(value);
        try {
            if (v > 0) localStorage.setItem(UNLOCK_KEY, '1');
            else localStorage.removeItem(UNLOCK_KEY);
            localStorage.setItem('input_tolerance', String(v));
        } catch (eSave) {}
        try {
            window.dispatchEvent(new Event('storage'));
        } catch (eEv) {}
        return v;
    }

    window.__hxdGetInputTolerance = readTolerance;
    window.__hxdSetInputTolerance = applyToleranceLive;

    function isBlockingNicknameOrAuthFlow() {
        try {
            if (document.querySelector('.choose-nickname-view')) return true;
            if (document.querySelector('.room-password-view')) return true;
            if (document.querySelector('.create-room-view')) return true;
            if (document.querySelector('.choose-nickname-view .dialog')) return true;
        } catch (eB) {}
        return false;
    }

    function start() {
        if (isBlockingNicknameOrAuthFlow()) return;
        applyStorageZero();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (!isBlockingNicknameOrAuthFlow()) start();
        });
    } else {
        if (!isBlockingNicknameOrAuthFlow()) start();
    }

    if (Injector.onView) {
        Injector.onView('game-view', function () {
            start();
        });
        Injector.onView('room-view', function () {
            start();
        });
    }
    if (Injector.onViewLeave) {
        Injector.onViewLeave('choose-nickname-view', function () {
            setTimeout(function () {
                if (!isBlockingNicknameOrAuthFlow()) start();
            }, 400);
        });
        Injector.onViewLeave('create-room-view', function () {
            setTimeout(function () {
                if (!isBlockingNicknameOrAuthFlow()) start();
            }, 300);
        });
        Injector.onViewLeave('room-password-view', function () {
            setTimeout(function () {
                if (!isBlockingNicknameOrAuthFlow()) start();
            }, 300);
        });
    }
})();
