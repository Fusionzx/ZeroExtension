// ============================================
// LEAVE ROOM - Sair da sala sem confirmação
// ============================================
(function() {
    if (!Injector.isGameFrame()) return;

    // Observer simples e direto
    function setupLeaveObserver() {
        if (!document.body) {
            setTimeout(setupLeaveObserver, 100);
            return;
        }

        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType === 1 && node.classList && node.classList.contains('leave-room-view')) {
                        var leaveBtn = node.querySelector('[data-hook="leave"]');
                        if (leaveBtn) {
                            Injector.log('Auto-clicking leave button');
                            leaveBtn.click();
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        Injector.log('Leave room observer setup');
    }

    setupLeaveObserver();

    Injector.log('Leave room (no confirmation) loaded');
})();
