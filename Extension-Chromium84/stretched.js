// ============================================
// STRETCHED RESOLUTION - UI
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var STORAGE_KEY = 'stretched_resolution';
    
    // Função de tradução
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }
    
    var RESOLUTIONS = [
        { label: 'Nativo', width: 0, height: 0 },
        { label: '800x600 (4:3)', width: 800, height: 600 },
        { label: '1024x768 (4:3)', width: 1024, height: 768 },
        { label: '1280x960 (4:3)', width: 1280, height: 960 },
        { label: '1280x1024 (5:4)', width: 1280, height: 1024 },
        { label: '1440x1080 (4:3)', width: 1440, height: 1080 }
    ];

    function showFeedback(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'info', 2500);
        }
    }

    function getSavedResolution() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return { width: 0, height: 0 };
    }

    function saveResolution(width, height) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ width: width, height: height }));
    }

    var applyFrame = null;
    var observedRoot = null;

    function clearFullInterfaceScale() {
        var gameView = document.querySelector('.game-view');
        var host = gameView && gameView.parentElement;
        if (gameView) {
            gameView.removeAttribute('data-hxd-stretched');
            gameView.style.removeProperty('position');
            gameView.style.removeProperty('inset');
            gameView.style.removeProperty('width');
            gameView.style.removeProperty('height');
            gameView.style.removeProperty('max-width');
            gameView.style.removeProperty('max-height');
            gameView.style.removeProperty('margin');
            gameView.style.removeProperty('padding');
            gameView.style.removeProperty('transform');
            gameView.style.removeProperty('transform-origin');
        }
        if (host) {
            host.removeAttribute('data-hxd-stretched-host');
            host.style.removeProperty('position');
            host.style.removeProperty('overflow');
            host.style.removeProperty('width');
            host.style.removeProperty('height');
        }
    }

    function applyFullInterfaceScale() {
        applyFrame = null;
        var resolution = getSavedResolution();
        var gameView = document.querySelector('.game-view');
        if (!gameView || !resolution.width || !resolution.height) {
            clearFullInterfaceScale();
            return;
        }

        var host = gameView.parentElement;
        if (host) {
            host.removeAttribute('data-hxd-stretched-host');
            host.style.removeProperty('position');
            host.style.removeProperty('overflow');
            host.style.removeProperty('width');
            host.style.removeProperty('height');
        }

        // The HaxBall game-view parent collapses to 0px after joining a room.
        // Scale against the iframe viewport and keep the game fixed to it.
        gameView.style.removeProperty('transform');
        var physicalWidth = Math.max(1, document.documentElement.clientWidth || window.innerWidth);
        var physicalHeight = Math.max(1, document.documentElement.clientHeight || window.innerHeight);
        var scaleX = physicalWidth / resolution.width;
        var scaleY = physicalHeight / resolution.height;

        gameView.setAttribute('data-hxd-stretched', '1');
        gameView.style.setProperty('position', 'fixed', 'important');
        gameView.style.setProperty('inset', '0 auto auto 0', 'important');
        gameView.style.setProperty('width', resolution.width + 'px', 'important');
        gameView.style.setProperty('height', resolution.height + 'px', 'important');
        gameView.style.setProperty('max-width', 'none', 'important');
        gameView.style.setProperty('max-height', 'none', 'important');
        gameView.style.setProperty('margin', '0', 'important');
        gameView.style.setProperty('padding', '0', 'important');
        gameView.style.setProperty('transform-origin', '0 0', 'important');
        gameView.style.setProperty(
            'transform',
            'scale(' + scaleX.toFixed(6) + ', ' + scaleY.toFixed(6) + ')',
            'important'
        );
    }

    function scheduleFullInterfaceScale() {
        if (applyFrame != null) cancelAnimationFrame(applyFrame);
        applyFrame = requestAnimationFrame(applyFullInterfaceScale);
    }

    function observeGameView() {
        if (observedRoot || !document.documentElement) return;
        observedRoot = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.target && mutation.target.nodeType === 1) {
                    if (mutation.target.matches && mutation.target.matches('.game-view')) {
                        scheduleFullInterfaceScale();
                        return;
                    }
                }
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var added = mutation.addedNodes[j];
                    if (
                        added.nodeType === 1 &&
                        ((added.matches && added.matches('.game-view')) ||
                            (added.querySelector && added.querySelector('.game-view')))
                    ) {
                        scheduleFullInterfaceScale();
                        return;
                    }
                }
            }
        });
        observedRoot.observe(document.documentElement, { childList: true, subtree: true });
    }

    function isPresetResolution(width, height) {
        for (var i = 0; i < RESOLUTIONS.length; i++) {
            if (RESOLUTIONS[i].width === width && RESOLUTIONS[i].height === height) {
                return true;
            }
        }
        return false;
    }

    function getResolutionValue(width, height) {
        return String(width || 0) + 'x' + String(height || 0);
    }

    function ensureCurrentResolutionOption(select, resolution) {
        if (!select || !resolution) return;
        var value = getResolutionValue(resolution.width, resolution.height);
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === value) {
                select.value = value;
                return;
            }
        }

        var option = document.createElement('option');
        option.value = value;
        option.textContent = t('Personalizada') + ' (' + resolution.width + 'x' + resolution.height + ')';
        option.setAttribute('data-custom-option', '1');
        select.appendChild(option);
        select.value = value;
    }

    function applyResolution(width, height, select, widthInput, heightInput) {
        saveResolution(width, height);
        if (select) {
            ensureCurrentResolutionOption(select, { width: width, height: height });
        }
        if (widthInput) widthInput.value = width > 0 ? String(width) : '';
        if (heightInput) heightInput.value = height > 0 ? String(height) : '';
        window.dispatchEvent(new Event('resize'));
        scheduleFullInterfaceScale();
    }

    function getVideoSection() {
        return document.querySelector('[data-hook="videosec"]') ||
            document.querySelector('.dialog.settings-view [data-hook="miscsec"]');
    }

    function placeContainer(videoSection, container) {
        if (!videoSection || !container) return;
        var anchor = videoSection.children[1] || videoSection.firstChild || null;
        if (container.parentElement !== videoSection) {
            if (anchor) {
                videoSection.insertBefore(container, anchor);
            } else {
                videoSection.appendChild(container);
            }
            return;
        }

        if (anchor && container !== anchor.previousSibling) {
            videoSection.insertBefore(container, anchor);
        }
    }

    function bindVideoTabRefresh() {
        var videoBtn = document.querySelector('.dialog.settings-view button[data-hook="videobtn"]');
        if (!videoBtn || videoBtn.dataset.hxdStretchedBound === '1') return;
        videoBtn.dataset.hxdStretchedBound = '1';
        videoBtn.addEventListener('click', function() {
            injectIfNeeded();
            setTimeout(injectIfNeeded, 80);
            setTimeout(injectIfNeeded, 220);
        });
    }

    function addSettingsOption() {
        var videoSection = getVideoSection();
        if (!videoSection) {
            return false;
        }
        
        var container = document.getElementById('stretched-res-row');
        if (container) {
            placeContainer(videoSection, container);
            return true;
        }

        container = document.createElement('div');
        container.id = 'stretched-res-row';
        container.style.cssText = 'margin-top:12px;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;';
        container.innerHTML =
            '<div style="color:var(--theme-text-primary, #fff);font-size:13px;font-weight:600;margin-bottom:10px;">' + t('Resolución estirada') + '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
                '<div style="color:var(--theme-text-secondary, #888);font-size:12px;min-width:90px;">' + t('Preset') + '</div>' +
                '<select id="stretched-res-select" class="hxd-ui-select" style="flex:1;min-width:180px;"></select>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
                '<div style="color:var(--theme-text-secondary, #888);font-size:12px;min-width:90px;">' + t('Personalizada') + '</div>' +
                '<input id="stretched-res-width" type="number" min="0" step="1" placeholder="' + t('Ancho') + '" style="width:110px;background:var(--theme-bg-tertiary, #272727);border:1px solid var(--theme-border-light, #333);border-radius:4px;color:var(--theme-text-primary, #fff);padding:8px 10px;outline:none;" />' +
                '<input id="stretched-res-height" type="number" min="0" step="1" placeholder="' + t('Alto') + '" style="width:110px;background:var(--theme-bg-tertiary, #272727);border:1px solid var(--theme-border-light, #333);border-radius:4px;color:var(--theme-text-primary, #fff);padding:8px 10px;outline:none;" />' +
                '<button id="stretched-res-apply" type="button" style="padding:8px 14px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:12px;font-weight:600;">' + t('Aplicar') + '</button>' +
                '<button id="stretched-res-reset" type="button" style="padding:8px 14px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:12px;font-weight:600;">' + t('Nativo') + '</button>' +
            '</div>' +
            '<div style="margin-top:10px;color:var(--theme-text-muted, #666);font-size:11px;line-height:1.4;">' + t('Podés usar un preset o guardar una resolución personalizada para el modo estirado.') + '</div>';
        
        var select = container.querySelector('select');
        var widthInput = container.querySelector('#stretched-res-width');
        var heightInput = container.querySelector('#stretched-res-height');
        var applyBtn = container.querySelector('#stretched-res-apply');
        var resetBtn = container.querySelector('#stretched-res-reset');
        var currentRes = getSavedResolution();

        RESOLUTIONS.forEach(function(res) {
            var option = document.createElement('option');
            option.value = getResolutionValue(res.width, res.height);
            option.textContent = res.label === 'Nativo' ? t('Nativo') : res.label;
            select.appendChild(option);
        });

        ensureCurrentResolutionOption(select, currentRes);
        widthInput.value = currentRes.width > 0 ? String(currentRes.width) : '';
        heightInput.value = currentRes.height > 0 ? String(currentRes.height) : '';

        select.onchange = function() {
            var parts = select.value.split('x');
            var width = parseInt(parts[0], 10) || 0;
            var height = parseInt(parts[1], 10) || 0;
            applyResolution(width, height, select, widthInput, heightInput);
        };

        applyBtn.onclick = function() {
            var width = parseInt(widthInput.value, 10) || 0;
            var height = parseInt(heightInput.value, 10) || 0;

            if (width <= 0 || height <= 0) {
                showFeedback(t('Ingresá ancho y alto válidos'), 'error');
                return;
            }

            if (width < 320 || height < 240) {
                showFeedback(t('La resolución es demasiado pequeña'), 'error');
                return;
            }

            applyResolution(width, height, select, widthInput, heightInput);
            if (!isPresetResolution(width, height)) {
                showFeedback(t('Resolución personalizada guardada'), 'success');
            }
        };

        resetBtn.onclick = function() {
            applyResolution(0, 0, select, widthInput, heightInput);
            showFeedback(t('Resolución nativa restaurada'), 'success');
        };

        placeContainer(videoSection, container);
        return true;
    }

    function injectIfNeeded() {
        if (!document.querySelector('.dialog.settings-view')) return;
        bindVideoTabRefresh();
        addSettingsOption();
    }

    injectIfNeeded();
    observeGameView();
    window.addEventListener('resize', scheduleFullInterfaceScale);
    window.addEventListener('storage', function(event) {
        if (event.key === STORAGE_KEY) scheduleFullInterfaceScale();
    });
    scheduleFullInterfaceScale();
    Injector.onView('settings-view', function() {
        injectIfNeeded();
        setTimeout(injectIfNeeded, 120);
        setTimeout(injectIfNeeded, 300);
    });
})();
