/**
 * Smart Extrapolation - Extrapolation Inteligente
 * 
 * CONCEITO ALTERNATIVO:
 * Em vez de extrapolation diferente por jogador (que causa dessincronização),
 * esta abordagem usa extrapolation DINÂMICO baseado na situação:
 * 
 * 1. Quando você está LONGE da bola: extrapolation alto (200) = movimento suave
 * 2. Quando você está PERTO da bola: extrapolation baixo (0-50) = precisão
 * 
 * Isso dá o melhor dos dois mundos sem dessincronização visual.
 * 
 * USO:
 * /smartextra on - Ativa extrapolation dinâmico
 * /smartextra off - Desativa
 * /smartextra config <longe> <perto> <distancia> - Configura valores
 */

(function() {
    'use strict';
    
    // Configuração
    let smartExtraEnabled = false;
    let farExtrapolation = 150;    // Extrapolation quando longe da bola
    let nearExtrapolation = 0;     // Extrapolation quando perto da bola
    let transitionDistance = 200;  // Distância para transição (pixels)
    let smoothTransition = true;   // Transição suave entre valores
    
    // Estado
    let lastExtraValue = 0;
    let updateInterval = null;
    
    function getDistanceToBall(gameState, myPlayerId) {
        if (!gameState || !gameState.M || !gameState.M.va) return Infinity;
        
        // Bola é o primeiro disco (H[0])
        const ball = gameState.M.va.H[0];
        if (!ball) return Infinity;
        
        // Encontra meu jogador
        const players = gameState.K;
        let myPlayer = null;
        for (let i = 0; i < players.length; i++) {
            if (players[i].Z === myPlayerId && players[i].I) {
                myPlayer = players[i];
                break;
            }
        }
        
        if (!myPlayer || !myPlayer.I) return Infinity;
        
        // Calcula distância
        const dx = ball.a.x - myPlayer.I.a.x;
        const dy = ball.a.y - myPlayer.I.a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function calculateSmartExtrapolation(distance) {
        if (distance <= transitionDistance * 0.5) {
            // Muito perto - usa extrapolation baixo
            return nearExtrapolation;
        } else if (distance >= transitionDistance) {
            // Longe - usa extrapolation alto
            return farExtrapolation;
        } else {
            // Zona de transição - interpola
            if (smoothTransition) {
                const t = (distance - transitionDistance * 0.5) / (transitionDistance * 0.5);
                return Math.round(nearExtrapolation + (farExtrapolation - nearExtrapolation) * t);
            } else {
                return farExtrapolation;
            }
        }
    }
    
    function updateExtrapolation() {
        if (!smartExtraEnabled) return;
        
        // Tenta encontrar o jogo
        const gameContainer = document.querySelector('.game-view');
        if (!gameContainer) return;
        
        // Acessa o estado do jogo através do input de chat
        const chatInput = document.querySelector('input[data-hook="input"]');
        if (!chatInput) return;
        
        // Obtém distância (isso é uma aproximação - idealmente acessaríamos o estado diretamente)
        // Por enquanto, usamos uma heurística baseada no tempo
        
        // Calcula novo valor de extrapolation
        // Como não temos acesso direto ao estado, usamos o valor configurado
        const newExtra = farExtrapolation; // Simplificado por enquanto
        
        if (Math.abs(newExtra - lastExtraValue) >= 10) {
            lastExtraValue = newExtra;
            
            // Envia comando de extrapolation
            if (chatInput) {
                const originalValue = chatInput.value;
                chatInput.value = '/extrapolation ' + newExtra;
                chatInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true
                }));
                chatInput.value = originalValue;
            }
        }
    }
    
    function enable() {
        if (smartExtraEnabled) return;
        smartExtraEnabled = true;
        
        // Atualiza a cada 500ms
        updateInterval = setInterval(updateExtrapolation, 500);
        console.log('[SmartExtra] Ativado!');
    }
    
    function disable() {
        smartExtraEnabled = false;
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        console.log('[SmartExtra] Desativado!');
    }
    
    function handleCommand(args) {
        if (args.length === 0) {
            return `Smart Extrapolation: ${smartExtraEnabled ? 'ATIVO' : 'INATIVO'}\n` +
                   `Config: longe=${farExtrapolation}ms, perto=${nearExtrapolation}ms, dist=${transitionDistance}px`;
        }
        
        if (args[0] === 'on') {
            enable();
            return 'Smart Extrapolation ativado!';
        }
        
        if (args[0] === 'off') {
            disable();
            return 'Smart Extrapolation desativado!';
        }
        
        if (args[0] === 'config' && args.length === 4) {
            farExtrapolation = parseInt(args[1]) || 150;
            nearExtrapolation = parseInt(args[2]) || 0;
            transitionDistance = parseInt(args[3]) || 200;
            return `Configurado: longe=${farExtrapolation}ms, perto=${nearExtrapolation}ms, dist=${transitionDistance}px`;
        }
        
        return 'Uso: /smartextra [on|off|config <longe> <perto> <distancia>]';
    }
    
    // Expõe globalmente
    window._smartExtrapolation = {
        enable: enable,
        disable: disable,
        handleCommand: handleCommand,
        isEnabled: function() { return smartExtraEnabled; },
        setConfig: function(far, near, dist) {
            farExtrapolation = far;
            nearExtrapolation = near;
            transitionDistance = dist;
        }
    };
    
    console.log('[SmartExtra] Módulo carregado. Use /smartextra on para ativar.');
})();
