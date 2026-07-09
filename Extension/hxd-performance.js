// ============================================
// HXD PERFORMANCE — snapshot / export / import
// Fuente única de claves de rendimiento (localStorage).
// Compatible con códigos planos del cliente antiguo (solo JSON en base64).
// ============================================
(function () {
    'use strict';
    if (typeof Injector !== 'undefined' && Injector.isMainFrame() && !Injector.isGameDocument()) return;

    /** Metadato opcional en exportaciones nuevas (clientes viejos lo ignoran al importar). */
    var META_SCHEMA = '_hxd_perf_schema';
    var META_SCHEMA_VALUE = '1';

    /**
     * Lista ordenada: primero toggles del juego, luego cliente Zero.
     * Mantener alineado con la pestaña Rendimiento y presets.
     */
    var SNAPSHOT_KEYS = [
        'simple_lines',
        'ultra_simple_lines',
        'culling_enabled',
        'viewport_culling',
        'show_avatars',
        'team_colors',
        'show_names',
        'simple_field',
        'low_quality_circles',
        'show_animations',
        'show_indicator',
        'show_player_indicator',
        'show_chat_indicator',
        'show_indicators',
        'high_priority',
        'canvas_boost_scale',
        'fps_limit',
        'resolution_scale',
        'viewmode',
        'view_mode',
        'quality_mode',
        'input_tolerance',
        'hxd_input_tolerance_unlock',
        'low_latency_canvas',
        'stretched_resolution',
        'hax_max_perf_mode',
        'hxd_background_frames',
        'hax_max_perf_snapshot',
        'hax_ping_display',
        'haxball_extrapolation',
        'hax_extrapolation_binds',
        'hax_input_camera_extra_v2',
        'hax_zoom_slot_binds',
        'hax_zoom_key_binds',
        'hax_chat_command_shortcuts',
        'hax_hide_match_status_text',
        'hideui_settings',
        'player_keys',
        'sound_main',
        'sound_chat',
        'sound_highlight',
        'sound_crowd',
        'sound_kick',
        'sound_goal',
        'sound_join',
        'sound_leave',
        'sound_volume',
        'chat_height',
        'chat_focus_height',
        'chat_opacity',
        'chat_bg_mode',
        'image_smoothing',
        'extrapolation',
        'hxd_ui_scoreboard_opacity',
        'hxd_ui_chatbox_opacity',
        'haxball-theme',
        'haxball-user-theme',
        'haxball-user-themes',
        'haxball_language',
        'hax_verified_disabled',
        'hax_zero_zoom',
        'hax_glass_ui',
        'player_indicator_name'
    ];

    var RUNTIME_DEFAULTS = {
        simple_lines: '0',
        ultra_simple_lines: '0',
        culling_enabled: '0',
        viewport_culling: '0',
        show_avatars: '1',
        team_colors: '1',
        show_names: '1',
        simple_field: '0',
        low_quality_circles: '0',
        show_animations: '1',
        show_indicator: '1',
        show_player_indicator: '1',
        show_chat_indicator: '1',
        show_indicators: '1',
        fps_limit: '0',
        resolution_scale: '1',
        viewmode: '-1',
        view_mode: '-1',
        low_latency_canvas: '0',
        team_colors: '1',
        sound_main: '1',
        sound_chat: '1',
        sound_highlight: '1',
        sound_crowd: '0',
        sound_kick: '1',
        sound_goal: '1',
        sound_join: '1',
        sound_leave: '1',
        sound_volume: '1',
        chat_height: '160',
        chat_focus_height: '140',
        chat_opacity: '0.8',
        chat_bg_mode: 'compact',
        image_smoothing: '1',
        extrapolation: '0',
        hxd_ui_scoreboard_opacity: '100',
        hxd_ui_chatbox_opacity: '100',
        hxd_background_frames: 'true'
    };

    function padBase64(s) {
        s = String(s || '').trim();
        s = s.replace(/^HXZ0[:\s-]*/i, '');
        while (s.length % 4 !== 0) s += '=';
        return s;
    }

    function collectSnapshot() {
        var out = {};
        for (var i = 0; i < SNAPSHOT_KEYS.length; i++) {
            var k = SNAPSHOT_KEYS[i];
            try {
                var v = localStorage.getItem(k);
                if (v !== null) out[k] = v;
            } catch (e) {}
        }
        return out;
    }

    function clearSnapshotKeys() {
        for (var i = 0; i < SNAPSHOT_KEYS.length; i++) {
            try {
                localStorage.removeItem(SNAPSHOT_KEYS[i]);
            } catch (e) {}
        }
    }

    function applyFlatConfig(config) {
        if (!config || typeof config !== 'object') return false;
        var applied = false;
        for (var key in config) {
            if (!Object.prototype.hasOwnProperty.call(config, key)) continue;
            if (key === META_SCHEMA) continue;
            if (SNAPSHOT_KEYS.indexOf(key) === -1) continue;
            try {
                localStorage.setItem(key, String(config[key]));
                applied = true;
            } catch (e) {}
        }
        return applied;
    }

    function buildRuntimeConfig(config, replaceKnown) {
        var out = {};
        if (replaceKnown) {
            for (var key in RUNTIME_DEFAULTS) {
                if (Object.prototype.hasOwnProperty.call(RUNTIME_DEFAULTS, key)) out[key] = RUNTIME_DEFAULTS[key];
            }
        }
        for (var cfgKey in config) {
            if (!Object.prototype.hasOwnProperty.call(config, cfgKey)) continue;
            if (cfgKey === META_SCHEMA) continue;
            if (SNAPSHOT_KEYS.indexOf(cfgKey) === -1) continue;
            out[cfgKey] = config[cfgKey];
        }
        return out;
    }

    function applyRuntimeConfig(config, replaceKnown) {
        try {
            if (typeof window.__hxdSyncAllSettingsFromStorage === 'function') {
                window.__hxdSyncAllSettingsFromStorage();
            } else if (typeof window.__hxdApplyRuntimeConfig === 'function') {
                window.__hxdApplyRuntimeConfig(buildRuntimeConfig(config, replaceKnown));
            }
        } catch (eRuntime) {}
    }

    /**
     * Codifica perfil (objeto plano). Incluye META_SCHEMA para identificar export "Zero" completos.
     */
    function encodeExport() {
        var data = collectSnapshot();
        try {
            data[META_SCHEMA] = META_SCHEMA_VALUE;
        } catch (eMeta) {}
        try {
            var json = JSON.stringify(data);
            return btoa(json).replace(/=/g, '');
        } catch (e) {
            return '';
        }
    }

    /**
     * Decodifica base64 → objeto. Acepta:
     * - JSON plano (oldclient / Zero legacy)
     * - futuro: envoltorio { v, d } si algún día se publicara (no usado en encodeExport actual)
     */
    function decodePayload(code) {
        var json = atob(padBase64(code));
        var obj = JSON.parse(json);
        if (obj && typeof obj === 'object' && obj.d && typeof obj.d === 'object' && obj.v != null) {
            return obj.d;
        }
        return obj;
    }

    /**
     * Importa código. Si replaceKnown es true (default), borra solo SNAPSHOT_KEYS y aplica payload.
     */
    function applyImport(code, options) {
        options = options || {};
        var replaceKnown = options.replaceKnown !== false;
        try {
            var config = decodePayload(code);
            if (!config || typeof config !== 'object') return false;
            if (replaceKnown) clearSnapshotKeys();
            applyFlatConfig(config);
            applyRuntimeConfig(config, replaceKnown);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Migração 1.3.0 → 2.0.1: sound_main='0' ficou stale (settings.js 1.3.0 setava como
    // otimização, game-min-original.js 2.0.1 lê localStorage direto e mantém desligado)
    try {
        if (!localStorage.getItem('hxd_migrated_201')) {
            if (localStorage.getItem('sound_main') === '0') localStorage.removeItem('sound_main');
            if (localStorage.getItem('sound_chat') === '0') localStorage.removeItem('sound_chat');
            if (localStorage.getItem('sound_highlight') === '0') localStorage.removeItem('sound_highlight');
            if (localStorage.getItem('sound_kick') === '0') localStorage.removeItem('sound_kick');
            if (localStorage.getItem('sound_goal') === '0') localStorage.removeItem('sound_goal');
            if (localStorage.getItem('sound_join') === '0') localStorage.removeItem('sound_join');
            if (localStorage.getItem('sound_leave') === '0') localStorage.removeItem('sound_leave');
            localStorage.setItem('hxd_migrated_201', '1');
        }
    } catch (eMig) {}

    window.HxdPerformance = {
        SNAPSHOT_KEYS: SNAPSHOT_KEYS.slice(),
        collectSnapshot: collectSnapshot,
        clearSnapshotKeys: clearSnapshotKeys,
        encodeExport: encodeExport,
        applyImport: applyImport
    };
})();
