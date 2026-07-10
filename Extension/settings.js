// ============================================
// SETTINGS - Dialog de configurações com sidebar
// ============================================
(function () {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    // Função de tradução
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    var settingsPreviewHtmlCache = null;
    var settingsPreviewFetchPending = null;

    function markSettingsOpening(win) {
        if (!win) return;
        try {
            win.__hxdSettingsPopupOpen = true;
            win.__hxdSuppressSettingsEscUntil = Date.now() + 1500;
            win.__hxdSettingsOpeningUntil = Date.now() + 1500;
        } catch (eMarkOpen) {}
    }

    function setSettingsPopupOpen(doc, open) {
        if (!doc) doc = document;
        try { doc.__hxdSettingsPopupOpen = !!open; } catch (eDocFlag) {}
        try {
            var win = doc.defaultView || window;
            win.__hxdSettingsPopupOpen = !!open;
        } catch (eWinFlag) {}
    }

    function isSettingsEscTarget(doc) {
        if (!doc) return false;
        try {
            var win = doc.defaultView || window;
            return !!(doc.__hxdSettingsPopupOpen || win.__hxdSettingsPopupOpen);
        } catch (eFlagRead) {
            return false;
        }
    }

    function shouldSuppressSettingsEsc(doc) {
        var win = doc && doc.defaultView ? doc.defaultView : window;
        if (win.__hxdSuppressSettingsEscUntil && Date.now() < win.__hxdSuppressSettingsEscUntil) return true;
        if (win.__hxdSettingsOpeningUntil && Date.now() < win.__hxdSettingsOpeningUntil) return true;
        return isSettingsEscTarget(doc);
    }

    function handleSettingsEscKeydown(e, doc) {
        if (!e || (e.key !== 'Escape' && e.keyCode !== 27)) return false;
        if (!shouldSuppressSettingsEsc(doc)) return false;
        var frame = doc.getElementById('hxd-settings-preview-frame');
        if (frame && frame.contentDocument && frame.contentDocument.documentElement) {
            if (frame.contentDocument.documentElement.classList.contains('kb-capturing')) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                return true;
            }
        }
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        try { doc.defaultView.__hxdSuppressSettingsEscUntil = Date.now() + 900; } catch (eFlag) {}
        if (doc.__hxdCloseSettingsPreviewAnimated && isSettingsOpenedFromRoomlist(doc)) {
            doc.__hxdCloseSettingsPreviewAnimated();
            return true;
        }
        var win = doc.defaultView;
        if (win && typeof win.__hxdCloseSettingsPreview === 'function') {
            win.__hxdCloseSettingsPreview();
        } else if (win && typeof win.__hxdCloseSettingsPopup === 'function') {
            win.__hxdCloseSettingsPopup();
        } else {
            var closeBtn = doc.querySelector('.dialog.settings-view button[data-hook="close"]');
            if (closeBtn) closeBtn.click();
        }
        return true;
    }

    function installGlobalSettingsEscGuard(doc) {
        if (!doc || doc.hxdGlobalSettingsEscGuardInstalled) return;
        doc.hxdGlobalSettingsEscGuardInstalled = true;
        doc.addEventListener('keydown', function (e) {
            handleSettingsEscKeydown(e, doc);
        }, true);
        doc.addEventListener('keyup', function (e) {
            if (!e || (e.key !== 'Escape' && e.keyCode !== 27)) return;
            if (!doc.defaultView || Date.now() > (doc.defaultView.__hxdSuppressSettingsEscUntil || 0)) return;
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }, true);
        doc.addEventListener('pointerdown', function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('[data-hook="settings"]') : null;
            if (btn) markSettingsOpening(doc.defaultView);
        }, true);
        doc.addEventListener('mousedown', function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('[data-hook="settings"]') : null;
            if (btn) markSettingsOpening(doc.defaultView);
        }, true);
    }

    function getSettingsPreviewUrl() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                return chrome.runtime.getURL('settings-preview.html');
            }
        } catch (eUrl) {}
        try {
            if (window.__hxdExtensionBaseUrl) {
                return String(window.__hxdExtensionBaseUrl).replace(/\/?$/, '/') + 'settings-preview.html';
            }
        } catch (eBase) {}
        try {
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1; i >= 0; i--) {
                var src = scripts[i] && scripts[i].src ? String(scripts[i].src) : '';
                if (!src || src.indexOf('runtime.js') === -1) continue;
                return src.replace(/runtime\.js(?:[?#].*)?$/, 'settings-preview.html');
            }
        } catch (eScriptUrl) {}
        return null;
    }

    function fetchSettingsPreviewHtml(done) {
        if (settingsPreviewHtmlCache) {
            done(null, settingsPreviewHtmlCache);
            return;
        }
        if (settingsPreviewFetchPending) {
            settingsPreviewFetchPending.push(done);
            return;
        }
        settingsPreviewFetchPending = [done];
        var url = getSettingsPreviewUrl();
        if (!url) {
            settingsPreviewFetchPending.forEach(function (cb) { cb(new Error('no preview url')); });
            settingsPreviewFetchPending = null;
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
            var pending = settingsPreviewFetchPending || [];
            settingsPreviewFetchPending = null;
            if (xhr.status === 200 && xhr.responseText) {
                settingsPreviewHtmlCache = xhr.responseText;
                pending.forEach(function (cb) { cb(null, settingsPreviewHtmlCache); });
            } else {
                pending.forEach(function (cb) { cb(new Error('preview fetch failed')); });
            }
        };
        xhr.onerror = function () {
            var pending = settingsPreviewFetchPending || [];
            settingsPreviewFetchPending = null;
            pending.forEach(function (cb) { cb(new Error('preview xhr error')); });
        };
        xhr.send();
    }

    function getSettingsPreviewStylesCss() {
        return '.dialog.settings-view.hxd-settings-preview-dialog{' +
            'background:var(--theme-bg-primary,#141414)!important;border:none!important;box-shadow:none!important;padding:0!important;overflow:hidden!important;' +
            'opacity:1;transition:opacity 0.16s ease-out;' +
        '}' +
        '.dialog.settings-view.hxd-settings-preview-dialog.hxd-settings-preview-enter,' +
        '.dialog.settings-view.hxd-settings-preview-dialog.hxd-settings-preview-closing{' +
            'opacity:0!important;pointer-events:none!important;' +
        '}' +
        '.dialog.settings-view.hxd-settings-preview-dialog > :not(#hxd-settings-preview-root){display:none!important;}' +
        '.dialog.settings-view.hxd-settings-preview-dialog #hxd-settings-preview-root{' +
            'display:block!important;background:var(--theme-bg-primary,#141414);' +
        '}' +
        '#hxd-settings-preview-frame{width:100%;height:100%;border:none;display:block;background:transparent;}';
    }

    function ensureSettingsPreviewStyles(doc) {
        var style = doc.getElementById('hxd-settings-preview-styles');
        var css = getSettingsPreviewStylesCss();
        if (style) {
            style.textContent = css;
            return;
        }
        style = doc.createElement('style');
        style.id = 'hxd-settings-preview-styles';
        style.textContent = css;
        doc.head.appendChild(style);
    }

    function applySettingsPreviewDialogSize(dialog) {
        Injector.applyPreviewShellSize(dialog, 'hxd-settings-preview-dialog');
    }

    function clearSettingsPreviewDialogShell(dialog) {
        if (!dialog) return;
        dialog.classList.remove('hxd-settings-preview-dialog');
        dialog.style.removeProperty('box-sizing');
        dialog.style.removeProperty('position');
        dialog.style.removeProperty('width');
        dialog.style.removeProperty('min-width');
        dialog.style.removeProperty('max-width');
        dialog.style.removeProperty('min-height');
        dialog.style.removeProperty('height');
        dialog.style.removeProperty('max-height');
        dialog.style.removeProperty('padding');
        dialog.style.removeProperty('overflow');
        dialog.style.removeProperty('border-radius');
        delete dialog.dataset.hxdSettingsPreview;
    }

    function clearSettingsOpenedFromRoomlist(doc) {
        if (!doc) doc = document;
        try { delete doc.__hxdSettingsOpenedFromRoomlist; } catch (eD) {}
        try { delete doc.__hxdSettingsOpenedFromRoomlistUntil; } catch (eDu) {}
        try { delete doc.hxdSettingsRoomlistSession; } catch (eSess) {}
        try { delete window.__hxdSettingsOpenedFromRoomlist; } catch (eW) {}
        try { delete window.__hxdSettingsOpenedFromRoomlistUntil; } catch (eWu) {}
        try { delete window.__hxdSettingsRoomlistSession; } catch (eWs) {}
        try { delete doc.hxdSettingsPreviewContextSig; } catch (eS) {}
    }

    function markSettingsOpenedFromRoomlist(doc) {
        if (!doc) doc = document;
        var now = Date.now();
        doc.__hxdSettingsOpenedFromRoomlist = true;
        doc.__hxdSettingsOpenedFromRoomlistUntil = now + 60000;
        doc.hxdSettingsRoomlistSession = true;
        try {
            window.__hxdSettingsOpenedFromRoomlist = true;
            window.__hxdSettingsOpenedFromRoomlistUntil = now + 60000;
            window.__hxdSettingsRoomlistSession = true;
        } catch (eWin) {}
        try { delete doc.hxdSettingsPreviewContextSig; } catch (eSig) {}
    }

    try { window.__hxdMarkSettingsOpenedFromRoomlist = markSettingsOpenedFromRoomlist; } catch (eExp) {}
    try { window.__hxdClearSettingsOpenedFromRoomlist = clearSettingsOpenedFromRoomlist; } catch (eExp2) {}

    function isSettingsOpenedFromRoomlist(doc) {
        if (!doc) doc = document;
        if (doc.hxdSettingsRoomlistSession || window.__hxdSettingsRoomlistSession) return true;
        var until = doc.__hxdSettingsOpenedFromRoomlistUntil || window.__hxdSettingsOpenedFromRoomlistUntil || 0;
        if (until && Date.now() < until) return true;
        return !!(doc.__hxdSettingsOpenedFromRoomlist || window.__hxdSettingsOpenedFromRoomlist);
    }

    function pushSettingsPreviewContext(doc, force) {
        if (!doc) doc = document;
        var frame = doc.getElementById('hxd-settings-preview-frame');
        if (!frame || !frame.contentWindow) return;
        var settingsOpen = !!doc.querySelector('.dialog.settings-view');
        var fromRoomlist = isSettingsOpenedFromRoomlist(doc);
        if (settingsOpen && (doc.hxdSettingsRoomlistSession || window.__hxdSettingsRoomlistSession)) {
            fromRoomlist = true;
        }
        var sig = fromRoomlist ? 'roomlist' : 'default';
        if (!force && doc.hxdSettingsPreviewContextSig === sig) return;
        doc.hxdSettingsPreviewContextSig = sig;
        try {
            frame.contentWindow.postMessage({
                type: 'hxd-settings-sync',
                openedFromRoomlist: fromRoomlist,
                settingsOpen: settingsOpen
            }, '*');
        } catch (ePush) {}
    }

    function mountSettingsPreview(doc, dialog, done) {
        if (!dialog) {
            done(false);
            return;
        }
        if (doc.getElementById('hxd-settings-preview-root')) {
            done(true);
            return;
        }

        ensureSettingsPreviewStyles(doc);
        applySettingsPreviewDialogSize(dialog);

        fetchSettingsPreviewHtml(function (err, html) {
            if (err || !html) {
                clearSettingsPreviewDialogShell(dialog);
                done(false);
                return;
            }
            if (!dialog.isConnected || doc.getElementById('hxd-settings-preview-root')) {
                done(!!doc.getElementById('hxd-settings-preview-root'));
                return;
            }

            var closeBtn = dialog.querySelector('button[data-hook="close"]');

            var root = doc.createElement('div');
            root.id = 'hxd-settings-preview-root';
            root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';

            var iframe = doc.createElement('iframe');
            iframe.id = 'hxd-settings-preview-frame';
            iframe.setAttribute('title', t('Configuración'));
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
            iframe.onload = function () {
                pushSettingsPreviewContext(doc, true);
                setTimeout(function () { pushSettingsPreviewContext(doc, true); }, 80);
                setTimeout(function () { pushSettingsPreviewContext(doc, true); }, 250);
            };
            iframe.srcdoc = html;

            function closeSettingsPreviewLikeClick() {
                var fromRoomlist = isSettingsOpenedFromRoomlist(doc);
                if (fromRoomlist && typeof doc.__hxdCloseSettingsPreviewAnimated === 'function') {
                    doc.__hxdCloseSettingsPreviewAnimated();
                    return;
                }
                try { doc.defaultView.__hxdSuppressSettingsEscUntil = Date.now() + 900; } catch (eEscFlag) {}
                clearSettingsOpenedFromRoomlist(doc);
                if (closeBtn) closeBtn.click();
                window.setTimeout(function () {
                    try {
                        var restore = doc.defaultView && doc.defaultView.__hxdRestoreGameFocusAfterSettingsClose;
                        if (typeof restore === 'function') restore();
                    } catch (eRestoreFocus) {}
                }, 0);
            }

            if (doc.defaultView) doc.defaultView.__hxdCloseSettingsPreview = closeSettingsPreviewLikeClick;

            if (!doc.hxdSettingsPreviewEscBound) {
                doc.hxdSettingsPreviewEscBound = true;
                doc.addEventListener('keydown', function (e) {
                    handleSettingsEscKeydown(e, doc);
                }, true);
                doc.addEventListener('keyup', function (e) {
                    if (!e || (e.key !== 'Escape' && e.keyCode !== 27)) return;
                    if (!doc.defaultView || Date.now() > (doc.defaultView.__hxdSuppressSettingsEscUntil || 0)) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                }, true);
            }

            root.appendChild(iframe);
            dialog.appendChild(root);
            dialog.dataset.hxdSettingsPreview = '1';
            dialog.classList.add('hxd-settings-preview-enter');
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    dialog.classList.remove('hxd-settings-preview-enter');
                });
            });

            Injector.log('Settings preview mounted');
            done(true);
        });
    }

    function modifySettingsDialog(doc) {
        // O dialog settings-view aparece como .dialog.settings-view
        var dialog = doc.querySelector('.dialog.settings-view');
        if (!dialog) return;

        // Já foi modificado
        if (doc.getElementById('settings-sidebar-panel')) return;
        if (doc.getElementById('hxd-settings-preview-root')) return;

        // Cria tooltip customizado
        var tooltip = doc.getElementById('settings-sidebar-tooltip');
        if (!tooltip) {
            tooltip = doc.createElement('div');
            tooltip.id = 'settings-sidebar-tooltip';
            tooltip.style.cssText = 'position:fixed;background:var(--theme-tooltip-bg);color:var(--theme-text-primary);padding:6px 10px;border-radius:6px;font-size:12px;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:10000;white-space:nowrap;border:1px solid var(--theme-tooltip-border);box-shadow:0 4px 16px rgba(0,0,0,0.3);';
            doc.body.appendChild(tooltip);
        }

        function showTooltip(el, text) {
            var rect = el.getBoundingClientRect();
            tooltip.textContent = text;
            tooltip.style.left = (rect.right + 8) + 'px';
            tooltip.style.top = (rect.top + rect.height / 2 - 12) + 'px';
            tooltip.style.opacity = '1';
        }

        function hideTooltip() {
            tooltip.style.opacity = '0';
        }

        function addTooltip(el, text) {
            if (!el) return;
            el.addEventListener('mouseenter', function () { showTooltip(el, text); });
            el.addEventListener('mouseleave', hideTooltip);
            el.addEventListener('click', hideTooltip);
        }

        function ensureSettingsScrollbarStyles() {
            if (doc.getElementById('settings-scrollbar-styles-v3')) return;
            var style = doc.createElement('style');
            style.id = 'settings-scrollbar-styles-v3';
            style.textContent =
                '.dialog.settings-view .tabcontents, .dialog.settings-view .perf-section, .dialog.settings-view .appearance-section, .dialog.settings-view .resolution-section, .dialog.settings-view .perf-section * {' +
                    'scrollbar-width:thin !important;' +
                    'scrollbar-color:rgba(255,255,255,0.28) transparent !important;' +
                '}' +
                'html[data-theme="light"] .dialog.settings-view .tabcontents, html[data-theme="light"] .dialog.settings-view .perf-section, html[data-theme="light"] .dialog.settings-view .appearance-section, html[data-theme="light"] .dialog.settings-view .resolution-section, html[data-theme="light"] .dialog.settings-view .perf-section * {' +
                    'scrollbar-color:rgba(0,0,0,0.22) transparent !important;' +
                '}' +
                '.dialog.settings-view .tabcontents::-webkit-scrollbar, .dialog.settings-view .perf-section::-webkit-scrollbar, .dialog.settings-view .appearance-section::-webkit-scrollbar, .dialog.settings-view .resolution-section::-webkit-scrollbar, .dialog.settings-view .perf-section *::-webkit-scrollbar {' +
                    'width:6px !important;' +
                    'height:6px !important;' +
                '}' +
                '.dialog.settings-view .tabcontents::-webkit-scrollbar-track, .dialog.settings-view .perf-section::-webkit-scrollbar-track, .dialog.settings-view .appearance-section::-webkit-scrollbar-track, .dialog.settings-view .resolution-section::-webkit-scrollbar-track, .dialog.settings-view .perf-section *::-webkit-scrollbar-track {' +
                    'background:transparent !important;' +
                '}' +
                '.dialog.settings-view .tabcontents::-webkit-scrollbar-thumb, .dialog.settings-view .perf-section::-webkit-scrollbar-thumb, .dialog.settings-view .appearance-section::-webkit-scrollbar-thumb, .dialog.settings-view .resolution-section::-webkit-scrollbar-thumb, .dialog.settings-view .perf-section *::-webkit-scrollbar-thumb {' +
                    'background-color:rgba(255,255,255,0.28) !important;' +
                    'border-radius:999px !important;' +
                    'border:2px solid transparent !important;' +
                    'background-clip:padding-box !important;' +
                '}' +
                'html[data-theme="light"] .dialog.settings-view .tabcontents::-webkit-scrollbar-thumb, html[data-theme="light"] .dialog.settings-view .perf-section::-webkit-scrollbar-thumb, html[data-theme="light"] .dialog.settings-view .appearance-section::-webkit-scrollbar-thumb, html[data-theme="light"] .dialog.settings-view .resolution-section::-webkit-scrollbar-thumb, html[data-theme="light"] .dialog.settings-view .perf-section *::-webkit-scrollbar-thumb {' +
                    'background-color:rgba(0,0,0,0.22) !important;' +
                '}' +
                '.dialog.settings-view .tabcontents::-webkit-scrollbar-thumb:hover, .dialog.settings-view .perf-section::-webkit-scrollbar-thumb:hover, .dialog.settings-view .appearance-section::-webkit-scrollbar-thumb:hover, .dialog.settings-view .resolution-section::-webkit-scrollbar-thumb:hover, .dialog.settings-view .perf-section *::-webkit-scrollbar-thumb:hover {' +
                    'background-color:rgba(255,255,255,0.42) !important;' +
                '}' +
                'html[data-theme="light"] .dialog.settings-view .tabcontents::-webkit-scrollbar-thumb:hover, html[data-theme="light"] .dialog.settings-view .perf-section::-webkit-scrollbar-thumb:hover, html[data-theme="light"] .dialog.settings-view .appearance-section::-webkit-scrollbar-thumb:hover, html[data-theme="light"] .dialog.settings-view .resolution-section::-webkit-scrollbar-thumb:hover, html[data-theme="light"] .dialog.settings-view .perf-section *::-webkit-scrollbar-thumb:hover {' +
                    'background-color:rgba(0,0,0,0.34) !important;' +
                '}' +
                '.dialog.settings-view .tabcontents::-webkit-scrollbar-button, .dialog.settings-view .perf-section::-webkit-scrollbar-button, .dialog.settings-view .appearance-section::-webkit-scrollbar-button, .dialog.settings-view .resolution-section::-webkit-scrollbar-button, .dialog.settings-view .perf-section *::-webkit-scrollbar-button {' +
                    'display:none !important;width:0 !important;height:0 !important;' +
                '}' +
                '.dialog.settings-view .tabcontents::-webkit-scrollbar-corner, .dialog.settings-view .perf-section::-webkit-scrollbar-corner, .dialog.settings-view .appearance-section::-webkit-scrollbar-corner, .dialog.settings-view .resolution-section::-webkit-scrollbar-corner, .dialog.settings-view .perf-section *::-webkit-scrollbar-corner {' +
                    'background:transparent !important;' +
                '}' +
                '.dialog.settings-view [data-hook="miscsec"] .hax-client-video-block{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);}' +
                '.dialog.settings-view [data-hook="miscsec"] .hxd-misc-toggle-row{display:flex;align-items:center;gap:10px;padding:10px 6px;cursor:pointer;font-size:14px;line-height:1.35;color:var(--theme-text-primary,#e5e5e5);border-radius:6px;transition:background .12s;}' +
                '.dialog.settings-view [data-hook="miscsec"] .hxd-misc-toggle-row:hover{background:rgba(255,255,255,0.04);}' +
                '.dialog.settings-view [data-hook="miscsec"] .hxd-misc-toggle-row .hxd-misc-toggle-ic{flex-shrink:0;font-style:normal;}';
            doc.head.appendChild(style);
        }

        // Cria sidebar
        var sidebar = doc.createElement('div');
        sidebar.id = 'settings-sidebar-panel';
        sidebar.style.cssText = 'position:absolute;left:-50px;top:5px;bottom:5px;width:50px;background:var(--theme-bg-primary);border:1px solid var(--theme-border);border-radius:8px 0 0 8px;display:flex;flex-direction:column;gap:8px;padding:10px 6px;box-sizing:border-box;z-index:-1;';

        sidebar.addEventListener('mouseleave', hideTooltip);
        ensureSettingsScrollbarStyles();

        // Pega as tabs originais
        var tabs = dialog.querySelector('.tabs');

        function applyDefaultDialogSize() {
            var vh = window.innerHeight || 800;
            var shellH = Math.min(620, Math.max(400, Math.floor(vh * 0.88)));
            dialog.style.boxSizing = 'border-box';
            dialog.style.width = '560px';
            dialog.style.minWidth = '560px';
            dialog.style.maxWidth = '560px';
            dialog.style.minHeight = shellH + 'px';
            dialog.style.height = shellH + 'px';
            dialog.style.maxHeight = '90vh';
            var tabcontents = dialog.querySelector('.tabcontents');
            if (tabcontents) {
                var innerH = Math.max(360, shellH - 130);
                tabcontents.style.boxSizing = 'border-box';
                tabcontents.style.minHeight = innerH + 'px';
                tabcontents.style.height = innerH + 'px';
                tabcontents.style.maxHeight = innerH + 'px';
                tabcontents.style.overflowY = 'auto';
                tabcontents.style.overflowX = 'hidden';
            }
        }

        // Ícones para cada aba
        var tabIcons = {
            'soundhubbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>', tooltip: t('Sonido'), order: 0 },
            'soundbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>', tooltip: t('Som'), order: 1 },
            'videobtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', tooltip: t('Vídeo'), order: 2 },
            'resolutionbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10"/><path d="M9 8h6"/><path d="M8 12h8"/></svg>', tooltip: t('Resolución'), order: 3 },
            'inputbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12"/></svg>', tooltip: t('Atajos de teclado'), order: 1 },
            'perfbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>', tooltip: t('Desempenho'), order: 5 },
            'shortcutsbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h6M4 12h4M4 17h6"/><path d="M14 7h6M14 12h4M14 17h6"/><circle cx="11" cy="7" r="1"/><circle cx="11" cy="12" r="1"/><circle cx="11" cy="17" r="1"/></svg>', tooltip: t('shortcuts'), order: 55 },
            'extrapbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h10"/><path d="M10 8l4 4-4 4"/><path d="M20 5v14"/></svg>', tooltip: t('Extrapolation'), order: 6 },
            'avatarbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>', tooltip: t('Avatares'), order: 7 },
            'tokenbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>', tooltip: t('Host Token'), order: 8 },
            'multiauthbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="4"/><path d="M9 13c-4 0-6 2-6 5v1h12v-1c0-3-2-5-6-5"/><path d="M16 11h6m-3-3v6"/></svg>', tooltip: t('Multi-Auth'), order: 9 },
            'themebtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M2 12h20"/></svg>', tooltip: t('Personalización'), order: 10 },
            'miscbtn': { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>', tooltip: t('Diversos'), order: 11 }
        };

        // Ordem customizada dos botões (sin soundbtn en barra: se usa Sonido ampliado)
        var tabOrder = ['soundhubbtn', 'inputbtn', 'videobtn', 'resolutionbtn', 'perfbtn', 'shortcutsbtn', 'extrapbtn', 'avatarbtn', 'tokenbtn', 'multiauthbtn', 'themebtn', 'miscbtn'];

        function createSoundHubTab(doc, tabs) {
            if (!tabs || tabs.querySelector('button[data-hook="soundhubbtn"]')) return;

            var soundhubBtn = doc.createElement('button');
            soundhubBtn.setAttribute('data-hook', 'soundhubbtn');
            soundhubBtn.textContent = t('Sonido');
            soundhubBtn.style.display = 'none';
            tabs.appendChild(soundhubBtn);

            var soundHubSection = doc.createElement('div');
            soundHubSection.className = 'section sound-hub-section';
            soundHubSection.setAttribute('data-hook', 'sound-hub-section');
            soundHubSection.style.display = 'none';

            var intro = doc.createElement('div');
            intro.style.cssText = 'color:var(--theme-text-muted);font-size:11px;margin-bottom:12px;line-height:1.45;padding-bottom:10px;border-bottom:1px solid var(--theme-border);';
            intro.textContent = t('Sonido hub intro');
            soundHubSection.appendChild(intro);

            var hookList = [
                { hook: 'tsound-main', label: t('Sonido general (master)') },
                { hook: 'tsound-chat', label: t('Sonido del chat') },
                { hook: 'tsound-highlight', label: t('Sonido de mención') },
                { hook: 'tsound-crowd', label: t('Hinchada y ambiente') },
                { hook: 'tsound-kick', label: t('Patada y pelota') },
                { hook: 'tsound-goal', label: t('Gol') },
                { hook: 'tsound-join', label: t('Jugador entra') },
                { hook: 'tsound-leave', label: t('Jugador sale') }
            ];

            function syncSoundHubRows() {
                for (var si = 0; si < hookList.length; si++) {
                    var h = hookList[si].hook;
                    var src = dialog.querySelector('[data-hook="' + h + '"]');
                    var row = soundHubSection.querySelector('[data-shub="' + h + '"]');
                    if (!src || !row) continue;
                    var srcIcon = src.querySelector('i');
                    var on = srcIcon && srcIcon.classList.contains('icon-ok');
                    var rIcon = row.querySelector('.shub-icon');
                    if (rIcon) {
                        rIcon.classList.toggle('icon-ok', on);
                        rIcon.classList.toggle('icon-cancel', !on);
                    }
                }
            }

            for (var hi = 0; hi < hookList.length; hi++) {
                (function (item) {
                    var row = doc.createElement('div');
                    row.className = 'shub-row';
                    row.setAttribute('data-shub', item.hook);
                    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;border:1px solid var(--theme-border);background:rgba(255,255,255,0.02);margin-bottom:8px;';
                    var rIcon = doc.createElement('i');
                    rIcon.className = 'shub-icon icon-cancel';
                    rIcon.style.cssText = 'flex-shrink:0;';
                    var lbl = doc.createElement('span');
                    lbl.style.cssText = 'flex:1;font-size:13px;color:var(--theme-text-primary);';
                    lbl.textContent = item.label;
                    row.appendChild(rIcon);
                    row.appendChild(lbl);
                    row.onmouseenter = function () { row.style.background = 'var(--theme-bg-hover)'; };
                    row.onmouseleave = function () { row.style.background = 'rgba(255,255,255,0.02)'; };
                    row.onclick = function () {
                        var src = dialog.querySelector('[data-hook="' + item.hook + '"]');
                        if (src) src.click();
                        setTimeout(syncSoundHubRows, 0);
                    };
                    soundHubSection.appendChild(row);
                })(hookList[hi]);
            }

            var tc = dialog.querySelector('.tabcontents');
            if (tc) tc.insertBefore(soundHubSection, tc.firstChild);

            soundhubBtn.__customSidebarOpen = function () {
                var allSec = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < allSec.length; i++) {
                    var sec = allSec[i];
                    if (sec.getAttribute('data-hook') === 'sound-hub-section') {
                        sec.style.display = 'none';
                        sec.classList.remove('selected');
                        continue;
                    }
                    sec.style.display = 'none';
                    sec.classList.remove('selected');
                }
                soundHubSection.style.display = 'block';
                soundHubSection.classList.add('selected');
                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                soundhubBtn.classList.add('selected');
                applyDefaultDialogSize();
                syncSoundHubRows();
            };

        }

        // Cria a aba de temas customizada
        function createThemeTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="themebtn"]')) return;

            var themeBtn = doc.createElement('button');
            themeBtn.setAttribute('data-hook', 'themebtn');
            themeBtn.textContent = t('Personalización');
            themeBtn.style.display = 'none';
            tabs.appendChild(themeBtn);

            var themeSection = doc.createElement('section');
            themeSection.className = 'appearance-section section';
            themeSection.setAttribute('data-hook', 'theme-section');
            themeSection.style.display = 'none';

            var container = doc.createElement('div');
            container.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

            var GLASS_LS = 'hax_glass_ui';
            function syncGlassUiDoc() {
                try {
                    var on = localStorage.getItem(GLASS_LS) === '1';
                    if (on) doc.documentElement.setAttribute('data-glass-ui', '1');
                    else doc.documentElement.removeAttribute('data-glass-ui');
                } catch (eG0) {}
                if (typeof window.__hxdApplyGlassUiFromStorage === 'function') {
                    try { window.__hxdApplyGlassUiFromStorage(); } catch (eG1) {}
                }
            }

            var glassCard = doc.createElement('div');
            glassCard.style.cssText = 'padding:12px 14px;border-radius:12px;border:1px solid var(--theme-border);background:var(--theme-bg-secondary);';
            var glassTop = doc.createElement('div');
            glassTop.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;';
            var glassTitles = doc.createElement('div');
            var glassH = doc.createElement('div');
            glassH.style.cssText = 'font-size:13px;font-weight:700;color:var(--theme-text-primary);';
            glassH.textContent = t('Glass UI title');
            var glassSub = doc.createElement('div');
            glassSub.style.cssText = 'font-size:11px;color:var(--theme-text-muted);margin-top:4px;line-height:1.35;';
            glassSub.textContent = t('Glass UI hint');
            glassTitles.appendChild(glassH);
            glassTitles.appendChild(glassSub);
            var glassSw = doc.createElement('input');
            glassSw.type = 'checkbox';
            glassSw.setAttribute('aria-label', t('Glass UI title'));
            try { glassSw.checked = localStorage.getItem(GLASS_LS) === '1'; } catch (eG2) {}
            glassSw.style.cssText = 'width:18px;height:18px;accent-color:#3b82f6;cursor:pointer;flex-shrink:0;margin-top:2px;';
            glassSw.onchange = function() {
                try {
                    if (glassSw.checked) localStorage.setItem(GLASS_LS, '1');
                    else localStorage.removeItem(GLASS_LS);
                } catch (eG3) {}
                syncGlassUiDoc();
            };
            glassTop.appendChild(glassTitles);
            glassTop.appendChild(glassSw);
            glassCard.appendChild(glassTop);

            var segWrap = doc.createElement('div');
            segWrap.style.cssText = 'display:flex;gap:0;margin-bottom:2px;padding:3px;border-radius:10px;background:var(--theme-bg-secondary);border:1px solid var(--theme-border);';
            var panelPresets = doc.createElement('div');
            var panelWallpaper = doc.createElement('div');
            var panelCustom = doc.createElement('div');
            var activeSeg = 'presets';
            var segBtns = {};
            function refreshSegUi() {
                var keys = ['presets', 'wallpaper', 'custom'];
                for (var sgi = 0; sgi < keys.length; sgi++) {
                    var skey = keys[sgi];
                    var btn = segBtns[skey];
                    if (!btn) continue;
                    var sel = activeSeg === skey;
                    btn.style.background = sel ? 'var(--theme-bg-tertiary)' : 'transparent';
                    btn.style.color = sel ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)';
                }
                panelPresets.style.display = activeSeg === 'presets' ? 'block' : 'none';
                panelWallpaper.style.display = activeSeg === 'wallpaper' ? 'block' : 'none';
                panelCustom.style.display = activeSeg === 'custom' ? 'block' : 'none';
            }
            function makeSegBtn(segKey, segLabel) {
                var sb = doc.createElement('button');
                sb.type = 'button';
                sb.textContent = segLabel;
                sb.style.cssText = 'flex:1;padding:9px 4px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;transition:background .12s,color .12s;background:transparent;color:var(--theme-text-secondary);';
                (function(kk) {
                    sb.onclick = function() {
                        activeSeg = kk;
                        refreshSegUi();
                    };
                })(segKey);
                segBtns[segKey] = sb;
                return sb;
            }
            segWrap.appendChild(makeSegBtn('presets', t('Theme seg themes')));
            segWrap.appendChild(makeSegBtn('wallpaper', t('Theme seg wallpaper')));
            segWrap.appendChild(makeSegBtn('custom', t('Theme seg colors')));
            refreshSegUi();

            var themeOptions = doc.createElement('div');
            themeOptions.className = 'theme-options';
            themeOptions.style.cssText = 'max-height:min(52vh,420px);overflow-y:auto;padding:2px 4px 2px 0;';

            var themes = window.HaxThemes ? window.HaxThemes.getThemes() : { default: { name: t('Padrão') }, dark: { name: t('Escuro') }, light: { name: t('Claro') }, custom: { name: t('Personalizado') } };
            var currentTheme = window.HaxThemes ? window.HaxThemes.getCurrent() : 'dark';
            var optionMap = {};

            var themeDescs = {
                default: t('Sem alterações de cor'),
                dark: t('Reduz o cansaço visual'),
                light: t('Melhor visibilidade'),
                onix: t('Preto total, escuridão absoluta'),
                graphite: t('Cinza elegante e equilibrado'),
                nord: t('Azul frio com contraste suave'),
                emerald: t('Verde profundo com brilho limpo'),
                rose: t('Rosa vibrante com clima neon'),
                ocean: t('Azul oceânico mais vivo'),
                sunset: t('Laranja quente inspirado no entardecer'),
                lavender: t('Roxo suave com destaque moderno'),
                cyber: t('Ciano tecnológico com ar futurista'),
                coffee: t('Marrom escuro confortável para sessões longas'),
                custom: t('Crea tu propia combinación de colores')
            };

            function setSelectedTheme(themeKey) {
                currentTheme = themeKey;
                var allOptions = themeOptions.querySelectorAll('.theme-option');
                for (var i = 0; i < allOptions.length; i++) {
                    allOptions[i].classList.remove('selected');
                }
                if (optionMap[themeKey]) {
                    optionMap[themeKey].classList.add('selected');
                }
            }

            function getDefaultCustomBase() {
                if (window.HaxThemes && window.HaxThemes.getDefaultCustomThemeBase) {
                    return window.HaxThemes.getDefaultCustomThemeBase();
                }
                return {
                    bgPrimary: '#0f1117',
                    bgSecondary: '#161b24',
                    bgTertiary: '#1f2937',
                    border: '#334155',
                    textPrimary: '#f8fafc',
                    textSecondary: '#94a3b8',
                    backgroundImage: ''
                };
            }

            function getSavedCustomBase() {
                if (window.HaxThemes && window.HaxThemes.getCustomThemeBase) {
                    return window.HaxThemes.getCustomThemeBase();
                }
                return getDefaultCustomBase();
            }

            function mapThemeColorsToBase(themeKey) {
                var fallback = getDefaultCustomBase();
                if (themeKey === 'custom') {
                    return getSavedCustomBase();
                }
                if (!window.HaxThemes || !window.HaxThemes.getThemeColors) return fallback;
                var colors = window.HaxThemes.getThemeColors(themeKey);
                if (!colors || !Object.keys(colors).length) {
                    colors = window.HaxThemes.getThemeColors('dark') || {};
                }
                return {
                    bgPrimary: colors['--theme-bg-primary'] || fallback.bgPrimary,
                    bgSecondary: colors['--theme-bg-secondary'] || fallback.bgSecondary,
                    bgTertiary: colors['--theme-bg-tertiary'] || fallback.bgTertiary,
                    border: colors['--theme-border'] || fallback.border,
                    textPrimary: colors['--theme-text-primary'] || fallback.textPrimary,
                    textSecondary: colors['--theme-text-secondary'] || fallback.textSecondary,
                    backgroundImage: ''
                };
            }

            var customFields = [
                { key: 'bgPrimary', label: t('Fondo principal') },
                { key: 'bgSecondary', label: t('Paneles') },
                { key: 'bgTertiary', label: t('Botones y superficies') },
                { key: 'border', label: t('Bordes') },
                { key: 'textPrimary', label: t('Texto principal') },
                { key: 'textSecondary', label: t('Texto secundario') }
            ];
            var workingCustomTheme = getSavedCustomBase();
            var colorInputs = {};
            var colorValueLabels = {};
            var previewShell;
            var previewTop;
            var previewBottom;
            var previewPill;
            var previewTitle;
            var previewDesc;

            function updateCustomPreview() {
                if (!previewShell) return;
                var preview = window.HaxThemes && window.HaxThemes.previewCustomTheme
                    ? window.HaxThemes.previewCustomTheme(workingCustomTheme)
                    : {
                        '--theme-bg-primary': workingCustomTheme.bgPrimary,
                        '--theme-bg-secondary': workingCustomTheme.bgSecondary,
                        '--theme-bg-tertiary': workingCustomTheme.bgTertiary,
                        '--theme-border': workingCustomTheme.border,
                        '--theme-border-light': workingCustomTheme.border,
                        '--theme-text-primary': workingCustomTheme.textPrimary,
                        '--theme-text-secondary': workingCustomTheme.textSecondary,
                        '--theme-app-background-image': (window.HaxThemes && window.HaxThemes.getAppWallpaper && window.HaxThemes.getAppWallpaper())
                            ? 'url("' + String(window.HaxThemes.getAppWallpaper()).replace(/"/g, '\\"') + '")'
                            : 'none'
                    };

                previewShell.style.background = preview['--theme-bg-primary'];
                previewShell.style.backgroundImage = preview['--theme-app-background-image'] || 'none';
                previewShell.style.backgroundSize = 'cover';
                previewShell.style.backgroundPosition = 'center';
                previewShell.style.borderColor = preview['--theme-border'];
                previewTop.style.background = preview['--theme-bg-secondary'];
                previewTop.style.borderColor = preview['--theme-border-light'] || preview['--theme-border'];
                previewBottom.style.background = preview['--theme-bg-tertiary'];
                previewBottom.style.borderColor = preview['--theme-border'];
                previewBottom.style.color = preview['--theme-text-primary'];
                previewPill.style.background = preview['--theme-bg-hover'] || preview['--theme-bg-tertiary'];
                previewPill.style.color = preview['--theme-text-primary'];
                previewTitle.style.color = preview['--theme-text-primary'];
                previewDesc.style.color = preview['--theme-text-secondary'];
            }

            function syncCustomEditorFields() {
                for (var i = 0; i < customFields.length; i++) {
                    var field = customFields[i];
                    if (colorInputs[field.key]) {
                        colorInputs[field.key].value = workingCustomTheme[field.key];
                    }
                    if (colorValueLabels[field.key]) {
                        colorValueLabels[field.key].textContent = String(workingCustomTheme[field.key] || '').toUpperCase();
                    }
                }
                updateCustomPreview();
            }

            function syncWallpaperPanel() {
                if (!backgroundStatus) return;
                var w = window.HaxThemes && window.HaxThemes.getAppWallpaper ? window.HaxThemes.getAppWallpaper() : '';
                backgroundStatus.textContent = String(w || '').trim() ? t('Imagen cargada') : t('Sin imagen');
                updateCustomPreview();
            }

            function optimizeWallpaperFile(file, done) {
                var maxW = 1280;
                var maxH = 720;
                var quality = 0.72;

                function fallbackRead() {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        done(String(evt && evt.target && evt.target.result || ''));
                    };
                    reader.readAsDataURL(file);
                }

                try {
                    var img = new Image();
                    var objectUrl = URL.createObjectURL(file);
                    img.onload = function() {
                        try {
                            var w = img.naturalWidth || img.width;
                            var h = img.naturalHeight || img.height;
                            if (!w || !h) {
                                URL.revokeObjectURL(objectUrl);
                                fallbackRead();
                                return;
                            }

                            var scale = Math.min(1, maxW / w, maxH / h);
                            var outW = Math.max(1, Math.round(w * scale));
                            var outH = Math.max(1, Math.round(h * scale));
                            var canvas = doc.createElement('canvas');
                            canvas.width = outW;
                            canvas.height = outH;
                            var ctx = canvas.getContext('2d', { alpha: false });
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'medium';
                            ctx.drawImage(img, 0, 0, outW, outH);
                            URL.revokeObjectURL(objectUrl);
                            done(canvas.toDataURL('image/jpeg', quality));
                        } catch (eCanvas) {
                            try {
                                URL.revokeObjectURL(objectUrl);
                            } catch (eRevoke) {}
                            fallbackRead();
                        }
                    };
                    img.onerror = function() {
                        try {
                            URL.revokeObjectURL(objectUrl);
                        } catch (eRevoke2) {}
                        fallbackRead();
                    };
                    img.src = objectUrl;
                } catch (eImg) {
                    fallbackRead();
                }
            }

            function createActionButton(text, primary) {
                var button = doc.createElement('button');
                button.textContent = text;
                button.type = 'button';
                button.style.cssText = 'padding:8px 12px;border-radius:6px;border:1px solid var(--theme-border, #232323);cursor:pointer;font-size:11px;font-weight:600;transition:opacity .12s;background:' + (primary ? 'var(--theme-bg-tertiary, #272727)' : 'transparent') + ';color:var(--theme-text-primary, #fff);';
                button.onmouseenter = function() { button.style.opacity = '0.9'; };
                button.onmouseleave = function() { button.style.opacity = '1'; };
                return button;
            }

            for (var key in themes) {
                var option = doc.createElement('div');
                option.className = 'theme-option' + (key === currentTheme ? ' selected' : '');
                option.setAttribute('data-theme', key);
                optionMap[key] = option;

                var textWrapper = doc.createElement('div');
                textWrapper.className = 'theme-text';

                var name = doc.createElement('span');
                name.className = 'theme-name';
                name.textContent = themes[key].name;
                textWrapper.appendChild(name);

                if (themeDescs[key]) option.title = themeDescs[key];

                option.appendChild(textWrapper);

                var check = doc.createElement('div');
                check.className = 'theme-check';
                check.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
                option.appendChild(check);

                option.addEventListener('click', (function(themeKey) {
                    return function() {
                        setSelectedTheme(themeKey);
                        if (window.HaxThemes) {
                            window.HaxThemes.apply(themeKey);
                        }
                    };
                })(key));

                themeOptions.appendChild(option);
            }

            var customIntro = doc.createElement('div');
            customIntro.style.cssText = 'margin-bottom:8px;color:var(--theme-text-muted);font-size:11px;line-height:1.4;';
            customIntro.textContent = t('Theme custom short hint');

            previewShell = doc.createElement('div');
            previewShell.style.cssText = 'padding:10px;border:1px solid var(--theme-border, #232323);border-radius:8px;margin-bottom:10px;transition:background .15s,border-color .15s;';

            previewTop = doc.createElement('div');
            previewTop.style.cssText = 'border:1px solid var(--theme-border-light, #333);border-radius:6px;padding:8px 10px;margin-bottom:8px;';

            previewPill = doc.createElement('span');
            previewPill.style.cssText = 'display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:600;margin-bottom:6px;';
            previewPill.textContent = t('Preview del tema');
            previewTop.appendChild(previewPill);

            previewTitle = doc.createElement('div');
            previewTitle.style.cssText = 'font-size:13px;font-weight:600;margin-bottom:2px;';
            previewTitle.textContent = 'HaxBall Zero';
            previewTop.appendChild(previewTitle);

            previewDesc = doc.createElement('div');
            previewDesc.style.cssText = 'font-size:11px;line-height:1.35;color:var(--theme-text-secondary);';
            previewDesc.textContent = t('Así se van a ver los paneles, botones y textos principales.');
            previewTop.appendChild(previewDesc);

            previewBottom = doc.createElement('div');
            previewBottom.style.cssText = 'border:1px solid var(--theme-border, #232323);border-radius:6px;padding:8px 10px;';
            previewBottom.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><div><div style="color:inherit;font-size:12px;font-weight:600;">' + t('Botón destacado') + '</div><div style="color:inherit;font-size:10px;opacity:.75;margin-top:1px;">' + t('Vista rápida del estilo general') + '</div></div><div style="padding:6px 10px;border-radius:6px;background:rgba(255,255,255,.08);font-size:11px;font-weight:600;">OK</div></div>';

            previewShell.appendChild(previewTop);
            previewShell.appendChild(previewBottom);

            var grid = doc.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px 10px;';

            for (var fieldIndex = 0; fieldIndex < customFields.length; fieldIndex++) {
                (function(field) {
                    var row = doc.createElement('div');
                    row.style.cssText = 'padding:8px 10px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;';

                    var labelRow = doc.createElement('div');
                    labelRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;';

                    var label = doc.createElement('div');
                    label.style.cssText = 'color:var(--theme-text-primary, #fff);font-size:11px;font-weight:600;';
                    label.textContent = field.label;

                    var value = doc.createElement('div');
                    value.style.cssText = 'color:var(--theme-text-secondary, #888);font-size:10px;font-family:monospace;';

                    var input = doc.createElement('input');
                    input.type = 'color';
                    input.value = workingCustomTheme[field.key];
                    input.style.cssText = 'width:100%;height:32px;border:none;border-radius:4px;background:transparent;cursor:pointer;padding:0;';
                    input.addEventListener('input', function() {
                        workingCustomTheme[field.key] = input.value;
                        value.textContent = String(input.value || '').toUpperCase();
                        updateCustomPreview();
                    });

                    colorInputs[field.key] = input;
                    colorValueLabels[field.key] = value;

                    labelRow.appendChild(label);
                    labelRow.appendChild(value);
                    row.appendChild(labelRow);
                    row.appendChild(input);
                    grid.appendChild(row);
                })(customFields[fieldIndex]);
            }

            var backgroundBlock = doc.createElement('div');
            backgroundBlock.style.cssText = 'padding:10px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;';

            var backgroundHeader = doc.createElement('div');
            backgroundHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;';

            var backgroundLabel = doc.createElement('div');
            backgroundLabel.style.cssText = 'color:var(--theme-text-primary, #fff);font-size:11px;font-weight:600;';
            backgroundLabel.textContent = t('Fondo de pantalla');

            var backgroundStatus = doc.createElement('div');
            backgroundStatus.style.cssText = 'color:var(--theme-text-secondary, #888);font-size:10px;';

            backgroundHeader.appendChild(backgroundLabel);
            backgroundHeader.appendChild(backgroundStatus);
            backgroundBlock.appendChild(backgroundHeader);

            var backgroundHint = doc.createElement('div');
            backgroundHint.style.cssText = 'color:var(--theme-text-muted);font-size:10px;line-height:1.35;margin-bottom:8px;';
            backgroundHint.textContent = t('Theme wallpaper short hint');
            backgroundBlock.appendChild(backgroundHint);

            var hiddenBackgroundInput = doc.createElement('input');
            hiddenBackgroundInput.type = 'file';
            hiddenBackgroundInput.accept = 'image/*';
            hiddenBackgroundInput.style.display = 'none';
            hiddenBackgroundInput.addEventListener('change', function() {
                var file = hiddenBackgroundInput.files && hiddenBackgroundInput.files[0];
                if (!file) return;
                backgroundStatus.textContent = 'Optimizando...';
                optimizeWallpaperFile(file, function(data) {
                    if (window.HaxThemes && window.HaxThemes.setAppWallpaper) {
                        window.HaxThemes.setAppWallpaper(data);
                    }
                    syncWallpaperPanel();
                });
            });

            var backgroundActions = doc.createElement('div');
            backgroundActions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

            var pickBackgroundBtn = createActionButton(t('Elegir imagen'), false);
            pickBackgroundBtn.onclick = function() {
                hiddenBackgroundInput.click();
            };

            var clearBackgroundBtn = createActionButton(t('Quitar imagen'), false);
            clearBackgroundBtn.onclick = function() {
                hiddenBackgroundInput.value = '';
                if (window.HaxThemes && window.HaxThemes.clearAppWallpaper) {
                    window.HaxThemes.clearAppWallpaper();
                }
                syncWallpaperPanel();
            };

            backgroundActions.appendChild(pickBackgroundBtn);
            backgroundActions.appendChild(clearBackgroundBtn);
            backgroundBlock.appendChild(backgroundActions);
            backgroundBlock.appendChild(hiddenBackgroundInput);

            var actionRow = doc.createElement('div');
            actionRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;';

            var useCurrentBtn = createActionButton(t('Usar tema actual como base'), false);
            useCurrentBtn.onclick = function() {
                var themeKey = window.HaxThemes ? window.HaxThemes.getCurrent() : currentTheme;
                workingCustomTheme = mapThemeColorsToBase(themeKey);
                syncCustomEditorFields();
            };

            var resetBtn = createActionButton(t('Restaurar colores'), false);
            resetBtn.onclick = function() {
                workingCustomTheme = getDefaultCustomBase();
                syncCustomEditorFields();
            };

            var applyBtn = createActionButton(t('Aplicar personalizado'), true);
            applyBtn.onclick = function() {
                if (window.HaxThemes && window.HaxThemes.setCustomThemeBase) {
                    window.HaxThemes.setCustomThemeBase(workingCustomTheme);
                    window.HaxThemes.apply('custom');
                }
                setSelectedTheme('custom');
            };

            actionRow.appendChild(useCurrentBtn);
            actionRow.appendChild(resetBtn);
            actionRow.appendChild(applyBtn);

            var guideLine = doc.createElement('div');
            guideLine.style.cssText = 'font-size:11px;color:var(--theme-text-muted);line-height:1.38;';
            guideLine.textContent = t('Theme tab intro line');

            panelPresets.appendChild(themeOptions);
            panelWallpaper.appendChild(backgroundBlock);
            panelCustom.appendChild(customIntro);
            panelCustom.appendChild(previewShell);
            panelCustom.appendChild(grid);
            panelCustom.appendChild(actionRow);

            container.appendChild(glassCard);
            container.appendChild(guideLine);
            container.appendChild(segWrap);
            container.appendChild(panelPresets);
            container.appendChild(panelWallpaper);
            container.appendChild(panelCustom);
            themeSection.appendChild(container);
            syncCustomEditorFields();
            syncWallpaperPanel();

            var dialogContent = dialog.querySelector('.section') || dialog;
            dialogContent.parentNode.insertBefore(themeSection, dialogContent.nextSibling);

            themeBtn.addEventListener('click', function() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                }
                themeSection.style.display = 'block';
                applyDefaultDialogSize();

                try { glassSw.checked = localStorage.getItem(GLASS_LS) === '1'; } catch (eG4) {}
                syncGlassUiDoc();

                if (window.HaxThemes) {
                    setSelectedTheme(window.HaxThemes.getCurrent());
                    workingCustomTheme = getSavedCustomBase();
                    syncCustomEditorFields();
                    syncWallpaperPanel();
                    window.HaxThemes.apply(window.HaxThemes.getCurrent());
                }

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                themeBtn.classList.add('selected');
            });

            window.addEventListener('themeChanged', function(evt) {
                var themeKey = evt && evt.detail ? evt.detail.theme : null;
                if (themeKey) {
                    setSelectedTheme(themeKey);
                }
            });

            var originalTabs = tabs.querySelectorAll('button:not([data-hook="themebtn"])');
            for (var tabIndex = 0; tabIndex < originalTabs.length; tabIndex++) {
                originalTabs[tabIndex].addEventListener('click', function() {
                    themeSection.style.display = 'none';
                    applyDefaultDialogSize();
                    var sections = dialog.querySelectorAll('.tabcontents > .section');
                    for (var j = 0; j < sections.length; j++) {
                        if (sections[j] !== themeSection) {
                            sections[j].style.display = '';
                        }
                    }
                });
            }

            syncGlassUiDoc();

            return themeBtn;
        }

        function createAvatarTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="avatarbtn"]')) return;

            var avatarBtn = doc.createElement('button');
            avatarBtn.setAttribute('data-hook', 'avatarbtn');
            avatarBtn.textContent = t('Avatares');
            avatarBtn.style.display = 'none';
            tabs.appendChild(avatarBtn);

            var avatarSection = doc.createElement('section');
            avatarSection.className = 'section';
            avatarSection.setAttribute('data-hook', 'avatarsec');
            avatarSection.style.display = 'none';

            var STORAGE_KEY = 'quick_avatars';
            var bindings = [];

            function loadBindings() {
                try {
                    bindings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                } catch (e) {
                    bindings = [];
                }
                if (!Array.isArray(bindings)) bindings = [];
                return bindings;
            }

            function saveBindings(bindings) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
            }

            function formatKeyLabel(code) {
                if (!code) return t('Clique para definir tecla');
                return code.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num');
            }

            function renderAvatarSection() {
                loadBindings();

                var html = '<div style="padding:16px 20px;">' +
                    '<div style="margin-bottom:20px;color:var(--theme-text-secondary, #888);font-size:13px;line-height:1.5;">' + t('Defina teclas de atalho para trocar de avatar rapidamente durante o jogo.') + '</div>';

                if (bindings.length > 0) {
                    html += '<div style="margin-bottom:16px;">';
                    for (var i = 0; i < bindings.length; i++) {
                        var b = bindings[i];
                        var keyDisplay = formatKeyLabel(b.key);
                        html += '<div class="inputrow quick-avatar-row" data-index="' + i + '" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;margin-bottom:8px;">' +
                            '<div style="min-width:50px;padding:6px 12px;background:var(--theme-bg-tertiary, #272727);border-radius:4px;text-align:center;color:var(--theme-text-primary, #fff);font-weight:600;font-size:13px;">' + keyDisplay + '</div>' +
                            '<div style="flex:1;color:var(--theme-text-primary, #fff);font-size:14px;">' + (b.avatar || '<span style="color:var(--theme-text-muted, #666);">(' + t('vazio') + ')</span>') + '</div>' +
                            '<button class="edit-avatar-btn" data-index="' + i + '" style="padding:6px 12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:12px;transition:background 0.15s;">' + t('Editar') + '</button>' +
                            '<button class="remove-avatar-btn" data-index="' + i + '" style="padding:6px 10px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:#ff4444;cursor:pointer;transition:background 0.15s;"><i class="icon-cancel"></i></button>' +
                            '</div>';
                    }
                    html += '</div>';
                }

                html += '<button id="add-avatar-binding" style="padding:10px 16px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;transition:background 0.15s;width:100%;">' +
                    '<i class="icon-plus"></i> ' + t('Adicionar atalho') +
                    '</button></div>';

                avatarSection.innerHTML = html;

                var removeButtons = avatarSection.querySelectorAll('.remove-avatar-btn');
                for (var r = 0; r < removeButtons.length; r++) {
                    (function(btn) {
                        btn.onmouseenter = function () { btn.style.background = 'var(--theme-bg-hover, #333)'; };
                        btn.onmouseleave = function () { btn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                        btn.onclick = function () {
                            var idx = parseInt(btn.dataset.index, 10);
                            bindings.splice(idx, 1);
                            saveBindings(bindings);
                            renderAvatarSection();
                        };
                    })(removeButtons[r]);
                }

                var editButtons = avatarSection.querySelectorAll('.edit-avatar-btn');
                for (var e = 0; e < editButtons.length; e++) {
                    (function(btn) {
                        btn.onmouseenter = function () { btn.style.background = 'var(--theme-bg-hover, #333)'; };
                        btn.onmouseleave = function () { btn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                        btn.onclick = function () {
                            var idx = parseInt(btn.dataset.index, 10);
                            showEditDialog(idx);
                        };
                    })(editButtons[e]);
                }

                var addBtn = avatarSection.querySelector('#add-avatar-binding');
                if (addBtn) {
                    addBtn.onmouseenter = function () { addBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                    addBtn.onmouseleave = function () { addBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                    addBtn.onclick = function () {
                        showEditDialog(-1);
                    };
                }
            }

            function showEditDialog(index) {
                var isNew = index === -1;
                var binding = isNew ? { key: '', avatar: '' } : bindings[index];

                var existing = doc.getElementById('avatar-edit-dialog');
                if (existing) existing.remove();

                var overlay = doc.createElement('div');
                overlay.id = 'avatar-edit-dialog';
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:10001;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';

                var modal = doc.createElement('div');
                modal.style.cssText = 'background:var(--theme-bg-primary, #141414);border:1px solid var(--theme-border, #232323);border-radius:8px;padding:24px;min-width:340px;box-shadow:0 8px 32px rgba(0,0,0,0.5);';

                modal.innerHTML = '<h2 style="color:var(--theme-text-primary, #fff);font-size:18px;font-weight:600;margin:0 0 20px 0;text-align:center;">' + (isNew ? t('Novo Atalho') : t('Editar Atalho')) + '</h2>' +
                    '<div style="margin-bottom:16px;">' +
                    '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Tecla de Atalho') + '</label>' +
                    '<button id="key-capture-btn" style="width:100%;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;text-align:center;font-size:14px;transition:all 0.15s;">' + (binding.key ? formatKeyLabel(binding.key) : t('Clique para definir tecla')) + '</button>' +
                    '</div>' +
                    '<div style="margin-bottom:20px;">' +
                    '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Avatar (emoji ou texto)') + '</label>' +
                    '<input id="avatar-input" type="text" value="' + (binding.avatar || '') + '" maxlength="2" style="width:100%;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:6px;color:var(--theme-text-primary, #fff);font-size:18px;text-align:center;box-sizing:border-box;outline:none;transition:border-color 0.15s;" placeholder="🎮">' +
                    '</div>' +
                    '<div style="display:flex;gap:10px;">' +
                    '<button id="cancel-avatar-btn" style="flex:1;padding:12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:14px;transition:background 0.15s;">' + t('Cancelar') + '</button>' +
                    '<button id="save-avatar-btn" style="flex:1;padding:12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:14px;font-weight:600;transition:background 0.15s;">' + t('Salvar') + '</button>' +
                    '</div>';

                overlay.appendChild(modal);
                doc.body.appendChild(overlay);

                var capturedKey = binding.key;
                var keyBtn = modal.querySelector('#key-capture-btn');
                var avatarInput = modal.querySelector('#avatar-input');
                var cancelBtn = modal.querySelector('#cancel-avatar-btn');
                var saveBtn = modal.querySelector('#save-avatar-btn');

                keyBtn.onmouseenter = function () { if (keyBtn.style.borderColor !== 'rgb(245, 158, 11)') keyBtn.style.background = 'var(--theme-bg-hover, #222)'; };
                keyBtn.onmouseleave = function () { if (keyBtn.style.borderColor !== 'rgb(245, 158, 11)') keyBtn.style.background = 'var(--theme-bg-secondary, #1a1a1a)'; };
                avatarInput.onfocus = function () { avatarInput.style.borderColor = 'var(--theme-border-light, #444)'; };
                avatarInput.onblur = function () { avatarInput.style.borderColor = 'var(--theme-border-light, #333)'; };
                cancelBtn.onmouseenter = function () { cancelBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                cancelBtn.onmouseleave = function () { cancelBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                saveBtn.onmouseenter = function () { saveBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                saveBtn.onmouseleave = function () { saveBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };

                keyBtn.onclick = function () {
                    keyBtn.textContent = t('Pressione uma tecla...');
                    keyBtn.style.borderColor = '#f59e0b';
                    keyBtn.style.background = '#1a1a1a';

                    var keyHandler = function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        var ignored = ['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
                        if (ignored.indexOf(event.code) !== -1) {
                            keyBtn.textContent = t('Tecla inválida, tente outra');
                            keyBtn.style.borderColor = '#ff4444';
                            setTimeout(function () {
                                keyBtn.textContent = binding.key ? formatKeyLabel(binding.key) : t('Clique para definir tecla');
                                keyBtn.style.borderColor = '#333';
                            }, 1500);
                            return;
                        }

                        capturedKey = event.code;
                        keyBtn.textContent = formatKeyLabel(event.code);
                        keyBtn.style.borderColor = '#333';
                        doc.removeEventListener('keydown', keyHandler, true);
                    };

                    doc.addEventListener('keydown', keyHandler, true);
                };

                cancelBtn.onclick = function () {
                    overlay.remove();
                };

                saveBtn.onclick = function () {
                    var avatar = avatarInput.value.trim();

                    if (!capturedKey) {
                        keyBtn.style.borderColor = '#ff4444';
                        keyBtn.style.background = '#1a1a1a';
                        setTimeout(function () {
                            keyBtn.style.borderColor = '#333';
                        }, 1500);
                        return;
                    }

                    if (isNew) {
                        bindings.push({ key: capturedKey, avatar: avatar });
                    } else {
                        bindings[index] = { key: capturedKey, avatar: avatar };
                    }

                    saveBindings(bindings);
                    overlay.remove();
                    renderAvatarSection();
                };

                overlay.onclick = function (event) {
                    if (event.target === overlay) overlay.remove();
                };
            }

            avatarBtn.addEventListener('click', function() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                    sections[i].classList.remove('selected');
                }
                avatarSection.style.display = 'block';
                avatarSection.classList.add('selected');

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                avatarBtn.classList.add('selected');
                renderAvatarSection();
            });

            var originalTabs = tabs.querySelectorAll('button:not([data-hook="avatarbtn"])');
            for (var i = 0; i < originalTabs.length; i++) {
                (function(button) {
                    button.addEventListener('click', function() {
                        avatarBtn.classList.remove('selected');
                        avatarSection.style.display = 'none';
                        avatarSection.classList.remove('selected');

                        var hook = button.getAttribute('data-hook');
                        if (hook) {
                            var defaultSection = dialog.querySelector('.tabcontents .section[data-hook="' + hook.replace('btn', 'sec') + '"]');
                            if (defaultSection) {
                                setTimeout(function () {
                                    if (!defaultSection.classList.contains('selected')) {
                                        var allSections = dialog.querySelectorAll('.tabcontents .section');
                                        for (var s = 0; s < allSections.length; s++) {
                                            allSections[s].classList.remove('selected');
                                            allSections[s].style.display = 'none';
                                        }
                                        defaultSection.classList.add('selected');
                                        defaultSection.style.display = '';
                                    }
                                }, 50);
                            }
                        }
                    }, true);
                })(originalTabs[i]);
            }

            if (avatarBtn.classList.contains('selected')) {
                renderAvatarSection();
            }

            var tabContents = dialog.querySelector('.tabcontents');
            if (tabContents) {
                tabContents.appendChild(avatarSection);
            } else {
                var dialogContent = dialog.querySelector('.section') || dialog;
                dialogContent.parentNode.insertBefore(avatarSection, dialogContent.nextSibling);
            }
            return avatarBtn;
        }

        function createTokenTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="tokenbtn"]')) return;

            var tokenBtn = doc.createElement('button');
            tokenBtn.setAttribute('data-hook', 'tokenbtn');
            tokenBtn.textContent = t('Host Token');
            tokenBtn.style.display = 'none';
            tabs.appendChild(tokenBtn);

            var tokenSection = doc.createElement('section');
            tokenSection.className = 'section';
            tokenSection.setAttribute('data-hook', 'tokensec');
            tokenSection.style.display = 'none';

            var STORAGE_KEY = 'haxball_host_token';

            function renderTokenSection() {
                var currentToken = '';
                try {
                    currentToken = localStorage.getItem(STORAGE_KEY) || '';
                } catch (e) {
                    currentToken = '';
                }

                var html = '<div style="padding:16px 20px;">' +
                    '<div style="margin-bottom:14px;color:var(--theme-text-secondary, #888);font-size:13px;line-height:1.5;">' + t('Configure seu host token para criar salas sem captcha.') + '</div>' +
                    '<div style="margin-bottom:16px;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;color:var(--theme-text-secondary, #888);font-size:12px;line-height:1.55;">' +
                    '<div style="margin-bottom:6px;color:var(--theme-text-primary, #fff);font-weight:600;">' + t('Cómo sacar tu Host Token') + '</div>' +
                    '<div>1. ' + t('Entrá al link oficial de HaxBall.') + '</div>' +
                    '<div>2. ' + t('Iniciá sesión y generá tu token.') + '</div>' +
                    '<div>3. ' + t('Copialo y pegalo acá abajo.') + '</div>' +
                    '<div style="margin-top:8px;"><a href="https://www.haxball.com/headlesstoken" target="_blank" rel="noreferrer" style="color:#8b5cf6;text-decoration:none;">https://www.haxball.com/headlesstoken</a></div>' +
                    '</div>' +
                    '<div style="margin-bottom:16px;">' +
                    '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Host Token') + '</label>' +
                    '<input id="host-token-input" type="text" value="' + (currentToken || '') + '" placeholder="' + t('Cole seu host token aqui') + '" style="width:100%;padding:8px 10px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:4px;color:var(--theme-text-primary, #fff);font-size:13px;box-sizing:border-box;outline:none;transition:border-color 0.15s;font-family:monospace;" />' +
                    '</div>' +
                    '<div style="display:flex;gap:10px;">' +
                    '<button id="clear-token-btn" style="flex:1;padding:10px 16px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:13px;transition:background 0.15s;">' + t('Limpar') + '</button>' +
                    '<button id="save-token-btn" style="flex:1;padding:10px 16px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:13px;font-weight:600;transition:background 0.15s;">' + t('Salvar') + '</button>' +
                    '</div></div>';

                tokenSection.innerHTML = html;

                var tokenInput = tokenSection.querySelector('#host-token-input');
                var clearBtn = tokenSection.querySelector('#clear-token-btn');
                var saveBtn = tokenSection.querySelector('#save-token-btn');
                var officialLink = tokenSection.querySelector('a[href="https://www.haxball.com/headlesstoken"]');

                tokenInput.onfocus = function () { tokenInput.style.borderColor = 'var(--theme-border-light, #444)'; };
                tokenInput.onblur = function () { tokenInput.style.borderColor = 'var(--theme-border-light, #333)'; };
                clearBtn.onmouseenter = function () { clearBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                clearBtn.onmouseleave = function () { clearBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                saveBtn.onmouseenter = function () { saveBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                saveBtn.onmouseleave = function () { saveBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };

                if (officialLink) {
                    officialLink.style.cursor = 'pointer';
                    officialLink.onclick = function (event) {
                        event.preventDefault();
                        var url = officialLink.href;
                        if (typeof window.__hxdOpenExternalUrl === 'function') {
                            window.__hxdOpenExternalUrl(url);
                        } else {
                            try {
                                if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
                                    window.electronAPI.openExternal(url);
                                } else {
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }
                            } catch (e) {}
                        }
                        return false;
                    };
                }

                clearBtn.onclick = function () {
                    tokenInput.value = '';
                    try {
                        localStorage.removeItem(STORAGE_KEY);
                    } catch (e) {}
                    tokenInput.style.borderColor = '#333';
                };

                saveBtn.onclick = function () {
                    var token = tokenInput.value.trim();
                    try {
                        if (token) {
                            localStorage.setItem(STORAGE_KEY, token);
                        } else {
                            localStorage.removeItem(STORAGE_KEY);
                        }
                        tokenInput.style.borderColor = '#4ade80';
                        setTimeout(function () {
                            tokenInput.style.borderColor = '#333';
                        }, 1000);
                    } catch (e) {
                        tokenInput.style.borderColor = '#ff4444';
                        setTimeout(function () {
                            tokenInput.style.borderColor = '#333';
                        }, 1000);
                    }
                };

                tokenInput.onkeydown = function (event) {
                    if (event.key === 'Enter') {
                        saveBtn.click();
                    }
                };
            }

            tokenBtn.addEventListener('click', function() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                    sections[i].classList.remove('selected');
                }
                tokenSection.style.display = 'block';
                tokenSection.classList.add('selected');

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                tokenBtn.classList.add('selected');
                renderTokenSection();
            });

            var tokenOtherTabs = tabs.querySelectorAll('button:not([data-hook="tokenbtn"])');
            for (var tIndex = 0; tIndex < tokenOtherTabs.length; tIndex++) {
                (function(button) {
                    button.addEventListener('click', function() {
                        tokenBtn.classList.remove('selected');
                        tokenSection.style.display = 'none';
                        tokenSection.classList.remove('selected');

                        var hook = button.getAttribute('data-hook');
                        if (hook) {
                            var defaultSection = dialog.querySelector('.tabcontents .section[data-hook="' + hook.replace('btn', 'sec') + '"]');
                            if (defaultSection) {
                                setTimeout(function () {
                                    if (!defaultSection.classList.contains('selected')) {
                                        var allSections = dialog.querySelectorAll('.tabcontents .section');
                                        for (var s = 0; s < allSections.length; s++) {
                                            allSections[s].classList.remove('selected');
                                            allSections[s].style.display = 'none';
                                        }
                                        defaultSection.classList.add('selected');
                                        defaultSection.style.display = '';
                                    }
                                }, 50);
                            }
                        }
                    }, true);
                })(tokenOtherTabs[tIndex]);
            }

            if (tokenBtn.classList.contains('selected')) {
                renderTokenSection();
            }

            var tokenTabContents = dialog.querySelector('.tabcontents');
            if (tokenTabContents) {
                tokenTabContents.appendChild(tokenSection);
            } else {
                var tokenDialogContent = dialog.querySelector('.section') || dialog;
                tokenDialogContent.parentNode.insertBefore(tokenSection, tokenDialogContent.nextSibling);
            }
            return tokenBtn;
        }

        function createMultiAuthTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="multiauthbtn"]')) return;

            var multiAuthBtn = doc.createElement('button');
            multiAuthBtn.setAttribute('data-hook', 'multiauthbtn');
            multiAuthBtn.textContent = t('Multi-Auth');
            multiAuthBtn.style.display = 'none';
            tabs.appendChild(multiAuthBtn);

            var multiAuthSection = doc.createElement('section');
            multiAuthSection.className = 'section';
            multiAuthSection.setAttribute('data-hook', 'multiauth-section');
            multiAuthSection.style.display = 'none';

            var STORAGE_KEY = 'haxdesk_multi_auths';
            var CURRENT_AUTH_KEY = 'player_auth_key';

            function getMaxAuths() {
                return 999;
            }

            function getStoredAuths() {
                try {
                    var data = localStorage.getItem(STORAGE_KEY);
                    return data ? JSON.parse(data) : [];
                } catch (e) {
                    return [];
                }
            }

            function saveAuths(auths) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(auths));
            }

            function getCurrentAuth() {
                return localStorage.getItem(CURRENT_AUTH_KEY) || '';
            }

            function setCurrentAuth(authKey) {
                if (authKey) {
                    localStorage.setItem(CURRENT_AUTH_KEY, authKey);
                    try {
                        if (typeof window.__haxSetPlayerAuth === 'function') {
                            window.__haxSetPlayerAuth(authKey);
                        }
                    } catch (eSetAuth) {}
                }
            }

            function truncateAuth(auth) {
                if (!auth || auth.length < 20) return auth || '';
                return auth.substring(0, 8) + '...' + auth.substring(auth.length - 8);
            }

            function isValidAuth(auth) {
                if (!auth || typeof auth !== 'string') return false;
                var parts = auth.split('.');
                return parts.length === 4 && parts[0].length > 0;
            }

            function copyTextToClipboard(text, onOk) {
                if (!text) return;
                function done() {
                    if (typeof onOk === 'function') onOk();
                }
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(text).then(done).catch(function() {
                        fallbackCopy(text, done);
                    });
                } else {
                    fallbackCopy(text, done);
                }
            }

            function fallbackCopy(text, onOk) {
                try {
                    var ta = doc.createElement('textarea');
                    ta.value = text;
                    ta.setAttribute('readonly', '');
                    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
                    doc.body.appendChild(ta);
                    ta.select();
                    doc.execCommand('copy');
                    doc.body.removeChild(ta);
                    if (typeof onOk === 'function') onOk();
                } catch (eFc) {}
            }

            function renderSection() {
                multiAuthSection.innerHTML = '';

                var container = doc.createElement('div');
                container.style.cssText = 'padding:14px 16px 18px;display:flex;flex-direction:column;gap:18px;box-sizing:border-box;';

                var headerBlock = doc.createElement('div');
                headerBlock.style.cssText = 'padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.06);';

                var headerKicker = doc.createElement('div');
                headerKicker.style.cssText = 'font-size:11px;color:var(--theme-text-muted);letter-spacing:0.03em;text-transform:uppercase;margin-bottom:10px;';
                headerKicker.textContent = t('Multi-auth en uso');
                headerBlock.appendChild(headerKicker);

                var headerRow = doc.createElement('div');
                headerRow.style.cssText = 'display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;justify-content:space-between;';

                var headerTextCol = doc.createElement('div');
                headerTextCol.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;';

                var headerPreview = doc.createElement('div');
                headerPreview.style.cssText = 'font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.45;color:var(--theme-text-primary);word-break:break-all;';

                var headerNameEl = doc.createElement('div');
                headerNameEl.style.cssText = 'font-size:11px;color:var(--theme-text-muted);';

                headerTextCol.appendChild(headerPreview);
                headerTextCol.appendChild(headerNameEl);

                var copyCurrentBtn = doc.createElement('button');
                copyCurrentBtn.type = 'button';
                copyCurrentBtn.textContent = t('Copiar auth');
                copyCurrentBtn.style.cssText =
                    'flex-shrink:0;margin-top:1px;padding:6px 12px;font-size:11px;font-weight:500;color:var(--theme-text-secondary);background:transparent;border:1px solid var(--theme-border);border-radius:8px;cursor:pointer;transition:background .15s,border-color .15s,color .15s;';
                copyCurrentBtn.onmouseenter = function() {
                    copyCurrentBtn.style.background = 'rgba(255,255,255,0.04)';
                    copyCurrentBtn.style.borderColor = 'var(--theme-border-light,#3a3a3a)';
                    copyCurrentBtn.style.color = 'var(--theme-text-primary)';
                };
                copyCurrentBtn.onmouseleave = function() {
                    copyCurrentBtn.style.background = 'transparent';
                    copyCurrentBtn.style.borderColor = 'var(--theme-border)';
                    copyCurrentBtn.style.color = 'var(--theme-text-secondary)';
                };
                copyCurrentBtn.onclick = function() {
                    var full = getCurrentAuth();
                    if (!full) {
                        if (window.showToast) window.showToast(t('Auth copiar vacía'), 'info', 2200);
                        return;
                    }
                    copyTextToClipboard(full, function() {
                        if (window.showToast) window.showToast(t('Auth copiada'), 'success', 2000);
                    });
                };

                headerRow.appendChild(headerTextCol);
                headerRow.appendChild(copyCurrentBtn);
                headerBlock.appendChild(headerRow);
                container.appendChild(headerBlock);

                function updateHeader() {
                    var current = getCurrentAuth();
                    var authsList = getStoredAuths();
                    var found = null;
                    for (var hi = 0; hi < authsList.length; hi++) {
                        if (authsList[hi].key === current) {
                            found = authsList[hi];
                            break;
                        }
                    }
                    if (current) {
                        headerPreview.textContent = truncateAuth(current);
                        headerNameEl.textContent = found && found.name ? found.name : '';
                        headerNameEl.style.display = found && found.name ? 'block' : 'none';
                        copyCurrentBtn.style.display = '';
                    } else {
                        headerPreview.textContent = t('Nenhuma auth ativa. Auths ilimitadas.');
                        headerNameEl.textContent = '';
                        headerNameEl.style.display = 'none';
                        copyCurrentBtn.style.display = 'none';
                    }
                }

                var listContainer = doc.createElement('div');
                listContainer.style.cssText = 'display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;padding-right:2px;';

                function renderAuthList() {
                    listContainer.innerHTML = '';
                    var auths = getStoredAuths();
                    var currentAuth = getCurrentAuth();

                    if (auths.length === 0) {
                        var emptyMsg = doc.createElement('div');
                        emptyMsg.style.cssText = 'color:var(--theme-text-muted);font-size:12px;line-height:1.5;padding:16px 4px;text-align:left;';
                        emptyMsg.textContent = t('Nenhuma auth salva. Adicione uma abaixo.');
                        listContainer.appendChild(emptyMsg);
                        return;
                    }

                    for (var index = 0; index < auths.length; index++) {
                        (function(authObj, authIndex) {
                            var row = doc.createElement('div');
                            var isActive = authObj.key === currentAuth;
                            row.style.cssText =
                                'display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:8px;border:1px solid ' +
                                (isActive ? 'rgba(255,255,255,0.14)' : 'var(--theme-border)') +
                                ';background:' +
                                (isActive ? 'rgba(255,255,255,0.04)' : 'transparent') +
                                ';transition:border-color .12s,background .12s;';

                            var info = doc.createElement('div');
                            info.style.cssText = 'flex:1;min-width:0;';

                            var name = doc.createElement('div');
                            name.style.cssText = 'color:var(--theme-text-primary);font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                            name.textContent = authObj.name || (t('Auth ') + (authIndex + 1));
                            info.appendChild(name);

                            var keyPreview = doc.createElement('div');
                            keyPreview.style.cssText = 'color:var(--theme-text-muted);font-size:10px;font-family:ui-monospace,Consolas,monospace;margin-top:2px;';
                            keyPreview.textContent = truncateAuth(authObj.key);
                            info.appendChild(keyPreview);

                            row.appendChild(info);

                            var rowBtns = doc.createElement('div');
                            rowBtns.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0;';

                            if (!isActive) {
                                var useBtn = doc.createElement('button');
                                useBtn.type = 'button';
                                useBtn.style.cssText =
                                    'padding:5px 10px;font-size:11px;color:var(--theme-text-secondary);background:transparent;border:1px solid var(--theme-border);border-radius:8px;cursor:pointer;';
                                useBtn.textContent = t('Usar');
                                useBtn.onmouseenter = function() {
                                    useBtn.style.background = 'rgba(255,255,255,0.05)';
                                };
                                useBtn.onmouseleave = function() {
                                    useBtn.style.background = 'transparent';
                                };
                                useBtn.onclick = function() {
                                    setCurrentAuth(authObj.key);
                                    updateHeader();
                                    renderAuthList();
                                    if (window.showToast) {
                                        window.showToast(t('Auth alterada!'), 'success');
                                    }
                                };
                                rowBtns.appendChild(useBtn);
                            }

                            var removeBtn = doc.createElement('button');
                            removeBtn.type = 'button';
                            removeBtn.setAttribute('aria-label', t('Remover'));
                            removeBtn.title = t('Remover');
                            removeBtn.style.cssText =
                                'padding:5px 8px;font-size:11px;color:var(--theme-text-muted);background:transparent;border:1px solid transparent;border-radius:8px;cursor:pointer;line-height:0;';
                            removeBtn.innerHTML =
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                            removeBtn.onmouseenter = function() {
                                removeBtn.style.borderColor = 'var(--theme-border)';
                                removeBtn.style.color = '#f87171';
                            };
                            removeBtn.onmouseleave = function() {
                                removeBtn.style.borderColor = 'transparent';
                                removeBtn.style.color = 'var(--theme-text-muted)';
                            };
                            removeBtn.onclick = function() {
                                var authsList = getStoredAuths().filter(function(_, i) { return i !== authIndex; });
                                saveAuths(authsList);
                                renderAuthList();
                                updateHeader();
                                if (window.showToast) {
                                    window.showToast(t('Auth removida'), 'info');
                                }
                            };
                            rowBtns.appendChild(removeBtn);
                            row.appendChild(rowBtns);

                            listContainer.appendChild(row);
                        })(auths[index], index);
                    }
                }

                container.appendChild(listContainer);

                var addSection = doc.createElement('div');
                addSection.style.cssText = 'padding-top:4px;border-top:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;gap:10px;';

                var addLabel = doc.createElement('div');
                addLabel.style.cssText = 'color:var(--theme-text-muted);font-size:11px;font-weight:500;letter-spacing:0.02em;';
                addLabel.textContent = t('Adicionar Nova Auth');
                addSection.appendChild(addLabel);

                var nameInput = doc.createElement('input');
                nameInput.type = 'text';
                nameInput.placeholder = t('Nome (opcional)');
                nameInput.style.cssText =
                    'width:100%;padding:9px 11px;background:transparent;border:1px solid var(--theme-border);border-radius:8px;color:var(--theme-text-primary);font-size:12px;box-sizing:border-box;outline:none;';
                addSection.appendChild(nameInput);

                var authInput = doc.createElement('input');
                authInput.type = 'text';
                authInput.placeholder = t('Auth Key (ex: idkey.xxx.xxx.xxx)');
                authInput.style.cssText =
                    'width:100%;padding:9px 11px;background:transparent;border:1px solid var(--theme-border);border-radius:8px;color:var(--theme-text-primary);font-size:12px;box-sizing:border-box;outline:none;font-family:ui-monospace,Consolas,monospace;';
                addSection.appendChild(authInput);

                var btnRow = doc.createElement('div');
                btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:2px;';

                var addBtn = doc.createElement('button');
                addBtn.type = 'button';
                addBtn.style.cssText =
                    'flex:1;min-width:120px;padding:9px 12px;background:transparent;border:1px solid var(--theme-border);border-radius:8px;color:var(--theme-text-primary);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;';
                addBtn.innerHTML =
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>' +
                    t('Adicionar') +
                    '</span>';
                addBtn.onmouseenter = function() {
                    addBtn.style.background = 'rgba(255,255,255,0.05)';
                };
                addBtn.onmouseleave = function() {
                    addBtn.style.background = 'transparent';
                };
                addBtn.onclick = function() {
                    var authKey = authInput.value.trim();
                    var authName = nameInput.value.trim();
                    var authsList = getStoredAuths();

                    if (!authKey) {
                        if (window.showToast) window.showToast(t('Digite uma auth key'), 'error');
                        return;
                    }
                    if (!isValidAuth(authKey)) {
                        if (window.showToast) window.showToast(t('Formato inválido. Use: idkey.xxx.xxx.xxx'), 'error');
                        return;
                    }
                    if (authsList.some(function(a) { return a.key === authKey; })) {
                        if (window.showToast) window.showToast(t('Esta auth já está salva'), 'error');
                        return;
                    }
                    if (authsList.length >= getMaxAuths()) {
                        if (window.showToast) {
                            window.showToast(t('Sem limite de auths.'), 'info');
                        }
                        return;
                    }

                    authsList.push({ name: authName || '', key: authKey });
                    saveAuths(authsList);
                    authInput.value = '';
                    nameInput.value = '';
                    renderAuthList();
                    updateHeader();
                    if (window.showToast) window.showToast(t('Auth adicionada!'), 'success');
                };
                btnRow.appendChild(addBtn);

                var saveCurrentBtn = doc.createElement('button');
                saveCurrentBtn.type = 'button';
                saveCurrentBtn.style.cssText =
                    'padding:9px 14px;background:transparent;border:1px solid var(--theme-border);border-radius:8px;color:var(--theme-text-secondary);font-size:12px;font-weight:500;cursor:pointer;';
                saveCurrentBtn.textContent = t('Salvar Atual');
                saveCurrentBtn.onmouseenter = function() {
                    saveCurrentBtn.style.background = 'rgba(255,255,255,0.05)';
                    saveCurrentBtn.style.color = 'var(--theme-text-primary)';
                };
                saveCurrentBtn.onmouseleave = function() {
                    saveCurrentBtn.style.background = 'transparent';
                    saveCurrentBtn.style.color = 'var(--theme-text-secondary)';
                };
                saveCurrentBtn.onclick = function() {
                    var currentAuth = getCurrentAuth();
                    var authsList = getStoredAuths();
                    if (!currentAuth) {
                        if (window.showToast) window.showToast(t('Nenhuma auth atual para salvar'), 'error');
                        return;
                    }
                    if (authsList.some(function(a) { return a.key === currentAuth; })) {
                        if (window.showToast) window.showToast(t('Auth atual já está salva'), 'info');
                        return;
                    }
                    if (authsList.length >= getMaxAuths()) {
                        if (window.showToast) {
                            window.showToast(t('Sem limite de auths.'), 'info');
                        }
                        return;
                    }

                    var authName = nameInput.value.trim() || (t('Auth ') + (authsList.length + 1));
                    authsList.push({ name: authName, key: currentAuth });
                    saveAuths(authsList);
                    nameInput.value = '';
                    renderAuthList();
                    updateHeader();
                    if (window.showToast) window.showToast(t('Auth atual salva!'), 'success');
                };
                btnRow.appendChild(saveCurrentBtn);

                addSection.appendChild(btnRow);
                container.appendChild(addSection);

                var tip = doc.createElement('div');
                tip.style.cssText = 'color:var(--theme-text-muted);font-size:11px;line-height:1.45;margin-top:2px;';
                tip.textContent = t('Após trocar de auth, feche e abra o app para aplicar.');
                container.appendChild(tip);

                multiAuthSection.appendChild(container);
                updateHeader();
                renderAuthList();
            }

            function openMultiAuthTab() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                    sections[i].classList.remove('selected');
                }
                var themeSection = dialog.querySelector('[data-hook="theme-section"]');
                if (themeSection) themeSection.style.display = 'none';
                var perfSection = dialog.querySelector('[data-hook="perf-section"]');
                if (perfSection) perfSection.style.display = 'none';
                var extrapSection = dialog.querySelector('[data-hook="extrapolation-section"]');
                if (extrapSection) extrapSection.style.display = 'none';
                var chatShortcutsMa = dialog.querySelector('[data-hook="chat-shortcuts-section"]');
                if (chatShortcutsMa) {
                    chatShortcutsMa.style.display = 'none';
                    chatShortcutsMa.classList.remove('selected');
                }
                var resolutionSection = dialog.querySelector('[data-hook="resolution-section"]');
                if (resolutionSection) resolutionSection.style.display = 'none';
                var soundHubEl = dialog.querySelector('[data-hook="sound-hub-section"]');
                if (soundHubEl) {
                    soundHubEl.style.display = 'none';
                    soundHubEl.classList.remove('selected');
                }

                renderSection();
                multiAuthSection.style.display = 'block';
                multiAuthSection.classList.add('selected');
                applyDefaultDialogSize();

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                multiAuthBtn.classList.add('selected');
            }

            multiAuthBtn.__customSidebarOpen = openMultiAuthTab;
            multiAuthBtn.addEventListener('click', openMultiAuthTab);

            var originalTabs = tabs.querySelectorAll('button:not([data-hook="multiauthbtn"])');
            for (var tIndex = 0; tIndex < originalTabs.length; tIndex++) {
                originalTabs[tIndex].addEventListener('click', function() {
                    multiAuthSection.style.display = 'none';
                    multiAuthSection.classList.remove('selected');
                });
            }

            var tabContents = dialog.querySelector('.tabcontents');
            if (tabContents) {
                tabContents.appendChild(multiAuthSection);
            } else {
                var dialogContent = dialog.querySelector('.section') || dialog;
                dialogContent.parentNode.insertBefore(multiAuthSection, dialogContent.nextSibling);
            }

            return multiAuthBtn;
        }

        function ensureHxdPerfExportFootStyles(doc) {
            if (doc.getElementById('hxd-perf-export-foot-styles')) return;
            var s = doc.createElement('style');
            s.id = 'hxd-perf-export-foot-styles';
            s.textContent = [
                '.hxd-perf-foot{margin-top:6px;padding-top:16px;border-top:1px solid var(--theme-border);}',
                '.hxd-perf-foot__head{font-size:13px;font-weight:500;color:var(--theme-text-secondary);margin:0 0 10px 2px;}',
                '.hxd-perf-foot__btns{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;}',
                '.hxd-perf-foot__btn{flex:1;padding:11px 12px;background:var(--theme-bg-secondary);border:1px solid var(--theme-border);border-radius:8px;color:var(--theme-text-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;font-weight:500;transition:background .15s ease,border-color .15s ease;}',
                '.hxd-perf-foot__btn:hover{background:var(--theme-bg-hover);}',
                '.hxd-perf-foot__tip{color:var(--theme-text-muted);font-size:10px;margin-top:8px;line-height:1.45;padding-left:2px;}'
            ].join('');
            doc.head.appendChild(s);
        }

        // Cria a aba de desempenho customizada
        function createPerfTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="perfbtn"]')) return;

            ensureHxdPerfExportFootStyles(doc);

            var perfBtn = doc.createElement('button');
            perfBtn.setAttribute('data-hook', 'perfbtn');
            perfBtn.textContent = t('Desempenho');
            perfBtn.style.display = 'none';
            tabs.appendChild(perfBtn);

            var perfSection = doc.createElement('section');
            perfSection.className = 'perf-section section';
            perfSection.setAttribute('data-hook', 'perf-section');
            perfSection.style.display = 'none';

            // Descrições das opções
            var PERF_OPTIONS = [
                {
                    hook: 'tmisc-simplelines',
                    title: t('Linhas simplificadas'),
                    desc: t('Reduz a espessura das linhas do campo de 3px para 1px. Menos pixels para desenhar.')
                },
                {
                    hook: 'tmisc-ultrasimplelines',
                    title: t('Curvas viram retas'),
                    desc: t('Converte todas as linhas curvas em retas. Desenhar retas é muito mais rápido que curvas.')
                },
                {
                    hook: 'tmisc-culling',
                    title: t('Culling de viewport'),
                    desc: t('Não desenha objetos fora da tela. Em mapas grandes, evita renderizar o que você não vê.')
                },
                {
                    hook: 'tmisc-showavatars',
                    title: t('Desativar avatares e cores'),
                    desc: t('Remove avatares personalizados e usa cores padrão dos times. Menos texturas.')
                },
                {
                    hook: 'tmisc-shownames',
                    title: t('Desativar nomes'),
                    desc: t('Esconde os nomes dos jogadores. Menos texto para renderizar.')
                },
                {
                    hook: 'tmisc-simplefield',
                    title: t('Campo simplificado'),
                    desc: t('Usa cores sólidas no campo ao invés de gradientes. Renderização mais simples.')
                },
                {
                    hook: 'tmisc-lowqualitycircles',
                    title: t('Círculos de baixa qualidade'),
                    desc: t('Pré-renderiza os círculos. Mais rápido mas visual pixelado.')
                },
                {
                    hook: 'tvideo-lowlatency',
                    title: t('Perf opt low latency title'),
                    desc: t('Perf opt low latency desc')
                },
                {
                    hook: 'tvideo-teamcol',
                    title: t('Perf opt team colors title'),
                    desc: t('Perf opt team colors desc')
                },
                {
                    hook: 'tmisc-showanimations',
                    title: t('Desativar animações de gol'),
                    desc: t('Remove as animações quando um gol é marcado. Evita quedas de FPS momentâneas.')
                },
                {
                    hook: 'tmisc-showindicator',
                    title: t('Desativar indicador do jogador'),
                    desc: t('O círculo que mostra onde você está. Economiza um pouco de renderização.')
                },
                {
                    hook: 'tmisc-showchat',
                    title: t('Desativar indicador de chat'),
                    desc: t('O balão que aparece quando alguém fala. Remove essa renderização extra.')
                },
                {
                    hook: 'tmisc-highpriority',
                    title: t('Alta prioridade'),
                    desc: t('Dá mais recursos do sistema para o jogo. Pode travar outros programas. Use com cuidado!'),
                    warning: true
                }
            ];

            var PERF_GROUPS = [
                {
                    key: 'field',
                    title: t('Campo y render'),
                    desc: t('Controla líneas, curvas y elementos base del mapa.'),
                    hooks: ['tmisc-simplelines', 'tmisc-ultrasimplelines', 'tmisc-culling', 'tmisc-simplefield']
                },
                {
                    key: 'players',
                    title: t('Jugadores y HUD'),
                    desc: t('Reduce nombres, avatares, indicadores y animaciones visibles.'),
                    hooks: ['tmisc-showavatars', 'tmisc-shownames', 'tmisc-showanimations', 'tmisc-showindicator', 'tmisc-showchat']
                },
                {
                    key: 'quality',
                    title: t('Calidad visual'),
                    desc: t('Ajustes que simplifican el dibujo y alivian la carga gráfica.'),
                    hooks: ['tmisc-lowqualitycircles', 'tvideo-lowlatency', 'tvideo-teamcol']
                },
                {
                    key: 'system',
                    title: t('Sistema'),
                    desc: t('Opciones sensibles que impactan más fuerte en el rendimiento.'),
                    hooks: ['tmisc-highpriority']
                }
            ];

            var container = doc.createElement('div');
            container.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

            function findPerfToggleEl(hookName) {
                var miscSection = dialog.querySelector('[data-hook="miscsec"]');
                if (miscSection) {
                    var mEl = miscSection.querySelector('[data-hook="' + hookName + '"]');
                    if (mEl) return mEl;
                }
                var videoSection = dialog.querySelector('[data-hook="videosec"]');
                if (videoSection) {
                    var vEl = videoSection.querySelector('[data-hook="' + hookName + '"]');
                    if (vEl) return vEl;
                }
                return null;
            }

            var perfRowsByHook = {};

            function createPerfOptionRow(opt) {
                var row = doc.createElement('div');
                row.className = 'perf-option-row';
                row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;';
                row.setAttribute('data-perf-hook', opt.hook);

                row.onmouseenter = function() { row.style.background = 'var(--theme-bg-hover)'; };
                row.onmouseleave = function() { row.style.background = ''; };

                // Checkbox visual
                var checkbox = doc.createElement('div');
                checkbox.className = 'perf-checkbox';
                checkbox.style.cssText = 'width:18px;height:18px;border:2px solid var(--theme-border-light);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;';
                checkbox.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="opacity:0;"><polyline points="20 6 9 17 4 12"/></svg>';

                // Texto
                var textDiv = doc.createElement('div');
                textDiv.style.cssText = 'flex:1;min-width:0;';

                var titleRow = doc.createElement('div');
                titleRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:2px;';

                var title = doc.createElement('span');
                title.style.cssText = 'color:var(--theme-text-primary);font-size:13px;font-weight:500;';
                title.textContent = opt.title;
                titleRow.appendChild(title);

                if (opt.warning) {
                    var warning = doc.createElement('span');
                    warning.style.cssText = 'color:#f59e0b;font-size:10px;font-weight:600;padding:2px 6px;background:rgba(245,158,11,0.15);border-radius:4px;';
                    warning.textContent = t('Cuidado');
                    titleRow.appendChild(warning);
                }

                textDiv.appendChild(titleRow);

                var desc = doc.createElement('div');
                desc.style.cssText = 'color:var(--theme-text-muted);font-size:11px;line-height:1.4;';
                desc.textContent = opt.desc;
                textDiv.appendChild(desc);

                row.appendChild(checkbox);
                row.appendChild(textDiv);

                // Click handler - encontra e clica no toggle original
                (function(hookName) {
                    row.onclick = function() {
                        var originalToggle = findPerfToggleEl(hookName);
                        if (originalToggle) {
                            originalToggle.click();
                            setTimeout(updatePerfCheckboxes, 100);
                        }
                    };
                })(opt.hook);

                return row;
            }

            PERF_OPTIONS.forEach(function(opt) {
                perfRowsByHook[opt.hook] = createPerfOptionRow(opt);
            });

            var guideLine = doc.createElement('div');
            guideLine.style.cssText = 'font-size:11px;color:var(--theme-text-muted);line-height:1.38;';
            guideLine.textContent = t('Perf tab intro line');

            var segWrap = doc.createElement('div');
            segWrap.style.cssText = 'display:flex;gap:0;margin-bottom:2px;padding:3px;border-radius:10px;background:var(--theme-bg-secondary);border:1px solid var(--theme-border);';
            var perfPanels = {};
            var activePerfSeg = PERF_GROUPS[0].key;
            var perfSegBtns = {};
            function refreshPerfSegUi() {
                for (var psi = 0; psi < PERF_GROUPS.length; psi++) {
                    var gk = PERF_GROUPS[psi].key;
                    var btn = perfSegBtns[gk];
                    if (btn) {
                        var sel = activePerfSeg === gk;
                        btn.style.background = sel ? 'var(--theme-bg-tertiary)' : 'transparent';
                        btn.style.color = sel ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)';
                    }
                    if (perfPanels[gk]) perfPanels[gk].style.display = activePerfSeg === gk ? 'block' : 'none';
                }
            }
            function makePerfSegBtn(segKey, segLabel) {
                var pb = doc.createElement('button');
                pb.type = 'button';
                pb.textContent = segLabel;
                pb.style.cssText = 'flex:1;padding:9px 4px;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:background .12s,color .12s;background:transparent;color:var(--theme-text-secondary);';
                (function(kk) {
                    pb.onclick = function() {
                        activePerfSeg = kk;
                        refreshPerfSegUi();
                    };
                })(segKey);
                perfSegBtns[segKey] = pb;
                return pb;
            }
            for (var sbi = 0; sbi < PERF_GROUPS.length; sbi++) {
                var gMeta = PERF_GROUPS[sbi];
                segWrap.appendChild(makePerfSegBtn(gMeta.key, gMeta.title));
            }
            for (var pni = 0; pni < PERF_GROUPS.length; pni++) {
                var pg = PERF_GROUPS[pni];
                var pnel = doc.createElement('div');
                pnel.style.cssText = 'display:none;max-height:min(52vh,420px);overflow-y:auto;padding:2px 4px 2px 0;';
                perfPanels[pg.key] = pnel;
                for (var hix = 0; hix < pg.hooks.length; hix++) {
                    var hname = pg.hooks[hix];
                    if (perfRowsByHook[hname]) pnel.appendChild(perfRowsByHook[hname]);
                }
            }
            refreshPerfSegUi();

            container.appendChild(guideLine);
            container.appendChild(segWrap);
            for (var cpi = 0; cpi < PERF_GROUPS.length; cpi++) {
                container.appendChild(perfPanels[PERF_GROUPS[cpi].key]);
            }

            // ============================================
            // BOTÕES DE EXPORT/IMPORT DE CONFIGURAÇÕES
            // ============================================
            var exportImportSection = doc.createElement('div');
            exportImportSection.className = 'hxd-perf-foot';
            var exportHead = doc.createElement('div');
            exportHead.className = 'hxd-perf-foot__head';
            exportHead.textContent = t('Copia y respaldo');
            exportImportSection.appendChild(exportHead);
            var exportBtns = doc.createElement('div');
            exportBtns.className = 'hxd-perf-foot__btns';

            // Export/import: módulo global `hxd-performance.js` (manifest + runtime); fallback si no cargó.
            var PERF_STORAGE_KEYS_FALLBACK = [
                'simple_lines', 'ultra_simple_lines', 'culling_enabled', 'viewport_culling',
                'show_avatars', 'team_colors', 'show_names', 'simple_field',
                'low_quality_circles', 'show_animations', 'show_indicator',
                'show_player_indicator', 'show_chat_indicator', 'show_indicators', 'high_priority',
                'canvas_boost_scale',
                'fps_limit', 'resolution_scale', 'viewmode', 'view_mode',
                'quality_mode', 'input_tolerance', 'hxd_input_tolerance_unlock', 'low_latency_canvas',
                'stretched_resolution',
                'hax_max_perf_mode', 'hax_max_perf_snapshot',
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
                'sound_main', 'sound_chat', 'sound_highlight', 'sound_crowd',
                'sound_kick', 'sound_goal', 'sound_join', 'sound_leave', 'sound_volume',
                'chat_height', 'chat_focus_height', 'chat_opacity', 'chat_bg_mode',
                'image_smoothing', 'extrapolation',
                'hxd_ui_scoreboard_opacity', 'hxd_ui_chatbox_opacity',
                'haxball-theme',
                'haxball-user-theme',
                'haxball-user-themes',
                'haxball_language',
                'hax_verified_disabled',
                'hax_zero_zoom',
                'hax_glass_ui'
            ];

            function perfSnapshotKeyList() {
                if (window.HxdPerformance && Array.isArray(window.HxdPerformance.SNAPSHOT_KEYS)) {
                    return window.HxdPerformance.SNAPSHOT_KEYS;
                }
                return PERF_STORAGE_KEYS_FALLBACK;
            }

            function generatePerfCode() {
                if (window.HxdPerformance && typeof window.HxdPerformance.encodeExport === 'function') {
                    return window.HxdPerformance.encodeExport() || '';
                }
                var keys = perfSnapshotKeyList();
                var config = {};
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    try {
                        var val = localStorage.getItem(key);
                        if (val !== null) config[key] = val;
                    } catch (e) {}
                }
                try {
                    return btoa(JSON.stringify(config)).replace(/=/g, '');
                } catch (e2) {
                    return '';
                }
            }

            function applyPerfCode(code) {
                if (window.HxdPerformance && typeof window.HxdPerformance.applyImport === 'function') {
                    return window.HxdPerformance.applyImport(code, { replaceKnown: true });
                }
                try {
                    var padded = String(code || '').trim();
                    while (padded.length % 4 !== 0) padded += '=';
                    var config = JSON.parse(atob(padded));
                    if (!config || typeof config !== 'object') return false;
                    var keys = perfSnapshotKeyList();
                    for (var c = 0; c < keys.length; c++) {
                        try {
                            localStorage.removeItem(keys[c]);
                        } catch (eR) {}
                    }
                    for (var key in config) {
                        if (Object.prototype.hasOwnProperty.call(config, key) && keys.indexOf(key) !== -1) {
                            try {
                                localStorage.setItem(key, String(config[key]));
                            } catch (eS) {}
                        }
                    }
                    try {
                        if (typeof window.__hxdApplyRuntimeConfig === 'function') window.__hxdApplyRuntimeConfig(config);
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('resize'));
                    } catch (eLive) {}
                    return true;
                } catch (e) {
                    return false;
                }
            }

            function setImportExportState(button, html, borderColor, timeoutMs) {
                button.innerHTML = html;
                button.style.borderColor = borderColor || '';
                setTimeout(function() {
                    button.innerHTML = button.__originalHtml || button.innerHTML;
                    button.style.borderColor = '';
                }, timeoutMs || 2000);
            }

            function readImportCode() {
                var promptLabel = t('Pegá acá el código exportado');
                function fromPrompt() {
                    var manual = window.prompt(promptLabel, '');
                    return String(manual || '').trim();
                }
                if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
                    return Promise.resolve(fromPrompt());
                }
                return navigator.clipboard.readText().then(function(code) {
                    code = String(code || '').trim();
                    if (code) return code;
                    return fromPrompt();
                }).catch(function() {
                    return fromPrompt();
                });
            }

            // Botão de Export (copia código)
            var exportBtn = doc.createElement('button');
            exportBtn.type = 'button';
            exportBtn.className = 'hxd-perf-foot__btn';
            exportBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' + t('Exportar');
            exportBtn.__originalHtml = exportBtn.innerHTML;
            exportBtn.onclick = function() {
                var code = generatePerfCode();
                navigator.clipboard.writeText(code).then(function() {
                    setImportExportState(exportBtn, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' + t('Copiado!'), '#22c55e', 2000);
                });
            };

            // Botão de Import (cola código)
            var importBtn = doc.createElement('button');
            importBtn.type = 'button';
            importBtn.className = 'hxd-perf-foot__btn';
            importBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' + t('Importar');
            importBtn.__originalHtml = importBtn.innerHTML;
            importBtn.onclick = function() {
                readImportCode().then(function(code) {
                    code = code.trim();
                    if (!code) {
                        setImportExportState(importBtn, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' + t('No se ingresó ningún código'), '#dc2626', 2200);
                        return;
                    }
                    if (applyPerfCode(code)) {
                        setImportExportState(importBtn, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' + t('Aplicado! Recarregue'), '#22c55e', 3000);
                        setTimeout(function() {
                            window.location.reload();
                        }, 450);
                    } else {
                        setImportExportState(importBtn, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' + t('Código inválido'), '#dc2626', 2000);
                    }
                });
            };

            exportBtns.appendChild(exportBtn);
            exportBtns.appendChild(importBtn);
            exportImportSection.appendChild(exportBtns);
            container.appendChild(exportImportSection);

            var exportImportTip = doc.createElement('div');
            exportImportTip.className = 'hxd-perf-foot__tip';
            exportImportTip.textContent = t('hxd_perf_export_tip');
            container.appendChild(exportImportTip);

            perfSection.appendChild(container);

            // Função para sincronizar checkboxes
            function updatePerfCheckboxes() {
                PERF_OPTIONS.forEach(function(opt) {
                    var perfRow = perfSection.querySelector('[data-perf-hook="' + opt.hook + '"]');
                    if (!perfRow) return;

                    var originalToggle = findPerfToggleEl(opt.hook);
                    if (!originalToggle) return;

                    var perfCheckbox = perfRow.querySelector('.perf-checkbox');
                    if (!perfCheckbox) return;
                    var svg = perfCheckbox.querySelector('svg');
                    if (!svg) return;

                    // Verifica se o toggle está ativo - busca qualquer <i> dentro do toggle
                    var icons = originalToggle.getElementsByTagName('i');
                    var isToggleActive = false;
                    for (var i = 0; i < icons.length; i++) {
                        if (icons[i].classList.contains('icon-ok')) {
                            isToggleActive = true;
                            break;
                        }
                    }

                    // Algumas opções são invertidas (mostrar = desativado para performance)
                    var isInverted = ['tmisc-showavatars', 'tmisc-shownames', 'tmisc-showanimations', 'tmisc-showindicator', 'tmisc-showchat'].indexOf(opt.hook) !== -1;
                    var isActive = isInverted ? !isToggleActive : isToggleActive;

                    if (isActive) {
                        perfCheckbox.style.background = '#22c55e';
                        perfCheckbox.style.borderColor = '#22c55e';
                        svg.style.opacity = '1';
                        svg.style.stroke = '#fff';
                    } else {
                        perfCheckbox.style.background = '';
                        perfCheckbox.style.borderColor = '';
                        svg.style.opacity = '0';
                    }
                });
            }

            // Insere a seção
            var dialogContent = dialog.querySelector('.section') || dialog;
            dialogContent.parentNode.insertBefore(perfSection, dialogContent.nextSibling);

            // Handler para mostrar a seção
            perfBtn.addEventListener('click', function() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                }
                var themeSection = dialog.querySelector('[data-hook="theme-section"]');
                if (themeSection) themeSection.style.display = 'none';

                perfSection.style.display = 'block';
                applyDefaultDialogSize();
                updatePerfCheckboxes();

                var allTabs = tabs.querySelectorAll('button');
                for (var i = 0; i < allTabs.length; i++) {
                    allTabs[i].classList.remove('selected');
                }
                perfBtn.classList.add('selected');
            });

            // Esconde quando outras tabs são clicadas
            var originalTabs = tabs.querySelectorAll('button:not([data-hook="perfbtn"])');
            for (var i = 0; i < originalTabs.length; i++) {
                originalTabs[i].addEventListener('click', function() {
                    perfSection.style.display = 'none';
                });
            }

            return perfBtn;
        }

        function createChatShortcutsTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="shortcutsbtn"]')) return;

            var shortcutsBtn = doc.createElement('button');
            shortcutsBtn.setAttribute('data-hook', 'shortcutsbtn');
            shortcutsBtn.textContent = t('shortcuts');
            shortcutsBtn.style.display = 'none';
            tabs.appendChild(shortcutsBtn);

            var shortcutsSection = doc.createElement('section');
            shortcutsSection.className = 'chat-shortcuts-section section';
            shortcutsSection.setAttribute('data-hook', 'chat-shortcuts-section');
            shortcutsSection.style.display = 'none';

            var CHAT_SC_STORAGE = 'hax_chat_command_shortcuts';

            function escAttr(v) {
                return String(v || '')
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            function normalizeShortcutList(raw) {
                var list = [];
                try {
                    list = JSON.parse(raw || '[]');
                } catch (e1) {
                    list = [];
                }
                if (!Array.isArray(list)) list = [];
                return list
                    .filter(function(row) {
                        return row != null && typeof row === 'object';
                    })
                    .map(function(row) {
                        return { trigger: String(row.trigger || '').trim(), expansion: String(row.expansion || '').trim() };
                    });
            }

            function loadShortcutList() {
                try {
                    return normalizeShortcutList(localStorage.getItem(CHAT_SC_STORAGE));
                } catch (e2) {
                    return [];
                }
            }

            function saveShortcutList(list) {
                try {
                    localStorage.setItem(CHAT_SC_STORAGE, JSON.stringify(list));
                } catch (e3) {}
            }

            function renderShortcutsSection() {
                var list = loadShortcutList();
                var html =
                    '<div style="padding:16px 20px;">' +
                    '<h2 style="color:var(--theme-text-primary,#fff);font-size:17px;font-weight:700;margin:0 0 10px 0;">' +
                    t('shortcuts') +
                    '</h2>' +
                    '<p style="margin:0 0 18px 0;color:var(--theme-text-secondary,#888);font-size:13px;line-height:1.55;">' +
                    t('Shortcuts tab intro') +
                    '</p>' +
                    '<div style="max-height:min(360px,52vh);overflow-y:auto;padding-right:4px;margin-bottom:12px;">';

                for (var i = 0; i < list.length; i++) {
                    var row = list[i];
                    html +=
                        '<div class="hxd-chat-shortcut-row" data-index="' +
                        i +
                        '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;background:var(--theme-bg-secondary,#1a1a1a);border:1px solid var(--theme-border,#333);border-radius:8px;">' +
                        '<input type="text" data-field="trigger" value="' +
                        escAttr(row.trigger) +
                        '" style="flex:0 0 120px;min-width:0;padding:8px 10px;background:#141414;border:1px solid #444;border-radius:6px;color:#fff;font-size:13px;box-sizing:border-box;" />' +
                        '<span style="color:#fff;flex-shrink:0;font-size:14px;">→</span>' +
                        '<input type="text" data-field="expansion" value="' +
                        escAttr(row.expansion) +
                        '" style="flex:1;min-width:0;padding:8px 10px;background:#141414;border:1px solid #444;border-radius:6px;color:#fff;font-size:13px;box-sizing:border-box;" />' +
                        '<button type="button" class="hxd-cs-del" data-index="' +
                        i +
                        '" style="flex-shrink:0;padding:8px 10px;background:var(--theme-bg-tertiary,#272727);border:none;border-radius:6px;color:#ff6b6b;cursor:pointer;"><i class="icon-cancel"></i></button>' +
                        '</div>';
                }

                html +=
                    '</div>' +
                    '<button type="button" data-hook="hxd-cs-add" style="width:100%;padding:12px 16px;background:#2b4560;border:none;border-radius:8px;color:#fff;font-weight:600;font-size:14px;cursor:pointer;">' +
                    t('Create new shortcut btn') +
                    '</button>' +
                    '<p style="margin:12px 0 0 0;color:var(--theme-text-muted);font-size:10px;line-height:1.45;">' +
                    t('Shortcuts tab foot') +
                    '</p>' +
                    '</div>';

                shortcutsSection.innerHTML = html;

                var inputs = shortcutsSection.querySelectorAll('.hxd-chat-shortcut-row input');
                for (var ii = 0; ii < inputs.length; ii++) {
                    (function (inp) {
                        inp.addEventListener('change', function () {
                            var rowEl = inp.closest('.hxd-chat-shortcut-row');
                            if (!rowEl) return;
                            var idx = parseInt(rowEl.getAttribute('data-index'), 10);
                            var cur = loadShortcutList();
                            if (!cur[idx]) return;
                            var trig = rowEl.querySelector('[data-field="trigger"]');
                            var exp = rowEl.querySelector('[data-field="expansion"]');
                            cur[idx].trigger = trig ? trig.value.trim() : '';
                            cur[idx].expansion = exp ? exp.value.trim() : '';
                            saveShortcutList(cur);
                        });
                    })(inputs[ii]);
                }

                var dels = shortcutsSection.querySelectorAll('.hxd-cs-del');
                for (var d = 0; d < dels.length; d++) {
                    (function (btn) {
                        btn.addEventListener('click', function () {
                            var idx = parseInt(btn.getAttribute('data-index'), 10);
                            var cur = loadShortcutList();
                            cur.splice(idx, 1);
                            saveShortcutList(cur);
                            renderShortcutsSection();
                        });
                    })(dels[d]);
                }

                var addB = shortcutsSection.querySelector('[data-hook="hxd-cs-add"]');
                if (addB) {
                    addB.onclick = function () {
                        var cur = loadShortcutList();
                        cur.push({ trigger: '', expansion: '' });
                        saveShortcutList(cur);
                        renderShortcutsSection();
                    };
                }
            }

            shortcutsBtn.addEventListener('click', function () {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var si = 0; si < sections.length; si++) {
                    sections[si].style.display = 'none';
                    sections[si].classList.remove('selected');
                }
                var themeSection = dialog.querySelector('[data-hook="theme-section"]');
                if (themeSection) themeSection.style.display = 'none';
                var perfSection = dialog.querySelector('[data-hook="perf-section"]');
                if (perfSection) perfSection.style.display = 'none';
                var extrapSection = dialog.querySelector('[data-hook="extrapolation-section"]');
                if (extrapSection) extrapSection.style.display = 'none';
                var resolutionSection = dialog.querySelector('[data-hook="resolution-section"]');
                if (resolutionSection) resolutionSection.style.display = 'none';
                var soundHubEl = dialog.querySelector('[data-hook="sound-hub-section"]');
                if (soundHubEl) {
                    soundHubEl.style.display = 'none';
                    soundHubEl.classList.remove('selected');
                }

                shortcutsSection.style.display = 'block';
                shortcutsSection.classList.add('selected');
                applyDefaultDialogSize();
                renderShortcutsSection();

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                shortcutsBtn.classList.add('selected');
            });

            var originalTabs = tabs.querySelectorAll('button:not([data-hook="shortcutsbtn"])');
            for (var ti = 0; ti < originalTabs.length; ti++) {
                originalTabs[ti].addEventListener('click', function () {
                    shortcutsSection.style.display = 'none';
                    shortcutsSection.classList.remove('selected');
                });
            }

            var tabContentsSc = dialog.querySelector('.tabcontents');
            if (tabContentsSc) {
                tabContentsSc.appendChild(shortcutsSection);
            } else {
                var dialogContentSc = dialog.querySelector('.section') || dialog;
                dialogContentSc.parentNode.insertBefore(shortcutsSection, dialogContentSc.nextSibling);
            }

            return shortcutsBtn;
        }

        function createExtrapolationTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="extrapbtn"]')) return;

            var extrapBtn = doc.createElement('button');
            extrapBtn.setAttribute('data-hook', 'extrapbtn');
            extrapBtn.textContent = t('Extrapolation');
            extrapBtn.style.display = 'none';
            tabs.appendChild(extrapBtn);

            var extrapSection = doc.createElement('section');
            extrapSection.className = 'extrapolation-section section';
            extrapSection.setAttribute('data-hook', 'extrapolation-section');
            extrapSection.style.display = 'none';

            var STORAGE_KEY = 'hax_extrapolation_binds';
            var LEGACY_KEY = 'hax_extrapolation_bind_key';
            var LEGACY_VALUE = 'hax_extrapolation_bind_value';

            function formatKeyLabel(code) {
                if (!code) return t('Clique para definir tecla');
                return code.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num');
            }

            function clampValue(value) {
                value = parseInt(value, 10);
                if (isNaN(value)) value = 0;
                if (value < -200) value = -200;
                if (value > 1000) value = 1000;
                return value;
            }

            function loadBindings() {
                var list = [];
                try {
                    list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                } catch (e) {
                    list = [];
                }
                if (!Array.isArray(list)) list = [];

                var legacyKey = localStorage.getItem(LEGACY_KEY) || '';
                if (legacyKey && !list.length) {
                    list.push({ key: legacyKey, value: clampValue(localStorage.getItem(LEGACY_VALUE) || '0') });
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                }

                return list
                    .filter(function(binding) { return binding && binding.key; })
                    .map(function(binding) {
                        return { key: binding.key, value: clampValue(binding.value) };
                    });
            }

            function saveBindings(bindings) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
                if (bindings.length > 0) {
                    localStorage.setItem(LEGACY_KEY, bindings[0].key);
                    localStorage.setItem(LEGACY_VALUE, String(bindings[0].value));
                } else {
                    localStorage.removeItem(LEGACY_KEY);
                    localStorage.removeItem(LEGACY_VALUE);
                }
            }

            function applyExtrapolation(value) {
                value = clampValue(value);
                localStorage.setItem('haxball_extrapolation', String(value));

                var cmdInput = doc.querySelector('input[data-hook="input"]') || doc.querySelector('.chatbox-view input[type="text"]');
                if (!cmdInput) return;
                cmdInput.value = '/extrapolation ' + value;
                cmdInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));
            }

            function renderSection() {
                var bindings = loadBindings();
                var html = '<div style="padding:16px 20px;">' +
                    '<div style="margin-bottom:20px;color:var(--theme-text-secondary, #888);font-size:13px;line-height:1.5;">' + t('Asigna una tecla a un valor de extrapolación. Al presionarla durante la partida se aplica automáticamente.') + '</div>';

                if (bindings.length > 0) {
                    html += '<div style="margin-bottom:16px;">';
                    for (var i = 0; i < bindings.length; i++) {
                        var b = bindings[i];
                        html += '<div class="inputrow extrapolation-row" data-index="' + i + '" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;margin-bottom:8px;">' +
                            '<div style="min-width:50px;padding:6px 12px;background:var(--theme-bg-tertiary, #272727);border-radius:4px;text-align:center;color:var(--theme-text-primary, #fff);font-weight:600;font-size:13px;">' + formatKeyLabel(b.key) + '</div>' +
                            '<div style="flex:1;color:var(--theme-text-primary, #fff);font-size:14px;">' + clampValue(b.value) + ' ms</div>' +
                            '<button class="edit-extrap-btn" data-index="' + i + '" style="padding:6px 12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:12px;transition:background 0.15s;">' + t('Editar') + '</button>' +
                            '<button class="remove-extrap-btn" data-index="' + i + '" style="padding:6px 10px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:#ff4444;cursor:pointer;transition:background 0.15s;"><i class="icon-cancel"></i></button>' +
                            '</div>';
                    }
                    html += '</div>';
                }

                html += '<button id="add-extrap-binding" style="padding:10px 16px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;transition:background 0.15s;width:100%;">' +
                    '<i class="icon-plus"></i> ' + t('Adicionar atalho') +
                    '</button>' +
                    '<div style="margin-top:10px;color:var(--theme-text-muted);font-size:10px;line-height:1.4;">' + t('Ej: tecla X -> 300 ms. Funciona durante la partida siempre que no estés escribiendo en el chat.') + '</div>' +
                    '</div>';

                extrapSection.innerHTML = html;

                var removeButtons = extrapSection.querySelectorAll('.remove-extrap-btn');
                for (var r = 0; r < removeButtons.length; r++) {
                    (function(btn) {
                        btn.onmouseenter = function () { btn.style.background = 'var(--theme-bg-hover, #333)'; };
                        btn.onmouseleave = function () { btn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                        btn.onclick = function () {
                            var idx = parseInt(btn.dataset.index, 10);
                            bindings.splice(idx, 1);
                            saveBindings(bindings);
                            renderSection();
                        };
                    })(removeButtons[r]);
                }

                var editButtons = extrapSection.querySelectorAll('.edit-extrap-btn');
                for (var e = 0; e < editButtons.length; e++) {
                    (function(btn) {
                        btn.onmouseenter = function () { btn.style.background = 'var(--theme-bg-hover, #333)'; };
                        btn.onmouseleave = function () { btn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                        btn.onclick = function () {
                            var idx = parseInt(btn.dataset.index, 10);
                            showEditDialog(idx);
                        };
                    })(editButtons[e]);
                }

                var addBtn = extrapSection.querySelector('#add-extrap-binding');
                if (addBtn) {
                    addBtn.onmouseenter = function () { addBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                    addBtn.onmouseleave = function () { addBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                    addBtn.onclick = function () {
                        showEditDialog(-1);
                    };
                }
            }

            function showEditDialog(index) {
                var isNew = index === -1;
                var binding = isNew ? { key: '', value: 0 } : bindings[index];

                var existing = doc.getElementById('extrapolation-edit-dialog');
                if (existing) existing.remove();

                var overlay = doc.createElement('div');
                overlay.id = 'extrapolation-edit-dialog';
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:10001;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';

                var modal = doc.createElement('div');
                modal.style.cssText = 'background:var(--theme-bg-primary, #141414);border:1px solid var(--theme-border, #232323);border-radius:8px;padding:24px;min-width:340px;box-shadow:0 8px 32px rgba(0,0,0,0.5);';

                modal.innerHTML = '<h2 style="color:var(--theme-text-primary, #fff);font-size:18px;font-weight:600;margin:0 0 20px 0;text-align:center;">' + (isNew ? t('Novo Atalho') : t('Editar Atalho')) + '</h2>' +
                    '<div style="margin-bottom:16px;">' +
                    '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Tecla de Atalho') + '</label>' +
                    '<button id="extrap-key-capture-btn" style="width:100%;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;text-align:center;font-size:14px;transition:all 0.15s;">' + (binding.key ? formatKeyLabel(binding.key) : t('Clique para definir tecla')) + '</button>' +
                    '</div>' +
                    '<div style="margin-bottom:20px;">' +
                    '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Valor de Extrapolation (ms)') + '</label>' +
                    '<input id="extrap-value-input" type="number" value="' + clampValue(binding.value || 0) + '" min="-200" max="1000" step="10" style="width:100%;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:6px;color:var(--theme-text-primary, #fff);font-size:16px;box-sizing:border-box;outline:none;transition:border-color 0.15s;" placeholder="300">' +
                    '</div>' +
                    '<div style="display:flex;gap:10px;">' +
                    '<button id="cancel-extrap-btn" style="flex:1;padding:12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:14px;transition:background 0.15s;">' + t('Cancelar') + '</button>' +
                    '<button id="save-extrap-btn" style="flex:1;padding:12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:14px;font-weight:600;transition:background 0.15s;">' + t('Salvar') + '</button>' +
                    '</div>';

                overlay.appendChild(modal);
                doc.body.appendChild(overlay);

                var capturedKey = binding.key;
                var keyBtn = modal.querySelector('#extrap-key-capture-btn');
                var valueInput = modal.querySelector('#extrap-value-input');
                var cancelBtn = modal.querySelector('#cancel-extrap-btn');
                var saveBtn = modal.querySelector('#save-extrap-btn');

                keyBtn.onmouseenter = function () { if (keyBtn.style.borderColor !== 'rgb(245, 158, 11)') keyBtn.style.background = 'var(--theme-bg-hover, #222)'; };
                keyBtn.onmouseleave = function () { if (keyBtn.style.borderColor !== 'rgb(245, 158, 11)') keyBtn.style.background = 'var(--theme-bg-secondary, #1a1a1a)'; };
                valueInput.onfocus = function () { valueInput.style.borderColor = 'var(--theme-border-light, #444)'; };
                valueInput.onblur = function () { valueInput.style.borderColor = 'var(--theme-border-light, #333)'; };
                cancelBtn.onmouseenter = function () { cancelBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                cancelBtn.onmouseleave = function () { cancelBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                saveBtn.onmouseenter = function () { saveBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                saveBtn.onmouseleave = function () { saveBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };

                keyBtn.onclick = function () {
                    keyBtn.textContent = t('Pressione uma tecla...');
                    keyBtn.style.borderColor = '#f59e0b';
                    keyBtn.style.background = '#1a1a1a';

                    var keyHandler = function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        var ignored = ['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
                        if (ignored.indexOf(event.code) !== -1) {
                            keyBtn.textContent = t('Tecla inválida, tente outra');
                            keyBtn.style.borderColor = '#ff4444';
                            setTimeout(function () {
                                keyBtn.textContent = binding.key ? formatKeyLabel(binding.key) : t('Clique para definir tecla');
                                keyBtn.style.borderColor = '#333';
                            }, 1500);
                            return;
                        }

                        capturedKey = event.code;
                        keyBtn.textContent = formatKeyLabel(event.code);
                        keyBtn.style.borderColor = '#333';
                        doc.removeEventListener('keydown', keyHandler, true);
                    };

                    doc.addEventListener('keydown', keyHandler, true);
                };

                cancelBtn.onclick = function () {
                    overlay.remove();
                };

                saveBtn.onclick = function () {
                    if (!capturedKey) {
                        keyBtn.style.borderColor = '#ff4444';
                        keyBtn.style.background = '#1a1a1a';
                        setTimeout(function () {
                            keyBtn.style.borderColor = '#333';
                        }, 1500);
                        return;
                    }

                    var nextBindings = loadBindings().filter(function(existingBinding, existingIndex) {
                        if (!isNew && existingIndex === index) return false;
                        return existingBinding.key !== capturedKey;
                    });
                    nextBindings.push({ key: capturedKey, value: clampValue(valueInput.value || '0') });
                    saveBindings(nextBindings);
                    overlay.remove();
                    renderSection();
                };

                valueInput.onkeydown = function (event) {
                    if (event.key === 'Enter') {
                        saveBtn.click();
                    }
                };

                overlay.onclick = function (event) {
                    if (event.target === overlay) overlay.remove();
                };
            }

            var dialogContent = dialog.querySelector('.section') || dialog;
            dialogContent.parentNode.insertBefore(extrapSection, dialogContent.nextSibling);

            extrapBtn.addEventListener('click', function() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                }
                var themeSection = dialog.querySelector('[data-hook="theme-section"]');
                if (themeSection) themeSection.style.display = 'none';
                var perfSection = dialog.querySelector('[data-hook="perf-section"]');
                if (perfSection) perfSection.style.display = 'none';
                extrapSection.style.display = 'block';
                renderSection();

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                extrapBtn.classList.add('selected');
            });

            var originalTabs = tabs.querySelectorAll('button:not([data-hook="extrapbtn"])');
            for (var i = 0; i < originalTabs.length; i++) {
                originalTabs[i].addEventListener('click', function() {
                    extrapSection.style.display = 'none';
                });
            }

            return extrapBtn;
        }

        function hxdNotifyZeroZoomToMain(enabled) {
            try {
                if (typeof window.electronAPI !== 'undefined' && typeof window.electronAPI.setZeroZoomClientEnabled === 'function') {
                    // Keep zoom inside the game field; Electron page zoom
                    // also enlarges the menu, sound button and header.
                    window.electronAPI.setZeroZoomClientEnabled(false).catch(function() {});
                }
            } catch (eNz) {}
        }


        function ensureHaxClientMiscOptions() {
            var legacy = dialog.querySelector('[data-hook="verified-toggle-row"]');
            if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);

            var oldVideoBlock = dialog.querySelector('[data-hook="videosec"] [data-hook="hax-client-videosec-extra"]');
            if (oldVideoBlock && oldVideoBlock.parentNode) oldVideoBlock.parentNode.removeChild(oldVideoBlock);

            var miscsec = dialog.querySelector('[data-hook="miscsec"]');
            if (!miscsec) return;

            /** Misma línea que Video/Misc del juego: ✓ + texto (p. ej. canvas baja latencia). */
            function makeGameStyleToggleRow(labelKey, tooltipKey, onGetter, onToggle) {
                var row = doc.createElement('div');
                row.className = 'toggle hxd-misc-toggle-row';
                var ic = doc.createElement('i');
                ic.className = 'hxd-misc-toggle-ic icon-cancel';
                var span = doc.createElement('span');
                span.textContent = t(labelKey);
                span.style.cssText = 'flex:1;min-width:0;';
                try {
                    var tip = t(tooltipKey);
                    row.title = tip;
                    row.setAttribute('aria-label', t(labelKey) + ' — ' + tip);
                } catch (eTt) {}
                row.appendChild(ic);
                row.appendChild(span);

                function sync() {
                    var on = !!onGetter();
                    ic.classList.toggle('icon-ok', on);
                    ic.classList.toggle('icon-cancel', !on);
                }
                sync();
                row.onclick = function() {
                    onToggle();
                    sync();
                };
                return row;
            }

            var miscExtraExisting = miscsec.querySelector('[data-hook="hax-client-miscsec-extra"]');
            if (miscExtraExisting && !miscExtraExisting.querySelector('[data-hook="hax-row-no-match-status"]')) {
                var noMatchRowLegacy = makeGameStyleToggleRow(
                    t('No match status text'),
                    t('No match status text tooltip'),
                    function() {
                        try {
                            return localStorage.getItem('hax_hide_match_status_text') === '1';
                        } catch (eNm) {
                            return false;
                        }
                    },
                    function() {
                        try {
                            if (localStorage.getItem('hax_hide_match_status_text') === '1') {
                                localStorage.removeItem('hax_hide_match_status_text');
                            } else {
                                localStorage.setItem('hax_hide_match_status_text', '1');
                            }
                        } catch (eNm2) {}
                    }
                );
                noMatchRowLegacy.setAttribute('data-hook', 'hax-row-no-match-status');
                miscExtraExisting.appendChild(noMatchRowLegacy);
            }

            var hxdMiscExtraEarly = miscsec.querySelector('[data-hook="hax-client-miscsec-extra"]');
            if (hxdMiscExtraEarly) {
                return;
            }

            var block = doc.createElement('div');
            block.className = 'hax-client-video-block';
            block.setAttribute('data-hook', 'hax-client-miscsec-extra');

            var verifiedRow = makeGameStyleToggleRow(
                'Mostrar verificado',
                'Misc tooltip verificado',
                function() {
                    try {
                        return localStorage.getItem('hax_verified_disabled') !== '1';
                    } catch (eV) {
                        return true;
                    }
                },
                function() {
                    try {
                        var cur = localStorage.getItem('hax_verified_disabled') === '1';
                        if (cur) localStorage.removeItem('hax_verified_disabled');
                        else localStorage.setItem('hax_verified_disabled', '1');
                    } catch (eT) {}
                    window.dispatchEvent(new Event('hax-verified-toggle-changed'));
                    if (window.__refreshVerifiedBadges) window.__refreshVerifiedBadges();
                    if (window.__refreshProBanners) window.__refreshProBanners();
                    if (window.__refreshProFonts) window.__refreshProFonts();
                }
            );
            verifiedRow.setAttribute('data-hook', 'hax-row-verified');

            var zoomRow = makeGameStyleToggleRow(
                'Zero zoom',
                'Misc tooltip zero zoom',
                function() {
                    try {
                        return localStorage.getItem('hax_zero_zoom') !== '0';
                    } catch (eZ) {
                        return true;
                    }
                },
                function() {
                    try {
                        var off = localStorage.getItem('hax_zero_zoom') === '0';
                        if (off) localStorage.removeItem('hax_zero_zoom');
                        else {
                            localStorage.setItem('hax_zero_zoom', '0');
                            try {
                                localStorage.removeItem('haxball_zoom');
                            } catch (eRmz) {}
                            try {
                                document.body.style.zoom = '';
                            } catch (eBz) {}
                        }
                    } catch (eL) {}
                    var en = true;
                    try {
                        en = localStorage.getItem('hax_zero_zoom') !== '0';
                    } catch (e2) {}
                    hxdNotifyZeroZoomToMain(en);
                }
            );
            zoomRow.setAttribute('data-hook', 'hax-row-zero-zoom');

            var noMatchStatusRow = makeGameStyleToggleRow(
                t('No match status text'),
                t('No match status text tooltip'),
                function() {
                    try {
                        return localStorage.getItem('hax_hide_match_status_text') === '1';
                    } catch (eN1) {
                        return false;
                    }
                },
                function() {
                    try {
                        if (localStorage.getItem('hax_hide_match_status_text') === '1') {
                            localStorage.removeItem('hax_hide_match_status_text');
                        } else {
                            localStorage.setItem('hax_hide_match_status_text', '1');
                        }
                    } catch (eN2) {}
                }
            );
            noMatchStatusRow.setAttribute('data-hook', 'hax-row-no-match-status');

            var oldScoreboardRow = makeGameStyleToggleRow(
                'Marcador clásico',
                'Vuelve al marcador original de HaxBall.',
                function() {
                    try {
                        return localStorage.getItem('hxd_scoreboard_old') === '1';
                    } catch (eOld1) {
                        return false;
                    }
                },
                function() {
                    try {
                        if (localStorage.getItem('hxd_scoreboard_old') === '1') {
                            localStorage.removeItem('hxd_scoreboard_old');
                        } else {
                            localStorage.setItem('hxd_scoreboard_old', '1');
                        }
                        window.dispatchEvent(new Event('storage'));
                    } catch (eOld2) {}
                }
            );
            oldScoreboardRow.setAttribute('data-hook', 'hax-row-scoreboard-old');

            var buttonsLayoutRow = doc.createElement('div');
            buttonsLayoutRow.className = 'hax-client-video-block hxd-misc-select-row';
            buttonsLayoutRow.setAttribute('data-hook', 'hax-row-scoreboard-buttons');
            var buttonsLayoutLabel = doc.createElement('span');
            buttonsLayoutLabel.textContent = 'Botones en partida';
            buttonsLayoutLabel.style.cssText = 'flex:1;min-width:0;';
            var buttonsLayoutSelect = doc.createElement('select');
            buttonsLayoutSelect.setAttribute('data-hook', 'hxd-scoreboard-buttons-select');
            var optDefault = doc.createElement('option');
            optDefault.value = 'default';
            optDefault.textContent = 'HaxBall (arriba a la derecha)';
            var optIntegrated = doc.createElement('option');
            optIntegrated.value = 'integrated';
            optIntegrated.textContent = 'Lados del marcador';
            buttonsLayoutSelect.appendChild(optDefault);
            buttonsLayoutSelect.appendChild(optIntegrated);
            try {
                buttonsLayoutSelect.value = localStorage.getItem('hxd_scoreboard_buttons_layout') === 'integrated'
                    ? 'integrated'
                    : 'default';
            } catch (eBl1) {}
            buttonsLayoutSelect.onchange = function() {
                try {
                    if (buttonsLayoutSelect.value === 'integrated') {
                        localStorage.setItem('hxd_scoreboard_buttons_layout', 'integrated');
                    } else {
                        localStorage.removeItem('hxd_scoreboard_buttons_layout');
                    }
                    window.dispatchEvent(new Event('storage'));
                } catch (eBl2) {}
            };
            buttonsLayoutRow.style.display = 'flex';
            buttonsLayoutRow.style.alignItems = 'center';
            buttonsLayoutRow.style.gap = '8px';
            buttonsLayoutRow.appendChild(buttonsLayoutLabel);
            buttonsLayoutRow.appendChild(buttonsLayoutSelect);

            block.appendChild(verifiedRow);
            block.appendChild(zoomRow);
            block.appendChild(noMatchStatusRow);
            block.appendChild(oldScoreboardRow);
            block.appendChild(buttonsLayoutRow);
            miscsec.appendChild(block);
        }

        function createResolutionTab(doc, tabs) {
            if (tabs.querySelector('button[data-hook="resolutionbtn"]')) return;

            var resolutionBtn = doc.createElement('button');
            resolutionBtn.setAttribute('data-hook', 'resolutionbtn');
            resolutionBtn.textContent = t('Resolución');
            resolutionBtn.style.display = 'none';
            tabs.appendChild(resolutionBtn);

            var resolutionSection = doc.createElement('section');
            resolutionSection.className = 'resolution-section section';
            resolutionSection.setAttribute('data-hook', 'resolution-section');
            resolutionSection.style.display = 'none';

            var STORAGE_KEY = 'stretched_resolution';
            var presets = [
                { label: t('Nativo'), width: 0, height: 0 },
                { label: '800x600 (4:3)', width: 800, height: 600 },
                { label: '1024x768 (4:3)', width: 1024, height: 768 },
                { label: '1280x960 (4:3)', width: 1280, height: 960 },
                { label: '1280x1024 (5:4)', width: 1280, height: 1024 },
                { label: '1440x1080 (4:3)', width: 1440, height: 1080 }
            ];

            function getSavedResolution() {
                try {
                    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { width: 0, height: 0 };
                } catch (e) {
                    return { width: 0, height: 0 };
                }
            }

            function saveResolution(width, height) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ width: width, height: height }));
                window.dispatchEvent(new Event('resize'));
            }

            function ensureOption(select, width, height) {
                var value = String(width || 0) + 'x' + String(height || 0);
                for (var i = 0; i < select.options.length; i++) {
                    if (select.options[i].value === value) {
                        select.value = value;
                        return;
                    }
                }
                var option = doc.createElement('option');
                option.value = value;
                option.textContent = t('Personalizada') + ' (' + value + ')';
                select.appendChild(option);
                select.value = value;
            }

            function formatResolution(width, height) {
                return width > 0 && height > 0 ? (width + ' x ' + height) : t('Nativa');
            }

            function renderResolutionSection() {
                var current = getSavedResolution();
                resolutionSection.innerHTML =
                    '<div class="hxd-res-wrap">' +
                        '<p class="hxd-res-hint">' + t('Resolution tab hint') + '</p>' +
                        '<div class="hxd-res-status">' +
                            '<span class="hxd-res-status-l">' + t('Resolución activa') + '</span>' +
                            '<span data-hook="resolution-current-label">' + formatResolution(current.width, current.height) + '</span>' +
                        '</div>' +
                        '<div>' +
                            '<label class="hxd-res-label" for="hxd-stretched-preset">' + t('Preset') + '</label>' +
                            '<select id="hxd-stretched-preset" class="hxd-ui-select" data-hook="stretched-preset"></select>' +
                        '</div>' +
                        '<div>' +
                            '<span class="hxd-res-label">' + t('Personalizada') + '</span>' +
                            '<div class="hxd-res-dim-row">' +
                                '<input data-hook="stretched-width" type="number" min="0" step="1" placeholder="' + t('Ancho') + '" inputmode="numeric" />' +
                                '<span class="hxd-res-x" aria-hidden="true">×</span>' +
                                '<input data-hook="stretched-height" type="number" min="0" step="1" placeholder="' + t('Alto') + '" inputmode="numeric" />' +
                            '</div>' +
                        '</div>' +
                        '<p class="hxd-res-foot">' + t('Se guarda automáticamente en este cliente.') + '</p>' +
                        '<div class="hxd-res-actions">' +
                            '<button data-hook="stretched-apply" type="button" class="hxd-res-btn hxd-res-btn--primary">' + t('Resolution apply btn') + '</button>' +
                            '<button data-hook="stretched-native" type="button" class="hxd-res-btn">' + t('Resolution native btn') + '</button>' +
                        '</div>' +
                    '</div>';

                var select = resolutionSection.querySelector('[data-hook="stretched-preset"]');
                var widthInput = resolutionSection.querySelector('[data-hook="stretched-width"]');
                var heightInput = resolutionSection.querySelector('[data-hook="stretched-height"]');
                var applyBtn = resolutionSection.querySelector('[data-hook="stretched-apply"]');
                var nativeBtn = resolutionSection.querySelector('[data-hook="stretched-native"]');
                var currentLabel = resolutionSection.querySelector('[data-hook="resolution-current-label"]');

                for (var i = 0; i < presets.length; i++) {
                    var option = doc.createElement('option');
                    option.value = String(presets[i].width) + 'x' + String(presets[i].height);
                    option.textContent = presets[i].label;
                    select.appendChild(option);
                }

                ensureOption(select, current.width, current.height);
                widthInput.value = current.width > 0 ? String(current.width) : '';
                heightInput.value = current.height > 0 ? String(current.height) : '';

                function updateCurrentLabel(width, height) {
                    currentLabel.textContent = formatResolution(width, height);
                }

                select.onchange = function() {
                    var parts = String(select.value || '0x0').split('x');
                    var width = parseInt(parts[0], 10) || 0;
                    var height = parseInt(parts[1], 10) || 0;
                    widthInput.value = width > 0 ? String(width) : '';
                    heightInput.value = height > 0 ? String(height) : '';
                    saveResolution(width, height);
                    updateCurrentLabel(width, height);
                };

                applyBtn.onclick = function() {
                    var width = parseInt(widthInput.value, 10) || 0;
                    var height = parseInt(heightInput.value, 10) || 0;
                    if (width <= 0 || height <= 0) {
                        if (window.showToast) window.showToast(t('Ingresá ancho y alto válidos'), 'error', 2200);
                        return;
                    }
                    ensureOption(select, width, height);
                    saveResolution(width, height);
                    updateCurrentLabel(width, height);
                    if (window.showToast) window.showToast(t('Resolución personalizada guardada'), 'success', 2200);
                };

                nativeBtn.onclick = function() {
                    select.value = '0x0';
                    widthInput.value = '';
                    heightInput.value = '';
                    saveResolution(0, 0);
                    updateCurrentLabel(0, 0);
                    if (window.showToast) window.showToast(t('Resolución nativa restaurada'), 'success', 2200);
                };
            }

            renderResolutionSection();

            var tabContents = dialog.querySelector('.tabcontents');
            if (tabContents) {
                tabContents.appendChild(resolutionSection);
            } else {
                var dialogContent = dialog.querySelector('.section') || dialog;
                dialogContent.parentNode.insertBefore(resolutionSection, dialogContent.nextSibling);
            }

            function openResolutionTab() {
                var sections = dialog.querySelectorAll('.tabcontents > .section');
                for (var i = 0; i < sections.length; i++) {
                    sections[i].style.display = 'none';
                }
                var themeSection = dialog.querySelector('[data-hook="theme-section"]');
                if (themeSection) themeSection.style.display = 'none';
                var perfSection = dialog.querySelector('[data-hook="perf-section"]');
                if (perfSection) perfSection.style.display = 'none';
                var extrapSection = dialog.querySelector('[data-hook="extrapolation-section"]');
                if (extrapSection) extrapSection.style.display = 'none';
                var chatShortcutsRes = dialog.querySelector('[data-hook="chat-shortcuts-section"]');
                if (chatShortcutsRes) {
                    chatShortcutsRes.style.display = 'none';
                    chatShortcutsRes.classList.remove('selected');
                }

                renderResolutionSection();
                resolutionSection.style.display = 'block';
                applyDefaultDialogSize();

                var allTabs = tabs.querySelectorAll('button');
                for (var j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('selected');
                }
                resolutionBtn.classList.add('selected');
            }

            resolutionBtn.__customSidebarOpen = openResolutionTab;
            resolutionBtn.addEventListener('click', openResolutionTab);

            var originalTabs = tabs.querySelectorAll('button:not([data-hook="resolutionbtn"])');
            for (var i = 0; i < originalTabs.length; i++) {
                originalTabs[i].addEventListener('click', function() {
                    resolutionSection.style.display = 'none';
                });
            }

            return resolutionBtn;
        }

        // Função para criar botão na sidebar
        var sidebarButtons = [];
        var pendingButtons = {};

        function createSidebarButton(originalBtn) {
            var hook = originalBtn.getAttribute('data-hook');

            // Já existe botão para esse hook
            if (sidebar.querySelector('[data-hook-ref="' + hook + '"]')) return;

            var iconData = tabIcons[hook] || { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>', tooltip: originalBtn.textContent, order: 99 };

            var sidebarBtn = doc.createElement('button');
            sidebarBtn.className = 'settings-sidebar-btn';
            sidebarBtn.setAttribute('data-hook-ref', hook);
            sidebarBtn.setAttribute('data-order', iconData.order || 99);
            sidebarBtn.innerHTML = iconData.icon;

            if (originalBtn.classList.contains('selected')) {
                sidebarBtn.classList.add('selected');
            }

            addTooltip(sidebarBtn, iconData.tooltip);

            sidebarBtn.onclick = function () {
                // Remove selected de todos os botões da sidebar
                var allBtns = sidebar.querySelectorAll('.settings-sidebar-btn:not([data-close])');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].classList.remove('selected');
                }
                sidebarBtn.classList.add('selected');

                // Esconde a seção de temas se não for o botão de temas
                if (hook !== 'themebtn') {
                    var themeSection = dialog.querySelector('[data-hook="theme-section"]');
                    if (themeSection) themeSection.style.display = 'none';
                }
                
                // Esconde a seção de desempenho se não for o botão de desempenho
                if (hook !== 'perfbtn') {
                    var perfSection = dialog.querySelector('[data-hook="perf-section"]');
                    if (perfSection) perfSection.style.display = 'none';
                }

                if (hook !== 'shortcutsbtn') {
                    var chatShortcutsEl = dialog.querySelector('[data-hook="chat-shortcuts-section"]');
                    if (chatShortcutsEl) {
                        chatShortcutsEl.style.display = 'none';
                        chatShortcutsEl.classList.remove('selected');
                    }
                }

                if (hook !== 'extrapbtn') {
                    var extrapSection = dialog.querySelector('[data-hook="extrapolation-section"]');
                    if (extrapSection) extrapSection.style.display = 'none';
                }

                if (hook !== 'resolutionbtn') {
                    var resolutionSection = dialog.querySelector('[data-hook="resolution-section"]');
                    if (resolutionSection) resolutionSection.style.display = 'none';
                }

                if (hook !== 'multiauthbtn') {
                    var multiAuthSection = dialog.querySelector('[data-hook="multiauth-section"]');
                    if (multiAuthSection) {
                        multiAuthSection.style.display = 'none';
                        multiAuthSection.classList.remove('selected');
                    }
                }

                if (hook !== 'soundhubbtn') {
                    var soundHubEl = dialog.querySelector('[data-hook="sound-hub-section"]');
                    if (soundHubEl) {
                        soundHubEl.style.display = 'none';
                        soundHubEl.classList.remove('selected');
                    }
                }
                
                // Mostra as sections originais se não for tema, desempenho ou extrapolation
                if (hook !== 'themebtn' && hook !== 'perfbtn' && hook !== 'shortcutsbtn' && hook !== 'extrapbtn' && hook !== 'resolutionbtn' && hook !== 'soundhubbtn' && hook !== 'multiauthbtn') {
                    var sections = dialog.querySelectorAll('.tabcontents > .section');
                    for (var k = 0; k < sections.length; k++) {
                        var secEl = sections[k];
                        if (secEl.getAttribute('data-hook') === 'sound-hub-section') continue;
                        secEl.style.display = '';
                    }
                }

                // Tabs customizadas controlam sua própria navegação
                if (typeof originalBtn.__customSidebarOpen === 'function') {
                    originalBtn.__customSidebarOpen();
                } else {
                    originalBtn.click();
                }
            };

            // Sincroniza quando o botão original é clicado
            originalBtn.addEventListener('click', function () {
                var allBtns = sidebar.querySelectorAll('.settings-sidebar-btn:not([data-close])');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].classList.remove('selected');
                }
                sidebarBtn.classList.add('selected');
            });

            pendingButtons[hook] = sidebarBtn;
            sidebarButtons.push(sidebarBtn);
        }

        function insertButtonsInOrder() {
            var spacer = sidebar.querySelector('[data-spacer]');
            
            // Ordena pelos hooks na ordem definida
            for (var i = 0; i < tabOrder.length; i++) {
                var hook = tabOrder[i];
                if (pendingButtons[hook]) {
                    if (spacer) {
                        sidebar.insertBefore(pendingButtons[hook], spacer);
                    } else {
                        sidebar.appendChild(pendingButtons[hook]);
                    }
                }
            }
        }

        function syncSidebarButtons() {
            if (!tabs) return;
            var currentTabButtons = tabs.querySelectorAll('button');
            for (var i = 0; i < currentTabButtons.length; i++) {
                createSidebarButton(currentTabButtons[i]);
            }
            insertButtonsInOrder();
        }

        // Hub Sonido (pestaña extra en .tabs, oculta)
        createSoundHubTab(doc, tabs);

        (function injectKeysIntro() {
            var inputSec = dialog.querySelector('[data-hook="inputsec"]');
            if (!inputSec || inputSec.querySelector('[data-keys-intro]')) return;
            var introK = doc.createElement('div');
            introK.setAttribute('data-keys-intro', '1');
            introK.style.cssText = 'color:var(--theme-text-muted);font-size:11px;margin-bottom:12px;line-height:1.45;padding-bottom:10px;border-bottom:1px solid var(--theme-border);';
            introK.textContent = t('Keys intro');
            inputSec.insertBefore(introK, inputSec.firstChild);
        })();

        (function injectCameraExtraBindsUI() {
            var CAMERA_STORAGE = 'hax_input_camera_extra_v2';
            var tryIdx = 0;
            var CAM_LABEL_TKEYS = [
                'Cam mode dynamic',
                'Cam mode restricted',
                'Cam mode z1',
                'Cam mode z125',
                'Cam mode z15',
                'Cam mode z175',
                'Cam mode z2',
                'Cam mode z225',
                'Cam mode z25'
            ];

            function formatKeyLabel(code) {
                if (!code) return '—';
                return String(code).replace('Key', '').replace('Digit', '').replace('Numpad', 'Num');
            }

            function defaultBinds() {
                var a = [];
                var i;
                for (i = 0; i < 9; i++) a.push([]);
                return a;
            }

            function loadBinds() {
                try {
                    var raw = localStorage.getItem(CAMERA_STORAGE);
                    if (raw) {
                        var arr = JSON.parse(raw);
                        if (Array.isArray(arr) && arr.length === 9) {
                            var def = defaultBinds();
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
                } catch (eL) {}
                return defaultBinds();
            }

            function saveBinds(list) {
                try {
                    localStorage.setItem(CAMERA_STORAGE, JSON.stringify(list));
                } catch (eS) {}
            }

            function assignKeyToSlot(all, slotIndex, code) {
                if (!code) return;
                if (all[slotIndex].indexOf(code) === -1) {
                    all[slotIndex].push(code);
                }
                saveBinds(all);
            }

            function removeKeyFromSlot(all, slotIndex, code) {
                all[slotIndex] = all[slotIndex].filter(function (c) {
                    return c !== code;
                });
                saveBinds(all);
            }

            function findRestartMatchAnchor(inputSec) {
                var rows = inputSec.querySelectorAll('.inputrow');
                var r;
                for (r = 0; r < rows.length; r++) {
                    var first = rows[r].children && rows[r].children[0];
                    var tx = String((first && first.textContent) || '').toLowerCase().replace(/\s+/g, '');
                    if (tx.indexOf('restartmatch') !== -1 || tx.indexOf('reiniciar') !== -1) {
                        return rows[r];
                    }
                }
                if (rows.length) return rows[rows.length - 1];
                return null;
            }

            /** Igual que el panel nativo de teclas: overlay `[data-hook="presskey"]` + clase `show`. */
            var activePressKeyCleanup = null;
            function beginPressKeyCapture(onPick) {
                if (typeof activePressKeyCleanup === 'function') {
                    try {
                        activePressKeyCleanup();
                    } catch (eC) {}
                    activePressKeyCleanup = null;
                }
                var qc = dialog.querySelector('[data-hook="presskey"]');
                var onQcKey;
                var onQcMouse;
                var onDocEsc;
                var onDocFallback;

                function cleanup() {
                    if (qc) qc.classList.remove('show');
                    if (onDocEsc) doc.removeEventListener('keydown', onDocEsc, true);
                    if (onDocFallback) doc.removeEventListener('keydown', onDocFallback, true);
                    if (qc && onQcKey) qc.removeEventListener('keydown', onQcKey, true);
                    if (qc && onQcMouse) qc.removeEventListener('mousedown', onQcMouse, true);
                    activePressKeyCleanup = null;
                }

                function finishWith(code) {
                    cleanup();
                    if (code && typeof onPick === 'function') onPick(code);
                }

                if (qc) {
                    onDocEsc = function (ev) {
                        if (ev.key !== 'Escape') return;
                        ev.preventDefault();
                        ev.stopPropagation();
                        cleanup();
                    };
                    onQcKey = function (ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        if (ev.key === 'Escape') {
                            cleanup();
                            return;
                        }
                        var code = ev.code || '';
                        if (!code) return;
                        finishWith(code);
                    };
                    onQcMouse = function (ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        finishWith('Mouse' + ev.button);
                    };
                    qc.classList.add('show');
                    try {
                        qc.focus();
                    } catch (eF) {}
                    qc.addEventListener('keydown', onQcKey, true);
                    qc.addEventListener('mousedown', onQcMouse, true);
                    doc.addEventListener('keydown', onDocEsc, true);
                    activePressKeyCleanup = cleanup;
                } else {
                    onDocFallback = function (ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        if (ev.key === 'Escape') {
                            cleanup();
                            return;
                        }
                        var code = ev.code || '';
                        if (!code) return;
                        finishWith(code);
                    };
                    doc.addEventListener('keydown', onDocFallback, true);
                    activePressKeyCleanup = cleanup;
                }
            }

            var cameraResyncTimer = null;

            /** El cliente nativo suele rearmar `inputsec` al abrir «Press a key»; reinyectamos tras cerrar el overlay. */
            function scheduleCameraResync() {
                if (cameraResyncTimer) {
                    clearTimeout(cameraResyncTimer);
                    cameraResyncTimer = null;
                }
                function tryInject() {
                    var pk = dialog.querySelector('[data-hook="presskey"]');
                    if (pk && pk.classList.contains('show')) {
                        cameraResyncTimer = setTimeout(tryInject, 90);
                        return;
                    }
                    tryIdx = 0;
                    injectOnce();
                }
                cameraResyncTimer = setTimeout(tryInject, 40);
            }

            function injectOnce() {
                var inputSec = dialog.querySelector('[data-hook="inputsec"]');
                if (!inputSec || inputSec.querySelector('[data-hook="hxd-camera-extra-wrap"]')) return true;
                if (!inputSec.querySelector('.inputrow')) {
                    if (tryIdx++ < 40) {
                        setTimeout(injectOnce, 100);
                    }
                    return true;
                }

                var wrap = doc.createElement('div');
                wrap.setAttribute('data-hook', 'hxd-camera-extra-wrap');
                /* Sin estilos propios: los .inputrow hijos usan las reglas globales (.inputrow > div, .inputrow > i.icon-plus). */

                function renderCameraUi() {
                    wrap.innerHTML = '';

                    var binds = loadBinds();

                    for (var i = 0; i < 9; i++) {
                        (function (slotIndex) {
                            /* Misma estructura que el juego en na/b(): label, chips (div+icon-cancel), i.icon-plus como hermanos directos. */
                            var row = doc.createElement('div');
                            row.className = 'inputrow';
                            row.setAttribute('data-hxd-camera-slot', String(slotIndex));

                            var lab = doc.createElement('div');
                            lab.textContent = t(CAM_LABEL_TKEYS[slotIndex]);
                            row.appendChild(lab);

                            var keys = binds[slotIndex] || [];
                            var ki;
                            for (ki = 0; ki < keys.length; ki++) {
                                (function (keyCode) {
                                    var chip = doc.createElement('div');
                                    chip.textContent = formatKeyLabel(keyCode);
                                    row.appendChild(chip);
                                    var keyClear = doc.createElement('i');
                                    keyClear.className = 'icon-cancel';
                                    keyClear.onclick = function () {
                                        var b = loadBinds();
                                        removeKeyFromSlot(b, slotIndex, keyCode);
                                        renderCameraUi();
                                    };
                                    chip.appendChild(keyClear);
                                })(keys[ki]);
                            }

                            var plus = doc.createElement('i');
                            plus.className = 'icon-plus';
                            plus.onclick = function () {
                                beginPressKeyCapture(function (code) {
                                    var b2 = loadBinds();
                                    assignKeyToSlot(b2, slotIndex, code);
                                    renderCameraUi();
                                });
                            };

                            row.appendChild(plus);
                            wrap.appendChild(row);
                        })(i);
                    }
                }

                renderCameraUi();

                var anchor = findRestartMatchAnchor(inputSec);
                if (anchor && anchor.parentNode) {
                    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
                } else {
                    inputSec.appendChild(wrap);
                }
            }

            injectOnce();

            if (dialog && !dialog.dataset.hxdInputsecCameraMo) {
                dialog.dataset.hxdInputsecCameraMo = '1';
                try {
                    var moCamInput = new MutationObserver(function () {
                        if (!dialog.querySelector('[data-hook="inputsec"]')) return;
                        var sec = dialog.querySelector('[data-hook="inputsec"]');
                        if (sec.querySelector('[data-hook="hxd-camera-extra-wrap"]')) return;
                        if (!sec.querySelector('.inputrow')) return;
                        scheduleCameraResync();
                    });
                    moCamInput.observe(dialog, { childList: true, subtree: true });
                } catch (eMoCam) {}
            }
        })();

        // Cria botões para tabs existentes
        syncSidebarButtons();
        ensureHaxClientMiscOptions();

        if (tabs) {
            var resolutionTabBtn = createResolutionTab(doc, tabs);
            if (resolutionTabBtn) {
                createSidebarButton(resolutionTabBtn);
            }
        }

        if (tabs) {
            var avatarTabBtn = createAvatarTab(doc, tabs);
            if (avatarTabBtn) {
                createSidebarButton(avatarTabBtn);
            }
        }

        if (tabs) {
            var tokenTabBtn = createTokenTab(doc, tabs);
            if (tokenTabBtn) {
                createSidebarButton(tokenTabBtn);
            }
        }

        if (tabs) {
            var multiAuthTabBtn = createMultiAuthTab(doc, tabs);
            if (multiAuthTabBtn) {
                createSidebarButton(multiAuthTabBtn);
            }
        }

        // Cria a aba de temas
        if (tabs) {
            var themeTabBtn = createThemeTab(doc, tabs);
            if (themeTabBtn) {
                createSidebarButton(themeTabBtn);
            }
        }

        // Cria a aba de desempenho
        if (tabs) {
            var perfTabBtn = createPerfTab(doc, tabs);
            if (perfTabBtn) {
                createSidebarButton(perfTabBtn);
            }
        }

        if (tabs) {
            var shortcutsTabBtn = createChatShortcutsTab(doc, tabs);
            if (shortcutsTabBtn) {
                createSidebarButton(shortcutsTabBtn);
            }
        }

        if (tabs) {
            var extrapTabBtn = createExtrapolationTab(doc, tabs);
            if (extrapTabBtn) {
                createSidebarButton(extrapTabBtn);
            }
        }

        // Espaçador
        var spacer = doc.createElement('div');
        spacer.style.cssText = 'flex:1;';
        spacer.setAttribute('data-spacer', 'true');
        sidebar.appendChild(spacer);

        // Insere os botões na ordem correta
        insertButtonsInOrder();

        // Botão de fechar no final
        var closeBtn = dialog.querySelector('button[data-hook="close"]');
        if (closeBtn) {
            var sidebarCloseBtn = doc.createElement('button');
            sidebarCloseBtn.className = 'settings-sidebar-btn';
            sidebarCloseBtn.setAttribute('data-close', 'true');
            sidebarCloseBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            addTooltip(sidebarCloseBtn, t('Fechar'));
            sidebarCloseBtn.onclick = function () {
                closeBtn.click();
            };
            sidebar.appendChild(sidebarCloseBtn);
        }

        // Observer para detectar novas tabs (como Avatars do quickavatar.js, Host Token)
        if (tabs) {
            var tabsObserver = new MutationObserver(function (mutations) {
                var needsReorder = false;
                for (var m = 0; m < mutations.length; m++) {
                    var added = mutations[m].addedNodes;
                    for (var n = 0; n < added.length; n++) {
                        if (added[n].tagName === 'BUTTON') {
                            createSidebarButton(added[n]);
                            needsReorder = true;
                        }
                    }
                }
                // Reordena os botões quando novos são adicionados
                if (needsReorder) {
                    insertButtonsInOrder();
                }
                syncSidebarButtons();
                ensureHaxClientMiscOptions();
            });
            tabsObserver.observe(tabs, { childList: true });
            setTimeout(syncSidebarButtons, 80);
            setTimeout(syncSidebarButtons, 220);
            setTimeout(syncSidebarButtons, 500);
            setTimeout(ensureHaxClientMiscOptions, 80);
            setTimeout(ensureHaxClientMiscOptions, 220);
            setTimeout(ensureHaxClientMiscOptions, 500);
        }

        // Esconde tabs originais e botão close
        if (tabs) {
            tabs.style.display = 'none';
        }
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }

        // Ajusta o dialog
        dialog.style.position = 'relative';
        applyDefaultDialogSize();
        dialog.appendChild(sidebar);

        setTimeout(function () {
            var firstSound = sidebar.querySelector('[data-hook-ref="soundhubbtn"]');
            if (firstSound) firstSound.click();
        }, 0);

        Injector.log('Settings sidebar injected');
    }

    function hideTooltip() {
        var tooltip = document.getElementById('settings-sidebar-tooltip');
        if (tooltip) tooltip.style.opacity = '0';
    }

    function init() {
        if (!Injector.isGameFrame()) return;

        installGlobalSettingsEscGuard(document);

        var checkInterval = null;
        var settingsObserver = null;
        var settingsOpenBurstObserver = null;
        var settingsOpenBurstStopTimer = null;
        var observedSettingsHosts = [];

        ensureSettingsPreviewStyles(document);
        fetchSettingsPreviewHtml(function () {});

        var settingsWasOpen = false;
        var settingsCloseTimer = null;

        var checkSettingsDialog = function () {
            var settingsDialog = document.querySelector('.dialog.settings-view');
            var sidebar = document.getElementById('settings-sidebar-panel');
            var previewRoot = document.getElementById('hxd-settings-preview-root');
            var isOpen = !!settingsDialog;
            setSettingsPopupOpen(document, isOpen);

            if (isOpen) {
                if (settingsCloseTimer) {
                    clearTimeout(settingsCloseTimer);
                    settingsCloseTimer = null;
                }
                settingsWasOpen = true;
            } else if (settingsWasOpen) {
                if (!settingsCloseTimer) {
                    settingsCloseTimer = setTimeout(function () {
                        settingsCloseTimer = null;
                        if (!document.querySelector('.dialog.settings-view')) {
                            setSettingsPopupOpen(document, false);
                            settingsWasOpen = false;
                            clearSettingsOpenedFromRoomlist(document);
                            document.hxdRoomlistThemePending = true;
                            if (typeof window.__hxdForceRoomlistPreviewSync === 'function') {
                                window.__hxdForceRoomlistPreviewSync(document, true);
                            }
                            var frame = document.getElementById('hxd-settings-preview-frame');
                            if (frame && frame.contentWindow) {
                                try {
                                    frame.contentWindow.postMessage({
                                        type: 'hxd-settings-sync',
                                        openedFromRoomlist: false,
                                        settingsOpen: false
                                    }, '*');
                                } catch (eClosePush) {}
                            }
                        }
                    }, 350);
                }
            }

            if (settingsDialog && previewRoot) {
                stopSettingsOpenBurst();
                pushSettingsPreviewContext(document);
            }
            if (settingsDialog && !sidebar && !previewRoot) {
                ensureSettingsPreviewStyles(document);
                if (!settingsDialog.classList.contains('hxd-settings-preview-dialog')) {
                    applySettingsPreviewDialogSize(settingsDialog);
                }
            }
            if (!settingsDialog || sidebar || previewRoot) return;
            if (settingsDialog.dataset.hxdPreviewMounting === '1') return;

            settingsDialog.dataset.hxdPreviewMounting = '1';
            mountSettingsPreview(document, settingsDialog, function (success) {
                if (settingsDialog.isConnected) {
                    delete settingsDialog.dataset.hxdPreviewMounting;
                }
                if (success) stopSettingsOpenBurst();
                if (!success && settingsDialog.isConnected && !document.getElementById('settings-sidebar-panel')) {
                    modifySettingsDialog(document);
                }
            });
        };

        var scheduleSettingsDialogCheck = function (delay) {
            if (checkInterval) return;
            checkInterval = setTimeout(function () {
                checkInterval = null;
                checkSettingsDialog();
            }, delay || 0);
        };

        var stopSettingsOpenBurst = function () {
            if (settingsOpenBurstStopTimer) {
                clearTimeout(settingsOpenBurstStopTimer);
                settingsOpenBurstStopTimer = null;
            }
            if (settingsOpenBurstObserver) {
                settingsOpenBurstObserver.disconnect();
                settingsOpenBurstObserver = null;
            }
        };

        var armSettingsOpenBurst = function () {
            markSettingsOpening(window);
            var delays = [0, 25, 75, 150, 300, 600, 1000];
            for (var d = 0; d < delays.length; d++) {
                (function (delay) {
                    setTimeout(function () {
                        scheduleSettingsDialogCheck(0);
                    }, delay);
                })(delays[d]);
            }
            if (!settingsOpenBurstObserver && document.body) {
                settingsOpenBurstObserver = new MutationObserver(function () {
                    scheduleSettingsDialogCheck(0);
                });
                try {
                    settingsOpenBurstObserver.observe(document.body, { childList: true, subtree: true });
                } catch (eBurstObserve) {}
            }
            if (settingsOpenBurstStopTimer) clearTimeout(settingsOpenBurstStopTimer);
            settingsOpenBurstStopTimer = setTimeout(stopSettingsOpenBurst, 1600);
        };
        try { window.__hxdArmSettingsOpenBurst = armSettingsOpenBurst; } catch (eArmExport) {}

        var isSettingsTrigger = function (target) {
            return !!(target && target.closest && target.closest('[data-hook="settings"], [data-cmd="settings"]'));
        };

        document.addEventListener('pointerdown', function (e) {
            if (isSettingsTrigger(e.target)) armSettingsOpenBurst();
        }, true);
        document.addEventListener('click', function (e) {
            if (isSettingsTrigger(e.target)) armSettingsOpenBurst();
        }, true);

        var observeSettingsHost = function (el) {
            if (!el || !settingsObserver) return;
            for (var i = 0; i < observedSettingsHosts.length; i++) {
                if (observedSettingsHosts[i] === el) return;
            }
            try {
                settingsObserver.observe(el, { childList: true });
                observedSettingsHosts.push(el);
            } catch (eObserveHost) {}
        };

        var refreshSettingsHosts = function () {
            observeSettingsHost(document.body);
            var hosts = document.querySelectorAll('[data-hook="popups"], .game-view');
            for (var i = 0; i < hosts.length; i++) observeSettingsHost(hosts[i]);
        };

        var startChecking = function () {
            if (!settingsObserver) {
                settingsObserver = new MutationObserver(function (mutations) {
                    for (var m = 0; m < mutations.length; m++) {
                        var nodes = mutations[m].addedNodes || [];
                        for (var n = 0; n < nodes.length; n++) {
                            var node = nodes[n];
                            if (!node || node.nodeType !== 1) continue;
                            if (node.matches && (node.matches('[data-hook="popups"]') || node.matches('.game-view'))) {
                                observeSettingsHost(node);
                            }
                            if (node.querySelectorAll) {
                                var found = node.querySelectorAll('[data-hook="popups"], .game-view');
                                for (var f = 0; f < found.length; f++) observeSettingsHost(found[f]);
                            }
                        }
                    }
                    scheduleSettingsDialogCheck(40);
                });
                refreshSettingsHosts();
            }
            scheduleSettingsDialogCheck(0);
        };

        var stopChecking = function () {
            if (checkInterval) {
                clearTimeout(checkInterval);
                checkInterval = null;
            }
            if (settingsObserver) {
                settingsObserver.disconnect();
                settingsObserver = null;
            }
            observedSettingsHosts = [];
            stopSettingsOpenBurst();
            hideTooltip();
        };

        // Sempre mantém o checking ativo (settings pode abrir em qualquer view)
        startChecking();

        Injector.log('Settings sidebar module loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
