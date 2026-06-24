// ============================================
// QUICK AVATAR - Atalhos de teclado para avatares
// ============================================
(function () {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var STORAGE_KEY = 'quick_avatars';
    var bindings = [];
    var isListeningForKey = false;
    var pendingBindingIndex = null;

    // Função de tradução local
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    // Carrega bindings do localStorage
    function loadBindings() {
        try {
            bindings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            bindings = [];
        }
        return bindings;
    }

    // Salva bindings no localStorage
    function saveBindings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
    }

    // Aplica avatar no jogo
    function applyAvatar(avatar) {
        if (!avatar) return;

        // Encontra o input de avatar e aplica
        var chatInput = document.querySelector('input[data-hook="input"]');
        if (chatInput) {
            var originalValue = chatInput.value;
            chatInput.value = '/avatar ' + avatar;
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Simula Enter
            var enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            chatInput.dispatchEvent(enterEvent);

            // Restaura valor original
            setTimeout(function () {
                chatInput.value = originalValue;
            }, 50);
        }
    }

    // Listener global de teclas
    function setupKeyListener() {
        document.addEventListener('keydown', function (e) {
            // Ignora se estiver digitando em input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Ignora teclas de movimento/jogo
            var ignoredKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape'];
            if (ignoredKeys.indexOf(e.code) !== -1) return;

            // Procura binding correspondente
            for (var i = 0; i < bindings.length; i++) {
                if (bindings[i].key === e.code) {
                    e.preventDefault();
                    applyAvatar(bindings[i].avatar);
                    break;
                }
            }
        });
    }

    // Injeta aba de Quick Avatar nas configurações
    function injectSettingsTab(doc) {
        var settingsView = doc.querySelector('.settings-view');
        if (!settingsView) return;

        var tabs = settingsView.querySelector('.tabs');
        var tabContents = settingsView.querySelector('.tabcontents');
        if (!tabs || !tabContents) return;

        var existingTabBtn = tabs.querySelector('button[data-hook="avatarbtn"]');
        var existingSection = tabContents.querySelector('.section[data-hook="avatarsec"]');
        if (existingTabBtn && existingSection) {
            settingsView.dataset.quickAvatarSetup = 'true';
            return;
        }

        settingsView.dataset.quickAvatarSetup = 'true';

        // Cria botão da aba
        var avatarTabBtn = doc.createElement('button');
        avatarTabBtn.setAttribute('data-hook', 'avatarbtn');
        avatarTabBtn.textContent = 'Avatars';
        tabs.appendChild(avatarTabBtn);

        // Cria conteúdo da aba
        var avatarSection = doc.createElement('div');
        avatarSection.className = 'section';
        avatarSection.setAttribute('data-hook', 'avatarsec');
        tabContents.appendChild(avatarSection);

        // Renderiza conteúdo
        function renderAvatarSection() {
            loadBindings();

            var html = '<div style="padding:16px 20px;">' +
                '<div style="margin-bottom:20px;color:var(--theme-text-secondary, #888);font-size:13px;line-height:1.5;">' + t('Defina teclas de atalho para trocar de avatar rapidamente durante o jogo.') + '</div>';

            // Lista de bindings existentes
            if (bindings.length > 0) {
                html += '<div style="margin-bottom:16px;">';
                for (var i = 0; i < bindings.length; i++) {
                    var b = bindings[i];
                    var keyDisplay = b.key.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num');
                    html += '<div class="inputrow quick-avatar-row" data-index="' + i + '" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border, #232323);border-radius:6px;margin-bottom:8px;">' +
                        '<div style="min-width:50px;padding:6px 12px;background:var(--theme-bg-tertiary, #272727);border-radius:4px;text-align:center;color:var(--theme-text-primary, #fff);font-weight:600;font-size:13px;">' + keyDisplay + '</div>' +
                        '<div style="flex:1;color:var(--theme-text-primary, #fff);font-size:14px;">' + (b.avatar || '<span style="color:var(--theme-text-muted, #666);">(' + t('vazio') + ')</span>') + '</div>' +
                        '<button class="edit-avatar-btn" data-index="' + i + '" style="padding:6px 12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:12px;transition:background 0.15s;">' + t('Editar') + '</button>' +
                        '<button class="remove-avatar-btn" data-index="' + i + '" style="padding:6px 10px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:4px;color:#ff4444;cursor:pointer;transition:background 0.15s;"><i class="icon-cancel"></i></button>' +
                        '</div>';
                }
                html += '</div>';
            }

            // Botão de adicionar
            html += '<button id="add-avatar-binding" style="padding:10px 16px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;transition:background 0.15s;width:100%;">' +
                '<i class="icon-plus"></i> ' + t('Adicionar atalho') +
                '</button></div>';

            avatarSection.innerHTML = html;

            // Event listeners com hover
            avatarSection.querySelectorAll('.remove-avatar-btn').forEach(function (btn) {
                btn.onmouseenter = function () { btn.style.background = 'var(--theme-bg-hover, #333)'; };
                btn.onmouseleave = function () { btn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                btn.onclick = function () {
                    var idx = parseInt(btn.dataset.index);
                    bindings.splice(idx, 1);
                    saveBindings();
                    renderAvatarSection();
                };
            });

            avatarSection.querySelectorAll('.edit-avatar-btn').forEach(function (btn) {
                btn.onmouseenter = function () { btn.style.background = 'var(--theme-bg-hover, #333)'; };
                btn.onmouseleave = function () { btn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                btn.onclick = function () {
                    var idx = parseInt(btn.dataset.index);
                    showEditDialog(doc, idx);
                };
            });

            var addBtn = avatarSection.querySelector('#add-avatar-binding');
            if (addBtn) {
                addBtn.onmouseenter = function () { addBtn.style.background = 'var(--theme-bg-hover, #333)'; };
                addBtn.onmouseleave = function () { addBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
                addBtn.onclick = function () {
                    showEditDialog(doc, -1); // -1 = novo
                };
            }
        }

        // Dialog de edição
        function showEditDialog(doc, index) {
            var isNew = index === -1;
            var binding = isNew ? { key: '', avatar: '' } : bindings[index];

            // Remove dialog existente
            var existing = doc.getElementById('avatar-edit-dialog');
            if (existing) existing.remove();

            var overlay = doc.createElement('div');
            overlay.id = 'avatar-edit-dialog';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:10001;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';

            var dialog = doc.createElement('div');
            dialog.style.cssText = 'background:var(--theme-bg-primary, #141414);border:1px solid var(--theme-border, #232323);border-radius:8px;padding:24px;min-width:340px;box-shadow:0 8px 32px rgba(0,0,0,0.5);';

            dialog.innerHTML = '<h2 style="color:var(--theme-text-primary, #fff);font-size:18px;font-weight:600;margin:0 0 20px 0;text-align:center;">' + (isNew ? t('Novo Atalho') : t('Editar Atalho')) + '</h2>' +
                '<div style="margin-bottom:16px;">' +
                '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Tecla de Atalho') + '</label>' +
                '<button id="key-capture-btn" style="width:100%;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;text-align:center;font-size:14px;transition:all 0.15s;">' + (binding.key ? binding.key.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num') : t('Clique para definir tecla')) + '</button>' +
                '</div>' +
                '<div style="margin-bottom:20px;">' +
                '<label style="display:block;color:var(--theme-text-secondary, #888);font-size:12px;margin-bottom:6px;font-weight:500;">' + t('Avatar (emoji ou texto)') + '</label>' +
                '<input id="avatar-input" type="text" value="' + (binding.avatar || '') + '" maxlength="2" style="width:100%;padding:12px;background:var(--theme-bg-secondary, #1a1a1a);border:1px solid var(--theme-border-light, #333);border-radius:6px;color:var(--theme-text-primary, #fff);font-size:18px;text-align:center;box-sizing:border-box;outline:none;transition:border-color 0.15s;" placeholder="🎮">' +
                '</div>' +
                '<div style="display:flex;gap:10px;">' +
                '<button id="cancel-avatar-btn" style="flex:1;padding:12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:14px;transition:background 0.15s;">' + t('Cancelar') + '</button>' +
                '<button id="save-avatar-btn" style="flex:1;padding:12px;background:var(--theme-bg-tertiary, #272727);border:none;border-radius:6px;color:var(--theme-text-primary, #fff);cursor:pointer;font-size:14px;font-weight:600;transition:background 0.15s;">' + t('Salvar') + '</button>' +
                '</div>';

            overlay.appendChild(dialog);
            doc.body.appendChild(overlay);

            var capturedKey = binding.key;
            var keyBtn = dialog.querySelector('#key-capture-btn');
            var avatarInput = dialog.querySelector('#avatar-input');
            var cancelBtn = dialog.querySelector('#cancel-avatar-btn');
            var saveBtn = dialog.querySelector('#save-avatar-btn');

            // Hover effects
            keyBtn.onmouseenter = function () { if (keyBtn.style.borderColor !== 'rgb(245, 158, 11)') keyBtn.style.background = 'var(--theme-bg-hover, #222)'; };
            keyBtn.onmouseleave = function () { if (keyBtn.style.borderColor !== 'rgb(245, 158, 11)') keyBtn.style.background = 'var(--theme-bg-secondary, #1a1a1a)'; };
            avatarInput.onfocus = function () { avatarInput.style.borderColor = 'var(--theme-border-light, #444)'; };
            avatarInput.onblur = function () { avatarInput.style.borderColor = 'var(--theme-border-light, #333)'; };
            cancelBtn.onmouseenter = function () { cancelBtn.style.background = 'var(--theme-bg-hover, #333)'; };
            cancelBtn.onmouseleave = function () { cancelBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };
            saveBtn.onmouseenter = function () { saveBtn.style.background = 'var(--theme-bg-hover, #333)'; };
            saveBtn.onmouseleave = function () { saveBtn.style.background = 'var(--theme-bg-tertiary, #272727)'; };

            // Captura de tecla
            keyBtn.onclick = function () {
                keyBtn.textContent = t('Pressione uma tecla...');
                keyBtn.style.borderColor = '#f59e0b';
                keyBtn.style.background = '#1a1a1a';

                var keyHandler = function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Ignora teclas de sistema
                    var ignored = ['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
                    if (ignored.indexOf(e.code) !== -1) {
                        keyBtn.textContent = t('Tecla inválida, tente outra');
                        keyBtn.style.borderColor = '#ff4444';
                        setTimeout(function () {
                            keyBtn.textContent = binding.key ? binding.key.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num') : t('Clique para definir tecla');
                            keyBtn.style.borderColor = '#333';
                        }, 1500);
                        return;
                    }

                    capturedKey = e.code;
                    keyBtn.textContent = e.code.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num');
                    keyBtn.style.borderColor = '#333';
                    doc.removeEventListener('keydown', keyHandler, true);
                };

                doc.addEventListener('keydown', keyHandler, true);
            };

            // Cancelar
            cancelBtn.onclick = function () {
                overlay.remove();
            };

            // Salvar
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

                saveBindings();
                overlay.remove();
                renderAvatarSection();
            };

            // Fechar ao clicar fora
            overlay.onclick = function (e) {
                if (e.target === overlay) overlay.remove();
            };
        }

        // Lógica de troca de abas
        avatarTabBtn.onclick = function () {
            // Remove selected de todas as abas
            tabs.querySelectorAll('button').forEach(function (btn) {
                btn.classList.remove('selected');
            });
            avatarTabBtn.classList.add('selected');

            // Esconde todas as sections
            tabContents.querySelectorAll('.section').forEach(function (sec) {
                sec.classList.remove('selected');
            });
            avatarSection.classList.add('selected');

            renderAvatarSection();
        };

        // Esconde nossa aba quando outras são clicadas e RESTAURA as sections padrão
        var otherTabs = tabs.querySelectorAll('button:not([data-hook="avatarbtn"])');
        otherTabs.forEach(function (btn) {
            // Usa uma função wrapper para capturar o contexto correto
            (function(button) {
                button.addEventListener('click', function () {
                    avatarTabBtn.classList.remove('selected');
                    avatarSection.classList.remove('selected');
                    
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
        if (avatarTabBtn.classList.contains('selected')) {
            renderAvatarSection();
        }
    }

    function injectIfNeeded() {
        var settingsView = document.querySelector('.settings-view');
        if (!settingsView) return;
        var tabs = settingsView.querySelector('.tabs');
        var tabContents = settingsView.querySelector('.tabcontents');
        if (!tabs || !tabContents) return;
        if (tabs.querySelector('button[data-hook="avatarbtn"]') && tabContents.querySelector('.section[data-hook="avatarsec"]')) {
            settingsView.dataset.quickAvatarSetup = 'true';
            return;
        }
        injectSettingsTab(document);
    }

    function init() {
        loadBindings();
        setupKeyListener();

        injectIfNeeded();
        Injector.onView('settings-view', function() {
            injectIfNeeded();
            setTimeout(injectIfNeeded, 120);
            setTimeout(injectIfNeeded, 300);
        });

        Injector.log('Quick Avatar module loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
