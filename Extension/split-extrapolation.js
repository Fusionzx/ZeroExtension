/**
 * ============================================================================
 * SPLIT EXTRAPOLATION - Extrapolation Diferente para Você vs Outros
 * ============================================================================
 * 
 * ANÁLISE TÉCNICA DO SISTEMA DE EXTRAPOLATION DO HAXBALL:
 * 
 * 1. O extrapolation é um valor em ms (-200 a 1000) que define quanto
 *    "no futuro" o cliente renderiza o jogo.
 * 
 * 2. A função hg() calcula o estado do jogo para renderização:
 *    - Usa Qk() para simular X frames no futuro
 *    - Aplica para TODOS os objetos uniformemente
 * 
 * 3. O estado do jogo contém:
 *    - M.va.H[0] = Bola (disco principal)
 *    - M.va.H[1+] = Discos dos jogadores
 *    - K[] = Lista de jogadores (K[i].I = referência ao disco, K[i].Z = ID)
 * 
 * CONCEITO DA MODIFICAÇÃO:
 * - Interceptar a renderização
 * - Calcular estado com extrapolation base (para outros)
 * - Aplicar extrapolation adicional APENAS no disco do jogador local
 * 
 * RESULTADO ESPERADO:
 * - Você vê SEU jogador com extrapolation 200 = controle responsivo
 * - Você vê OUTROS e BOLA com extrapolation 0 = posições precisas
 * 
 * ⚠️ LIMITAÇÕES IMPORTANTES:
 * - Dessincronização visual: você se vê em posição diferente da real
 * - Colisões calculadas pelo servidor na posição REAL
 * - Pode parecer que você "atravessa" outros jogadores
 * - A bola não vai estar onde você espera ao chutar
 * 
 * USO:
 * /splitextra <seu_valor> <outros_valor>
 * /splitextra 200 0   (você com 200, outros com 0)
 * /splitextra off     (desativa)
 */

(function() {
    'use strict';
    
    // ========== CONFIGURAÇÃO ==========
    let splitExtraEnabled = false;
    let myExtrapolation = 200;      // Extrapolation para MEU jogador (ms)
    let othersExtrapolation = 0;    // Extrapolation para OUTROS e bola (ms)
    let debugMode = false;
    
    // ========== ESTADO INTERNO ==========
    let hookedGame = null;
    let originalQk = null;
    const FRAME_TIME = 0.06; // 60fps = 16.67ms por frame, Ec = 0.06
    
    // ========== FUNÇÕES DE HOOK ==========
    
    /**
     * Encontra a instância do jogo ativo
     */
    function findGameInstance() {
        // Método 1: Variável global (se exposta)
        if (window._haxballGame) return window._haxballGame;
        
        // Método 2: Através do prototype chain
        // O jogo usa classes que herdam de 'oa' e têm método 'hg'
        
        // Método 3: Interceptar na criação
        return null;
    }
    
    /**
     * Hook na função Qk para modificar o estado calculado
     * Qk(a, b) - a = frames no futuro, b = buffer de inputs
     */
    function createModifiedQk(original, game) {
        return function(frames, inputBuffer) {
            if (!splitExtraEnabled) {
                return original.call(this, frames, inputBuffer);
            }
            
            // Calcula estado base (com extrapolation dos "outros")
            const baseFrames = othersExtrapolation * FRAME_TIME;
            const state = original.call(this, baseFrames, inputBuffer);
            
            if (!state || !state.M || !state.M.va || !state.K) {
                return state;
            }
            
            // Encontra o jogador local
            const myId = game.xc;
            if (myId <= 0) return state;
            
            // Encontra o disco do jogador local
            let myPlayer = null;
            let myDisc = null;
            
            for (let i = 0; i < state.K.length; i++) {
                if (state.K[i].Z === myId && state.K[i].I) {
                    myPlayer = state.K[i];
                    myDisc = myPlayer.I;
                    break;
                }
            }
            
            if (!myDisc) return state;
            
            // Calcula extrapolation adicional para o jogador local
            const extraFrames = (myExtrapolation - othersExtrapolation) * FRAME_TIME;
            
            if (Math.abs(extraFrames) > 0.1 && myDisc.G) {
                // Extrapola posição baseado na velocidade
                // Fórmula simplificada: pos += vel * frames * damping
                const damping = myDisc.Ea || 0.99; // Fator de amortecimento
                
                // Aplica extrapolação
                let velX = myDisc.G.x;
                let velY = myDisc.G.y;
                
                for (let f = 0; f < extraFrames; f++) {
                    myDisc.a.x += velX;
                    myDisc.a.y += velY;
                    velX *= damping;
                    velY *= damping;
                }
                
                if (debugMode) {
                    console.log(`[SplitExtra] Pos ajustada: +${extraFrames.toFixed(1)} frames`);
                }
            }
            
            return state;
        };
    }
    
    /**
     * Aplica o hook no jogo
     */
    function applyHook(game) {
        if (!game || hookedGame === game) return false;
        
        // Procura pelo método Qk no prototype
        let proto = Object.getPrototypeOf(game);
        while (proto && !proto.hasOwnProperty('Qk')) {
            proto = Object.getPrototypeOf(proto);
        }
        
        if (proto && proto.Qk) {
            originalQk = proto.Qk;
            proto.Qk = createModifiedQk(originalQk, game);
            hookedGame = game;
            console.log('[SplitExtra] Hook aplicado com sucesso!');
            return true;
        }
        
        console.warn('[SplitExtra] Não foi possível encontrar Qk');
        return false;
    }
    
    /**
     * Remove o hook
     */
    function removeHook() {
        if (hookedGame && originalQk) {
            let proto = Object.getPrototypeOf(hookedGame);
            while (proto && !proto.hasOwnProperty('Qk')) {
                proto = Object.getPrototypeOf(proto);
            }
            if (proto) {
                proto.Qk = originalQk;
            }
            hookedGame = null;
            originalQk = null;
            console.log('[SplitExtra] Hook removido');
        }
    }
    
    // ========== INTERFACE DE COMANDOS ==========
    
    function handleCommand(args) {
        if (args.length === 0) {
            return `Split Extrapolation: ${splitExtraEnabled ? 'ATIVO' : 'INATIVO'}\n` +
                   `Você: ${myExtrapolation}ms | Outros: ${othersExtrapolation}ms\n` +
                   `Uso: /splitextra <seu> <outros> ou /splitextra off`;
        }
        
        if (args[0] === 'off') {
            splitExtraEnabled = false;
            removeHook();
            return '❌ Split Extrapolation desativado';
        }
        
        if (args[0] === 'debug') {
            debugMode = !debugMode;
            return `Debug: ${debugMode ? 'ON' : 'OFF'}`;
        }
        
        if (args.length >= 2) {
            const myVal = parseInt(args[0]);
            const othersVal = parseInt(args[1]);
            
            if (isNaN(myVal) || isNaN(othersVal)) {
                return '❌ Valores inválidos. Use números.';
            }
            
            if (myVal < -200 || myVal > 1000 || othersVal < -200 || othersVal > 1000) {
                return '❌ Valores devem estar entre -200 e 1000';
            }
            
            myExtrapolation = myVal;
            othersExtrapolation = othersVal;
            splitExtraEnabled = true;
            
            return `✅ Split Extrapolation ATIVO\n` +
                   `   Você: ${myVal}ms (controle responsivo)\n` +
                   `   Outros: ${othersVal}ms (posição precisa)\n` +
                   `⚠️ Pode causar dessincronização visual!`;
        }
        
        return 'Uso: /splitextra <seu_valor> <outros_valor> ou /splitextra off';
    }
    
    // ========== API GLOBAL ==========
    
    window._splitExtrapolation = {
        enable: function(myVal, othersVal) {
            myExtrapolation = myVal !== undefined ? myVal : 200;
            othersExtrapolation = othersVal !== undefined ? othersVal : 0;
            splitExtraEnabled = true;
            const game = findGameInstance();
            if (game) applyHook(game);
        },
        disable: function() {
            splitExtraEnabled = false;
            removeHook();
        },
        handleCommand: handleCommand,
        isEnabled: function() { return splitExtraEnabled; },
        getConfig: function() { 
            return { 
                enabled: splitExtraEnabled,
                my: myExtrapolation, 
                others: othersExtrapolation 
            }; 
        },
        setDebug: function(val) { debugMode = val; },
        // Para uso interno - permite injetar a instância do jogo
        _injectGame: function(game) {
            if (game) applyHook(game);
        }
    };
    
    console.log('═══════════════════════════════════════════════════');
    console.log('[SplitExtra] Módulo carregado!');
    console.log('Uso: /splitextra <seu_valor> <outros_valor>');
    console.log('Exemplo: /splitextra 200 0');
    console.log('═══════════════════════════════════════════════════');
})();
