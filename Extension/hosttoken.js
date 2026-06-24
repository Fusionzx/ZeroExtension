// ============================================
// HOST TOKEN - Configuração de host token
// ============================================
(function () {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var STORAGE_KEY = 'haxball_host_token';

    // Função de tradução local
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    // Injeta aba de Host Token nas configurações
    function injectSettingsTab(doc) {
        var settingsView = doc.querySelector('.settings-view');
        if (!settingsView) return;

        var tabs = settingsView.querySelector('.tabs');
        var tabContents = settingsView.querySelector('.tabcontents');
        if (!tabs || !tabContents) return;

        var existingTabBtn = tabs.querySelector('button[data-hook="tokenbtn"]');
        var existingSection = tabContents.querySelector('.section[data-hook="tokensec"]');
        if (existingTabBtn && existingSection) {
            settingsView.dataset.hostTokenSetup = 'true';
            return;
        }

        settingsView.dataset.hostTokenSetup = 'true';

        // Cria botão da aba
        var tokenTabBtn = doc.createElement('button');
        tokenTabBtn.setAttribute('data-hook', 'tokenbtn');
        tokenTabBtn.textContent = 'Host Token';
        tabs.appendChild(tokenTabBtn);

        // Cria conteúdo da aba
        var tokenSection = doc.createElement('div');
        tokenSection.className = 'section';
        tokenSection.setAttribute('data-hook', 'tokensec');
        tabContents.appendChild(tokenSection);

        // Renderiza conteúdo
        function renderTokenSection() {
            var currentToken = '';
            try {
                currentToken = localStorage.getItem(STORAGE_KEY) || '';
            } catch (e) {
                currentToken = '';
            }

            var html = '<div style="padding:16px 20px;">' +
                '<div style="margin-bottom:20px;color:var(--theme-text-secondary, #888);font-size:13px;line-height:1.5;">' + t('Configure seu host token para criar salas sem captcha.') + '</div>' +
                '<div style="margin-bottom:16px;">' +
                '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">Host Token</label>' +
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

            // Hover effects
            tokenInput.onfocus = function () { tokenInput.style.borderColor = 'var(--theme-border-light, #444)'; };
            tokenInput.onblur = function () { tokenInput.style.borderColor = 'var(--theme-border-light, #333)'; };
            clearBtn.onmouseenter = function () { clearBtn.style.background = 'var(--theme-bg-hover, #333)'; };
            clearBtn.onmouseleave = function () { clearBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
            saveBtn.onmouseenter = function () { saveBtn.style.background = 'var(--theme-bg-hover, #333)'; };
            saveBtn.onmouseleave = function () { saveBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };

            // Limpar
            clearBtn.onclick = function () {
                tokenInput.value = '';
                try {
                    localStorage.removeItem(STORAGE_KEY);
                } catch (e) {}
                tokenInput.style.borderColor = '#333';
            };

            // Salvar
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

            // Salvar ao pressionar Enter
            tokenInput.onkeydown = function (e) {
                if (e.key === 'Enter') {
                    saveBtn.click();
                }
            };
        }

        // Lógica de troca de abas
        tokenTabBtn.onclick = function () {
            // Remove selected de todas as abas
            tabs.querySelectorAll('button').forEach(function (btn) {
                btn.classList.remove('selected');
            });
            tokenTabBtn.classList.add('selected');

            // Esconde todas as sections
            tabContents.querySelectorAll('.section').forEach(function (sec) {
                sec.classList.remove('selected');
            });
            tokenSection.classList.add('selected');

            renderTokenSection();
        };

        // Esconde nossa aba quando outras são clicadas e RESTAURA as sections padrão
        var otherTabs = tabs.querySelectorAll('button:not([data-hook="tokenbtn"])');
        otherTabs.forEach(function (btn) {
            // Usa uma função wrapper para capturar o contexto correto
            (function(button) {
                button.addEventListener('click', function () {
                    tokenTabBtn.classList.remove('selected');
                    tokenSection.classList.remove('selected');
                    
                    // IMPORTANTE: Garante que a section padrão correspondente seja mostrada
                    var hook = button.getAttribute('data-hook');
                    if (hook) {
                        // Encontra a section correspondente ao hook
                        var defaultSection = tabContents.querySelector('.section[data-hook="' + hook.replace('btn', 'sec') + '"]');
                        if (defaultSection) {
                            // Esconde todas as sections customizadas primeiro
                            tabContents.querySelectorAll('.section[data-hook="tokensec"], .section[data-hook="avatarsec"]').forEach(function (sec) {
                                sec.classList.remove('selected');
                            });
                            
                            // Garante que a section padrão seja mostrada
                            // O jogo gerencia isso, mas precisamos garantir que nossa section customizada não interfira
                            setTimeout(function () {
                                // Força a section padrão a ser mostrada se ainda não estiver
                                if (!defaultSection.classList.contains('selected')) {
                                    // Remove selected de todas e adiciona na correta
                                    tabContents.querySelectorAll('.section').forEach(function (sec) {
                                        sec.classList.remove('selected');
                                    });
                                    defaultSection.classList.add('selected');
                                }
                            }, 50);
                        }
                    }
                }, true); // Usa capture phase para garantir que seja executado antes
            })(btn);
        });

        // Renderiza se já estiver na aba
        if (tokenTabBtn.classList.contains('selected')) {
            renderTokenSection();
        }
    }

    function injectIfNeeded() {
        var settingsView = document.querySelector('.settings-view');
        if (!settingsView) return;
        var tabs = settingsView.querySelector('.tabs');
        var tabContents = settingsView.querySelector('.tabcontents');
        if (!tabs || !tabContents) return;
        if (tabs.querySelector('button[data-hook="tokenbtn"]') && tabContents.querySelector('.section[data-hook="tokensec"]')) {
            settingsView.dataset.hostTokenSetup = 'true';
            return;
        }
        injectSettingsTab(document);
    }

    function init() {
        injectIfNeeded();
        Injector.onView('settings-view', function() {
            injectIfNeeded();
            setTimeout(injectIfNeeded, 120);
            setTimeout(injectIfNeeded, 300);
        });

        Injector.log('Host Token module loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

