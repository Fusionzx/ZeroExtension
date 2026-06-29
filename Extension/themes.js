// ============================================
// THEMES - Sistema de temas (claro/escuro)
// ============================================
(function() {
    // Só executa dentro do iframe do jogo
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    // Função de tradução
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    function cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function normalizeHexColor(value, fallback) {
        value = String(value || '').trim();
        if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
        return fallback;
    }

    /** Para rgba(var(--theme-bg-primary-rgb), α) en chat / marcador (Chrome sin color-mix). */
    function hexToRgbCsv(hex, fallbackRgb) {
        hex = normalizeHexColor(hex, '');
        fallbackRgb = fallbackRgb || '20, 20, 20';
        if (!hex || hex.length !== 7) return fallbackRgb;
        try {
            var r = parseInt(hex.slice(1, 3), 16);
            var g = parseInt(hex.slice(3, 5), 16);
            var b = parseInt(hex.slice(5, 7), 16);
            if (isNaN(r) || isNaN(g) || isNaN(b)) return fallbackRgb;
            return r + ', ' + g + ', ' + b;
        } catch (eHx) {
            return fallbackRgb;
        }
    }

    function mixHexColors(colorA, colorB, weight) {
        colorA = normalizeHexColor(colorA, '#000000');
        colorB = normalizeHexColor(colorB, '#ffffff');
        weight = Math.max(0, Math.min(1, Number(weight)));

        function channel(color, index) {
            return parseInt(color.slice(index, index + 2), 16);
        }

        function toHex(value) {
            var hex = Math.round(value).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }

        var r = channel(colorA, 1) * (1 - weight) + channel(colorB, 1) * weight;
        var g = channel(colorA, 3) * (1 - weight) + channel(colorB, 3) * weight;
        var b = channel(colorA, 5) * (1 - weight) + channel(colorB, 5) * weight;
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    var CUSTOM_THEME_STORAGE_KEY = 'haxball-custom-theme-base';
    var APP_WALLPAPER_STORAGE_KEY = 'haxball-app-wallpaper';
    var DEFAULT_CUSTOM_THEME_BASE = {
        bgPrimary: '#0f1117',
        bgSecondary: '#161b24',
        bgTertiary: '#1f2937',
        border: '#334155',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        backgroundImage: ''
    };
    var customThemeBase = cloneObject(DEFAULT_CUSTOM_THEME_BASE);

    function migrateWallpaperFromLegacyIfNeeded() {
        try {
            if (localStorage.getItem(APP_WALLPAPER_STORAGE_KEY)) return;
            var raw = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
            if (!raw) return;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;
            var legacy = String(parsed.backgroundImage || '').trim();
            if (!legacy) return;
            localStorage.setItem(APP_WALLPAPER_STORAGE_KEY, legacy);
            delete parsed.backgroundImage;
            localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {}
    }

    function getAppWallpaper() {
        try {
            var v = localStorage.getItem(APP_WALLPAPER_STORAGE_KEY);
            return v ? String(v) : '';
        } catch (e) {
            return '';
        }
    }

    function setAppWallpaper(dataUrl) {
        var s = String(dataUrl || '').trim();
        try {
            if (s) {
                localStorage.setItem(APP_WALLPAPER_STORAGE_KEY, s);
            } else {
                localStorage.removeItem(APP_WALLPAPER_STORAGE_KEY);
            }
        } catch (e) {}
        applyTheme(currentTheme);
        return getAppWallpaper();
    }

    function clearAppWallpaper() {
        return setAppWallpaper('');
    }

    function buildBackgroundCssValue(value) {
        value = String(value || '').trim();
        if (!value) return 'none';
        return 'url("' + value.replace(/"/g, '\\"') + '")';
    }

    function shouldPaintWallpaper() {
        // En partida el canvas cubre la pantalla y el wallpaper solo suma composición pesada.
        // Se mantiene en lobby/settings/menús, pero se apaga dentro de game-view.
        return !document.querySelector('.game-view');
    }

    function ensureThemeBackgroundStyles() {
        if (document.getElementById('theme-custom-background-style')) return;
        var style = document.createElement('style');
        style.id = 'theme-custom-background-style';
        style.textContent =
            '/* Fondo: capa html::before + data-app-bg-image (styles.js); evita repaint costoso en el árbol raíz */';
        document.head.appendChild(style);
    }

    function buildCustomThemeColors(base) {
        base = Object.assign({}, DEFAULT_CUSTOM_THEME_BASE, base || {});
        var bgPrimary = normalizeHexColor(base.bgPrimary, DEFAULT_CUSTOM_THEME_BASE.bgPrimary);
        var bgSecondary = normalizeHexColor(base.bgSecondary, DEFAULT_CUSTOM_THEME_BASE.bgSecondary);
        var bgTertiary = normalizeHexColor(base.bgTertiary, DEFAULT_CUSTOM_THEME_BASE.bgTertiary);
        var border = normalizeHexColor(base.border, DEFAULT_CUSTOM_THEME_BASE.border);
        var textPrimary = normalizeHexColor(base.textPrimary, DEFAULT_CUSTOM_THEME_BASE.textPrimary);
        var textSecondary = normalizeHexColor(base.textSecondary, DEFAULT_CUSTOM_THEME_BASE.textSecondary);
        var backgroundImage = buildBackgroundCssValue(getAppWallpaper());
        return {
            '--theme-bg-primary': bgPrimary,
            '--theme-bg-secondary': bgSecondary,
            '--theme-bg-tertiary': bgTertiary,
            '--theme-bg-primary-rgb': hexToRgbCsv(bgPrimary, '15, 17, 23'),
            '--theme-bg-hover': mixHexColors(bgTertiary, '#ffffff', 0.08),
            '--theme-bg-selected': mixHexColors(bgSecondary, '#ffffff', 0.05),
            '--theme-border': border,
            '--theme-border-light': mixHexColors(border, '#ffffff', 0.18),
            '--theme-text-primary': textPrimary,
            '--theme-text-secondary': textSecondary,
            '--theme-text-muted': mixHexColors(textSecondary, bgPrimary, 0.35),
            '--theme-scrollbar-track': bgSecondary,
            '--theme-scrollbar-thumb': mixHexColors(border, '#ffffff', 0.05),
            '--theme-scrollbar-thumb-hover': mixHexColors(border, '#ffffff', 0.18),
            '--theme-tooltip-bg': mixHexColors(bgSecondary, '#000000', 0.08),
            '--theme-tooltip-border': mixHexColors(border, '#ffffff', 0.12),
            '--theme-app-background-image': backgroundImage
        };
    }

    function loadCustomThemeBase() {
        try {
            var saved = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
            if (!saved) return cloneObject(DEFAULT_CUSTOM_THEME_BASE);
            var parsed = JSON.parse(saved);
            if (!parsed || typeof parsed !== 'object') return cloneObject(DEFAULT_CUSTOM_THEME_BASE);
            var merged = Object.assign({}, DEFAULT_CUSTOM_THEME_BASE, parsed);
            merged.backgroundImage = '';
            return merged;
        } catch(e) {
            return cloneObject(DEFAULT_CUSTOM_THEME_BASE);
        }
    }

    function saveCustomThemeBase(base) {
        try {
            var toSave = Object.assign({}, base);
            delete toSave.backgroundImage;
            localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(toSave));
        } catch(e) {}
    }

    // Definição dos temas
    var THEMES = {
        default: {
            nameKey: 'Padrão',
            colors: {}
        },
        dark: {
            nameKey: 'Escuro',
            colors: {
                '--theme-bg-primary': '#141414',
                '--theme-bg-secondary': '#1a1a1a',
                '--theme-bg-tertiary': '#272727',
                '--theme-bg-hover': '#333',
                '--theme-bg-selected': '#222',
                '--theme-border': '#232323',
                '--theme-border-light': '#333',
                '--theme-text-primary': '#fff',
                '--theme-text-secondary': '#888',
                '--theme-text-muted': '#666',
                '--theme-scrollbar-track': '#1a1a1a',
                '--theme-scrollbar-thumb': '#555',
                '--theme-scrollbar-thumb-hover': '#666',
                '--theme-tooltip-bg': '#222',
                '--theme-tooltip-border': '#333'
            }
        },
        light: {
            nameKey: 'Claro',
            colors: {
                '--theme-bg-primary': '#f5f5f5',
                '--theme-bg-secondary': '#ffffff',
                '--theme-bg-tertiary': '#e8e8e8',
                '--theme-bg-hover': '#ddd',
                '--theme-bg-selected': '#d0d0d0',
                '--theme-border': '#ccc',
                '--theme-border-light': '#ddd',
                '--theme-text-primary': '#1a1a1a',
                '--theme-text-secondary': '#666',
                '--theme-text-muted': '#999',
                '--theme-scrollbar-track': '#f0f0f0',
                '--theme-scrollbar-thumb': '#bbb',
                '--theme-scrollbar-thumb-hover': '#999',
                '--theme-tooltip-bg': '#fff',
                '--theme-tooltip-border': '#ddd'
            }
        },
        onix: {
            nameKey: 'Onix',
            colors: {
                '--theme-bg-primary': '#000000',
                '--theme-bg-secondary': '#000000',
                '--theme-bg-tertiary': '#0a0a0a',
                '--theme-bg-hover': '#111111',
                '--theme-bg-selected': '#0d0d0d',
                '--theme-border': '#1a1a1a',
                '--theme-border-light': '#222222',
                '--theme-text-primary': '#ffffff',
                '--theme-text-secondary': '#888888',
                '--theme-text-muted': '#555555',
                '--theme-scrollbar-track': '#000000',
                '--theme-scrollbar-thumb': '#333333',
                '--theme-scrollbar-thumb-hover': '#444444',
                '--theme-tooltip-bg': '#0a0a0a',
                '--theme-tooltip-border': '#1a1a1a'
            }
        },
        graphite: {
            nameKey: 'Grafite',
            colors: {
                '--theme-bg-primary': '#111317',
                '--theme-bg-secondary': '#171a1f',
                '--theme-bg-tertiary': '#22262d',
                '--theme-bg-hover': '#2b313a',
                '--theme-bg-selected': '#20242b',
                '--theme-border': '#2a3038',
                '--theme-border-light': '#39414d',
                '--theme-text-primary': '#f3f4f6',
                '--theme-text-secondary': '#9ca3af',
                '--theme-text-muted': '#6b7280',
                '--theme-scrollbar-track': '#15181d',
                '--theme-scrollbar-thumb': '#4b5563',
                '--theme-scrollbar-thumb-hover': '#6b7280',
                '--theme-tooltip-bg': '#1c2128',
                '--theme-tooltip-border': '#323944'
            }
        },
        nord: {
            nameKey: 'Nord',
            colors: {
                '--theme-bg-primary': '#2b303b',
                '--theme-bg-secondary': '#323845',
                '--theme-bg-tertiary': '#3b4252',
                '--theme-bg-hover': '#434c5e',
                '--theme-bg-selected': '#394150',
                '--theme-border': '#4c566a',
                '--theme-border-light': '#5e6a81',
                '--theme-text-primary': '#eceff4',
                '--theme-text-secondary': '#c0c8d6',
                '--theme-text-muted': '#8b95a7',
                '--theme-scrollbar-track': '#2a2f3a',
                '--theme-scrollbar-thumb': '#667188',
                '--theme-scrollbar-thumb-hover': '#7d89a2',
                '--theme-tooltip-bg': '#3b4252',
                '--theme-tooltip-border': '#5e6a81'
            }
        },
        emerald: {
            nameKey: 'Esmeralda',
            colors: {
                '--theme-bg-primary': '#061411',
                '--theme-bg-secondary': '#0a1c18',
                '--theme-bg-tertiary': '#103129',
                '--theme-bg-hover': '#144236',
                '--theme-bg-selected': '#0f2a23',
                '--theme-border': '#1c4d41',
                '--theme-border-light': '#24685a',
                '--theme-text-primary': '#ecfdf5',
                '--theme-text-secondary': '#a7f3d0',
                '--theme-text-muted': '#6ee7b7',
                '--theme-scrollbar-track': '#0a1c18',
                '--theme-scrollbar-thumb': '#1f7a63',
                '--theme-scrollbar-thumb-hover': '#2aa07f',
                '--theme-tooltip-bg': '#0d241f',
                '--theme-tooltip-border': '#24685a'
            }
        },
        rose: {
            nameKey: 'Rosa Neon',
            colors: {
                '--theme-bg-primary': '#160b12',
                '--theme-bg-secondary': '#1f1019',
                '--theme-bg-tertiary': '#311726',
                '--theme-bg-hover': '#432035',
                '--theme-bg-selected': '#26131e',
                '--theme-border': '#5a2744',
                '--theme-border-light': '#7b345d',
                '--theme-text-primary': '#fff1f7',
                '--theme-text-secondary': '#f9a8d4',
                '--theme-text-muted': '#f472b6',
                '--theme-scrollbar-track': '#1f1019',
                '--theme-scrollbar-thumb': '#8b3b69',
                '--theme-scrollbar-thumb-hover': '#b34f89',
                '--theme-tooltip-bg': '#28131f',
                '--theme-tooltip-border': '#7b345d'
            }
        },
        ocean: {
            nameKey: 'Oceano',
            colors: {
                '--theme-bg-primary': '#07131d',
                '--theme-bg-secondary': '#0b1b29',
                '--theme-bg-tertiary': '#123149',
                '--theme-bg-hover': '#18425f',
                '--theme-bg-selected': '#102536',
                '--theme-border': '#1d4d6e',
                '--theme-border-light': '#2a6a96',
                '--theme-text-primary': '#eff6ff',
                '--theme-text-secondary': '#93c5fd',
                '--theme-text-muted': '#60a5fa',
                '--theme-scrollbar-track': '#0b1b29',
                '--theme-scrollbar-thumb': '#25618d',
                '--theme-scrollbar-thumb-hover': '#3182bd',
                '--theme-tooltip-bg': '#102233',
                '--theme-tooltip-border': '#2a6a96'
            }
        },
        sunset: {
            nameKey: 'Pôr do Sol',
            colors: {
                '--theme-bg-primary': '#1b1010',
                '--theme-bg-secondary': '#241414',
                '--theme-bg-tertiary': '#3a2020',
                '--theme-bg-hover': '#4b2a2a',
                '--theme-bg-selected': '#2e1a1a',
                '--theme-border': '#6b3528',
                '--theme-border-light': '#9a4a30',
                '--theme-text-primary': '#fff7ed',
                '--theme-text-secondary': '#fdba74',
                '--theme-text-muted': '#fb923c',
                '--theme-scrollbar-track': '#241414',
                '--theme-scrollbar-thumb': '#9a4a30',
                '--theme-scrollbar-thumb-hover': '#c65c38',
                '--theme-tooltip-bg': '#2b1717',
                '--theme-tooltip-border': '#9a4a30'
            }
        },
        lavender: {
            nameKey: 'Lavanda',
            colors: {
                '--theme-bg-primary': '#151222',
                '--theme-bg-secondary': '#1b162b',
                '--theme-bg-tertiary': '#2a2340',
                '--theme-bg-hover': '#372d54',
                '--theme-bg-selected': '#221c35',
                '--theme-border': '#56427e',
                '--theme-border-light': '#7258a8',
                '--theme-text-primary': '#f5f3ff',
                '--theme-text-secondary': '#c4b5fd',
                '--theme-text-muted': '#a78bfa',
                '--theme-scrollbar-track': '#1b162b',
                '--theme-scrollbar-thumb': '#6d54a5',
                '--theme-scrollbar-thumb-hover': '#8c6fd0',
                '--theme-tooltip-bg': '#241d38',
                '--theme-tooltip-border': '#7258a8'
            }
        },
        cyber: {
            nameKey: 'Cyber',
            colors: {
                '--theme-bg-primary': '#080d12',
                '--theme-bg-secondary': '#0d141b',
                '--theme-bg-tertiary': '#14212b',
                '--theme-bg-hover': '#1b2d3a',
                '--theme-bg-selected': '#101a22',
                '--theme-border': '#1f4b63',
                '--theme-border-light': '#2d6f8f',
                '--theme-text-primary': '#ecfeff',
                '--theme-text-secondary': '#67e8f9',
                '--theme-text-muted': '#22d3ee',
                '--theme-scrollbar-track': '#0d141b',
                '--theme-scrollbar-thumb': '#21607d',
                '--theme-scrollbar-thumb-hover': '#2f86ab',
                '--theme-tooltip-bg': '#101a22',
                '--theme-tooltip-border': '#2d6f8f'
            }
        },
        coffee: {
            nameKey: 'Café',
            colors: {
                '--theme-bg-primary': '#16110d',
                '--theme-bg-secondary': '#1f1712',
                '--theme-bg-tertiary': '#31231c',
                '--theme-bg-hover': '#433028',
                '--theme-bg-selected': '#271c16',
                '--theme-border': '#5b4335',
                '--theme-border-light': '#7a5a46',
                '--theme-text-primary': '#faf5ef',
                '--theme-text-secondary': '#d6b89b',
                '--theme-text-muted': '#b08968',
                '--theme-scrollbar-track': '#1f1712',
                '--theme-scrollbar-thumb': '#6d503f',
                '--theme-scrollbar-thumb-hover': '#8b6851',
                '--theme-tooltip-bg': '#241a15',
                '--theme-tooltip-border': '#7a5a46'
            }
        },
        custom: {
            nameKey: 'Personalizado',
            colors: {}
        }
    };

    var STORAGE_KEY = 'haxball-theme';
    var currentTheme = 'dark';
    var persistDebounceTimer = null;

    function getElectronAPI() {
        try {
            if (window.electronAPI && typeof window.electronAPI.saveAppearance === 'function') {
                return window.electronAPI;
            }
        } catch (eApi) {}
        try {
            if (window.top && window.top !== window && window.top.electronAPI &&
                typeof window.top.electronAPI.saveAppearance === 'function') {
                return window.top.electronAPI;
            }
        } catch (eTop) {}
        return null;
    }

    function getAppearanceSyncTarget() {
        try {
            if (window.top && window.top !== window) return window.top;
        } catch (eTop) {}
        try {
            if (window.parent && window.parent !== window) return window.parent;
        } catch (eParent) {}
        return window;
    }

    function applyDiskSnapshotToLocalStorage(data) {
        if (!data || typeof data !== 'object') return;
        try {
            if (data.theme && THEMES[data.theme]) {
                localStorage.setItem(STORAGE_KEY, String(data.theme));
            }
            if (Object.prototype.hasOwnProperty.call(data, 'customThemeBase') && data.customThemeBase && typeof data.customThemeBase === 'object') {
                var ct = Object.assign({}, data.customThemeBase);
                delete ct.backgroundImage;
                localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(ct));
            }
            if (Object.prototype.hasOwnProperty.call(data, 'wallpaper')) {
                var w = data.wallpaper == null ? '' : String(data.wallpaper);
                if (w.trim()) {
                    localStorage.setItem(APP_WALLPAPER_STORAGE_KEY, w);
                } else {
                    localStorage.removeItem(APP_WALLPAPER_STORAGE_KEY);
                }
            }
        } catch (e) {}
    }

    function flushAppearanceToDisk() {
        persistDebounceTimer = null;
        try {
            var ct = {};
            try {
                ct = JSON.parse(localStorage.getItem(CUSTOM_THEME_STORAGE_KEY) || '{}');
            } catch (e2) {
                ct = {};
            }
            if (!ct || typeof ct !== 'object') ct = {};
            delete ct.backgroundImage;
            var payload = {
                version: 1,
                theme: currentTheme,
                customThemeBase: ct,
                wallpaper: localStorage.getItem(APP_WALLPAPER_STORAGE_KEY) || ''
            };
            try {
                getAppearanceSyncTarget().postMessage({ type: 'hxd-appearance-sync-parent-ls', payload: payload }, '*');
            } catch (e3) {}
            var api = getElectronAPI();
            if (api && typeof api.saveAppearance === 'function') {
                api.saveAppearance(payload).catch(function() {});
            }
        } catch (e) {}
    }

    function schedulePersistAppearance() {
        if (persistDebounceTimer) clearTimeout(persistDebounceTimer);
        persistDebounceTimer = setTimeout(flushAppearanceToDisk, 200);
    }

    function hydrateCustomTheme() {
        customThemeBase = loadCustomThemeBase();
        customThemeBase.backgroundImage = '';
        THEMES.custom.colors = buildCustomThemeColors(customThemeBase);
    }

    // Carrega tema salvo
    function loadSavedTheme() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'glass') {
                saved = 'dark';
                localStorage.setItem(STORAGE_KEY, 'dark');
            }
            if (saved && THEMES[saved]) {
                currentTheme = saved;
            }
        } catch(e) {}
        return currentTheme;
    }

    // Salva tema
    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch(e) {}
    }

    // Lista de todas as variáveis de tema
    var ALL_THEME_VARS = [
        '--theme-bg-primary', '--theme-bg-secondary', '--theme-bg-tertiary',
        '--theme-bg-primary-rgb',
        '--theme-bg-hover', '--theme-bg-selected', '--theme-border', '--theme-border-light',
        '--theme-text-primary', '--theme-text-secondary', '--theme-text-muted',
        '--theme-scrollbar-track', '--theme-scrollbar-thumb', '--theme-scrollbar-thumb-hover',
        '--theme-tooltip-bg', '--theme-tooltip-border', '--theme-app-background-image'
    ];

    // Aplica tema
    function applyTheme(theme) {
        if (!THEMES[theme]) return;
        
        var themeChanged = (theme !== currentTheme);
        currentTheme = theme;
        saveTheme(theme);
        
        var root = document.documentElement;
        for (var i = 0; i < ALL_THEME_VARS.length; i++) {
            root.style.removeProperty(ALL_THEME_VARS[i]);
        }
        
        if (theme !== 'default') {
            var colors = THEMES[theme].colors;
            for (var key in colors) {
                root.style.setProperty(key, colors[key]);
            }
            var primHex =
                colors && colors['--theme-bg-primary']
                    ? String(colors['--theme-bg-primary']).trim()
                    : '';
            root.style.setProperty('--theme-bg-primary-rgb', hexToRgbCsv(primHex, '20, 20, 20'));
        }

        var wall = getAppWallpaper();
        var hasBgImg = String(wall || '').trim();
        if (hasBgImg && shouldPaintWallpaper()) {
            root.style.setProperty('--theme-app-background-image', buildBackgroundCssValue(wall));
            root.setAttribute('data-app-bg-image', '1');
        } else {
            root.removeAttribute('data-app-bg-image');
            root.style.removeProperty('--theme-app-background-image');
        }
        
        // Atualiza atributo para CSS condicional (no html e body)
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) {
            document.body.setAttribute('data-theme', theme);
        }
        
        if (themeChanged) {
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme, colors: getThemeColors(theme) } }));
            
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'themeChanged', theme: theme, colors: getThemeColors(theme) }, '*');
            }
            
            Injector.log('Theme applied: ' + theme);
            schedulePersistAppearance();
        }
    }

    // Obtém tema atual
    function getCurrentTheme() {
        return currentTheme;
    }

    // Obtém lista de temas (com nomes traduzidos)
    function getThemes() {
        var result = {};
        for (var key in THEMES) {
            result[key] = {
                name: t(THEMES[key].nameKey),
                colors: THEMES[key].colors
            };
        }
        return result;
    }

    function getThemeColors(themeKey) {
        if (!THEMES[themeKey]) return null;
        var out = cloneObject(THEMES[themeKey].colors || {});
        var wall = getAppWallpaper();
        if (String(wall || '').trim()) {
            out['--theme-app-background-image'] = buildBackgroundCssValue(wall);
        } else if (themeKey !== 'custom') {
            delete out['--theme-app-background-image'];
        }
        var ph = out['--theme-bg-primary'] ? String(out['--theme-bg-primary']).trim() : '';
        out['--theme-bg-primary-rgb'] = hexToRgbCsv(ph, '20, 20, 20');
        return out;
    }

    function getCustomThemeBase() {
        var o = cloneObject(customThemeBase);
        o.backgroundImage = '';
        return o;
    }

    function getDefaultCustomThemeBase() {
        return cloneObject(DEFAULT_CUSTOM_THEME_BASE);
    }

    function setCustomThemeBase(basePatch) {
        var patch = Object.assign({}, basePatch || {});
        delete patch.backgroundImage;
        customThemeBase = Object.assign({}, customThemeBase, patch);
        customThemeBase.backgroundImage = '';
        saveCustomThemeBase(customThemeBase);
        THEMES.custom.colors = buildCustomThemeColors(customThemeBase);
        applyTheme(currentTheme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: currentTheme, colors: getThemeColors(currentTheme) } }));
        schedulePersistAppearance();
        return getCustomThemeBase();
    }

    function previewCustomTheme(basePatch) {
        var patch = Object.assign({}, basePatch || {});
        delete patch.backgroundImage;
        return buildCustomThemeColors(Object.assign({}, customThemeBase, patch));
    }

    function resetCustomThemeBase() {
        customThemeBase = cloneObject(DEFAULT_CUSTOM_THEME_BASE);
        customThemeBase.backgroundImage = '';
        saveCustomThemeBase(customThemeBase);
        THEMES.custom.colors = buildCustomThemeColors(customThemeBase);
        applyTheme(currentTheme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: currentTheme, colors: getThemeColors(currentTheme) } }));
        schedulePersistAppearance();
        return getCustomThemeBase();
    }

    // Alterna entre temas
    function toggleTheme() {
        var themeKeys = Object.keys(THEMES);
        var currentIndex = themeKeys.indexOf(currentTheme);
        var newIndex = (currentIndex + 1) % themeKeys.length;
        var newTheme = themeKeys[newIndex];
        applyTheme(newTheme);
        return newTheme;
    }

    function optimizeStoredWallpaperIfHeavy() {
        try {
            var current = getAppWallpaper();
            if (!current || current.length < 900000 || current.indexOf('data:image/') !== 0) return;

            var img = new Image();
            img.onload = function() {
                try {
                    var w = img.naturalWidth || img.width;
                    var h = img.naturalHeight || img.height;
                    if (!w || !h) return;

                    var maxW = 1280;
                    var maxH = 720;
                    var scale = Math.min(1, maxW / w, maxH / h);
                    var outW = Math.max(1, Math.round(w * scale));
                    var outH = Math.max(1, Math.round(h * scale));
                    var canvas = document.createElement('canvas');
                    canvas.width = outW;
                    canvas.height = outH;
                    var ctx = canvas.getContext('2d', { alpha: false });
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'medium';
                    ctx.drawImage(img, 0, 0, outW, outH);
                    var optimized = canvas.toDataURL('image/jpeg', 0.72);

                    // Si no mejora, no tocamos nada.
                    if (optimized && optimized.length < current.length * 0.85) {
                        localStorage.setItem(APP_WALLPAPER_STORAGE_KEY, optimized);
                        applyTheme(currentTheme);
                        schedulePersistAppearance();
                    }
                } catch (eOpt) {}
            };
            img.src = current;
        } catch (e) {}
    }

    function proceedInitAfterDisk() {
        migrateWallpaperFromLegacyIfNeeded();
        optimizeStoredWallpaperIfHeavy();
        hydrateCustomTheme();
        loadSavedTheme();
        document.documentElement.setAttribute('data-theme', currentTheme);
        function runApplyTheme() {
            applyTheme(currentTheme);
        }
        if (document.body) {
            runApplyTheme();
        } else if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runApplyTheme);
        } else {
            setTimeout(runApplyTheme, 0);
        }
        function deferredReapplyFromShell() {
            try {
                loadSavedTheme();
                applyTheme(currentTheme);
            } catch (eDef) {}
        }
        setTimeout(deferredReapplyFromShell, 120);
        setTimeout(deferredReapplyFromShell, 500);
        Injector.log('Themes module loaded');
    }

    window.addEventListener('message', function(ev) {
        if (!ev.data) return;
        if (ev.data.type === 'hxd-appearance-disk-bootstrap' && ev.data.payload) {
            try {
                applyDiskSnapshotToLocalStorage(ev.data.payload);
                migrateWallpaperFromLegacyIfNeeded();
                hydrateCustomTheme();
                loadSavedTheme();
                applyTheme(currentTheme);
            } catch (eBoot) {}
            return;
        }
        if (ev.data.type !== 'hxd-shell-appearance-ready') return;
        try {
            loadSavedTheme();
            applyTheme(currentTheme);
        } catch (eMsg) {}
    });

    // Inicializa
    function init() {
        ensureThemeBackgroundStyles();
        try {
            var lastWallpaperPaintState = null;
            var resyncWallpaperPaint = function() {
                var next = shouldPaintWallpaper() ? 'on' : 'off';
                if (next === lastWallpaperPaintState) return;
                lastWallpaperPaintState = next;
                applyTheme(currentTheme);
            };
            new MutationObserver(function() {
                resyncWallpaperPaint();
            }).observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(resyncWallpaperPaint, 0);
        } catch (eObsWallpaper) {}
        var loadApi = getElectronAPI();
        if (loadApi && typeof loadApi.loadAppearance === 'function') {
            loadApi.loadAppearance().then(function(data) {
                applyDiskSnapshotToLocalStorage(data);
                proceedInitAfterDisk();
            }).catch(function() {
                proceedInitAfterDisk();
            });
        } else {
            setTimeout(proceedInitAfterDisk, 450);
        }
    }

    // Exporta API
    window.HaxThemes = {
        apply: applyTheme,
        toggle: toggleTheme,
        getCurrent: getCurrentTheme,
        getThemes: getThemes,
        getThemeColors: getThemeColors,
        getCustomThemeBase: getCustomThemeBase,
        getDefaultCustomThemeBase: getDefaultCustomThemeBase,
        setCustomThemeBase: setCustomThemeBase,
        previewCustomTheme: previewCustomTheme,
        resetCustomThemeBase: resetCustomThemeBase,
        getAppWallpaper: getAppWallpaper,
        setAppWallpaper: setAppWallpaper,
        clearAppWallpaper: clearAppWallpaper,
        THEMES: THEMES
    };

    init();
})();
