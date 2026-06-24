// ============================================
// JERSEY KIT — Creador de camiseta (/colors) en el diálogo de salas
// ============================================
(function () {
    if (typeof Injector !== 'undefined' && Injector.isMainFrame && Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var STORAGE_KEY = 'hxzero_jersey_kits_v1';
    var MAX_STRIPES = 3;
    var MAX_CMD_TOKENS = 7;

    var kitPanelOpen = false;
    var draft = {
        side: 'red',
        angle: 60,
        primary: '#ffffff',
        stripes: [],
        avatar: ''
    };

    function t(k) {
        return window.__t ? window.__t(k) : k;
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

    function getRoomlistDialog(doc) {
        if (!doc || !doc.querySelector) return null;
        return doc.querySelector('.roomlist-view .dialog');
    }

    function formatHex6(s) {
        var x = String(s || '').trim();
        if (x.charAt(0) === '#') x = x.slice(1);
        if (x.length !== 6 || !/^[0-9a-fA-F]+$/.test(x)) return '';
        return '#' + x.toLowerCase();
    }

    function loadKits() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveKits(arr) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        } catch (e) {}
    }

    function uniqId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }

    function clampAngle(n) {
        var x = Number(n);
        if (isNaN(x)) return 60;
        x = Math.round(x);
        while (x <= 0) x += 360;
        while (x > 360) x -= 360;
        return x;
    }

    /** Nombre de preset: minúsculas, solo a-z 0-9, máx. 8 (para /colors nombre en el chat). */
    function normalizePresetName(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 8);
    }

    function buildColorsCommand(kit, useClear) {
        var side = kit.side === 'blue' ? 'blue' : 'red';
        if (useClear) return '/colors ' + side + ' clear';
        var stripes = (kit.stripes && kit.stripes.length ? kit.stripes : []).map(formatHex6).filter(Boolean);
        if (!stripes.length) {
            var ph = formatHex6(kit.primary);
            if (!ph) ph = '#2563eb';
            stripes = [ph];
        }
        var parts = ['/colors', side, String(clampAngle(kit.angle))];
        for (var i = 0; i < stripes.length && i < MAX_STRIPES && parts.length < MAX_CMD_TOKENS; i++) {
            parts.push(stripes[i].replace(/^#/, ''));
        }
        return parts.join(' ');
    }

    /**
     * Interpreta una línea /colors pegada (HaxBall). No incluye color de texto del avatar.
     * @returns {{side:string,angle:number,stripes:string[],clear:boolean}|null}
     */
    function parseColorsCommand(line) {
        var s = String(line || '').trim();
        if (!/^\/colors\b/i.test(s)) return null;
        var tokens = s.split(/\s+/).filter(Boolean);
        if (tokens.length < 2) return null;
        var side = String(tokens[1]).toLowerCase();
        if (side !== 'red' && side !== 'blue') return null;
        if (tokens[2] && String(tokens[2]).toLowerCase() === 'clear') {
            return { side: side, angle: 60, stripes: [], clear: true };
        }
        var angle = parseInt(tokens[2], 10);
        if (!Number.isFinite(angle)) return null;
        angle = clampAngle(angle);
        var stripes = [];
        for (var i = 3; i < tokens.length && stripes.length < MAX_STRIPES; i++) {
            var hx = formatHex6(tokens[i]);
            if (hx) stripes.push(hx);
        }
        return { side: side, angle: angle, stripes: stripes, clear: false };
    }

    function applyChatSlash(fullLine) {
        var chatInput = document.querySelector('input[data-hook="input"]');
        if (!chatInput) return false;
        var originalValue = chatInput.value;
        chatInput.value = fullLine;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        var enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        chatInput.dispatchEvent(enterEvent);
        setTimeout(function () {
            chatInput.value = originalValue;
        }, 50);
        return true;
    }

    function applyAvatarSlash(avatar) {
        var a = String(avatar || '').trim();
        if (!a || a.length > 2) return false;
        return applyChatSlash('/avatar ' + a);
    }

    function jerseyPreviewSvg(kit, idSuffix, px) {
        var angle = clampAngle(kit.angle);
        var textColor = formatHex6(kit.primary) || '#ffffff';
        var stripes = Array.isArray(kit.stripes) ? kit.stripes.map(formatHex6).filter(Boolean) : [];
        if (!stripes.length) stripes = ['#0080ff'];
        var uid = idSuffix || 'p';
        var bands = stripes.length;
        var avatarText = String(kit.avatar || 'HC')
            .trim()
            .slice(0, 2)
            .toUpperCase();
        if (!avatarText) avatarText = 'HC';
        var inner = '';
        var widths = [];
        if (bands === 3) widths = [88 / 3, 88 / 3, 88 / 3];
        else if (bands === 2) widths = [44, 44];
        else widths = [88];
        var curX = -10;
        for (var i = 0; i < bands; i++) {
            var w = widths[i] || 0;
            inner += '<rect x="' + curX + '" y="-10" width="' + w + '" height="104" fill="' + escapeHtml(stripes[i]) + '"/>';
            curX += w;
        }
        var size = typeof px === 'number' && px > 0 ? Math.round(px) : 48;
        return (
            '<svg width="' +
            size +
            '" height="' +
            size +
            '" viewBox="0 0 88 88" aria-hidden="true">' +
            '<defs><clipPath id="jx-' +
            uid +
            '"><circle cx="44" cy="44" r="36"/></clipPath></defs>' +
            '<g clip-path="url(#jx-' +
            uid +
            ')">' +
            '<g transform="rotate(' +
            escapeHtml(angle) +
            ' 44 44)">' +
            inner +
            '</g></g>' +
            '<circle cx="44" cy="44" r="36" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>' +
            '<text x="44" y="53" text-anchor="middle" font-size="24" font-weight="700" fill="' +
            escapeHtml(textColor) +
            '" font-family="Inter,Segoe UI,sans-serif">' +
            escapeHtml(avatarText) +
            '</text>' +
            '</svg>'
        );
    }

    function setToast(doc, msg, ok) {
        var el = doc.getElementById('jersey-kit-toast');
        if (!el) return;
        el.textContent = msg || '';
        el.style.color = ok ? '#86efac' : '#fca5a5';
    }

    function readDraftFromDom(doc) {
        var sideEl = doc.getElementById('jersey-side');
        var sideRadio = doc.querySelector('input[name="jersey-team-side"]:checked');
        var angleEl = doc.getElementById('jersey-angle');
        var angleNumEl = doc.getElementById('jersey-angle-number');
        var primEl = doc.getElementById('jersey-primary');
        var textEl = doc.getElementById('jersey-text-color');
        var avEl = doc.getElementById('jersey-avatar');
        draft.side = sideRadio ? String(sideRadio.value) : sideEl && sideEl.value === 'blue' ? 'blue' : 'red';
        draft.angle = angleNumEl ? Number(angleNumEl.value) : angleEl ? Number(angleEl.value) : 0;
        if (angleEl && angleNumEl && angleEl.value !== String(clampAngle(draft.angle))) {
            angleEl.value = String(clampAngle(draft.angle));
        }
        draft.primary = textEl && textEl.value ? formatHex6(textEl.value) || draft.primary : primEl && primEl.value ? formatHex6(primEl.value) || draft.primary : draft.primary;
        draft.avatar = avEl ? String(avEl.value || '').trim().slice(0, 2) : '';
        var countEl = doc.querySelector('input[name="jersey-colors-count"]:checked');
        var cCount = countEl ? Number(countEl.value) : 1;
        if (!Number.isFinite(cCount) || cCount < 1) cCount = 1;
        if (cCount > 3) cCount = 3;
        var c1 = formatHex6((doc.getElementById('jersey-color-1') || {}).value) || '#0080ff';
        var c2 = formatHex6((doc.getElementById('jersey-color-2') || {}).value) || '#004077';
        var c3 = formatHex6((doc.getElementById('jersey-color-3') || {}).value) || '#002033';
        draft.stripes = [c1];
        if (cCount >= 2) draft.stripes.push(c2);
        if (cCount >= 3) draft.stripes.push(c3);
        return draft;
    }

    function applyDraftToDom(doc, k) {
        var sideEl = doc.getElementById('jersey-side');
        var angleEl = doc.getElementById('jersey-angle');
        var angleNumEl = doc.getElementById('jersey-angle-number');
        var primEl = doc.getElementById('jersey-primary');
        var textEl = doc.getElementById('jersey-text-color');
        var avEl = doc.getElementById('jersey-avatar');
        if (sideEl) sideEl.value = k.side === 'blue' ? 'blue' : 'red';
        var sideRadio = doc.querySelector('input[name="jersey-team-side"][value="' + (k.side === 'blue' ? 'blue' : 'red') + '"]');
        if (sideRadio) sideRadio.checked = true;
        if (angleEl) angleEl.value = String(clampAngle(k.angle));
        if (angleNumEl) angleNumEl.value = String(clampAngle(k.angle));
        if (primEl) primEl.value = formatHex6(k.primary) || '#2563eb';
        if (textEl) textEl.value = formatHex6(k.primary) || '#ffffff';
        if (avEl) avEl.value = k.avatar || '';
        var s0 = formatHex6((k.stripes && k.stripes[0]) || '#0080ff') || '#0080ff';
        var s1 = formatHex6((k.stripes && k.stripes[1]) || '#004077') || '#004077';
        var s2 = formatHex6((k.stripes && k.stripes[2]) || '#002033') || '#002033';
        var c1 = doc.getElementById('jersey-color-1');
        var c2 = doc.getElementById('jersey-color-2');
        var c3 = doc.getElementById('jersey-color-3');
        if (c1) c1.value = s0;
        if (c2) c2.value = s1;
        if (c3) c3.value = s2;
        var count = Math.max(1, Math.min(3, (k.stripes && k.stripes.length) || 1));
        var countRadio = doc.querySelector('input[name="jersey-colors-count"][value="' + count + '"]');
        if (countRadio) countRadio.checked = true;
        var wrap = doc.getElementById('jersey-stripes-wrap');
        if (wrap) wrap.innerHTML = '';
    }

    function addStripeRow(doc, val) {
        var wrap = doc.getElementById('jersey-stripes-wrap');
        if (!wrap) return;
        if (wrap.querySelectorAll('.jersey-stripe-row').length >= MAX_STRIPES) return;
        var row = doc.createElement('div');
        row.className = 'jersey-stripe-row tm-token-row';
        row.style.marginBottom = '8px';
        var inp = doc.createElement('input');
        inp.type = 'text';
        inp.className = 'jersey-stripe-hex tm-input tm-input--mono';
        inp.maxLength = 7;
        inp.value = val || '#ffffff';
        inp.placeholder = '#RRGGBB';
        var rm = doc.createElement('button');
        rm.type = 'button';
        rm.className = 'tm-btn tm-btn--ghost tm-btn--sm tm-btn--danger';
        rm.textContent = '×';
        rm.setAttribute('aria-label', t('Eliminar'));
        rm.addEventListener('click', function () {
            row.remove();
            readDraftFromDom(doc);
            refreshPreview(doc);
        });
        inp.addEventListener('input', function () {
            readDraftFromDom(doc);
            refreshPreview(doc);
        });
        row.appendChild(inp);
        row.appendChild(rm);
        wrap.appendChild(row);
    }

    function refreshPreview(doc) {
        readDraftFromDom(doc);
        var prev = doc.getElementById('jersey-preview-wrap');
        if (prev) prev.innerHTML = jerseyPreviewSvg(draft, 'live', 250);
        var meta = doc.getElementById('jersey-meta-side');
        if (meta) {
            meta.textContent =
                draft.side === 'blue' ? t('Jersey meta azul') : t('Jersey meta rojo');
        }
        var pInput = doc.getElementById('jersey-primary');
        if (pInput) pInput.value = formatHex6(draft.primary) || '#ffffff';
        var cmd = doc.getElementById('jersey-cmd-preview');
        if (cmd) {
            var clr = doc.getElementById('jersey-use-clear');
            cmd.value = buildColorsCommand(draft, !!(clr && clr.checked));
        }
    }

    function renderSavedList(doc) {
        var host = doc.getElementById('jersey-saved-list');
        if (!host) return;
        var kits = loadKits();
        if (!kits.length) {
            host.innerHTML = '<p class="tm-muted tm-muted--sm">' + escapeHtml(t('Jersey sin diseños guardados')) + '</p>';
            return;
        }
        var html = '';
        for (var i = 0; i < kits.length; i++) {
            var k = kits[i];
            if (!k || !k.id) continue;
            html +=
                '<div class="tm-token-row jersey-saved-row" data-id="' +
                escapeAttr(k.id) +
                '" style="margin-bottom:8px;flex-wrap:wrap;">' +
                '<span style="flex:1;min-width:120px;font-size:13px;color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
                escapeHtml(k.name || t('Jersey diseño sin nombre')) +
                '</span>' +
                '<button type="button" class="jersey-load tm-btn tm-btn--ghost tm-btn--sm" data-id="' +
                escapeAttr(k.id) +
                '">' +
                escapeHtml(t('Cargar')) +
                '</button>' +
                '<button type="button" class="jersey-apply-saved tm-btn tm-btn--solid tm-btn--sm" data-id="' +
                escapeAttr(k.id) +
                '">' +
                escapeHtml(t('Aplicar')) +
                '</button>' +
                '<button type="button" class="jersey-del tm-btn tm-btn--ghost tm-btn--sm tm-btn--danger" data-id="' +
                escapeAttr(k.id) +
                '">' +
                escapeHtml(t('Eliminar')) +
                '</button></div>';
        }
        host.innerHTML = html;
        host.querySelectorAll('.jersey-load').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var list = loadKits();
                for (var j = 0; j < list.length; j++) {
                    if (list[j].id === id) {
                        applyDraftToDom(doc, list[j]);
                        refreshPreview(doc);
                        setToast(doc, t('Jersey diseño cargado'), true);
                        return;
                    }
                }
            });
        });
        host.querySelectorAll('.jersey-apply-saved').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var list = loadKits();
                for (var j = 0; j < list.length; j++) {
                    if (list[j].id === id) {
                        applyKitInGame(doc, list[j]);
                        return;
                    }
                }
            });
        });
        host.querySelectorAll('.jersey-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var list = loadKits().filter(function (x) {
                    return x.id !== id;
                });
                saveKits(list);
                renderSavedList(doc);
                setToast(doc, t('Jersey diseño eliminado'), true);
            });
        });
    }

    function applyKitInGame(doc, kitOverride) {
        readDraftFromDom(doc);
        var fromSaved = kitOverride && typeof kitOverride === 'object';
        var k = fromSaved ? kitOverride : draft;
        var clr = doc.getElementById('jersey-use-clear');
        var useClear = !fromSaved && !!(clr && clr.checked);
        var cmd = buildColorsCommand(k, useClear);
        if (!applyChatSlash(cmd)) {
            setToast(doc, t('Jersey chat no disponible'), false);
            return;
        }
        setToast(doc, t('Jersey colores enviados'), true);
        if (k.avatar && String(k.avatar).trim() && !useClear) {
            setTimeout(function () {
                if (!applyAvatarSlash(k.avatar)) setToast(doc, t('Jersey avatar no aplicado'), false);
            }, 120);
        }
    }

    function bindEditor(doc) {
        var contentHost = doc.getElementById('jersey-kit-content');
        if (contentHost && contentHost.dataset.jerseyBound === '1') {
            refreshPreview(doc);
            renderSavedList(doc);
            return;
        }
        if (contentHost) contentHost.dataset.jerseyBound = '1';

        var side = doc.getElementById('jersey-side');
        var sideRadios = doc.querySelectorAll('input[name="jersey-team-side"]');
        var angle = doc.getElementById('jersey-angle');
        var angleNum = doc.getElementById('jersey-angle-number');
        var prim = doc.getElementById('jersey-primary');
        var textColor = doc.getElementById('jersey-text-color');
        var c1 = doc.getElementById('jersey-color-1');
        var c2 = doc.getElementById('jersey-color-2');
        var c3 = doc.getElementById('jersey-color-3');
        var countRadios = doc.querySelectorAll('input[name="jersey-colors-count"]');
        var avatarEl = doc.getElementById('jersey-avatar');
        var clearChk = doc.getElementById('jersey-use-clear');
        var addStripe = doc.getElementById('jersey-add-stripe');
        var applyBtn = doc.getElementById('jersey-apply-btn');
        var saveBtn = doc.getElementById('jersey-save-btn');
        var copyBtn = doc.getElementById('jersey-copy-cmd');
        var avBtn = doc.getElementById('jersey-apply-avatar-btn');
        var impBtn = doc.getElementById('jersey-import-btn');
        var impTa = doc.getElementById('jersey-import-ta');

        function onChange() {
            refreshPreview(doc);
        }
        if (side) side.addEventListener('change', onChange);
        sideRadios.forEach(function(r) { r.addEventListener('change', onChange); });
        if (angle) {
            angle.addEventListener('input', function () {
                if (angleNum) angleNum.value = String(clampAngle(angle.value));
                onChange();
            });
            angle.addEventListener('change', onChange);
        }
        if (angleNum) {
            angleNum.addEventListener('input', function () {
                if (angle) angle.value = String(clampAngle(angleNum.value));
                onChange();
            });
            angleNum.addEventListener('change', onChange);
        }
        if (prim) prim.addEventListener('input', onChange);
        if (textColor) {
            textColor.addEventListener('input', function () {
                var n = formatHex6(textColor.value);
                if (n) prim.value = n;
                onChange();
            });
        }
        [c1, c2, c3].forEach(function (el) {
            if (!el) return;
            el.addEventListener('input', onChange);
        });
        if (avatarEl) avatarEl.addEventListener('input', onChange);
        countRadios.forEach(function(r) { r.addEventListener('change', onChange); });
        if (clearChk) clearChk.addEventListener('change', onChange);
        if (addStripe)
            addStripe.addEventListener('click', function () {
                readDraftFromDom(doc);
                if (draft.stripes.length >= MAX_STRIPES) {
                    setToast(doc, t('Jersey máximo rayas'), false);
                    return;
                }
                addStripeRow(doc, '#e2e8f0');
                refreshPreview(doc);
            });
        if (applyBtn)
            applyBtn.addEventListener('click', function () {
                applyKitInGame(doc);
            });
        if (saveBtn)
            saveBtn.addEventListener('click', function () {
                readDraftFromDom(doc);
                var nameInp = doc.getElementById('jersey-design-name');
                var nameKey = normalizePresetName(nameInp ? nameInp.value : '');
                if (!nameKey) {
                    setToast(doc, t('Jersey nombre preset inválido'), false);
                    return;
                }
                if (nameKey === 'red' || nameKey === 'blue' || nameKey === 'clear') {
                    setToast(doc, t('Jersey nombre preset reservado'), false);
                    return;
                }
                if (nameInp) nameInp.value = nameKey;
                var row = {
                    id: uniqId(),
                    name: nameKey,
                    side: draft.side,
                    angle: clampAngle(draft.angle),
                    primary: formatHex6(draft.primary) || '#2563eb',
                    stripes: draft.stripes.slice(),
                    avatar: draft.avatar || ''
                };
                var list = loadKits().filter(function (x) {
                    return normalizePresetName(x && x.name) !== nameKey;
                });
                list.unshift(row);
                saveKits(list);
                renderSavedList(doc);
                setToast(doc, t('Jersey diseño guardado'), true);
            });
        if (copyBtn)
            copyBtn.addEventListener('click', function () {
                readDraftFromDom(doc);
                var clr = doc.getElementById('jersey-use-clear');
                var line = buildColorsCommand(draft, !!(clr && clr.checked));
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(line).then(
                            function () {
                                setToast(doc, t('Jersey comando copiado'), true);
                            },
                            function () {
                                setToast(doc, t('Jersey no se pudo copiar'), false);
                            }
                        );
                    } else {
                        setToast(doc, line, true);
                    }
                } catch (e) {
                    setToast(doc, t('Jersey no se pudo copiar'), false);
                }
            });
        if (avBtn)
            avBtn.addEventListener('click', function () {
                readDraftFromDom(doc);
                if (!draft.avatar) {
                    setToast(doc, t('Jersey avatar vacío'), false);
                    return;
                }
                if (!applyAvatarSlash(draft.avatar)) setToast(doc, t('Jersey chat no disponible'), false);
                else setToast(doc, t('Jersey avatar enviado'), true);
            });
        if (impBtn && impTa) {
            impBtn.addEventListener('click', function () {
                var raw = String(impTa.value || '').trim();
                if (!raw) {
                    setToast(doc, t('Jersey import vacío'), false);
                    return;
                }
                try {
                    if (raw.charAt(0) === '{') {
                        var o = JSON.parse(raw);
                        if (!o || typeof o !== 'object') throw new Error('x');
                        applyDraftToDom(doc, {
                            side: o.side === 'blue' ? 'blue' : 'red',
                            angle: o.angle,
                            primary: o.primary,
                            stripes: Array.isArray(o.stripes) ? o.stripes : [],
                            avatar: o.avatar || ''
                        });
                    } else {
                        var line =
                            raw
                                .split(/\r?\n/)
                                .map(function (ln) {
                                    return ln.trim();
                                })
                                .filter(Boolean)[0] || raw;
                        var parsed = parseColorsCommand(line);
                        if (!parsed) throw new Error('x');
                        readDraftFromDom(doc);
                        var keepP = formatHex6(draft.primary) || '#ffffff';
                        var keepA = draft.avatar || '';
                        var clr = doc.getElementById('jersey-use-clear');
                        if (parsed.clear) {
                            if (clr) clr.checked = true;
                            applyDraftToDom(doc, {
                                side: parsed.side,
                                angle: draft.angle,
                                primary: keepP,
                                stripes: draft.stripes.slice(),
                                avatar: keepA
                            });
                        } else {
                            if (clr) clr.checked = false;
                            var st = parsed.stripes.length ? parsed.stripes.slice() : [keepP];
                            applyDraftToDom(doc, {
                                side: parsed.side,
                                angle: parsed.angle,
                                primary: keepP,
                                stripes: st,
                                avatar: keepA
                            });
                        }
                    }
                    impTa.value = '';
                    refreshPreview(doc);
                    setToast(doc, t('Jersey import ok'), true);
                } catch (e) {
                    setToast(doc, t('Jersey import error'), false);
                }
            });
        }
        refreshPreview(doc);
        renderSavedList(doc);
    }

    function buildPanelInner(doc) {
        return (
            '<div class="tm-shell">' +
            '<header class="tm-head">' +
            '<div class="tm-head__main" style="width:100%;">' +
            '<div class="tm-kicker tm-muted tm-muted--sm">' +
            escapeHtml(t('Jersey panel subtítulo')) +
            '</div>' +
            '<h2 class="tm-title" style="margin-top:6px">' +
            escapeHtml(t('Jersey preview título')) +
            '</h2>' +
            '<div class="tm-meta"><span id="jersey-meta-side">' +
            escapeHtml(t('Jersey meta rojo')) +
            '</span><span class="tm-meta__dot">·</span><span>' +
            escapeHtml(t('Jersey panel meta hint')) +
            '</span></div>' +
            '</div></header>' +
            '<div class="tm-stack">' +
            '<div class="tm-scroll">' +
            '<div class="jk-grid" style="display:grid;grid-template-columns:minmax(250px,1fr) minmax(320px,1.2fr);gap:16px;align-items:start;">' +
            '<div class="tm-joinbox" style="margin:0;position:sticky;top:0;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.2);">' +
            '<h3 class="tm-h3 tm-h3--tight" style="margin-bottom:10px;letter-spacing:0.02em;">' +
            escapeHtml(t('Jersey preview título')) +
            '</h3>' +
            '<div style="width:100%;aspect-ratio:1/1;border-radius:12px;border:1px solid rgba(255,255,255,0.10);background:#121214;display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
            '<div id="jersey-preview-wrap"></div>' +
            '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:12px;">' +
            '<div style="display:grid;grid-template-columns:minmax(120px,1fr) minmax(170px,1.3fr);gap:12px;">' +
            '<div class="tm-joinbox" style="margin:0;"><h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey equipo tm')) +
            '</h3>' +
            '<label class="tm-rowline" style="justify-content:space-between;"><span>red</span><input type="radio" name="jersey-team-side" value="red" checked></label>' +
            '<label class="tm-rowline" style="justify-content:space-between;"><span>blue</span><input type="radio" name="jersey-team-side" value="blue"></label>' +
            '<select id="jersey-side" class="tm-input" style="display:none;"><option value="red">red</option><option value="blue">blue</option></select>' +
            '</div>' +
            '<div class="tm-joinbox" style="margin:0;grid-row:span 2;"><h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey valores tm')) +
            '</h3>' +
            '<div class="tm-field"><label class="tm-label" for="jersey-angle-number">' +
            escapeHtml(t('Jersey ángulo corto')) +
            '</label><div class="tm-token-row" style="align-items:center;"><input id="jersey-angle" class="tm-input" type="range" min="1" max="360" value="60" style="flex:1;"><input id="jersey-angle-number" class="tm-input tm-input--mono" type="number" min="1" max="360" value="60" style="width:78px;flex:0 0 auto;"></div></div>' +
            '<div class="tm-field"><label class="tm-label" for="jersey-avatar">' +
            escapeHtml(t('Jersey texto avatar')) +
            '</label><input id="jersey-avatar" class="tm-input tm-input--mono" type="text" maxlength="2" value="HC"></div>' +
            '<div class="tm-field"><label class="tm-label" for="jersey-text-color">' +
            escapeHtml(t('Jersey color texto')) +
            '</label><input id="jersey-text-color" class="tm-input" type="color" value="#ffffff" style="width:56px;height:38px;padding:0;border:none;background:transparent;cursor:pointer;"></div>' +
            '<div class="tm-field"><label class="tm-label" for="jersey-color-1">' +
            escapeHtml(t('Jersey color camiseta')) +
            ' 1</label><input id="jersey-color-1" class="tm-input" type="color" value="#0080ff" style="width:56px;height:38px;padding:0;border:none;background:transparent;cursor:pointer;"></div>' +
            '<div class="tm-field"><label class="tm-label" for="jersey-color-2">' +
            escapeHtml(t('Jersey color camiseta')) +
            ' 2</label><input id="jersey-color-2" class="tm-input" type="color" value="#004077" style="width:56px;height:38px;padding:0;border:none;background:transparent;cursor:pointer;"></div>' +
            '<div class="tm-field"><label class="tm-label" for="jersey-color-3">' +
            escapeHtml(t('Jersey color camiseta')) +
            ' 3</label><input id="jersey-color-3" class="tm-input" type="color" value="#002033" style="width:56px;height:38px;padding:0;border:none;background:transparent;cursor:pointer;"></div>' +
            '<input id="jersey-primary" type="hidden" value="#ffffff">' +
            '</div>' +
            '<div class="tm-joinbox" style="margin:0;"><h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey cantidad colores')) +
            '</h3>' +
            '<label class="tm-rowline" style="justify-content:space-between;"><span>' +
            escapeHtml(t('Jersey una franja')) +
            '</span><input type="radio" name="jersey-colors-count" value="1"></label>' +
            '<label class="tm-rowline" style="justify-content:space-between;"><span>' +
            escapeHtml(t('Jersey dos franjas')) +
            '</span><input type="radio" name="jersey-colors-count" value="2"></label>' +
            '<label class="tm-rowline" style="justify-content:space-between;"><span>' +
            escapeHtml(t('Jersey tres franjas')) +
            '</span><input type="radio" name="jersey-colors-count" value="3" checked></label>' +
            '</div>' +
            '</div>' +
            '<div class="tm-joinbox" style="margin:0;">' +
            '<h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey comando tm')) +
            '</h3>' +
            '<label class="tm-rowline" style="cursor:pointer;align-items:center;margin-bottom:8px;"><input type="checkbox" id="jersey-use-clear" style="width:auto;margin:0;accent-color:#fafafa"><span class="tm-muted tm-muted--sm" style="margin:0">' +
            escapeHtml(t('Jersey restaurar defecto sala')) +
            '</span></label>' +
            '<div class="tm-token-row"><textarea id="jersey-cmd-preview" class="tm-input tm-input--mono" readonly rows="2" spellcheck="false" style="min-height:58px"></textarea><button type="button" id="jersey-copy-cmd" class="tm-btn tm-btn--solid">' +
            escapeHtml(t('Jersey copiar comando')) +
            '</button></div><div class="tm-token-row" style="margin-top:10px"><button type="button" id="jersey-apply-btn" class="tm-btn tm-btn--solid" style="flex:1">' +
            escapeHtml(t('Jersey aplicar en sala')) +
            '</button><button type="button" id="jersey-apply-avatar-btn" class="tm-btn tm-btn--ghost">' +
            escapeHtml(t('Jersey solo avatar')) +
            '</button></div>' +
            '</div>' +
            '<div id="jersey-stripes-wrap" style="display:none;"></div>' +
            '<button type="button" id="jersey-add-stripe" style="display:none;"></button>' +
            '<div class="tm-joinbox" style="margin:0;"><h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey persist tm')) +
            '</h3><p class="tm-muted tm-muted--sm" style="margin:0 0 8px 0">' +
            escapeHtml(t('Jersey preset chat ayuda')) +
            '</p><div class="tm-token-row"><input id="jersey-design-name" class="tm-input tm-input--mono" type="text" maxlength="24" autocomplete="off" placeholder="' +
            escapeAttr(t('Jersey nombre diseño placeholder')) +
            '"><button type="button" id="jersey-save-btn" class="tm-btn tm-btn--solid">' +
            escapeHtml(t('Jersey guardar diseño')) +
            '</button></div></div>' +
            '<div class="tm-joinbox" style="margin:0;"><h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey diseños guardados')) +
            '</h3><div id="jersey-saved-list"></div></div>' +
            '<div class="tm-joinbox" style="margin:0;"><h3 class="tm-h3 tm-h3--tight">' +
            escapeHtml(t('Jersey import tm')) +
            '</h3><textarea id="jersey-import-ta" class="tm-input tm-input--mono" rows="3" placeholder="' +
            escapeAttr(t('Jersey import placeholder')) +
            '" style="resize:vertical;margin-bottom:10px;width:100%"></textarea><button type="button" id="jersey-import-btn" class="tm-btn tm-btn--ghost tm-btn--block">' +
            escapeHtml(t('Jersey importar botón')) +
            '</button></div>' +
            '</div></div></div></div></div>'
        );
    }

    function createJerseyInpanel(doc, dialog) {
        var existing = doc.getElementById('zero-inpanel-jersey');
        if (existing) return existing;
        var wrap = doc.createElement('div');
        wrap.id = 'zero-inpanel-jersey';
        wrap.style.display = 'none';
        wrap.style.flexDirection = 'column';
        wrap.style.width = '100%';
        wrap.style.height = '100%';
        wrap.style.boxSizing = 'border-box';
        wrap.style.margin = '0';
        wrap.style.padding = '0';
        wrap.style.minHeight = '0';
        wrap.style.maxHeight = 'none';
        wrap.style.overflow = 'hidden';
        wrap.style.flex = '1 1 auto';
        wrap.style.background = 'var(--theme-bg-primary, #141414)';
        wrap.innerHTML =
            '<div style="padding:10px 12px 0 12px;position:relative;flex-shrink:0;border-bottom:1px solid #232323;">' +
            '<button id="close-jersey-btn" type="button" style="position:absolute;top:8px;right:10px;background:none;border:none;color:#666;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;" title="' +
            escapeAttr(t('Fechar')) +
            '">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
            '<h1 style="color:#fff;font-size:16px;font-weight:600;margin:0 0 10px 0;padding:4px 28px 0 0;text-align:center;font-family:\'Space Grotesk\',sans-serif;">' +
            escapeHtml(t('Camiseta')) +
            '</h1></div>' +
            '<div id="jersey-kit-content" style="flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px;font-family:\'Space Grotesk\',sans-serif;"></div>';

        var sb = doc.getElementById('sidebar-panel');
        if (sb && sb.parentNode === dialog) {
            dialog.insertBefore(wrap, sb);
        } else {
            dialog.appendChild(wrap);
        }

        var content = wrap.querySelector('#jersey-kit-content');
        if (content) content.innerHTML = buildPanelInner(doc);

        var closeBtn = wrap.querySelector('#close-jersey-btn');
        if (closeBtn) {
            closeBtn.addEventListener('mouseenter', function () {
                closeBtn.style.color = '#fff';
            });
            closeBtn.addEventListener('mouseleave', function () {
                closeBtn.style.color = '#666';
            });
            closeBtn.addEventListener('click', function () {
                hideRoomlistJerseyInpanel(doc);
            });
        }
        bindEditor(doc);
        return wrap;
    }

    function hideRoomlistJerseyInpanel(doc) {
        var d = getRoomlistDialog(doc);
        if (d) {
            if (window.__hxdSetRoomlistDialogKitMode) {
                try {
                    window.__hxdSetRoomlistDialogKitMode(doc, d, false);
                } catch (eK) {}
            }
            d.classList.remove('zero-kit-mode');
        }
        kitPanelOpen = false;
    }

    function toggleJerseyPanel(doc) {
        if (!doc) return;
        var dialog = getRoomlistDialog(doc);
        if (!dialog) return;
        kitPanelOpen = !kitPanelOpen;
        if (!kitPanelOpen) {
            hideRoomlistJerseyInpanel(doc);
            return;
        }
        if (window.FriendsSystem && typeof FriendsSystem.closeFriendsPanel === 'function') {
            try {
                FriendsSystem.closeFriendsPanel(doc);
            } catch (eF) {}
        }
        if (window.TeamsSystem && typeof TeamsSystem.closeRoomlistTeamsIfOpen === 'function') {
            try {
                TeamsSystem.closeRoomlistTeamsIfOpen(doc);
            } catch (eT) {}
        }
        dialog.classList.remove('zero-profile-mode', 'zero-teams-mode', 'zero-friends-mode', 'zero-pro-mode');
        if (window.__hxdSetRoomlistDialogProMode) {
            try {
                window.__hxdSetRoomlistDialogProMode(doc, dialog, false);
            } catch (eP) {}
        }
        if (window.__hxdClearProInpanelContext) {
            try {
                window.__hxdClearProInpanelContext();
            } catch (eC) {}
        }
        var proEl = doc.getElementById('zero-inpanel-pro');
        if (proEl) proEl.style.display = 'none';

        doc.getElementById('zero-inpanel-jersey') || createJerseyInpanel(doc, dialog);

        if (window.__hxdSetRoomlistDialogKitMode) {
            try {
                window.__hxdSetRoomlistDialogKitMode(doc, dialog, true);
            } catch (eK2) {}
        }
        dialog.classList.add('zero-kit-mode');

        var jc = doc.getElementById('jersey-kit-content');
        if (jc && !jc.querySelector('#jersey-side')) {
            jc.innerHTML = buildPanelInner(doc);
            delete jc.dataset.jerseyBound;
            bindEditor(doc);
        } else {
            bindEditor(doc);
        }
    }

    function closeRoomlistJerseyIfOpen(doc) {
        if (!doc) return;
        var dialog = getRoomlistDialog(doc);
        if (dialog && (kitPanelOpen || dialog.classList.contains('zero-kit-mode'))) {
            hideRoomlistJerseyInpanel(doc);
        }
    }

    function installJerseyChatPresetHook() {
        if (installJerseyChatPresetHook._done) return;
        installJerseyChatPresetHook._done = true;
        document.addEventListener(
            'keydown',
            function (ev) {
                if (!ev || ev.key !== 'Enter' || ev.defaultPrevented) return;
                var el = ev.target;
                if (!el || el.tagName !== 'INPUT' || el.getAttribute('data-hook') !== 'input') return;
                var raw = String(el.value || '').trim();
                var m = /^\/colors\s+(\S+)\s*$/i.exec(raw);
                if (!m) return;
                var token = String(m[1]).toLowerCase();
                if (token === 'red' || token === 'blue' || token === 'clear') return;
                var nameKey = normalizePresetName(token);
                if (!nameKey || nameKey.length > 8) return;
                var kits = loadKits();
                var kit = null;
                for (var i = 0; i < kits.length; i++) {
                    if (normalizePresetName(kits[i] && kits[i].name) === nameKey) {
                        kit = kits[i];
                        break;
                    }
                }
                if (!kit) return;
                ev.preventDefault();
                ev.stopImmediatePropagation();
                if (!applyChatSlash(buildColorsCommand(kit, false))) return;
                if (kit.avatar && String(kit.avatar).trim()) {
                    setTimeout(function () {
                        applyAvatarSlash(kit.avatar);
                    }, 120);
                }
            },
            true
        );
    }

    installJerseyChatPresetHook();

    window.JerseyKitSystem = {
        toggleJerseyPanel: toggleJerseyPanel,
        closeRoomlistJerseyIfOpen: closeRoomlistJerseyIfOpen
    };
})();
