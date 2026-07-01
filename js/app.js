// js/app.js
import { dbService } from './database.js';
import { state } from './core/state.js';
import { utilsMethods } from './core/utils.js';
import { authMethods } from './core/auth.js';
import { dashboardMethods } from './core/dashboard.js';
import { libraryMethods } from './core/library.js';
import { editorShellMethods, frontDesigns, backDesigns } from './core/editorShell.js';
import { modalMethods } from './core/modals.js';
import { getGame } from './games/registry.js';
import './games/codigo-secreto/index.js';

// Métodos que pertencem ao modelo de jogo ativo (hoje só "Código Secreto").
// app.js não implementa o comportamento: delega para o módulo registrado em games/registry.js,
// preservando o mesmo nome de método que existia quando tudo estava em um único arquivo.
const GAME_METHODS = [
    'renderEditorGrid', 'toggleCardCorrect', 'updateSecretCardCounter', 'openCardModal',
    'closeCardModal', 'handleCardImageUrlInput', 'removeCardContentImage', 'saveCardModal',
    'populateReviewStep',
    'createSecretCode', 'renderPlayBank', 'previewCard', 'setupDropZones', 'showGameRules',
    'renderCurrentGuess', 'addHistoryRow', 'revealSecretCards', 'testGameFromCreator',
    'openDifficultySelect', 'openDifficultyModal', 'closeDifficultyModal', 'setCodeSize',
    'startGameWithDifficulty', 'playGame', 'replayGame', 'applyCardDesigns', 'renderGameSlots',
    'updateGameHeaderInfo', 'updateLevelInfoPanel', 'showPlayObjetivo', 'showPlayExplicacao',
    'updateAttemptCounter', 'validateGuess', 'openSolutionModal', 'closeSolutionModal', 'askRestart'
];

function resolveModelName() {
    return (app.state.editingGame && app.state.editingGame.model)
        || (app.state.activeGame && app.state.activeGame.model)
        || 'Código Secreto';
}

window.app = {
    state,
    dbService,
    frontDesigns,
    backDesigns,
    ...utilsMethods,
    ...authMethods,
    ...dashboardMethods,
    ...libraryMethods,
    ...editorShellMethods,
    ...modalMethods
};

GAME_METHODS.forEach(name => {
    app[name] = function(...args) {
        const game = getGame(resolveModelName());
        if (!game || typeof game[name] !== 'function') {
            console.error(`[MADE] Método "${name}" não implementado pelo modelo de jogo ativo.`);
            return;
        }
        return game[name].apply(this, args);
    };
});

Object.defineProperty(app, 'difficultyRules', {
    get() { return getGame(resolveModelName()).difficultyRules; }
});

async function injectPartial(mountId, url) {
    const el = document.getElementById(mountId);
    if (!el) return;
    const res = await fetch(url);
    el.innerHTML = await res.text();
}

async function loadPartials() {
    // Fase 1: shell genérico do MADE (precisa existir antes da Fase 2,
    // porque o editor-shell cria o container #creator-step-4 onde o jogo injeta seu conteúdo).
    await Promise.all([
        injectPartial('view-login', 'partials/core/auth.html'),
        injectPartial('view-dashboard', 'partials/core/dashboard.html'),
        injectPartial('view-settings', 'partials/core/settings.html'),
        injectPartial('view-library', 'partials/core/library.html'),
        injectPartial('view-creator', 'partials/core/editor-shell.html'),
        injectPartial('core-modals-mount', 'partials/core/modals.html')
    ]);

    // Fase 2: conteúdo específico do modelo de jogo ativo.
    const activeGame = getGame('Código Secreto');
    await Promise.all([
        injectPartial('creator-step-4', activeGame.partials.editorStep4),
        injectPartial('view-player', activeGame.partials.player),
        injectPartial('game-modals-mount', activeGame.partials.modals)
    ]);
}

// Evento de inicialização
window.addEventListener('DOMContentLoaded', async () => {
    await loadPartials();
    app.init();

    window.onclick = function(event) {
        if (event.target == document.getElementById('modal-card')) app.closeCardModal();
        if (event.target == document.getElementById('modal-author')) app.closeAuthorModal();
        if (event.target == document.getElementById('modal-difficulty')) app.closeDifficultyModal();
        if (event.target == document.getElementById('modal-notification')) app.closeNotification();
        if (event.target == document.getElementById('modal-share')) app.closeShareModal();
    }
});
