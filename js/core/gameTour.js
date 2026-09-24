// js/core/gameTour.js
//
// Tour guiado INTERATIVO do "Código Secreto": em vez de um slideshow com
// telas recriadas (versão anterior, ver histórico do git), este tour guia o
// professor durante uma partida de TESTE REAL (mesmo fluxo de
// testGameFromCreator()), sobrepondo um painel flutuante não-bloqueante
// (#tour-coach-panel, em index.html) que:
//   - dá um destaque visual (spotlight, classe .game-tour-spotlight) no
//     elemento REAL correspondente da tela (nunca um clone);
//   - só avança de passo quando a ação real correspondente acontece no
//     jogo (ver _gameTourCheckpoint) — passos informativos usam um botão
//     "Entendi" no próprio painel.
//
// Pontos de gancho no gameplay real (js/games/codigo-secreto/player.js):
// startGameWithDifficulty, renderCurrentGuess, validateGuess,
// openSolutionModal, closeSolutionModal, askRestart — cada um chama
// this._gameTourCheckpoint('nome-do-evento') no fim. _gameTourCheckpoint é
// um NO-OP silencioso quando state.gameTourActive é false, então o
// gameplay normal (fora do tour) nunca é afetado por essas chamadas.

const TOUR_STEPS = [
    {
        id: 'welcome',
        caption: 'O Código Secreto é um jogo de dedução: o baralho tem cartas certas sobre o tema escolhido, misturadas com pegadinhas. O jogo sorteia uma senha secreta usando só as cartas certas, e o aluno precisa descobrir quais são e em que ordem, tentativa após tentativa, usando pistas coloridas. Vamos te guiar numa partida de teste de verdade — o mesmo jogo que você está criando. Clique em "Vamos lá" para começar.',
        spotlight: null,
        button: 'Vamos lá'
    },
    {
        id: 'difficulty',
        caption: 'Antes de tudo, escolha o nível — de 1 a 4 — e o tamanho do Código Secreto, de 3 a 6 cartas. Quanto maior o nível, menos tentativas e mais desafio. Escolha um nível para continuar.',
        spotlight: '#modal-difficulty > div',
        button: null
    },
    {
        id: 'bank',
        caption: 'Esse é o banco de cartas. Ele mistura cartas certas sobre o tema com pegadinhas. Clique ou arraste uma carta até um espaço da sua tentativa para continuar.',
        spotlight: '#play-item-bank',
        button: null
    },
    {
        id: 'guess-area',
        caption: 'Essa é a área da sua tentativa. Continue escolhendo cartas até preencher todos os espaços.',
        spotlight: '#play-drop-slots',
        button: null
    },
    {
        id: 'validate',
        caption: 'Com tudo preenchido, clique em VALIDAR para conferir sua tentativa.',
        spotlight: '#btn-validate',
        button: null
    },
    {
        id: 'result-pins',
        caption: 'O jogo respondeu com pinos coloridos. Verde: você acertou a carta e a posição. Amarelo: a carta está certa, mas no lugar errado. Branco: essa carta nem faz parte do código.',
        spotlight: '#play-history-list .history-row.recent',
        button: 'Entendi'
    },
    {
        id: 'nem-toda-carta',
        caption: 'Um aviso importante: nem toda carta certa do banco está na senha dessa partida. O desafio é descobrir exatamente quais — e em que ordem.',
        spotlight: '#play-item-bank',
        button: 'Entendi, vou continuar tentando'
    },
    {
        id: 'waiting',
        caption: 'Continue jogando, usando as pistas de cada tentativa, até vencer ou até suas tentativas acabarem. O tour volta sozinho quando a partida terminar.',
        spotlight: null,
        button: null
    },
    {
        id: 'solution',
        caption: 'Ao acertar — ou ao esgotar as tentativas — o Código Secreto é revelado, junto com as outras cartas certas que não faziam parte da senha. Se você venceu, também ganha pontos: quanto menos tentativas, maior o nível e maior o código, mais pontos.',
        spotlight: '#solution-other-correct-section',
        button: 'Entendi'
    },
    {
        id: 'restart',
        caption: 'Quer tentar de novo? O botão Reiniciar embaralha o banco e troca parte do código secreto, conforme o nível escolhido — o desafio nunca fica exatamente igual. Esse é o Código Secreto! Agora é sua vez de decifrar, ou de continuar criando o seu próprio jogo na MADE.',
        spotlight: '#btn-restart-game',
        button: 'Concluir Tour'
    }
];

export const gameTourMethods = {
    openGameTour: function() {
        if (!this.state.editingGame) {
            this.showNotification('Abra ou crie um jogo antes de iniciar o tour guiado.');
            return;
        }
        this.state.gameTourActive = true;
        this.state.gameTourStep = 0;
        this._gameTourSetupSupport();
        this._gameTourRenderStep();
    },

    closeGameTour: function() {
        this._gameTourStopSpeech();
        this._gameTourClearSpotlight();
        this.state.gameTourActive = false;
        const panel = document.getElementById('tour-coach-panel');
        if (panel) panel.classList.add('hidden');
    },

    // Único botão de avanço manual do painel coach. Seu rótulo e
    // comportamento mudam conforme o passo atual (ver TOUR_STEPS). Os
    // demais passos ("de ação") avançam sozinhos via _gameTourCheckpoint,
    // chamado de dentro do gameplay real — nunca por este botão.
    gameTourContinue: function() {
        const idx = this.state.gameTourStep;
        const step = TOUR_STEPS[idx];
        if (!step) return;

        if (step.id === 'welcome') {
            // Mesmo fluxo real de "Testar Jogo": sincroniza os campos do
            // editor com o DOM antes de iniciar (mesma convenção usada por
            // showBlock/showPhase ao navegar entre telas do editor) e abre
            // o modal de dificuldade de verdade.
            this.persistEditorFields();
            this.testGameFromCreator();
            this._gameTourGoToIndex(idx + 1); // 'difficulty'
            return;
        }

        if (step.id === 'restart') {
            this.closeGameTour();
            return;
        }

        this._gameTourGoToIndex(idx + 1);
    },

    // Chamado a partir de pontos-chave do gameplay real (player.js). É um
    // NO-OP silencioso quando o tour não está ativo — nenhum custo nem
    // risco para o fluxo normal de jogo/teste.
    _gameTourCheckpoint: function(eventName) {
        if (!this.state.gameTourActive) return;
        const step = TOUR_STEPS[this.state.gameTourStep];
        if (!step) return;

        switch (eventName) {
            case 'difficulty-chosen':
                if (step.id === 'difficulty') this._gameTourGoToStepId('bank');
                break;

            case 'guess-changed':
                if (step.id === 'bank') {
                    const hasAny = (this.state.currentGuess || []).some(c => c);
                    if (hasAny) this._gameTourGoToStepId('guess-area');
                } else if (step.id === 'guess-area') {
                    const guess = this.state.currentGuess || [];
                    const allFilled = guess.length > 0 && guess.every(c => c);
                    if (allFilled) this._gameTourGoToStepId('validate');
                }
                break;

            case 'guess-validated':
                if (step.id === 'validate') this._gameTourGoToStepId('result-pins');
                break;

            case 'solution-opened': {
                // Força o avanço até o passo da solução mesmo que o
                // jogador tenha vencido/perdido na primeira tentativa
                // validada, pulando os passos informativos 6 e 7 (que
                // dependem de clique manual no painel) — o modal de
                // resultado real já explica tudo de novo.
                const solutionIdx = TOUR_STEPS.findIndex(s => s.id === 'solution');
                if (solutionIdx !== -1 && this.state.gameTourStep < solutionIdx) {
                    this._gameTourGoToIndex(solutionIdx);
                }
                break;
            }

            case 'solution-closed':
                if (step.id === 'solution') this._gameTourGoToStepId('restart');
                break;

            // 'restart-requested' (disparado por askRestart()) não avança
            // nenhum passo hoje — o passo 'restart' só termina pelo botão
            // "Concluir Tour" do painel. Gancho reservado para eventual uso
            // futuro; mantido de propósito para não "vazar" lógica de tour
            // para dentro do gameplay real além do necessário.
        }
    },

    _gameTourGoToStepId: function(id) {
        const idx = TOUR_STEPS.findIndex(s => s.id === id);
        if (idx === -1) return;
        this._gameTourGoToIndex(idx);
    },

    _gameTourGoToIndex: function(idx) {
        if (idx < 0 || idx >= TOUR_STEPS.length) return;
        this.state.gameTourStep = idx;
        this._gameTourRenderStep();
    },

    _gameTourRenderStep: function() {
        const step = TOUR_STEPS[this.state.gameTourStep];
        if (!step) return;

        const panel = document.getElementById('tour-coach-panel');
        if (panel) panel.classList.remove('hidden');

        const progress = document.getElementById('tour-coach-progress');
        if (progress) progress.innerText = `Passo ${this.state.gameTourStep + 1} de ${TOUR_STEPS.length}`;

        const caption = document.getElementById('tour-coach-caption');
        if (caption) caption.innerText = step.caption;

        const btn = document.getElementById('tour-coach-btn-continue');
        if (btn) {
            if (step.button) {
                btn.innerText = step.button;
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        }

        this._gameTourApplySpotlight(step.spotlight);
        this._gameTourSpeak(step.caption);
        this._gameTourUpdateMuteButton();
    },

    _gameTourApplySpotlight: function(selector) {
        this._gameTourClearSpotlight();
        if (!selector) return;
        const el = document.querySelector(selector);
        if (el) el.classList.add('game-tour-spotlight');
    },

    _gameTourClearSpotlight: function() {
        document.querySelectorAll('.game-tour-spotlight').forEach(el => el.classList.remove('game-tour-spotlight'));
    },

    _gameTourSetupSupport: function() {
        const controls = document.getElementById('tour-coach-voice-controls');
        if (!controls) return;
        controls.classList.toggle('hidden', !window.speechSynthesis);
    },

    gameTourToggleSpeech: function() {
        if (!window.speechSynthesis) return;
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        } else {
            const step = TOUR_STEPS[this.state.gameTourStep];
            if (step) this._gameTourSpeak(step.caption);
        }
        this._gameTourUpdateSpeechButton();
    },

    gameTourToggleMute: function() {
        this.state.gameTourMuted = !this.state.gameTourMuted;
        if (this.state.gameTourMuted) {
            this._gameTourStopSpeech();
        } else {
            const step = TOUR_STEPS[this.state.gameTourStep];
            if (step) this._gameTourSpeak(step.caption);
        }
        this._gameTourUpdateMuteButton();
    },

    _gameTourSpeak: function(text) {
        if (!window.speechSynthesis || this.state.gameTourMuted) {
            this._gameTourUpdateSpeechButton();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onstart = () => this._gameTourUpdateSpeechButton();
        utterance.onend = () => this._gameTourUpdateSpeechButton();
        utterance.onerror = () => this._gameTourUpdateSpeechButton();
        window.speechSynthesis.speak(utterance);
        this._gameTourUpdateSpeechButton();
    },

    _gameTourStopSpeech: function() {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        this._gameTourUpdateSpeechButton();
    },

    _gameTourUpdateSpeechButton: function() {
        const btn = document.getElementById('tour-coach-btn-speech');
        if (!btn || !window.speechSynthesis) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        const isSpeaking = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
        icon.className = isSpeaking ? 'fa-solid fa-pause text-xs' : 'fa-solid fa-play text-xs';
    },

    _gameTourUpdateMuteButton: function() {
        const btn = document.getElementById('tour-coach-btn-mute');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (icon) icon.className = this.state.gameTourMuted ? 'fa-solid fa-volume-xmark text-xs' : 'fa-solid fa-volume-high text-xs';
    }
};
