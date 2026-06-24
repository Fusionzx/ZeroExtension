// ============================================
// BACKGROUND - Fundo customizado (só no iframe)
// ============================================
(function() {
    if (Injector.isMainFrame() && !Injector.isGameDocument()) return;
    
    Injector.injectCSS('custom-bg', 'html, body { background: var(--theme-bg-primary, #141414) !important; }');
    Injector.log('Background applied');
})();
