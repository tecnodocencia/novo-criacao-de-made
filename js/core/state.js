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
    activeGame: null,
    codeSizeOption: 4,
    currentCodeSize: 4,
    currentGuess: [null, null, null, null],
    attempts: [],
    gameOver: null,
    selectedGameIdForPlay: null,
    currentDifficulty: 1,
    isTestingFromCreator: false
};
