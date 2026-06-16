// js/app.js
import { dbService } from './database.js';

window.app = {
    state: {
        authMode: 'login',
        activeUser: null,
        users: [
            { email: "teste@gmail.com", password: "123456", role: "professor" }
        ],
        games: [],
        editingGame: null,
        editingStep: 1,
        activeGame: null,
        currentGuess: [null, null, null, null],
        attempts: [],
        gameOver: null,
        selectedGameIdForPlay: null,
        currentDifficulty: 1,
        isTestingFromCreator: false
    },

    difficultyRules: {
        1: { attempts: 10, repeat: false, swap: 0 },
        2: { attempts: 8, repeat: false, swap: 1 },
        3: { attempts: 6, repeat: true, swap: 2 },
        4: { attempts: 5, repeat: true, swap: 3 }
    },

    frontDesigns: [
        'imagens/frente/frente01.png',
        'imagens/frente/Cópia de Frente da Carta - Tipo 2.png',
        'imagens/frente/Cópia de Frente da Carta - Tipo 3.png'
    ],
    backDesigns: [
        'imagens/verso/Cópia de Trás da carta - Esportes.png',
        'imagens/verso/Cópia de Trás da Carta - Humanas.png',
        'imagens/verso/Cópia de Trás da Carta - Línguas.png',
        'imagens/verso/Cópia de Trás da Carta - Matemática 1.png',
        'imagens/verso/Cópia de Trás da Carta - Matemática 2.png',
        'imagens/verso/Cópia de Trás da Carta - Natureza.png',
        'imagens/verso/Cópia de Trás da Carta Matemática 1 sem moldura.png',
        'imagens/verso/Cópia de Trás da Carta Matemática 2 sem moldura.png',
        'imagens/verso/Cópia de Trás da Carta Natureza sem moldura.png',
        'imagens/verso/Cópia de Trás da Carta Qui Fis.png'
    ],

    autoResizeTextarea: function(elem) {
        if (!elem) return;
        elem.style.height = 'inherit';
        elem.style.height = `${elem.scrollHeight}px`;
    },

    init: async function() {
        try {
            // Tenta carregar os jogos do banco de dados
            const jogosDoBanco = await dbService.listarJogos();
            if (jogosDoBanco && jogosDoBanco.length > 0) {
                this.state.games = jogosDoBanco;
            } else {
                this.loadDefaultGames();
            }
        } catch (error) {
            console.error("Erro ao carregar jogos do banco:", error);
            this.loadDefaultGames();
        }
        this.renderDashboard();
    },

    loadDefaultGames: function() {
        this.state.games = [
            {
                id: "default-game-1",
                name: "Jogo dos Mamíferos (Texto)",
                model: "Código Secreto",
                frontDesign: "imagens/frente/frente01.png",
                backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
                disciplineInfo: {
                    disciplina: "Biologia",
                    conteudo: "Mamíferos",
                    serie: "6º ano",
                    autores: ["Profª Maria Silva", "Prof. João Souza"]
                },
                regra: "Escolher as cartas corretas sobre <strong style=\"color:#b91c1c\">Mamíferos</strong>. Posicionar as cartas escolhidas corretamente. Verificar o feedback. Se acertar, o jogo finaliza; se errar, o jogo abre a possibilidade para uma nova tentativa.",
                objetivo: "Descobrir, com o menor número de tentativas, o Código Secreto composto pelo conteúdo sobre <strong style=\"color:#b91c1c\">Mamíferos</strong>.",
                enunciado: "Escolha as 4 cartas que representam <strong style=\"color:#b91c1c\">animais mamíferos</strong> e coloque-as na ordem correta.",
                explicacao: "Feedback visual: Verde (Carta e Posição OK), Amarelo (Carta no Código, Posição Errada), Branco (Não faz parte).",
                cards: [
                    { id: 0, content: "Baleia", isCorrect: true, pileId: 1 },
                    { id: 1, content: "Morcego", isCorrect: true, pileId: 2 },
                    { id: 2, content: "Ornitorrinco", isCorrect: true, pileId: 3 },
                    { id: 3, content: "Leão", isCorrect: true, pileId: 4 },
                    { id: 4, content: "Golfinho", isCorrect: true, pileId: 5 },
                    { id: 5, content: "Ser Humano", isCorrect: true, pileId: 6 },
                    { id: 6, content: "Pinguim", isCorrect: false, pileId: 7 },
                    { id: 7, content: "Tartaruga", isCorrect: false, pileId: 8 },
                    { id: 8, content: "Sapo", isCorrect: false, pileId: 9 },
                    { id: 9, content: "Cobra", isCorrect: false, pileId: 10 },
                    { id: 10, content: "Tubarão", isCorrect: false, pileId: 11 },
                    { id: 11, content: "Jacaré", isCorrect: false, pileId: 12 }
                ]
            },
            {
                id: "default-game-images",
                name: "Jogo dos Mamíferos (Imagens)",
                model: "Código Secreto",
                frontDesign: "imagens/frente/frente01.png",
                backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
                disciplineInfo: {
                    disciplina: "Biologia",
                    conteudo: "Mamíferos",
                    serie: "6º ano",
                    autores: ["Profª Maria Silva", "Prof. João Souza"]
                },
                regra: "Escolher as cartas corretas sobre <strong style=\"color:#b91c1c\">Mamíferos</strong> usando apenas as imagens como guia.",
                objetivo: "Identificar os mamíferos através das imagens e desvendar o Código Secreto.",
                enunciado: "Observe as imagens e selecione as 4 que representam <strong style=\"color:#b91c1c\">mamíferos</strong>.",
                explicacao: "As imagens representam diferentes classes de animais. Apenas mamíferos fazem parte do código.",
                cards: [
                    { id: 100, content: "Elefante", contentImage: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=400", isCorrect: true, pileId: 1 },
                    { id: 101, content: "Tigre", contentImage: "https://images.unsplash.com/photo-1477764250597-dffe9f601ae8?auto=format&fit=crop&w=400", isCorrect: true, pileId: 2 },
                    { id: 102, content: "Cachorro", contentImage: "https://images.unsplash.com/photo-1559190394-df5a28aab5c5?auto=format&fit=crop&w=400", isCorrect: true, pileId: 3 },
                    { id: 103, content: "Gato", contentImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400", isCorrect: true, pileId: 4 },
                    { id: 104, content: "Canguru", contentImage: "https://static.nationalgeographicbrasil.com/files/styles/image_3200/public/nationalgeographic2709937.webp?w=760&h=1054", isCorrect: true, pileId: 5 },
                    { id: 105, content: "Cavalo", contentImage: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400", isCorrect: true, pileId: 6 },
                    { id: 106, content: "Águia", contentImage: "https://adilsoncardoso.com/wp-content/uploads/2022/04/A-aguia-1.jpg", isCorrect: false, pileId: 7 },
                    { id: 107, content: "Crocodilo", contentImage: "https://images.unsplash.com/photo-1549240923-93a2e080e653?auto=format&fit=crop&w=400", isCorrect: false, pileId: 8 },
                    { id: 108, content: "Peixe-Palhaço", contentImage: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=400", isCorrect: false, pileId: 9 },
                    { id: 109, content: "Pato", contentImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGw1voknMq3U4UqLdp_pHlMt5oBhZYhfBv9g&s", isCorrect: false, pileId: 10 },
                    { id: 110, content: "Borboleta", contentImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrGJxmfhqYoyi3sB1Lw6XLL1MiqXq2jiPRHA&s", isCorrect: false, pileId: 11 },
                    { id: 111, content: "Sapo", contentImage: "https://upload.wikimedia.org/wikipedia/commons/5/55/Bufotes_balearicus_female.jpg", isCorrect: false, pileId: 12 }
                ]
            }
        ];
    },

    setAuthMode: function(mode) {
        this.state.authMode = mode;
        document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
        document.getElementById('auth-login-btn').classList.toggle('bg-[#f5e7d6]', mode === 'login');
        document.getElementById('auth-login-btn').classList.toggle('text-[#bb3e44]', mode === 'login');
        document.getElementById('auth-register-btn').classList.toggle('bg-[#f5e7d6]', mode === 'register');
        document.getElementById('auth-register-btn').classList.toggle('text-[#bb3e44]', mode === 'register');
    },

    login: async function() {
        const email = document.getElementById('auth-email')?.value.trim();
        const password = document.getElementById('auth-password')?.value;
        const feedback = document.getElementById('auth-feedback');
        
        if (!email || !password) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Preencha email e senha para entrar.'; }
            return;
        }

        try {
            const user = await dbService.login(email, password);
            this.state.activeUser = user;
            document.getElementById('view-login').classList.remove('active');
            document.getElementById('main-layout').classList.remove('hidden');
            this.init(); 
        } catch (error) {
            console.error(error);
            if (feedback) { 
                feedback.classList.remove('hidden'); 
                feedback.innerText = error.message === 'Invalid login credentials' 
                    ? 'Email ou senha incorretos.' 
                    : 'Erro ao conectar ao banco de dados: ' + error.message; 
            }
        }
    },

    register: async function() {
        const email = document.getElementById('register-email')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const confirm = document.getElementById('register-password-confirm')?.value;
        const role = document.getElementById('register-role')?.value;
        const feedback = document.getElementById('auth-feedback');

        if(!email || !password || !confirm) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Preencha todos os campos.'; }
            return;
        }
        if(password !== confirm) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'As senhas não coincidem.'; }
            return;
        }

        try {
            await dbService.registrar(email, password, role);
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Conta criada com sucesso! Mude para aba Login.'; }
        } catch (error) {
            console.error(error);
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Erro ao criar conta. Email já existe?'; }
        }
    },

    logout: async function() {
        try {
            await dbService.logout();
            this.state.activeUser = null;
            document.getElementById('main-layout').classList.add('hidden');
            document.getElementById('view-login').classList.add('active');
            document.getElementById('view-login').classList.remove('hidden');
            this.setAuthMode('login');
            
            // Limpa campos de input
            const emailInput = document.getElementById('auth-email');
            const passInput = document.getElementById('auth-password');
            if(emailInput) emailInput.value = '';
            if(passInput) passInput.value = '';
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    },

    switchView: function(viewId) {
        document.querySelectorAll('.view-section').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        
        const target = document.getElementById(`view-${viewId}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Se for a aba de configurações, preenche os dados do usuário
        if (viewId === 'settings' && this.state.activeUser) {
            const emailEl = document.getElementById('settings-user-email');
            const roleEl = document.getElementById('settings-user-role');
            if (emailEl) emailEl.innerText = this.state.activeUser.email;
            if (roleEl) roleEl.innerText = this.state.activeUser.role || 'Usuário';
        }

        const sidebar = document.querySelector('aside');
        if (sidebar) {
            if (viewId === 'player') {
                sidebar.classList.add('hidden');
            } else {
                sidebar.classList.remove('hidden');
            }
        }

        document.querySelectorAll('.nav-btn').forEach(b => {
            if(b.getAttribute('data-view') === viewId) {
                b.className = "nav-btn w-full flex items-center p-3 rounded-xl transition bg-emerald-600 text-white";
            } else {
                b.className = "nav-btn w-full flex items-center p-3 rounded-xl transition text-slate-500 hover:bg-emerald-50";
            }
        });
    },

    renderDashboard: function() {
        const grid = document.getElementById('dashboard-grid');
        if(!grid) return;
        grid.innerHTML = '';

        this.state.games.forEach(game => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition group";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">M</div>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-4">${game.name || 'Sem título'}</h3>
                <div class="space-y-2 text-sm text-slate-500 mb-4">
                    <p><strong class="text-slate-800">Modelo:</strong> ${game.model || 'Código Secreto'}</p>
                    <p><strong class="text-slate-800">Disciplina:</strong> ${game.disciplineInfo?.disciplina || '-'}</p>
                    <p><strong class="text-slate-800">Conteúdo:</strong> ${game.disciplineInfo?.conteudo || '-'}</p>
                    <p><strong class="text-slate-800">Série:</strong> ${game.disciplineInfo?.serie || '-'}</p>
                    <p><strong class="text-slate-800">Autores:</strong> ${game.disciplineInfo?.autores?.length ? game.disciplineInfo.autores.join(', ') : '-'}</p>
                    <div class="pt-2 border-t border-slate-100 mt-2 space-y-1">
                        <p class="text-[10px] font-black uppercase text-slate-400">Enunciado</p>
                        <p class="text-xs line-clamp-2">${game.enunciado || '-'}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black uppercase text-slate-400">Regra</p>
                        <p class="text-xs line-clamp-2">${game.regra || '-'}</p>
                    </div>
                </div>
                <div class="rounded-3xl border border-slate-100 bg-slate-50 p-2 flex gap-2">
                    <button onclick="app.openDifficultySelect('${game.id}')" class="flex-1 bg-emerald-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-play"></i> Jogar
                    </button>
                    <button onclick="app.editGame('${game.id}')" class="bg-white border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-2xl text-xs transition hover:bg-slate-50">
                        Editar
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    createSecretCode: function(game) {
        const correctCards = game.cards.filter(card => card.isCorrect);
        const secret = [];
        const level = this.state.currentDifficulty;
        const rules = this.difficultyRules[level];
        const canRepeat = rules.repeat;

        const available = [...correctCards];
        for(let i = 0; i < 4; i++) {
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
        bank.innerHTML = '';
        const frontDesign = this.state.activeGame.frontDesign || 'imagens/frente/frente01.png';

        this.state.activeGame.cards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'bank-card';
            div.draggable = true;
            div.dataset.cardId = card.id;

            const useBg = card.frontImage || frontDesign;
            const contentHtml = card.contentImage 
                ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                : card.content;

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
            : `<span class="text-4xl font-black text-slate-800 bg-white/80 p-6 rounded-[32px] border-2 border-slate-100 text-center">${card.content}</span>`;

        container.innerHTML = contentHtml;
        text.innerText = card.content || "Carta Selecionada";
        modal.style.display = 'flex';
    },

    closePreviewModal: function() {
        document.getElementById('modal-preview').style.display = 'none';
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
                : card.content;

            slot.innerHTML = `
                <div class="bank-card-inner w-full h-full overflow-hidden">
                    ${contentHtml}
                </div>
            `;
        });
    },

    addHistoryRow: function(guess, black, white) {
        const history = document.getElementById('play-history-list');
        history.querySelectorAll('.history-row').forEach(r => r.classList.remove('recent'));

        const row = document.createElement('div');
        row.className = 'history-row recent';

        let dots = [];
        for(let i = 0; i < black; i++) {
            dots.push('<div class="feedback-dot green"></div>');
        }
        for(let i = 0; i < white; i++) {
            dots.push('<div class="feedback-dot yellow"></div>');
        }
        for(let i = 0; i < (4 - black - white); i++) {
            dots.push('<div class="feedback-dot white"></div>');
        }

        row.innerHTML = `
            <div class="history-cards">
                ${guess.map(card => {
                    const contentHtml = card.contentImage 
                        ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                        : card.content;
                    return `
                        <div class="history-mini-card overflow-hidden">
                            ${contentHtml}
                        </div>
                    `;
                }).join('')}
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
                : card.content;

            slot.innerHTML = `
                <div class="bank-card-inner w-full h-full overflow-hidden" style="background: white;">
                    ${contentHtml}
                </div>
            `;
        });
    },

    newGame: function() {
        this.state.editingGame = {
            id: "game-" + Date.now(),
            name: "",
            model: "Código Secreto",
            frontDesign: "imagens/frente/frente01.png",
            backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
            disciplineInfo: { disciplina: "Biologia", conteudo: "Mamífero", serie: "1º ano", autores: [] },
            regra: 'Escolher as cartas corretas sobre <strong style="color:#b91c1c">Mamíferos</strong>. Posicionar as cartas escolhidas corretamente. Verificar o feedback. Se acertar, o jogo finaliza; se errar, o jogo abre a possibilidade para uma nova tentativa. O número de tentativas depende do nível do jogo: 10 (nível 1), 8 (nível 2), 6 (nível 3), 5 (nível 4). A pontuação depende do número de tentativas dentro do Nível escolhido.',
            objetivo: 'Descobrir, com o menor número de tentativas, o Código Secreto composto pelo conteúdo sobre <strong style="color:#b91c1c">Mamíferos</strong> da área de <strong style="color:#b91c1c">Biologia</strong>, acertando o conteúdo e a ordem que as cartas foram selecionadas.',
            enunciado: 'Escolha as 4 cartas que representam <strong style="color:#b91c1c">animais mamíferos</strong> e coloque-as na ordem correta para desvendar o código secreto.',
            explicacao: '• Observe as 12 possibilidades de cartas que estão no banco. \n• Clique na carta escolhida para adicioná-la à sua tentativa na mesa. \n• Repita o processo até que todos os 4 espaços estejam preenchidos. \n• Clique no botão para validar a resposta. \n• Observe o feedback do jogo: um pino verde significa que você acertou a carta e a posição. \n• Um pino amarelo significa que a carta pertence ao código, mas está na posição errada. \n• Um pino branco significa que essa carta não faz parte do código secreto.',
            cards: Array.from({length: 12}, (_, i) => ({ id: "new-" + i, content: "", isCorrect: false, pileId: i + 1 }))
        };
        this.state.editingStep = 1;
        this.syncEditorUI();
        this.updateSecretCardCounter();
        this.switchView('creator');
    },

    editGame: function(id) {
        const g = this.state.games.find(x => x.id === id);
        this.state.editingGame = JSON.parse(JSON.stringify(g));
        this.state.editingStep = 1;
        this.syncEditorUI();
        this.updateSecretCardCounter();
        this.switchView('creator');
    },

    syncEditorUI: function() {
        if (!this.state.editingGame) return;
        const eg = this.state.editingGame;

        if (!eg.disciplineInfo) { eg.disciplineInfo = {}; }

        if (document.getElementById('edit-game-name')) document.getElementById('edit-game-name').value = eg.name || "";
        if (document.getElementById('edit-game-model')) document.getElementById('edit-game-model').value = eg.model || "Código Secreto";
        document.querySelectorAll('#model-choices > div').forEach(d => d.style.borderColor = '#e5e7eb');
        const chosen = Array.from(document.querySelectorAll('#model-choices > div')).find(d => d.innerText.trim().includes(eg.model || ''));
        if (chosen) chosen.style.borderColor = '#10b981';

        const disciplinaSelect = document.getElementById('edit-game-disciplina');
        const serieSelect = document.getElementById('edit-game-serie');
        const discVal = eg.disciplineInfo.disciplina || 'Biologia';
        const serieVal = eg.disciplineInfo.serie || '1º ano';

        const discOption = Array.from(disciplinaSelect.options).find(o => o.value === discVal);
        if (!discOption) {
            document.getElementById('edit-game-disciplina-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-disciplina-outro').value = discVal;
            disciplinaSelect.value = 'Outro';
        } else {
            disciplinaSelect.value = discVal;
            document.getElementById('edit-game-disciplina-outro-wrap').classList.add('hidden');
        }

        const serieOption = Array.from(serieSelect.options).find(o => o.value === serieVal);
        if (!serieOption) {
            document.getElementById('edit-game-serie-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-serie-outro').value = serieVal;
            serieSelect.value = 'Outro';
        } else {
            serieSelect.value = serieVal;
            document.getElementById('edit-game-serie-outro-wrap').classList.add('hidden');
        }

        if (document.getElementById('edit-game-conteudo')) document.getElementById('edit-game-conteudo').value = eg.disciplineInfo.conteudo || "";
        if (document.getElementById('edit-game-regra')) document.getElementById('edit-game-regra').innerHTML = eg.regra || "";
        if (document.getElementById('edit-game-objetivo')) document.getElementById('edit-game-objetivo').innerHTML = eg.objetivo || "";
        if (document.getElementById('edit-game-enunciado')) document.getElementById('edit-game-enunciado').innerHTML = eg.enunciado || "";
        if (document.getElementById('edit-game-explicacao')) {
            document.getElementById('edit-game-explicacao').value = eg.explicacao || "";
            this.autoResizeTextarea(document.getElementById('edit-game-explicacao'));
        }

        document.getElementById('preview-front').src = eg.frontDesign || 'imagens/frente/frente01.png';
        document.getElementById('preview-back').src = eg.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

        this.renderAuthorsList();
        this.renderEditorGrid();
        this.showStep(this.state.editingStep);
    },

    persistEditorFields: function() {
        if (!this.state.editingGame) return;

        this.state.editingGame.name = document.getElementById('edit-game-name')?.value || "Jogo sem Nome";
        this.state.editingGame.model = this.state.editingGame.model || document.getElementById('edit-game-model')?.value || "Código Secreto";

        if (!this.state.editingGame.disciplineInfo) this.state.editingGame.disciplineInfo = {};
        const disciplinaSelect = document.getElementById('edit-game-disciplina');
        if (disciplinaSelect && disciplinaSelect.value === 'Outro') {
            const outro = document.getElementById('edit-game-disciplina-outro')?.value.trim() || 'Outro';
            this.state.editingGame.disciplineInfo.disciplina = outro;
        } else {
            this.state.editingGame.disciplineInfo.disciplina = disciplinaSelect?.value || 'Biologia';
        }

        this.state.editingGame.disciplineInfo.conteudo = document.getElementById('edit-game-conteudo')?.value || "";

        const serieSelect = document.getElementById('edit-game-serie');
        if (serieSelect && serieSelect.value === 'Outro') {
            const outro = document.getElementById('edit-game-serie-outro')?.value.trim() || 'Outro';
            this.state.editingGame.disciplineInfo.serie = outro;
        } else {
            this.state.editingGame.disciplineInfo.serie = serieSelect?.value || '1º ano';
        }

        this.state.editingGame.regra = document.getElementById('edit-game-regra')?.innerHTML || "";
        this.state.editingGame.objetivo = document.getElementById('edit-game-objetivo')?.innerHTML || "";
        this.state.editingGame.enunciado = document.getElementById('edit-game-enunciado')?.innerHTML || "";
        this.state.editingGame.explicacao = document.getElementById('edit-game-explicacao')?.value || "";
    },

    showStep: function(step) {
        this.state.editingStep = step;
        document.querySelectorAll('.creator-step').forEach(el => el.classList.add('hidden'));
        
        const activeEl = document.getElementById(`creator-step-${step}`);
        if (activeEl) activeEl.classList.remove('hidden');

        const progressFill = document.getElementById('creator-progress-fill');
        if (progressFill) progressFill.style.width = `${(step / 5) * 100}%`;

        const titleMap = { 1: 'Dados do Jogo', 2: 'Regras e Aparência', 3: 'Enunciado e Feedbacks', 4: 'Criação de Cartas', 5: 'Revisão e Teste' };
        const stepLabel = document.getElementById('creator-step-current');
        const stepTitle = document.getElementById('creator-step-title');
        
        if (stepLabel) stepLabel.innerText = step;
        if (stepTitle) stepTitle.innerText = titleMap[step] || 'Editor';

        const prevBtn = document.getElementById('creator-prev-btn');
        const nextBtn = document.getElementById('creator-next-btn');
        const step5Actions = document.getElementById('creator-step-5-actions');

        if (prevBtn) prevBtn.classList.toggle('hidden', step === 1);
        if (nextBtn) nextBtn.classList.toggle('hidden', step === 5);
        if (step5Actions) step5Actions.classList.toggle('hidden', step !== 5);

        if (nextBtn) nextBtn.innerText = step === 4 ? 'Revisar' : 'Próximo';

        if (step === 5) {
            this.populateReviewStep();
        }

        document.getElementById('creator-validation-message').classList.add('hidden');
    },

    creatorNextStep: function() {
        this.persistEditorFields();
        const current = this.state.editingStep;

        if (current === 1) {
            if (!this.state.editingGame.name.trim()) { this.showValidationError("Insira o título do jogo."); return; }
            if (!this.state.editingGame.disciplineInfo.conteudo.trim()) { this.showValidationError("Insira o conteúdo do jogo."); return; }
        }
        if (current === 4) {
            const filledCount = this.state.editingGame.cards.filter(c => c.content.trim() !== "").length;
            if (filledCount < 12) { this.showValidationError("Preencha o texto de todas as 12 cartas antes de finalizar."); return; }
            const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
            if (correctCount !== 6) { this.showValidationError("Exatamente 6 cartas precisam ser marcadas como possíveis para o código."); return; }
        }
        if (current < 5) {
            this.showStep(current + 1);
        }
    },

    creatorPrevStep: function() {
        this.persistEditorFields();
        if (this.state.editingStep > 1) {
            this.showStep(this.state.editingStep - 1);
        }
    },

    showValidationError: function(msg) {
        const el = document.getElementById('creator-validation-message');
        if (el) { el.innerText = msg; el.classList.remove('hidden'); }
    },

    saveGame: async function() {
        try {
            const jogoSalvo = await dbService.salvarJogo(this.state.editingGame);
            
            const idx = this.state.games.findIndex(g => g.id === this.state.editingGame.id);
            if(idx !== -1) this.state.games[idx] = jogoSalvo;
            else this.state.games.push(jogoSalvo);
            
            this.state.editingGame = null;
            this.renderDashboard();
            this.switchView('dashboard');
            this.showNotification("Jogo salvo com sucesso!");
        } catch (error) {
            console.error(error);
            this.showNotification("Erro ao salvar o jogo no banco de dados.");
        }
    },

    populateReviewStep: function() {
        if (!this.state.editingGame) return;
        const eg = this.state.editingGame;

        const setSpan = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text || '-';
        };

        setSpan('review-game-name', eg.name);
        setSpan('review-game-disciplina', eg.disciplineInfo.disciplina);
        setSpan('review-game-conteudo', eg.disciplineInfo.conteudo);
        setSpan('review-game-serie', eg.disciplineInfo.serie);
        setSpan('review-game-autores', (eg.disciplineInfo.autores || []).join(', ') || 'Nenhum');

        setSpan('review-game-enunciado', eg.enunciado);
        const rEl = document.getElementById('review-game-regra'); if (rEl) rEl.innerHTML = eg.regra || '-';
        const oEl = document.getElementById('review-game-objetivo'); if (oEl) oEl.innerHTML = eg.objetivo || '-';
        setSpan('review-game-explicacao', eg.explicacao);

        document.getElementById('review-preview-front').src = eg.frontDesign || 'imagens/frente/frente01.png';
        document.getElementById('review-preview-back').src = eg.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

        const grid = document.getElementById('review-cards-grid');
        grid.innerHTML = '';
        eg.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `p-3 rounded-xl border flex flex-col items-center justify-center text-center text-xs font-semibold ${card.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`;
            cardEl.innerHTML = `<p>${card.content}</p>`;
            grid.appendChild(cardEl);
        });
    },

    testGameFromCreator: function() {
        this.state.isTestingFromCreator = true;
        this.state.selectedGameIdForPlay = null; 
        this.openDifficultyModal();
    },

    backFromPlayer: function() {
        const isTesting = this.state.isTestingFromCreator;

        this.state.activeGame = null;
        this.state.selectedGameIdForPlay = null;
        this.state.isTestingFromCreator = false;

        document.getElementById('back-from-player-btn').classList.add('hidden');

        if (isTesting) {
            this.switchView('creator');
            this.showStep(5);
        } else {
            this.switchView('dashboard');
        }
    },

    refreshLibraryManager: async function() {
        if (!this.state.activeUser) return;
        const grid = document.getElementById('manager-library-grid');
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p class="font-bold">Carregando imagens...</p>
            </div>
        `;

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            grid.innerHTML = '';
            if (imagens.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-slate-400">
                        <i class="fa-solid fa-image-slash text-3xl mb-4"></i>
                        <p class="font-bold">Sua biblioteca está vazia.</p>
                    </div>
                `;
                return;
            }
            imagens.forEach(img => {
                const item = document.createElement('div');
                item.className = "group relative aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all";
                item.innerHTML = `
                    <img src="${img.url}" class="w-full h-full object-contain p-4" />
                    <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <button onclick="app.previewImageDirect('${img.url}')" class="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:scale-110 transition">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </div>
                `;
                grid.appendChild(item);
            });
        } catch (error) {
            grid.innerHTML = `<p class="col-span-full text-center text-red-500">Erro ao carregar biblioteca.</p>`;
        }
    },

    previewImageDirect: function(url) {
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-card-container');
        const text = document.getElementById('preview-card-text');

        container.style.backgroundImage = 'none';
        container.style.backgroundColor = 'white';
        container.innerHTML = `<img src="${url}" class="max-w-full max-h-full object-contain" />`;
        text.innerText = "Visualização da Imagem";
        modal.style.display = 'flex';
    },

    handleLibraryFileUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const userId = this.state.activeUser?.id || 'public';
            const fileName = `${userId}/${Date.now()}-${file.name}`;
            await dbService.uploadImagem(file, fileName);
            this.refreshLibraryManager();
            this.showNotification("Imagem enviada com sucesso!", "Sucesso");
        } catch (error) {
            this.showNotification("Erro ao enviar imagem.");
        }
    },

    openImageLibrary: async function(targetType = 'card-content') {
        if (!this.state.activeUser) {
            this.showNotification("Você precisa estar logado para acessar sua biblioteca.");
            return;
        }

        this.state.libraryTarget = targetType; // 'card-content', 'front-design', 'back-design'

        const modal = document.getElementById('modal-library');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        const grid = document.getElementById('library-grid');
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p class="font-bold">Carregando suas imagens...</p>
            </div>
        `;

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            this.renderLibrary(imagens);
        } catch (error) {
            console.error("Erro ao carregar biblioteca:", error);
            grid.innerHTML = `<p class="col-span-full text-center">Erro ao carregar.</p>`;
        }
    },

    renderLibrary: function(imagens) {
        const grid = document.getElementById('library-grid');
        if (imagens.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <i class="fa-solid fa-image-slash text-3xl mb-4"></i>
                    <p class="font-bold">Sua biblioteca está vazia.</p>
                    <p class="text-xs">Envie imagens nas cartas para que elas apareçam aqui.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        imagens.forEach(img => {
            const item = document.createElement('div');
            item.className = "group relative aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all";
            item.onclick = () => this.selectImageFromLibrary(img.url);

            item.innerHTML = `
                <img src="${img.url}" class="w-full h-full object-contain" />
                <div class="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/20 flex items-center justify-center transition-all">
                    <i class="fa-solid fa-check text-white opacity-0 group-hover:opacity-100 text-2xl"></i>
                </div>
            `;
            grid.appendChild(item);
        });
    },

    selectImageFromLibrary: function(url) {
        const target = this.state.libraryTarget;

        if (target === 'card-content') {
            const preview = document.getElementById('modal-card-image-preview');
            const wrapper = document.getElementById('modal-card-image-preview-wrapper');
            preview.src = url;
            wrapper.classList.remove('hidden');
            document.getElementById('modal-card-image-url').value = '';
            this.state.tempContentImage = url;
        } else if (target === 'front-design') {
            document.getElementById('external-front-preview').src = url;
            document.getElementById('external-front-preview-wrapper').classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.frontDesign = url;
            document.getElementById('preview-front').src = url;
            document.getElementById('review-preview-front').src = url;
        } else if (target === 'back-design') {
            document.getElementById('external-back-preview').src = url;
            document.getElementById('external-back-preview-wrapper').classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.backDesign = url;
            document.getElementById('preview-back').src = url;
            document.getElementById('review-preview-back').src = url;
        }

        this.closeImageLibrary();
    },

    renderEditorGrid: function() {
        const grid = document.getElementById('editor-grid');
        if(!grid || !this.state.editingGame) return;
        grid.innerHTML = '';
        this.state.editingGame.cards.forEach((card, idx) => {
            const cardEl = document.createElement('div');
            cardEl.className = `game-card flex flex-col p-3 cursor-pointer transition-all ${card.content || card.contentImage ? '' : 'empty'}`;
            cardEl.onclick = (e) => {
                if (e.target.closest('.status-badge')) return;
                this.openCardModal(idx);
            };

            const contentHtml = card.contentImage 
                ? `<img src="${card.contentImage}" class="max-w-full max-h-24 object-contain rounded-lg mb-1" />`
                : `<p class="text-[11px] font-bold text-slate-800 text-center leading-tight line-clamp-3 px-1">${card.content}</p>`;

            cardEl.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    ${card.content || card.contentImage ? contentHtml : `
                        <i class="fa-solid fa-plus text-2xl text-slate-300"></i>
                        <span class="text-[9px] font-bold text-slate-400 mt-2">EDITAR</span>
                    `}
                </div>
                <div class="mt-2">
                    <button onclick="app.toggleCardCorrect(${idx})" class="status-badge w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider transition-colors ${card.isCorrect ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}">
                        <i class="fa-solid ${card.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <span>${card.isCorrect ? 'Possível' : 'Não é'}</span>
                    </button>
                </div>
            `;
            grid.appendChild(cardEl);
        });
    },

    toggleCardCorrect: function(idx) {
        if(!this.state.editingGame) return;
        const card = this.state.editingGame.cards[idx];
        if (!card.isCorrect) {
            const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
            if(correctCount >= 6) { this.showNotification("Você já atingiu o limite de 6 cartas possíveis."); return; }
        }
        card.isCorrect = !card.isCorrect;
        this.renderEditorGrid();
        this.updateSecretCardCounter();
    },

    updateSecretCardCounter: function() {
        const counterEl = document.getElementById('secret-card-counter');
        if (!counterEl || !this.state.editingGame) return;
        const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
        counterEl.innerText = `${correctCount} / 6 selecionadas`;
    },

    openCardModal: function(idx) {
        this.state.selectedCardIndex = idx;
        const card = this.state.editingGame.cards[idx];
        document.getElementById('modal-card-index').value = idx;
        document.getElementById('modal-card-content').value = card.content || "";
        
        const preview = document.getElementById('modal-card-image-preview');
        const wrapper = document.getElementById('modal-card-image-preview-wrapper');
        const fileInput = document.getElementById('modal-card-image-file');
        const urlInput = document.getElementById('modal-card-image-url');
        fileInput.value = '';
        urlInput.value = (card.contentImage && !card.contentImage.startsWith('data:')) ? card.contentImage : '';

        if (card.contentImage) {
            preview.src = card.contentImage;
            wrapper.classList.remove('hidden');
        } else {
            preview.src = '';
            wrapper.classList.add('hidden');
        }

        const radios = document.getElementsByName('modal-card-correct');
        radios[0].checked = card.isCorrect === true;
        radios[1].checked = card.isCorrect === false;

        document.getElementById('modal-card').style.display = 'flex';
    },

    closeCardModal: function() {
        document.getElementById('modal-card').style.display = 'none';
        this.state.tempContentImage = null;
    },

    handleCardContentImageUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            document.getElementById('modal-card-image-preview').src = dataUrl;
            document.getElementById('modal-card-image-preview-wrapper').classList.remove('hidden');
            document.getElementById('modal-card-image-url').value = '';
            this.state.tempContentImage = dataUrl;
        };
        reader.readAsDataURL(file);
    },

    handleCardImageUrlInput: function(event) {
        const url = event.target.value.trim();
        const preview = document.getElementById('modal-card-image-preview');
        const wrapper = document.getElementById('modal-card-image-preview-wrapper');
        
        if (url) {
            preview.src = url;
            wrapper.classList.remove('hidden');
            document.getElementById('modal-card-image-file').value = '';
            this.state.tempContentImage = url;
        } else {
            if (!this.state.editingGame.cards[this.state.selectedCardIndex].contentImage?.startsWith('data:')) {
                preview.src = '';
                wrapper.classList.add('hidden');
            }
            this.state.tempContentImage = null;
        }
    },

    removeCardContentImage: function() {
        document.getElementById('modal-card-image-file').value = '';
        document.getElementById('modal-card-image-url').value = '';
        document.getElementById('modal-card-image-preview').src = '';
        document.getElementById('modal-card-image-preview-wrapper').classList.add('hidden');
        this.state.tempContentImage = null;
        if (typeof this.state.selectedCardIndex === 'number' && this.state.editingGame) {
             this.state.editingGame.cards[this.state.selectedCardIndex].contentImage = null;
        }
    },

    openImageLibrary: async function() {
        if (!this.state.activeUser) {
            this.showNotification("Você precisa estar logado para acessar sua biblioteca.");
            return;
        }

        const modal = document.getElementById('modal-library');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        const grid = document.getElementById('library-grid');
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p class="font-bold">Carregando suas imagens...</p>
            </div>
        `;

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            this.renderLibrary(imagens);
        } catch (error) {
            console.error("Erro ao carregar biblioteca:", error);
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-red-500">
                    <i class="fa-solid fa-circle-exclamation text-3xl mb-4"></i>
                    <p class="font-bold">Erro ao carregar imagens.</p>
                </div>
            `;
        }
    },

    closeImageLibrary: function() {
        const modal = document.getElementById('modal-library');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    },

    renderLibrary: function(imagens) {
        const grid = document.getElementById('library-grid');
        if (imagens.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <i class="fa-solid fa-image-slash text-3xl mb-4"></i>
                    <p class="font-bold">Sua biblioteca está vazia.</p>
                    <p class="text-xs">Envie imagens nas cartas para que elas apareçam aqui.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        imagens.forEach(img => {
            const item = document.createElement('div');
            item.className = "group relative aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all";
            item.onclick = () => this.selectImageFromLibrary(img.url);

            item.innerHTML = `
                <img src="${img.url}" class="w-full h-full object-contain" />
                <div class="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/20 flex items-center justify-center transition-all">
                    <i class="fa-solid fa-check text-white opacity-0 group-hover:opacity-100 text-2xl"></i>
                </div>
            `;
            grid.appendChild(item);
        });
    },

    selectImageFromLibrary: function(url) {
        const preview = document.getElementById('modal-card-image-preview');
        const wrapper = document.getElementById('modal-card-image-preview-wrapper');
        const urlInput = document.getElementById('modal-card-image-url');

        preview.src = url;
        wrapper.classList.remove('hidden');
        urlInput.value = '';
        this.state.tempContentImage = url;
        
        this.closeImageLibrary();
    },

    saveCardModal: function() {
        const idx = parseInt(document.getElementById('modal-card-index').value);
        const content = document.getElementById('modal-card-content').value.trim();
        const isCorrectChecked = document.querySelector('input[name="modal-card-correct"]:checked').value === "true";

        const urlVal = document.getElementById('modal-card-image-url').value.trim();
        if (urlVal) {
            this.state.tempContentImage = urlVal;
        }

        const hasImage = !!this.state.tempContentImage || !!this.state.editingGame.cards[idx].contentImage;

        if (!content && !hasImage) { this.showNotification("A carta precisa ter texto ou uma imagem."); return; }

        if (isCorrectChecked && !this.state.editingGame.cards[idx].isCorrect) {
            const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
            if(correctCount >= 6) { this.showNotification("Você já atingiu o limite de 6 cartas possíveis."); return; }
        }

        this.state.editingGame.cards[idx].content = content;
        this.state.editingGame.cards[idx].isCorrect = isCorrectChecked;
        if (this.state.tempContentImage) {
            this.state.editingGame.cards[idx].contentImage = this.state.tempContentImage;
        }
        this.state.tempContentImage = null;

        this.closeCardModal();
        this.renderEditorGrid();
        this.updateSecretCardCounter();
    },

    openDifficultySelect: function(gameId) {
        this.state.selectedGameIdForPlay = gameId;
        this.openDifficultyModal();
    },

    openDifficultyModal: function() {
        document.getElementById('modal-difficulty').style.display = 'flex';
    },

    closeDifficultyModal: function() {
        document.getElementById('modal-difficulty').style.display = 'none';
    },

    startGameWithDifficulty: function(level) {
        this.state.currentDifficulty = level;
        this.closeDifficultyModal();
        
        if (this.state.isTestingFromCreator) {
            const gameForTest = JSON.parse(JSON.stringify(this.state.editingGame));
            this.state.activeGame = {
                ...gameForTest,
                maxAttempts: this.difficultyRules[level].attempts
            };
            this.state.attempts = [];
            this.state.secretCode = this.createSecretCode(this.state.activeGame);
            this.state.currentGuess = [null, null, null, null];
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

            const dupMsg = level >= 3 ? "O computador escolherá um número específico dessas 6 cartas para formar o segredo. Como você escolheu um nível estratégico avançado (3 ou 4), é possível que o código apresente cartas repetidas." : "O computador escolherá um número específico dessas 6 cartas para formar o segredo. Como você escolheu o nível estratégico 1 ou 2, o código não terá cartas repetidas.";
            this.showNotification(dupMsg, "Nível de Dificuldade Selecionado");

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

        const maxAttempts = this.difficultyRules[this.state.currentDifficulty].attempts;

        this.state.activeGame = {
            ...JSON.parse(JSON.stringify(game)),
            maxAttempts: maxAttempts
        };

        this.state.attempts = [];
        this.state.secretCode = this.createSecretCode(this.state.activeGame);
        this.state.currentGuess = [null, null, null, null];
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

        const dupMsg = this.state.currentDifficulty >= 3 ? "O computador escolherá um número específico dessas 6 cartas para formar o segredo. Como você escolheu um nível estratégico avançado (3 ou 4), é possível que o código apresente cartas repetidas." : "O computador escolherá um número específico dessas 6 cartas para formar o segredo. Como você escolheu o nível estratégico 1 ou 2, o código não terá cartas repetidas.";
        this.showNotification(dupMsg, "Nível de Dificuldade Selecionado");
    },

    replayGame: function() {
        if(!this.state.activeGame) return;

        const level = this.state.currentDifficulty;
        const rules = this.difficultyRules[level];
        
        if (rules.swap > 0 && this.state.secretCode && this.state.secretCode.length === 4) {
            const correctCards = this.state.activeGame.cards.filter(c => c.isCorrect);
            const currentSecret = [...this.state.secretCode];
            const canRepeat = rules.repeat;
            
            const indicesToSwap = [];
            const possibleIndices = [0, 1, 2, 3];
            for(let i = 0; i < Math.min(rules.swap, 4); i++) {
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

        this.state.currentGuess = [null, null, null, null];
        this.state.attempts = [];
        this.state.gameOver = null;
        this.renderPlayBank();
        this.setupDropZones();
        this.renderCurrentGuess();
        const history = document.getElementById('play-history-list');
        if (history) history.innerHTML = '';
        
        const enunciadoContent = document.getElementById('play-enunciado-content');
        if (enunciadoContent) enunciadoContent.innerHTML = this.state.activeGame.enunciado || "";

        this.applyCardDesigns();
        this.updateAttemptCounter();
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

    updateAttemptCounter: function() {
        if (!this.state.activeGame) return;
        const current = this.state.attempts.length;
        const total = this.state.activeGame.maxAttempts || 10;

        const currentEl = document.getElementById('current-attempt');
        const totalEl = document.getElementById('total-attempts');

        if(currentEl) currentEl.innerText = (current + 1);
        if(totalEl) totalEl.innerText = (total - current);
    },

    shuffleArray: function(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[arr[j]]] = [arr[j], arr[i]];
        }
        return arr;
    },

    validateGuess: function() {
        const guess = [...this.state.currentGuess];

        if(guess.some(g => !g)) {
            this.showNotification('Complete os 4 espaços para validar a sua tentativa.');
            return;
        }

        const secret = [...this.state.secretCode];

        let black = 0;
        let white = 0;

        const usedSecret = [];
        const usedGuess = [];

        for(let i = 0; i < 4; i++) {
            if(secret[i].content === guess[i].content) {
                black++;
                usedSecret.push(i);
                usedGuess.push(i);
            }
        }

        for(let i = 0; i < 4; i++) {
            if(usedGuess.includes(i)) continue;
            for(let j = 0; j < 4; j++) {
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

        if(black === 4) {
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

        this.state.currentGuess = [null, null, null, null];
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
                    : `<p class="text-[10px] leading-tight font-black text-slate-800 bg-white/80 p-1 rounded-lg">${card.content}</p>`;
                
                frontFace.innerHTML = contentHtml;
                cardContainer.classList.add('flipped');
            }
        });
    },

    closeSolutionModal: function() {
        document.getElementById('modal-solution').style.display = 'none';
        document.querySelectorAll('.solution-card-container').forEach(c => c.classList.remove('flipped'));
    },

    openAuthorModal: function() {
        document.getElementById('modal-author').style.display = 'flex';
        document.getElementById('modal-input-author').value = '';
        document.getElementById('modal-input-author').focus();
    },

    closeAuthorModal: function() {
        document.getElementById('modal-author').style.display = 'none';
    },

    handleModalAuthorKeypress: function(event) {
        if (event.key === 'Enter') { event.preventDefault(); this.confirmAuthor(); }
    },

    confirmAuthor: function() {
        const input = document.getElementById('modal-input-author');
        if (!input) return;
        const value = input.value.trim();
        if (value && this.state.editingGame) {
            if (!this.state.editingGame.disciplineInfo.autores.includes(value)) {
                this.state.editingGame.disciplineInfo.autores.push(value);
                this.renderAuthorsList();
            }
        }
        this.closeAuthorModal();
    },

    removeAuthor: function(idx) {
        if(this.state.editingGame) {
            this.state.editingGame.disciplineInfo.autores.splice(idx, 1);
            this.renderAuthorsList();
        }
    },

    renderAuthorsList: function() {
        const list = document.getElementById('edit-game-authors-list');
        if(!list || !this.state.editingGame) return;
        list.innerHTML = '';
        (this.state.editingGame.disciplineInfo.autores || []).forEach((author, idx) => {
            const chip = document.createElement('div');
            chip.className = 'author-chip';
            chip.innerHTML = `<span>${author}</span><button type="button" onclick="app.removeAuthor(${idx})">×</button>`;
            list.appendChild(chip);
        });
    },

    selectModel: function(modelName, el) {
        if (!this.state.editingGame) return;
        this.state.editingGame.model = modelName;
        document.querySelectorAll('#model-choices > div').forEach(d => d.style.borderColor = '#e5e7eb');
        if (el) el.style.borderColor = '#10b981';
    },

    handleDisciplinaSelectChange: function(e) {
        const val = e.target.value;
        if (val === 'Outro') {
            document.getElementById('edit-game-disciplina-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-disciplina-outro').focus();
        } else {
            document.getElementById('edit-game-disciplina-outro-wrap').classList.add('hidden');
        }
    },

    clearDisciplinaOutro: function() {
        const sel = document.getElementById('edit-game-disciplina');
        sel.value = sel.options[0].value;
        document.getElementById('edit-game-disciplina-outro').value = '';
        document.getElementById('edit-game-disciplina-outro-wrap').classList.add('hidden');
    },

    handleSerieSelectChange: function(e) {
        const val = e.target.value;
        if (val === 'Outro') {
            document.getElementById('edit-game-serie-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-serie-outro').focus();
        } else {
            document.getElementById('edit-game-serie-outro-wrap').classList.add('hidden');
        }
    },

    clearSerieOutro: function() {
        const sel = document.getElementById('edit-game-serie');
        sel.value = sel.options[0].value;
        document.getElementById('edit-game-serie-outro').value = '';
        document.getElementById('edit-game-serie-outro-wrap').classList.add('hidden');
    },

    wrapSelectionInRed: function(elementId) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const selection = window.getSelection();
        if (selection.toString().length === 0) return;
        
        const range = selection.getRangeAt(0);
        const span = document.createElement('strong');
        span.style.color = '#b91c1c';
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
    },

    removeRedFromSelection: function(elementId) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const selection = window.getSelection();
        if (selection.toString().length === 0) return;

        const range = selection.getRangeAt(0);
        let node = selection.anchorNode;
        while (node && node !== el) {
            if (node.nodeName === 'STRONG' && node.style.color === 'rgb(185, 28, 28)') {
                const parent = node.parentNode;
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
                return;
            }
            node = node.parentNode;
        }
    },

    handleCardImageUpload: function(side, e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const idx = this.state.selectedCardIndex;
            if (typeof idx === 'number' && this.state.editingGame && this.state.editingGame.cards[idx]) {
                if (side === 'front') this.state.editingGame.cards[idx].frontImage = dataUrl;
                else this.state.editingGame.cards[idx].backImage = dataUrl;
            }
        };
        reader.readAsDataURL(file);
    },

    removeCardImage: function(side) {
        const idx = this.state.selectedCardIndex;
        if (typeof idx === 'number' && this.state.editingGame && this.state.editingGame.cards[idx]) {
            if (side === 'front') { this.state.editingGame.cards[idx].frontImage = null; }
            if (side === 'back') { this.state.editingGame.cards[idx].backImage = null; }
        }
    },

    toggleFrontDesign: function(dir) {
        if(!this.state.editingGame) return;
        let idx = this.frontDesigns.indexOf(this.state.editingGame.frontDesign);
        if(dir==='next') idx = (idx + 1) % this.frontDesigns.length;
        else idx = (idx - 1 + this.frontDesigns.length) % this.frontDesigns.length;
        this.state.editingGame.frontDesign = this.frontDesigns[idx];
        document.getElementById('preview-front').src = this.state.editingGame.frontDesign;
    },

    toggleBackDesign: function(dir) {
        if(!this.state.editingGame) return;
        let idx = this.backDesigns.indexOf(this.state.editingGame.backDesign);
        if(dir==='next') idx = (idx + 1) % this.backDesigns.length;
        else idx = (idx - 1 + this.backDesigns.length) % this.backDesigns.length;
        this.state.editingGame.backDesign = this.backDesigns[idx];
        document.getElementById('preview-back').src = this.state.editingGame.backDesign;
    },

    handleExternalFrontImageUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const userId = this.state.activeUser?.id || 'public';
            const fileName = `${userId}/design/front-${Date.now()}-${file.name}`;
            const publicUrl = await dbService.uploadImagem(file, fileName);

            document.getElementById('external-front-preview').src = publicUrl;
            document.getElementById('external-front-preview-wrapper').classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.frontDesign = publicUrl;
            document.getElementById('preview-front').src = publicUrl;
            document.getElementById('review-preview-front').src = publicUrl;
        } catch (error) {
            console.error(error);
            this.showNotification("Erro ao enviar frente da carta.");
        }
    },

    removeExternalFrontImage: function() {
        document.getElementById('external-front-file').value = '';
        document.getElementById('external-front-preview').src = '';
        document.getElementById('external-front-preview-wrapper').classList.add('hidden');
        if (this.state.editingGame) {
            this.state.editingGame.frontDesign = this.frontDesigns[0];
        }
        document.getElementById('preview-front').src = this.frontDesigns[0];
        document.getElementById('review-preview-front').src = this.frontDesigns[0];
    },

    handleExternalBackImageUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const userId = this.state.activeUser?.id || 'public';
            const fileName = `${userId}/design/back-${Date.now()}-${file.name}`;
            const publicUrl = await dbService.uploadImagem(file, fileName);

            document.getElementById('external-back-preview').src = publicUrl;
            document.getElementById('external-back-preview-wrapper').classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.backDesign = publicUrl;
            document.getElementById('preview-back').src = publicUrl;
            document.getElementById('review-preview-back').src = publicUrl;
        } catch (error) {
            console.error(error);
            this.showNotification("Erro ao enviar verso da carta.");
        }
    },

    removeExternalBackImage: function() {
        document.getElementById('external-back-file').value = '';
        document.getElementById('external-back-preview').src = '';
        document.getElementById('external-back-preview-wrapper').classList.add('hidden');
        if (this.state.editingGame) {
            this.state.editingGame.backDesign = this.backDesigns[0];
        }
        document.getElementById('preview-back').src = this.backDesigns[0];
        document.getElementById('review-preview-back').src = this.backDesigns[0];
    },

    showNotification: function(message, title = 'Aviso') {
        document.getElementById('notification-title').innerText = title;
        document.getElementById('notification-message').innerHTML = message;
        document.getElementById('modal-notification').style.display = 'flex';
    },

    closeNotification: function() {
        document.getElementById('modal-notification').style.display = 'none';
    },

    showConfirm: function(title, message, onConfirm) {
        document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-message').innerText = message;
        const btn = document.getElementById('confirm-btn-action');
        btn.onclick = () => {
            onConfirm();
            this.closeConfirm();
        };
        document.getElementById('modal-confirm').style.display = 'flex';
    },

    closeConfirm: function() {
        document.getElementById('modal-confirm').style.display = 'none';
    },

    askRestart: function() {
        const level = this.state.currentDifficulty;
        const rules = this.difficultyRules[level];
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

// Evento de inicialização
window.addEventListener('DOMContentLoaded', () => {
    app.init();

    window.onclick = function(event) {
        if (event.target == document.getElementById('modal-card')) app.closeCardModal();
        if (event.target == document.getElementById('modal-author')) app.closeAuthorModal();
        if (event.target == document.getElementById('modal-difficulty')) app.closeDifficultyModal();
        if (event.target == document.getElementById('modal-notification')) app.closeNotification();
    }
});
cation')) app.closeNotification();
    }
});
