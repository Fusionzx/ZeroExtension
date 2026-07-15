// ============================================
// TRANSLATE - Sistema de tradução multi-idioma
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;

    // Idiomas disponíveis: 'es' (espanhol), 'pt' (português), 'en' (inglês)
    var LANG_KEY = 'haxball_language';
    
    // Obtém idioma salvo ou detecta automaticamente
    function getLanguage() {
        var saved = localStorage.getItem(LANG_KEY);
        if (saved && (saved === 'pt' || saved === 'es' || saved === 'en')) return saved;
        
        // Detecta pelo navegador
        var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.indexOf('es') === 0) return 'es';
        if (browserLang.indexOf('en') === 0) return 'en';
        if (browserLang.indexOf('pt') === 0) return 'pt';
        return 'es'; // Padrão: espanhol
    }

    function setLanguage(lang) {
        localStorage.setItem(LANG_KEY, lang);
        window.__haxLang = lang;
    }

    var currentLang = getLanguage();
    window.__haxLang = currentLang;
    window.__haxSetLanguage = setLanguage;
    window.__haxGetLanguage = getLanguage;

    // Traduções: chave base -> { pt: 'português', es: 'español' }
    var TRANSLATIONS = {
        // === HAXBALL ORIGINAL ===
        'Name': { pt: 'Nome', es: 'Nombre' },
        'Players': { pt: 'Jogadores', es: 'Jugadores' },
        'Distance': { pt: 'País', es: 'País' },
        'Pass': { pt: 'Senha', es: 'Contraseña' },
        'Room list': { pt: 'Lista de Salas', es: 'Lista de Salas' },
        'Refresh': { pt: 'Atualizar', es: 'Actualizar' },
        'Ok': { pt: 'Ok', es: 'Ok' },
        'Cancel': { pt: 'Cancelar', es: 'Cancelar' },
        'Create Room': { pt: 'Criar sala', es: 'Crear sala' },
        'Join Room': { pt: 'Entrar', es: 'Entrar' },
        'Settings': { pt: 'Configurações', es: 'Configuración' },
        'Leave': { pt: 'Sair', es: 'Salir' },
        'Replays': { pt: 'Replays', es: 'Replays' },
        'Room name': { pt: 'Nome da sala', es: 'Nombre de la sala' },
        'Password': { pt: 'Senha', es: 'Contraseña' },
        'Max players': { pt: 'Máx. jogadores', es: 'Máx. jugadores' },
        'Public': { pt: 'Pública', es: 'Pública' },
        'Unlock': { pt: 'Desbloquear', es: 'Desbloquear' },
        'Lock': { pt: 'Bloquear', es: 'Bloquear' },
        'Change': { pt: 'Alterar', es: 'Cambiar' },
        'Change Location': { pt: 'Alterar localização', es: 'Cambiar ubicación', en: 'Change Location' },
        'Detected location': { pt: 'Localização detectada', es: 'Ubicación detectada', en: 'Detected location' },
        'Location override': { pt: 'Localização substituta', es: 'Ubicación personalizada', en: 'Location override' },
        'Alterar bandeira': { pt: 'Alterar bandeira', es: 'Cambiar bandera', en: 'Change flag' },
        'Remover bandeira': { pt: 'Remover bandeira', es: 'Quitar bandera', en: 'Remove flag' },
        'Close': { pt: 'Fechar', es: 'Cerrar' },
        'Sound': { pt: 'Som', es: 'Sonido' },
        'Video': { pt: 'Vídeo', es: 'Video' },
        'Input': { pt: 'Teclas', es: 'Teclas' },
        'Misc': { pt: 'Outros', es: 'Otros' },

        // === EXTENSÃO - HEADER ===
        'Cole o link da sala aqui...': { pt: 'Cole o link da sala aqui...', es: 'Pega el enlace de la sala aquí...' },
        'Modo Anônimo': { pt: 'Modo Anônimo', es: 'Modo Anónimo' },
        'Esconder header': { pt: 'Esconder header', es: 'Ocultar header' },

        // === EXTENSÃO - ROOMLIST ===
        'Pesquisar salas...': { pt: 'Pesquisar salas...', es: 'Buscar salas...' },
        'Atualizar': { pt: 'Atualizar', es: 'Actualizar' },
        'Entrar': { pt: 'Entrar', es: 'Entrar' },
        'Criar Sala': { pt: 'Criar Sala', es: 'Crear Sala' },
        'Favoritos': { pt: 'Favoritos', es: 'Favoritos' },
        'Amizades': { pt: 'Amizades', es: 'Amistades' },
        'Equipe': { pt: 'Equipe', es: 'Equipo' },
        'Configurações': { pt: 'Configurações', es: 'Configuración' },
        'Voltar': { pt: 'Voltar', es: 'Volver' },
        'Fixar no Topo': { pt: 'Fixar no Topo', es: 'Fijar Arriba' },
        'Desafixar Sala': { pt: 'Desafixar Sala', es: 'Desfijar Sala' },
        'Adicionar aos Favoritos': { pt: 'Adicionar aos Favoritos', es: 'Añadir a Favoritos' },
        'Remover dos Favoritos': { pt: 'Remover dos Favoritos', es: 'Quitar de Favoritos' },
        'Todos os países': { pt: 'Todos os países', es: 'Todos los países' },
        'Limpar filtro': { pt: 'Limpar filtro', es: 'Limpiar filtro' },
        'Mi Perfil': { pt: 'Pro', es: 'Pro', en: 'Pro' },
        'Perfil HaxBall Zero': { pt: 'Perfil HaxBall Zero', es: 'Perfil HaxBall Zero', en: 'HaxBall Zero Profile' },
        'Cuenta conectada': { pt: 'Conta conectada', es: 'Cuenta conectada', en: 'Connected account' },
        'Cuenta local': { pt: 'Conta local', es: 'Cuenta local', en: 'Local account' },
        'Nick en juego': { pt: 'Nick no jogo', es: 'Nick en juego', en: 'In-game nick' },
        'ID de Discord': { pt: 'ID do Discord', es: 'ID de Discord', en: 'Discord ID' },
        'Plan': { pt: 'Plano', es: 'Plan', en: 'Plan' },
        'Sin equipo': { pt: 'Sem equipe', es: 'Sin equipo', en: 'No team' },
        'Visuales': { pt: 'Visuais', es: 'Visuales', en: 'Visuals' },
        'Abrir amigos': { pt: 'Abrir amigos', es: 'Abrir amigos', en: 'Open friends' },
        'Abrir equipo': { pt: 'Abrir equipe', es: 'Abrir equipo', en: 'Open team' },
        'No se pudo cargar el perfil.': { pt: 'Não foi possível carregar o perfil.', es: 'No se pudo cargar el perfil.', en: 'Could not load the profile.' },
        'Camiseta': { pt: 'Camisa', es: 'Camiseta', en: 'Jersey' },
        'Theme seg jerseys': { pt: 'Camisas', es: 'Camisetas', en: 'Jerseys' },
        'Jersey local intro': {
            pt: 'Personalize as camisas apenas na sua tela, sem precisar de admin. Cole um comando /colors completo ou ajuste as cores abaixo.',
            es: 'Personalizá las camisetas solo en tu pantalla, sin necesitar admin. Pegá un comando /colors completo o ajustá los colores abajo.',
            en: 'Customize jerseys only on your screen, without admin. Paste a full /colors command or adjust the colours below.'
        },
        'Jersey local enabled': { pt: 'Ativar camisas locais', es: 'Activar camisetas locales', en: 'Enable local jerseys' },
        'Jersey local scope self': { pt: 'Só eu', es: 'Solo yo', en: 'Only me' },
        'Jersey local scope team': { pt: 'Meu time', es: 'Mi equipo', en: 'My team' },
        'Jersey local scope all': { pt: 'Red + Blue', es: 'Rojo + Azul', en: 'Red + Blue' },
        'Jersey local swap': { pt: 'Inverter Vermelho e Azul', es: 'Intercambiar Rojo y Azul', en: 'Swap Red and Blue' },
        'Jersey local swapped': { pt: 'Camisas invertidas.', es: 'Camisetas intercambiadas.', en: 'Jerseys swapped.' },
        'Manter meu avatar': { pt: 'Manter meu avatar', es: 'Mantener mi avatar', en: 'Keep my avatar' },
        'Mantém seu avatar original mesmo que a sala tente alterá-lo.': { pt: 'Mantém seu avatar original mesmo que a sala tente alterá-lo.', es: 'Conserva tu avatar original aunque la sala intente cambiarlo.', en: 'Keeps your original avatar even if the room tries to change it.' },
        'Jersey local use side': { pt: 'Usar', es: 'Usar', en: 'Use' },
        'Jersey local paste hint': { pt: 'Cole /colors aqui', es: 'Pegá /colors acá', en: 'Paste /colors here' },
        'Jersey local command required': { pt: 'Cole um comando que comece com /colors.', es: 'Pegá un comando que empiece con /colors.', en: 'Paste a command beginning with /colors.' },
        'Jersey local side invalid': { pt: 'O comando deve usar red ou blue.', es: 'El comando debe usar red o blue.', en: 'The command must use red or blue.' },
        'Jersey local command format': { pt: 'Formato: /colors red|blue ângulo textoHex cor1 [cor2] [cor3].', es: 'Formato: /colors red|blue ángulo textoHex color1 [color2] [color3].', en: 'Format: /colors red|blue angle textHex colour1 [colour2] [colour3].' },
        'Jersey local angle invalid': { pt: 'O ângulo deve ficar entre 0 e 360.', es: 'El ángulo debe estar entre 0 y 360.', en: 'The angle must be between 0 and 360.' },
        'Jersey local hex invalid': { pt: 'Use cores hexadecimais com 6 dígitos.', es: 'Usá colores hexadecimales de 6 dígitos.', en: 'Use six-digit hexadecimal colours.' },
        'Jersey local saved': { pt: 'Camisa salva e aplicada localmente.', es: 'Camiseta guardada y aplicada localmente.', en: 'Jersey saved and applied locally.' },
        'Jersey local reset': { pt: 'Configuração do lado removida.', es: 'Configuración del lado eliminada.', en: 'Side configuration removed.' },
        'Jersey local command accepted': { pt: 'Comando aceito e aplicado localmente.', es: 'Comando aceptado y aplicado localmente.', en: 'Command accepted and applied locally.' },
        'Jersey titulo panel': { pt: 'Camisa HaxBall', es: 'Camiseta HaxBall', en: 'HaxBall jersey' },
        'Jersey hub kicker': {
            pt: '/colors · HaxBall Zero',
            es: '/colors · HaxBall Zero',
            en: '/colors · HaxBall Zero'
        },
        'Jersey titulo hub': {
            pt: 'Editor visual',
            es: 'Editor visual de camiseta',
            en: 'Visual jersey editor'
        },
        'Jersey meta rojo': { pt: 'Lado na sala: vermelho', es: 'Bando en la sala: rojo', en: 'Side in room: red' },
        'Jersey meta azul': { pt: 'Lado na sala: azul', es: 'Bando en la sala: azul', en: 'Side in room: blue' },
        'Jersey tm seccion ayuda': { pt: 'Resumo', es: 'Instrucciones', en: 'How it works' },
        'Jersey bando en sala': {
            pt: 'Equipo atribuído no mapa',
            es: 'Equipo en este mapa',
            en: 'Team on this map'
        },
        'Jersey rayas titulo tm': { pt: 'Listras', es: 'Rayas', en: 'Stripes' },
        'Jersey avatar seccion tm': { pt: 'Avatar', es: 'Avatar', en: 'Avatar' },
        'Jersey comando tm': { pt: 'Comando', es: 'Comando', en: 'Command' },
        'Jersey persist tm': { pt: 'Guardar localmente', es: 'Guardar en el dispositivo', en: 'Save on device' },
        'Jersey import tm': { pt: 'Importar', es: 'Importar backup', en: 'Import backup' },
        'Jersey ayuda colores': {
            pt: 'Monte o comando /colors do HaxBall: lado (vermelho ou azul), ângulo, cor principal e até 3 listras opcionais. Em seguida use «Aplicar na sala» com o chat aberto dentro de um jogo.',
            es: 'Arma el comando /colors de HaxBall: bando (rojo o azul), ángulo, color principal y hasta 3 rayas opcionales. Luego pulsa «Aplicar en sala» con el chat disponible dentro de una partida.',
            en: 'Build HaxBall’s /colors command: side (red or blue), angle, base colour and up to 3 optional stripes. Then hit “Apply in room” while the chat input is available in-game.'
        },
        'Jersey lado': { pt: 'Equipe na sala', es: 'Equipo en la sala', en: 'Side in room' },
        'Jersey equipo rojo': { pt: 'Vermelho', es: 'Rojo', en: 'Red' },
        'Jersey equipo azul': { pt: 'Azul', es: 'Azul', en: 'Blue' },
        'Jersey ángulo': { pt: 'Ângulo do padrão', es: 'Ángulo del patrón', en: 'Pattern angle' },
        'Jersey color principal': { pt: 'Cor principal', es: 'Color principal', en: 'Base colour' },
        'Jersey restaurar defecto sala': { pt: 'Restaurar padrões da sala', es: 'Restaurar colores por defecto de la sala', en: 'Reset to room defaults' },
        'Jersey rayas opcionales': { pt: 'Listras opcionais (hex #RRGGBB)', es: 'Rayas opcionales (hex #RRGGBB)', en: 'Optional stripes (hex #RRGGBB)' },
        'Jersey añadir rayo': { pt: '+ listra', es: '+ añadir rayo', en: '+ add stripe' },
        'Jersey emoji avatar': { pt: 'Avatar (emoji opcional)', es: 'Avatar (emoji opcional)', en: 'Avatar (optional emoji)' },
        'Jersey aplicar en sala': { pt: 'Aplicar na sala', es: 'Aplicar en sala', en: 'Apply in room' },
        'Jersey solo avatar': { pt: 'Só emoji', es: 'Solo avatar', en: 'Avatar only' },
        'Jersey copiar comando': { pt: 'Copiar comando', es: 'Copiar comando', en: 'Copy command' },
        'Jersey guardar diseño': { pt: 'Salvar modelo', es: 'Guardar diseño', en: 'Save design' },
        'Jersey diseños guardados': { pt: 'Modelos salvos', es: 'Diseños guardados', en: 'Saved designs' },
        'Jersey sin diseños guardados': { pt: 'Nenhuma camisa salva ainda.', es: 'Aún no tienes camisetas guardadas.', en: 'No saved jerseys yet.' },
        'Jersey nombre diseño placeholder': {
            pt: 'preset (a-z/número, até 8)',
            es: 'nombre del preset (a-z/número, máx. 8)',
            en: 'preset name (a-z/digits, max 8)'
        },
        'Jersey import placeholder': {
            pt: 'Cole `/colors azul 60 rrggbb…` ou JSON…',
            es: 'Pega una línea `/colors rojo 60 rrggbb…` o JSON…',
            en: 'Paste `/colors blue 60 rrggbb…` or JSON…'
        },
        'Jersey importar JSON': { pt: 'Importar JSON', es: 'Importar JSON', en: 'Import JSON' },
        'Jersey importar botón': {
            pt: 'Importar linha ou JSON',
            es: 'Importar línea o JSON',
            en: 'Import line or JSON'
        },
        'Jersey panel subtítulo': {
            pt: '/colors no HaxBall — editor simples',
            es: '/colors de HaxBall — editor ligero',
            en: 'HaxBall /colors — streamlined editor'
        },
        'Jersey preview título': { pt: 'Pré-visualização', es: 'Vista previa', en: 'Preview' },
        'Jersey panel meta hint': {
            pt: 'As cores da camisa são só as 3 barras abaixo; o texto usa «cor do texto»',
            es: 'Los colores del patrón son los 3 de la camiseta; las letras usan «color texto».',
            en: 'Jersey stripes use the three kit colours; letters use «text colour».'
        },
        'Jersey equipo tm': { pt: 'Equipa na sala', es: 'Equipo en la sala', en: 'Side' },
        'Jersey valores tm': { pt: 'Valores', es: 'Valores', en: 'Values' },
        'Jersey ángulo corto': { pt: 'ângulo', es: 'ángulo', en: 'angle' },
        'Jersey texto avatar': { pt: 'texto (2 chars)', es: 'texto avatar (2)', en: 'avatar text (2)' },
        'Jersey color texto': { pt: 'cor do texto', es: 'color texto', en: 'text colour' },
        'Jersey color camiseta': { pt: 'cor', es: 'color', en: 'colour' },
        'Jersey cantidad colores': { pt: 'Franjas', es: 'Franjas', en: 'Stripes' },
        'Jersey una franja': { pt: '1 cor', es: '1 color', en: '1 colour' },
        'Jersey dos franjas': { pt: '2 cores', es: '2 colores', en: '2 colours' },
        'Jersey tres franjas': { pt: '3 cores', es: '3 colores', en: '3 colours' },
        'Jersey preset chat ayuda': {
            pt: 'No chat: `/colors` + mesmo nome ao salvar substitui o comando completo. Não pode ser red, blue ou clear.',
            es: 'En el chat: `/colors` + el mismo nombre guardado envía el comando completo (no usar red, blue o clear como nombre).',
            en: 'In chat: `/colors` plus your preset name fills in the full line. Names red, blue, clear are reserved.'
        },
        'Jersey nombre preset inválido': {
            pt: 'Use apenas a-z ou 0–9, até 8 caracteres.',
            es: 'Solo minúsculas a-z y números, máximo 8 caracteres.',
            en: 'Use only a-z digits, max 8 characters.'
        },
        'Jersey nombre preset reservado': {
            pt: 'Não pode chamar assim (reservado).',
            es: 'Este nombre está reservado.',
            en: 'That name is reserved.'
        },
        'Jersey import vacío': {
            pt: 'Cole uma linha ou JSON primeiro.',
            es: 'Pega antes una línea o JSON.',
            en: 'Paste a line or JSON first.'
        },
        'Cargar': { pt: 'Carregar', es: 'Cargar', en: 'Load' },
        'Aplicar': { pt: 'Aplicar', es: 'Aplicar', en: 'Apply' },
        'Eliminar': { pt: 'Excluir', es: 'Eliminar', en: 'Delete' },
        'Jersey diseño sin nombre': { pt: 'Sem nome', es: 'Sin nombre', en: 'Unnamed' },
        'Jersey diseño cargado': { pt: 'Modelo carregado no editor.', es: 'Diseño cargado en el editor.', en: 'Design loaded into the editor.' },
        'Jersey diseño guardado': { pt: 'Modelo salvo neste aparelho.', es: 'Diseño guardado en este dispositivo.', en: 'Design saved on this device.' },
        'Jersey diseño eliminado': { pt: 'Modelo removido.', es: 'Diseño eliminado.', en: 'Design removed.' },
        'Jersey pon un nombre': { pt: 'Escolha um nome para salvar.', es: 'Escribe un nombre para guardar.', en: 'Enter a name to save.' },
        'Jersey máximo rayas': { pt: 'No máximo 3 listras (limite do HaxBall).', es: 'Máximo 3 rayas (límite de HaxBall).', en: 'At most 3 stripes (HaxBall limit).' },
        'Jersey chat no disponible': {
            pt: 'Chat indisponível. Entre numa sala e abra o chat.',
            es: 'No hay chat disponible. Entra a una sala y abre el chat.',
            en: 'Chat not available. Join a room and open chat.'
        },
        'Jersey colores enviados': { pt: 'Comando /colors enviado.', es: 'Comando /colors enviado.', en: '/colors command sent.' },
        'Jersey avatar enviado': { pt: '/avatar enviado.', es: '/avatar enviado.', en: '/avatar sent.' },
        'Jersey avatar no aplicado': { pt: 'Não foi possível aplicar o emoji.', es: 'No se pudo aplicar el emoji.', en: 'Could not apply emoji.' },
        'Jersey avatar vacío': { pt: 'Escolha um emoji.', es: 'Escribe un emoji.', en: 'Enter an emoji.' },
        'Jersey comando copiado': { pt: 'Copiado para a área de transferência.', es: 'Copiado al portapapeles.', en: 'Copied to clipboard.' },
        'Jersey no se pudo copiar': { pt: 'Não foi possível copiar.', es: 'No se pudo copiar.', en: 'Could not copy.' },
        'Jersey import ok': {
            pt: 'Importação concluída.',
            es: 'Importación correcta.',
            en: 'Import successful.'
        },
        'Jersey import error': {
            pt: 'Linha `/colors …` ou JSON inválidos.',
            es: 'La línea `/colors …` o el JSON no son válidos.',
            en: 'Invalid `/colors …` line or JSON.'
        },

        // === EXTENSÃO - TEAMS ===
        'Carregando...': { pt: 'Carregando...', es: 'Cargando...', en: 'Loading...' },
        'Cargando Perfil...': { pt: 'Carregando perfil...', es: 'Cargando Perfil...', en: 'Loading profile...' },
        'Cargando personalización...': { pt: 'Carregando personalização...', es: 'Cargando personalización...', en: 'Loading customization...' },
        'Você não está em nenhuma equipe': { pt: 'Você não está em nenhuma equipe', es: 'No estás en ningún equipo' },
        'Criar Equipe': { pt: 'Criar Equipe', es: 'Crear Equipo' },
        'Criar Nova Equipe': { pt: 'Criar Nova Equipe', es: 'Crear Nuevo Equipo' },
        'Nome da Equipe': { pt: 'Nome da Equipe', es: 'Nombre del Equipo' },
        'Logo da Equipe': { pt: 'Logo da Equipe', es: 'Logo del Equipo' },
        'Escolher Imagem': { pt: 'Escolher Imagem', es: 'Elegir Imagen' },
        'Nenhuma selecionada': { pt: 'Nenhuma selecionada', es: 'Ninguna seleccionada' },
        'Preview': { pt: 'Preview', es: 'Vista previa' },
        'Cancelar': { pt: 'Cancelar', es: 'Cancelar' },
        'Criar': { pt: 'Criar', es: 'Crear' },
        'Criando...': { pt: 'Criando...', es: 'Creando...' },
        'Enviando logo...': { pt: 'Enviando logo...', es: 'Enviando logo...' },
        'Erro ao criar equipe': { pt: 'Erro ao criar equipe', es: 'Error al crear equipo' },
        'Erro de conexão': { pt: 'Erro de conexão', es: 'Error de conexión' },
        'membro(s)': { pt: 'membro(s)', es: 'miembro(s)' },
        'Sigla (máx 4)': { pt: 'Sigla (máx 4)', es: 'Sigla (máx 4)' },
        'Logo': { pt: 'Logo', es: 'Logo' },
        'Trocar': { pt: 'Trocar', es: 'Cambiar' },
        'Enviar': { pt: 'Enviar', es: 'Enviar' },
        'Salvar Alterações': { pt: 'Salvar Alterações', es: 'Guardar Cambios' },
        'Convidar Membro': { pt: 'Convidar Membro', es: 'Invitar Miembro' },
        'Username do Discord': { pt: 'Username do Discord', es: 'Usuario de Discord' },
        'Convidar': { pt: 'Convidar', es: 'Invitar' },
        'Membros': { pt: 'Membros', es: 'Miembros' },
        'Excluir Equipe': { pt: 'Excluir Equipe', es: 'Eliminar Equipo' },
        'Sair da Equipe': { pt: 'Sair da Equipe', es: 'Salir del Equipo' },
        'Nenhum membro': { pt: 'Nenhum membro', es: 'Ningún miembro' },
        'Remover': { pt: 'Remover', es: 'Eliminar' },
        'Convites Pendentes': { pt: 'Convites Pendentes', es: 'Invitaciones Pendientes' },
        'Aceitar': { pt: 'Aceitar', es: 'Aceptar' },
        'Recusar': { pt: 'Recusar', es: 'Rechazar' },
        'Convite enviado!': { pt: 'Convite enviado!', es: '¡Invitación enviada!' },
        'Erro ao convidar': { pt: 'Erro ao convidar', es: 'Error al invitar' },
        'Salvando...': { pt: 'Salvando...', es: 'Guardando...' },
        'Alterações salvas!': { pt: 'Alterações salvas!', es: '¡Cambios guardados!' },
        'Erro ao salvar': { pt: 'Erro ao salvar', es: 'Error al guardar' },
        'Pronto pra salvar': { pt: 'Pronto pra salvar', es: 'Listo para guardar' },
        'Máximo 512KB': { pt: 'Máximo 512KB', es: 'Máximo 512KB' },
        'Imagem muito grande (máx 512KB)': { pt: 'Imagem muito grande (máx 512KB)', es: 'Imagen muy grande (máx 512KB)' },
        'Nome deve ter pelo menos 3 caracteres': { pt: 'Nome deve ter pelo menos 3 caracteres', es: 'El nombre debe tener al menos 3 caracteres' },
        'El nombre no puede superar 30 caracteres': {
            pt: 'O nome não pode passar de 30 caracteres',
            es: 'El nombre no puede superar 30 caracteres',
            en: 'Team name cannot exceed 30 characters'
        },
        'Formato de imagen no permitido': {
            pt: 'Formato de imagem não permitido',
            es: 'Formato de imagen no permitido',
            en: 'Image format not allowed'
        },
        'Fechar': { pt: 'Fechar', es: 'Cerrar' },
        'Remover este membro?': { pt: 'Remover este membro?', es: '¿Eliminar este miembro?' },
        'Confirmar': { pt: 'Confirmar', es: 'Confirmar' },
        'Tem certeza que deseja EXCLUIR a equipe? Isso não pode ser desfeito.': { pt: 'Tem certeza que deseja EXCLUIR a equipe? Isso não pode ser desfeito.', es: '¿Estás seguro de que deseas ELIMINAR el equipo? Esto no se puede deshacer.' },
        'Tem certeza que deseja sair da equipe?': { pt: 'Tem certeza que deseja sair da equipe?', es: '¿Estás seguro de que deseas salir del equipo?' },
        'Gestión del equipo': { pt: 'Gestão da equipe', es: 'Gestión del equipo', en: 'Team management' },
        'Gestión equipo hint': {
            pt: 'O nome, a sigla e o logo aparecem no jogo e quando alguém recebe um convite.',
            es: 'El nombre, la sigla y el escudo se ven en el juego y cuando alguien recibe una invitación.',
            en: 'Name, tag and logo show in-game and on invites.',
        },
        'Invitar jugador': { pt: 'Convidar jogador', es: 'Invitar jugador', en: 'Invite player' },
        'Invite player hint': {
            pt: 'Pode ser o nick que a pessoa usa na sala, o nome de usuário do Discord ou o código longo do perfil.',
            es: 'Puede ser el nick que usa en la sala, su usuario de Discord o el número largo del perfil.',
            en: 'Use their in-room nick, Discord username, or profile ID number.',
        },
        'Usuario o nick': { pt: 'Usuário ou nick', es: 'Usuario o nick', en: 'User or nick' },
        'Equipo invite label': {
            pt: 'Quem você quer convidar',
            es: 'A quién querés invitar',
            en: 'Who to invite',
        },
        'Equipo invite enviar': {
            pt: 'Enviar convite',
            es: 'Enviar invitación',
            en: 'Send invite',
        },
        'Equipo invite vacío': {
            pt: 'Escreva um nome ou usuário para convidar.',
            es: 'Escribí un nombre o usuario para invitar.',
            en: 'Enter a name or username to invite.',
        },
        'Placeholder invitación equipo': {
            pt: 'Ex.: nick na sala ou usuário do Discord',
            es: 'Ej.: nick en sala o usuario de Discord',
            en: 'e.g. in-game nick or Discord name',
        },
        'Rango al invitar': {
            pt: 'Cargo que você oferece',
            es: 'Rol que le ofrecés',
            en: 'Role you offer',
        },
        'Rol dueño': { pt: 'Dono', es: 'Dueño', en: 'Owner' },
        'Rol moderador': { pt: 'Moderador', es: 'Moderador', en: 'Moderator' },
        'Rol miembro': { pt: 'Membro', es: 'Miembro', en: 'Member' },
        'Dueño del equipo': { pt: 'Dono da equipe', es: 'Dueño del equipo', en: 'Team owner' },
        'Invitaciones recibidas': { pt: 'Convites recebidos', es: 'Invitaciones recibidas', en: 'Received invites' },
        'Rango invitación moderador': {
            pt: 'Cargo oferecido: moderador',
            es: 'Rango ofrecido: moderador',
            en: 'Offered rank: moderator',
        },
        'Rango invitación miembro': {
            pt: 'Cargo oferecido: membro',
            es: 'Rango ofrecido: miembro',
            en: 'Offered rank: member',
        },
        'Cambiar rango': { pt: 'Mudar cargo', es: 'Cambiar rango', en: 'Change rank' },
        'Enviando invitación': { pt: 'Enviando convite...', es: 'Enviando invitación...', en: 'Sending invite...' },
        'Equipo tab members': { pt: 'Membros', es: 'Miembros', en: 'Members' },
        'Equipo tab admin': { pt: 'Administração', es: 'Administración', en: 'Admin' },
        'Equipo tab chat': { pt: 'Chat', es: 'Chat', en: 'Chat' },
        'Equipo admin hint': {
            pt: 'Altere cargos ou remova pessoas. Só o dono do time vê esta aba.',
            es: 'Cambiá rangos o sacá personas del equipo. Solo el dueño puede usar esta pestaña.',
            en: 'Change roles or remove members. Only the team owner sees this tab.',
        },
        'Equipo rol admin': { pt: 'Administrador', es: 'Administrador', en: 'Admin' },
        'Equipo chat hint': {
            pt: 'Conversa do time. O ponto verde indica que a pessoa está com o app aberto agora.',
            es: 'Chat del equipo. El punto verde indica que la persona tiene la app abierta ahora.',
            en: 'Team chat. A green dot means they have the app open right now.',
        },
        'Equipo chat placeholder': { pt: 'Escrever…', es: 'Escribí un mensaje…', en: 'Write a message…' },
        'Equipo chat enviar': { pt: 'Enviar', es: 'Enviar', en: 'Send' },
        'Anonymous mode toggle': {
            pt: 'Modo anónimo',
            es: 'Modo anónimo',
            en: 'Anonymous mode'
        },
        'Anonymous mode tooltip': {
            pt: 'Oculta a sua identidade sem desativar amigos, equipas ou personalizações.',
            es: 'Oculta tu identidad sin desactivar amigos, equipos ni personalizaciones.',
            en: 'Hides your identity without disabling friends, teams, or personalization.'
        },
        'Equipo presencia app': {
            pt: 'Com o app aberto',
            es: 'Con la app abierta',
            en: 'App is open',
        },
        'Equipo expulsar': { pt: 'Expulsar', es: 'Expulsar', en: 'Remove' },
        'Equipo ajustes summary': {
            pt: 'Nome, sigla e escudo do time',
            es: 'Nombre, sigla y escudo del equipo',
            en: 'Team name, tag and logo',
        },
        'Equipo link invite titulo': {
            pt: 'Convite por link',
            es: 'Invitación por enlace',
            en: 'Invite link',
        },
        'Equipo link invite hint': {
            pt: 'Gere um código e envie para quem você quer no time. Quem tiver o app pode colar o código em Equipe → Entrar com código.',
            es: 'Generá un código y pasáselo a quien quieras en el equipo. Con la app abierta, en Equipo puede pegar el código abajo en «Unirme con código».',
            en: 'Generate a code and share it. Others paste it under Team → Join with code.',
        },
        'Equipo link rol hint': {
            pt: 'Cargo de quem entra pelo link',
            es: 'Rol de quien entra con el enlace',
            en: 'Role for people who join via link',
        },
        'Equipo link codigo label': { pt: 'Código', es: 'Código', en: 'Code' },
        'Equipo link copiar': { pt: 'Copiar', es: 'Copiar', en: 'Copy' },
        'Equipo link nuevo codigo': {
            pt: 'Gerar código novo',
            es: 'Generar otro código',
            en: 'New code',
        },
        'Equipo link desactivar': {
            pt: 'Desativar link',
            es: 'Desactivar enlace',
            en: 'Disable link',
        },
        'Equipo link generar': {
            pt: 'Gerar código de convite',
            es: 'Generar código de invitación',
            en: 'Generate invite code',
        },
        'Equipo link generando': {
            pt: 'Gerando…',
            es: 'Generando…',
            en: 'Generating…',
        },
        'Equipo link listo': { pt: 'Pronto.', es: 'Listo.', en: 'Done.' },
        'Equipo link copiado': {
            pt: 'Código copiado.',
            es: 'Código copiado.',
            en: 'Code copied.',
        },
        'Equipo link copiar manual': {
            pt: 'Selecione o código e copie manualmente.',
            es: 'Seleccioná el código y copiá a mano.',
            en: 'Select the code and copy manually.',
        },
        'Equipo link desactivado ok': {
            pt: 'Link desativado.',
            es: 'Enlace desactivado.',
            en: 'Link disabled.',
        },
        'Equipo unir codigo titulo': {
            pt: 'Entrar com código',
            es: 'Unirme con código',
            en: 'Join with code',
        },
        'Equipo unir codigo hint': {
            pt: 'Se alguém te mandou um código de time, cole aqui.',
            es: 'Si alguien te pasó un código del equipo, pegalo acá.',
            en: 'If someone sent you a team code, paste it here.',
        },
        'Equipo unir codigo placeholder': {
            pt: 'Cole o código aqui',
            es: 'Pegá el código acá',
            en: 'Paste code here',
        },
        'Equipo unir codigo boton': { pt: 'Entrar no time', es: 'Unirme al equipo', en: 'Join team' },
        'Equipo unir ya miembro': {
            pt: 'Você já está neste time.',
            es: 'Ya estás en este equipo.',
            en: 'You are already on this team.',
        },

        // === EXTENSÃO - FRIENDS ===
        'Amigos': { pt: 'Amigos', es: 'Amigos' },
        'Amizades': { pt: 'Amizades', es: 'Amistades' },
        'Adicionar Amigo': { pt: 'Adicionar Amigo', es: 'Añadir Amigo' },
        'Nenhum amigo adicionado': { pt: 'Nenhum amigo adicionado', es: 'Ningún amigo añadido' },
        'Online': { pt: 'Online', es: 'En línea' },
        'Offline': { pt: 'Offline', es: 'Desconectado' },
        'Solicitações': { pt: 'Solicitações', es: 'Solicitudes' },
        'Username do Discord': { pt: 'Username do Discord', es: 'Usuario de Discord' },
        'Nenhum usuário encontrado': { pt: 'Nenhum usuário encontrado', es: 'Ningún usuario encontrado' },
        'Adicionar': { pt: 'Adicionar', es: 'Añadir' },
        'Solicitação enviada para': { pt: 'Solicitação enviada para', es: 'Solicitud enviada a' },
        'Erro ao enviar': { pt: 'Erro ao enviar', es: 'Error al enviar' },
        'Digite um username': { pt: 'Digite um username', es: 'Escribe un usuario' },
        'Buscando...': { pt: 'Buscando...', es: 'Buscando...' },
        'Usuário não encontrado': { pt: 'Usuário não encontrado', es: 'Usuario no encontrado' },
        'Erro ao buscar usuário': { pt: 'Erro ao buscar usuário', es: 'Error al buscar usuario' },
        'Solicitações pendentes': { pt: 'Solicitações pendentes', es: 'Solicitudes pendientes' },
        'Friends pending pill': { pt: 'AMIGOS', es: 'AMIGOS', en: 'FRIENDS' },
        'Friends pending intro': {
            pt: 'Aceite ou recuse — a lista atualiza na hora.',
            es: 'Aceptá o rechazá: la lista se actualiza al instante.',
            en: 'Accept or decline — the list updates right away.',
        },
        'Friends request card hint': {
            pt: 'Quer adicionar-te à lista de amigos. Vês o estado online e convites quando estiver disponível.',
            es: 'Quiere añadirte a tu lista de amigos. Verás estado e invitaciones cuando estén disponibles.',
            en: 'Wants to add you as a friend. You will see presence and invites when available.',
        },
        'Friends accept ok': {
            pt: 'Amigo adicionado.',
            es: '¡Amigo añadido!',
            en: 'Friend added.',
        },
        'Friends reject ok': {
            pt: 'Pedido recusado.',
            es: 'Solicitud rechazada.',
            en: 'Request declined.',
        },
        'Erro ao aceitar solicitação': {
            pt: 'Erro ao aceitar pedido.',
            es: 'No se pudo aceptar la solicitud.',
            en: 'Could not accept the request.',
        },
        'Erro ao recusar': {
            pt: 'Erro ao recusar.',
            es: 'No se pudo rechazar.',
            en: 'Could not decline.',
        },
        'Friends brand line': {
            pt: 'HaxBall Zero • Amigos',
            es: 'HaxBall Zero • Amigos',
            en: 'HaxBall Zero • Friends',
        },
        'Friends panel blurb': {
            pt: 'Gerencie solicitações, convites de sala e a lista de amigos.',
            es: 'Gestioná solicitudes, invitaciones a sala y tu lista de amigos.',
            en: 'Manage requests, room invites, and your friends list.',
        },
        'Friends room overlay hint': {
            pt: 'Convide pela lista ou use Pesquisar. Quem aceitar o convite entra usando o mesmo link da barra superior.',
            es: 'Invita desde tu lista o con buscar. Quien acepte el convite entra usando el mismo enlace de la barra superior.',
            en: 'Invite from your list or search. When they accept the invite they join via the same top bar link field.',
        },
        'Friends pending section tag': {
            pt: 'PENDENTES',
            es: 'PENDIENTES',
            en: 'PENDING',
        },
        'Friends list section tag': {
            pt: 'AMIGOS',
            es: 'AMIGOS',
            en: 'FRIENDS',
        },
        'Friends remove ok': {
            pt: 'Amigo removido.',
            es: 'Amigo eliminado.',
            en: 'Friend removed.',
        },
        'Friends remove fail': {
            pt: 'Não foi possível remover.',
            es: 'No se pudo eliminar al amigo.',
            en: 'Could not remove friend.',
        },
        'Entrar': { pt: 'Entrar', es: 'Entrar' },
        'Compartilhar': { pt: 'Compartilhar', es: 'Compartir' },
        'Compartilhado!': { pt: 'Compartilhado!', es: '¡Compartido!' },
        'Erro': { pt: 'Erro', es: 'Error', en: 'Error' },
        'Invitar': { pt: 'Convidar', es: 'Invitar', en: 'Invite' },
        'Invitado': { pt: 'Convidado', es: 'Invitado', en: 'Invited' },
        'Invitaciones de sala': { pt: 'Convites de sala', es: 'Invitaciones de sala', en: 'Room invites' },
        'Invitación de': { pt: 'Convite de', es: 'Invitación de', en: 'Invite from' },
        'Con código': { pt: 'Com código', es: 'Con código', en: 'With password' },
        'Sala privada': { pt: 'Sala privada', es: 'Sala privada', en: 'Private room' },
        'Room invite accept failed': {
            pt: 'Não foi possível aceitar o convite da sala.',
            es: 'No se pudo aceptar la invitación a la sala.',
            en: 'Could not accept the room invite.',
        },
        'Room invite missing link': {
            pt: 'Sem link da sala neste convite.',
            es: 'No hay enlace de sala en esta invitación.',
            en: 'This invite has no room link.',
        },
        'Esta sala tiene código. Escribilo para que tu amigo entre sin que se lo pida.': { pt: 'Esta sala tem senha. Digite-a para que seu amigo entre sem precisar informá-la.', es: 'Esta sala tiene código. Escribilo para que tu amigo entre sin que se lo pida.', en: 'This room has a password. Type it so your friend can join without being asked.' },

        // === EXTENSÃO - SETTINGS ===
        'Som': { pt: 'Som', es: 'Sonido', en: 'Sound' },
        'Vídeo': { pt: 'Vídeo', es: 'Video', en: 'Video' },
        'Resolución': { pt: 'Resolução', es: 'Resolución', en: 'Resolution' },
        'Controles': { pt: 'Controles', es: 'Controles', en: 'Controls' },
        'Sonido': { pt: 'Som', es: 'Sonido', en: 'Sound' },
        'Atajos de teclado': { pt: 'Atalhos de teclado', es: 'Atajos de teclado', en: 'Keyboard shortcuts' },
        'Atajos': { pt: 'Atalhos', es: 'Atajos', en: 'Shortcuts' },
        'Sonido hub intro': { pt: 'Ajuste cada tipo de som. O volume geral fica na barra do jogo.', es: 'Ajustá cada tipo de sonido. El volumen general está en la barra del juego.', en: 'Adjust each sound type. Master volume is on the in-game bar.' },
        'Sonido general (master)': { pt: 'Som geral (master)', es: 'Sonido general (master)', en: 'Master sound' },
        'Sonido del chat': { pt: 'Som do chat', es: 'Sonido del chat', en: 'Chat sound' },
        'Sonido de mención': { pt: 'Som de menção', es: 'Sonido de mención', en: 'Mention / highlight sound' },
        'Hinchada y ambiente': { pt: 'Torcida e ambiente', es: 'Hinchada y ambiente', en: 'Crowd & ambience' },
        'Patada y pelota': { pt: 'Chute e bola', es: 'Patada y pelota', en: 'Kick & ball hit' },
        'Gol': { pt: 'Gol', es: 'Gol', en: 'Goal' },
        'Jugador entra': { pt: 'Jogador entra', es: 'Jugador entra', en: 'Player joins' },
        'Jugador sale': { pt: 'Jogador sai', es: 'Jugador sale', en: 'Player leaves' },
        'Keys intro': { pt: 'Atalhos: movimento, chute, chat, menu, vista da câmera (também [ ]), foco no chat e estádio 120 FPS (P). Câmera fina: aba Vídeo. Use + para mais teclas.', es: 'Atajos: movimiento, patada, chat, menú, cambiar vista de cámara ([ ]), foco en chat y estadio 120 FPS (P). Ajuste fino de cámara: pestaña Video. Usá + para más teclas.', en: 'Shortcuts: move, kick, chat, menu, camera view cycle ([ ]), chat focus, stadium 120 FPS (P). Fine camera: Video tab. Use + for more keys.' },
        'Kick btn tooltip': {
            pt: 'Expulsar · tecla K (ou Ctrl+Shift+K). Passa o rato sobre o jogador.',
            es: 'Expulsar · tecla K (o Ctrl+Shift+K). Pasá el mouse sobre el jugador.',
            en: 'Kick · K (or Ctrl+Shift+K). Hover the player row.'
        },
        'Ban btn tooltip': {
            pt: 'Banir · tecla B (ou Ctrl+Shift+B). Passa o rato sobre o jogador.',
            es: 'Banear · tecla B (o Ctrl+Shift+B). Pasá el mouse sobre el jugador.',
            en: 'Ban · B (or Ctrl+Shift+B). Hover the player row.'
        },
        'shortcuts': { pt: 'Shortcuts', es: 'Shortcuts', en: 'Shortcuts' },
        'Shortcuts tab intro': {
            pt: 'Shortcuts: ao enviar no chat, o texto curto pode ser expandido para o comando completo. Funciona junto com emojis estilo Discord (:sob:).',
            es: 'Shortcuts: al enviar en el chat, el texto corto puede sustituirse por el comando completo. Funciona junto con emojis estilo Discord (:sob:).',
            en: 'Shortcuts: when you send chat, the short trigger can expand to the full command. Works with Discord-style emoji codes (:sob:).'
        },
        'Shortcuts tab foot': {
            pt: 'A mensagem inteira deve ser igual ao disparador (ex.: /e). Emojis usam :nome:.',
            es: 'El mensaje completo debe coincidir con el disparador (ej.: /e). Emojis con :nombre:.',
            en: 'The whole message must match the trigger (e.g. /e). Emojis use :name:.'
        },
        'Create new shortcut btn': { pt: 'criar novo', es: 'crear nuevo', en: 'create new' },
        'Zoom key binds title': { pt: 'Teclas de zoom da janela', es: 'Teclas de zoom de ventana', en: 'Window zoom keys' },
        'Zoom key binds hint': {
            pt: 'Com Zero zoom ativo, associa uma tecla a um zoom % (50–300). Evita teclas do jogo.',
            es: 'Con Zero zoom activo, asigná una tecla a un % de zoom (50–300). Evitá teclas del partido.',
            en: 'With Zero zoom on, bind a key to a zoom % (50–300). Avoid in-game keys.'
        },
        'Add zoom key bind': { pt: 'Adicionar tecla de zoom', es: 'Añadir tecla de zoom', en: 'Add zoom key' },
        'Zoom slot hint': {
            pt: 'Zoom da janela (Zero zoom ligado). Teclas padrão: 1–9. Ajuste o % ao lado.',
            es: 'Zoom de ventana con Zero zoom activo. Por defecto teclas 1–9. Ajustá el % al lado.',
            en: 'Window zoom when Zero zoom is on. Default keys 1–9. Edit % on the right.'
        },
        'No match status text': {
            pt: 'Sem texto (Start/Stop)',
            es: 'No Text (Start,Stop)',
            en: 'No Text (Start,Stop)'
        },
        'No match status text tooltip': {
            pt: 'Oculta para ti mensagens como Game started / Game stopped / Game paused no chat do estádio.',
            es: 'Oculta para vos mensajes como Game started / Game stopped / Game paused en el chat del estadio.',
            en: 'Hides for you messages like Game started / Game stopped / Game paused in stadium chat.'
        },
        'Camera shortcut title': { pt: 'Atalhos de vista da câmera (0–8)', es: 'Atajos de vista de cámara (0–8)', en: 'Camera view shortcuts (0–8)' },
        'Camera shortcut hint': { pt: 'Teclas extra opcionais; os dígitos 0–8 mudam a vista. Evita conflitos com extrapolation.', es: 'Teclas extra opcionales; los dígitos 0–8 del teclado cambian la vista. Evitá conflictos con extrapolation.', en: 'Optional extra keys; digits 0–8 switch views. Avoid clashes with extrapolation binds.' },
        'Camera binds section title': { pt: 'Shortcuts', es: 'Shortcuts', en: 'Shortcuts' },
        'Camera extra binds hint': {
            pt: 'Mesmo que as teclas 0–8 na partida: fila = modo de vista. Usa + para uma tecla alternativa (não compete com zoom da janela).',
            es: 'Equivale a las teclas 0–8 en partida: cada fila es un modo de vista. Usá + para una tecla extra (ya no roba el zoom de la ventana).',
            en: 'Same as in-match keys 0–8: each row is a camera mode. Use + for an alternate key (no longer steals window zoom).'
        },
        'Camera optional shortcuts foot': {
            pt: 'Atalhos opcionais de vista (0–8)',
            es: 'Atajos opcionales de vista (0–8)',
            en: 'Optional camera view shortcuts (0–8)'
        },
        'Camera slot label': { pt: 'Vista {n}', es: 'Vista {n}', en: 'View {n}' },
        'Cam mode also digit': { pt: 'Tecla {n} no teclado', es: 'Tecla {n} en el teclado', en: 'Keyboard {n}' },
        'Cam mode dynamic': { pt: 'Dinâmico', es: 'Dinámico', en: 'Dynamic' },
        'Cam mode restricted': { pt: 'Restrito 840×410', es: 'Restringido 840×410', en: 'Restricted 840×410' },
        'Cam mode z1': { pt: 'Tela cheia 1×', es: 'Pantalla completa 1×', en: 'Full 1×' },
        'Cam mode z125': { pt: 'Zoom 1,25×', es: 'Zoom 1,25×', en: '1.25× zoom' },
        'Cam mode z15': { pt: 'Zoom 1,5×', es: 'Zoom 1,5×', en: '1.5× zoom' },
        'Cam mode z175': { pt: 'Zoom 1,75×', es: 'Zoom 1,75×', en: '1.75× zoom' },
        'Cam mode z2': { pt: 'Zoom 2×', es: 'Zoom 2×', en: '2× zoom' },
        'Cam mode z225': { pt: 'Zoom 2,25×', es: 'Zoom 2,25×', en: '2.25× zoom' },
        'Cam mode z25': { pt: 'Zoom 2,5×', es: 'Zoom 2,5×', en: '2.5× zoom' },
        'Camera bind': { pt: 'Definir', es: 'Asignar', en: 'Bind' },
        'Camera unbind': { pt: 'Limpar', es: 'Quitar', en: 'Clear' },
        'Camera press key': { pt: 'Pressione a tecla…', es: 'Pulsa una tecla…', en: 'Press a key…' },
        'Camera reset all': { pt: 'Limpar todos', es: 'Borrar todos', en: 'Clear all' },
        'Avatares': { pt: 'Avatares', es: 'Avatares', en: 'Avatars' },
        'Host Token': { pt: 'Host Token', es: 'Host Token', en: 'Host Token' },
        'Temas': { pt: 'Temas', es: 'Temas', en: 'Themes' },
        'Multi-Auth': { pt: 'Multi-Auth', es: 'Multi-Auth', en: 'Multi-Auth' },
        'Diversos': { pt: 'Diversos', es: 'Varios', en: 'Misc' },
        'Preset': { pt: 'Predefinição', es: 'Preset', en: 'Preset' },
        'Personalizada': { pt: 'Personalizada', es: 'Personalizada', en: 'Custom' },
        'Nativa': { pt: 'Nativa', es: 'Nativa', en: 'Native' },
        'Resolution tab hint': { pt: 'Resolução esticada só neste cliente; não altera as opções normais de Vídeo.', es: 'Resolución estirada solo en este cliente; no cambia el resto de Vídeo.', en: 'Stretched resolution for this client only; does not change other Video settings.' },
        'Resolution apply btn': { pt: 'Aplicar', es: 'Aplicar', en: 'Apply' },
        'Resolution native btn': { pt: 'Nativa', es: 'Nativa', en: 'Native' },
        'Resolución activa': { pt: 'Resolução ativa', es: 'Resolución activa', en: 'Active resolution' },
        'Usar nativa': { pt: 'Usar nativa', es: 'Usar nativa', en: 'Use native' },
        'Aplicar resolución': { pt: 'Aplicar resolução', es: 'Aplicar resolución', en: 'Apply resolution' },
        'Configura la resolución estirada desde una sección separada, sin mezclarla con las opciones normales de video.': { pt: 'Configure a resolução esticada em uma seção separada, sem misturá-la com as opções normais de vídeo.', es: 'Configura la resolución estirada desde una sección separada, sin mezclarla con las opciones normales de video.', en: 'Configure stretched resolution in a separate section, without mixing it with the regular video options.' },
        'Se guarda automáticamente en este cliente.': { pt: 'Ela é salva automaticamente neste cliente.', es: 'Se guarda automáticamente en este cliente.', en: 'It is saved automatically on this client.' },

        // === EXTENSÃO - MULTI-AUTH ===
        'Auth atual: ': { pt: 'Auth atual: ', es: 'Auth actual: ', en: 'Current auth: ' },
        'Nenhuma auth ativa. Máximo de 5 auths.': { pt: 'Nenhuma auth ativa. Máximo de 5 auths.', es: 'Ninguna auth activa. Máximo de 5 auths.', en: 'No active auth. Maximum of 5 auths.' },
        'Nenhuma auth salva. Adicione uma abaixo.': { pt: 'Nenhuma auth salva. Adicione uma abaixo.', es: 'Ninguna auth guardada. Añade una abajo.', en: 'No saved auths. Add one below.' },
        'Auth ': { pt: 'Auth ', es: 'Auth ', en: 'Auth ' },
        'Usar': { pt: 'Usar', es: 'Usar', en: 'Use' },
        'Auth alterada! Feche e abra o app para aplicar.': { pt: 'Auth alterada! Feche e abra o app para aplicar.', es: '¡Auth cambiada! Cierra y abre la app para aplicar.', en: 'Auth changed! Close and reopen the app to apply it.' },
        'Auth removida': { pt: 'Auth removida', es: 'Auth eliminada', en: 'Auth removed' },
        'Adicionar Nova Auth': { pt: 'Adicionar Nova Auth', es: 'Añadir Nueva Auth', en: 'Add New Auth' },
        'Nome (opcional)': { pt: 'Nome (opcional)', es: 'Nombre (opcional)', en: 'Name (optional)' },
        'Auth Key (ex: idkey.xxx.xxx.xxx)': { pt: 'Auth Key (ex: idkey.xxx.xxx.xxx)', es: 'Auth Key (ej: idkey.xxx.xxx.xxx)', en: 'Auth Key (e.g. idkey.xxx.xxx.xxx)' },
        'Adicionar': { pt: 'Adicionar', es: 'Añadir', en: 'Add' },
        'Salvar Atual': { pt: 'Salvar Atual', es: 'Guardar Actual', en: 'Save Current' },
        'Digite uma auth key': { pt: 'Digite uma auth key', es: 'Escribe una auth key', en: 'Enter an auth key' },
        'Formato inválido. Use: idkey.xxx.xxx.xxx': { pt: 'Formato inválido. Use: idkey.xxx.xxx.xxx', es: 'Formato inválido. Usa: idkey.xxx.xxx.xxx', en: 'Invalid format. Use: idkey.xxx.xxx.xxx' },
        'Esta auth já está salva': { pt: 'Esta auth já está salva', es: 'Esta auth ya está guardada', en: 'This auth is already saved' },
        'Limite de 5 auths atingido': { pt: 'Limite de 5 auths atingido', es: 'Límite de 5 auths alcanzado', en: '5 auth limit reached' },
        'Auth adicionada!': { pt: 'Auth adicionada!', es: '¡Auth añadida!', en: 'Auth added!' },
        'Nenhuma auth atual para salvar': { pt: 'Nenhuma auth atual para salvar', es: 'Ninguna auth actual para guardar', en: 'No current auth to save' },
        'Auth atual já está salva': { pt: 'Auth atual já está salva', es: 'Auth actual ya está guardada', en: 'Current auth is already saved' },
        'Auth atual salva!': { pt: 'Auth atual salva!', es: '¡Auth actual guardada!', en: 'Current auth saved!' },
        'Após trocar de auth, feche e abra o app para aplicar.': { pt: 'Após trocar de auth, feche e abra o app para aplicar.', es: 'Después de cambiar de auth, cierra y abre la app para aplicar.', en: 'After changing auth, close and reopen the app to apply it.' },
        'Multi-auth en uso': { pt: 'Auth em uso', es: 'Auth en uso', en: 'Active auth' },
        'Copiar auth': { pt: 'Copiar', es: 'Copiar', en: 'Copy' },
        'Auth copiada': { pt: 'Auth copiada para a área de transferência.', es: 'Auth copiada al portapapeles.', en: 'Auth copied to clipboard.' },
        'Auth copiar vacía': { pt: 'Não há auth ativa para copiar.', es: 'No hay auth activa para copiar.', en: 'No active auth to copy.' },

        'Tema': { pt: 'Tema', es: 'Tema', en: 'Theme' },
        'Escuro': { pt: 'Escuro', es: 'Oscuro', en: 'Dark' },
        'Claro': { pt: 'Claro', es: 'Claro', en: 'Light' },
        'Padrão': { pt: 'Padrão', es: 'Predeterminado', en: 'Default' },
        'Onix': { pt: 'Onix', es: 'Onix', en: 'Onyx' },
        'Grafite': { pt: 'Grafite', es: 'Grafito', en: 'Graphite' },
        'Nord': { pt: 'Nord', es: 'Nord', en: 'Nord' },
        'Esmeralda': { pt: 'Esmeralda', es: 'Esmeralda', en: 'Emerald' },
        'Rosa Neon': { pt: 'Rosa Neon', es: 'Rosa Neón', en: 'Neon Rose' },
        'Oceano': { pt: 'Oceano', es: 'Océano', en: 'Ocean' },
        'Pôr do Sol': { pt: 'Pôr do Sol', es: 'Atardecer', en: 'Sunset' },
        'Lavanda': { pt: 'Lavanda', es: 'Lavanda', en: 'Lavender' },
        'Cyber': { pt: 'Cyber', es: 'Cyber', en: 'Cyber' },
        'Café': { pt: 'Café', es: 'Café', en: 'Coffee' },
        'Personalizado': { pt: 'Personalizado', es: 'Personalizado', en: 'Custom' },
        'Sem alterações de cor': { pt: 'Sem alterações de cor', es: 'Sin cambios de color', en: 'No color changes' },
        'Reduz o cansaço visual': { pt: 'Reduz o cansaço visual', es: 'Reduce la fatiga visual', en: 'Reduces eye strain' },
        'Melhor visibilidade': { pt: 'Melhor visibilidade', es: 'Mejor visibilidad', en: 'Better visibility' },
        'Preto total, escuridão absoluta': { pt: 'Preto total, escuridão absoluta', es: 'Negro total, oscuridad absoluta', en: 'Pure black, absolute darkness' },
        'Cinza elegante e equilibrado': { pt: 'Cinza elegante e equilibrado', es: 'Gris elegante y equilibrado', en: 'Elegant balanced gray' },
        'Azul frio com contraste suave': { pt: 'Azul frio com contraste suave', es: 'Azul frío con contraste suave', en: 'Cold blue with soft contrast' },
        'Verde profundo com brilho limpo': { pt: 'Verde profundo com brilho limpo', es: 'Verde profundo con brillo limpio', en: 'Deep green with clean glow' },
        'Rosa vibrante com clima neon': { pt: 'Rosa vibrante com clima neon', es: 'Rosa vibrante con aire neón', en: 'Vibrant pink with neon vibe' },
        'Azul oceânico mais vivo': { pt: 'Azul oceânico mais vivo', es: 'Azul oceánico más vivo', en: 'More vivid ocean blue' },
        'Laranja quente inspirado no entardecer': { pt: 'Laranja quente inspirado no entardecer', es: 'Naranja cálido inspirado en el atardecer', en: 'Warm orange inspired by sunset' },
        'Roxo suave com destaque moderno': { pt: 'Roxo suave com destaque moderno', es: 'Violeta suave con destaque moderno', en: 'Soft purple with modern accents' },
        'Ciano tecnológico com ar futurista': { pt: 'Ciano tecnológico com ar futurista', es: 'Cian tecnológico con aire futurista', en: 'Tech cyan with futuristic feel' },
        'Marrom escuro confortável para sessões longas': { pt: 'Marrom escuro confortável para sessões longas', es: 'Marrón oscuro cómodo para sesiones largas', en: 'Dark brown comfortable for long sessions' },
        'Crea tu propia combinación de colores': { pt: 'Crie sua própria combinação de cores', es: 'Crea tu propia combinación de colores', en: 'Create your own color combination' },
        'Tema personalizado': { pt: 'Tema personalizado', es: 'Tema personalizado', en: 'Custom theme' },
        'Arma un tema propio eligiendo colores base. El resto del estilo se acomoda solo para que quede prolijo.': { pt: 'Monte um tema próprio escolhendo cores base. O restante do estilo se ajusta sozinho para ficar bonito.', es: 'Arma un tema propio eligiendo colores base. El resto del estilo se acomoda solo para que quede prolijo.', en: 'Build your own theme by picking the base colors. The rest of the style adjusts automatically so it still looks polished.' },
        'Fondo principal': { pt: 'Fundo principal', es: 'Fondo principal', en: 'Main background' },
        'Paneles': { pt: 'Painéis', es: 'Paneles', en: 'Panels' },
        'Botones y superficies': { pt: 'Botões e superfícies', es: 'Botones y superficies', en: 'Buttons and surfaces' },
        'Bordes': { pt: 'Bordas', es: 'Bordes', en: 'Borders' },
        'Texto principal': { pt: 'Texto principal', es: 'Texto principal', en: 'Primary text' },
        'Texto secundario': { pt: 'Texto secundario', es: 'Texto secundario', en: 'Secondary text' },
        'Preview del tema': { pt: 'Prévia do tema', es: 'Preview del tema', en: 'Theme preview' },
        'Así se van a ver los paneles, botones y textos principales.': { pt: 'Assim vão ficar os painéis, botões e textos principais.', es: 'Así se van a ver los paneles, botones y textos principales.', en: 'This is how the main panels, buttons, and text will look.' },
        'Botón destacado': { pt: 'Botão em destaque', es: 'Botón destacado', en: 'Highlighted button' },
        'Vista rápida del estilo general': { pt: 'Visão rápida do estilo geral', es: 'Vista rápida del estilo general', en: 'Quick preview of the overall style' },
        'Usar tema actual como base': { pt: 'Usar tema atual como base', es: 'Usar tema actual como base', en: 'Use current theme as base' },
        'Restaurar colores': { pt: 'Restaurar cores', es: 'Restaurar colores', en: 'Restore colors' },
        'Aplicar personalizado': { pt: 'Aplicar personalizado', es: 'Aplicar personalizado', en: 'Apply custom theme' },
        'Imagen de fondo': { pt: 'Imagem de fundo', es: 'Imagen de fondo', en: 'Background image' },
        'Podés elegir una imagen para usar de fondo en la app.': { pt: 'Você pode escolher uma imagem para usar como fundo no app.', es: 'Podés elegir una imagen para usar de fondo en la app.', en: 'You can choose an image to use as the app background.' },
        'Elegir imagen': { pt: 'Escolher imagem', es: 'Elegir imagen', en: 'Choose image' },
        'Quitar imagen': { pt: 'Remover imagem', es: 'Quitar imagen', en: 'Remove image' },
        'Imagen cargada': { pt: 'Imagem carregada', es: 'Imagen cargada', en: 'Image loaded' },
        'Sin imagen': { pt: 'Sem imagem', es: 'Sin imagen', en: 'No image' },
        'Personalización': { pt: 'Personalização', es: 'Personalización', en: 'Customization' },
        /* Misma entrada: vip.js usa ortografía PT en la clave (ç) */
        'Personalização': { pt: 'Personalização', es: 'Personalización', en: 'Customization' },
        'Personalización Total': { pt: 'Personalização total', es: 'Personalización total', en: 'Full customization' },
        'Temas, fondo y colores en secciones claras, como Rendimiento.': { pt: 'Temas, fundo e cores em seções claras, como Desempenho.', es: 'Temas, fondo y colores en secciones claras, como Rendimiento.', en: 'Themes, wallpaper, and colors in clear sections—like Performance.' },
        'Temas predefinidos': { pt: 'Temas predefinidos', es: 'Temas predefinidos', en: 'Preset themes' },
        'Elegí un estilo listo; se aplica al instante en todo el cliente.': { pt: 'Escolha um estilo pronto; aplica na hora em todo o cliente.', es: 'Elegí un estilo listo; se aplica al instante en todo el cliente.', en: 'Pick a ready-made style; it applies instantly across the client.' },
        'Fondo de pantalla': { pt: 'Fundo de tela', es: 'Fondo de pantalla', en: 'Wallpaper' },
        'Imagen a pantalla completa detrás del juego (una sola capa).': { pt: 'Imagem em tela cheia atrás do jogo (uma única camada).', es: 'Imagen a pantalla completa detrás del juego (una sola capa).', en: 'Full-screen image behind the game (single layer).' },
        'El fondo es independiente del tema personalizado; funciona con cualquier tema.': { pt: 'O fundo é independente do tema personalizado; funciona com qualquer tema.', es: 'El fondo es independiente del tema personalizado; funciona con cualquier tema.', en: 'Wallpaper is separate from the custom theme; it works with any preset theme.' },
        'Colores y vista previa': { pt: 'Cores e pré-visualização', es: 'Colores y vista previa', en: 'Colors and preview' },
        'Editá el tema personalizado y tocá Aplicar para guardarlo.': { pt: 'Edite o tema personalizado e toque Aplicar para salvar.', es: 'Editá el tema personalizado y tocá Aplicar para guardarlo.', en: 'Edit the custom theme and tap Apply to save it.' },
        'Theme group presets': { pt: 'Temas', es: 'Temas', en: 'Themes' },
        'Theme group presets desc': { pt: 'Escolha um preset.', es: 'Elegí un preset.', en: 'Pick a preset.' },
        'Theme group wallpaper desc': { pt: 'Imagem atrás do jogo.', es: 'Imagen detrás del juego.', en: 'Image behind the game.' },
        'Theme group custom': { pt: 'Cores', es: 'Colores', en: 'Colours' },
        'Theme group custom desc': { pt: 'Editor e pré-visualização.', es: 'Editor y vista previa.', en: 'Editor and preview.' },
        'Theme custom short hint': { pt: 'Ajuste as cores e toque Aplicar.', es: 'Ajustá los colores y tocá Aplicar.', en: 'Adjust colours and tap Apply.' },
        'Theme wallpaper short hint': { pt: 'Opcional. Independente do tema.', es: 'Opcional. Independiente del tema.', en: 'Optional. Independent of theme.' },
        'Glass UI title': { pt: 'Glass UI', es: 'Glass UI', en: 'Glass UI' },
        'Glass UI hint': { pt: 'Só moldura: cantos, borda e sombra leve. Mantém as cores do tema.', es: 'Solo marco: esquinas, borde y sombra suave. No cambia los colores del tema.', en: 'Frame only: rounded corners, border, soft shadow. Keeps your theme colours.' },
        'Theme seg themes': { pt: 'Temas', es: 'Temas', en: 'Themes' },
        'Theme seg wallpaper': { pt: 'Fundo', es: 'Fondo', en: 'Wallpaper' },
        'Theme seg colors': { pt: 'Cores', es: 'Colores', en: 'Colours' },
        'Theme tab intro line': { pt: 'Use as abas abaixo: temas prontos, imagem de fundo ou editor de cores.', es: 'Usá las pestañas: temas listos, fondo de pantalla o editor de colores.', en: 'Use the tabs below: ready-made themes, wallpaper, or the colour editor.' },
        'Perf tab intro line': { pt: 'Escolha uma categoria e toque nas opções para ativar ou desativar.', es: 'Elegí una categoría y tocá las opciones para activarlas o desactivarlas.', en: 'Pick a category and tap the options to turn them on or off.' },
        'Perf opt low latency title': { pt: 'Canvas de baixa latência', es: 'Canvas de baja latencia', en: 'Low-latency canvas' },
        'Perf opt low latency desc': { pt: 'Por defeito igual ao HaxBall web (desativado): menos trabalho ao compositar. Em Vídeo podes ligar para desenhar com menos um frame de atraso (mais CPU em alguns PCs).', es: 'Por defecto como HaxBall web (apagado): mismo canvas estándar. Podés activarlo en Vídeo si querés menos un frame de lag al dibujar (en algunos PCs sube el uso de CPU).', en: 'Default matches HaxBall web (off): standard compositing. Turn on in Video to trim one frame of draw latency (may use more CPU on some PCs).' },
        'Perf opt team colors title': { pt: 'Cores de equipa personalizadas', es: 'Colores de equipo personalizados', en: 'Custom team colours' },
        'Perf opt team colors desc': { pt: 'Igual à opção em Vídeo: ativa cores personalizadas por jogador (ligeiramente mais trabalho para a GPU).', es: 'Igual que en Vídeo: activa colores personalizados por jugador (algo más de trabajo para la GPU).', en: 'Same as in Video: enables per-player custom colours (slightly more GPU work).' },
        'Glass UI': { pt: 'Glass UI', es: 'Glass UI', en: 'Glass UI' },
        'Campo y render': { pt: 'Campo e render', es: 'Campo y render', en: 'Field and render' },
        'Controla líneas, curvas y elementos base del mapa.': { pt: 'Controla linhas, curvas e elementos base do mapa.', es: 'Controla líneas, curvas y elementos base del mapa.', en: 'Controls lines, curves, and core map elements.' },
        'Jugadores y HUD': { pt: 'Jogadores e HUD', es: 'Jugadores y HUD', en: 'Players and HUD' },
        'Reduce nombres, avatares, indicadores y animaciones visibles.': { pt: 'Reduz nomes, avatares, indicadores e animações visíveis.', es: 'Reduce nombres, avatares, indicadores y animaciones visibles.', en: 'Reduces names, avatars, indicators, and visible animations.' },
        'Calidad visual': { pt: 'Qualidade visual', es: 'Calidad visual', en: 'Visual quality' },
        'Ajustes que simplifican el dibujo y alivian la carga gráfica.': { pt: 'Ajustes que simplificam o desenho e aliviam a carga gráfica.', es: 'Ajustes que simplifican el dibujo y alivian la carga gráfica.', en: 'Settings that simplify rendering and reduce graphic load.' },
        'Sistema': { pt: 'Sistema', es: 'Sistema', en: 'System' },
        'Opciones sensibles que impactan más fuerte en el rendimiento.': { pt: 'Opções sensíveis que impactam mais forte no rendimento.', es: 'Opciones sensibles que impactan más fuerte en el rendimiento.', en: 'Sensitive options with stronger performance impact.' },

        // === EXTENSÃO - SETTINGS (game-min.js) ===
        'Desempenho': { pt: 'Desempenho', es: 'Rendimiento', en: 'Performance' },
        'Ative as opções para melhorar o FPS.': { pt: 'Ative as opções para melhorar o FPS.', es: 'Activa las opciones para mejorar el FPS.', en: 'Enable options to improve FPS.' },
        'Linhas simplificadas': { pt: 'Linhas simplificadas', es: 'Líneas simplificadas', en: 'Simplified lines' },
        'Reduz a espessura das linhas do campo de 3px para 1px. Menos pixels para desenhar.': { pt: 'Reduz a espessura das linhas do campo de 3px para 1px. Menos pixels para desenhar.', es: 'Reduce el grosor de las líneas del campo de 3px a 1px. Menos píxeles para dibujar.', en: 'Reduces field line thickness from 3px to 1px. Fewer pixels to draw.' },
        'Curvas viram retas': { pt: 'Curvas viram retas', es: 'Curvas se vuelven rectas', en: 'Curves become lines' },
        'Converte todas as linhas curvas em retas. Desenhar retas é muito mais rápido que arcos.': { pt: 'Converte todas as linhas curvas em retas. Desenhar retas é muito mais rápido que arcos.', es: 'Convierte todas las líneas curvas en rectas. Dibujar rectas es mucho más rápido que arcos.', en: 'Converts curved lines into straight lines. Straight lines render much faster than arcs.' },
        'Culling de viewport': { pt: 'Culling de viewport', es: 'Culling de viewport', en: 'Viewport culling' },
        'Não desenha objetos fora da tela. Em mapas grandes, evita renderizar o que você não vê.': { pt: 'Não desenha objetos fora da tela. Em mapas grandes, evita renderizar o que você não vê.', es: 'No dibuja objetos fuera de la pantalla. En mapas grandes, evita renderizar lo que no ves.', en: 'Skips drawing objects outside the screen. On large maps, it avoids rendering what you cannot see.' },
        'Desativar avatares': { pt: 'Desativar avatares', es: 'Desactivar avatares', en: 'Disable avatars' },
        'Remove avatares personalizados e usa círculos sólidos nos outros jogadores. Mantém seu próprio avatar.': { pt: 'Remove avatares personalizados e usa círculos sólidos nos outros jogadores. Mantém seu próprio avatar.', es: 'Elimina los avatares personalizados y usa círculos sólidos en los demás jugadores. Mantiene tu propio avatar.', en: 'Removes custom avatars and uses solid circles for other players. Keeps your own avatar.' },
        'Desativar nomes': { pt: 'Desativar nomes', es: 'Desactivar nombres', en: 'Disable names' },
        'Esconde os nomes dos jogadores. Menos texto para renderizar.': { pt: 'Esconde os nomes dos jogadores. Menos texto para renderizar.', es: 'Oculta los nombres de los jugadores. Menos texto para renderizar.', en: 'Hides player names. Less text to render.' },
        'Campo simplificado': { pt: 'Campo simplificado', es: 'Campo simplificado', en: 'Simplified field' },
        'Usa cores sólidas no campo ao invés de gradientes. Renderização mais simples.': { pt: 'Usa cores sólidas no campo ao invés de gradientes. Renderização mais simples.', es: 'Usa colores sólidos en el campo en lugar de degradados. Renderizado más simple.', en: 'Uses solid colors on the field instead of gradients. Simpler rendering.' },
        'Círculos de baixa qualidade': { pt: 'Círculos de baixa qualidade', es: 'Círculos de baja calidad', en: 'Low quality circles' },
        'Pré-renderiza os círculos. Mais rápido mas visual pixelado.': { pt: 'Pré-renderiza os círculos. Mais rápido mas visual pixelado.', es: 'Pre-renderiza los círculos. Más rápido pero visual pixelado.', en: 'Pre-renders circles. Faster, but more pixelated visually.' },
        'Gráficos brutos': { pt: 'Gráficos brutos', es: 'Gráficos crudos', en: 'Raw graphics' },
        'Desativa suavização de imagens. Visual mais pixelado mas processamento mais rápido.': { pt: 'Desativa suavização de imagens. Visual mais pixelado mas processamento mais rápido.', es: 'Desactiva el suavizado de imágenes. Visual más pixelado pero procesamiento más rápido.', en: 'Disables image smoothing. More pixelated look, but faster processing.' },
        'Desativar animações de gol': { pt: 'Desativar animações de gol', es: 'Desactivar animaciones de gol', en: 'Disable goal animations' },
        'Remove as animações quando um gol é marcado. Evita quedas de FPS momentâneas.': { pt: 'Remove as animações quando um gol é marcado. Evita quedas de FPS momentâneas.', es: 'Elimina las animaciones cuando se marca un gol. Evita caídas de FPS momentáneas.', en: 'Removes animations when a goal is scored. Helps avoid temporary FPS drops.' },
        'Desativar indicador do jogador': { pt: 'Desativar indicador do jogador', es: 'Desactivar indicador del jugador', en: 'Disable player indicator' },
        'Mostrar nome no indicador': { pt: 'Mostrar nome no indicador', es: 'Mostrar nombre en el indicador', en: 'Show name on indicator' },
        'Exibe seu nome junto ao círculo que indica sua posição em campo.': { pt: 'Exibe seu nome junto ao círculo que indica sua posição em campo.', es: 'Muestra tu nombre junto al círculo que indica tu posición en el campo.', en: 'Shows your name next to the indicator circle on the field.' },
        'A seta que mostra onde você está. Economiza um pouco de renderização.': { pt: 'A seta que mostra onde você está. Economiza um pouco de renderização.', es: 'La flecha que muestra dónde estás. Ahorra un poco de renderizado.', en: 'The arrow that shows where you are. Saves a bit of rendering.' },
        'Desativar indicador de chat': { pt: 'Desativar indicador de chat', es: 'Desactivar indicador de chat', en: 'Disable chat indicator' },
        'O balão que aparece quando alguém fala. Remove essa renderização extra.': { pt: 'O balão que aparece quando alguém fala. Remove essa renderização extra.', es: 'El globo que aparece cuando alguien habla. Elimina ese renderizado extra.', en: 'The bubble that appears when someone talks. Removes that extra rendering.' },
        'Alta prioridade': { pt: 'Alta prioridade', es: 'Alta prioridad', en: 'High priority' },
        'Dá mais recursos do sistema para o jogo. Pode travar outros programas. Use com cuidado!': { pt: 'Dá mais recursos do sistema para o jogo. Pode travar outros programas. Use com cuidado!', es: 'Da más recursos del sistema al juego. Puede bloquear otros programas. ¡Usa con cuidado!', en: 'Gives more system resources to the game. It may affect other programs. Use carefully.' },
        'Cuidado': { pt: 'Cuidado', es: 'Cuidado', en: 'Warning' },
        'Mostrar nomes dos jogadores': { pt: 'Mostrar nomes dos jogadores', es: 'Mostrar nombres de jugadores', en: 'Show player names' },
        'Mostrar avatares e cores': { pt: 'Mostrar avatares e cores', es: 'Mostrar avatares y colores', en: 'Show avatars and colors' },
        'Mostrar indicador do jogador': { pt: 'Mostrar indicador do jogador', es: 'Mostrar indicador del jugador', en: 'Show player indicator' },
        'Mostrar animações de gol': { pt: 'Mostrar animações de gol', es: 'Mostrar animaciones de gol', en: 'Show goal animations' },
        'Mostrar indicador de chat': { pt: 'Mostrar indicador de chat', es: 'Mostrar indicador de chat', en: 'Show chat indicator' },
        'Alta prioridade (pode travar o sistema)': { pt: 'Alta prioridade (pode travar o sistema)', es: 'Alta prioridad (puede bloquear el sistema)', en: 'High priority (may affect the system)' },
        'Culling de viewport (não desenhar fora da tela)': { pt: 'Culling de viewport (não desenhar fora da tela)', es: 'Culling de viewport (no dibujar fuera de pantalla)', en: 'Viewport culling (skip off-screen drawing)' },

        // Labels en el HTML vanilla (sound/video) — clave = texto por defecto en inglés o PT del game-min
        'Sounds enabled': { pt: 'Sons ativados', es: 'Sonidos activados', en: 'Sounds enabled' },
        'Chat sound enabled': { pt: 'Som do chat ativado', es: 'Sonido del chat activado', en: 'Chat sound enabled' },
        'Nick highlight sound enabled': { pt: 'Som de destaque do nick ativado', es: 'Sonido de mención del nick activado', en: 'Nick highlight sound enabled' },
        'Crowd sound enabled': { pt: 'Som da torcida ativado', es: 'Sonido de hinchada activado', en: 'Crowd sound enabled' },
        'Kick / ball hit sound': { pt: 'Som de chute / bola', es: 'Sonido de patada / pelota', en: 'Kick / ball hit sound' },
        'Goal sound': { pt: 'Som de gol', es: 'Sonido de gol', en: 'Goal sound' },
        'Player join sound': { pt: 'Som ao entrar jogador', es: 'Sonido al entrar jugador', en: 'Player join sound' },
        'Player leave sound': { pt: 'Som ao sair jogador', es: 'Sonido al salir jugador', en: 'Player leave sound' },
        'Use low latency canvas': { pt: 'Usar canvas de baixa latência', es: 'Usar canvas de baja latencia', en: 'Use low latency canvas' },
        'Custom team colors enabled': { pt: 'Cores de time personalizadas ativadas', es: 'Colores de equipo personalizados activados', en: 'Custom team colors enabled' },
        'Show player avatars': { pt: 'Mostrar avatares dos jogadores', es: 'Mostrar avatares de jugadores', en: 'Show player avatars' },
        'Qualidade:': { pt: 'Qualidade:', es: 'Calidad:', en: 'Quality:' },
        'HD': { pt: 'HD', es: 'HD', en: 'HD' },

        // === EXTENSÃO - EXPORT/IMPORT RENDIMIENTO (WAD) ===
        'Copia y respaldo': { pt: 'Cópia e backup', es: 'Copia y respaldo', en: 'Copy and backup' },
        'hxd_perf_export_tip': {
            pt: 'Inclui limite de FPS, escala, resolução esticada, perfil rápido, extrapolação e HUD opcional. Códigos do cliente antigo continuam válidos.',
            es: 'Incluye límite de FPS, escala, resolución estirada, perfil rápido, extrapolación y HUD opcional. Los códigos del cliente viejo siguen siendo válidos.',
            en: 'Includes FPS cap, scaling, stretched resolution, quick profile, extrapolation, and optional HUD. Codes from the older client still work.'
        },
        'Pegá acá el código exportado': { pt: 'Cole aqui o código exportado', es: 'Pegá acá el código exportado', en: 'Paste the exported code here' },
        'No se ingresó ningún código': { pt: 'Nenhum código foi informado', es: 'No se ingresó ningún código', en: 'No code was entered' },
        'Exportar': { pt: 'Exportar', es: 'Exportar', en: 'Export' },
        'Importar': { pt: 'Importar', es: 'Importar', en: 'Import' },
        'Copiado!': { pt: 'Copiado!', es: '¡Copiado!', en: 'Copied!' },
        'Aplicado! Recarregue': { pt: 'Aplicado! Recarregue', es: '¡Aplicado! Recargá', en: 'Applied! Reload' },
        'Código inválido': { pt: 'Código inválido', es: 'Código inválido', en: 'Invalid code' },

        // === EXTENSÃO - CHAT COMMANDS ===
        'Mutados:': { pt: 'Mutados:', es: 'Silenciados:' },
        'Nenhum jogador mutado': { pt: 'Nenhum jogador mutado', es: 'Ningún jugador silenciado' },

        // === EXTENSÃO - QUICK AVATAR ===
        'Defina teclas de atalho para trocar de avatar rapidamente durante o jogo.': { pt: 'Defina teclas de atalho para trocar de avatar rapidamente durante o jogo.', es: 'Define teclas de acceso rápido para cambiar de avatar rápidamente durante el juego.' },
        'Adicionar atalho': { pt: 'Adicionar atalho', es: 'Añadir atajo' },
        'Novo Atalho': { pt: 'Novo Atalho', es: 'Nuevo Atajo' },
        'Editar Atalho': { pt: 'Editar Atalho', es: 'Editar Atajo' },
        'Tecla de Atalho': { pt: 'Tecla de Atalho', es: 'Tecla de Atajo' },
        'Avatar (emoji ou texto)': { pt: 'Avatar (emoji ou texto)', es: 'Avatar (emoji o texto)' },
        'Clique para definir tecla': { pt: 'Clique para definir tecla', es: 'Haz clic para definir tecla' },
        'Pressione uma tecla...': { pt: 'Pressione uma tecla...', es: 'Presiona una tecla...' },
        'Tecla inválida, tente outra': { pt: 'Tecla inválida, tente outra', es: 'Tecla inválida, intenta otra' },
        'Atajo de Extrapolation': { pt: 'Atalho de Extrapolation', es: 'Atajo de Extrapolation', en: 'Extrapolation Shortcut' },
        'Define una tecla y un valor para aplicar extrapolation automáticamente durante la partida.': { pt: 'Defina uma tecla e um valor para aplicar extrapolation automaticamente durante a partida.', es: 'Define una tecla y un valor para aplicar extrapolation automáticamente durante la partida.', en: 'Choose a key and a value to apply extrapolation automatically during the match.' },
        'Valor de Extrapolation': { pt: 'Valor do Extrapolation', es: 'Valor de Extrapolation', en: 'Extrapolation Value' },
        'Al tocar esa tecla se enviará el comando /extrapolation con el valor configurado.': { pt: 'Ao tocar essa tecla, será enviado o comando /extrapolation com o valor configurado.', es: 'Al tocar esa tecla se enviará el comando /extrapolation con el valor configurado.', en: 'Pressing that key sends /extrapolation with the configured value.' },
        'Extrapolation': { pt: 'Extrapolation', es: 'Extrapolation', en: 'Extrapolation' },
        'Asigna una tecla a un valor de extrapolación. Al presionar la tecla durante el juego, se aplica automáticamente.': { pt: 'Associe uma tecla a um valor de extrapolação. Ao pressionar a tecla durante o jogo, ela será aplicada automaticamente.', es: 'Asigna una tecla a un valor de extrapolación. Al presionar la tecla durante el juego, se aplica automáticamente.', en: 'Assign a key to an extrapolation value. Press it during the match to apply it instantly.' },
        'Todavía no configuraste atajos de extrapolation.': { pt: 'Você ainda não configurou atalhos de extrapolation.', es: 'Todavía no configuraste atajos de extrapolation.', en: 'You have not configured any extrapolation shortcuts yet.' },
        'Nuevo atajo': { pt: 'Novo atalho', es: 'Nuevo atajo', en: 'New shortcut' },
        'TECLA': { pt: 'TECLA', es: 'TECLA', en: 'KEY' },
        'Probar': { pt: 'Testar', es: 'Probar', en: 'Test' },
        'Añadir': { pt: 'Adicionar', es: 'Añadir', en: 'Add' },
        'Ej: tecla X -> 300 ms. Funciona durante la partida siempre que no estés escribiendo en el chat.': { pt: 'Ex: tecla X -> 300 ms. Funciona durante a partida desde que você não esteja digitando no chat.', es: 'Ej: tecla X -> 300 ms. Funciona durante la partida siempre que no estés escribiendo en el chat.', en: 'Example: key X -> 300 ms. Works during the match as long as you are not typing in chat.' },
        'Editar': { pt: 'Editar', es: 'Editar' },
        'Salvar': { pt: 'Salvar', es: 'Guardar', en: 'Save' },
        'vazio': { pt: 'vazio', es: 'vacío' },

        // === EXTENSÃO - HOST TOKEN ===
        'Configure seu host token para criar salas sem captcha.': { pt: 'Configure seu host token para criar salas sem captcha.', es: 'Configura tu host token para crear salas sin captcha.', en: 'Set your host token to create rooms without captcha.' },
        'Cole seu host token aqui': { pt: 'Cole seu host token aqui', es: 'Pega tu host token aquí', en: 'Paste your host token here' },
        'Limpar': { pt: 'Limpar', es: 'Limpiar', en: 'Clear' },
        'Cómo sacar tu Host Token': { pt: 'Como obter seu Host Token', es: 'Cómo sacar tu Host Token', en: 'How to get your Host Token' },
        'Entrá al link oficial de HaxBall.': { pt: 'Acesse o link oficial do HaxBall.', es: 'Entrá al link oficial de HaxBall.', en: 'Open the official HaxBall link.' },
        'Iniciá sesión y generá tu token.': { pt: 'Faça login e gere seu token.', es: 'Iniciá sesión y generá tu token.', en: 'Log in and generate your token.' },
        'Copialo y pegalo acá abajo.': { pt: 'Copie e cole abaixo.', es: 'Copialo y pegalo acá abajo.', en: 'Copy it and paste it below.' },

        // === EXTENSÃO - HIDE UI ===
        'Ocultar Chat': { pt: 'Ocultar Chat', es: 'Ocultar Chat', en: 'Hide chat' },
        'Ocultar Placar/Timer': { pt: 'Ocultar Placar/Timer', es: 'Ocultar Marcador/Tiempo', en: 'Hide scoreboard / timer' },
        'Ocultar Ping/FPS': { pt: 'Ocultar Ping/FPS', es: 'Ocultar Ping/FPS', en: 'Hide ping / FPS' },

        // === EXTENSÃO - PRO ===
        'Desbloqueie recursos exclusivos:': { pt: 'Desbloqueie recursos exclusivos:', es: 'Desbloquea recursos exclusivos:' },
        'Verificado automático': { pt: 'Verificado automático', es: 'Verificado automático' },
        'Cor personalizada do verificado': { pt: 'Cor personalizada do verificado', es: 'Color personalizado del verificado' },
        'Cor do nick na lista': { pt: 'Cor do nick na lista', es: 'Color del nick en la lista' },
        'Banners exclusivos na lista': { pt: 'Banners exclusivos na lista', es: 'Banners exclusivos en la lista' },
        'Banner Exclusivo': { pt: 'Banner Exclusivo', es: 'Banner Exclusivo' },
        'Fonte personalizada do nick': { pt: 'Fonte personalizada do nick', es: 'Fuente personalizada del nick' },
        'Fonte do Nick': { pt: 'Fonte do Nick', es: 'Fuente del Nick' },
        'Fonte': { pt: 'Fonte', es: 'Fuente' },
        'Mostrar verificado': { pt: 'Mostrar verificado', es: 'Mostrar verificado', en: 'Show verified' },
        'Muestra u oculta badges, banners y estilos especiales del sistema verificado.': { pt: 'Mostra ou oculta badges, banners e estilos especiais do sistema verificado.', es: 'Muestra u oculta badges, banners y estilos especiales del sistema verificado.', en: 'Show or hide badges, banners, and special styles from the verified system.' },
        'Zero zoom': { pt: 'Zero zoom', es: 'Zero zoom', en: 'Zero zoom' },
        'Zero zoom hint': {
            pt: 'Ativado: zoom do cliente (Ctrl+/- na janela e no corpo). Desativado: zoom por defeito, como o HaxBall no browser.',
            es: 'Activado: zoom del cliente (Ctrl +/- en ventana y cuerpo). Desactivado: zoom por defecto, como HaxBall en el navegador.',
            en: 'On: client zoom (Ctrl +/- on window and page). Off: default zoom like browser HaxBall.'
        },
        'Misc tooltip verificado': {
            pt: 'Ligado: vês selos, cores e detalhes especiais de contas verificadas e Pro nas salas e listas. Desligado: isso some e o visual fica mais simples.',
            es: 'Activado: ves sellos, colores y detalles especiales de cuentas verificadas y Pro en salas y listas. Desactivado: se ocultan y el juego se ve más simple.',
            en: 'On: you see verified/Pro badges and styling in rooms and lists. Off: those extras are hidden for a cleaner look.'
        },
        'Misc tooltip zero zoom': {
            pt: 'Ligado: o zoom da janela e o “tamanho do campo” funcionam no estilo deste app. Desligado: iguais ao HaxBall no navegador (zoom e vistas 1–7 como no site).',
            es: 'Activado: el zoom de la ventana y cómo se ve el campo son los de este programa. Desactivado: iguales al HaxBall del navegador (teclas 1–7 y zoom como en la web).',
            en: 'On: window zoom and field view work like this app. Off: same as browser HaxBall (keys 1–7 and zoom like on the website).'
        },
        'Banner': { pt: 'Banner', es: 'Banner' },
        'Cor do Nick': { pt: 'Cor do Nick', es: 'Color del Nick' },
        'Criar equipes': { pt: 'Criar equipes', es: 'Crear equipos' },
        'Suporte prioritário': { pt: 'Suporte prioritário', es: 'Soporte prioritario' },
        'Acesso antecipado às novidades': { pt: 'Acesso antecipado às novidades', es: 'Acceso anticipado a las novedades' },
        'Assinar Pro - $4/mês': { pt: 'Assinar Pro - $4/mês', es: 'Suscribirse Pro - $4/mes' },
        'Assinar por $4/mês': { pt: 'Assinar por $4/mês', es: 'Suscribirse por $4/mes' },
        'Pro upsell title': { pt: 'HaxBall Zero Pro', es: 'HaxBall Zero Pro', en: 'HaxBall Zero Pro' },
        'Pro upsell short': {
            pt: 'Nick, chat e banner personalizados, selo verificado, criar equipas e acesso antecipado a novidades.',
            es: 'Nick, chat y banner personalizados, verificado exclusivo, crear equipos y acceso anticipado.',
            en: 'Custom nick, chat & banner, verified badge, team creation, and early access.'
        },
        'Pro price line': { pt: '5.000 ARS · 4 USD · R$ 20', es: '5.000 ARS · 4 USD · R$ 20', en: '5.000 ARS · 4 USD · R$ 20' },
        'Pro discord only note': {
            pt: 'Todas as compras e ativações são feitas pelo servidor oficial no Discord.',
            es: 'Todas las compras y altas se gestionan por Discord en el servidor oficial.',
            en: 'All purchases and activations are handled on our official Discord server.'
        },
        'Pro open discord': { pt: 'Abrir Discord', es: 'Abrir Discord', en: 'Open Discord' },
        'Equipo solo invitacion hint': {
            pt: 'Para entrar numa equipa, precisas de um convite enviado pelo líder no painel (Discord). Links públicos por código não são usados aqui.',
            es: 'Para sumarte a un equipo necesitás una invitación que mande un líder desde el panel (Discord). No usamos alta por código pegado.',
            en: 'To join a team you need an invite sent by a leader from the team panel (Discord). Paste-code join is not used here.'
        },
        'Pro benefit row 1': {
            pt: 'Nick e cores personalizados no cliente.',
            es: 'Nick y colores personalizados en el cliente.',
            en: 'Custom nick and colours in the client.'
        },
        'Pro benefit row 2': {
            pt: 'Chat e banner personalizados na sala.',
            es: 'Chat y banner personalizados en la sala.',
            en: 'Custom chat and banner in the room.'
        },
        'Pro benefit row 3': {
            pt: 'Badge verificado na lista de jogadores.',
            es: 'Badge verificado en la lista de jugadores.',
            en: 'Verified badge in the player list.'
        },
        'Pro benefit row 4': {
            pt: 'Criar equipas e branding Pro (logo, tag).',
            es: 'Crear equipos y branding Pro (logo, sigla).',
            en: 'Create teams and Pro branding (logo, tag).'
        },
        'Pro benefit row 5': {
            pt: 'Suporte prioritário e novidades em antecipação.',
            es: 'Soporte prioritario y acceso anticipado a novedades.',
            en: 'Priority support and early access to new features.'
        },
        'Adquirir com Boost': { pt: 'Adquirir com Boost', es: 'Obtener con Boost' },
        'Verificando...': { pt: 'Verificando...', es: 'Verificando...' },
        'PRO Ativado!': { pt: 'PRO Ativado!', es: '¡PRO Activado!' },
        'Faça logout e login novamente': { pt: 'Faça logout e login novamente', es: 'Cierra sesión e inicia sesión de nuevo' },
        'Dê boost no Discord primeiro': { pt: 'Dê boost no Discord primeiro', es: 'Da boost en Discord primero' },
        'Erro ao verificar': { pt: 'Erro ao verificar', es: 'Error al verificar' },
        'Pagamento seguro via Stripe': { pt: 'Pagamento seguro via Stripe', es: 'Pago seguro vía Stripe' },
        'Ativo': { pt: 'Ativo', es: 'Activo', en: 'Active' },
        'Pro preview badge verificado sí': {
            pt: 'Badge verificado na lista: sim',
            es: 'Badge verificado en la lista: sí',
            en: 'Verified badge in the list: yes'
        },
        'Pro preview badge verificado no': {
            pt: 'Badge verificado na lista: não',
            es: 'Badge verificado en la lista: no',
            en: 'Verified badge in the list: no'
        },
        'Pro nav perfil': { pt: 'Perfil', es: 'Perfil', en: 'Profile' },
        'Pro nav sonidos': { pt: 'Sons personalizados', es: 'Sonidos personalizados', en: 'Custom sounds' },
        'Pro nav goal': { pt: 'Golo', es: 'Gol', en: 'Goal' },
        'Pro goal sec about': { pt: 'Sobre a celebração', es: 'Información', en: 'About' },
        'Pro goal enable tag': { pt: 'Celebração', es: 'Celebración', en: 'Celebration' },
        'Pro goal enable act': { pt: 'Ativar', es: 'Activar', en: 'Enable' },
        'Pro goal intro': {
            pt: 'Quando marcas golo, mostramos o teu texto e tocamos o teu hino (URL HTTPS). Toda a gente com o cliente vê; o volume do hino é limitado (~60% do volume mestre).',
            es: 'Cuando metés gol, mostramos tu texto y sonamos tu himno (solo enlace HTTPS). Todos los que usan el cliente lo ven; el volumen del himno está limitado (~60% del volumen maestro).',
            en: 'When you score, we show your text and play your anthem (HTTPS link only). Everyone using the client sees it; anthem volume is capped (~60% of master volume).'
        },
        'Pro goal enable': { pt: 'Ativar celebração de golo', es: 'Activar celebración de gol', en: 'Enable goal celebration' },
        'Pro goal text lbl': { pt: 'Texto no ecrã', es: 'Texto en pantalla', en: 'On-screen text' },
        'Pro goal text ph': { pt: 'Ex.: GOLAZO', es: 'Ej.: GOLAZO', en: 'E.g. BANGER' },
        'Pro goal text hint': {
            pt: 'Máx. 20 caracteres. Curto, limpo e sem abuso.',
            es: 'Máximo 20 caracteres. Corto, limpio y sin abuso.',
            en: 'Max 20 characters. Short, clean, no abuse.'
        },
        'Pro goal url lbl': { pt: 'URL do áudio (HTTPS)', es: 'URL del audio (HTTPS)', en: 'Audio URL (HTTPS)' },
        'Pro goal url hint': {
            pt: 'Opcional. Tem de começar por https://',
            es: 'Opcional. Debe empezar por https://',
            en: 'Optional. Must start with https://'
        },
        'Pro goal save': { pt: 'Guardar celebração', es: 'Guardar celebración', en: 'Save celebration' },
        'Pro goal saved': { pt: 'Guardado', es: 'Guardado', en: 'Saved' },
        'Pro goal save err': { pt: 'Erro ao guardar', es: 'Error al guardar', en: 'Save failed' },
        'Pro goal sec opts': { pt: 'Texto e URL', es: 'Texto y URL', en: 'Text & URL' },
        'Pro goal foot hint': {
            pt: 'O áudio do hino fica ~60% do volume mestre do jogo. Quem usa o cliente vê o texto e ouve o mesmo URL.',
            es: 'El himno suena a ~60% del volumen maestro del juego. Quien use el cliente ve el texto y escucha el mismo enlace.',
            en: 'Anthem plays at ~60% of in-game master volume. Anyone with the client sees the text and hears the same URL.'
        },
        'Pro sec colors': { pt: 'Cores', es: 'Colores', en: 'Colours' },
        'Pro sec look': { pt: 'Tipo e aparência', es: 'Tipografía y banner', en: 'Type & banner' },
        'Pro lbl verified': { pt: 'Verificado', es: 'Verificado', en: 'Verified' },
        'Pro lbl nick': { pt: 'Nick', es: 'Nick', en: 'Nick' },
        'Pro sounds intro': {
            pt: 'Um ficheiro por som. Guarda no fim. Pro ativo.',
            es: 'Un archivo por sonido. Guardá al final. Con Pro activo.',
            en: 'One file per sound. Save at the end. Pro required.'
        },
        'Pro sounds file loaded': { pt: 'Ficheiro carregado', es: 'Archivo cargado', en: 'File loaded' },
        'Pro sounds no file': { pt: 'Nenhum ficheiro', es: 'Sin archivo', en: 'No file' },
        'Pro sounds save error': {
            pt: 'Não foi possível guardar (ficheiros muito grandes ou armazenamento cheio).',
            es: 'No se pudo guardar (archivos muy grandes o almacenamiento lleno).',
            en: 'Could not save (files too large or storage full).'
        },
        'Pro sounds enable': { pt: 'Ativar sons personalizados', es: 'Activar sonidos personalizados', en: 'Enable custom sounds' },
        'Pro sounds save': { pt: 'Guardar sons', es: 'Guardar sonidos', en: 'Save sounds' },
        'Pro sounds saved': { pt: 'Sons guardados', es: 'Sonidos guardados', en: 'Sounds saved' },
        'Pro sounds pick file': { pt: 'Escolher ficheiro', es: 'Elegir archivo', en: 'Pick file' },
        'Pro sounds test': { pt: 'Testar', es: 'Probar', en: 'Test' },
        'Pro sounds silent hint': { pt: 'Sem ficheiro', es: 'Sin archivo', en: 'No file' },
        'Pro sounds silent btn': { pt: 'Sem som', es: 'Sin sonido', en: 'No sound' },
        'Pro sounds remove btn': { pt: 'Quitar', es: 'Quitar', en: 'Remove' },
        'Gradiente': { pt: 'Gradiente', es: 'Gradiente', en: 'Gradient' },
        'Válido até': { pt: 'Válido até', es: 'Válido hasta' },
        'Vitalício': { pt: 'Vitalício', es: 'Vitalicio' },
        'Cor do Verificado': { pt: 'Cor do Verificado', es: 'Color del Verificado' },
        'Cor do Nick na Lista': { pt: 'Cor do Nick na Lista', es: 'Color del Nick en la Lista' },
        'Cor do nick na lista e chat': { pt: 'Cor do nick na lista e chat', es: 'Color del nick en la lista y chat' },
        'Cor do Nick na Lista e Chat': { pt: 'Cor do Nick na Lista e Chat', es: 'Color del Nick en la Lista y Chat' },
        'Preview': { pt: 'Preview', es: 'Vista previa' },
        'Salvando...': { pt: 'Salvando...', es: 'Guardando...' },
        'Salvo!': { pt: 'Salvo!', es: '¡Guardado!' },
        'Recurso Pro': { pt: 'Recurso Pro', es: 'Recurso Pro' },
        'Apenas usuários Pro podem criar equipes.': { pt: 'Apenas usuários Pro podem criar equipes.', es: 'Solo los usuarios Pro pueden crear equipos.' },
        'No tenés Pro': { pt: 'Você não é Pro', es: 'No tenés Pro', en: 'You are not Pro' },
        'Sin Pro solo podés unirte a equipos. Crear equipo y el branding Pro son para usuarios Pro.': {
            pt: 'Sem Pro você só pode entrar em equipes. Criar equipe e o branding Pro são para usuários Pro.',
            es: 'Sin Pro solo podés unirte a equipos. Crear equipo y el branding Pro son para usuarios Pro.',
            en: 'Without Pro you can only join teams. Creating a team and Pro branding are for Pro users.'
        },
        'Sincronizar cores (Nick → Verificado)': { pt: 'Sincronizar cores (Nick → Verificado)', es: 'Sincronizar colores (Nick → Verificado)' },
        'Sincronizado!': { pt: 'Sincronizado!', es: '¡Sincronizado!' },
        'Cores do banner:': { pt: 'Cores do banner:', es: 'Colores del banner:' },
        'Nenhum': { pt: 'Nenhum', es: 'Ninguno', en: 'None' },
        'Ouro': { pt: 'Ouro', es: 'Oro', en: 'Gold' },
        'Diamante': { pt: 'Diamante', es: 'Diamante', en: 'Diamond' },
        'Fogo': { pt: 'Fogo', es: 'Fuego', en: 'Fire' },
        'Esmeralda': { pt: 'Esmeralda', es: 'Esmeralda', en: 'Emerald' },
        'Roxo': { pt: 'Roxo', es: 'Morado', en: 'Purple' },
        'Arco-íris': { pt: 'Arco-íris', es: 'Arcoíris', en: 'Rainbow' },
        'Pôr do Sol': { pt: 'Pôr do Sol', es: 'Atardecer', en: 'Sunset' },
        'Oceano': { pt: 'Oceano', es: 'Océano', en: 'Ocean' },
        'Meia-noite': { pt: 'Meia-noite', es: 'Medianoche', en: 'Midnight' },
        'Cereja': { pt: 'Cereja', es: 'Cereza', en: 'Cherry' },
        'Pelota': { pt: 'Bola', es: 'Pelota', en: 'Ball' },
        'Efecto visual local de la pelota para usuarios Pro.': { pt: 'Efeito visual local da bola para usuários Pro.', es: 'Efecto visual local de la pelota para usuarios Pro.', en: 'Local ball visual effect for Pro users.' },
        'Colores de la pelota:': { pt: 'Cores da bola:', es: 'Colores de la pelota:', en: 'Ball colors:' },
        'Normal': { pt: 'Normal', es: 'Normal', en: 'Normal' },
        'RGB': { pt: 'RGB', es: 'RGB', en: 'RGB' },
        'Rainbow': { pt: 'Rainbow', es: 'Rainbow', en: 'Rainbow' },
        'Fuego': { pt: 'Fogo', es: 'Fuego', en: 'Fire' },
        'Oceano': { pt: 'Oceano', es: 'Oceano', en: 'Ocean' },
        'Sunset': { pt: 'Sunset', es: 'Sunset', en: 'Sunset' },
        'Neon': { pt: 'Neon', es: 'Neon', en: 'Neon' },
        'Gold': { pt: 'Gold', es: 'Gold', en: 'Gold' },
        'Personalizado': { pt: 'Personalizado', es: 'Personalizado', en: 'Custom' },
        'Altere cores, fontes e gradientes do seu nick e chat. Destaque-se na lista de jogadores com banners exclusivos.': { pt: 'Altere cores, fontes e gradientes do seu nick e chat. Destaque-se na lista de jogadores com banners exclusivos.', es: 'Cambia colores, fuentes y gradientes de tu nick y chat. Destácate en la lista de jugadores con banners exclusivos.' },
        'Ganhe um selo de verificado único com a cor que você escolher.': { pt: 'Ganhe um selo de verificado único com a cor que você escolher.', es: 'Obtén un sello de verificado único con el color que elijas.' },
        'Monte sua própria equipe e jogue com amigos usando identidade visual única.': { pt: 'Monte sua própria equipe e jogue com amigos usando identidade visual única.', es: 'Arma tu propio equipo y juega con amigos usando identidad visual única.' },
        'Seja o primeiro a testar novos recursos antes de todo mundo.': { pt: 'Seja o primeiro a testar novos recursos antes de todo mundo.', es: 'Sé el primero en probar nuevos recursos antes que todos.' },
        'Sua assinatura ajuda a manter o aplicativo funcionando e evoluindo.': { pt: 'Sua assinatura ajuda a manter o aplicativo funcionando e evoluindo.', es: 'Tu suscripción ayuda a mantener la app funcionando y evolucionando.' },
        'Assinar por R$19,90/mês': { pt: 'Assinar por R$19,90/mês', es: 'Suscribirse por R$19,90/mes' },

        // === EXTENSÃO - STRETCHED ===
        'Esticar': { pt: 'Esticar', es: 'Estirar' },
        'Nativo': { pt: 'Nativo', es: 'Nativo' },

        // === EXTENSÃO - MODO RENDIMIENTO (DESEMPENHO) ===
        'Modo rendimiento': { pt: 'Modo desempenho', es: 'Modo rendimiento', en: 'Performance mode' },
        'Modo rendimiento — descripción': { pt: 'Perfil agressivo: simplifica o campo, reduz efeitos visuais, canvas de baixa latência e input mais preciso (/input 0). Não altera extrapolation. «Normal» restaura o que estava antes.', es: 'Perfil agresivo: simplifica el campo, recorta HUD y efectos, canvas de baja latencia e input más estricto (/input 0). No cambia la extrapolación. «Normal» restaura tu configuración anterior.', en: 'Aggressive preset: simpler field, lighter HUD/effects, low-latency canvas, stricter /input 0. Does not change extrapolation. “Normal” restores your previous setup.' },
        'Rendimiento — Normal': { pt: 'Normal (restaurar)', es: 'Normal (restaurar)', en: 'Normal (restore)' },
        'Rendimiento — Máximo': { pt: 'Máximo (FPS + menos input lag)', es: 'Máximo (FPS + menos input lag)', en: 'Maximum (FPS + lower input lag)' },

        // === GAME-MIN - QUALITY MODE ===
        'Quality Mode:': { pt: 'Qualidade:', es: 'Calidad:', en: 'Quality:' },
        'Performance (90%)': { pt: 'Desempenho (90%)', es: 'Rendimiento (90%)', en: 'Performance (90%)' },
        'HD (100%)': { pt: 'HD (100%)', es: 'HD (100%)', en: 'HD (100%)' }
    };

    // Função de tradução global
    function t(key) {
        var entry = TRANSLATIONS[key];
        if (!entry) return key;
        return entry[currentLang] || entry['es'] || entry['pt'] || key;
    }

    // Exporta função de tradução
    window.__t = t;
    window.__TRANSLATIONS = TRANSLATIONS;

    function translateElement(el) {
        if (!el) return;
        
        // Ignora elementos que já foram traduzidos ou que são do sistema de compartilhamento
        if (el.dataset.translated || el.getAttribute('data-hook') === 'share-friends') return;
        
        // Só traduz se o elemento não tiver filhos elementos (apenas texto)
        if (el.children.length > 0) {
            // Se tem filhos, só traduz se for um texto direto sem elementos complexos
            var hasOnlyIconChild = el.children.length === 1 && el.children[0].tagName === 'I';
            if (!hasOnlyIconChild) return;
        }
        
        var text = el.textContent.trim();
        var entry = TRANSLATIONS[text];
        if (entry && entry[currentLang]) {
            // Preserva ícones se existirem
            var icon = el.querySelector('i');
            if (icon) {
                var iconClone = icon.cloneNode(true);
                el.textContent = entry[currentLang];
                el.insertBefore(iconClone, el.firstChild);
            } else {
                el.textContent = entry[currentLang];
            }
            el.dataset.translated = 'true';
        }
    }

    function translateAll(doc) {
        // Traduz headers da tabela
        var headers = doc.querySelectorAll('table.header td, th');
        for (var i = 0; i < headers.length; i++) {
            translateElement(headers[i]);
        }

        // Traduz botões
        var buttons = doc.querySelectorAll('button');
        for (var j = 0; j < buttons.length; j++) {
            translateElement(buttons[j]);
        }

        // Traduz títulos
        var titles = doc.querySelectorAll('h1, h2, h3');
        for (var k = 0; k < titles.length; k++) {
            translateElement(titles[k]);
        }

        // Traduz labels
        var labels = doc.querySelectorAll('label, span');
        for (var l = 0; l < labels.length; l++) {
            var text = labels[l].textContent.trim();
            var entry = TRANSLATIONS[text];
            if (entry && entry[currentLang]) {
                labels[l].textContent = entry[currentLang];
            }
        }
    }

    function localizeLocationDialog(dialog) {
        if (!dialog || !dialog.classList || !dialog.classList.contains('change-location-view')) return;
        var doc = dialog.ownerDocument || document;
        if (!doc.getElementById('hxd-location-scrollbar-fix')) {
            var scrollbarStyle = doc.createElement('style');
            scrollbarStyle.id = 'hxd-location-scrollbar-fix';
            scrollbarStyle.textContent = '.change-location-view [data-hook="list"] .ps__rail-x{display:none!important;}';
            doc.head.appendChild(scrollbarStyle);
        }
        var title = dialog.querySelector('h1');
        var change = dialog.querySelector('[data-hook="change"]');
        var cancel = dialog.querySelector('[data-hook="cancel"]');
        if (title) title.textContent = t('Change Location');
        if (change) change.textContent = t('Change');
        if (cancel) cancel.textContent = t('Cancel');

        var displayNames = null;
        try {
            if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
                displayNames = new Intl.DisplayNames([currentLang], { type: 'region' });
            }
        } catch (eDisplayNames) {}
        if (!displayNames) return;

        var list = dialog.querySelector('[data-hook="list"]');
        if (list) {
            list.style.setProperty('overflow-x', 'hidden', 'important');
            list.style.removeProperty('overflow-y');
            list.style.removeProperty('scrollbar-gutter');
            list.style.removeProperty('box-sizing');
            var horizontalRail = list.querySelector('.ps__rail-x');
            if (horizontalRail) horizontalRail.style.setProperty('display', 'none', 'important');
        }
        var countries = dialog.querySelectorAll('[data-hook="list"] .elem');
        for (var i = 0; i < countries.length; i++) {
            var flag = countries[i].querySelector('.flagico');
            if (!flag) continue;
            var match = String(flag.className || '').match(/(?:^|\s)f-([a-z]{2})(?:\s|$)/i);
            if (!match) continue;
            var localized = null;
            try { localized = displayNames.of(match[1].toUpperCase()); } catch (eCountry) {}
            if (!localized || localized.toUpperCase() === match[1].toUpperCase()) continue;
            var nodes = countries[i].childNodes;
            for (var n = nodes.length - 1; n >= 0; n--) {
                if (nodes[n].nodeType === 3) countries[i].removeChild(nodes[n]);
            }
            countries[i].appendChild(document.createTextNode(' ' + localized));
        }
        if (list) {
            var sorted = Array.prototype.slice.call(countries);
            function sortKey(elem) {
                return String(elem.textContent || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            }
            sorted.sort(function (a, b) {
                return sortKey(a).localeCompare(sortKey(b), currentLang, { sensitivity: 'base' });
            });
            for (var s = 0; s < sorted.length; s++) list.appendChild(sorted[s]);
            list.scrollLeft = 0;
        }
        dialog.dataset.hxdCountriesLocalized = currentLang;
    }

    function init() {
        // Traduz inicialmente
        translateAll(document);

        // Usa o sistema de views do core (leve) - traduz quando qualquer view aparece
        if (Injector.isGameFrame()) {
            Injector.onView('view', function(el) {
                translateAll(el);
            });
            Injector.onView('dialog', function(el) {
                translateAll(el);
                localizeLocationDialog(el);
                // Traduz elementos específicos de settings
                translateSettingsDialog(el);
            });
            
            // Observer adicional para garantir tradução do settings
            var settingsObserver = new MutationObserver(function() {
                var locationDialog = document.querySelector('.dialog.change-location-view');
                if (locationDialog && locationDialog.dataset.hxdCountriesLocalized !== currentLang) {
                    localizeLocationDialog(locationDialog);
                }
                var settingsDialog = document.querySelector('.dialog.settings-view');
                if (settingsDialog && !settingsDialog.dataset.translated) {
                    settingsDialog.dataset.translated = 'true';
                    translateSettingsDialog(settingsDialog);
                }
                
                // Também traduz quando a aba misc é selecionada
                var miscSection = document.querySelector('[data-hook="miscsec"].selected');
                if (miscSection && !miscSection.dataset.translated) {
                    miscSection.dataset.translated = currentLang;
                    translateSettingsDialog(document);
                }
            });
            settingsObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }
    }

    // Traduz elementos específicos do dialog de settings (pt / es / en via TRANSLATIONS + t)
    function setSettingsHookText(hookEl, text) {
        if (!hookEl) return;
        var directSpan = null;
        var ch = hookEl.children;
        for (var c = 0; c < ch.length; c++) {
            if (ch[c].tagName === 'SPAN') {
                directSpan = ch[c];
                break;
            }
        }
        if (directSpan) {
            directSpan.textContent = text;
            return;
        }
        var icon = hookEl.querySelector('i');
        if (icon) {
            var childNodes = hookEl.childNodes;
            for (var i = childNodes.length - 1; i >= 0; i--) {
                if (childNodes[i].nodeType === 3) {
                    hookEl.removeChild(childNodes[i]);
                }
            }
            hookEl.appendChild(document.createTextNode(text));
            return;
        }
        hookEl.textContent = text;
    }

    function translateSettingsDialog(el) {
        var root = el || document;

        // Chaves = entradas existentes em TRANSLATIONS (t retorna pt/es/en)
        var hookTranslationKeys = {
            'tmisc-title': 'Desempenho',
            'tmisc-shownames': 'Mostrar nomes dos jogadores',
            'tmisc-showavatars': 'Mostrar avatares e cores',
            'tmisc-lowqualitycircles': 'Círculos de baixa qualidade',
            'tmisc-showindicator': 'Mostrar indicador do jogador',
            'tmisc-indicator-name': 'Mostrar nome no indicador',
            'tmisc-simplelines': 'Linhas simplificadas',
            'tmisc-ultrasimplelines': 'Curvas viram retas',
            'tmisc-simplefield': 'Campo simplificado',
            'tmisc-showanimations': 'Mostrar animações de gol',
            'tmisc-showchat': 'Mostrar indicador de chat',
            'tmisc-highpriority': 'Alta prioridade',
            'tmisc-culling': 'Culling de viewport',
            'tmisc-hideoffscreenarrows': 'Ocultar setas fora da tela',
            'hideui-chat': 'Ocultar Chat',
            'hideui-scoreboard': 'Ocultar Placar/Timer',
            'hideui-pingfps': 'Ocultar Ping/FPS',
            'qualitymode-label': 'Qualidade:',
            'tsound-main': 'Sounds enabled',
            'tsound-chat': 'Chat sound enabled',
            'tsound-highlight': 'Nick highlight sound enabled',
            'tsound-crowd': 'Crowd sound enabled',
            'tsound-kick': 'Kick / ball hit sound',
            'tsound-goal': 'Goal sound',
            'tsound-join': 'Player join sound',
            'tsound-leave': 'Player leave sound',
            'tvideo-lowlatency': 'Use low latency canvas',
            'tvideo-teamcol': 'Custom team colors enabled',
            'tvideo-showavatars': 'Show player avatars'
        };

        for (var hook in hookTranslationKeys) {
            var msgKey = hookTranslationKeys[hook];
            var hookEl = root.querySelector('[data-hook="' + hook + '"]');
            if (!hookEl) hookEl = document.querySelector('[data-hook="' + hook + '"]');
            if (hookEl) {
                setSettingsHookText(hookEl, t(msgKey));
            }
        }

        var qualitySelect = root.querySelector('[data-hook="qualitymode"]');
        if (!qualitySelect) qualitySelect = document.querySelector('[data-hook="qualitymode"]');
        if (qualitySelect && qualitySelect.options && qualitySelect.options.length >= 2) {
            qualitySelect.options[0].text = t('Desempenho');
            qualitySelect.options[1].text = t('HD');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    Injector.log('Translate module loaded (lang: ' + currentLang + ')');
})();
