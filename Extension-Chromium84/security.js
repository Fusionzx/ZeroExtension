// // ============================================
// // SECURITY - Proteções básicas
// // ============================================
// (function() {
//     'use strict';
    
//     // ========== PROTEÇÕES DE TECLADO ==========
    
//     document.addEventListener('keydown', function(e) {
//         // Permite Ctrl+C no chat
//         if (e.ctrlKey && e.key.toUpperCase() === 'C') {
//             var sel = window.getSelection();
//             if (sel && sel.toString().length > 0) {
//                 return;
//             }
//         }
        
//         // Permite Ctrl+V em inputs
//         if (e.ctrlKey && e.key.toUpperCase() === 'V') {
//             var tag = e.target.tagName;
//             if (tag === 'INPUT' || tag === 'TEXTAREA') {
//                 return;
//             }
//         }
        
//         // F12
//         if (e.key === 'F12' || e.keyCode === 123) {
//             e.preventDefault();
//             e.stopPropagation();
//             e.stopImmediatePropagation();
//             return false;
//         }
        
//         // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
//         if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
//             e.preventDefault();
//             e.stopPropagation();
//             e.stopImmediatePropagation();
//             return false;
//         }
        
//         // Ctrl+U (view source)
//         if (e.ctrlKey && e.key.toUpperCase() === 'U') {
//             e.preventDefault();
//             e.stopPropagation();
//             e.stopImmediatePropagation();
//             return false;
//         }
        
//         // Ctrl+S (salvar página)
//         if (e.ctrlKey && e.key.toUpperCase() === 'S') {
//             e.preventDefault();
//             e.stopPropagation();
//             return false;
//         }
        
//         // Ctrl+T (nova aba) e Ctrl+N (nova janela)
//         if (e.ctrlKey && !e.shiftKey && ['T', 'N'].includes(e.key.toUpperCase())) {
//             e.preventDefault();
//             e.stopPropagation();
//             return false;
//         }
        
//         // Ctrl+0, Ctrl+Plus, Ctrl+Minus (zoom)
//         if (e.ctrlKey && ['0', '+', '=', '-', '_'].includes(e.key)) {
//             return;
//         }
//     }, true);
    
//     // ========== PROTEÇÕES DE MOUSE ==========
    
//     // Bloqueia clique direito (exceto em elementos específicos do jogo)
//     document.addEventListener('contextmenu', function(e) {
//         var target = e.target;
        
//         // Verifica se clicou em um jogador individual ou sala individual
//         while (target && target !== document.body) {
//             // Lista de salas - item individual
//             if (target.dataset && target.dataset.hook === 'listscroll') {
//                 return; // Permite na lista de salas
//             }
            
//             if (target.classList) {
//                 var classes = target.className;
//                 if (typeof classes === 'string') {
//                     // Jogador individual na lista (tem dataset.playerId)
//                     if (classes.indexOf('player-list-item') !== -1 && target.dataset && target.dataset.playerId) {
//                         return; // Permite clique direito no jogador
//                     }
//                 }
//             }
//             target = target.parentElement;
//         }
        
//         // Bloqueia em todo o resto
//         e.preventDefault();
//         e.stopPropagation();
//         return false;
//     }, true);
    
//     // ========== PROTEÇÕES DE NAVEGAÇÃO ==========
    
//     // Bloqueia navegação para URLs blob
//     window.addEventListener('beforeunload', function(e) {
//         var href = window.location.href;
//         if (href.indexOf('blob:') === 0) {
//             e.preventDefault();
//             return false;
//         }
//     });
    
//     // Intercepta cliques em links externos
//     document.addEventListener('click', function(e) {
//         var target = e.target;
        
//         while (target && target.tagName !== 'A') {
//             target = target.parentElement;
//         }
        
//         if (target && target.href) {
//             var href = target.href;
            
//             // Bloqueia links no chat
//             var inChat = target.closest('.log-contents') || target.closest('.chatbox-view') || target.closest('.log');
//             if (inChat) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 e.stopImmediatePropagation();
//                 return false;
//             }
            
//             if (href.startsWith('javascript:') || href.startsWith('#') || href === '') {
//                 return;
//             }
            
//             if (href.indexOf('haxball.com/play') !== -1 && href.indexOf('?c=') !== -1) {
//                 return;
//             }
            
//             e.preventDefault();
//             e.stopPropagation();
            
//             if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
//                 chrome.runtime.sendMessage({
//                     action: 'openExternalLink',
//                     url: href
//                 });
//             }
            
//             return false;
//         }
//     }, true);
    
//     // ========== CSS DE SEGURANÇA ==========
    
//     // Centraliza janela na tela (só no main frame)
//     if (Injector.isMainFrame()) {
//         var screenLeft = screen.availLeft || 0;
//         var screenTop = screen.availTop || 0;
//         var left = screenLeft + Math.round((screen.availWidth - window.outerWidth) / 2);
//         var top = screenTop + Math.round((screen.availHeight - window.outerHeight) / 2);
//         window.moveTo(left, top);
//     }
    
//     Injector.injectCSS('security-css', 
//         'html, body { overflow: hidden !important; } ' +
//         '::-webkit-scrollbar { display: none !important; } ' +
//         'body, div:not(.chatbox-view):not(.log):not(.log-contents), span, button, label, h1, h2, h3, table, tr, td, th, canvas, svg, img { user-select: none !important; -webkit-user-select: none !important; } ' +
//         '.chatbox-view, .chatbox-view-contents, .log, .log-contents, .log-contents p, .chatbox-view p { user-select: text !important; -webkit-user-select: text !important; } ' +
//         'input, textarea { user-select: text !important; -webkit-user-select: text !important; }'
//     );
    
//     Injector.log('Security loaded');
// })();
