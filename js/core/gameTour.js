// js/core/gameTour.js
//
// Tour interativo (não é vídeo real — sem ffmpeg/gravação de tela disponíveis
// neste ambiente) que recria, dentro do próprio app, fragmentos fiéis da UI
// real do "Código Secreto" (mesmas classes Tailwind/CSS globais já usadas em
// player.js e dashboard.js), com narração por voz sintetizada (Web Speech API)
// e legenda sincronizada. Dados de exemplo vêm de getDemoGames()[0] (tema
// Mamíferos) para não inventar conteúdo novo.
//
// Cuidado ao editar os fragmentos de cena: NUNCA reutilize as classes
// '.drop-slot', '.code-size-btn', '.secret-card-slot' ou '.solution-card-container'
// nos elementos clonados aqui — essas classes são alvo de
// document.querySelectorAll(...) em js/games/codigo-secreto/player.js e um
// clone visível nesses seletores globais receberia (ou disputaria) updates de
// uma partida real em andamento. As demais classes reaproveitadas
// ('.bank-card', '.bank-card-inner', '.history-row' escopado, '.feedback-dot')
// são seguras porque não são consultadas globalmente fora do seu contexto real.

import { getDemoGames } from '../games/codigo-secreto/model.js?v=3';

const demoGame = getDemoGames()[0]; // "Jogo dos Mamíferos (Texto)"
const demoCorrect = demoGame.cards.filter(c => c.isCorrect); // 6 cartas certas
const demoWrong = demoGame.cards.filter(c => !c.isCorrect); // 6 distratoras
const demoSecret = demoCorrect.slice(0, 4); // Baleia, Morcego, Ornitorrinco, Leão
const demoOtherCorrect = demoCorrect.slice(4); // Golfinho, Ser Humano

function cardContentHtml(card) {
    return card.contentImage
        ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
        : (card.content || '');
}

function bankCardHtml(card, badgeHtml = '') {
    return `
        <div class="bank-card relative">
            <div class="bank-card-inner" style="background-image:url('${demoGame.frontDesign}');background-size:cover;background-position:center;">
                <div class="w-full h-full flex items-center justify-center p-2 bg-white/80 rounded-[22px] overflow-hidden">
                    ${cardContentHtml(card)}
                </div>
            </div>
            ${badgeHtml}
        </div>
    `;
}

// Réplica visual do .drop-slot real (mesmos valores de CSS, copiados
// literalmente) sem usar a classe '.drop-slot' — ver aviso no topo do arquivo.
function tourSlotHtml(card) {
    const slotStyle = 'flex:1 1 0;min-width:0;max-width:120px;aspect-ratio:3/4;border:4px dashed #94a3b8;border-radius:24px;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;overflow:hidden;';
    if (!card) return `<div style="${slotStyle}"></div>`;
    return `<div style="${slotStyle}"><div class="bank-card-inner w-full h-full overflow-hidden">${cardContentHtml(card)}</div></div>`;
}

function historyMiniCardHtml(card) {
    return `<div class="history-mini-card overflow-hidden">${cardContentHtml(card)}</div>`;
}

function historyRowHtml(attemptNumber, guess, black, white, size = 4, recent = false) {
    const dots = [];
    for (let i = 0; i < black; i++) dots.push('<div class="feedback-dot green"></div>');
    for (let i = 0; i < white; i++) dots.push('<div class="feedback-dot yellow"></div>');
    for (let i = 0; i < (size - black - white); i++) dots.push('<div class="feedback-dot white"></div>');
    return `
        <div class="history-row${recent ? ' recent' : ''}">
            <div class="flex-1">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tentativa ${attemptNumber}</p>
                <div class="history-cards">${guess.map(historyMiniCardHtml).join('')}</div>
            </div>
            <div class="feedback-grid">${dots.join('')}</div>
        </div>
    `;
}

function solutionCardHtml(card) {
    const contentHtml = card.contentImage
        ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
        : `<p class="text-[11px] leading-tight font-black text-slate-800 bg-white/80 p-1 rounded-lg">${card.content || ''}</p>`;
    return `
        <div class="bank-card-inner flex items-center justify-center overflow-hidden" style="aspect-ratio:4/5;background-image:url('${demoGame.frontDesign}');background-size:cover;background-position:center;">
            ${contentHtml}
        </div>
    `;
}

// Cópia literal de renderOtherCorrectCards() em player.js (mesmas classes).
function otherCorrectCardHtml(card) {
    const contentHtml = card.contentImage
        ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
        : `<p class="text-[11px] leading-tight font-black text-slate-800 bg-white/80 p-1 rounded-lg">${card.content || ''}</p>`;
    return `
        <div class="relative" style="aspect-ratio: 4/5;">
            <div class="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl border-2 border-sky-300 opacity-90" style="background-image: url('${demoGame.frontDesign}'); background-size: cover; background-position: center;">
                ${contentHtml}
            </div>
            <div class="absolute -top-2 -right-2 bg-sky-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow">Fora da senha</div>
        </div>
    `;
}

const TOUR_SCENES = [
    {
        caption: 'Todo mundo gosta de um bom mistério. Hoje você vai aprender a decifrar o Código Secreto.',
        render: () => `
            <div class="rounded-[32px] bg-gradient-to-br from-sky-400 via-blue-700 to-blue-950 p-10 text-center text-white flex flex-col items-center justify-center gap-4 w-full" style="min-height:280px;">
                <div class="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center text-4xl">
                    <i class="fa-solid fa-key"></i>
                </div>
                <h2 class="text-3xl font-black">Código Secreto</h2>
                <p class="text-sm text-white/80 max-w-md">Um jogo de dedução para a sua turma, direto na MADE.</p>
            </div>
        `
    },
    {
        caption: 'Cada jogo tem um baralho de 12 cartas sobre um tema — Matemática, Biologia, o que o professor escolher. Seis são cartas certas sobre o assunto. As outras seis são pegadinhas.',
        render: () => `
            <div class="w-full space-y-3">
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Tema: ${demoGame.disciplineInfo.conteudo} (${demoGame.disciplineInfo.disciplina})</p>
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    ${demoCorrect.map(c => bankCardHtml(c, '<div class="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow z-10">Correta</div>')).join('')}
                    ${demoWrong.map(c => bankCardHtml(c, '<div class="absolute -top-2 -right-2 bg-slate-400 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow z-10">Pegadinha</div>')).join('')}
                </div>
            </div>
        `
    },
    {
        caption: 'Pra começar, é só clicar em Jogar.',
        render: () => `
            <div class="relative overflow-hidden bg-white p-6 rounded-[32px] border border-green-200 shadow-sm max-w-sm w-full">
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-green-500"></div>
                <div class="flex justify-between items-start mb-4 mt-1.5">
                    <div class="w-10 h-10 rounded-2xl bg-green-200 text-green-800 flex items-center justify-center font-black">
                        <i class="fa-solid fa-puzzle-piece"></i>
                    </div>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-4">${demoGame.name}</h3>
                <div class="space-y-2 text-sm text-slate-500 mb-4">
                    <p><strong class="text-slate-800">Disciplina:</strong> ${demoGame.disciplineInfo.disciplina}</p>
                    <p><strong class="text-slate-800">Conteúdo:</strong> ${demoGame.disciplineInfo.conteudo}</p>
                </div>
                <div class="rounded-3xl border border-green-200 bg-green-50 p-2 flex gap-2">
                    <div class="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-play"></i> Jogar
                    </div>
                    <div class="bg-white border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-2xl text-sm">Editar</div>
                </div>
            </div>
        `
    },
    {
        caption: 'Antes de tudo, escolha o nível — de 1 a 4 — e o tamanho do Código Secreto, de 3 a 6 cartas. Quanto maior o nível, menos tentativas e mais desafio.',
        render: () => `
            <div class="space-y-6 max-w-xl w-full">
                <div>
                    <p class="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Número de Cartas do Código Secreto</p>
                    <div class="flex gap-2 flex-wrap">
                        <div class="flex-1 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-sm text-center">3</div>
                        <div class="flex-1 py-2.5 bg-emerald-600 text-white border-2 border-emerald-600 rounded-2xl font-black text-sm text-center">4</div>
                        <div class="flex-1 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-sm text-center">5</div>
                        <div class="flex-1 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-sm text-center">6</div>
                        <div class="flex-1 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-black text-sm text-center"><i class="fa-solid fa-shuffle mr-1"></i>Aleatório</div>
                    </div>
                </div>
                <div>
                    <p class="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Nível de Dificuldade</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="text-left p-4 rounded-3xl border-2 border-slate-200">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[11px] font-black shrink-0">1</span>
                                <h4 class="font-black text-slate-800">Nível 1</h4>
                            </div>
                            <p class="text-sm text-slate-600 mt-0.5">10 tentativas</p>
                            <p class="text-[11px] text-slate-500 mt-1">Sem repetição de cartas e sem troca de cartas</p>
                        </div>
                        <div class="text-left p-4 rounded-3xl border-2 border-slate-200">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[11px] font-black shrink-0">2</span>
                                <h4 class="font-black text-slate-800">Nível 2</h4>
                            </div>
                            <p class="text-sm text-slate-600 mt-0.5">8 tentativas</p>
                            <p class="text-[11px] text-slate-500 mt-1">Sem repetição de cartas e troca de 1 carta</p>
                        </div>
                        <div class="text-left p-4 rounded-3xl border-2 border-slate-200">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[11px] font-black shrink-0">3</span>
                                <h4 class="font-black text-slate-800">Nível 3</h4>
                            </div>
                            <p class="text-sm text-slate-600 mt-0.5">6 tentativas</p>
                            <p class="text-[11px] text-slate-500 mt-1">Repetição de 2 cartas e troca de 2 cartas</p>
                        </div>
                        <div class="text-left p-4 rounded-3xl border-2 border-slate-200">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[11px] font-black shrink-0">4</span>
                                <h4 class="font-black text-slate-800">Nível 4</h4>
                            </div>
                            <p class="text-sm text-slate-600 mt-0.5">5 tentativas</p>
                            <p class="text-[11px] text-slate-500 mt-1">Repetição de 3 até o total de cartas da senha e troca de 3 cartas</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        caption: 'Essa é a mesa. De um lado, o banco com todas as cartas. Do outro, os espaços vazios da sua tentativa.',
        render: () => `
            <div class="space-y-6 w-full">
                <div>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Banco de Cartas</p>
                    <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">${demoGame.cards.map(c => bankCardHtml(c)).join('')}</div>
                </div>
                <div>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Sua Tentativa</p>
                    <div class="flex flex-nowrap justify-center gap-4">${[null, null, null, null].map(tourSlotHtml).join('')}</div>
                </div>
            </div>
        `
    },
    {
        caption: 'Escolha uma carta e arraste — ou clique — até preencher todos os espaços da tentativa.',
        render: () => `
            <div class="space-y-6 w-full">
                <div>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Banco de Cartas</p>
                    <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">${demoGame.cards.map(c => bankCardHtml(c)).join('')}</div>
                </div>
                <div>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Sua Tentativa</p>
                    <div class="flex flex-nowrap justify-center gap-4">${[demoSecret[0], demoSecret[1], null, null].map(tourSlotHtml).join('')}</div>
                </div>
            </div>
        `
    },
    {
        caption: 'Com tudo preenchido, é só validar.',
        render: () => `
            <div class="space-y-6 text-center w-full">
                <div class="flex flex-nowrap justify-center gap-4">${demoSecret.map(tourSlotHtml).join('')}</div>
                <div class="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black tracking-wider inline-block">VALIDAR</div>
            </div>
        `
    },
    {
        caption: 'O jogo responde com pinos coloridos. Verde: você acertou a carta e a posição. Amarelo: a carta está certa, mas no lugar errado. Branco: essa carta nem faz parte do código.',
        render: () => `
            <div class="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-200 max-w-md w-full">
                <p class="font-black text-sm uppercase tracking-widest text-slate-500">Significado dos Pinos:</p>
                <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full bg-[#22c55e] border-2 border-[#16a34a] shrink-0"></div>
                    <p class="text-sm"><strong>Pino Verde:</strong> Você acertou uma carta e a posição dela.</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full bg-[#facc15] border-2 border-[#eab308] shrink-0"></div>
                    <p class="text-sm"><strong>Pino Amarelo:</strong> A carta existe no código, mas está na posição errada.</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full bg-white border-2 border-slate-200 shrink-0"></div>
                    <p class="text-sm"><strong>Pino Branco:</strong> Essa carta não faz parte do código secreto.</p>
                </div>
            </div>
        `
    },
    {
        caption: 'Use essas pistas para ajustar a próxima tentativa. Cada rodada te aproxima da solução.',
        render: () => `
            <div class="space-y-3 max-w-md w-full mx-auto">
                ${historyRowHtml(2, [demoSecret[0], demoSecret[1], demoSecret[3], demoSecret[2]], 2, 2, 4, true)}
                ${historyRowHtml(1, [demoSecret[0], demoSecret[2], demoSecret[3], demoSecret[1]], 1, 3, 4, false)}
            </div>
        `
    },
    {
        caption: 'Um aviso importante: nem toda carta certa do banco está na senha dessa partida. O desafio é descobrir exatamente quais — e em que ordem.',
        render: () => `
            <div class="p-4 bg-sky-50 rounded-2xl border border-sky-200 max-w-xl w-full">
                <p class="text-sm text-sky-900"><i class="fa-solid fa-circle-info mr-1"></i> <strong>Atenção:</strong> Nem toda carta correta do banco faz parte do Código Secreto desta partida. Existem outras cartas certas sobre o tema que não foram sorteadas para esta senha — o desafio é descobrir exatamente quais cartas e em qual ordem compõem o código secreto sorteado.</p>
            </div>
        `
    },
    {
        caption: 'Ao acertar — ou ao esgotar as tentativas — o Código Secreto é revelado. O jogo também mostra as outras cartas certas que não faziam parte da senha, para não ter dúvida. E, se você venceu, ganha pontos: quanto menos tentativas, maior o nível e maior o código, mais pontos.',
        render: () => `
            <div class="rounded-[32px] border border-slate-200 bg-white overflow-hidden max-w-2xl w-full">
                <div class="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                    <i class="fa-solid fa-trophy text-amber-500 text-2xl"></i>
                    <div>
                        <h4 class="text-lg font-black text-slate-900">Parabéns, Você Venceu!</h4>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Código Secreto desvendado! Pontuação: 180 pts · Tentativa 3 de 8 (Nível 2)</p>
                    </div>
                </div>
                <div class="p-5 space-y-5">
                    <div>
                        <h5 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">O Código Secreto Era:</h5>
                        <div class="grid grid-cols-4 gap-3">${demoSecret.map(solutionCardHtml).join('')}</div>
                    </div>
                    <div class="space-y-3">
                        <h5 class="text-xs font-black uppercase tracking-[0.2em] text-sky-500">Outras Cartas Corretas (Não Fazem Parte Desta Senha)</h5>
                        <p class="text-[11px] text-slate-500 leading-relaxed">Essas cartas também são sobre o tema certo, mas não foram sorteadas para compor o Código Secreto desta partida.</p>
                        <div class="grid grid-cols-4 gap-3">${demoOtherCorrect.map(otherCorrectCardHtml).join('')}</div>
                    </div>
                </div>
            </div>
        `
    },
    {
        caption: 'Quer tentar de novo? O banco embaralha e parte do código muda — o desafio nunca fica exatamente igual.',
        render: () => `
            <div class="max-w-sm w-full mx-auto text-center space-y-4">
                <div class="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wider">
                    <i class="fa-solid fa-rotate-left"></i> Reiniciar
                </div>
                <p class="text-sm text-slate-600">O banco de cartas embaralha e parte do código secreto muda a cada novo início — o desafio nunca é exatamente igual.</p>
            </div>
        `
    },
    {
        caption: 'Esse é o Código Secreto. Agora é sua vez de decifrar — ou de criar o seu próprio jogo na MADE.',
        render: () => `
            <div class="text-center space-y-4 py-6 w-full">
                <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-600 to-sky-500 text-white flex items-center justify-center text-2xl">
                    <i class="fa-solid fa-flag-checkered"></i>
                </div>
                <h4 class="text-xl font-black text-slate-900">Esse é o Código Secreto!</h4>
                <p class="text-sm text-slate-600 max-w-md mx-auto">Agora é sua vez de decifrar — ou de criar o seu próprio jogo na MADE.</p>
            </div>
        `
    }
];

export const gameTourMethods = {
    openGameTour: function() {
        this.state.gameTourStep = 0;
        const modal = document.getElementById('modal-game-tour');
        if (!modal) return;
        modal.style.display = 'flex';
        this._gameTourSetupSupport();
        this._gameTourRenderSlide();
    },

    closeGameTour: function() {
        this._gameTourStopSpeech();
        const modal = document.getElementById('modal-game-tour');
        if (modal) modal.style.display = 'none';
    },

    gameTourNext: function() {
        if (this.state.gameTourStep < TOUR_SCENES.length - 1) {
            this.state.gameTourStep++;
            this._gameTourRenderSlide();
        } else {
            this.closeGameTour();
        }
    },

    gameTourPrev: function() {
        if (this.state.gameTourStep > 0) {
            this.state.gameTourStep--;
            this._gameTourRenderSlide();
        }
    },

    gameTourGoTo: function(index) {
        if (index < 0 || index >= TOUR_SCENES.length) return;
        this.state.gameTourStep = index;
        this._gameTourRenderSlide();
    },

    gameTourToggleSpeech: function() {
        if (!window.speechSynthesis) return;
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        } else {
            const scene = TOUR_SCENES[this.state.gameTourStep];
            if (scene) this._gameTourSpeak(scene.caption);
        }
        this._gameTourUpdateSpeechButton();
    },

    gameTourToggleMute: function() {
        this.state.gameTourMuted = !this.state.gameTourMuted;
        if (this.state.gameTourMuted) {
            this._gameTourStopSpeech();
        } else {
            const scene = TOUR_SCENES[this.state.gameTourStep];
            if (scene) this._gameTourSpeak(scene.caption);
        }
        this._gameTourUpdateMuteButton();
    },

    _gameTourSetupSupport: function() {
        const controls = document.getElementById('tour-voice-controls');
        if (!controls) return;
        controls.classList.toggle('hidden', !window.speechSynthesis);
    },

    _gameTourRenderSlide: function() {
        const scene = TOUR_SCENES[this.state.gameTourStep];
        if (!scene) return;

        const visual = document.getElementById('tour-scene-visual');
        const caption = document.getElementById('tour-scene-caption');
        const progress = document.getElementById('tour-progress-label');
        const dotsWrap = document.getElementById('tour-dots');
        const prevBtn = document.getElementById('tour-btn-prev');
        const nextBtn = document.getElementById('tour-btn-next');

        if (visual) visual.innerHTML = scene.render();
        if (caption) caption.innerText = scene.caption;
        if (progress) progress.innerText = `Cena ${this.state.gameTourStep + 1} de ${TOUR_SCENES.length}`;

        if (dotsWrap) {
            dotsWrap.innerHTML = TOUR_SCENES.map((_, i) => `
                <button type="button" onclick="app.gameTourGoTo(${i})" title="Ir para a cena ${i + 1}" class="w-2.5 h-2.5 rounded-full transition ${i === this.state.gameTourStep ? 'bg-sky-600' : 'bg-slate-300 hover:bg-slate-400'}"></button>
            `).join('');
        }

        if (prevBtn) prevBtn.classList.toggle('invisible', this.state.gameTourStep === 0);
        if (nextBtn) {
            nextBtn.innerHTML = (this.state.gameTourStep === TOUR_SCENES.length - 1)
                ? '<i class="fa-solid fa-check"></i> Concluir'
                : 'Próximo <i class="fa-solid fa-arrow-right"></i>';
        }

        this._gameTourSpeak(scene.caption);
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
        const btn = document.getElementById('tour-btn-speech');
        if (!btn || !window.speechSynthesis) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        const isSpeaking = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
        icon.className = isSpeaking ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    },

    _gameTourUpdateMuteButton: function() {
        const btn = document.getElementById('tour-btn-mute');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (icon) icon.className = this.state.gameTourMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    }
};
