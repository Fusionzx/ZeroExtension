// ============================================
// CORE - Utilitários de injeção
// ============================================
var __hxdNoop = function() { };
if (typeof console !== 'undefined') {
    console.log = __hxdNoop;
    console.warn = __hxdNoop;
    console.info = __hxdNoop;
}

(function lockBrowserZoomForHaxball() {
    try {
        if (window.self === window.top && chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'lockPageZoom' }, function () {
                void chrome.runtime.lastError;
            });
        }
    } catch (eLockZoom) {}

})();

var Injector = {
    waitForHead: function() {
        return new Promise(function(resolve) {
            if (document.head) return resolve(document.head);
            var observer = new MutationObserver(function(_, obs) {
                if (document.head) {
                    obs.disconnect();
                    resolve(document.head);
                }
            });
            observer.observe(document.documentElement || document, { childList: true, subtree: true });
        });
    },

    waitForElement: function(selector, timeout) {
        timeout = typeof timeout === 'number' ? timeout : 10000;
        return new Promise(function(resolve) {
            var observer = null;
            var timer = null;
            var settled = false;

            function finish(found) {
                if (settled) return;
                settled = true;
                if (observer) observer.disconnect();
                if (timer) clearTimeout(timer);
                resolve(found || null);
            }

            function find() {
                var found = document.querySelector(selector);
                if (found) finish(found);
                return found;
            }

            if (find()) return;

            function observe() {
                if (settled) return;
                // `body` may be created between the first lookup and this observer.
                // Check again before observing, otherwise waitForElement('body') always times out.
                if (find()) return;
                var root = document.body || document.documentElement || document;
                observer = new MutationObserver(function() {
                    find();
                });
                observer.observe(root, { childList: true, subtree: true });
            }

            observe();
            timer = setTimeout(function() { finish(null); }, timeout);
        });
    },

    injectCSS: function(id, css) {
        if (document.getElementById(id)) return Promise.resolve();
        return this.waitForHead().then(function(head) {
            if (document.getElementById(id)) return;
            var style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            head.appendChild(style);
        });
    },

    log: function(msg) { /* disabled */ },
    
    isMainFrame: function() { return window.self === window.top; },

    /**
     * Documento donde corre la UI del juego. HaxBall puede cargarlo como iframe o como /play
     * directo en el frame principal, así que no alcanza con descartar siempre el top frame.
     */
    isGameDocument: function() {
        try {
            var loc = (window.location.href || '').toLowerCase();
            if (!loc) return false;
            return loc.indexOf('html5.haxball.com') !== -1 ||
                loc.indexOf('game.html') !== -1 ||
                loc.indexOf('haxball.com') !== -1;
        } catch (e) {
            return false;
        }
    },

    isGameFrame: function() {
        return this.isGameDocument();
    },

    /** Mismo shell que settings-preview y roomlist-preview (ancho/alto del diálogo). */
    getPreviewShellSize: function(win) {
        win = win || window;
        var vh = win.innerHeight || 800;
        var vw = win.innerWidth || 1200;
        return {
            width: Math.min(1100, Math.max(720, vw - 48)),
            height: Math.min(820, Math.max(520, Math.floor(vh * 0.92)))
        };
    },

    applyPreviewShellSize: function(dialog, dialogClass) {
        if (!dialog) return;
        var sz = this.getPreviewShellSize();
        dialog.style.boxSizing = 'border-box';
        dialog.style.position = 'relative';
        dialog.style.setProperty('width', sz.width + 'px', 'important');
        dialog.style.setProperty('min-width', sz.width + 'px', 'important');
        dialog.style.setProperty('max-width', sz.width + 'px', 'important');
        dialog.style.setProperty('min-height', sz.height + 'px', 'important');
        dialog.style.setProperty('height', sz.height + 'px', 'important');
        dialog.style.setProperty('max-height', '95vh', 'important');
        dialog.style.padding = '0';
        dialog.style.overflow = 'hidden';
        dialog.style.borderRadius = '16px';
        if (dialogClass) dialog.classList.add(dialogClass);
    },

    // Sistema de eventos de view (leve - observa só o container de views)
    _viewListeners: {},
    _viewChangeListeners: [],
    _lastView: null,
    
    onView: function(viewClass, callback) {
        if (!this._viewListeners[viewClass]) {
            this._viewListeners[viewClass] = [];
        }
        this._viewListeners[viewClass].push(callback);
    },

    // Callback quando sai de uma view específica
    onViewLeave: function(viewClass, callback) {
        if (!this._viewListeners['_leave_' + viewClass]) {
            this._viewListeners['_leave_' + viewClass] = [];
        }
        this._viewListeners['_leave_' + viewClass].push(callback);
    },

    _initViewObserver: function() {
        var self = this;
        /**
         * NO usar div[class$='view']: con admin la clase es "room-view admin" y el atributo
         * class termina en "admin", no en "view" → waitForElement hace timeout y nunca
         * se registran los listeners de sala (shortcuts K/B/A, mute, verified, etc.).
         */
        var viewSelector = '.view-wrapper, div.room-view, div.game-view';
        this.waitForElement(viewSelector).then(function(el) {
            if (!el) return;
            var currentView = el;
            if (currentView.classList && !currentView.classList.contains('view-wrapper')) {
                var p = currentView.parentNode;
                if (p && p.classList && p.classList.contains('view-wrapper')) {
                    currentView = p;
                } else if (p) {
                    currentView = p;
                }
            }
            
            function isRootGameViewNode(node) {
                if (!node || node.nodeType !== 1) return false;
                var c = node.className;
                if (typeof c !== 'string' || !c) return false;
                if (c.indexOf('player-list-item') !== -1) return false;
                if (c.indexOf('list-item') !== -1 && c.indexOf('player') !== -1) return false;
                if (c === 'chat-row') return false;
                // Sólo "pantallas" base; si no filtramos, cada jugador que entra dispara listeners
                // y stopRoomListTracking / observeRoomLists en bucle → crash.
                return /(^|\s)(game-view|room-view|create-room-view|choose-nickname-view|roomlist-view|leave-room-view)(\s|$)/.test(c);
            }

            var observer = new MutationObserver(function(mutations) {
                var candidates = [];
                for (var mi = 0; mi < mutations.length; mi++) {
                    var nodes = mutations[mi].addedNodes;
                    for (var ni = 0; ni < nodes.length; ni++) {
                        if (isRootGameViewNode(nodes[ni])) candidates.push(nodes[ni]);
                    }
                }
                if (candidates.length >= 1) {
                    for (var i = 0; i < candidates.length; i++) {
                        var viewClass = candidates[i].className;
                        
                        // Notifica listeners de saída da view anterior
                        if (self._lastView && self._lastView !== viewClass) {
                            for (var key in self._viewListeners) {
                                if (key.indexOf('_leave_') === 0) {
                                    var leaveViewClass = key.replace('_leave_', '');
                                    if (self._lastView === leaveViewClass || self._lastView.indexOf(leaveViewClass) !== -1) {
                                        var leaveListeners = self._viewListeners[key];
                                        for (var l = 0; l < leaveListeners.length; l++) {
                                            try { leaveListeners[l](); } catch(e) {}
                                        }
                                    }
                                }
                            }
                        }
                        
                        self._lastView = viewClass;
                        
                        // Notifica listeners registrados
                        for (var key in self._viewListeners) {
                            if (key.indexOf('_leave_') === 0) continue;
                            if (viewClass === key || viewClass.indexOf(key) !== -1) {
                                var listeners = self._viewListeners[key];
                                for (var j = 0; j < listeners.length; j++) {
                                    try { listeners[j](candidates[i], viewClass); } catch(e) {}
                                }
                            }
                        }
                    }
                }
            });
            
            observer.observe(currentView, { childList: true, subtree: true });
            self.log('View observer initialized');
        }).catch(function() {});
    }
};

window.Injector = Injector;

(function() {
    function resolveHxdLocalApiBase() {
        try {
            if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                return String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/$/, '');
            }
        } catch (e0) {}
        return 'http://127.0.0.1:5483';
    }

    /**
     * Abre http(s) en el navegador del sistema: POST /open-external (Electron → shell.openExternal).
     * Fallback: window.open si el servidor local no responde.
     */
    window.__hxdOpenExternalUrl = function(url) {
        var u = String(url == null ? '' : url).trim();
        if (!u) return;
        if (!/^https?:\/\//i.test(u)) {
            u = 'https://' + u;
        }
        var base = resolveHxdLocalApiBase();
        fetch(base + '/open-external', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: u })
        }).catch(function() {
            try {
                window.open(u, '_blank', 'noopener,noreferrer');
            } catch (e1) {}
        });
    };
})();

(function() {
    window.__hxdIsAnonymousMode = function() {
        return false;
    };

    window.__hxdSetAnonymousMode = function() {
        try {
            localStorage.removeItem('hxd_anonymous_mode');
            localStorage.removeItem('ghost_mode');
        } catch (e2) {}
        try {
            window.dispatchEvent(new CustomEvent('hxd-anonymous-mode-changed', { detail: { on: false } }));
        } catch (e3) {}
    };

    // Shell (ventana padre) guarda el modo en su localStorage; el juego corre en iframe con otro origen — sincronizar por postMessage.
    if (!Injector.isMainFrame()) {
        window.addEventListener('message', function(ev) {
            if (!ev.data || ev.data.type !== 'hxd-sync-anonymous') return;
            window.__hxdSetAnonymousMode(false);
        });
    }
})();

// Sistema de Toast (substitui alert/confirm/prompt)
(function() {
    var toastContainer = null;
    
    function getContainer() {
        if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(toastContainer);
        return toastContainer;
    }
    
    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 4000;
        
        var container = getContainer();
        var toast = document.createElement('div');
        
        var bgColor = type === 'error' ? '#dc2626' : type === 'success' ? '#22c55e' : '#333';
        toast.style.cssText = 'background:' + bgColor + ';color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;max-width:350px;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;opacity:0;transform:translateX(100%);transition:all 0.3s ease;';
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Anima entrada
        setTimeout(function() {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove após duração
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }
    
    // Expõe globalmente
    window.showToast = showToast;
    
    // Sobrescreve alert/confirm/prompt
    window.alert = function(msg) {
        showToast(msg, 'info', 5000);
    };
    
    window.confirm = function(msg) {
        showToast(msg, 'info', 5000);
        return true; // Sempre retorna true (confirma)
    };
    
    window.prompt = function(msg, defaultVal) {
        showToast(msg, 'info', 5000);
        return defaultVal || null;
    };
})();

// Inicializa o observer de views no game frame
if (Injector.isGameFrame()) {
    Injector._initViewObserver();
    
    // Encaminha tecla ' para o parent frame (toggle header)
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === "'") {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({ type: 'toggleHeader' }, '*');
        }
    }, true);
    
    // Handler de downloads removido - agora usa servidor local diretamente
}

// Handler de downloads no top frame - recebe do iframe e faz download
if (Injector.isMainFrame()) {
    // Implementação do saveAs baseada no FileSaver.js
    var saveAs = function(blob, filename) {
        var URL = window.URL || window.webkitURL;
        var url = URL.createObjectURL(blob);
        var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        save_link.href = url;
        save_link.download = filename;
        
        var event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        save_link.dispatchEvent(event);
        
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 60000);
    };
    
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'haxball-save-replay') {
            var base64 = event.data.data;
            var filename = event.data.filename;
            
            // Converte base64 pra blob e baixa automaticamente
            var byteChars = atob(base64);
            var byteNumbers = new Array(byteChars.length);
            for (var i = 0; i < byteChars.length; i++) {
                byteNumbers[i] = byteChars.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            var blob = new Blob([byteArray], { type: 'application/octet-stream' });
            
            saveAs(blob, filename);
            
            // Mensagem traduzida
            var lang = window.__haxLang || 'es';
            var msg = lang === 'pt'
                ? 'Replay salvo na pasta Downloads'
                : (lang === 'en' ? 'Replay saved to Downloads' : 'Replay guardado en Descargas');
            
            // Toast customizado com ícone e cores do tema
            var container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
                document.body.appendChild(container);
            }
            
            var toast = document.createElement('div');
            toast.style.cssText = 'background:var(--theme-bg-tertiary, #272727);color:var(--theme-text-primary, #fff);padding:12px 16px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;border:1px solid var(--theme-border, #333);opacity:0;transform:translateX(100%);transition:all 0.3s ease;pointer-events:auto;';
            
            // Ícone de check verde (SVG inline)
            var icon = document.createElement('span');
            icon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            icon.style.cssText = 'display:flex;align-items:center;flex-shrink:0;';
            
            var text = document.createElement('span');
            text.textContent = msg;
            
            toast.appendChild(icon);
            toast.appendChild(text);
            container.appendChild(toast);
            
            // Anima entrada
            setTimeout(function() {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(0)';
            }, 10);
            
            // Remove após 4 segundos
            setTimeout(function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(function() {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 300);
            }, 4000);
        }
    });
}
