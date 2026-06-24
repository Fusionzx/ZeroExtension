// ============================================
// HIDE UI - Opções para ocultar Chat, Placar/Timer e Ping/FPS
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    // Função de tradução local
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    // Configurações padrão
    var settings = {
        hideChat: false,
        hideScoreboard: false,
        hidePingFps: false
    };

    var hideInterval = null;

    // Verifica se alguma opção está ativa
    function isAnyOptionActive() {
        return settings.hideChat || settings.hideScoreboard || settings.hidePingFps;
    }

    // Inicia o interval se necessário
    function startInterval() {
        if (hideInterval) return;
        if (!isAnyOptionActive()) return;
        hideInterval = setInterval(applyVisibility, 1000);
    }

    // Para o interval
    function stopInterval() {
        if (hideInterval) {
            clearInterval(hideInterval);
            hideInterval = null;
        }
    }

    // Atualiza o interval baseado nas opções
    function updateInterval() {
        if (isAnyOptionActive()) {
            startInterval();
        } else {
            stopInterval();
        }
    }

    // Carrega configurações do localStorage
    function loadSettings() {
        try {
            var saved = localStorage.getItem('hideui_settings');
            if (saved) {
                var parsed = JSON.parse(saved);
                settings.hideChat = parsed.hideChat || false;
                settings.hideScoreboard = parsed.hideScoreboard || false;
                settings.hidePingFps = parsed.hidePingFps || false;
            }
        } catch(e) {}
    }

    // Salva configurações no localStorage
    function saveSettings() {
        try {
            localStorage.setItem('hideui_settings', JSON.stringify(settings));
        } catch(e) {}
    }

    // Aplica as configurações de visibilidade
    function applyVisibility() {
        var chatbox = document.querySelector('.chatbox-view');
        if (chatbox) {
            chatbox.style.visibility = settings.hideChat ? 'hidden' : '';
            chatbox.style.pointerEvents = settings.hideChat ? 'none' : '';
        }

        var barContainer = document.querySelector('.bar-container');
        if (barContainer) {
            barContainer.style.visibility = settings.hideScoreboard ? 'hidden' : '';
            barContainer.style.pointerEvents = settings.hideScoreboard ? 'none' : '';
        }

        // Timer separado (game-timer-view) - usa display none para garantir que suma completamente
        var timer = document.querySelector('.game-timer-view');
        if (timer) {
            timer.style.display = settings.hideScoreboard ? 'none' : '';
        }

        var stats = document.querySelector('.stats-view');
        if (stats) {
            stats.style.visibility = settings.hidePingFps ? 'hidden' : '';
            stats.style.pointerEvents = settings.hidePingFps ? 'none' : '';
        }
    }

    // Adiciona opções ao menu de configurações
    function addSettingsOptions() {
        var miscSection = document.querySelector('[data-hook="miscsec"]');
        if (!miscSection) return;

        // Verifica se já foi adicionado (verifica dentro da miscSection, não no document inteiro)
        if (miscSection.querySelector('#hideui-chat')) return;

        // Função para criar toggle (estilo Haxball - sem espaçamento extra)
        function createToggle(id, label, checked, onChange) {
            var wrapper = document.createElement('div');
            wrapper.setAttribute('data-hook', id);
            wrapper.id = id;
            wrapper.classList.add('toggle');
            wrapper.style.cssText = 'cursor: pointer;';

            var icon = document.createElement('i');
            icon.classList.add(checked ? 'icon-ok' : 'icon-cancel');

            var labelEl = document.createElement('span');
            labelEl.textContent = label;

            wrapper.appendChild(icon);
            wrapper.appendChild(labelEl);

            wrapper.onclick = function() {
                checked = !checked;
                icon.classList.toggle('icon-ok', checked);
                icon.classList.toggle('icon-cancel', !checked);
                onChange(checked);
            };

            return wrapper;
        }

        // Encontra o último toggle da seção misc para inserir depois
        var lastToggle = miscSection.querySelector('[data-hook="tmisc-showchat"]');
        if (!lastToggle) return;

            var chatToggle = createToggle(
            'hideui-chat',
            t('Ocultar Chat'),
            settings.hideChat,
            function(checked) {
                settings.hideChat = checked;
                saveSettings();
                applyVisibility();
                updateInterval();
            }
        );
        lastToggle.parentNode.insertBefore(chatToggle, lastToggle.nextSibling);

        var scoreboardToggle = createToggle(
            'hideui-scoreboard',
            t('Ocultar Placar/Timer'),
            settings.hideScoreboard,
            function(checked) {
                settings.hideScoreboard = checked;
                saveSettings();
                applyVisibility();
                updateInterval();
            }
        );
        chatToggle.parentNode.insertBefore(scoreboardToggle, chatToggle.nextSibling);

        var pingfpsToggle = createToggle(
            'hideui-pingfps',
            t('Ocultar Ping/FPS'),
            settings.hidePingFps,
            function(checked) {
                settings.hidePingFps = checked;
                saveSettings();
                applyVisibility();
                updateInterval();
            }
        );
        scoreboardToggle.parentNode.insertBefore(pingfpsToggle, scoreboardToggle.nextSibling);
    }

    // Observer para detectar quando settings abre ou quando a seção misc é exibida
    function setupSettingsObserver() {
        // Observer principal para detectar quando settings abre
        var observer = new MutationObserver(function() {
            var settingsDialog = document.querySelector('.dialog.settings-view');
            if (settingsDialog) {
                // Tenta adicionar imediatamente
                addSettingsOptions();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Observer específico para a seção misc para garantir que as opções sejam adicionadas
        var miscObserver = new MutationObserver(function() {
            var miscSection = document.querySelector('[data-hook="miscsec"]');
            if (miscSection && miscSection.classList.contains('selected')) {
                // Quando a seção misc é selecionada, garante que as opções estejam lá
                setTimeout(function() {
                    addSettingsOptions();
                }, 100);
            }
        });
        
        // Observa mudanças na seção misc e nas tabs
        var checkMiscSection = setInterval(function() {
            var miscSection = document.querySelector('[data-hook="miscsec"]');
            var tabContents = document.querySelector('.tabcontents');
            if (miscSection && tabContents) {
                clearInterval(checkMiscSection);
                miscObserver.observe(miscSection, { attributes: true, attributeFilter: ['class'] });
                miscObserver.observe(tabContents, { childList: true, subtree: true });
                
                // Observa cliques nas tabs para detectar quando misc é selecionada
                var tabs = document.querySelector('.tabs');
                if (tabs) {
                    var miscBtn = tabs.querySelector('[data-hook="miscbtn"]');
                    if (miscBtn) {
                        // Remove listeners antigos se existirem
                        var newMiscBtn = miscBtn.cloneNode(true);
                        miscBtn.parentNode.replaceChild(newMiscBtn, miscBtn);
                        
                        newMiscBtn.addEventListener('click', function() {
                            setTimeout(function() {
                                addSettingsOptions();
                            }, 150);
                        });
                    }
                    
                    // Também observa a sidebar se existir
                    var sidebar = document.getElementById('settings-sidebar-panel');
                    if (sidebar) {
                        var sidebarMiscBtn = sidebar.querySelector('[data-hook-ref="miscbtn"]');
                        if (sidebarMiscBtn) {
                            sidebarMiscBtn.addEventListener('click', function() {
                                setTimeout(function() {
                                    addSettingsOptions();
                                }, 200);
                            });
                        }
                    }
                }
            }
        }, 500);
    }

    // Verifica periodicamente se as opções precisam ser adicionadas
    function startPeriodicCheck() {
        setInterval(function() {
            var settingsDialog = document.querySelector('.dialog.settings-view');
            if (settingsDialog) {
                addSettingsOptions();
                
                // Também verifica se a sidebar existe e adiciona listener se necessário
                var sidebar = document.getElementById('settings-sidebar-panel');
                if (sidebar) {
                    var sidebarMiscBtn = sidebar.querySelector('[data-hook-ref="miscbtn"]');
                    if (sidebarMiscBtn && !sidebarMiscBtn.dataset.hideuiListener) {
                        sidebarMiscBtn.dataset.hideuiListener = 'true';
                        sidebarMiscBtn.addEventListener('click', function() {
                            setTimeout(function() {
                                addSettingsOptions();
                            }, 200);
                        });
                    }
                }
            }
        }, 1000);
    }

    // Inicialização
    function init() {
        if (!Injector.isGameFrame()) return;

        loadSettings();
        
        setTimeout(function() {
            applyVisibility();
            setupSettingsObserver();
            startPeriodicCheck(); // Adiciona verificação periódica
            updateInterval();
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
