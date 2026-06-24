// ============================================
// ADS - Remove propagandas
// ============================================
(function() {
    Injector.waitForElement('.rightbar').then(function() {
        var rightbar = document.querySelector('.rightbar');
        if (rightbar) {
            rightbar.innerHTML = '';
            rightbar.style.display = 'none';
        }
        Injector.injectCSS('rightbar-hide', '.rightbar { display: none !important; width: 0 !important; }');
        Injector.log('Ads removed');
    }).catch(function() {});
})();
