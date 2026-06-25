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
        'show_avatars',
        'team_colors',
        'show_names',
        'simple_field',
        'low_quality_circles',
        'show_animations',
        'show_indicator',
        'show_chat_indicator',
        'high_priority',
        'hxd_background_frames',
        'canvas_boost_scale',
        'fps_limit',
        'resolution_scale',
        'viewmode',
        'quality_mode',
        'input_tolerance',
        'hxd_input_tolerance_unlock',
        'low_latency_canvas',
        'stretched_resolution',
        'hax_max_perf_mode',
        'hax_max_perf_snapshot',
        'hax_ping_display',
        'haxball_extrapolation',
        'hax_extrapolation_binds',
        'hax_input_camera_extra_v2',
        'hax_zoom_slot_binds',
        'hax_zoom_key_binds',
        'hax_chat_command_shortcuts',
        'hax_hide_match_status_text',
        'hideui_settings'
    ];

    function padBase64(s) {
        s = String(s || '').trim();
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
            return true;
        } catch (e) {
            return false;
        }
    }

    window.HxdPerformance = {
        SNAPSHOT_KEYS: SNAPSHOT_KEYS.slice(),
        collectSnapshot: collectSnapshot,
        clearSnapshotKeys: clearSnapshotKeys,
        encodeExport: encodeExport,
        applyImport: applyImport
    };
})();
