    // ============================================
    // TEAMS - Sistema de equipes
    // ============================================
    (function() {
        /** Proxy local do Electron (main → API haxzero); coincide con config.js LOCAL_SERVER. */
        var API_BASE = (function resolveTeamsApiBase() {
            try {
                var meta = document.querySelector('meta[name="hxd-local-api"]');
                if (meta && meta.content) return String(meta.content).replace(/\/+$/, '');
            } catch (eMeta) {}
            try {
                var parentMeta = window.parent.document.querySelector('meta[name="hxd-local-api"]');
                if (parentMeta && parentMeta.content) return String(parentMeta.content).replace(/\/+$/, '');
            } catch (eParent) {}
            try {
                if (window.HaxDesktopConfig && window.HaxDesktopConfig.LOCAL_SERVER) {
                    return String(window.HaxDesktopConfig.LOCAL_SERVER).replace(/\/$/, '');
                }
            } catch (e0) {}
            return 'http://127.0.0.1:5483';
        })();
        var teamsPanelOpen = false;
        var teamsCache = {};
        var myTeam = null;
        var myTeamLoaded = false;
        var myLocalTeamInfo = null; // Info da equipe do jogador local pra badge
        var useLocalStorage = false; // Flag para usar fallback local
        /** Discord del jugador en este iframe; sirve para owner_discord_id si la API no manda member_role a tiempo. */
        var teamsViewerDiscordId = null;
        var teamChatPollTimer = null;
        var teamChatLastId = 0;
        var teamChatLastAuthorId = null;
        var teamChatDocRef = null;

        /** Normaliza lo que escribís al invitar (@usuario, user#1234, espacios). */
        function normalizeTeamInviteInput(raw) {
            var s = String(raw || '').trim();
            if (!s) return '';
            if (s.charAt(0) === '@') s = s.slice(1).trim();
            var hash = s.indexOf('#');
            if (hash > 0 && /\#\d{4}$/.test(s)) s = s.slice(0, hash).trim();
            return s;
        }

        function escapeHtml(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeAttr(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;');
        }

        function validateTeamNameForCreate(name) {
            var n = String(name || '')
                .replace(/\u200B/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (n.length < 3) return { ok: false, error: t('Nome deve ter pelo menos 3 caracteres') };
            if (n.length > 30) return { ok: false, error: t('El nombre no puede superar 30 caracteres') };
            return { ok: true, name: n };
        }

        function deriveTeamTag(explicitTag, name) {
            var raw = String(explicitTag || '')
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');
            if (raw.length >= 1) return raw.slice(0, 4);
            var fromName = String(name || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');
            var slice = fromName.slice(0, 4);
            return slice.length ? slice : 'TEAM';
        }

        function syncMyLocalTeamInfoFromMyTeam() {
            if (myTeam && myTeam.name) {
                myLocalTeamInfo = {
                    name: myTeam.name,
                    tag: myTeam.tag,
                    color: myTeam.color || '#666666',
                    logo_url: myTeam.logo_url || null
                };
            } else {
                myLocalTeamInfo = null;
            }
        }

        function fetchTeamsUserProfile() {
            return fetch(API_BASE + '/user')
                .then(function(r) {
                    return r.json();
                })
                .catch(function() {
                    return { nick: 'Player' };
                })
                .then(function(user) {
                    if (user && (user.nick || user.discord_id)) return user;
                    return { nick: 'Player' };
                });
        }

        function fetchTeamsMyJson() {
            return fetch(API_BASE + '/teams/my')
                .then(function(r) {
                    return r.json();
                })
                .then(function(team) {
                    if (team && team.name) return team;
                    return null;
                });
        }

        /** API puede mandar role con otro casing o omitirlo en /teams/my; los miembros sí traen role. */
        function roleLooksOwner(role) {
            return String(role || '')
                .trim()
                .toLowerCase() === 'owner';
        }

        function roleLooksModerator(role) {
            return String(role || '')
                .trim()
                .toLowerCase() === 'moderator';
        }

        function memberRoleBadgeClass(role) {
            if (roleLooksOwner(role)) return 'tm-tag tm-tag--owner';
            if (roleLooksModerator(role)) return 'tm-tag tm-tag--mod';
            return 'tm-tag tm-tag--member';
        }

        function memberRoleShortLabel(role) {
            if (roleLooksOwner(role)) return t('Rol dueño');
            if (roleLooksModerator(role)) return t('Equipo rol admin');
            return t('Rol miembro');
        }

        function teamPayloadSaysOwner(team) {
            if (!team) return false;
            if (roleLooksOwner(team.role)) return true;
            if (team.is_owner === true) return true;
            if (roleLooksOwner(team.member_role)) return true;
            if (
                teamsViewerDiscordId &&
                String(team.owner_discord_id || '') === String(teamsViewerDiscordId)
            ) {
                return true;
            }
            return false;
        }

        function enrichMyTeamOwnerFromMembers(team, discordId) {
            if (!team || !discordId) return Promise.resolve(team);
            if (String(team.owner_discord_id || '') === String(discordId)) {
                team.role = 'owner';
                return Promise.resolve(team);
            }
            if (teamPayloadSaysOwner(team)) return Promise.resolve(team);
            if (!team.id) return Promise.resolve(team);
            return fetch(API_BASE + '/teams/members?team_id=' + encodeURIComponent(team.id))
                .then(function(r) {
                    return r.json();
                })
                .then(function(members) {
                    if (!Array.isArray(members)) return team;
                    var sid = String(discordId);
                    for (var i = 0; i < members.length; i++) {
                        var m = members[i];
                        if (m && String(m.discord_id || '') === sid && roleLooksOwner(m.role)) {
                            team.role = 'owner';
                            break;
                        }
                    }
                    return team;
                })
                .catch(function() {
                    return team;
                });
        }

        function isMyTeamOwner() {
            return !!(myTeam && teamPayloadSaysOwner(myTeam));
        }

    // Cleanup tracking
    var activeObservers = [];
    var processTimeout = null;

    // Função de tradução
    function t(key) {
        return window.__t ? window.__t(key) : key;
    }

    function userHasProForTeams() {
        return true;
    }

    function nonProNoticeHtml() {
        return '';
    }

    // Modal de confirmação customizado (substitui confirm nativo)
    function showConfirm(doc, message, onConfirm) {
        var overlay = doc.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100000;display:flex;align-items:center;justify-content:center;';
        
        var modal = doc.createElement('div');
        modal.style.cssText = 'background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;max-width:320px;text-align:center;';
        modal.innerHTML = '<p style="color:#fff;margin:0 0 16px;font-size:14px;">' + message + '</p>' +
            '<div style="display:flex;gap:10px;justify-content:center;">' +
            '<button id="confirm-cancel" style="padding:8px 20px;background:#272727;border:none;border-radius:4px;color:#888;cursor:pointer;">' + t('Cancelar') + '</button>' +
            '<button id="confirm-ok" style="padding:8px 20px;background:#dc2626;border:none;border-radius:4px;color:#fff;cursor:pointer;">' + t('Confirmar') + '</button>' +
            '</div>';
        
        overlay.appendChild(modal);
        doc.body.appendChild(overlay);
        
        modal.querySelector('#confirm-cancel').onclick = function() {
            doc.body.removeChild(overlay);
        };
        modal.querySelector('#confirm-ok').onclick = function() {
            doc.body.removeChild(overlay);
            onConfirm();
        };
        overlay.onclick = function(e) {
            if (e.target === overlay) doc.body.removeChild(overlay);
        };
    }

    /** Nick para lookup na API (evita CEO/nick-gradient/texto extra no nameEl). */
    function extractNickForTeamLookup(nameEl) {
        if (!nameEl) return '';
        try {
            var dn = nameEl.getAttribute('data-base-nick');
            if (dn) return String(dn).replace(/\u200B/g, '').trim();
        } catch (eDn) {}
        var grad = nameEl.querySelector('.nick-gradient');
        if (grad) return String(grad.textContent || '').replace(/\u200B/g, '').trim();
        var textContent = '';
        for (var i = 0; i < nameEl.childNodes.length; i++) {
            if (nameEl.childNodes[i].nodeType === 3) {
                textContent += nameEl.childNodes[i].textContent;
            }
        }
        textContent = String(textContent || '').replace(/\u200B/g, '').trim();
        if (textContent) return textContent;
        return String(nameEl.textContent || '').replace(/\u200B/g, '').trim();
    }

    // Gera badge da equipe (logo ou escudo SVG)
    function createTeamBadge(tag, color, logoUrl) {
        if (logoUrl) {
            // Usa loading="lazy" e adiciona cache-control via URL
            return '<span style="display:inline-flex;align-items:center;margin-left:4px;vertical-align:middle;">' +
                '<img src="' + logoUrl + '" loading="lazy" style="width:14px;height:14px;border-radius:2px;object-fit:cover;vertical-align:middle;">' +
                '</span>';
        }
        return '<span style="display:inline-flex;align-items:center;margin-left:4px;vertical-align:middle;">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="' + color + '" stroke="' + color + '" stroke-width="1" style="vertical-align:middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
            '</span>';
    }

        function stopTeamChatPolling() {
            if (teamChatPollTimer) {
                try {
                    clearInterval(teamChatPollTimer);
                } catch (eClrChat) {}
                teamChatPollTimer = null;
            }
            teamChatDocRef = null;
            teamChatLastId = 0;
            teamChatLastAuthorId = null;
        }

        // Limpa recursos
        function cleanupResources() {
            stopTeamChatPolling();
            // Limpa observers
            for (var i = 0; i < activeObservers.length; i++) {
                try { activeObservers[i].disconnect(); } catch(e) {}
            }
            activeObservers = [];
            
            // Limpa timeout
            if (processTimeout) {
                clearTimeout(processTimeout);
                processTimeout = null;
            }
        }

    function getRoomlistDialog(doc) {
        if (!doc || !doc.querySelector) return null;
        return doc.querySelector('.roomlist-view .dialog');
    }

    function hideRoomlistTeamsInpanel(doc) {
        var d = getRoomlistDialog(doc);
        if (d) {
            if (window.__hxdSetRoomlistDialogTeamsMode) {
                try {
                    window.__hxdSetRoomlistDialogTeamsMode(doc, d, false);
                } catch (eHxd) {}
            }
            d.classList.remove('zero-teams-mode');
        }
        teamsPanelOpen = false;
        cleanupResources();
    }

    function createTeamsInpanel(doc, dialog) {
        var existing = doc.getElementById('zero-inpanel-teams');
        if (existing) return existing;
        var bodyPanel = doc.getElementById('teams-panel');
        if (bodyPanel && bodyPanel.parentNode) bodyPanel.remove();

        var wrap = doc.createElement('div');
        wrap.id = 'zero-inpanel-teams';
        wrap.style.display = 'none';
        wrap.style.flexDirection = 'column';

        wrap.innerHTML =
            '<div style="padding:10px 12px 0 12px;position:relative;flex-shrink:0;border-bottom:1px solid #232323;">' +
            '<button id="close-teams-btn" type="button" style="position:absolute;top:8px;right:10px;background:none;border:none;color:#666;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;" title="' +
            escapeAttr(t('Fechar')) +
            '">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
            '<h1 style="color:#fff;font-size:16px;font-weight:600;margin:0 0 10px 0;padding:4px 28px 0 0;text-align:center;font-family:inherit;">' +
            escapeHtml(t('Equipe')) +
            '</h1></div>' +
            '<div id="teams-content" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding:12px;font-family:\'Space Grotesk\',sans-serif;"></div>';

        var sb = doc.getElementById('sidebar-panel');
        if (sb && sb.parentNode === dialog) {
            dialog.insertBefore(wrap, sb);
        } else {
            dialog.appendChild(wrap);
        }
        setupPanelListeners(doc, wrap);
        return wrap;
    }

    // Fecha painel
    function closeTeamsPanel(doc) {
        var inDl = getRoomlistDialog(doc);
        if (inDl) hideRoomlistTeamsInpanel(doc);
        var panel = doc.getElementById('teams-panel');
        if (panel) panel.remove();
        if (!inDl) {
            teamsPanelOpen = false;
            cleanupResources();
        }
    }

    // Cria painel de equipes
    function createTeamsPanel(doc) {
        var existing = doc.getElementById('teams-panel');
        if (existing) return existing;

        var panel = doc.createElement('div');
        panel.id = 'teams-panel';
        panel.style.cssText = 'position:fixed;top:0;right:-360px;width:360px;height:100%;background:#141414;border-left:1px solid #232323;z-index:9999;transition:right 0.3s ease;display:flex;flex-direction:column;font-family:"Space Grotesk",sans-serif;user-select:none;';

        panel.innerHTML = '<div style="padding:38px 16px 0 16px;position:relative;">' +
            '<button id="close-teams-btn" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--theme-text-muted, #666);cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;" title="' + t('Fechar') + '">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
            '<h1 style="color:#fff;font-size:18px;font-weight:600;margin:0 0 16px 0;padding:6px 0 5px 0;border-bottom:3px solid #232323;text-align:center;">' + t('Equipe') + '</h1>' +
            '</div>' +
            '<div id="teams-content" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding:12px;"></div>';

        doc.body.appendChild(panel);
        setupPanelListeners(doc, panel);
        return panel;
    }

    function setupPanelListeners(doc, panel) {
        var closeBtn = panel.querySelector('#close-teams-btn');
        if (closeBtn) {
            closeBtn.addEventListener('mouseenter', function() { closeBtn.style.color = '#fff'; });
            closeBtn.addEventListener('mouseleave', function() { closeBtn.style.color = '#666'; });
            closeBtn.addEventListener('click', function() {
                if (getRoomlistDialog(doc)) {
                    hideRoomlistTeamsInpanel(doc);
                } else {
                    toggleTeamsPanel(doc);
                }
            });
        }
    }

    // Renderiza conteúdo baseado no estado
    function renderTeamsContent(doc) {
        var content = doc.getElementById('teams-content');
        if (!content) return;

        if (!myTeamLoaded) {
            content.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">' + t('Carregando...') + '</div>';
            return;
        }

        if (myTeam) {
            renderMyTeam(doc, content);
        } else {
            renderNoTeam(doc, content);
        }

        var notice = nonProNoticeHtml();
        if (notice && !content.querySelector('#teams-nonpro-banner')) {
            content.insertAdjacentHTML('afterbegin', notice);
        }
    }

    // Renderiza quando não tem equipe
    function renderNoTeam(doc, content) {
        var createBtnHtml =
            '<button id="create-team-btn" style="width:100%;padding:12px;background:#3B82F6;border:none;border-radius:6px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:12px;">' + t('Criar Equipe') + '</button>';

        content.innerHTML =
            '<div style="text-align:center;padding:20px;">' +
            '<div style="color:#666;margin-bottom:20px;">' +
            escapeHtml(t('Você não está em nenhuma equipe')) +
            '</div>' +
            createBtnHtml +
            '</div>' +
            '<div id="team-invites-section" style="padding:0 4px;"></div>' +
            '<p class="tm-muted" style="font-size:12px;line-height:1.45;text-align:center;margin:4px 8px 16px;">' +
            escapeHtml(t('Equipo solo invitacion hint')) +
            '</p>';

        var createBtn = content.querySelector('#create-team-btn');
        if (createBtn) {
            createBtn.addEventListener('mouseenter', function() { createBtn.style.background = '#2563EB'; });
            createBtn.addEventListener('mouseleave', function() { createBtn.style.background = '#3B82F6'; });
            createBtn.addEventListener('click', function() { showCreateTeamForm(doc, content); });
        }

        loadTeamInvites(doc);
    }

    // Formulário de criar equipe (pasos + mismo estilo wc-* que welcome)
    function showCreateTeamForm(doc, content) {
        try {
            if (typeof window.__hxdInjectWelcomeStyles === 'function') {
                window.__hxdInjectWelcomeStyles();
            }
        } catch (eWc) {}

        try {
            if (!doc.getElementById('zero-team-wizard-layout')) {
                var stLay = doc.createElement('style');
                stLay.id = 'zero-team-wizard-layout';
                stLay.textContent =
                    '.zero-team-wizard .wc-main{padding:16px 14px 22px!important;scrollbar-width:thin!important;scrollbar-color:var(--theme-scrollbar-thumb,#555) var(--theme-scrollbar-track,#1a1a1a)!important;-webkit-overflow-scrolling:touch!important}' +
                    '.zero-team-wizard .wc-head{padding:10px 14px!important}' +
                    '.zero-team-wizard .wc-foot{padding:12px 14px!important}' +
                    '.zero-team-wizard .wc-h1{font-size:clamp(1.1rem,3.2vw,1.4rem)!important;margin-bottom:14px!important}' +
                    '.zero-team-wizard .wc-inner{max-width:100%!important}' +
                    '.zero-team-wizard .wc-head-brand img{height:18px!important}' +
                    '.zero-team-wizard .wc-head-brand span{font-size:11px!important}' +
                    '.zero-team-wizard #tw-dropzone{border-color:#3f3f3f!important}' +
                    '.zero-team-wizard .wc-main::-webkit-scrollbar{width:10px!important}' +
                    '.zero-team-wizard .wc-main::-webkit-scrollbar-track{background:var(--theme-scrollbar-track,#1a1a1a)!important;border-radius:999px!important;margin:4px 0!important}' +
                    '.zero-team-wizard .wc-main::-webkit-scrollbar-thumb{background:linear-gradient(180deg,var(--theme-scrollbar-thumb,#555),var(--theme-scrollbar-thumb-hover,#666))!important;border-radius:999px!important;border:2px solid transparent!important;background-clip:padding-box!important}' +
                    '.zero-team-wizard .wc-main::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,var(--theme-scrollbar-thumb-hover,#666),var(--theme-scrollbar-thumb-hover,#777))!important;background-clip:padding-box!important}';
                (doc.head || doc.documentElement).appendChild(stLay);
            }
        } catch (eLay) {}

        var TOTAL_STEPS = 4;
        var state = {
            step: 0,
            teamName: '',
            selectedLogoBase64: null,
            logoFileName: '',
            ownerNick: '—'
        };

        function resolveDisplayNick(user) {
            if (!user) return '—';
            var n = String(user.nick || user.game_nick || user.username || user.discord_name || '').trim();
            return n || '—';
        }

        function getSidePreviewHtml() {
            var nick = escapeHtml(state.ownerNick);
            var badge;
            if (state.selectedLogoBase64) {
                badge =
                    '<img src="' +
                    escapeAttr(state.selectedLogoBase64) +
                    '" alt="" style="width:28px;height:28px;border-radius:8px;object-fit:cover;border:1px solid #333;" draggable="false" />';
            } else {
                badge =
                    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
            }
            var teamLine = escapeHtml(state.teamName.trim() || '—');
            return (
                '<aside class="wc-side" aria-hidden="true">' +
                '<div class="wc-side-cap">' +
                t('Preview') +
                '</div>' +
                '<div class="wc-side-fake wc-side-fake--team">' +
                '<span class="wc-fake-nick">' +
                nick +
                '</span>' +
                '<span style="display:flex;align-items:center;">' +
                badge +
                '</span></div>' +
                '<p class="wc-side-hint" style="margin-top:10px;font-weight:600;color:#a3a3a3;">' +
                teamLine +
                '</p></aside>'
            );
        }

        function syncLogoPreviewDom() {
            var img = content.querySelector('#tw-logo-preview');
            var ph = content.querySelector('#tw-logo-ph');
            if (state.selectedLogoBase64) {
                if (img) {
                    img.src = state.selectedLogoBase64;
                    img.style.display = 'block';
                }
                if (ph) ph.style.display = 'none';
            } else {
                if (img) {
                    img.removeAttribute('src');
                    img.style.display = 'none';
                }
                if (ph) ph.style.display = 'block';
            }
        }

        function wireLogoStep() {
            var logoInput = content.querySelector('#tw-file');
            var pick = content.querySelector('#tw-pick');
            var dropInner = content.querySelector('#tw-drop-inner');
            var fname = content.querySelector('#tw-fname');
            if (!logoInput || !pick) return;

            function pickClick() {
                logoInput.click();
            }
            pick.addEventListener('click', pickClick);
            if (dropInner) dropInner.addEventListener('click', pickClick);

            logoInput.addEventListener('change', function() {
                var file = logoInput.files[0];
                if (!file) return;
                var okMime = /^image\/(png|jpe?g|gif|webp)$/i.test(file.type || '');
                var okExt = /\.(png|jpe?g|gif|webp)$/i.test(file.name || '');
                if (!okMime && !okExt) {
                    console.warn('[HXD Teams] logo: formato no permitido', file.type, file.name);
                    logoInput.value = '';
                    return;
                }
                if (file.size > 512 * 1024) {
                    console.warn('[HXD Teams] logo: archivo demasiado grande', file.size);
                    return;
                }
                var reader = new FileReader();
                reader.onload = function(e) {
                    state.selectedLogoBase64 = e.target.result;
                    state.logoFileName = file.name;
                    if (fname) fname.textContent = state.logoFileName;
                    syncLogoPreviewDom();
                    render();
                };
                reader.readAsDataURL(file);
            });

            var dz = content.querySelector('#tw-dropzone');
            if (dz) {
                dz.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    dz.style.borderColor = '#525252';
                });
                dz.addEventListener('dragleave', function() {
                    dz.style.borderColor = '#3f3f3f';
                });
                dz.addEventListener('drop', function(e) {
                    e.preventDefault();
                    dz.style.borderColor = '#3f3f3f';
                    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                    if (!f) return;
                    try {
                        var dt = new DataTransfer();
                        dt.items.add(f);
                        logoInput.files = dt.files;
                    } catch (eDt) {
                        return;
                    }
                    logoInput.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }
            syncLogoPreviewDom();
        }

        function submitCreate() {
            var btn = content.querySelector('#tw-next');
            var statusEl = content.querySelector('#tw-status');
            var vName = validateTeamNameForCreate(state.teamName);
            if (!vName.ok) {
                if (statusEl) {
                    statusEl.style.color = '#f87171';
                    statusEl.textContent = vName.error;
                }
                return;
            }
            if (btn) btn.disabled = true;
            if (statusEl) {
                statusEl.style.color = '#86efac';
                statusEl.textContent = t('Criando...');
            }

            var payload = {
                name: vName.name,
                tag: deriveTeamTag('', vName.name),
                color: '#666666'
            };
            if (state.selectedLogoBase64) {
                payload.image = state.selectedLogoBase64;
            }

            console.log('[HXD Teams iframe] POST /teams/create → payload:', {
                hasImage: !!payload.image,
                imageLen: payload.image ? payload.image.length : 0,
                name: payload.name,
                tag: payload.tag
            });

            function finishCreateFlow() {
                syncMyLocalTeamInfoFromMyTeam();
                refreshAllBadges();
                if (btn) btn.disabled = false;
                renderTeamsContent(doc);
            }

            function runLogoUploadThenFinish() {
                if (!state.selectedLogoBase64) {
                    finishCreateFlow();
                    return;
                }
                if (statusEl) statusEl.textContent = t('Enviando logo...');
                console.log('[HXD Teams iframe] fallback POST /teams/logo, len:', state.selectedLogoBase64.length);
                fetch(API_BASE + '/teams/logo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: state.selectedLogoBase64 })
                })
                    .then(function(r) {
                        return r.json();
                    })
                    .then(function(logoResult) {
                        console.log('[HXD Teams iframe] /teams/logo ←', {
                            success: !!(logoResult && logoResult.success),
                            logo_url_len: logoResult && logoResult.logo_url ? String(logoResult.logo_url).length : 0
                        });
                        if (logoResult && logoResult.success && myTeam) {
                            myTeam.logo_url = logoResult.logo_url;
                        }
                        finishCreateFlow();
                    })
                    .catch(function() {
                        if (btn) btn.disabled = false;
                        if (statusEl) {
                            statusEl.style.color = '#f87171';
                            statusEl.textContent = t('Erro de conexão');
                        }
                    });
            }

            fetch(API_BASE + '/teams/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function(r) {
                    return r.json();
                })
                .then(function(result) {
                    console.log('[HXD Teams iframe] /teams/create ←', {
                        success: !!(result && result.success),
                        logo_url_len: result.team && result.team.logo_url ? String(result.team.logo_url).length : 0,
                        logo_is_null: !(result && result.team && result.team.logo_url)
                    });
                    if (result && result.success && result.team) {
                        myTeam = result.team;
                        if (myTeam && !teamPayloadSaysOwner(myTeam)) {
                            myTeam.role = 'owner';
                        }
                        if (state.selectedLogoBase64 && myTeam && myTeam.logo_url) {
                            finishCreateFlow();
                        } else if (state.selectedLogoBase64) {
                            runLogoUploadThenFinish();
                        } else {
                            finishCreateFlow();
                        }
                    } else {
                        if (btn) btn.disabled = false;
                        if (statusEl) {
                            statusEl.style.color = '#f87171';
                            statusEl.textContent = (result && result.error) || t('Erro ao criar equipe');
                        }
                    }
                })
                .catch(function(err) {
                    console.warn('[HXD Teams iframe] /teams/create fetch error', err);
                    if (btn) btn.disabled = false;
                    if (statusEl) {
                        statusEl.style.color = '#f87171';
                        statusEl.textContent = t('Erro de conexão');
                    }
                });
        }

        function render() {
            var step = state.step;
            var pct = TOTAL_STEPS ? Math.round(((step + 1) / TOTAL_STEPS) * 100) : 100;
            var isFirst = step === 0;
            var isLast = step === TOTAL_STEPS - 1;
            var title =
                step === 0
                    ? t('Criar Nova Equipe')
                    : step === 1
                      ? t('Nome da Equipe')
                      : step === 2
                        ? t('Logo da Equipe')
                        : t('Criar');
            var backLabel = isFirst ? t('Cancelar') : 'Atrás';
            var nextLabel = isLast ? t('Criar') : 'Siguiente';

            var body = '';
            if (step === 0) {
                body =
                    '<div class="wc-prose" style="margin-bottom:18px;">' +
                    'En Zero tu <b>equipo</b> es la marca del grupo: aparece en badges, panel social y deja claro con quién jugás.</div>' +
                    '<div class="wc-stack">' +
                    '<div class="wc-li"><p class="wc-li-h">Identidad clara</p><p class="wc-li-p">Nombre (3–30 caracteres), sigla derivada automáticamente y color base para el escudo.</p></div>' +
                    '<div class="wc-li"><p class="wc-li-h">Logo de verdad</p><p class="wc-li-p">Subís un archivo (PNG/JPG/GIF/WebP, máx. 512 KB); se guarda con el equipo.</p></div>' +
                    '<div class="wc-li"><p class="wc-li-h">Después del alta</p><p class="wc-li-p">Invitás miembros por Discord, editás datos y gestionás el equipo desde el mismo panel.</p></div>' +
                    '</div>';
            } else if (step === 1) {
                body =
                    '<div class="wc-prose" style="margin-bottom:16px;">' +
                    'Elegí el nombre que verán otras personas en listas y salas. Podés cambiarlo más adelante si sos dueño del equipo.</div>' +
                    '<input id="tw-name" type="text" maxlength="30" value="' +
                    escapeAttr(state.teamName) +
                    '" placeholder="zEro" style="width:100%;padding:12px 14px;background:#141414;border:1px solid #2e2e2e;border-radius:10px;color:#fafafa;font-size:14px;box-sizing:border-box;font-family:inherit;">' +
                    '<p id="tw-err" style="color:#f87171;font-size:12px;margin-top:12px;min-height:18px;"></p>';
            } else if (step === 2) {
                body =
                    '<div class="wc-prose" style="margin-bottom:14px;">' +
                    'Subí una imagen cuadrada o rectangular; se verá recortada en el badge. PNG, JPG, GIF o WebP, máximo 512 KB.</div>' +
                    '<div class="wc-split">' +
                    '<div class="wc-stage wc-stage--none">' +
                    '<div id="tw-dropzone" style="display:flex;gap:14px;align-items:stretch;">' +
                    '<div id="tw-drop-inner" style="flex-shrink:0;width:108px;height:108px;border-radius:12px;background:#0d0d0d;border:1px dashed #3f3f3f;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;">' +
                    '<img id="tw-logo-preview" alt="" draggable="false" style="display:none;width:100%;height:100%;object-fit:cover;" />' +
                    '<svg id="tw-logo-ph" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5c5c5c" stroke-width="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
                    '</div>' +
                    '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px;min-width:0;">' +
                    '<input type="file" id="tw-file" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none;">' +
                    '<button type="button" id="tw-pick" style="padding:12px 14px;background:#262626;border:1px solid #3a3a3a;border-radius:10px;color:#f5f5f5;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;width:100%;">' +
                    t('Escolher Imagem') +
                    '</button>' +
                    '<span id="tw-fname" style="font-size:11px;color:#737373;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                    escapeHtml(state.logoFileName || t('Nenhuma selecionada')) +
                    '</span></div></div></div>' +
                    '<div class="wc-split-side">' +
                    getSidePreviewHtml() +
                    '</div></div>';
            } else {
                var nameDisp = escapeHtml(state.teamName.trim());
                var logoBlock;
                if (state.selectedLogoBase64) {
                    logoBlock =
                        '<img src="' +
                        escapeAttr(state.selectedLogoBase64) +
                        '" alt="" style="width:72px;height:72px;border-radius:12px;object-fit:cover;border:1px solid #333;margin-top:12px;" draggable="false" />';
                } else {
                    logoBlock =
                        '<div style="margin-top:12px;padding:14px;border-radius:10px;background:#1a1a1a;border:1px solid #333;color:#737373;font-size:12px;">Sin logo</div>';
                }
                body =
                    '<div class="wc-prose" style="margin-bottom:12px;">Revisá los datos y tocá <b>Crear</b> para confirmar.</div>' +
                    '<div style="padding:16px;border-radius:10px;background:#1a1a1a;border:1px solid #333;">' +
                    '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#666;margin-bottom:6px;">' +
                    t('Nome da Equipe') +
                    '</div>' +
                    '<div style="font-size:16px;font-weight:600;color:#fff;">' +
                    nameDisp +
                    '</div>' +
                    logoBlock +
                    '</div>' +
                    '<p id="tw-status" style="color:#f87171;font-size:12px;text-align:center;margin-top:14px;min-height:18px;"></p>';
            }

            content.innerHTML =
                '<div class="zero-team-wizard">' +
                '<div class="wc-prog" role="progressbar" aria-valuenow="' +
                (step + 1) +
                '" aria-valuemax="' +
                TOTAL_STEPS +
                '"><div class="wc-prog-fill" style="width:' +
                pct +
                '%"></div></div>' +
                '<header class="wc-head">' +
                '<div class="wc-head-brand">' +
                '<img src="https://i.ibb.co/YF3Ln83r/logo-haxballapp.png" alt="" draggable="false"/>' +
                '<span>HaxBall Zero</span></div>' +
                '<div class="wc-head-meta">' +
                '<span class="wc-tag">' +
                t('Equipo') +
                '</span>' +
                '<span class="wc-meta-bit">' +
                (step + 1) +
                ' / ' +
                TOTAL_STEPS +
                '</span></div></header>' +
                '<main class="wc-main"><div class="wc-inner">' +
                '<h1 class="wc-h1">' +
                title +
                '</h1>' +
                body +
                '</div></main>' +
                '<footer class="wc-foot">' +
                '<button type="button" id="tw-prev" class="wc-btn-ghost">' +
                backLabel +
                '</button>' +
                '<button type="button" id="tw-next" class="wc-btn-primary">' +
                nextLabel +
                '</button></footer></div>';

            content.querySelector('#tw-prev').addEventListener('click', function() {
                if (state.step === 0) {
                    renderTeamsContent(doc);
                    return;
                }
                state.step--;
                render();
            });

            content.querySelector('#tw-next').addEventListener('click', function() {
                if (state.step === 0) {
                    state.step = 1;
                    render();
                    return;
                }
                if (state.step === 1) {
                    var inp = content.querySelector('#tw-name');
                    var v = validateTeamNameForCreate(inp ? inp.value : '');
                    var err = content.querySelector('#tw-err');
                    if (!v.ok) {
                        if (err) {
                            err.textContent = v.error;
                        }
                        return;
                    }
                    state.teamName = v.name;
                    state.step = 2;
                    render();
                    return;
                }
                if (state.step === 2) {
                    state.step = 3;
                    render();
                    return;
                }
                submitCreate();
            });

            if (step === 1) {
                var inp0 = content.querySelector('#tw-name');
                if (inp0) {
                    inp0.focus();
                    inp0.addEventListener('input', function() {
                        state.teamName = inp0.value;
                    });
                }
            }
            if (step === 2) {
                wireLogoStep();
            }
        }

        fetchTeamsUserProfile().then(function(user) {
            state.ownerNick = resolveDisplayNick(user);
            if (state.step >= 1) {
                render();
            }
        });

        render();
    }

        function fillTeamChatRoster(doc, members) {
            var el = doc.getElementById('thb-chat-roster');
            if (!el) return;
            if (!members || !members.length) {
                el.innerHTML = '<div class="tm-roster__line tm-muted">' + escapeHtml(t('Nenhum membro')) + '</div>';
                return;
            }
            var html = '';
            for (var i = 0; i < members.length; i++) {
                var m = members[i];
                var on = m && (m.is_online_app === 1 || m.is_online_app === true);
                var nm = escapeHtml(String(m.discord_name || m.username || m.discord_id || ''));
                html +=
                    '<div class="tm-roster__line"><span class="tm-roster__dot' +
                    (on ? ' tm-roster__dot--on' : '') +
                    '"></span><span class="tm-roster__name">' +
                    nm +
                    '</span></div>';
            }
            el.innerHTML = html;
        }

        function teamChatAvatarHue(seed) {
            var s = String(seed || 'x');
            var h = 0;
            for (var j = 0; j < s.length; j++) {
                h = (h * 31 + s.charCodeAt(j)) % 360;
            }
            return h;
        }

        function pad2Clock(n) {
            return (n < 10 ? '0' : '') + n;
        }

        /**
         * Muestra hora/minuto en zona local. Antes usábamos slice() sobre ISO: eso muestra UTC y no coincide con tu reloj.
         */
        function formatTeamChatLocalTime(createdAt) {
            if (createdAt == null || createdAt === '') {
                return { text: '', datetime: '' };
            }
            var d;
            try {
                if (
                    typeof createdAt === 'object' &&
                    createdAt !== null &&
                    typeof createdAt.getTime === 'function'
                ) {
                    d = new Date(createdAt.getTime());
                } else {
                    var raw = String(createdAt).trim();
                    if (!raw) {
                        return { text: '', datetime: '' };
                    }
                    if (/^\d{4}-\d{2}-\d{2}[ ]\d/.test(raw)) {
                        raw = raw.replace(/^(\d{4}-\d{2}-\d{2})[\s](.+)$/, '$1T$2');
                    }
                    raw = raw.replace(/(\.\d{3})\d+/, '$1');
                    d = new Date(raw);
                }
            } catch (eClk) {
                d = null;
            }
            if (!d || isNaN(d.getTime())) {
                return { text: '', datetime: '' };
            }
            var text = pad2Clock(d.getHours()) + ':' + pad2Clock(d.getMinutes());
            var datetime = '';
            try {
                datetime = d.toISOString();
            } catch (eIso) {}
            return { text: text, datetime: datetime };
        }

        function appendTeamChatRows(doc, rows) {
            var stream = doc.getElementById('thb-chat-msgs');
            if (!stream || !rows || !rows.length) return;
            var myId = teamsViewerDiscordId ? String(teamsViewerDiscordId) : '';
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var idn = Number(r.id);
                if (Number.isFinite(idn) && idn > teamChatLastId) teamChatLastId = idn;
                var authId = String(r.discord_id || '');
                var compact = !!authId && teamChatLastAuthorId === authId;
                teamChatLastAuthorId = authId || null;
                var me = myId && authId === myId ? ' tm-msg--me' : '';
                var rawName = String(r.discord_name || r.discord_id || '?');
                var who = escapeHtml(rawName);
                var txt = escapeHtml(String(r.body || ''));
                var tsInfo = formatTeamChatLocalTime(r.created_at);
                var ts = tsInfo.text;
                var tsAttr = tsInfo.datetime ? ' datetime="' + escapeAttr(tsInfo.datetime) + '"' : '';
                var initial = escapeHtml(rawName.charAt(0) ? rawName.charAt(0).toUpperCase() : '?');
                var hue = teamChatAvatarHue(authId || rawName);
                var div = doc.createElement('div');
                div.className = 'tm-msg' + (compact ? ' tm-msg--compact' : '') + me;
                if (compact) {
                    div.innerHTML =
                        '<div class="tm-msg__gutter" aria-hidden="true"></div>' +
                        '<div class="tm-msg__main">' +
                        '<div class="tm-msg__text">' +
                        txt +
                        '</div></div>';
                } else {
                    div.innerHTML =
                        '<div class="tm-msg__gutter" aria-hidden="true">' +
                        '<div class="tm-msg__avatar" style="--tm-msg-av:' +
                        hue +
                        '">' +
                        initial +
                        '</div></div>' +
                        '<div class="tm-msg__main">' +
                        '<div class="tm-msg__hdr">' +
                        '<span class="tm-msg__who">' +
                        who +
                        '</span>' +
                        '<time class="tm-msg__time"' +
                        tsAttr +
                        '>' +
                        escapeHtml(ts) +
                        '</time></div>' +
                        '<div class="tm-msg__text">' +
                        txt +
                        '</div></div>';
                }
                stream.appendChild(div);
            }
            try {
                stream.scrollTop = stream.scrollHeight;
            } catch (eSc) {}
        }

        function pollTeamChatOnce(doc) {
            if (!myTeam || !myTeam.id) return;
            fetch(
                API_BASE +
                    '/teams/chat?team_id=' +
                    encodeURIComponent(myTeam.id) +
                    '&after_id=' +
                    encodeURIComponent(String(teamChatLastId))
            )
                .then(function(r) {
                    if (!r.ok) return [];
                    return r.json();
                })
                .then(function(rows) {
                    if (!Array.isArray(rows)) return;
                    appendTeamChatRows(doc, rows);
                })
                .catch(function() {});
        }

        function startTeamChatPolling(doc) {
            stopTeamChatPolling();
            teamChatDocRef = doc;
            teamChatLastId = 0;
            teamChatLastAuthorId = null;
            var stream = doc.getElementById('thb-chat-msgs');
            if (stream) stream.innerHTML = '';
            pollTeamChatOnce(doc);
            teamChatPollTimer = setInterval(function() {
                pollTeamChatOnce(teamChatDocRef || doc);
            }, 4500);
        }

        function wireTeamHubTabs(doc, content) {
            var tabBar = content.querySelector('#tm-team-tabs');
            var tabs = tabBar ? tabBar.querySelectorAll('[data-thb-tab]') : [];
            var panels = content.querySelectorAll('.tm-panel[data-thb-panel]');
            function go(name) {
                for (var i = 0; i < tabs.length; i++) {
                    var tbtn = tabs[i];
                    var on = String(tbtn.getAttribute('data-thb-tab')) === name;
                    tbtn.classList.toggle('tm-tab--on', on);
                }
                for (var j = 0; j < panels.length; j++) {
                    var p = panels[j];
                    var match = String(p.getAttribute('data-thb-panel')) === name;
                    p.classList.toggle('tm-panel--on', match);
                }
                if (name === 'chat') {
                    startTeamChatPolling(doc);
                    if (myTeam && myTeam.id) {
                        fetch(API_BASE + '/teams/members?team_id=' + encodeURIComponent(myTeam.id))
                            .then(function(r) {
                                if (!r.ok) return [];
                                return r.json();
                            })
                            .then(function(mems) {
                                fillTeamChatRoster(doc, mems);
                            })
                            .catch(function() {});
                    }
                } else {
                    stopTeamChatPolling();
                }
                if (name === 'admin') {
                    refreshTeamMembersUI(doc);
                }
            }
            for (var k = 0; k < tabs.length; k++) {
                tabs[k].addEventListener('click', function(ev) {
                    go(String(ev.currentTarget.getAttribute('data-thb-tab') || 'members'));
                });
            }
            var sendBtn = content.querySelector('#thb-chat-send');
            var sendInp = content.querySelector('#thb-chat-input');
            if (sendBtn && sendInp) {
                function doSend() {
                    var txt = String(sendInp.value || '').trim();
                    if (!txt || !myTeam || !myTeam.id) return;
                    sendInp.value = '';
                    fetch(API_BASE + '/teams/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ team_id: myTeam.id, text: txt })
                    })
                        .then(function(r) {
                            if (!r.ok) return null;
                            return r.json();
                        })
                        .then(function(res) {
                            if (res && res.success && res.message) appendTeamChatRows(doc, [res.message]);
                            else pollTeamChatOnce(doc);
                        })
                        .catch(function() {
                            pollTeamChatOnce(doc);
                        });
                }
                sendBtn.addEventListener('click', doSend);
                sendInp.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        doSend();
                    }
                });
            }
            go('members');
        }

        function wireTeamJoinLink(doc, content) {
            if (!myTeam || !myTeam.id) return;
            var linkOfferedRole = 'member';
            var pillLm = content.querySelector('#tm-link-pill-member');
            var pillLmod = content.querySelector('#tm-link-pill-mod');
            var fb = content.querySelector('#tm-link-feedback');
            var wrapOn = content.querySelector('#tm-link-active-wrap');
            var wrapOff = content.querySelector('#tm-link-inactive-wrap');
            var inpTok = content.querySelector('#tm-link-token-display');
            var btnCreate = content.querySelector('#tm-link-create-btn');
            var btnCopy = content.querySelector('#tm-link-copy-btn');
            var btnRegen = content.querySelector('#tm-link-regenerate-btn');
            var btnDisable = content.querySelector('#tm-link-disable-btn');

            function setFb(ok, msg) {
                if (!fb) return;
                fb.style.color = ok ? '#86efac' : '#fca5a5';
                fb.textContent = msg || '';
            }

            function syncLinkPills() {
                if (pillLm) pillLm.classList.toggle('tm-pill--on', linkOfferedRole === 'member');
                if (pillLmod) pillLmod.classList.toggle('tm-pill--on', linkOfferedRole === 'moderator');
            }

            function applyLinkState(active, token) {
                if (!wrapOn || !wrapOff || !inpTok) return;
                if (active && token) {
                    wrapOn.style.display = '';
                    wrapOff.style.display = 'none';
                    inpTok.value = token;
                } else {
                    wrapOn.style.display = 'none';
                    wrapOff.style.display = '';
                    inpTok.value = '';
                }
            }

            function refreshJoinLink() {
                fetch(API_BASE + '/teams/join-link?team_id=' + encodeURIComponent(myTeam.id))
                    .then(function(r) {
                        if (!r.ok) return null;
                        return r.json();
                    })
                    .then(function(data) {
                        if (!data || !data.success) return;
                        if (data.offered_role === 'moderator') linkOfferedRole = 'moderator';
                        else linkOfferedRole = 'member';
                        syncLinkPills();
                        applyLinkState(!!data.active, data.token || '');
                    })
                    .catch(function() {});
            }

            function postLink(path, body) {
                var b = body || {};
                b.team_id = myTeam.id;
                return fetch(API_BASE + path, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(b)
                }).then(function(r) {
                    if (!r.ok) return { success: false, error: t('Erro de conexión') };
                    return r.json();
                });
            }

            if (pillLm) {
                pillLm.addEventListener('click', function() {
                    linkOfferedRole = 'member';
                    syncLinkPills();
                });
            }
            if (pillLmod) {
                pillLmod.addEventListener('click', function() {
                    linkOfferedRole = 'moderator';
                    syncLinkPills();
                });
            }

            if (btnCreate) {
                btnCreate.addEventListener('click', function() {
                    btnCreate.disabled = true;
                    setFb(true, t('Equipo link generando'));
                    postLink('/teams/join-link/create', { offered_role: linkOfferedRole })
                        .then(function(res) {
                            if (res && res.success && res.token) {
                                setFb(true, t('Equipo link listo'));
                                applyLinkState(true, res.token);
                            } else {
                                setFb(false, (res && res.error) || t('Erro ao convidar'));
                            }
                        })
                        .catch(function() {
                            setFb(false, t('Erro de conexión'));
                        })
                        .then(function() {
                            btnCreate.disabled = false;
                        });
                });
            }

            if (btnRegen) {
                btnRegen.addEventListener('click', function() {
                    btnRegen.disabled = true;
                    postLink('/teams/join-link/create', { offered_role: linkOfferedRole })
                        .then(function(res) {
                            if (res && res.success && res.token) {
                                setFb(true, t('Equipo link listo'));
                                applyLinkState(true, res.token);
                            } else {
                                setFb(false, (res && res.error) || t('Erro ao convidar'));
                            }
                        })
                        .catch(function() {
                            setFb(false, t('Erro de conexión'));
                        })
                        .then(function() {
                            btnRegen.disabled = false;
                        });
                });
            }

            if (btnDisable) {
                btnDisable.addEventListener('click', function() {
                    btnDisable.disabled = true;
                    postLink('/teams/join-link/disable', {})
                        .then(function(res) {
                            if (res && res.success) {
                                setFb(true, t('Equipo link desactivado ok'));
                                applyLinkState(false, '');
                            } else {
                                setFb(false, (res && res.error) || t('Erro ao convidar'));
                            }
                        })
                        .catch(function() {
                            setFb(false, t('Erro de conexión'));
                        })
                        .then(function() {
                            btnDisable.disabled = false;
                        });
                });
            }

            if (btnCopy && inpTok) {
                btnCopy.addEventListener('click', function() {
                    var tval = String(inpTok.value || '').trim();
                    if (!tval) return;
                    function done(ok) {
                        setFb(ok, ok ? t('Equipo link copiado') : t('Equipo link copiar manual'));
                    }
                    try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(tval).then(function() {
                                done(true);
                            }).catch(function() {
                                done(false);
                            });
                        } else {
                            inpTok.removeAttribute('readonly');
                            inpTok.select();
                            doc.execCommand('copy');
                            inpTok.setAttribute('readonly', 'readonly');
                            done(true);
                        }
                    } catch (eC) {
                        done(false);
                    }
                });
            }

            syncLinkPills();
            refreshJoinLink();
        }

    // Renderiza quando tem equipe
    function renderMyTeam(doc, content) {
        var isOwner = isMyTeamOwner();

        var headerLogoBox =
            '<div class="tm-avatar">' +
            (myTeam.logo_url
                ? '<img id="team-logo-preview" src="' +
                  escapeAttr(myTeam.logo_url) +
                  '" alt="" draggable="false"/>'
                : '<div id="team-logo-preview" class="tm-avatar__ph"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>') +
            '</div>';

        var ownerSettingsDetails =
            '<details class="tm-details">' +
            '<summary class="tm-details__sum">' +
            escapeHtml(t('Equipo ajustes summary')) +
            '</summary>' +
            '<div class="tm-details__body">' +
            '<p class="tm-muted">' +
            escapeHtml(t('Gestión equipo hint')) +
            '</p>' +
            '<div class="tm-field">' +
            '<label class="tm-label" for="edit-name-input">' +
            escapeHtml(t('Nome da Equipe')) +
            '</label>' +
            '<input id="edit-name-input" class="tm-input" type="text" value="' +
            escapeAttr(myTeam.name) +
            '" maxlength="30" />' +
            '</div>' +
            '<div class="tm-field">' +
            '<label class="tm-label" for="edit-tag-input">' +
            escapeHtml(t('Sigla (máx 4)')) +
            '</label>' +
            '<input id="edit-tag-input" class="tm-input tm-input--tag" type="text" value="' +
            escapeAttr(myTeam.tag || '') +
            '" maxlength="4" />' +
            '</div>' +
            '<div class="tm-field">' +
            '<span class="tm-label">' +
            escapeHtml(t('Logo')) +
            '</span>' +
            '<div class="tm-rowline">' +
            '<input id="logo-input" type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="tm-file">' +
            '<button type="button" id="upload-logo-btn" class="tm-btn tm-btn--ghost">' +
            escapeHtml(myTeam.logo_url ? t('Trocar') : t('Enviar')) +
            '</button>' +
            '<span id="logo-status" class="tm-muted tm-muted--sm"></span>' +
            '</div></div>' +
            '<button type="button" id="save-settings-btn" class="tm-btn tm-btn--solid tm-btn--block">' +
            escapeHtml(t('Salvar Alterações')) +
            '</button>' +
            '<p id="settings-status" class="tm-feedback"></p>' +
            '</div></details>';

        var linkInviteBlock =
            '<div class="tm-linkcard" id="tm-link-card">' +
            '<h3 class="tm-h3">' +
            escapeHtml(t('Equipo link invite titulo')) +
            '</h3>' +
            '<p class="tm-muted">' +
            escapeHtml(t('Equipo link invite hint')) +
            '</p>' +
            '<span class="tm-label tm-label--solo">' +
            escapeHtml(t('Equipo link rol hint')) +
            '</span>' +
            '<div class="tm-pills">' +
            '<button type="button" class="tm-pill tm-pill--on" id="tm-link-pill-member" data-offer="member">' +
            escapeHtml(t('Rol miembro')) +
            '</button>' +
            '<button type="button" class="tm-pill" id="tm-link-pill-mod" data-offer="moderator">' +
            escapeHtml(t('Rol moderador')) +
            '</button>' +
            '</div>' +
            '<div id="tm-link-active-wrap" class="tm-link-active" style="display:none">' +
            '<label class="tm-label" for="tm-link-token-display">' +
            escapeHtml(t('Equipo link codigo label')) +
            '</label>' +
            '<div class="tm-token-row">' +
            '<input id="tm-link-token-display" type="text" class="tm-input tm-input--mono" readonly autocomplete="off" spellcheck="false" />' +
            '<button type="button" id="tm-link-copy-btn" class="tm-btn tm-btn--ghost tm-btn--sm">' +
            escapeHtml(t('Equipo link copiar')) +
            '</button></div>' +
            '<div class="tm-link-actions">' +
            '<button type="button" id="tm-link-regenerate-btn" class="tm-btn tm-btn--ghost tm-btn--sm">' +
            escapeHtml(t('Equipo link nuevo codigo')) +
            '</button>' +
            '<button type="button" id="tm-link-disable-btn" class="tm-btn tm-btn--ghost tm-btn--sm tm-btn--danger">' +
            escapeHtml(t('Equipo link desactivar')) +
            '</button></div></div>' +
            '<div id="tm-link-inactive-wrap" class="tm-link-inactive">' +
            '<button type="button" id="tm-link-create-btn" class="tm-btn tm-btn--solid tm-btn--block">' +
            escapeHtml(t('Equipo link generar')) +
            '</button></div>' +
            '<p id="tm-link-feedback" class="tm-feedback"></p>' +
            '</div>';

        content.innerHTML =
            '<div class="tm-shell">' +
            '<header class="tm-head">' +
            headerLogoBox +
            '<div class="tm-head__main">' +
            '<div class="tm-kicker">' +
            escapeHtml(t('Equipe')) +
            '</div>' +
            '<h2 id="team-name-display" class="tm-title">' +
            escapeHtml(myTeam.name) +
            '</h2>' +
            '<div class="tm-meta">' +
            '<span class="tm-meta__tag">[' +
            escapeHtml(String(myTeam.tag || '').toUpperCase()) +
            ']</span>' +
            '<span class="tm-meta__dot">·</span>' +
            '<span>' +
            (myTeam.member_count || 1) +
            ' ' +
            escapeHtml(t('membro(s)')) +
            '</span>' +
            (isOwner
                ? '<span class="tm-badge">' + escapeHtml(t('Dueño del equipo')) + '</span>'
                : '') +
            '</div></div></header>' +
            '<div class="tm-stack">' +
            '<nav class="tm-tabs" id="tm-team-tabs" role="tablist">' +
            '<button type="button" class="tm-tab tm-tab--on" data-thb-tab="members">' +
            escapeHtml(t('Equipo tab members')) +
            '</button>' +
            '<button type="button" class="tm-tab" data-thb-tab="chat">' +
            escapeHtml(t('Equipo tab chat')) +
            '</button>' +
            (isOwner
                ? '<button type="button" class="tm-tab" data-thb-tab="admin">' +
                  escapeHtml(t('Equipo tab admin')) +
                  '</button>'
                : '') +
            '</nav>' +
            '<div class="tm-panel tm-panel--on" data-thb-panel="members">' +
            '<div class="tm-scroll">' +
            '<div id="team-invites-section"></div>' +
            (isOwner ? linkInviteBlock : '') +
            '<h3 class="tm-h3">' +
            escapeHtml(t('Membros')) +
            '</h3>' +
            '<div id="team-members-list"></div>' +
            (isOwner ? ownerSettingsDetails : '') +
            '</div></div>' +
            '<div class="tm-panel" data-thb-panel="chat">' +
            '<div class="tm-scroll tm-scroll--chat">' +
            '<p class="tm-muted tm-muted--sm tm-chat-hint">' +
            escapeHtml(t('Equipo chat hint')) +
            '</p>' +
            '<div class="tm-chatpane">' +
            '<aside class="tm-chatpane__side" id="thb-chat-roster" aria-label="roster"></aside>' +
            '<div class="tm-chatpane__body">' +
            '<div class="tm-chatpane__msgs" id="thb-chat-msgs"></div>' +
            '<div class="tm-chatpane__send tm-chatcomposer">' +
            '<div class="tm-chatcomposer__shell">' +
            '<input id="thb-chat-input" class="tm-input tm-input--chat" type="text" maxlength="2000" placeholder="' +
            escapeAttr(t('Equipo chat placeholder')) +
            '" />' +
            '<button type="button" id="thb-chat-send" class="tm-chatcomposer__send" aria-label="' +
            escapeAttr(t('Equipo chat enviar')) +
            '">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
            '</button></div></div></div></div></div>' +
            '</div>' +
            (isOwner
                ? '<div class="tm-panel" data-thb-panel="admin">' +
                  '<div class="tm-scroll">' +
                  '<p class="tm-muted tm-muted--sm tm-admin-hint">' +
                  escapeHtml(t('Equipo admin hint')) +
                  '</p>' +
                  '<div id="team-admin-list" class="tm-adm"></div>' +
                  '</div></div>'
                : '') +
            '</div>' +
            '<footer class="tm-foot">' +
            '<button type="button" id="leave-team-btn" class="tm-btn tm-btn--ghost tm-btn--block tm-btn--danger">' +
            escapeHtml(isOwner ? t('Excluir Equipe') : t('Sair da Equipe')) +
            '</button>' +
            '<p id="leave-team-status" class="tm-feedback tm-feedback--center"></p>' +
            '</footer></div>';

        wireTeamHubTabs(doc, content);
        refreshTeamMembersUI(doc);
        loadTeamInvites(doc);

        if (isOwner) {
            // Variável pra guardar a logo selecionada
            var pendingLogoBase64 = null;
            
            // Upload de logo
            var logoInput = content.querySelector('#logo-input');
            var uploadBtn = content.querySelector('#upload-logo-btn');
            var logoStatus = content.querySelector('#logo-status');

            uploadBtn.addEventListener('click', function() {
                logoInput.click();
            });

            logoInput.addEventListener('change', function() {
                var file = logoInput.files[0];
                if (!file) return;

                if (file.size > 512 * 1024) {
                    logoStatus.style.color = '#ff6b6b';
                    logoStatus.textContent = 'Máximo 512KB';
                    return;
                }

                var reader = new FileReader();
                reader.onload = function(e) {
                    pendingLogoBase64 = e.target.result;
                    
                    // Mostra preview imediato
                    var logoPreview = content.querySelector('#team-logo-preview');
                    if (logoPreview && logoPreview.tagName === 'IMG') {
                        logoPreview.src = pendingLogoBase64;
                    } else if (logoPreview) {
                        var img = doc.createElement('img');
                        img.id = 'team-logo-preview';
                        img.src = pendingLogoBase64;
                        img.draggable = false;
                        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                        logoPreview.parentNode.replaceChild(img, logoPreview);
                    }
                    
                    logoStatus.style.color = '#8ED2AB';
                    logoStatus.textContent = t('Pronto pra salvar');
                };
                reader.readAsDataURL(file);
            });

            // Botão salvar alterações
            var saveBtn = content.querySelector('#save-settings-btn');
            var settingsStatus = content.querySelector('#settings-status');
            var nameInput = content.querySelector('#edit-name-input');
            var tagInput = content.querySelector('#edit-tag-input');

            saveBtn.addEventListener('click', function() {
                var rawName = nameInput.value;
                var newTag = tagInput.value.trim().toUpperCase();
                var vSave = validateTeamNameForCreate(rawName);
                if (!vSave.ok) {
                    settingsStatus.style.color = '#ff6b6b';
                    settingsStatus.textContent = vSave.error;
                    return;
                }
                if (newTag.length && !/^[A-Z0-9]{1,4}$/.test(newTag)) {
                    settingsStatus.style.color = '#ff6b6b';
                    settingsStatus.textContent = t('Erro ao salvar');
                    return;
                }
                var saveName = vSave.name;
                var saveTag = newTag.length ? newTag.slice(0, 4) : deriveTeamTag('', saveName);

                settingsStatus.style.color = '#8ED2AB';
                settingsStatus.textContent = t('Salvando...');

                var updatePromise = fetch(API_BASE + '/teams/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: saveName, tag: saveTag })
                }).then(function(r) {
                    return r.json();
                });

                updatePromise
                .then(function(result) {
                    if (result.success) {
                        myTeam.name = saveName;
                        myTeam.tag = saveTag;

                        var nameDisplay = content.querySelector('#team-name-display');
                        if (nameDisplay) nameDisplay.textContent = saveName;

                        if (pendingLogoBase64) {
                            var logoPromise = fetch(API_BASE + '/teams/logo', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image: pendingLogoBase64 })
                            }).then(function(r) {
                                return r.json();
                            });
                            logoPromise.then(function(logoResult) {
                                if (logoResult.success) {
                                    myTeam.logo_url = logoResult.logo_url;
                                    settingsStatus.textContent = t('Alterações salvas!');
                                    pendingLogoBase64 = null;
                                    logoStatus.textContent = '';
                                    syncMyLocalTeamInfoFromMyTeam();
                                    refreshAllBadges();
                                } else {
                                    settingsStatus.style.color = '#ff6b6b';
                                    settingsStatus.textContent = logoResult.error || t('Erro ao salvar');
                                }
                            });
                        } else {
                            settingsStatus.textContent = t('Alterações salvas!');
                            syncMyLocalTeamInfoFromMyTeam();
                            refreshAllBadges();
                        }
                    } else {
                        settingsStatus.style.color = '#ff6b6b';
                        settingsStatus.textContent = result.error || t('Erro ao salvar');
                    }
                })
                .catch(function() {
                    settingsStatus.style.color = '#ff6b6b';
                    settingsStatus.textContent = t('Erro de conexão');
                });
            });

            wireTeamJoinLink(doc, content);
        }

        content.querySelector('#leave-team-btn').addEventListener('click', function() {
            var leaveBtn = content.querySelector('#leave-team-btn');
            var leaveStatus = content.querySelector('#leave-team-status');
            var msg = isOwner ? t('Tem certeza que deseja EXCLUIR a equipe? Isso não pode ser desfeito.') : t('Tem certeza que deseja sair da equipe?');
            showConfirm(doc, msg, function() {
                leaveBtn.disabled = true;
                leaveBtn.style.opacity = '0.7';
                leaveStatus.style.color = '#8ED2AB';
                leaveStatus.textContent = isOwner ? t('Excluindo equipe...') : t('Saindo da equipe...');
                var endpoint = isOwner ? '/teams/delete' : '/teams/leave';
                var leavePromise = fetch(API_BASE + endpoint, { method: 'POST' }).then(function(r) {
                    return r.json();
                });
                leavePromise.then(function(result) {
                    if (result.success) {
                        myLocalTeamInfo = null;
                        teamsCache = {};
                        myTeam = null;
                        leaveStatus.style.color = '#8ED2AB';
                        leaveStatus.textContent = isOwner ? t('Equipe excluída') : t('Você saiu da equipe');
                        refreshAllBadges();
                        renderTeamsContent(doc);
                    } else {
                        leaveBtn.disabled = false;
                        leaveBtn.style.opacity = '1';
                        leaveStatus.style.color = '#ff6b6b';
                        leaveStatus.textContent = result.error || t('No se pudo salir del equipo');
                    }
                })
                .catch(function() {
                    leaveBtn.disabled = false;
                    leaveBtn.style.opacity = '1';
                    leaveStatus.style.color = '#ff6b6b';
                    leaveStatus.textContent = t('Erro de conexão');
                });
            });
        });
    }

    function wireTeamAdminActions(doc, rootEl) {
        if (!rootEl) return;
        rootEl.querySelectorAll('.tm-mrole').forEach(function(sel) {
            sel.addEventListener('change', function() {
                var did = String(sel.getAttribute('data-discord') || '').trim();
                var role = String(sel.value || 'member').trim();
                if (!did) return;
                fetch(API_BASE + '/teams/member-role', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_discord_id: did, role: role })
                })
                    .then(function(r) {
                        return r.json();
                    })
                    .then(function() {
                        refreshTeamMembersUI(doc);
                    })
                    .catch(function() {
                        refreshTeamMembersUI(doc);
                    });
            });
        });
        rootEl.querySelectorAll('.kick-member-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                showConfirm(doc, t('Remover este membro?'), function() {
                    fetch(API_BASE + '/teams/kick', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ discord_id: btn.getAttribute('data-id') })
                    })
                        .then(function(r) {
                            return r.json();
                        })
                        .then(function(result) {
                            if (result && result.success) refreshTeamMembersUI(doc);
                        })
                        .catch(function() {});
                });
            });
        });
    }

    function renderTeamBrowseMembers(doc, listEl, members) {
        if (!listEl) return;
        if (!members || !members.length) {
            listEl.innerHTML = '<p class="tm-muted">' + escapeHtml(t('Nenhum membro')) + '</p>';
            return;
        }
        var html = '';
        members.forEach(function(m) {
            var onApp = m && (m.is_online_app === 1 || m.is_online_app === true);
            var dot =
                '<span class="tm-dot' +
                (onApp ? ' tm-dot--on' : '') +
                '" title="' +
                escapeAttr(t('Equipo presencia app')) +
                '"></span>';
            var dispM = escapeHtml(String(m.discord_name || m.username || m.discord_id || ''));
            var badge =
                '<span class="' +
                memberRoleBadgeClass(m.role) +
                '">' +
                escapeHtml(memberRoleShortLabel(m.role)) +
                '</span>';
            html +=
                '<div class="tm-member tm-member--browse">' +
                '<div class="tm-member__row"><span class="tm-member__name">' +
                dot +
                dispM +
                '</span>' +
                badge +
                '</div></div>';
        });
        listEl.innerHTML = html;
    }

    function renderTeamAdminMembers(doc, listEl, members) {
        if (!listEl) return;
        if (!members || !members.length) {
            listEl.innerHTML = '<p class="tm-muted">' + escapeHtml(t('Nenhum membro')) + '</p>';
            return;
        }
        var html = '';
        members.forEach(function(m) {
            var onApp = m && (m.is_online_app === 1 || m.is_online_app === true);
            var dot =
                '<span class="tm-dot' +
                (onApp ? ' tm-dot--on' : '') +
                '" title="' +
                escapeAttr(t('Equipo presencia app')) +
                '"></span>';
            var dispM = escapeHtml(String(m.discord_name || m.username || m.discord_id || ''));
            var idM = escapeAttr(String(m.discord_id || ''));
            var badge =
                '<span class="' +
                memberRoleBadgeClass(m.role) +
                '">' +
                escapeHtml(memberRoleShortLabel(m.role)) +
                '</span>';
            var roleSelect = '';
            var kickBtn = '';
            if (isMyTeamOwner() && !roleLooksOwner(m.role)) {
                roleSelect =
                    '<select class="tm-select tm-mrole" data-discord="' +
                    idM +
                    '" aria-label="' +
                    escapeAttr(t('Cambiar rango')) +
                    '">' +
                    '<option value="member"' +
                    (roleLooksModerator(m.role) ? '' : ' selected') +
                    '>' +
                    escapeHtml(t('Rol miembro')) +
                    '</option>' +
                    '<option value="moderator"' +
                    (roleLooksModerator(m.role) ? ' selected' : '') +
                    '>' +
                    escapeHtml(t('Equipo rol admin')) +
                    '</option>' +
                    '</select>';
                kickBtn =
                    '<button type="button" class="kick-member-btn tm-btn tm-btn--ghost tm-btn--sm tm-btn--kick" data-id="' +
                    idM +
                    '">' +
                    escapeHtml(t('Equipo expulsar')) +
                    '</button>';
            }
            html +=
                '<div class="tm-adm-card">' +
                '<div class="tm-adm-card__person"><span class="tm-member__name">' +
                dot +
                dispM +
                '</span>' +
                badge +
                '</div>' +
                (roleSelect || kickBtn
                    ? '<div class="tm-adm-card__controls">' + roleSelect + kickBtn + '</div>'
                    : '') +
                '</div>';
        });
        listEl.innerHTML = html;
        wireTeamAdminActions(doc, listEl);
    }

    function refreshTeamMembersUI(doc) {
        var browse = doc.getElementById('team-members-list');
        var adm = doc.getElementById('team-admin-list');
        if (!browse && !adm) return;
        if (!myTeam || !myTeam.id) {
            if (browse)
                browse.innerHTML = '<p class="tm-muted">' + escapeHtml(t('Nenhum membro')) + '</p>';
            if (adm) adm.innerHTML = '<p class="tm-muted">' + escapeHtml(t('Nenhum membro')) + '</p>';
            return;
        }
        fetch(API_BASE + '/teams/members?team_id=' + encodeURIComponent(myTeam.id))
            .then(function(r) {
                if (!r.ok) return [];
                return r.json();
            })
            .then(function(members) {
                renderTeamBrowseMembers(doc, browse, members);
                if (adm && isMyTeamOwner()) {
                    renderTeamAdminMembers(doc, adm, members);
                }
            })
            .catch(function() {});
    }

    // Carrega convites pendentes
    function loadTeamInvites(doc) {
        var section = doc.getElementById('team-invites-section');
        if (!section) return;

        var invitesPromise = fetch(API_BASE + '/teams/invites').then(function(r) {
            if (!r.ok) return [];
            return r.json();
        });
        invitesPromise.then(function(invites) {
            if (!invites || !invites.length) {
                section.innerHTML = '';
                return;
            }

            var html =
                '<section class="tm-invwrap">' +
                '<h3 class="tm-h3 tm-h3--tight">' +
                escapeHtml(t('Invitaciones recibidas')) +
                '</h3>';
            invites.forEach(function(inv) {
                var tn = escapeHtml(String(inv.team_name || ''));
                var tt = escapeHtml(String(inv.team_tag || ''));
                var fn = escapeHtml(
                    String(inv.from_discord_name || inv.from_name || inv.from_discord_id || '—'),
                );
                var iid = escapeAttr(String(inv.id || ''));
                var or = String(inv.offered_role || 'member')
                    .trim()
                    .toLowerCase();
                var offerLbl =
                    or === 'moderator'
                        ? t('Rango invitación moderador')
                        : t('Rango invitación miembro');
                html +=
                    '<div class="tm-invcard">' +
                    '<div class="tm-invcard__text">' +
                    '<p class="tm-invcard__title">' +
                    tn +
                    ' <span class="tm-muted">[' +
                    tt +
                    ']</span></p>' +
                    '<p class="tm-invcard__sub">' +
                    escapeHtml(t('Invitación de')) +
                    ' ' +
                    fn +
                    ' · ' +
                    escapeHtml(offerLbl) +
                    '</p></div>' +
                    '<div class="tm-invcard__btns">' +
                    '<button type="button" class="accept-invite-btn tm-btn tm-btn--solid tm-btn--sm" data-id="' +
                    iid +
                    '">' +
                    escapeHtml(t('Aceitar')) +
                    '</button>' +
                    '<button type="button" class="reject-invite-btn tm-btn tm-btn--ghost tm-btn--sm" data-id="' +
                    iid +
                    '">' +
                    escapeHtml(t('Recusar')) +
                    '</button>' +
                    '</div></div>';
            });
            html += '</section>';
            section.innerHTML = html;

            section.querySelectorAll('.accept-invite-btn').forEach(function(btn) {
                btn.type = 'button';
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var inviteId = String(btn.getAttribute('data-id') || '').trim();
                    if (!inviteId) return;
                    var accPromise = fetch(API_BASE + '/teams/invites/accept', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invite_id: inviteId })
                    }).then(function(r) {
                        return r.json();
                    });
                    accPromise.then(function(result) {
                        if (result.success) {
                            loadMyTeam(doc);
                            loadTeamInvites(doc);
                        }
                    })
                    .catch(function() {});
                });
            });

            section.querySelectorAll('.reject-invite-btn').forEach(function(btn) {
                btn.type = 'button';
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var inviteId = String(btn.getAttribute('data-id') || '').trim();
                    if (!inviteId) return;
                    var rejPromise = fetch(API_BASE + '/teams/invites/reject', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invite_id: inviteId })
                    }).then(function(r) {
                        return r.json();
                    });
                    rejPromise.then(function(result) {
                        if (result.success) loadTeamInvites(doc);
                    })
                    .catch(function() {});
                });
            });
        });
    }

    // Carrega minha equipe
    function loadMyTeam(doc) {
        Promise.all([fetchTeamsMyJson(), fetchTeamsUserProfile()])
            .then(function(results) {
                var team = results[0];
                var user = results[1] || {};
                teamsViewerDiscordId = user.discord_id ? String(user.discord_id) : null;
                if (!team || !team.name) {
                    return Promise.resolve(null);
                }
                return enrichMyTeamOwnerFromMembers(team, user.discord_id);
            })
            .then(function(teamOrNull) {
                if (teamOrNull && teamOrNull.name) {
                    myTeam = teamOrNull;
                } else {
                    myTeam = null;
                }
                myTeamLoaded = true;
                syncMyLocalTeamInfoFromMyTeam();
                renderTeamsContent(doc);
            })
            .catch(function() {
                myTeam = null;
                teamsViewerDiscordId = null;
                myTeamLoaded = true;
                syncMyLocalTeamInfoFromMyTeam();
                renderTeamsContent(doc);
            });
    }

    // Toggle painel
    function toggleTeamsPanel(doc) {
        if (!doc) return;
        var dialog = getRoomlistDialog(doc);
        if (dialog) {
            teamsPanelOpen = !teamsPanelOpen;
            if (teamsPanelOpen) {
                if (window.FriendsSystem && typeof FriendsSystem.closeFriendsPanel === 'function') {
                    try {
                        FriendsSystem.closeFriendsPanel(doc);
                    } catch (eCf) {}
                }
                if (window.JerseyKitSystem && typeof JerseyKitSystem.closeRoomlistJerseyIfOpen === 'function') {
                    try {
                        JerseyKitSystem.closeRoomlistJerseyIfOpen(doc);
                    } catch (eJkT) {}
                }
                var orphanPanel = doc.getElementById('teams-panel');
                if (orphanPanel && orphanPanel.parentNode === doc.body) {
                    orphanPanel.remove();
                }
                dialog.classList.remove('zero-profile-mode');
                dialog.classList.remove('zero-friends-mode');
                dialog.classList.remove('zero-pro-mode');
                dialog.classList.remove('zero-kit-mode');
                if (window.__hxdSetRoomlistDialogProMode) {
                    try {
                        window.__hxdSetRoomlistDialogProMode(doc, dialog, false);
                    } catch (ePro) {}
                }
                if (window.__hxdClearProInpanelContext) {
                    try {
                        window.__hxdClearProInpanelContext();
                    } catch (ePc) {}
                }
                var proEl = doc.getElementById('zero-inpanel-pro');
                if (proEl) proEl.style.display = 'none';
                var wrap = doc.getElementById('zero-inpanel-teams') || createTeamsInpanel(doc, dialog);
                if (window.__hxdSetRoomlistDialogTeamsMode) {
                    try {
                        window.__hxdSetRoomlistDialogTeamsMode(doc, dialog, true);
                    } catch (eHxd2) {}
                }
                dialog.classList.add('zero-teams-mode');
                loadMyTeam(doc);
            } else {
                hideRoomlistTeamsInpanel(doc);
            }
            return;
        }

        var panel = doc.getElementById('teams-panel') || createTeamsPanel(doc);
        teamsPanelOpen = !teamsPanelOpen;

        if (teamsPanelOpen) {
            panel.style.right = '0';
            loadMyTeam(doc);
        } else {
            panel.style.right = '-360px';
            cleanupResources();
        }
    }

    // Injeta botão na roomlist
    function injectTeamsButton(iframeDoc) {
        if (!iframeDoc || iframeDoc.getElementById('teams-btn')) return;
        var roomlistView = iframeDoc.querySelector('.roomlist-view');
        if (!roomlistView) return;

        var createRoomBtn = roomlistView.querySelector('[data-hook="create"]');
        if (!createRoomBtn) return;

        var buttonsContainer = createRoomBtn.parentElement;
        if (!buttonsContainer || buttonsContainer.querySelector('#teams-btn')) return;

        var btn = iframeDoc.createElement('button');
        btn.id = 'teams-btn';
        btn.innerHTML = '<i class="icon-users"></i><div>Equipe</div>';

        btn.addEventListener('click', function() {
            toggleTeamsPanel(iframeDoc);
        });

        // Insere depois do botão de amizades ou do create
        var friendsBtn = buttonsContainer.querySelector('#friends-btn');
        if (friendsBtn) {
            friendsBtn.after(btn);
        } else {
            createRoomBtn.after(btn);
        }
    }

    // === BADGE NA LISTA DE JOGADORES ===

    function fetchTeamsByNicks(nicks, callback) {
        if (!nicks.length) { callback({}); return; }

        fetch(API_BASE + '/teams/by-nicks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nicks: nicks })
        })
        .then(function(r) { return r.json(); })
        .then(function(result) { callback(result || {}); })
        .catch(function() { callback({}); });
    }

    function isGhostMode() {
        return false;
    }

    // Força atualização de todas as badges (remove e re-aplica)
    function refreshAllBadges() {
        var wraps = document.querySelectorAll('.hxd-team-logo-wrap');
        for (var w = 0; w < wraps.length; w++) {
            wraps[w].remove();
        }
        var badges = document.querySelectorAll('.team-badge');
        for (var i = 0; i < badges.length; i++) {
            badges[i].remove();
        }
        teamsCache = {};
        processPlayersForTeams();
    }

    function applyTeamBadge(item, teamsData) {
        if (isGhostMode()) return;

        var nameEl = item.querySelector('[data-hook="name"]');
        if (!nameEl) return;

        var name = extractNickForTeamLookup(nameEl);

        // Migração: badge antigo junto ao nick
        var legacyBadge = nameEl.querySelector('.team-badge');
        if (legacyBadge) {
            legacyBadge.remove();
        }

        // Busca info da equipe pelo nick
        var teamInfo = teamsData[name];

        // Se for o jogador local e não achou no cache, usa a info local
        if (!teamInfo) {
            var playerId = parseInt(item.dataset.playerId, 10);
            var localPlayerId = window.__myLocalPlayerId;
            if (playerId === localPlayerId && myLocalTeamInfo) {
                teamInfo = myLocalTeamInfo;
            }
        }

        var logoWrap = item.querySelector('.hxd-team-logo-wrap');
        if (!teamInfo) {
            if (logoWrap) {
                logoWrap.remove();
            }
            return;
        }

        if (!logoWrap) {
            logoWrap = document.createElement('span');
            logoWrap.className = 'hxd-team-logo-wrap';
            logoWrap.setAttribute('aria-hidden', 'true');
        }
        var pingEl = item.querySelector('[data-hook="ping"]');
        if (pingEl) {
            if (logoWrap.parentNode !== pingEl) {
                if (logoWrap.parentNode) {
                    logoWrap.parentNode.removeChild(logoWrap);
                }
                pingEl.insertBefore(logoWrap, pingEl.firstChild);
            }
        } else if (!logoWrap.parentNode) {
            item.appendChild(logoWrap);
        }
        logoWrap.title = teamInfo.name || '';
        logoWrap.innerHTML = createTeamBadge(teamInfo.tag, teamInfo.color, teamInfo.logo_url);
    }

    function processPlayersForTeams() {
        var players = document.querySelectorAll('[class^="player-list-item"]');
        if (!players.length) return;

        var nicks = [];
        for (var i = 0; i < players.length; i++) {
            var nameEl = players[i].querySelector('[data-hook="name"]');
            if (nameEl) {
                var nick = extractNickForTeamLookup(nameEl);
                if (nick && !teamsCache.hasOwnProperty(nick)) {
                    nicks.push(nick);
                }
            }
        }

        // Aplica badges do cache
        for (var j = 0; j < players.length; j++) {
            applyTeamBadge(players[j], teamsCache);
        }

        if (nicks.length === 0) return;

        fetchTeamsByNicks(nicks, function(result) {
            for (var nick in result) {
                teamsCache[nick] = result[nick];
            }
            // Marca nicks sem equipe como null pra não buscar de novo
            for (var k = 0; k < nicks.length; k++) {
                if (!teamsCache[nicks[k]]) {
                    teamsCache[nicks[k]] = null;
                }
            }
            var ps = document.querySelectorAll('[class^="player-list-item"]');
            for (var m = 0; m < ps.length; m++) {
                applyTeamBadge(ps[m], teamsCache);
            }
        });
    }

    // Exporta funções
    window.TeamsSystem = {
        injectTeamsButton: injectTeamsButton,
        toggleTeamsPanel: toggleTeamsPanel,
        closeRoomlistTeamsIfOpen: hideRoomlistTeamsInpanel,
        processPlayersForTeams: processPlayersForTeams,
        createTeamBadge: createTeamBadge,
        refreshAllBadges: refreshAllBadges
    };

    // Inicializa observer para badges (só no game frame)
    if (typeof Injector !== 'undefined' && Injector.isGameFrame && Injector.isGameFrame()) {
        function debouncedProcess() {
            if (processTimeout) return;
            processTimeout = setTimeout(function() {
                processTimeout = null;
                processPlayersForTeams();
            }, 100);
        }
        
        Injector.onView('room-view', function() {
            teamsCache = {};
            
            // Limpa observers anteriores
            cleanupResources();
            
            // Busca a equipe do jogador local
            fetchTeamsMyJson()
            .then(function(team) {
                if (team && team.name) {
                    myLocalTeamInfo = {
                        name: team.name,
                        tag: team.tag,
                        color: team.color,
                        logo_url: team.logo_url
                    };
                } else {
                    myLocalTeamInfo = null;
                }
            })
            .catch(function() {
                myLocalTeamInfo = null;
            });
            
            setTimeout(function() {
                processPlayersForTeams();

                var lists = document.querySelectorAll('.player-list-view .list[data-hook="list"]');
                for (var i = 0; i < lists.length; i++) {
                    var observer = new MutationObserver(function(mutations) {
                        for (var j = 0; j < mutations.length; j++) {
                            if (mutations[j].addedNodes.length > 0) {
                                debouncedProcess();
                                break;
                            }
                        }
                    });
                    observer.observe(lists[i], { childList: true });
                    activeObservers.push(observer);
                }
            }, 200);
        });

        Injector.onViewLeave('room-view', function() {
            teamsCache = {};
            cleanupResources();
        });
    }
})();
