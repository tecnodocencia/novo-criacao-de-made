// js/app.js
import { dbService } from './database.js?v=6';
import { state } from './core/state.js?v=4';
import { utilsMethods } from './core/utils.js?v=4';
import { authMethods } from './core/auth.js?v=6';
import { dashboardMethods } from './core/dashboard.js?v=21';
import { libraryMethods } from './core/library.js?v=7';
import { editorShellMethods, frontDesigns, backDesigns } from './core/editorShell.js?v=18';
import { modalMethods } from './core/modals.js?v=1';
import { gameTourMethods } from './core/gameTour.js?v=10';
import { getGame } from './games/registry.js?v=1';
import './games/codigo-secreto/index.js?v=10';
import './games/eliminacao/index.js?v=2';

// Métodos que pertencem ao modelo de jogo ativo ("Código Secreto" e
// "Eliminação" hoje). app.js não implementa o comportamento: delega para o
// módulo registrado em games/registry.js, preservando o mesmo nome de
// método em todo lugar que o chama (HTML/onclick ou outro método do mesmo
// módulo chamando `this.algumNome(...)`). Cada modelo só precisa implementar
// os nomes que ele de fato usa — chamar um nome não implementado pelo
// modelo ativo apenas loga um erro no console, não quebra o app.
const GAME_METHODS = [
    // Bloco "Criação de Cartas" do editor (genérico entre modelos)
    'renderEditorGrid', 'validateCreatorCards', 'isCardsBlockComplete',
    // Específico do Código Secreto
    'updateSecretCardCounter', 'openCardModal',
    'closeCardModal', 'handleCardImageUrlInput', 'removeCardContentImage', 'saveCardModal',
    'populateReviewStep',
    'createSecretCode', 'renderPlayBank', 'previewCard', 'setupDropZones', 'showGameRules',
    'renderCurrentGuess', 'addHistoryRow', 'revealSecretCards', 'testGameFromCreator',
    'openDifficultySelect', 'openDifficultyModal', 'closeDifficultyModal', 'setCodeSize',
    'startGameWithDifficulty', 'playGame', 'replayGame', 'applyCardDesigns', 'renderGameSlots',
    'updateGameHeaderInfo', 'updateLevelInfoPanel', 'showPlayObjetivo', 'showPlayExplicacao',
    'updateAttemptCounter', 'validateGuess', 'openSolutionModal', 'closeSolutionModal', 'askRestart',
    // Específico do Eliminação (Can Can)
    'elimUpdateAttributeName', 'elimAddAttributeValue', 'elimRemoveAttributeValue',
    'elimOpenValueModal', 'elimCloseValueModal', 'elimHandleValueImageUrlInput',
    'elimRemoveValueImage', 'elimSaveValueModal',
    'elimOpenSetupModal', 'elimCloseSetupModal', 'elimStartMatch', 'elimRestartMatch',
    'elimConfirmHandoff', 'elimPlayHandCard', 'elimDrawCard', 'elimPassTurn',
    'elimChooseWildValue', 'elimPreviewHandCard', 'elimCloseResultModal'
];

function resolveModelName() {
    if (app.state.editingGame && app.state.editingGame.model) return app.state.editingGame.model;
    if (app.state.activeGame && app.state.activeGame.model) return app.state.activeGame.model;
    // Flow "Jogar" a partir do dashboard: o dispatcher precisa saber o
    // modelo do jogo ANTES de activeGame existir (só é criado dentro do
    // método per-model openDifficultySelect/elimOpenSetupModal). Por isso
    // dashboardMethods.startPlayFlow() seta selectedGameIdForPlay antes de
    // chamar app.openDifficultySelect() — ver js/core/dashboard.js.
    if (app.state.selectedGameIdForPlay) {
        const g = app.state.games.find(x => String(x.id) === String(app.state.selectedGameIdForPlay));
        if (g && g.model) return g.model;
    }
    return 'Código Secreto';
}

window.app = {
    state,
    dbService,
    frontDesigns,
    backDesigns,
    // Núcleo (não é dispatch por modelo: recebe o nome do modelo como
    // argumento explícito). Ver definição mais abaixo — função declarada
    // com `function`, por isso o hoisting permite referenciá-la aqui.
    ensureGamePartialsLoaded,
    ...utilsMethods,
    ...authMethods,
    ...dashboardMethods,
    ...libraryMethods,
    ...editorShellMethods,
    ...modalMethods,
    ...gameTourMethods
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
    const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    el.innerHTML = await res.text();
}

async function fetchPartialText(url) {
    const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    return await res.text();
}

// Os únicos dois pontos de montagem que de fato trocam de conteúdo conforme
// o modelo de jogo ativo são #creator-step-4 (bloco "Criação de Cartas" do
// editor) e #view-player (tela de jogo) — confirmado lendo o HTML: os
// modais de cada jogo (Código Secreto: #modal-card/#modal-difficulty/
// #modal-solution; Eliminação: #modal-elim-*) já vivem hardcoded e estáticos
// dentro de index.html (como os modais "core"), nunca dentro de um mount
// injetado — não há nada para trocar ali. O cache evita refazer fetch toda
// vez que o professor alterna entre um jogo Código Secreto e um Eliminação.
const gamePartialsCache = {};
let currentGamePartialsModel = null;

async function ensureGamePartialsLoaded(modelName) {
    const game = getGame(modelName);
    if (!game || !game.partials) return;
    if (currentGamePartialsModel === modelName) return;

    if (!gamePartialsCache[modelName]) {
        const [editorStep4, player] = await Promise.all([
            fetchPartialText(game.partials.editorStep4),
            fetchPartialText(game.partials.player)
        ]);
        gamePartialsCache[modelName] = { editorStep4, player };
    }

    const html = gamePartialsCache[modelName];
    const step4El = document.getElementById('creator-step-4');
    const playerEl = document.getElementById('view-player');
    if (step4El) step4El.innerHTML = html.editorStep4;
    if (playerEl) playerEl.innerHTML = html.player;
    currentGamePartialsModel = modelName;
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

    // Fase 2: conteúdo do modelo de jogo padrão ("Código Secreto"). O
    // dashboard/editor troca dinamicamente para o modelo certo (ver
    // ensureGamePartialsLoaded, chamado por newGame/editGame/selectModel em
    // editorShell.js e por startPlayFlow em dashboard.js) assim que o
    // professor abre ou cria um jogo de outro modelo.
    await ensureGamePartialsLoaded('Código Secreto');
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
        if (event.target == document.getElementById('modal-ranking')) app.closeRankingModal();
        // Modais do modelo Eliminação (hardcoded e estáticos em index.html,
        // como os do Código Secreto — ficam sempre no DOM, só raramente
        // visíveis, por isso essas linhas são inofensivas mesmo com o
        // Código Secreto ativo).
        if (event.target == document.getElementById('modal-elim-value')) app.elimCloseValueModal();
        if (event.target == document.getElementById('modal-elim-setup')) app.elimCloseSetupModal();
        if (event.target == document.getElementById('modal-elim-result')) app.elimCloseResultModal();
    }
});
