// js/games/codigo-secreto/player.js
import { difficultyRules } from './model.js';

export { difficultyRules };

export const playerMethods = {
    createSecretCode: function(game) {
        const correctCards = game.cards.filter(card => card.isCorrect);
        const secret = [];
        const level = this.state.currentDifficulty;
        const rules = difficultyRules[level];
        const canRepeat = rules.repeat;
        const size = this.state.currentCodeSize || 4;

        const available = [...correctCards];
        for(let i = 0; i < size; i++) {
            if (available.length === 0) break;
            const idx = Math.floor(Math.random() * available.length);
            const card = available[idx];
            secret.push({
                ...card,
                instanceId: crypto.randomUUID()
            });
            if (!canRepeat) {
                available.splice(idx, 1);
            }
        }

        return secret;
    },

    renderPlayBank: function() {
        const bank = document.getElementById('play-item-bank');
        if (!bank || !this.state.activeGame) return;
        bank.innerHTML = '';
        const frontDesign = this.state.activeGame.frontDesign || 'imagens/frente/frente01.png';

        const shuffledCards = this.shuffleArray([...this.state.activeGame.cards]);

        shuffledCards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'bank-card';
            div.draggable = true;
            div.dataset.cardId = card.id;

            const useBg = card.frontImage || frontDesign;
            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                : this.escapeCardText(card.content);

            div.innerHTML = `
                <div class="zoom-icon" title="Visualizar ampliado">
                    <i class="fa-solid fa-magnifying-glass-plus"></i>
                </div>
                <div class="bank-card-inner" style="background-image: url('${useBg}'); background-size: cover; background-position: center;">
                    <div class="w-full h-full flex items-center justify-center p-2 ${card.frontImage ? 'bg-transparent' : 'bg-white/80'} rounded-[22px] overflow-hidden">
                        ${contentHtml}
                    </div>
                </div>
            `;

            // Suporte à Lupa
            div.querySelector('.zoom-icon').onclick = (e) => {
                e.stopPropagation();
                this.previewCard(card);
            };

            // Suporte a Arrastar
            div.addEventListener('dragstart', e => {
                e.dataTransfer.setData('cardId', card.id);
            });

            // Suporte a Clique
            div.onclick = () => {
                const nextSlot = this.state.currentGuess.findIndex(g => g === null);
                if (nextSlot !== -1) {
                    this.state.currentGuess[nextSlot] = {
                        ...card,
                        instanceId: crypto.randomUUID()
                    };
                    this.renderCurrentGuess();
                } else {
                    this.showNotification("Todos os espaços já estão preenchidos. Valide sua tentativa ou remova uma carta.");
                }
            };

            bank.appendChild(div);
        });
    },

    previewCard: function(card) {
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-card-container');
        const text = document.getElementById('preview-card-text');

        const frontDesign = this.state.activeGame?.frontDesign || this.state.editingGame?.frontDesign || 'imagens/frente/frente01.png';
        const useBg = card.frontImage || frontDesign;

        container.style.backgroundImage = `url('${useBg}')`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';

        const contentHtml = card.contentImage
            ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" />`
            : `<span class="text-4xl font-black text-slate-800 bg-white/80 p-6 rounded-[32px] border-2 border-slate-100 text-center">${this.escapeCardText(card.content)}</span>`;

        container.innerHTML = contentHtml;
        text.innerText = card.content || "Carta Selecionada";
        modal.style.display = 'flex';
    },

    setupDropZones: function() {
        const slots = document.querySelectorAll('.drop-slot');
        slots.forEach(slot => {
            slot.addEventListener('dragover', e => {
                e.preventDefault();
            });
            slot.addEventListener('drop', e => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData('cardId');
                const card = this.state.activeGame.cards.find(c => String(c.id) === String(cardId));
                const index = Number(slot.dataset.slot);
                this.state.currentGuess[index] = {
                    ...card,
                    instanceId: crypto.randomUUID()
                };
                this.renderCurrentGuess();
            });
            // Clique no slot para remover
            slot.onclick = () => {
                const index = Number(slot.dataset.slot);
                if (this.state.currentGuess[index]) {
                    this.state.currentGuess[index] = null;
                    this.renderCurrentGuess();
                }
            };
        });
    },

    showGameRules: function() {
        const source = this.state.activeGame || this.state.editingGame || {};
        const rulesHtml = source.regra || '<p>Regra não definida.</p>';
        const objectiveHtml = source.objetivo || '';
        const template = `
            <div class="text-left space-y-4">
                <div>${rulesHtml}</div>
                <div class="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-200">
                    <p class="font-black text-xs uppercase tracking-widest text-slate-500">Significado dos Pinos:</p>
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full bg-[#22c55e] border-2 border-[#16a34a]"></div>
                        <p class="text-sm"><strong>Pino Verde:</strong> Você acertou uma carta e a posição dela.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full bg-[#facc15] border-2 border-[#eab308]"></div>
                        <p class="text-sm"><strong>Pino Amarelo:</strong> A carta existe no código, mas está na posição errada.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full bg-white border-2 border-slate-200"></div>
                        <p class="text-sm"><strong>Pino Branco:</strong> Essa carta não faz parte do código secreto.</p>
                    </div>
                </div>
                <div>${objectiveHtml}</div>
            </div>
        `;

        const modal = document.getElementById('modal-notification');
        document.getElementById('notification-title').innerText = 'Regras do Jogo';
        document.getElementById('notification-message').innerHTML = template;
        modal.style.display = 'flex';
    },

    renderCurrentGuess: function() {
        const slots = document.querySelectorAll('.drop-slot');
        slots.forEach((slot, index) => {
            const card = this.state.currentGuess[index];
            if(!card) {
                slot.innerHTML = '';
                return;
            }
            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                : this.escapeCardText(card.content);

            slot.innerHTML = `
                <div class="bank-card-inner w-full h-full overflow-hidden">
                    ${contentHtml}
                </div>
            `;
        });
    },

    addHistoryRow: function(guess, black, white) {
        const history = document.getElementById('play-history-list');
        if (!history) return;
        history.querySelectorAll('.history-row').forEach(r => r.classList.remove('recent'));

        const row = document.createElement('div');
        row.className = 'history-row recent';

        const size = this.state.currentCodeSize || 4;
        const attemptNumber = this.state.attempts.length;
        let dots = [];
        for(let i = 0; i < black; i++) {
            dots.push('<div class="feedback-dot green"></div>');
        }
        for(let i = 0; i < white; i++) {
            dots.push('<div class="feedback-dot yellow"></div>');
        }
        for(let i = 0; i < (size - black - white); i++) {
            dots.push('<div class="feedback-dot white"></div>');
        }

        row.innerHTML = `
            <div class="flex-1">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tentativa ${attemptNumber}</p>
                <div class="history-cards">
                    ${guess.map(card => {
                        const contentHtml = card.contentImage
                            ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                            : this.escapeCardText(card.content);
                        return `
                            <div class="history-mini-card overflow-hidden">
                                ${contentHtml}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="feedback-grid">
                ${dots.join('')}
            </div>
        `;
        history.prepend(row);
        history.scrollTop = 0;
    },

    revealSecretCards: function() {
        this.state.secretCode.forEach((card, index) => {
            const slot = document.getElementById(`secret-slot-${index}`);
            if(!slot) return;
            slot.style.backgroundImage = '';
            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                : this.escapeCardText(card.content);

            slot.innerHTML = `
                <div class="bank-card-inner w-full h-full overflow-hidden" style="background: white;">
                    ${contentHtml}
                </div>
            `;
        });
    },

    testGameFromCreator: function() {
        this.state.isTestingFromCreator = true;
        this.state.selectedGameIdForPlay = null;
        this.openDifficultyModal();
    },

    openDifficultySelect: function(gameId) {
        this.state.selectedGameIdForPlay = gameId;
        this.openDifficultyModal();
    },

    openDifficultyModal: function() {
        // Set the default active button state
        this.setCodeSize(this.state.codeSizeOption || 4);
        document.getElementById('modal-difficulty').style.display = 'flex';
    },

    closeDifficultyModal: function() {
        document.getElementById('modal-difficulty').style.display = 'none';
    },

    setCodeSize: function(size) {
        this.state.codeSizeOption = size;
        document.querySelectorAll('.code-size-btn').forEach(btn => {
            const btnSize = btn.dataset.size;
            if (btnSize === String(size)) {
                btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
                btn.classList.remove('bg-white', 'text-slate-700');
            } else {
                btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600');
                btn.classList.add('bg-white', 'text-slate-700');
            }
        });
    },

    startGameWithDifficulty: function(level) {
        this.state.currentDifficulty = level;

        // Resolve the actual code size
        const sizeOption = this.state.codeSizeOption || 4;
        this.state.currentCodeSize = (sizeOption === 'random')
            ? (Math.floor(Math.random() * 4) + 3)  // 3, 4, 5 or 6
            : parseInt(sizeOption);

        this.closeDifficultyModal();

        if (this.state.isTestingFromCreator) {
            const gameForTest = JSON.parse(JSON.stringify(this.state.editingGame));
            this.state.activeGame = {
                ...gameForTest,
                maxAttempts: difficultyRules[level].attempts
            };
            this.state.attempts = [];
            this.state.secretCode = this.createSecretCode(this.state.activeGame);
            this.state.currentGuess = Array(this.state.currentCodeSize).fill(null);
            this.renderGameSlots();
            this.renderPlayBank();
            this.setupDropZones();
            this.renderCurrentGuess();
            const history = document.getElementById('play-history-list');
            if (history) history.innerHTML = '';

            const enunciadoContent = document.getElementById('play-enunciado-content');
            if (enunciadoContent) enunciadoContent.innerHTML = this.state.activeGame.enunciado || "";

            document.getElementById('back-from-player-btn').classList.remove('hidden');
            this.switchView('player');
            this.applyCardDesigns();
            this.updateAttemptCounter();
            this.updateGameHeaderInfo();
            this.updateLevelInfoPanel();

            const levelDescriptions = {
                1: 'sem repetição de cartas e sem troca de cartas',
                2: 'sem repetição de cartas e troca de 1 carta',
                3: 'sem repetição de cartas e troca de 2 cartas',
                4: 'sem repetição de cartas e troca de 3 cartas'
            };
            const dupMsg = `Nível ${level}: ${levelDescriptions[level]}. O código secreto terá ${this.state.currentCodeSize} cartas.`;
            this.showNotification(dupMsg, "Jogo Iniciado!");

        } else if(this.state.selectedGameIdForPlay) {
            this.playGame(this.state.selectedGameIdForPlay);
        } else if(this.state.activeGame) {
            this.replayGame();
        }
    },

    playGame: function(id) {
        this.state.isTestingFromCreator = false;
        const game = this.state.games.find(x => x.id === id);
        if(!game) return;

        const maxAttempts = difficultyRules[this.state.currentDifficulty].attempts;

        this.state.activeGame = {
            ...JSON.parse(JSON.stringify(game)),
            maxAttempts: maxAttempts
        };

        this.state.attempts = [];
        this.state.secretCode = this.createSecretCode(this.state.activeGame);
        this.state.currentGuess = Array(this.state.currentCodeSize).fill(null);
        this.renderGameSlots();
        this.renderPlayBank();
        this.setupDropZones();
        this.renderCurrentGuess();
        const history = document.getElementById('play-history-list');
        if (history) history.innerHTML = '';

        const enunciadoContent = document.getElementById('play-enunciado-content');
        if (enunciadoContent) enunciadoContent.innerHTML = this.state.activeGame.enunciado || "";

        this.switchView('player');
        this.applyCardDesigns();
        document.getElementById('back-from-player-btn').classList.remove('hidden');
        this.updateAttemptCounter();
        this.updateGameHeaderInfo();
        this.updateLevelInfoPanel();

        const levelDescriptions = {
            1: 'sem repetição de cartas e sem troca de cartas',
            2: 'sem repetição de cartas e troca de 1 carta',
            3: 'sem repetição de cartas e troca de 2 cartas',
            4: 'sem repetição de cartas e troca de 3 cartas'
        };
        const level = this.state.currentDifficulty;
        const dupMsg = `Nível ${level}: ${levelDescriptions[level]}. O código secreto terá ${this.state.currentCodeSize} cartas.`;
        this.showNotification(dupMsg, "Jogo Iniciado!");
    },

    replayGame: function() {
        if(!this.state.activeGame) return;

        const level = this.state.currentDifficulty;
        const rules = difficultyRules[level];
        const codeSize = this.state.currentCodeSize || 4;

        if (rules.swap > 0 && this.state.secretCode && this.state.secretCode.length === codeSize) {
            const correctCards = this.state.activeGame.cards.filter(c => c.isCorrect);
            const currentSecret = [...this.state.secretCode];
            const canRepeat = rules.repeat;

            const indicesToSwap = [];
            const possibleIndices = Array.from({length: codeSize}, (_, i) => i);
            for(let i = 0; i < Math.min(rules.swap, codeSize); i++) {
                const rIdx = Math.floor(Math.random() * possibleIndices.length);
                indicesToSwap.push(possibleIndices.splice(rIdx, 1)[0]);
            }

            indicesToSwap.forEach(idx => {
                let available = [...correctCards];
                if (!canRepeat) {
                    const currentContents = currentSecret.map(c => c.content);
                    available = available.filter(c => !currentContents.includes(c.content));
                }

                if (available.length > 0) {
                    const newCard = available[Math.floor(Math.random() * available.length)];
                    currentSecret[idx] = { ...newCard, instanceId: crypto.randomUUID() };
                }
            });
            this.state.secretCode = currentSecret;
        } else if (this.state.gameOver === 'win' || this.state.gameOver === 'loss' || !this.state.secretCode) {
            if (!this.state.secretCode) {
                 this.state.secretCode = this.createSecretCode(this.state.activeGame);
            }
        }

        this.state.currentGuess = Array(this.state.currentCodeSize || 4).fill(null);
        this.state.attempts = [];
        this.state.gameOver = null;
        this.renderGameSlots();
        this.renderPlayBank();
        this.setupDropZones();
        this.renderCurrentGuess();
        const history = document.getElementById('play-history-list');
        if (history) history.innerHTML = '';

        const enunciadoContent = document.getElementById('play-enunciado-content');
        if (enunciadoContent) enunciadoContent.innerHTML = this.state.activeGame.enunciado || "";

        this.applyCardDesigns();
        this.updateAttemptCounter();
        this.updateGameHeaderInfo();
        this.updateLevelInfoPanel();
    },

    applyCardDesigns: function() {
        if (!this.state.activeGame) return;
        const backDesign = this.state.activeGame.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';
        document.querySelectorAll('.secret-card-slot').forEach(slot => {
            slot.innerHTML = '';
            slot.style.backgroundImage = `url('${backDesign}')`;
            slot.style.backgroundSize = 'cover';
            slot.style.backgroundPosition = 'center';
        });
    },

    renderGameSlots: function() {
        const size = this.state.currentCodeSize || 4;
        const secretContainer = document.getElementById('play-secret-slots');
        const dropContainer = document.getElementById('play-drop-slots');

        if (secretContainer) {
            secretContainer.innerHTML = '';
            for (let i = 0; i < size; i++) {
                const slot = document.createElement('div');
                slot.className = 'secret-card-slot';
                slot.id = `secret-slot-${i}`;
                secretContainer.appendChild(slot);
            }
        }
        if (dropContainer) {
            dropContainer.innerHTML = '';
            for (let i = 0; i < size; i++) {
                const slot = document.createElement('div');
                slot.className = 'drop-slot';
                slot.dataset.slot = i;
                dropContainer.appendChild(slot);
            }
        }
    },

    updateGameHeaderInfo: function() {
        if (!this.state.activeGame) return;
        const g = this.state.activeGame;
        const info = g.disciplineInfo || {};

        const setEl = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text || '-';
        };

        setEl('play-header-title', g.name);
        setEl('play-header-disciplina', info.disciplina);
        setEl('play-header-conteudo', info.conteudo);
        setEl('play-header-serie', info.serie);
        setEl('play-header-autores', (info.autores || []).join(', ') || 'Não informado');
    },

    updateLevelInfoPanel: function() {
        const level = this.state.currentDifficulty;
        const rules = difficultyRules[level];
        if (!rules) return;

        const setEl = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        setEl('level-info-nivel', `Nível ${level} (${rules.attempts} tentativas)`);
        setEl('level-info-cartas', String(this.state.currentCodeSize || 4));
        setEl('level-info-repeticao', rules.repeat ? 'Permitida' : 'Não permitida');
        setEl('level-info-troca', rules.swap > 0 ? `${rules.swap} carta${rules.swap > 1 ? 's' : ''} a cada reinício` : 'Nenhuma');
    },

    showPlayObjetivo: function() {
        const g = this.state.activeGame;
        if (!g) return;
        this.showNotification(g.objetivo || 'Objetivo não definido.', 'Objetivo do Jogo');
    },

    showPlayExplicacao: function() {
        const g = this.state.activeGame;
        if (!g) return;
        this.showNotification(g.explicacao || 'Explicação não definida.', 'Como Jogar');
    },

    updateAttemptCounter: function() {
        if (!this.state.activeGame) return;
        const current = this.state.attempts.length;
        const total = this.state.activeGame.maxAttempts || 10;

        const currentEl = document.getElementById('current-attempt');
        const totalEl = document.getElementById('total-attempts');

        if(currentEl) currentEl.innerText = (current + 1);
        if(totalEl) totalEl.innerText = (total - current);
    },

    validateGuess: function() {
        const size = this.state.currentCodeSize || 4;
        const guess = [...this.state.currentGuess];

        if(guess.some(g => !g)) {
            this.showNotification(`Complete os ${size} espaços para validar a sua tentativa.`);
            return;
        }

        const secret = [...this.state.secretCode];

        let black = 0;
        let white = 0;

        const usedSecret = [];
        const usedGuess = [];

        for(let i = 0; i < size; i++) {
            if(secret[i].content === guess[i].content) {
                black++;
                usedSecret.push(i);
                usedGuess.push(i);
            }
        }

        for(let i = 0; i < size; i++) {
            if(usedGuess.includes(i)) continue;
            for(let j = 0; j < size; j++) {
                if(usedSecret.includes(j)) continue;
                if(guess[i].content === secret[j].content) {
                    white++;
                    usedSecret.push(j);
                    break;
                }
            }
        }

        this.state.attempts.push({ guess, result: { black, white } });
        this.addHistoryRow(guess, black, white);
        this.updateAttemptCounter();

        if(black === size) {
            this.state.gameOver = 'win';
            this.revealSecretCards();
            this.openSolutionModal();
            return;
        }

        if (this.state.attempts.length >= this.state.activeGame.maxAttempts) {
            this.state.gameOver = 'loss';
            this.revealSecretCards();
            this.openSolutionModal();
            return;
        }

        this.state.currentGuess = Array(size).fill(null);
        this.renderCurrentGuess();
    },

    openSolutionModal: function() {
        const modal = document.getElementById('modal-solution');
        if(!modal || !this.state.activeGame) return;

        const win = this.state.gameOver === 'win';

        let score = 0;
        const attemptsUsed = this.state.attempts.length;
        if(win) {
            const maxAttempts = this.state.activeGame.maxAttempts;
            score = Math.max(10, Math.round(((maxAttempts - attemptsUsed + 1) / maxAttempts) * 100));
        }

        document.getElementById('solution-title').innerText = win ? 'Parabéns, Você Venceu!' : 'Fim de Jogo!';
        document.getElementById('solution-subtitle').innerText = win ? `Código Secreto desvendado! Pontuação: ${score} pts` : 'Suas tentativas acabaram.';

        const icon = document.getElementById('solution-icon');
        if(win) {
            icon.className = "fa-solid fa-trophy text-amber-500 text-3xl animate-bounce";
        } else {
            icon.className = "fa-solid fa-circle-xmark text-red-500 text-3xl";
        }

        document.getElementById('solution-explanation').innerHTML = this.state.activeGame.enunciado || '';

        modal.style.display = 'flex';

        const secret = this.state.secretCode;
        const frontDesign = this.state.activeGame.frontDesign || "imagens/frente/frente01.png";

        for(let i = 0; i < 6; i++) {
            const el = document.getElementById(`solution-card-${i}`);
            if(el) el.classList.add('hidden');
        }

        secret.forEach((card, i) => {
            const cardContainer = document.getElementById(`solution-card-${i}`);
            if(cardContainer) {
                cardContainer.classList.remove('hidden');
                const frontFace = cardContainer.querySelector('.solution-card-front');
                frontFace.className = 'solution-card-front bank-card-inner w-full h-full flex flex-col justify-center items-center text-center overflow-hidden';
                frontFace.style.backgroundImage = `url('${frontDesign}')`;
                frontFace.style.backgroundSize = 'cover';
                frontFace.style.backgroundPosition = 'center';

                const contentHtml = card.contentImage
                    ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                    : `<p class="text-[10px] leading-tight font-black text-slate-800 bg-white/80 p-1 rounded-lg">${this.escapeCardText(card.content)}</p>`;

                frontFace.innerHTML = contentHtml;
                cardContainer.classList.add('flipped');
            }
        });
    },

    closeSolutionModal: function() {
        document.getElementById('modal-solution').style.display = 'none';
        document.querySelectorAll('.solution-card-container').forEach(c => c.classList.remove('flipped'));
    },

    askRestart: function() {
        const level = this.state.currentDifficulty;
        const rules = difficultyRules[level];
        const swaps = rules.swap;

        let msg = "Você deseja realmente reiniciar a partida?";
        if (swaps > 0) {
            msg += ` Como você está no Nível ${level}, ${swaps} ${swaps === 1 ? 'carta será substituída' : 'cartas serão substituídas'} no código secreto.`;
        } else {
            msg += " No Nível 1, o código secreto será o mesmo.";
        }

        this.showConfirm("Reiniciar Partida", msg, () => {
            this.replayGame();
        });
    }
};
