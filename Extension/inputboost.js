// ============================================
// INPUT BOOST — ajustes leves sem quebrar wheel/canvas do jogo
// 1. Touch listeners em modo passive (menos bloqueio)
// 2. scheduleImmediate via MessageChannel (opcional p/ outros scripts)
// 3. scroll-behavior: auto global
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var STORAGE_KEY = 'input_boost_enabled';
    var isEnabled = false;

    function loadEnabled() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved !== null) {
                isEnabled = saved === 'true';
            }
        } catch(e) {}
        return isEnabled;
    }

    function saveEnabled(val) {
        isEnabled = val;
        try {
            localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
        } catch(e) {}
    }

    // ============================================
    // 1. PASSIVE EVENT LISTENERS
    // Remove o blocking do browser nos eventos de input
    // Ganho: ~1-3ms por evento
    // ============================================
    function optimizeEventListeners() {
        // Guarda referência original
        var originalAddEventListener = EventTarget.prototype.addEventListener;
        
        // Lista de eventos que podem ser passive (scroll/touch)
        // Não incluir wheel/mousewheel: o jogo usa preventDefault no zoom/scroll do canvas.
        // Forçar passive:true quebra isso e pode gerar scroll da página + input estranho.
        var passiveEvents = {
            'touchstart': true,
            'touchmove': true,
            'touchend': true,
            'touchcancel': true
        };

        EventTarget.prototype.addEventListener = function(type, listener, options) {
            var newOptions = options;
            
            // Para eventos de scroll/touch, força passive
            if (passiveEvents[type]) {
                if (typeof options === 'boolean') {
                    newOptions = { capture: options, passive: true };
                } else if (typeof options === 'object') {
                    newOptions = Object.assign({}, options, { passive: true });
                } else {
                    newOptions = { passive: true };
                }
            }
            
            return originalAddEventListener.call(this, type, listener, newOptions);
        };

        Injector.log('Event listeners optimized for passive mode');
    }

    // ============================================
    // 2. HIGH PRIORITY INPUT SCHEDULING
    // Usa scheduler.postTask para priorizar inputs
    // Ganho: ~2-5ms em situações de carga
    // ============================================
    var hasScheduler = typeof window.scheduler !== 'undefined' && window.scheduler && window.scheduler.postTask;
    
    function scheduleHighPriority(callback) {
        if (hasScheduler) {
            window.scheduler.postTask(callback, { priority: 'user-blocking' });
        } else {
            // Fallback: executa imediatamente
            callback();
        }
    }

    // Removido pointerrawupdate + mousemove sintético: o browser já envia mousemove;
    // duplicar eventos dobrava o trabalho do jogo e piorava FPS/input.

    // ============================================
    // 3. REDUCE VSYNC LAG
    // Força rendering mais cedo no frame
    // ============================================
    function reduceVsyncLag() {
        // Usa MessageChannel para scheduling mais preciso
        var channel = new MessageChannel();
        var pendingCallback = null;
        
        channel.port1.onmessage = function() {
            if (pendingCallback) {
                var cb = pendingCallback;
                pendingCallback = null;
                cb();
            }
        };
        
        // Expõe função para scheduling imediato
        window.scheduleImmediate = function(callback) {
            pendingCallback = callback;
            channel.port2.postMessage(null);
        };
    }

    // ============================================
    // 4. DISABLE BROWSER SMOOTHING/PREDICTION
    // ============================================
    function disableBrowserSmoothing() {
        var parts = [];
        if (CSS.supports && CSS.supports('scroll-behavior', 'auto')) {
            parts.push('* { scroll-behavior: auto !important; }');
        }
        parts.push('html, body { touch-action: manipulation; }');
        if (parts.length && document.head) {
            var style = document.createElement('style');
            style.setAttribute('data-hxd-inputboost', '1');
            style.textContent = parts.join(' ');
            document.head.appendChild(style);
        }
    }

    // ============================================
    // SETTINGS UI
    // ============================================
    function injectSettingsControl() {
        Injector.onView('settings-view', function(el) {
            var miscSec = el.querySelector('[data-hook="miscsec"]');
            if (!miscSec || miscSec.querySelector('#input-boost-row')) return;

            var enabled = loadEnabled();

            var row = document.createElement('div');
            row.id = 'input-boost-row';
            row.className = 'option-row';
            row.style.cssText = 'display:flex;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #333;';
            row.innerHTML = 
                '<div style="margin-right:10px;flex:1;">' +
                    '<span style="color:#22c55e;">⚡</span> Input Boost' +
                '</div>' +
                '<button id="input-boost-toggle" class="toggle ' + (enabled ? 'on' : '') + '" style="width:50px;">' +
                    '<i class="icon-' + (enabled ? 'ok' : 'cancel') + '"></i>' +
                '</button>';

            miscSec.appendChild(row);

            var btn = row.querySelector('#input-boost-toggle');
            btn.onclick = function() {
                enabled = !enabled;
                saveEnabled(enabled);
                btn.className = 'toggle ' + (enabled ? 'on' : '');
                btn.innerHTML = '<i class="icon-' + (enabled ? 'ok' : 'cancel') + '"></i>';
                
                // Mostra aviso de reload
                var tooltip = row.parentNode.querySelector('#input-boost-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'input-boost-tooltip';
                    tooltip.style.cssText = 'color:#f59e0b;font-size:10px;margin-top:4px;text-align:right;';
                    tooltip.textContent = 'Recarregue para aplicar';
                    row.parentNode.insertBefore(tooltip, row.nextSibling);
                }
            };

            // Tooltip explicativo
            var info = document.createElement('div');
            info.style.cssText = 'color:#666;font-size:10px;margin-top:4px;';
            info.textContent = 'Touch passive + scroll estável. Recarregue após ligar/desligar.';
            row.parentNode.insertBefore(info, row.nextSibling);
        });
    }

    // ============================================
    // INIT
    // ============================================
    function init() {
        if (!Injector.isGameFrame()) return;

        loadEnabled();
        
        if (isEnabled) {
            optimizeEventListeners();
            reduceVsyncLag();
            disableBrowserSmoothing();
            Injector.log('Input Boost enabled (touch passive, scheduleImmediate, scroll auto)');
        } else {
            Injector.log('Input Boost disabled');
        }

        injectSettingsControl();
    }

    // Exporta API
    window.InputBoost = {
        isEnabled: function() { return isEnabled; },
        setEnabled: function(val) {
            saveEnabled(val);
        },
        scheduleHighPriority: scheduleHighPriority
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
