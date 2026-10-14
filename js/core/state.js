// js/core/state.js
export const state = {
    authMode: 'login',
    activeUser: null,
    users: [
        { email: "teste@gmail.com", password: "123456", role: "professor" }
    ],
    games: [],
    editingGame: null,
    editingStep: 1,
    editingBlock: null,
    autoSaving: false,
    activeGame: null,
    codeSizeOption: 4,
    currentCodeSize: 4,
    currentGuess: [null, null, null, null],
    attempts: [],
    gameOver: null,
    selectedGameIdForPlay: null,
    currentDifficulty: 1,
    isTestingFromCreator: false,
    rankingManageGameId: null,
    libraryManagerFolder: null,
    libraryModalFolder: null,
    gameTourActive: false,
    gameTourStep: 0,
    gameTourMuted: false,
    gameTourReturnStep: null,
    gameTourReturnBlock: null,
    // --- Modelo "Descarte a Carta" (Can Can) ---
    // Estado efêmero de uma partida em andamento (baralho, mãos, turno) —
    // ver js/games/descarte/player.js. null quando não há partida ativa.
    descarte: null,
    // Seleção temporária usada pelo modal de edição de valor de atributo no
    // editor (bloco "Criação de Cartas") — ver js/games/descarte/editorCartas.js.
    descarteSelectedAttr: null,
    descarteSelectedValueIdx: null,
    descarteTempValueImage: null
};
