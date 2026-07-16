// ============================================
// WELCOME - Popup de boas-vindas
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    var CURRENT_VERSION = '1.2.0';
    var WELCOME_FLOW_VERSION = 'haxball-zero-intro-v3';
    var currentPage = 0;
    var currentLang = localStorage.getItem('haxball_language') || 'es';

    var TRANSLATIONS = {
        pt: {
            welcomeTitle: 'HaxBall Zero',
            welcomeText: 'Você está entrando no <b>HaxBall Zero</b>.<br><br>Este cliente foi criado para levar o HaxBall a outro nível, com mais presença visual, mais personalidade e uma experiência pensada para extrair o melhor do jogo.<br><br>Nas próximas telas, você escolhe o idioma e conhece os painéis principais do Zero.',
            langTitle: 'Escolha seu idioma',
            langText: 'Selecione o idioma do cliente. O restante do tutorial e grande parte da interface acompanham essa preferência imediatamente.',
            playTitle: 'Primeiros passos',
            playText: 'Se for sua primeira vez no Zero, esse é o caminho mais rápido para começar:',
            playItems: [
                'Entre em uma sala pela lista principal ou cole um link direto na header.',
                'Use Favoritos e Amizades para voltar mais rápido para as mesmas rooms.',
                'Abra o menu lateral de Settings para centralizar atalhos, temas e ajustes.',
                'Seu nick, avatar e preferências ficam prontos para o próximo login.'
            ],
            perfTitle: 'Ajustes que importam',
            perfText: 'O cliente foi organizado para deixar as opções mais úteis sempre perto da partida:',
            perfItems: [
                { title: 'Rendimento', desc: 'Ative otimizações visuais e reduza ruído quando quiser mais estabilidade.' },
                { title: 'Resolución', desc: 'Configure resolução estirada e presets sem misturar com o vídeo padrão.' },
                { title: 'Atalhos', desc: 'Use binds para avatar, extrapolation e outros fluxos rápidos durante o jogo.' },
                { title: 'Temas e visuais', desc: 'Troque aparência, contraste e elementos do cliente em poucos cliques.' }
            ],
            perfFooter: 'A ideia é simples: menos menu perdido e mais controle real sobre como você joga.',
            proTitle: 'Perfil Pro',
            proText: 'Quando o perfil Pro está ativo, o Zero trata a personalização como parte da identidade do jogador:',
            proItems: [
                { title: 'Banner de perfil', desc: 'Banners aparecem em listas e rooms com visual mais limpo.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/></svg>' },
                { title: 'Nick e fonte', desc: 'Combine cores, gradientes e fontes para deixar o perfil reconhecível.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L10 4"/><path d="M14 20l6-16"/><path d="M6 14h12"/></svg>' },
                { title: 'Verificado personalizado', desc: 'O badge pode seguir a estética do jogador e não só um padrão fixo.', icon: '<svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="currentColor"/><path d="M15 9l-4.5 4.5L8 11" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
                { title: 'Perfil consistente', desc: 'A mesma identidade visual se replica melhor entre preview, rooms e amistades.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>' }
            ],
            proFooter: 'O foco aqui é deixar o perfil com cara de perfil, não só liberar um selo.',
            teamTitle: 'Equipe e comunidade',
            teamText: 'O Zero também foi pensado para quem joga junto. O sistema de equipe ajuda a organizar identidade visual, membros e presença no chat.',
            teamItems: [
                { title: 'Monte seu grupo', desc: 'Crie uma equipe com nome, sigla e logo próprios.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
                { title: 'Convites mais rápidos', desc: 'Use usernames do Discord para montar o elenco sem perder tempo.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>' },
                { title: 'Presença visual', desc: 'Logo, badges e perfis aparecem melhor integrados à experiência social.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' }
            ],
            teamFooter: 'Se você joga sempre com os mesmos, esse painel vira uma das áreas mais úteis do cliente.',
            thanksTitle: 'Créditos',
            thanksText: 'O HaxBall Zero foi apresentado para ter identidade própria desde a primeira tela:',
            thanksItems: [
                { title: '<b>@ferro</b>', desc: 'Todas as visuais, direção da apresentação e identidade do HaxBall Zero foram feitas por @ferro.' },
                { title: '<b>Comunidade</b>', desc: 'Feedback, testes e ajustes do dia a dia ajudaram a moldar o cliente com mais clareza.' },
                { title: '<b>Zero</b>', desc: 'A proposta é continuar lapidando a experiência para parecer um cliente novo, e não uma cópia antiga.' }
            ],
            prev: 'Voltar',
            next: 'Continuar',
            start: 'Entrar no Zero',
            welcomePill: 'Boas-vindas',
            stepLabel: 'Passo',
            portuguese: 'Português',
            spanish: 'Español',
            english: 'English'
        },
        es: {
            welcomeTitle: 'HaxBall Zero',
            welcomeText: 'Estás entrando a <b>HaxBall Zero</b>.<br><br>Este cliente fue creado para llevar HaxBall a otro nivel, con más presencia visual, más identidad y una experiencia pensada para que el juego se sienta lo mejor posible.<br><br>En las próximas pantallas elegís idioma y conocés los paneles principales de Zero.',
            langTitle: 'Elegí tu idioma',
            langText: 'Seleccioná el idioma del cliente. El resto del tutorial y gran parte de la interfaz se adaptan a esa elección en el momento.',
            playTitle: 'Primeros pasos',
            playText: 'Si recién abrís Zero, este es el recorrido más útil para arrancar bien:',
            playItems: [
                'Entrá a una room desde la lista principal o pegá un link directo en la header.',
                'Usá Favoritos y Amistades para volver rápido a las mismas salas.',
                'Abrí el menú lateral de Settings para centralizar atajos, temas y ajustes.',
                'Tu nick, avatar y preferencias quedan listos para el próximo inicio.'
            ],
            perfTitle: 'Ajustes que sí sirven',
            perfText: 'Zero reorganiza el cliente para dejar a mano las opciones que más cambian la experiencia:',
            perfItems: [
                { title: 'Rendimiento', desc: 'Activá optimizaciones visuales y recortá ruido cuando necesites estabilidad.' },
                { title: 'Resolución', desc: 'Configurá resolución estirada y presets desde un panel separado y claro.' },
                { title: 'Atajos', desc: 'Usá binds para avatar, extrapolation y flujos rápidos durante la partida.' },
                { title: 'Temas y visuales', desc: 'Cambiá apariencia, contraste y elementos del cliente en pocos clics.' }
            ],
            perfFooter: 'La idea es simple: menos menú perdido y más control real sobre cómo jugás.',
            proTitle: 'Perfil Pro',
            proText: 'Cuando el perfil Pro está activo, Zero trata la personalización como parte de la identidad del jugador:',
            proItems: [
                { title: 'Banner de perfil', desc: 'Los banners aparecen mejor integrados en listas, amistades y rooms.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/></svg>' },
                { title: 'Nick y fuente', desc: 'Combiná colores, gradientes y tipografías para darle firma visual a tu perfil.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L10 4"/><path d="M14 20l6-16"/><path d="M6 14h12"/></svg>' },
                { title: 'Verificado personalizado', desc: 'El badge puede acompañar la estética del jugador y no quedarse en un solo estilo.', icon: '<svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="currentColor"/><path d="M15 9l-4.5 4.5L8 11" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
                { title: 'Perfil consistente', desc: 'La identidad visual se replica mejor entre preview, rooms y paneles sociales.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>' }
            ],
            proFooter: 'La idea acá es que el perfil se vea como perfil, no solo como un permiso más.',
            teamTitle: 'Equipo y comunidad',
            teamText: 'Zero también está pensado para jugar acompañado. El sistema de equipos ayuda a ordenar identidad visual, miembros y presencia en chat.',
            teamItems: [
                { title: 'Armá tu grupo', desc: 'Creá un equipo con nombre, sigla y logo propios.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
                { title: 'Invitaciones rápidas', desc: 'Usá usernames de Discord para sumar jugadores sin vueltas.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>' },
                { title: 'Presencia visual', desc: 'Logo, badges y perfiles quedan mejor integrados a la parte social del cliente.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' }
            ],
            teamFooter: 'Si jugás siempre con los mismos, este panel pasa a ser una de las áreas más útiles del cliente.',
            thanksTitle: 'Créditos',
            thanksText: 'HaxBall Zero fue presentado para tener identidad propia desde el primer segundo:',
            thanksItems: [
                { title: '<b>@ferro</b>', desc: 'Todas las visuales, dirección de la presentación e identidad del HaxBall Zero fueron hechas por @ferro.' },
                { title: '<b>Comunidad</b>', desc: 'El feedback, las pruebas y los ajustes diarios ayudaron a moldear un cliente más claro.' },
                { title: '<b>Zero</b>', desc: 'La idea es seguir empujando una experiencia que se sienta nueva, y no una réplica vieja.' }
            ],
            prev: 'Atrás',
            next: 'Seguir',
            start: 'Entrar a Zero',
            welcomePill: 'Bienvenida',
            stepLabel: 'Paso',
            portuguese: 'Português',
            spanish: 'Español',
            english: 'English'
        },
        en: {
            welcomeTitle: 'HaxBall Zero',
            welcomeText: 'You are entering <b>HaxBall Zero</b>.<br><br>This client was created to push HaxBall to a higher level, with stronger visuals, more identity, and an experience built to make the game feel at its best.<br><br>On the next screens you can choose your language and get familiar with Zero main panels.',
            langTitle: 'Choose your language',
            langText: 'Pick the client language. The rest of this tutorial and a large part of the interface will follow that choice immediately.',
            playTitle: 'Getting started',
            playText: 'If this is your first time opening Zero, this is the fastest way to get comfortable:',
            playItems: [
                'Join a room from the main list or paste a direct room link in the header.',
                'Use Favorites and Friends to get back to the same rooms faster.',
                'Open the Settings sidebar to centralize shortcuts, themes, and gameplay tweaks.',
                'Your nick, avatar, and preferences stay ready for the next launch.'
            ],
            perfTitle: 'Useful adjustments',
            perfText: 'Zero reorganizes the client so the options that matter most stay close to the match:',
            perfItems: [
                { title: 'Performance', desc: 'Enable visual optimizations and reduce noise when you want more stability.' },
                { title: 'Resolution', desc: 'Configure stretched resolution and presets from a separate, cleaner panel.' },
                { title: 'Shortcuts', desc: 'Use binds for avatar swaps, extrapolation, and other fast in-game actions.' },
                { title: 'Themes and visuals', desc: 'Change appearance, contrast, and client elements in just a few clicks.' }
            ],
            perfFooter: 'The goal is simple: less menu friction, more real control over how you play.',
            proTitle: 'Pro profile',
            proText: 'When Pro is active, Zero treats customization as part of a player identity, not just a permission:',
            proItems: [
                { title: 'Profile banner', desc: 'Banners show up more cleanly across lists, friends, and rooms.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/></svg>' },
                { title: 'Nick and font', desc: 'Mix colors, gradients, and fonts to give your profile a distinct signature.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L10 4"/><path d="M14 20l6-16"/><path d="M6 14h12"/></svg>' },
                { title: 'Custom verified badge', desc: 'The badge can match the player style instead of staying locked to one preset.', icon: '<svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M20.4 11c0-1.2-.7-2.3-1.8-2.9.4-1.2.2-2.5-.7-3.4-.9-.9-2.2-1.1-3.4-.7C14 2.9 12.9 2.2 11.7 2.2c-1.2 0-2.3.7-2.9 1.8-1.2-.4-2.5-.2-3.4.7-.9.9-1.1 2.2-.7 3.4C3.6 8.7 2.9 9.8 2.9 11c0 1.2.7 2.3 1.8 2.9-.4 1.2-.2 2.5.7 3.4.9.9 2.2 1.1 3.4.7.6 1.1 1.7 1.8 2.9 1.8 1.2 0 2.3-.7 2.9-1.8 1.2.4 2.5.2 3.4-.7.9-.9 1.1-2.2.7-3.4 1.1-.6 1.7-1.7 1.7-2.9z" fill="currentColor"/><path d="M15 9l-4.5 4.5L8 11" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
                { title: 'Consistent identity', desc: 'The same visual identity carries better across previews, rooms, and social panels.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>' }
            ],
            proFooter: 'The goal here is to make the profile feel like an actual profile, not just a status flag.',
            teamTitle: 'Team and community',
            teamText: 'Zero is also built for people who play together. The team system helps organize visual identity, members, and chat presence.',
            teamItems: [
                { title: 'Build your group', desc: 'Create a team with its own name, tag, and logo.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
                { title: 'Fast invites', desc: 'Use Discord usernames to bring people in without extra friction.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>' },
                { title: 'Visual presence', desc: 'Logos, badges, and profiles feel more integrated into the social side of the client.', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' }
            ],
            teamFooter: 'If you usually play with the same people, this quickly becomes one of the most useful panels in the client.',
            thanksTitle: 'Credits',
            thanksText: 'HaxBall Zero was presented to feel like its own thing from the first second:',
            thanksItems: [
                { title: '<b>@ferro</b>', desc: 'All visuals, presentation direction, and the identity of HaxBall Zero were made by @ferro.' },
                { title: '<b>Community</b>', desc: 'Feedback, testing, and daily adjustments helped shape a clearer client.' },
                { title: '<b>Zero</b>', desc: 'The idea is to keep pushing an experience that feels new, not like an old replica.' }
            ],
            prev: 'Back',
            next: 'Continue',
            start: 'Enter Zero',
            welcomePill: 'Welcome',
            stepLabel: 'Step',
            portuguese: 'Português',
            spanish: 'Español',
            english: 'English'
        }
    };

    function t(key) {
        var langPack = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
        return langPack[key] || TRANSLATIONS.es[key] || TRANSLATIONS.pt[key] || key;
    }

    function escapeAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function createListHTML(items, twoColumns) {
        function rowObject(item) {
            if (item.icon) {
                return (
                    '<div class="wc-li wc-li--ico">' +
                    '<div class="wc-li-ico">' +
                    item.icon +
                    '</div>' +
                    '<div>' +
                    '<p class="wc-li-h">' +
                    item.title +
                    '</p>' +
                    '<p class="wc-li-p">' +
                    item.desc +
                    '</p>' +
                    '</div></div>'
                );
            }
            return (
                '<div class="wc-li">' +
                '<p class="wc-li-h">' +
                item.title +
                '</p>' +
                '<p class="wc-li-p">' +
                item.desc +
                '</p></div>'
            );
        }
        function rowString(item) {
            return '<div class="wc-li"><p class="wc-li-p">' + item + '</p></div>';
        }
        if (twoColumns) {
            var half = Math.ceil(items.length / 2);
            var col1 = items.slice(0, half);
            var col2 = items.slice(half);
            function renderCol(colItems) {
                var h = '<div class="wc-col">';
                for (var i = 0; i < colItems.length; i++) {
                    var item = colItems[i];
                    h += typeof item === 'object' ? rowObject(item) : rowString(item);
                }
                h += '</div>';
                return h;
            }
            return '<div class="wc-cols">' + renderCol(col1) + renderCol(col2) + '</div>';
        }
        var html = '<div class="wc-stack">';
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            html += typeof item === 'object' ? rowObject(item) : rowString(item);
        }
        html += '</div>';
        return html;
    }

    function getPerfPreview() {
        return (
            '<aside class="wc-side" aria-hidden="true">' +
            '<div class="wc-side-cap">Preview</div>' +
            '<div class="wc-pv-row">' +
            '<span class="wc-pv-dot wc-pv-dot--on"></span>' +
            '<span class="wc-pv-dot wc-pv-dot--on"></span>' +
            '<span class="wc-pv-dot"></span>' +
            '</div>' +
            '<p class="wc-side-hint">Settings</p>' +
            '</aside>'
        );
    }

    function getProPreview() {
        return (
            '<aside class="wc-side" aria-hidden="true">' +
            '<div class="wc-side-cap">Preview</div>' +
            '<div class="wc-side-fake">' +
            '<span class="wc-fake-nick">zero</span>' +
            '<span class="wc-fake-badge">PRO</span>' +
            '</div>' +
            '</aside>'
        );
    }

    function getTeamPreview() {
        return (
            '<aside class="wc-side" aria-hidden="true">' +
            '<div class="wc-side-cap">Preview</div>' +
            '<div class="wc-side-fake wc-side-fake--team">' +
            '<span class="wc-fake-team">Team</span>' +
            '<span class="wc-fake-live"></span>' +
            '</div>' +
            '</aside>'
        );
    }

    function getPages() {
        return [
            {
                title: t('welcomeTitle'),
                content: t('welcomeText'),
                type: 'text'
            },
            {
                title: t('langTitle'),
                content: t('langText'),
                type: 'language'
            },
            {
                title: t('playTitle'),
                content: t('playText') + createListHTML(t('playItems'), false),
                type: 'text'
            },
            {
                title: t('perfTitle'),
                content: t('perfText') + createListHTML(t('perfItems'), false) + '<div class="wc-note">' + t('perfFooter') + '</div>',
                type: 'perf'
            },
            {
                title: t('proTitle'),
                content: t('proText') + createListHTML(t('proItems'), false) + '<div class="wc-note">' + t('proFooter') + '</div>',
                type: 'pro'
            },
            {
                title: t('teamTitle'),
                content: t('teamText') + createListHTML(t('teamItems'), false) + '<div class="wc-note">' + t('teamFooter') + '</div>',
                type: 'team'
            },
            {
                title: t('thanksTitle'),
                content: t('thanksText') + createListHTML(t('thanksItems'), false),
                type: 'text'
            }
        ];
    }

    function injectWelcomeFontsOnce() {
        try {
            if (document.getElementById('wc-welcome-fonts')) return;
            var pre1 = document.createElement('link');
            pre1.id = 'wc-welcome-fonts';
            pre1.rel = 'preconnect';
            pre1.href = 'https://fonts.googleapis.com';
            var pre2 = document.createElement('link');
            pre2.rel = 'preconnect';
            pre2.href = 'https://fonts.gstatic.com';
            pre2.crossOrigin = 'anonymous';
            var css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href =
                'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
            var head = document.head || document.documentElement;
            head.appendChild(pre1);
            head.appendChild(pre2);
            head.appendChild(css);
        } catch (eFonts) {}
    }

    function injectWelcomeStylesOnce() {
        try {
            if (document.getElementById('wc-welcome-styles')) return;
            var st = document.createElement('style');
            st.id = 'wc-welcome-styles';
            st.textContent =
                '*{box-sizing:border-box}' +
                '@keyframes wcFade{from{opacity:.55}to{opacity:1}}' +
                '#welcome-popup-overlay.wc-root{position:fixed;inset:0;z-index:10002;display:flex;flex-direction:column;font-family:Space Grotesk,system-ui,Segoe UI,sans-serif;color:var(--theme-text-secondary,#888);-webkit-font-smoothing:antialiased;background:var(--theme-bg-primary,#141414);opacity:0;transition:opacity .38s ease}' +
                '#welcome-popup-overlay.wc-root.wc-root--in{opacity:1}' +
                '#welcome-popup.wc-panel{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;max-width:100%;background:inherit}' +
                '.wc-prog{height:3px;background:var(--theme-bg-tertiary,#272727);flex-shrink:0;width:100%}' +
                '.wc-prog-fill{height:100%;background:#22c55e;width:0;transition:width .45s cubic-bezier(.22,1,.36,1)}' +
                '.wc-head{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 22px;border-bottom:1px solid var(--theme-border,#232323);background:var(--theme-bg-primary,#141414)}' +
                '.wc-head-brand{display:flex;align-items:center;gap:10px;min-width:0}' +
                '.wc-head-brand img{height:22px;width:auto;opacity:.88}' +
                '.wc-head-brand span{font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--theme-text-secondary,#888)}' +
                '.wc-head-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}' +
                '.wc-tag{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#4ade80;padding:3px 9px;border:1px solid rgba(74,222,128,.28);border-radius:999px;background:rgba(34,197,94,.1)}' +
                '.wc-meta-bit{font-size:11px;color:var(--theme-text-muted,#666)}' +
                '.wc-main{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:28px 22px 32px;background:var(--theme-bg-primary,#141414);scrollbar-width:thin;scrollbar-color:var(--theme-scrollbar-thumb,#555) var(--theme-scrollbar-track,#1a1a1a)}' +
                '.wc-main::-webkit-scrollbar{width:10px}' +
                '.wc-main::-webkit-scrollbar-track{background:var(--theme-scrollbar-track,#1a1a1a);border-radius:999px;margin:4px 0}' +
                '.wc-main::-webkit-scrollbar-thumb{background:var(--theme-scrollbar-thumb,#555);border-radius:999px;border:2px solid transparent;background-clip:padding-box}' +
                '.wc-main::-webkit-scrollbar-thumb:hover{background:var(--theme-scrollbar-thumb-hover,#666)}' +
                '.wc-inner{max-width:720px;margin:0 auto}' +
                '.wc-h1{margin:0 0 22px;font-size:clamp(1.5rem,4.2vw,2.1rem);font-weight:600;letter-spacing:-.03em;line-height:1.12;color:var(--theme-text-primary,#fff)}' +
                '.wc-stage.wc-stage--next,.wc-stage.wc-stage--prev,.wc-stage.wc-stage--none{animation:wcFade .22s ease both}' +
                '.wc-split{display:grid;gap:22px;grid-template-columns:1fr}' +
                '@media(min-width:760px){.wc-split{grid-template-columns:1fr 200px;align-items:start}}' +
                '.wc-split-side{position:relative}' +
                '.wc-prose{font-size:14px;line-height:1.62;color:var(--theme-text-secondary,#888)}' +
                '.wc-prose b{color:var(--theme-text-primary,#fff);font-weight:600}' +
                '.wc-note{margin-top:18px;padding-top:16px;border-top:1px solid var(--theme-border,#232323);font-size:12px;color:var(--theme-text-muted,#666);line-height:1.5}' +
                '.wc-lang-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}' +
                '.wc-lang-chip{min-width:88px;padding:12px 20px;margin:0;font:inherit;font-size:13px;font-weight:600;letter-spacing:.06em;border-radius:10px;cursor:pointer;' +
                'color:var(--theme-text-secondary,#888);background:var(--theme-bg-secondary,#1a1a1a);border:1px solid var(--theme-border,#333);' +
                'box-shadow:0 1px 0 rgba(255,255,255,.04) inset;transition:color .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease,transform .12s ease}' +
                '.wc-lang-chip:hover{color:var(--theme-text-primary,#fff);border-color:var(--theme-border-light,#444);background:var(--theme-bg-tertiary,#272727);box-shadow:0 0 0 1px rgba(255,255,255,.06) inset}' +
                '.wc-lang-chip:active{transform:scale(.98)}' +
                '.wc-lang-chip:focus{outline:none}' +
                '.wc-lang-chip:focus-visible{outline:2px solid #4ade80;outline-offset:2px}' +
                '.wc-lang-chip.wc-lang-on{color:#86efac;background:rgba(34,197,94,.14);border-color:rgba(74,222,128,.42);' +
                'box-shadow:0 0 0 1px rgba(34,197,94,.12) inset,0 6px 20px rgba(34,197,94,.12)}' +
                '.wc-lang-chip.wc-lang-on:hover{color:#bbf7d0;border-color:rgba(74,222,128,.55);background:rgba(34,197,94,.2)}' +
                '.wc-foot{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 22px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--theme-border,#232323);background:var(--theme-bg-primary,#141414)}' +
                '.wc-btn-ghost{background:transparent;border:none;color:var(--theme-text-secondary,#888);font:inherit;font-size:13px;font-weight:500;cursor:pointer;padding:12px 10px}' +
                '.wc-btn-ghost:hover:not(:disabled){color:var(--theme-text-primary,#fff)}' +
                '.wc-btn-ghost:disabled{opacity:.35;cursor:default}' +
                '.wc-btn-primary{border-radius:8px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid rgba(74,222,128,.4);background:rgba(34,197,94,.14);color:#4ade80;min-width:132px;transition:background .18s ease,border-color .18s ease,color .18s ease,transform .12s ease}' +
                '.wc-btn-primary:hover{background:rgba(34,197,94,.22);color:#86efac;border-color:rgba(74,222,128,.55)}' +
                '.wc-btn-primary:active{transform:scale(.985)}' +
                '.wc-stack{margin-top:4px}' +
                '.wc-li{margin-top:16px;padding-top:16px;border-top:1px solid var(--theme-border,#232323)}' +
                '.wc-li:first-child{margin-top:0;padding-top:0;border-top:none}' +
                '.wc-li-h{margin:0 0 6px;font-size:13px;font-weight:600;color:var(--theme-text-primary,#fff)}' +
                '.wc-li-p{margin:0;font-size:13px;line-height:1.5;color:var(--theme-text-secondary,#888)}' +
                '.wc-li--ico{display:flex;gap:14px}' +
                '.wc-li-ico{flex-shrink:0;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--theme-bg-tertiary,#272727);border:1px solid var(--theme-border-light,#333);color:var(--theme-text-secondary,#888)}' +
                '.wc-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px 22px;margin-top:8px}' +
                '.wc-col{min-width:0;display:flex;flex-direction:column}' +
                '@media(max-width:520px){.wc-cols{grid-template-columns:1fr}}' +
                '.wc-side{border:1px solid var(--theme-border,#232323);border-radius:10px;padding:14px;background:var(--theme-bg-secondary,#1a1a1a)}' +
                '.wc-side-cap{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--theme-text-muted,#666);margin-bottom:10px}' +
                '.wc-pv-row{display:flex;gap:6px;align-items:center}' +
                '.wc-pv-dot{width:8px;height:8px;border-radius:50%;background:var(--theme-border,#232323)}' +
                '.wc-pv-dot--on{background:#22c55e}' +
                '.wc-side-hint{margin:10px 0 0;font-size:11px;color:var(--theme-text-muted,#666)}' +
                '.wc-side-fake{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:8px;background:var(--theme-bg-tertiary,#272727);border:1px solid var(--theme-border-light,#333)}' +
                '.wc-side-fake--team{align-items:center}' +
                '.wc-fake-nick{font-weight:600;color:var(--theme-text-primary,#fff);font-size:13px}' +
                '.wc-fake-badge{font-size:9px;font-weight:700;color:#4ade80;padding:2px 7px;border-radius:999px;border:1px solid rgba(74,222,128,.35);background:rgba(34,197,94,.12)}' +
                '.wc-fake-team{font-weight:600;font-size:12px;color:var(--theme-text-primary,#fff)}' +
                '.wc-fake-live{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px rgba(34,197,94,.4)}';
            (document.head || document.documentElement).appendChild(st);
        } catch (eSt) {}
    }

    function createWelcomePopup() {
        if (document.getElementById('welcome-popup-overlay')) return;
        if (isNicknameViewOpen()) return;

        injectWelcomeFontsOnce();
        injectWelcomeStylesOnce();

        var overlay = document.createElement('div');
        overlay.id = 'welcome-popup-overlay';
        overlay.className = 'wc-root';

        var popup = document.createElement('div');
        popup.id = 'welcome-popup';
        popup.className = 'wc-panel';

        var prevRendered = -1;

        function renderPage(index) {
            var pages = getPages();
            var page = pages[index];
            var isFirst = index === 0;
            var isLast = index === pages.length - 1;

            var anim = 'none';
            if (prevRendered >= 0 && prevRendered !== index) {
                anim = index > prevRendered ? 'next' : 'prev';
            }
            prevRendered = index;

            var pct = pages.length ? Math.round(((index + 1) / pages.length) * 100) : 100;

            var contentHTML = '';
            var previewHTML = '';

            if (page.type === 'language') {
                contentHTML =
                    '<div class="wc-prose">' +
                    page.content +
                    '</div>' +
                    '<div class="wc-lang-row" role="group" aria-label="' +
                    escapeAttr(t('langTitle')) +
                    '">' +
                    '<button type="button" id="lang-es" class="wc-lang-chip' +
                    (currentLang === 'es' ? ' wc-lang-on' : '') +
                    '" title="' +
                    escapeAttr(t('spanish')) +
                    '">ES</button>' +
                    '<button type="button" id="lang-pt" class="wc-lang-chip' +
                    (currentLang === 'pt' ? ' wc-lang-on' : '') +
                    '" title="' +
                    escapeAttr(t('portuguese')) +
                    '">PT</button>' +
                    '<button type="button" id="lang-en" class="wc-lang-chip' +
                    (currentLang === 'en' ? ' wc-lang-on' : '') +
                    '" title="' +
                    escapeAttr(t('english')) +
                    '">EN</button>' +
                    '</div>';
            } else if (page.type === 'perf') {
                contentHTML = '<div class="wc-prose">' + page.content + '</div>';
                previewHTML = getPerfPreview();
            } else if (page.type === 'team') {
                contentHTML = '<div class="wc-prose">' + page.content + '</div>';
                previewHTML = getTeamPreview();
            } else if (page.type === 'pro') {
                contentHTML = '<div class="wc-prose">' + page.content + '</div>';
                previewHTML = getProPreview();
            } else {
                contentHTML = '<div class="wc-prose">' + page.content + '</div>';
            }

            var stageBlock =
                '<div class="wc-stage wc-stage--' +
                anim +
                '">' +
                contentHTML +
                '</div>';
            var bodyBlock = previewHTML
                ? '<div class="wc-split">' + stageBlock + '<div class="wc-split-side">' + previewHTML + '</div></div>'
                : stageBlock;

            popup.innerHTML =
                '<div class="wc-prog" role="progressbar" aria-valuenow="' +
                (index + 1) +
                '" aria-valuemax="' +
                pages.length +
                '"><div class="wc-prog-fill" style="width:' +
                pct +
                '%"></div></div>' +
                '<header class="wc-head">' +
                '<div class="wc-head-brand">' +
                '<img src="https://i.ibb.co/YF3Ln83r/logo-haxballapp.png" alt=""/>' +
                '<span>HaxBall Zero</span>' +
                '</div>' +
                '<div class="wc-head-meta">' +
                '<span class="wc-tag">' +
                t('welcomePill') +
                '</span>' +
                '<span class="wc-meta-bit">v' +
                CURRENT_VERSION +
                '</span>' +
                '<span class="wc-meta-bit">' +
                (index + 1) +
                ' / ' +
                pages.length +
                '</span>' +
                '</div>' +
                '</header>' +
                '<main class="wc-main">' +
                '<div class="wc-inner">' +
                '<h1 class="wc-h1">' +
                page.title +
                '</h1>' +
                bodyBlock +
                '</div></main>' +
                '<footer class="wc-foot">' +
                '<button type="button" id="welcome-prev" class="wc-btn-ghost"' +
                (isFirst ? ' disabled' : '') +
                '>' +
                t('prev') +
                '</button>' +
                '<button type="button" id="welcome-next" class="wc-btn-primary">' +
                (isLast ? t('start') : t('next')) +
                '</button>' +
                '</footer>';

            popup.querySelector('#welcome-prev').onclick = function() {
                if (index > 0) {
                    currentPage--;
                    renderPage(currentPage);
                }
            };

            popup.querySelector('#welcome-next').onclick = function() {
                if (isLast) {
                    closeWelcomePopup();
                } else {
                    currentPage++;
                    renderPage(currentPage);
                }
            };

            if (page.type === 'language') {
                popup.querySelector('#lang-es').onclick = function() {
                    if (currentLang !== 'es') {
                        currentLang = 'es';
                        localStorage.setItem('haxball_language', 'es');
                        currentPage = 0;
                        prevRendered = -1;
                        renderPage(currentPage);
                    }
                };
                popup.querySelector('#lang-pt').onclick = function() {
                    if (currentLang !== 'pt') {
                        currentLang = 'pt';
                        localStorage.setItem('haxball_language', 'pt');
                        currentPage = 0;
                        prevRendered = -1;
                        renderPage(currentPage);
                    }
                };
                popup.querySelector('#lang-en').onclick = function() {
                    if (currentLang !== 'en') {
                        currentLang = 'en';
                        localStorage.setItem('haxball_language', 'en');
                        currentPage = 0;
                        prevRendered = -1;
                        renderPage(currentPage);
                    }
                };
            }
        }

        renderPage(0);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        requestAnimationFrame(function() {
            overlay.classList.add('wc-root--in');
        });
    }

    function closeWelcomePopup() {
        var overlay = document.getElementById('welcome-popup-overlay');
        if (overlay) overlay.remove();
        // Marca como visto ao fechar
        localStorage.setItem('haxball_welcome_seen', WELCOME_FLOW_VERSION);
    }

    window.__showWelcomePopup = createWelcomePopup;
    window.__closeWelcomePopup = closeWelcomePopup;
    /** Reutilizar estilos wc-* (progreso, cabecera, botones) en otros flujos, p. ej. creación de equipo. */
    window.__hxdInjectWelcomeStyles = injectWelcomeStylesOnce;

    function isNicknameViewOpen() {
        try {
            return !!document.querySelector('.choose-nickname-view');
        } catch (e) {
            return false;
        }
    }

    function showWelcomeWhenReady() {
        if (!isNicknameViewOpen()) {
            createWelcomePopup();
            return;
        }
        var observer = new MutationObserver(function() {
            if (isNicknameViewOpen()) return;
            observer.disconnect();
            setTimeout(createWelcomePopup, 300);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Mostra o popup ao carregar (apenas se não viu essa versão)
    Injector.waitForElement('body').then(function() {
        var seenVersion = localStorage.getItem('haxball_welcome_seen');
        if (seenVersion !== WELCOME_FLOW_VERSION) {
            localStorage.setItem('haxball_welcome_seen', WELCOME_FLOW_VERSION);
        }
    });
})();
