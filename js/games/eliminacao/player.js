// js/games/eliminacao/player.js
//
// Motor de partida do modelo Eliminação (apelido "Can Can"): jogo de cartas
// por eliminação, jogado "hotseat" (todos os jogadores humanos usam o mesmo dispositivo,
// passando a vez na tela). Ver js/games/eliminacao/model.js para a geração
// do baralho e as regras de combinação entre cartas.
//
// Arquitetura interna: os métodos exportados em `playerMethods` (chamados
// via onclick dos partials/modais, e por isso precisam estar listados em
// GAME_METHODS em js/app.js) são finos — delegam para funções internas deste
// módulo (não exportadas, recebem `app` explicitamente). Isso evita que cada
// chamada interna precise passar pelo despachante genérico de js/app.js.
import { buildDeck, cardMatchesTags, calculateElimScore, masterValues, computeHandSize } from './model.js?v=1';

// --- Ícones inline (cartas especiais), nas cores pastel do MADE ---
function svgSkip() {
    return `<svg viewBox="0 0 48 48" class="w-11 h-11"><circle cx="24" cy="24" r="19" fill="#FCB6D4" stroke="#fff" stroke-width="3"/><line x1="13" y1="13" x2="35" y2="35" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;
}
function svgReverse() {
    return `<svg viewBox="0 0 48 48" class="w-11 h-11"><path d="M14 16 A10 10 0 1 1 14 32" stroke="#7CCBEF" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 32 A10 10 0 1 1 34 16" stroke="#7CCBEF" stroke-width="5" fill="none" stroke-linecap="round"/><polygon points="14,10 20,17 9,19" fill="#7CCBEF"/><polygon points="34,38 28,31 39,29" fill="#7CCBEF"/></svg>`;
}
function svgDraw(n, color) {
    return `<svg viewBox="0 0 48 48" class="w-11 h-11"><rect x="5" y="12" width="26" height="32" rx="6" fill="${color}" stroke="#fff" stroke-width="2"/><rect x="15" y="4" width="26" height="32" rx="6" fill="${color}" stroke="#fff" stroke-width="2"/><text x="28" y="25" font-size="15" font-weight="900" fill="#1f2937" text-anchor="middle">+${n}</text></svg>`;
}
function svgChoose() {
    return `<svg viewBox="0 0 48 48" class="w-11 h-11"><rect x="4" y="4" width="19" height="19" rx="3" fill="#FDE2B5"/><rect x="25" y="4" width="19" height="19" rx="3" fill="#BAF7CE"/><rect x="4" y="25" width="19" height="19" rx="3" fill="#B8E7FA"/><rect x="25" y="25" width="19" height="19" rx="3" fill="#FCB6D4"/></svg>`;
}

const SPECIAL_ICONS = {
    skip: svgSkip(), reverse: svgReverse(),
    draw1: svgDraw(1, '#FDE2B5'), draw2: svgDraw(2, '#BAF7CE'),
    draw4choose: svgDraw(4, '#FCB6D4'), choose: svgChoose()
};

function findValue(attributes, attrIdx, valueId) {
    return attributes[attrIdx]?.values.find(v => v.id === valueId) || null;
}

function valueContentHtml(value) {
    if (!value) return '';
    return value.image
        ? `<img src="${value.image}" class="max-w-full max-h-full object-contain" />`
        : `<p class="text-[15px] leading-tight font-black text-slate-800 text-center px-1.5">${value.text || ''}</p>`;
}

// Face de uma carta (base ou especial). Para especiais "wild" (+4/Escolher)
// ainda não resolvidas (tags vazias — só acontece enquanto a carta está na
// mão, nunca na mesa, pois são resolvidas no instante em que são jogadas),
// mostra só o ícone genérico do tipo.
function cardFaceHtml(card, attributes) {
    if (card.kind === 'base') {
        const v0 = findValue(attributes, 0, card.tags[0].valueId);
        const v1 = findValue(attributes, 1, card.tags[1].valueId);
        return `
            <div class="w-full h-full flex flex-col">
                <div class="flex-1 flex items-center justify-center overflow-hidden p-1 border-b border-slate-200">${valueContentHtml(v0)}</div>
                <div class="flex-1 flex items-center justify-center overflow-hidden p-1">${valueContentHtml(v1)}</div>
            </div>`;
    }
    const icon = SPECIAL_ICONS[card.kind] || '';
    if (!card.tags || card.tags.length === 0) {
        return `<div class="w-full h-full flex items-center justify-center">${icon}</div>`;
    }
    const tag = card.tags[0];
    const v = findValue(attributes, tag.attr, tag.valueId);
    return `
        <div class="w-full h-full flex flex-col items-center justify-center relative p-1">
            <div class="absolute top-1 left-1">${icon}</div>
            <div class="mt-5 flex-1 flex items-center justify-center overflow-hidden">${valueContentHtml(v)}</div>
        </div>`;
}

// Geometria do leque de cartas na mão (ver uso em renderElimBoard): cada
// carta recebe um ângulo e uma altura calculados a partir da posição dela
// na mão, pra imitar o formato de um leque segurado na mão (cartas do meio
// mais altas e sem giro, cartas das pontas mais baixas e giradas pra fora).
// `CARD_W` tem que bater com a largura de `.elim-hand-card` no CSS.
const CARD_W = 148;
function handFanTransform(index, total) {
    if (total <= 1) return { angle: 0, lift: 0, marginLeft: 0 };
    const center = (total - 1) / 2;
    const offset = index - center;
    const maxAngle = Math.min(32, 8 + total * 1.6);
    const angle = (maxAngle / (total - 1)) * offset;
    const maxLift = 20;
    const lift = Math.pow(offset / center, 2) * maxLift;
    const overlapFraction = Math.min(0.62, 0.28 + total * 0.018);
    const marginLeft = index === 0 ? 0 : -(CARD_W * overlapFraction);
    return { angle, lift, marginLeft };
}

// --- Motor de turnos (funções internas, recebem `app` explicitamente) ---

function elim(app) { return app.state.elim; }

function topTags(app) {
    const d = elim(app).discardPile;
    const top = d[d.length - 1];
    return top ? (top.tags || []) : [];
}

function peekNext(app, steps) {
    const e = elim(app);
    const n = e.players.length;
    return ((e.currentPlayerIndex + e.direction * steps) % n + n) % n;
}

function advanceTurn(app, steps) {
    elim(app).currentPlayerIndex = peekNext(app, steps);
}

function reshuffleDiscardIntoDraw(app) {
    const e = elim(app);
    if (e.discardPile.length <= 1) return;
    const top = e.discardPile[e.discardPile.length - 1];
    const rest = e.discardPile.slice(0, e.discardPile.length - 1);
    e.discardPile = [top];
    e.drawPile = app.shuffleArray(rest);
}

function drawOne(app) {
    const e = elim(app);
    if (e.drawPile.length === 0) reshuffleDiscardIntoDraw(app);
    if (e.drawPile.length === 0) return null;
    return e.drawPile.pop();
}

function drawN(app, playerIdx, n) {
    const e = elim(app);
    for (let i = 0; i < n; i++) {
        const c = drawOne(app);
        if (!c) break;
        e.players[playerIdx].hand.push(c);
    }
}

function pickRandomMasterTag(app) {
    const attrs = app.state.activeGame.cards.attributes;
    const options = [];
    attrs.forEach((attr, idx) => masterValues(attr).forEach(v => options.push({ attr: idx, valueId: v.id })));
    if (options.length === 0) return { attr: 0, valueId: attrs[0].values[0].id };
    return options[Math.floor(Math.random() * options.length)];
}

function applyWildEffect(app, card) {
    const e = elim(app);
    if (card.kind === 'draw4choose') {
        const nextIdx = peekNext(app, 1);
        drawN(app, nextIdx, 4);
        advanceTurn(app, 2);
    } else {
        advanceTurn(app, 1);
    }
    e.turnDrawn = false;
}

function applyNonWildEffect(app, card) {
    const e = elim(app);
    switch (card.kind) {
        case 'skip':
            advanceTurn(app, 2);
            break;
        case 'reverse':
            e.direction *= -1;
            advanceTurn(app, 1);
            break;
        case 'draw1': {
            const nextIdx = peekNext(app, 1);
            drawN(app, nextIdx, 1);
            advanceTurn(app, 2);
            break;
        }
        case 'draw2': {
            const nextIdx = peekNext(app, 1);
            drawN(app, nextIdx, 2);
            advanceTurn(app, 2);
            break;
        }
        default:
            advanceTurn(app, 1);
    }
    e.turnDrawn = false;
}

function endMatch(app, winnerIdx) {
    const e = elim(app);
    e.winner = winnerIdx;
    const score = calculateElimScore(e.players, winnerIdx);
    openResultModal(app, winnerIdx, score);
    renderAll(app);
}

function afterTurnChange(app) {
    const e = elim(app);
    if (e.winner != null) { renderAll(app); return; }
    e.pendingWild = null;
    const cur = e.players[e.currentPlayerIndex];
    e.awaitingHandoff = !cur.isBot;
    renderAll(app);
    if (cur.isBot) {
        setTimeout(() => botTakeTurn(app), 700);
    }
}

// Lógica comum a jogada humana e jogada do bot: remove da mão, empilha no
// descarte, verifica vitória e resolve o efeito da carta (ou abre a escolha
// de valor, no caso das cartas "Comprar 4 e Escolher"/"Escolher").
function resolvePlay(app, playerIdx, card) {
    const e = elim(app);
    const player = e.players[playerIdx];
    const idx = player.hand.findIndex(c => c.instanceId === card.instanceId);
    if (idx === -1) return;
    player.hand.splice(idx, 1);
    e.discardPile.push(card);

    if (player.hand.length === 0) {
        endMatch(app, playerIdx);
        return;
    }

    if (card.kind === 'draw4choose' || card.kind === 'choose') {
        if (player.isBot) {
            card.tags = [pickRandomMasterTag(app)];
            applyWildEffect(app, card);
            afterTurnChange(app);
        } else {
            e.pendingWild = { cardInstanceId: card.instanceId, kind: card.kind };
            renderAll(app);
            openWildModal(app, card.kind);
        }
        return;
    }

    applyNonWildEffect(app, card);
    afterTurnChange(app);
}

// Bot simples (decisão de produto): joga a primeira carta normal válida da
// mão; só joga uma carta especial se não houver nenhuma normal válida; se
// não tiver nenhuma carta válida, compra uma e a joga imediatamente se ela
// servir, senão passa a vez.
function botTakeTurn(app) {
    const e = elim(app);
    if (!e || e.winner != null) return;
    const playerIdx = e.currentPlayerIndex;
    const player = e.players[playerIdx];
    if (!player.isBot) return;

    const top = topTags(app);
    const normal = player.hand.filter(c => c.kind === 'base' && cardMatchesTags(c, top));
    const special = player.hand.filter(c => c.kind !== 'base' && cardMatchesTags(c, top));
    const chosen = normal[0] || special[0];

    if (chosen) { resolvePlay(app, playerIdx, chosen); return; }

    const drawn = drawOne(app);
    if (drawn) {
        player.hand.push(drawn);
        if (cardMatchesTags(drawn, top)) { resolvePlay(app, playerIdx, drawn); return; }
    }
    advanceTurn(app, 1);
    e.turnDrawn = false;
    afterTurnChange(app);
}

function openWildModal(app, kind) {
    const attrs = app.state.activeGame.cards.attributes;
    const title = kind === 'draw4choose'
        ? 'Comprar 4 e Escolher: escolha o novo valor em jogo. O próximo jogador comprará 4 cartas e perderá a vez.'
        : 'Escolher: escolha o novo valor em jogo.';
    const titleEl = document.getElementById('elim-wild-title');
    if (titleEl) titleEl.innerText = title;

    const container = document.getElementById('elim-wild-options');
    if (container) {
        container.innerHTML = '';
        attrs.forEach((attr, attrIdx) => {
            masterValues(attr).forEach(v => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 p-4 flex flex-col items-center gap-2 transition';
                btn.innerHTML = `<span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${attr.name || ''}</span><div class="w-full h-16 flex items-center justify-center overflow-hidden">${valueContentHtml(v)}</div>`;
                btn.onclick = () => app.elimChooseWildValue(attrIdx, v.id);
                container.appendChild(btn);
            });
        });
    }
    const modal = document.getElementById('modal-elim-wild');
    if (modal) modal.style.display = 'flex';
}

function openResultModal(app, winnerIdx, score) {
    const e = elim(app);
    const winner = e.players[winnerIdx];
    const modal = document.getElementById('modal-elim-result');
    if (!modal) return;

    const icon = document.getElementById('elim-result-icon');
    if (icon) icon.className = !winner.isBot ? 'fa-solid fa-trophy text-amber-500 text-3xl animate-bounce' : 'fa-solid fa-robot text-slate-500 text-3xl';
    const titleEl = document.getElementById('elim-result-title');
    if (titleEl) titleEl.innerText = `${winner.name} venceu a partida!`;
    const subEl = document.getElementById('elim-result-subtitle');
    if (subEl) subEl.innerText = `Pontuação: ${score} pts (10 pts por carta restante na mão de cada oponente)`;

    const board = document.getElementById('elim-result-scoreboard');
    if (board) {
        board.innerHTML = e.players.map((p, idx) => `
            <div class="flex items-center justify-between px-4 py-2.5 rounded-xl ${idx === winnerIdx ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'}">
                <span class="font-bold text-sm text-slate-700">${idx === winnerIdx ? '<i class="fa-solid fa-crown text-amber-500 mr-1.5"></i>' : ''}${app.escapeCardText(p.name)}</span>
                <span class="text-sm font-black text-slate-500">${idx === winnerIdx ? 'Venceu' : `${p.hand.length} carta${p.hand.length === 1 ? '' : 's'} restante${p.hand.length === 1 ? '' : 's'}`}</span>
            </div>
        `).join('');
    }
    modal.style.display = 'flex';
}

function renderAll(app) {
    const e = elim(app);
    const game = app.state.activeGame;
    if (!e || !game) return;
    const attributes = game.cards.attributes;
    const frontDesign = game.frontDesign || 'imagens/frente/frente01.png';
    const backDesign = game.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text || '-'; };
    const info = game.disciplineInfo || {};
    setEl('elim-header-title', game.name);
    setEl('elim-header-disciplina', info.disciplina);
    setEl('elim-header-conteudo', info.conteudo);
    setEl('elim-header-serie', info.serie);
    setEl('elim-header-autores', (info.autores || []).join(', ') || 'Não informado');
    const enunciadoEl = document.getElementById('elim-enunciado-content');
    if (enunciadoEl) enunciadoEl.innerHTML = game.enunciado || '';

    const cur = e.players[e.currentPlayerIndex];

    const banner = document.getElementById('elim-turn-banner');
    if (banner) banner.innerText = e.winner != null ? 'Partida encerrada' : `Vez de: ${cur.name}`;

    document.getElementById('elim-bot-indicator')?.classList.toggle('hidden', !(cur.isBot && e.winner == null));

    const handoff = document.getElementById('elim-handoff-overlay');
    if (handoff) {
        handoff.classList.toggle('hidden', !e.awaitingHandoff);
        const nameEl = document.getElementById('elim-handoff-name');
        if (nameEl) nameEl.innerText = cur.name;
    }

    const discardEl = document.getElementById('elim-discard-top');
    if (discardEl) {
        const top = e.discardPile[e.discardPile.length - 1];
        discardEl.style.backgroundImage = `url('${frontDesign}')`;
        discardEl.style.backgroundSize = 'cover';
        discardEl.style.backgroundPosition = 'center';
        discardEl.innerHTML = top ? cardFaceHtml(top, attributes) : '';
    }

    const drawPileEl = document.getElementById('elim-draw-pile');
    if (drawPileEl) {
        drawPileEl.style.backgroundImage = `url('${backDesign}')`;
        drawPileEl.style.backgroundSize = 'cover';
        drawPileEl.style.backgroundPosition = 'center';
    }
    const drawCountEl = document.getElementById('elim-draw-pile-count');
    if (drawCountEl) drawCountEl.innerText = String(e.drawPile.length);

    const panel = document.getElementById('elim-players-panel');
    if (panel) {
        panel.innerHTML = e.players.map((p, idx) => `
            <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl ${idx === e.currentPlayerIndex && e.winner == null ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}">
                <span class="text-sm font-bold text-slate-700 truncate">${p.isBot ? '<i class="fa-solid fa-robot mr-1.5 text-slate-400"></i>' : '<i class="fa-solid fa-user mr-1.5 text-slate-400"></i>'}${app.escapeCardText(p.name)}</span>
                <span class="text-sm font-black text-slate-500 shrink-0">${p.hand.length} ${p.hand.length === 1 ? 'carta' : 'cartas'}</span>
            </div>
        `).join('');
    }

    const handEl = document.getElementById('elim-hand');
    if (handEl) {
        if (cur.isBot || e.awaitingHandoff || e.winner != null) {
            handEl.innerHTML = '';
        } else {
            const top = topTags(app);
            handEl.innerHTML = cur.hand.map((card, idx) => {
                const playable = cardMatchesTags(card, top);
                const { angle, lift, marginLeft } = handFanTransform(idx, cur.hand.length);
                const slotStyle = `transform: rotate(${angle.toFixed(1)}deg) translateY(${lift.toFixed(1)}px); margin-left:${marginLeft.toFixed(1)}px; z-index:${idx};`;
                return `
                    <div class="elim-hand-slot" style="${slotStyle}">
                        <div class="elim-hand-card ${playable ? 'playable' : 'disabled'}" data-instance="${card.instanceId}" style="background-image:url('${frontDesign}');">
                            <div class="zoom-icon" title="Visualizar ampliado"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                            <div class="elim-hand-card-inner">${cardFaceHtml(card, attributes)}</div>
                        </div>
                    </div>
                `;
            }).join('');
            handEl.querySelectorAll('.elim-hand-card').forEach(el => {
                const instanceId = el.dataset.instance;
                const zoom = el.querySelector('.zoom-icon');
                if (zoom) zoom.onclick = (ev) => { ev.stopPropagation(); app.elimPreviewHandCard(instanceId); };
                el.onclick = () => app.elimPlayHandCard(instanceId);
            });
        }
    }

    const canAct = !cur.isBot && e.winner == null && !e.awaitingHandoff && !e.pendingWild;
    if (drawPileEl) drawPileEl.classList.toggle('opacity-40', !(canAct && !e.turnDrawn));
    const passBtn = document.getElementById('elim-pass-btn');
    if (passBtn) passBtn.classList.toggle('hidden', !(canAct && e.turnDrawn));
}

export const playerMethods = {
    testGameFromCreator: function() {
        if (this.state.editingGame) {
            this.state.editingGame.is_draft = false;
            this.autoSaveNow();
        }
        this.state.isTestingFromCreator = true;
        this.state.selectedGameIdForPlay = null;
        this.elimOpenSetupModal();
    },

    openDifficultySelect: function(gameId) {
        this.state.selectedGameIdForPlay = gameId;
        this.elimOpenSetupModal();
    },

    elimOpenSetupModal: function() {
        const game = this.state.isTestingFromCreator
            ? this.state.editingGame
            : this.state.games.find(g => String(g.id) === String(this.state.selectedGameIdForPlay));
        const nameEl = document.getElementById('elim-setup-game-name');
        if (nameEl) nameEl.innerText = game?.name || '';
        const modal = document.getElementById('modal-elim-setup');
        if (modal) modal.style.display = 'flex';
    },

    elimCloseSetupModal: function() {
        const modal = document.getElementById('modal-elim-setup');
        if (modal) modal.style.display = 'none';
    },

    elimStartMatch: function(mode) {
        const sourceGame = this.state.isTestingFromCreator
            ? this.state.editingGame
            : this.state.games.find(g => String(g.id) === String(this.state.selectedGameIdForPlay));
        if (!sourceGame) return;

        const configs = {
            solo: [{ name: 'Você', isBot: false }, { name: 'Computador', isBot: true }],
            trio: [{ name: 'Jogador 1', isBot: false }, { name: 'Jogador 2', isBot: false }, { name: 'Computador', isBot: true }],
            duo: [{ name: 'Jogador 1', isBot: false }, { name: 'Jogador 2', isBot: false }]
        };
        const roster = configs[mode] || configs.solo;
        const numPlayers = roster.length;

        this.state.activeGame = JSON.parse(JSON.stringify(sourceGame));
        const attributes = this.state.activeGame.cards.attributes;
        const { deck, cartasBase } = buildDeck(attributes, numPlayers);
        const shuffled = this.shuffleArray(deck);
        const handSize = computeHandSize(cartasBase, numPlayers);

        const players = roster.map(p => ({ ...p, hand: [] }));
        for (let i = 0; i < handSize; i++) {
            players.forEach(p => {
                const c = shuffled.pop();
                if (c) p.hand.push(c);
            });
        }

        let discardTop = null;
        const setAside = [];
        while (shuffled.length > 0) {
            const c = shuffled.pop();
            if (c.kind === 'base') { discardTop = c; break; }
            setAside.push(c);
        }
        const drawPile = [...shuffled, ...setAside];

        this.state.elim = {
            mode,
            players,
            drawPile,
            discardPile: discardTop ? [discardTop] : [],
            currentPlayerIndex: 0,
            direction: 1,
            turnDrawn: false,
            pendingWild: null,
            awaitingHandoff: false,
            winner: null
        };

        this.elimCloseSetupModal();
        this.switchView('player');
        document.getElementById('back-from-player-btn')?.classList.remove('hidden');
        document.getElementById('save-from-player-btn')?.classList.toggle('hidden', !this.state.isTestingFromCreator);

        afterTurnChange(this);
        this.showNotification(`Partida iniciada! ${numPlayers} jogadores, ${handSize} cartas na mão de cada um.`, 'Eliminação');
    },

    elimRestartMatch: function() {
        this.elimCloseResultModal();
        if (this.state.elim) this.elimStartMatch(this.state.elim.mode);
    },

    elimConfirmHandoff: function() {
        if (!this.state.elim) return;
        this.state.elim.awaitingHandoff = false;
        renderAll(this);
    },

    elimPlayHandCard: function(cardInstanceId) {
        const e = this.state.elim;
        if (!e || e.winner != null || e.awaitingHandoff || e.pendingWild) return;
        const playerIdx = e.currentPlayerIndex;
        const player = e.players[playerIdx];
        if (player.isBot) return;
        const card = player.hand.find(c => c.instanceId === cardInstanceId);
        if (!card) return;
        if (!cardMatchesTags(card, topTags(this))) {
            this.showNotification('Essa carta não compartilha nenhum atributo com a carta da mesa.');
            return;
        }
        resolvePlay(this, playerIdx, card);
    },

    elimDrawCard: function() {
        const e = this.state.elim;
        if (!e || e.winner != null || e.awaitingHandoff || e.pendingWild) return;
        const player = e.players[e.currentPlayerIndex];
        if (player.isBot || e.turnDrawn) return;
        const card = drawOne(this);
        if (!card) { this.showNotification('O monte de compra está vazio.'); return; }
        player.hand.push(card);
        e.turnDrawn = true;
        renderAll(this);
    },

    elimPassTurn: function() {
        const e = this.state.elim;
        if (!e || e.winner != null || e.awaitingHandoff || e.pendingWild) return;
        const player = e.players[e.currentPlayerIndex];
        if (player.isBot || !e.turnDrawn) return;
        advanceTurn(this, 1);
        e.turnDrawn = false;
        afterTurnChange(this);
    },

    elimChooseWildValue: function(attrIdx, valueId) {
        const e = this.state.elim;
        const pw = e?.pendingWild;
        if (!pw) return;
        const card = e.discardPile.find(c => c.instanceId === pw.cardInstanceId);
        if (card) card.tags = [{ attr: attrIdx, valueId }];
        const modal = document.getElementById('modal-elim-wild');
        if (modal) modal.style.display = 'none';
        if (card) applyWildEffect(this, card);
        afterTurnChange(this);
    },

    elimPreviewHandCard: function(instanceId) {
        const e = this.state.elim;
        if (!e || !this.state.activeGame) return;
        const cur = e.players[e.currentPlayerIndex];
        const card = cur.hand.find(c => c.instanceId === instanceId);
        if (!card) return;
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-card-container');
        const text = document.getElementById('preview-card-text');
        container.style.backgroundImage = `url('${this.state.activeGame.frontDesign || 'imagens/frente/frente01.png'}')`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.innerHTML = cardFaceHtml(card, this.state.activeGame.cards.attributes);
        text.innerText = 'Carta Selecionada';
        modal.style.display = 'flex';
    },

    elimCloseResultModal: function() {
        const modal = document.getElementById('modal-elim-result');
        if (modal) modal.style.display = 'none';
    },

    showGameRules: function() {
        const source = this.state.activeGame || this.state.editingGame || {};
        const rulesHtml = source.regra || '<p>Regra não definida.</p>';
        const objectiveHtml = source.objetivo || '';
        const row = (icon, title, desc) => `
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 shrink-0 flex items-center justify-center">${icon}</div>
                <p class="text-sm"><strong>${title}:</strong> ${desc}</p>
            </div>`;
        const template = `
            <div class="text-left space-y-4">
                <div>${rulesHtml}</div>
                <div class="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-200">
                    <p class="font-black text-sm uppercase tracking-widest text-slate-500">Cartas especiais:</p>
                    ${row(svgSkip(), 'Perder a Vez', 'o próximo jogador perde a vez.')}
                    ${row(svgReverse(), 'Retornar a Ordem', 'inverte o sentido da rodada.')}
                    ${row(svgDraw(1, '#FDE2B5'), 'Comprar 1', 'o próximo jogador compra 1 carta e perde a vez.')}
                    ${row(svgDraw(2, '#BAF7CE'), 'Comprar 2', 'o próximo jogador compra 2 cartas e perde a vez.')}
                    ${row(svgDraw(4, '#FCB6D4'), 'Comprar 4 e Escolher', 'jogável a qualquer momento. Você escolhe o novo valor em jogo e o próximo jogador compra 4 cartas e perde a vez.')}
                    ${row(svgChoose(), 'Escolher', 'jogável a qualquer momento. Você escolhe o novo valor em jogo, sem forçar compra.')}
                </div>
                <div class="p-4 bg-sky-50 rounded-2xl border border-sky-200">
                    <p class="text-sm text-sky-900"><i class="fa-solid fa-circle-info mr-1"></i> Uma carta só pode ser jogada sobre a carta da mesa se compartilhar o valor de pelo menos um dos dois atributos com ela.</p>
                </div>
                <div>${objectiveHtml}</div>
            </div>
        `;
        document.getElementById('notification-title').innerText = 'Regras do Jogo';
        document.getElementById('notification-message').innerHTML = template;
        document.getElementById('modal-notification').style.display = 'flex';
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
    }
};
