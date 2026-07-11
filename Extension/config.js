// Configuração global do HaxBall Zero Electron
(function() {
    var isElectron = false;
    try {
        isElectron = !!(
            window.electronAPI ||
            (window.process && window.process.versions && window.process.versions.electron) ||
            /\bElectron\//i.test(navigator.userAgent || '')
        );
    } catch (e) {}

window.HaxDesktopConfig = {
    API_URL: 'api-haxzero.baires.host',
    LOCAL_SERVER: 'http://127.0.0.1:5483',
    DISCORD_CLIENT_ID: '1487837931933798451',
    DISCORD_REDIRECT_URI: 'http://localhost:5483/callback',
    APP_VERSION: '2.0.3',
    IS_ELECTRON: isElectron
};
})();
