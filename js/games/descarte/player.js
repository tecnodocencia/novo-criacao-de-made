// js/games/descarte/player.js
//
// Motor de partida do modelo Descarte a Carta (apelido "Can Can"): jogo de cartas
// por descarte, jogado "hotseat" (todos os jogadores humanos usam o mesmo dispositivo,
// passando a vez na tela). Ver js/games/descarte/model.js para a geração
// do baralho e as regras de combinação entre cartas.
//
// Arquitetura interna: os métodos exportados em `playerMethods` (chamados
// via onclick dos partials/modais, e por isso precisam estar listados em
// GAME_METHODS em js/app.js) são finos — delegam para funções internas deste
// módulo (não exportadas, recebem `app` explicitamente). Isso evita que cada
// chamada interna precise passar pelo despachante genérico de js/app.js.
import { buildDeck, cardMatchesTags, calculateDescarteScore, masterValues, computeHandSize } from './model.js?v=6';

// --- Ícones inline (cartas especiais), nas cores pastel do MADE ---
function svgSkip() {
    return `<svg viewBox="0 0 48 48" class="w-9 h-9"><circle cx="24" cy="24" r="19" fill="#FCB6D4" stroke="#fff" stroke-width="3"/><line x1="13" y1="13" x2="35" y2="35" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;
}
function svgReverse() {
    return `<svg viewBox="0 0 48 48" class="w-9 h-9"><path d="M14 16 A10 10 0 1 1 14 32" stroke="#7CCBEF" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 32 A10 10 0 1 1 34 16" stroke="#7CCBEF" stroke-width="5" fill="none" stroke-linecap="round"/><polygon points="14,10 20,17 9,19" fill="#7CCBEF"/><polygon points="34,38 28,31 39,29" fill="#7CCBEF"/></svg>`;
}
function svgDraw(n, color) {
    return `<svg viewBox="0 0 48 48" class="w-9 h-9"><rect x="5" y="12" width="26" height="32" rx="6" fill="${color}" stroke="#fff" stroke-width="2"/><rect x="15" y="4" width="26" height="32" rx="6" fill="${color}" stroke="#fff" stroke-width="2"/><text x="28" y="25" font-size="15" font-weight="900" fill="#1f2937" text-anchor="middle">+${n}</text></svg>`;
}
// "Escolher": três cartas em leque e a do meio marcada — escolher um valor,
// seja ele texto, imagem ou cor (antes eram 4 quadrados coloridos, que
// sugeriam só "escolher uma cor").
function svgChoose() {
    return `<svg viewBox="0 0 48 48" class="w-9 h-9"><g transform="rotate(-20 24 44)"><rect x="15" y="9" width="18" height="25" rx="3" fill="#fff" stroke="#6DBBE3" stroke-width="2.5"/></g><g transform="rotate(20 24 44)"><rect x="15" y="9" width="18" height="25" rx="3" fill="#fff" stroke="#6DBBE3" stroke-width="2.5"/></g><rect x="14" y="5" width="20" height="28" rx="3.5" fill="#FBD9E7" stroke="#F18AB5" stroke-width="2.5"/><circle cx="33" cy="33" r="8" fill="#7CC79B" stroke="#fff" stroke-width="2"/><path d="M29.5 33 L32 35.5 L36.5 30.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

const SPECIAL_ICONS = {
    skip: svgSkip(), reverse: svgReverse(),
    draw1: svgDraw(1, '#FDE2B5'), draw2: svgDraw(2, '#BAF7CE'),
    draw4choose: svgDraw(4, '#FCB6D4'), choose: svgChoose()
};

function findValue(attributes, attrIdx, valueId) {
    return attributes[attrIdx]?.values.find(v => v.id === valueId) || null;
}

// --- Ilustrações grandes das cartas especiais (aparecem na face da carta) ---
// Os ícones pequenos acima continuam servindo à lista de regras; estas são
// desenhadas pra ocupar a carta, com contorno escuro e cores pastel do MADE.
let artSeq = 0;
function artSkip() {
    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" aria-hidden="true">
        <circle cx="50" cy="50" r="36" fill="#FFF4F8" stroke="#F18AB5" stroke-width="5"/>
        <line x1="26" y1="26" x2="74" y2="74" stroke="#F18AB5" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
}
function artReverse() {
    const id = 'ar' + (++artSeq);
    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" aria-hidden="true">
        <defs><marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" refX="10" refY="10" orient="auto"><path d="M4 3 L17 10 L4 17 Z" fill="#6DBBE3" stroke="#6DBBE3" stroke-width="2" stroke-linejoin="round"/></marker></defs>
        <path d="M24 46 A27 27 0 0 1 68 26" fill="none" stroke="#6DBBE3" stroke-width="6" stroke-linecap="round" marker-end="url(#${id})"/>
        <path d="M76 54 A27 27 0 0 1 32 74" fill="none" stroke="#6DBBE3" stroke-width="6" stroke-linecap="round" marker-end="url(#${id})"/>
    </svg>`;
}
function artDraw(n, color, stroke) {
    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" aria-hidden="true">
        <g transform="rotate(-10 40 54)"><rect x="16" y="24" width="42" height="56" rx="8" fill="#fff" stroke="${stroke}" stroke-width="3"/></g>
        <rect x="38" y="16" width="44" height="58" rx="8" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <text x="60" y="55" text-anchor="middle" font-family="inherit" font-weight="800" font-size="28" fill="#475569">+${n}</text>
    </svg>`;
}
function artChoose() {
    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" aria-hidden="true">
        <g transform="rotate(-22 50 92)"><rect x="34" y="22" width="32" height="44" rx="7" fill="#fff" stroke="#6DBBE3" stroke-width="3"/></g>
        <g transform="rotate(22 50 92)"><rect x="34" y="22" width="32" height="44" rx="7" fill="#fff" stroke="#6DBBE3" stroke-width="3"/></g>
        <rect x="32" y="12" width="36" height="50" rx="8" fill="#FBD9E7" stroke="#F18AB5" stroke-width="3.5"/>
        <rect x="40" y="24" width="20" height="4" rx="2" fill="#F18AB5" opacity="0.55"/>
        <rect x="40" y="33" width="14" height="4" rx="2" fill="#F18AB5" opacity="0.55"/>
        <circle cx="66" cy="62" r="13" fill="#7CC79B" stroke="#fff" stroke-width="3"/>
        <path d="M60 62 L64.5 66.5 L72 58.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}
const SPECIAL_ART = {
    skip: artSkip,
    reverse: artReverse,
    draw1: () => artDraw(1, '#FBE9CC', '#E8B26A'),
    draw2: () => artDraw(2, '#D6F3E0', '#7CC79B'),
    draw4choose: () => artDraw(4, '#FBD9E7', '#F18AB5'),
    choose: artChoose
};
const SPECIAL_LABELS = {
    skip: 'Perde a vez',
    reverse: 'Inverte a ordem',
    draw1: 'Compra 1',
    draw2: 'Compra 2',
    draw4choose: 'Compra 4 e escolhe',
    choose: 'Escolhe'
};

function valueContentHtml(value) {
    if (!value) return '';
    return value.image
        ? `<img src="${value.image}" class="max-w-full max-h-full object-contain" />`
        : `<p class="descarte-fit-text text-[13px] leading-tight font-black text-slate-800 text-center px-1" style="max-width:100%;">${value.text || ''}</p>`;
}

// Textos longos (ex.: "INTERDISCIPLINARIDADE") não cabem na metade da carta
// no tamanho padrão: a fonte de cada valor diminui até o texto caber. Se nem
// no tamanho mínimo (ainda legível) couber, a palavra quebra com hífen. Precisa rodar com os
// elementos já na tela (visíveis), depois de cada desenho das cartas.
const FIT_MAX_PX = 13;
const FIT_MIN_PX = 8;
function fitCardTexts(root) {
    (root || document).querySelectorAll('.descarte-fit-text').forEach(el => {
        const box = el.parentElement;
        if (!box || !box.clientWidth) return;
        const overflows = () => el.scrollWidth > el.clientWidth + 1 || el.offsetHeight > box.clientHeight;
        let size = FIT_MAX_PX;
        el.style.fontSize = size + 'px';
        el.style.overflowWrap = '';
        el.style.hyphens = '';
        while (size > FIT_MIN_PX && overflows()) {
            size -= 0.5;
            el.style.fontSize = size + 'px';
        }
        if (overflows()) {
            el.lang = 'pt-BR';
            el.style.hyphens = 'auto';
            if (overflows()) el.style.overflowWrap = 'anywhere';
        }
    });
}

// O tamanho das cartas acompanha a altura da janela (CSS), então reajusta
// os textos quando ela muda.
let fitResizeTimer = null;
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        clearTimeout(fitResizeTimer);
        fitResizeTimer = setTimeout(() => fitCardTexts(document), 150);
    });
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
    const art = (SPECIAL_ART[card.kind] || (() => ''))();
    const label = SPECIAL_LABELS[card.kind] || '';
    if (!card.tags || card.tags.length === 0) {
        return `
            <div class="w-full h-full flex flex-col items-center justify-center p-1" style="gap:2px;">
                <div class="w-full min-h-0 flex items-center justify-center" style="flex:4 1 0;">${art}</div>
                <p class="text-[10px] leading-tight font-black text-slate-700 text-center uppercase tracking-wide">${label}</p>
            </div>`;
    }
    const tag = card.tags[0];
    const v = findValue(attributes, tag.attr, tag.valueId);
    // O valor fica na mesma metade em que aparece nas cartas normais (1º
    // atributo em cima, 2º embaixo); a ilustração ocupa a outra metade.
    const artHtml = `<div class="w-full min-h-0 flex items-center justify-center" style="flex:3 1 0;">${art}</div>`;
    const valueHtml = `<div class="w-full min-h-0 flex items-center justify-center overflow-hidden" style="flex:2 1 0;">${valueContentHtml(v)}</div>`;
    return `
        <div class="w-full h-full flex flex-col items-center justify-center p-1" style="gap:2px;">
            ${tag.attr === 0 ? valueHtml + artHtml : artHtml + valueHtml}
        </div>`;
}

// Geometria do leque de cartas na mão (ver uso em renderDescarteBoard): cada
// carta recebe um ângulo e uma altura calculados a partir da posição dela
// na mão, pra imitar o formato de um leque segurado na mão (cartas do meio
// mais altas e sem giro, cartas das pontas mais baixas e giradas pra fora).
// `CARD_W` tem que bater com a largura de `.descarte-hand-card` no CSS.
const CARD_W = 160;
function handFanTransform(index, total, cardW = CARD_W) {
    if (total <= 1) return { angle: 0, lift: 0, marginLeft: 0, overlap: 0 };
    const center = (total - 1) / 2;
    const offset = index - center;
    const maxAngle = Math.min(32, 8 + total * 1.6);
    const angle = (maxAngle / (total - 1)) * offset;
    const maxLift = 20;
    const lift = Math.pow(offset / center, 2) * maxLift;
    const overlapFraction = Math.min(0.62, 0.28 + total * 0.018);
    const marginLeft = index === 0 ? 0 : -(cardW * overlapFraction);
    return { angle, lift, marginLeft, overlap: index === 0 ? 0 : overlapFraction };
}

// --- Motor de turnos (funções internas, recebem `app` explicitamente) ---

function descarte(app) { return app.state.descarte; }

// Partida em rede (link compartilhado, um aluno por computador — ver
// js/games/descarte/net.js): `e.localIdx` é o jogador deste computador e
// `e.net` traz os ganchos de sincronização (`role` 'host' ou 'guest'). Sem
// `e.net` é a partida local de sempre, em que a vez é de quem não é o bot.
function isLocalTurn(e) {
    if (e.localIdx != null) return e.currentPlayerIndex === e.localIdx;
    return !e.players[e.currentPlayerIndex].isBot;
}

function canLocalAct(e) {
    return !!e && e.winner == null && !e.awaitingHandoff && !e.pendingWild && !e.busy && isLocalTurn(e);
}

// Dono da mão mostrada na tela: o aluno deste computador (rede), o único
// humano (contra o computador, mão sempre visível) ou o humano da vez
// (vários humanos no mesmo aparelho).
function handOwnerIdx(e) {
    if (e.localIdx != null) return e.localIdx;
    const humans = e.players.map((p, i) => p.isBot ? -1 : i).filter(i => i >= 0);
    return humans.length === 1 ? humans[0] : e.currentPlayerIndex;
}

function isGuest(e) { return !!(e && e.net && e.net.role === 'guest'); }

// O convidado não roda o motor: manda a jogada para o anfitrião e espera o
// estado novo. `busy` impede cliques repetidos enquanto isso (e se solta
// sozinho se a resposta não vier).
function sendToHost(app, action) {
    const e = descarte(app);
    e.busy = true;
    e.net.send(action);
    setTimeout(() => { if (descarte(app) === e) e.busy = false; }, 5000);
}

function topTags(app) {
    const d = descarte(app).discardPile;
    const top = d[d.length - 1];
    return top ? (top.tags || []) : [];
}

function peekNext(app, steps) {
    const e = descarte(app);
    const n = e.players.length;
    return ((e.currentPlayerIndex + e.direction * steps) % n + n) % n;
}

function advanceTurn(app, steps) {
    descarte(app).currentPlayerIndex = peekNext(app, steps);
}

// Monte de compra vazio: as cartas já jogadas (menos a do topo da mesa) são
// embaralhadas e voltam para o monte. `reshuffleFx` faz o renderAll seguinte
// mostrar a animação e o aviso (ver playReshuffleFx).
function reshuffleDiscardIntoDraw(app) {
    const e = descarte(app);
    if (e.discardPile.length <= 1) return;
    const top = e.discardPile[e.discardPile.length - 1];
    const rest = e.discardPile.slice(0, e.discardPile.length - 1);
    // "Comprar 4 e Escolher"/"Escolher" voltam sem o valor escolhido na jogada.
    rest.forEach(c => { if (c.wild) c.tags = []; });
    e.discardPile = [top];
    e.drawPile = app.shuffleArray(rest);
    e.reshuffleFx = (e.reshuffleFx || 0) + rest.length;
}

function drawOne(app) {
    const e = descarte(app);
    if (e.drawPile.length === 0) reshuffleDiscardIntoDraw(app);
    if (e.drawPile.length === 0) return null;
    return e.drawPile.pop();
}

function drawN(app, playerIdx, n) {
    const e = descarte(app);
    for (let i = 0; i < n; i++) {
        const c = drawOne(app);
        if (!c) break;
        e.players[playerIdx].hand.push(c);
        queueDrawAnim(app, playerIdx, c);
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
    const e = descarte(app);
    if (card.kind === 'draw4choose') {
        const nextIdx = peekNext(app, 1);
        drawN(app, nextIdx, 4);
        advanceTurn(app, 1);
    } else {
        advanceTurn(app, 1);
    }
    e.turnDrawn = false;
}

function applyNonWildEffect(app, card) {
    const e = descarte(app);
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
            advanceTurn(app, 1);
            break;
        }
        case 'draw2': {
            const nextIdx = peekNext(app, 1);
            drawN(app, nextIdx, 2);
            advanceTurn(app, 1);
            break;
        }
        default:
            advanceTurn(app, 1);
    }
    e.turnDrawn = false;
}

function endMatch(app, winnerIdx) {
    const e = descarte(app);
    e.winner = winnerIdx;
    const score = calculateDescarteScore(e.players, winnerIdx);
    openResultModal(app, winnerIdx, score);
    renderAll(app);
}

// Ritmo da vez do computador: duas pausas curtas (pensar, depois agir) em vez
// de resolver tudo no instante em que o timer de "pensando" acaba — sem elas
// a jogada do bot parecia instantânea demais (decisão e efeito no mesmo
// quadro). Jogada humana não usa nenhuma dessas pausas.
const BOT_THINK_MS = 1000;
const BOT_ACT_MS = 700;

// As molduras padrão (imagens/frente/*) trazem um contorno vermelho grosso
// colado na borda da imagem; ampliar o fundo em 10% (centralizado) joga esse
// contorno pra fora da carta sem mexer no desenho de dentro. Imagens enviadas
// pelo professor (qualquer outro caminho) continuam com "cover".
function frontBgSize(design) {
    return (design || "").startsWith("imagens/frente/") ? "110% 110%" : "cover";
}

// --- Animações de jogada / compra ---
// Uma cópia da carta ("fantasma", position:fixed) voa da origem até o destino
// e some; o DOM real só é redesenhado por renderAll(). Ignorado quando o
// sistema pede menos movimento (prefers-reduced-motion).
const FLY_MS = 500;        // jogada do próprio jogador (da mão pra mesa)
const FLY_OPP_MS = 2200;   // jogada de oponente/computador: lenta, pra dar pra acompanhar
const FLY_DRAW_MS = 900;   // compra (monte -> mão)
const DRAW_STAGGER_MS = 250; // intervalo entre cartas de uma compra múltipla (+2, +4)

// Compras são enfileiradas e só animadas no fim de renderAll(), quando a mão
// de destino já foi redesenhada com as cartas novas (é preciso o elemento
// delas pra saber pra onde voar).
function queueDrawAnim(app, playerIdx, card) {
    const e = descarte(app);
    (e.drawAnims = e.drawAnims || []).push({ playerIdx, card });
}

function flushDrawAnims(app) {
    const e = descarte(app);
    const queue = e.drawAnims || [];
    e.drawAnims = [];
    queue.forEach(({ playerIdx, card }, i) => {
        const handCard = document.querySelector(`#descarte-hand .descarte-hand-card[data-instance="${card.instanceId}"]`);
        // A carta nova fica escondida na mão até a cópia chegar.
        if (handCard) handCard.style.visibility = 'hidden';
        setTimeout(() => {
            const pile = document.getElementById('descarte-draw-pile');
            // Mão visível (vez de quem comprou): a carta sai virada do monte e
            // vira durante o voo. Senão (computador / outro jogador), voa
            // virada pra baixo até a mão dele.
            const target = handCard && handCard.isConnected ? handCard : null;
            const duration = target
                ? flyCard(app, pile, target, card, { duration: FLY_DRAW_MS, flip: true })
                : flyCard(app, pile, playerRowEl(playerIdx), null, { duration: FLY_DRAW_MS });
            if (target) setTimeout(() => { target.style.visibility = ''; }, duration);
        }, i * DRAW_STAGGER_MS);
    });
}

// Reabastecimento do monte: cópias das cartas saem da mesa, viram de costas e
// voam para o monte de compra, uma atrás da outra, junto com um aviso.
// `delay` espera as compras em andamento (a que esvaziou o monte) terminarem.
const RESHUFFLE_FLY_MS = 700;
const RESHUFFLE_STAGGER_MS = 90;
function playReshuffleFx(app, count, delay) {
    setTimeout(() => {
        showDescarteToast('O monte acabou! As cartas já jogadas foram embaralhadas e voltaram para o monte de compra.');
        const from = document.getElementById('descarte-discard-top');
        const to = document.getElementById('descarte-draw-pile');
        if (!from || !to || !document.body.animate) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const game = app.state.activeGame;
        const frontDesign = game.frontDesign || 'imagens/frente/frente01.png';
        const backDesign = game.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        if (!a.width) return;
        const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
        const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
        const face = (bg, size, extra) => `<div class="descarte-pile-card" style="position:absolute;inset:0;width:100%;height:100%;margin:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-image:url('${bg}');background-size:${size};background-position:center;${extra}"></div>`;
        for (let i = 0; i < Math.min(count, 8); i++) {
            setTimeout(() => {
                const wrap = document.createElement('div');
                wrap.style.cssText = `position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;z-index:10050;pointer-events:none;perspective:900px;`;
                wrap.innerHTML = `<div style="position:absolute;inset:0;transform-style:preserve-3d;">${face(frontDesign, frontBgSize(frontDesign), '')}${face(backDesign, 'cover', 'transform:rotateY(180deg);')}</div>`;
                document.body.appendChild(wrap);
                const spin = (i % 2 ? 1 : -1) * (6 + i * 2);
                wrap.animate([
                    { transform: 'translate(0, 0) rotate(0deg) scale(1)', offset: 0 },
                    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) rotate(${spin}deg) scale(1.05)`, offset: 0.5 },
                    { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, offset: 1 }
                ], { duration: RESHUFFLE_FLY_MS, easing: 'ease-in-out' }).onfinish = () => wrap.remove();
                wrap.firstElementChild.animate([
                    { transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }
                ], { duration: RESHUFFLE_FLY_MS * 0.6, easing: 'ease-in-out', fill: 'forwards' });
                setTimeout(() => wrap.remove(), RESHUFFLE_FLY_MS + 300);
            }, i * RESHUFFLE_STAGGER_MS);
        }
        // O monte "recebe" as cartas: pulsa quando a última chega.
        setTimeout(() => {
            to.classList.remove('descarte-pile-refill');
            void to.offsetWidth;
            to.classList.add('descarte-pile-refill');
        }, Math.min(count, 8) * RESHUFFLE_STAGGER_MS + RESHUFFLE_FLY_MS - 150);
    }, delay);
}

// Aviso curto sobre a mesa, que some sozinho (não interrompe a partida).
function showDescarteToast(message) {
    let el = document.getElementById('descarte-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'descarte-toast';
        el.className = 'descarte-toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.innerHTML = `<i class="fa-solid fa-shuffle"></i><span></span>`;
    el.querySelector('span').innerText = message;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

// Quando a vez muda de jogador, um aviso grande aparece no meio da mesa por
// um instante ("Sua vez!" / "Vez do Computador"). A chave guarda o último
// anúncio para não repetir a cada redesenho; uma partida nova anuncia de novo.
let lastTurnKey = null;
function announceTurn(app, e, localTurn, youLabel) {
    if (e.winner != null || e.awaitingHandoff) { lastTurnKey = null; return; }
    const key = e.players.map(p => p.name).join('|') + '#' + e.currentPlayerIndex;
    if (key === lastTurnKey) return;
    lastTurnKey = key;
    const cur = e.players[e.currentPlayerIndex];
    const anchor = document.getElementById('descarte-discard-top')?.closest('.relative');
    if (!anchor) return;
    let pop = document.getElementById('descarte-turn-pop');
    if (!pop || pop.parentElement !== anchor) {
        pop?.remove();
        pop = document.createElement('div');
        pop.id = 'descarte-turn-pop';
        pop.setAttribute('aria-live', 'polite');
        anchor.appendChild(pop);
    }
    pop.className = 'descarte-turn-pop ' + (localTurn ? 'is-you' : 'is-opp');
    pop.innerHTML = localTurn
        ? `<i class="fa-solid fa-hand-pointer"></i>${youLabel ? 'Sua vez!' : 'Vez de ' + app.escapeCardText(cur.name)}`
        : `<i class="fa-solid ${cur.isBot ? 'fa-robot' : 'fa-user'}"></i>Vez ${cur.isBot ? 'do' : 'de'} ${app.escapeCardText(cur.name)}`;
    void pop.offsetWidth;
    pop.classList.add('show');
}

function playerRowEl(playerIdx) {
    // Prefere uma carta da mão do oponente (na mesa); cai pra linha da lista lateral.
    const opp = document.getElementById(`descarte-opp-${playerIdx}`);
    if (opp) {
        const cards = opp.querySelectorAll('.descarte-opp-card');
        if (cards.length) return cards[Math.floor(cards.length / 2)];
    }
    return document.getElementById('descarte-players-panel')?.children[playerIdx] || null;
}

// Retorna a duração (ms) da animação, ou 0 se ela não rodou.
// card != null: jogada (origem -> mesa). Com `flip`, a carta sai virada pra
// baixo da mão do oponente e vira (rotateY) durante o voo até a mesa.
// card == null: compra (monte -> mão do jogador), sempre virada pra baixo.
function flyCard(app, fromEl, toEl, card, opts = {}) {
    if (!fromEl || !toEl || !document.body.animate) return 0;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    const game = app.state.activeGame;
    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    const duration = opts.duration || FLY_MS;
    const flip = !!(card && opts.flip);
    const base = card ? to : from;
    if (!base.width) return 0;

    const frontDesign = game.frontDesign || 'imagens/frente/frente01.png';
    const backDesign = game.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';
    const makeFace = (bgUrl, bgSize, html, extraStyle) => {
        const d = document.createElement('div');
        d.className = 'descarte-pile-card';
        d.style.cssText = `position:absolute;inset:0;width:100%;height:100%;margin:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-image:url('${bgUrl}');background-size:${bgSize};background-position:center;${extraStyle || ''}`;
        if (html) d.innerHTML = html;
        return d;
    };

    const wrap = document.createElement('div');
    wrap.style.cssText = `position:fixed;left:${base.left}px;top:${base.top}px;width:${base.width}px;height:${base.height}px;margin:0;z-index:10050;pointer-events:none;perspective:900px;`;
    const inner = document.createElement('div');
    inner.style.cssText = 'position:absolute;inset:0;transform-style:preserve-3d;';
    if (card) {
        inner.appendChild(makeFace(frontDesign, frontBgSize(frontDesign), cardFaceHtml(card, game.cards.attributes)));
        if (flip) inner.appendChild(makeFace(backDesign, 'cover', '', 'transform:rotateY(180deg);'));
    } else {
        inner.appendChild(makeFace(backDesign, 'cover', ''));
    }
    if (flip) inner.style.transform = 'rotateY(180deg)';
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
    fitCardTexts(wrap);

    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    const scale = Math.min(1, Math.max(0.3, (card ? from.width / to.width : 0.3)));
    const keyframes = card
        ? [
            { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-10deg)`, opacity: 0.9, offset: 0 },
            { transform: `translate(${dx * 0.45}px, ${dy * 0.45}px) scale(${Math.min(1.15, (scale + 1) / 2 + 0.15)}) rotate(5deg)`, opacity: 1, offset: 0.5 },
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 1 }
        ]
        : [
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
            { transform: `translate(${-dx * 0.5}px, ${-dy * 0.5}px) scale(0.75) rotate(-6deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${-dx}px, ${-dy}px) scale(${scale}) rotate(8deg)`, opacity: 0.7, offset: 1 }
        ];
    const anim = wrap.animate(keyframes, { duration, easing: 'ease-in-out' });
    if (flip) {
        inner.animate([
            { transform: 'rotateY(180deg)', offset: 0 },
            { transform: 'rotateY(180deg)', offset: 0.3 },
            { transform: 'rotateY(0deg)', offset: 0.75 },
            { transform: 'rotateY(0deg)', offset: 1 }
        ], { duration, easing: 'ease-in-out', fill: 'forwards' });
    }
    anim.onfinish = () => wrap.remove();
    setTimeout(() => wrap.remove(), duration + 300);
    return duration;
}

function pulsePlayerRow(playerIdx) {
    const targets = [
        document.getElementById('descarte-players-panel')?.children[playerIdx],
        document.getElementById(`descarte-opp-${playerIdx}`)
    ];
    targets.forEach(row => {
        if (!row) return;
        row.classList.remove('descarte-player-pulse');
        void row.offsetWidth;
        row.classList.add('descarte-player-pulse');
    });
}

function animatePlay(app, playerIdx, card) {
    const handCard = document.querySelector(`#descarte-hand .descarte-hand-card[data-instance="${card.instanceId}"]`);
    const fromOpponent = !handCard;
    const source = handCard || playerRowEl(playerIdx);
    const e = descarte(app);
    if (e.net && e.net.onPlayAnim) e.net.onPlayAnim(playerIdx, card);
    const duration = flyCard(app, source, document.getElementById('descarte-discard-top'), card,
        { duration: fromOpponent ? FLY_OPP_MS : FLY_MS, flip: fromOpponent });
    if (e.net) e.net.flightEndsAt = Date.now() + duration;
    // A carta de verdade some do lugar enquanto a cópia voa (senão apareceria duas vezes).
    if (duration > 0 && source && source.style) source.style.visibility = 'hidden';
    return duration;
}

function afterTurnChange(app) {
    const e = descarte(app);
    if (e.winner != null) { renderAll(app); return; }
    e.pendingWild = null;
    const cur = e.players[e.currentPlayerIndex];
    // A tela "Passe o dispositivo" só faz sentido quando há mais de um humano
    // dividindo o aparelho; contra o computador ela só atrasa a partida.
    // Em rede cada aluno tem o próprio computador, então nunca há handoff.
    const humanCount = e.players.filter(p => !p.isBot).length;
    e.awaitingHandoff = !e.net && !cur.isBot && humanCount > 1;
    renderAll(app);
    if (cur.isBot) {
        setTimeout(() => { if (descarte(app) === e) botTakeTurn(app); }, BOT_THINK_MS);
    }
}

// Lógica comum a jogada humana e jogada do bot: remove da mão, empilha no
// descarte, verifica vitória e resolve o efeito da carta (ou abre a escolha
// de valor, no caso das cartas "Comprar 4 e Escolher"/"Escolher").
function resolvePlay(app, playerIdx, card, skipAnimation = false) {
    const e = descarte(app);
    const player = e.players[playerIdx];
    const idx = player.hand.findIndex(c => c.instanceId === card.instanceId);
    if (idx === -1) return;

    // 1ª passada: só anima o voo da carta. O estado do jogo (mão, mesa, efeito
    // da carta, troca de vez) só muda DEPOIS que ela chega na mesa — senão a
    // vez já passaria pro próximo jogador no meio da animação.
    // Exceção: jogada vinda do outro computador (player.remote). Lá o aluno
    // já viu a carta voar e espera a resposta, então o estado muda na hora e
    // aqui a carta só "pousa" na mesa (landDelay) quando a cópia chegar.
    let landDelay = 0;
    if (!skipAnimation) {
        const flight = animatePlay(app, playerIdx, card);
        if (player.remote) landDelay = flight;
        else if (flight > 0) {
            e.busy = true;
            setTimeout(() => {
                if (descarte(app) !== e) return; // partida reiniciada durante o voo
                e.busy = false;
                if (e.winner != null) return;
                resolvePlay(app, playerIdx, card, true);
            }, flight);
            return;
        }
    }

    e.landDelay = landDelay;
    e.landFx = true; // renderAll faz a carta "pousar" na mesa (efeito de pulo)
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
            // Aluno do outro computador escolhe lá (ver applyGuestView).
            if (!player.remote) openWildModal(app, card.kind);
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
    const e = descarte(app);
    if (!e || e.winner != null) return;
    const playerIdx = e.currentPlayerIndex;
    const player = e.players[playerIdx];
    if (!player.isBot) return;

    const top = topTags(app);
    const normal = player.hand.filter(c => c.kind === 'base' && cardMatchesTags(c, top));
    const special = player.hand.filter(c => c.kind !== 'base' && cardMatchesTags(c, top));
    const chosen = normal[0] || special[0];

    if (chosen) {
        // Pausa curta entre "decidiu" e "jogou", pra dar tempo do jogador ver
        // qual carta o computador escolheu antes dela ir pro descarte.
        pulsePlayerRow(playerIdx);
        setTimeout(() => { if (descarte(app) === e) resolvePlay(app, playerIdx, chosen); }, BOT_ACT_MS);
        return;
    }

    const drawn = drawOne(app);
    if (drawn) {
        player.hand.push(drawn);
        queueDrawAnim(app, playerIdx, drawn);
    }
    renderAll(app); // mostra a compra (monte diminui, mão aumenta) antes de decidir o que fazer com ela
    setTimeout(() => {
        if (descarte(app) !== e) return; // partida encerrada/reiniciada nesse meio-tempo
        if (drawn && cardMatchesTags(drawn, top)) { resolvePlay(app, playerIdx, drawn); return; }
        advanceTurn(app, 1);
        e.turnDrawn = false;
        afterTurnChange(app);
    }, BOT_ACT_MS);
}

function openWildModal(app, kind) {
    const attrs = app.state.activeGame.cards.attributes;
    const title = kind === 'draw4choose'
        ? 'Comprar 4 e Escolher: escolha o novo valor em jogo. O próximo jogador comprará 4 cartas.'
        : 'Escolher: escolha o novo valor em jogo.';
    const titleEl = document.getElementById('descarte-wild-title');
    if (titleEl) titleEl.innerText = title;

    const container = document.getElementById('descarte-wild-options');
    if (container) {
        container.innerHTML = '';
        attrs.forEach((attr, attrIdx) => {
            masterValues(attr).forEach(v => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 p-4 flex flex-col items-center gap-2 transition';
                btn.innerHTML = `<span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${attr.name || ''}</span><div class="w-full h-16 flex items-center justify-center overflow-hidden">${valueContentHtml(v)}</div>`;
                btn.onclick = () => app.descarteChooseWildValue(attrIdx, v.id);
                container.appendChild(btn);
            });
        });
    }

    // Mostra a mão de quem está escolhendo, para ajudar a decidir o valor.
    const handEl = document.getElementById('descarte-wild-hand');
    if (handEl) {
        const e = descarte(app);
        const hand = e.players[e.currentPlayerIndex]?.hand || [];
        const frontDesign = app.state.activeGame.frontDesign || 'imagens/frente/frente01.png';
        // Mesmo leque da mão na mesa (handFanTransform), em tamanho menor.
        const cardW = 120;
        handEl.innerHTML = hand.map((card, idx) => {
            const { angle, lift, marginLeft } = handFanTransform(idx, hand.length, cardW);
            return `
            <div class="descarte-wild-hand-slot" style="transform: rotate(${angle.toFixed(1)}deg) translateY(${(lift * 0.6).toFixed(1)}px); margin-left:${marginLeft.toFixed(1)}px; z-index:${idx};">
                <div class="descarte-wild-hand-card" style="background-image:url('${frontDesign}'); background-size:${frontBgSize(frontDesign)};">
                    <div class="descarte-hand-card-inner">${cardFaceHtml(card, attrs)}</div>
                </div>
            </div>`;
        }).join('');
    }

    const modal = document.getElementById('modal-descarte-wild');
    if (modal) modal.style.display = 'flex';
    fitCardTexts(modal);
}

function openResultModal(app, winnerIdx, score) {
    const e = descarte(app);
    const winner = e.players[winnerIdx];
    const modal = document.getElementById('modal-descarte-result');
    if (!modal) return;

    // Em rede, só o vencedor ganha o troféu na própria tela.
    const youWon = e.localIdx != null ? winnerIdx === e.localIdx : !winner.isBot;
    const icon = document.getElementById('descarte-result-icon');
    if (icon) icon.className = youWon ? 'fa-solid fa-trophy text-amber-500 text-3xl animate-bounce'
        : winner.isBot ? 'fa-solid fa-robot text-slate-500 text-3xl' : 'fa-solid fa-flag-checkered text-slate-500 text-3xl';
    const titleEl = document.getElementById('descarte-result-title');
    if (titleEl) titleEl.innerText = e.localIdx === winnerIdx ? 'Você venceu a partida!' : `${winner.name} venceu a partida!`;
    const subEl = document.getElementById('descarte-result-subtitle');
    if (subEl) subEl.innerText = `Pontuação: ${score} pts (10 pts por carta restante na mão de cada oponente)`;

    const board = document.getElementById('descarte-result-scoreboard');
    if (board) {
        board.innerHTML = e.players.map((p, idx) => `
            <div class="flex items-center justify-between px-4 py-2.5 rounded-xl ${idx === winnerIdx ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'}">
                <span class="font-bold text-sm text-slate-700">${idx === winnerIdx ? '<i class="fa-solid fa-crown text-amber-500 mr-1.5"></i>' : ''}${app.escapeCardText(p.name)}</span>
                <span class="text-sm font-black text-slate-500">${idx === winnerIdx ? 'Venceu' : `${p.hand.length} carta${p.hand.length === 1 ? '' : 's'} restante${p.hand.length === 1 ? '' : 's'}`}</span>
            </div>
        `).join('');
    }
    modal.style.display = 'flex';
    // Página do link compartilhado: grava o resultado no ranking.
    if (app.onDescarteMatchEnd) app.onDescarteMatchEnd(winnerIdx, score);
}

function renderAll(app) {
    const e = descarte(app);
    const game = app.state.activeGame;
    if (!e || !game) return;
    // Monte acabou: reabastece na hora com as cartas da mesa (no convidado de
    // uma partida em rede quem decide é o anfitrião, que manda `reshuffled`).
    if (!isGuest(e) && e.winner == null && e.drawPile.length === 0 && e.discardPile.length > 1) {
        reshuffleDiscardIntoDraw(app);
    }
    const attributes = game.cards.attributes;
    const frontDesign = game.frontDesign || 'imagens/frente/frente01.png';
    const backDesign = game.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

    const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text || '-'; };
    const info = game.disciplineInfo || {};
    setEl('descarte-header-title', game.name);
    setEl('descarte-header-disciplina', info.disciplina);
    setEl('descarte-header-conteudo', info.conteudo);
    setEl('descarte-header-serie', info.serie);
    setEl('descarte-header-autores', (info.autores || []).join(', ') || 'Não informado');
    const enunciadoEl = document.getElementById('descarte-enunciado-content');
    if (enunciadoEl) enunciadoEl.innerHTML = game.enunciado || '';

    const cur = e.players[e.currentPlayerIndex];

    const localTurn = e.winner == null && isLocalTurn(e);
    // Na partida contra o computador só há um humano: a vez dele é "Sua vez!".
    const singleHuman = e.players.filter(p => !p.isBot).length === 1;
    const youLabel = e.localIdx != null || singleHuman;
    const banner = document.getElementById('descarte-turn-banner');
    if (banner) {
        if (e.winner != null) {
            banner.innerHTML = '<i class="fa-solid fa-flag-checkered mr-2"></i>Partida encerrada';
            banner.className = 'descarte-turn-banner descarte-turn-over';
        } else if (localTurn) {
            banner.innerHTML = `<i class="fa-solid fa-hand-pointer mr-2"></i>${youLabel ? 'Sua vez!' : 'Vez de: ' + app.escapeCardText(cur.name)}`;
            banner.className = 'descarte-turn-banner descarte-turn-you';
        } else {
            banner.innerHTML = `<i class="fa-solid ${cur.isBot ? 'fa-robot' : 'fa-user'} mr-2"></i>Vez de: ${app.escapeCardText(cur.name)}`;
            banner.className = 'descarte-turn-banner descarte-turn-opp';
        }
    }
    announceTurn(app, e, localTurn, youLabel);

    // Mão do jogador: fica apagada na vez do oponente (a vez do próprio
    // jogador é destacada só na faixa lateral).
    document.getElementById('descarte-hand-zone')?.classList.toggle('descarte-zone-waiting', e.winner == null && !localTurn);

    const botIndicator = document.getElementById('descarte-bot-indicator');
    if (botIndicator) {
        botIndicator.classList.toggle('hidden', !(e.winner == null && !localTurn));
        // Em rede, a vez pode ser do aluno do outro computador.
        botIndicator.innerHTML = cur.isBot
            ? '<i class="fa-solid fa-robot mr-1"></i> Computador jogando...'
            : `<i class="fa-solid fa-hourglass-half mr-1"></i> ${e.pendingWild ? 'Escolhendo o valor' : 'Aguardando a jogada'} de ${app.escapeCardText(cur.name)}...`;
    }

    const handoff = document.getElementById('descarte-handoff-overlay');
    if (handoff) {
        handoff.classList.toggle('hidden', !e.awaitingHandoff);
        const nameEl = document.getElementById('descarte-handoff-name');
        if (nameEl) nameEl.innerText = cur.name;
    }

    const discardEl = document.getElementById('descarte-discard-top');
    if (discardEl) {
        const top = e.discardPile[e.discardPile.length - 1];
        discardEl.style.backgroundImage = `url('${frontDesign}')`;
        discardEl.style.backgroundSize = frontBgSize(frontDesign);
        discardEl.style.backgroundPosition = 'center';
        discardEl.innerHTML = top ? cardFaceHtml(top, attributes) : '';
        discardEl.classList.remove('descarte-pile-land');
        if (e.landFx) {
            e.landFx = false;
            discardEl.style.setProperty('--land-delay', Math.max(0, (e.landDelay || 0) - 80) + 'ms');
            void discardEl.offsetWidth;
            discardEl.classList.add('descarte-pile-land');
        }
    }

    const drawPileEl = document.getElementById('descarte-draw-pile');
    if (drawPileEl) {
        drawPileEl.style.backgroundImage = `url('${backDesign}')`;
        drawPileEl.style.backgroundSize = 'cover';
        drawPileEl.style.backgroundPosition = 'center';
    }
    const drawCountEl = document.getElementById('descarte-draw-pile-count');
    if (drawCountEl) drawCountEl.innerText = String(e.drawPile.length);

    const panel = document.getElementById('descarte-players-panel');
    if (panel) {
        panel.innerHTML = e.players.map((p, idx) => `
            <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl ${idx === e.currentPlayerIndex && e.winner == null ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}">
                <span class="text-sm font-bold text-slate-700 truncate">${p.isBot ? '<i class="fa-solid fa-robot mr-1.5 text-slate-400"></i>' : '<i class="fa-solid fa-user mr-1.5 text-slate-400"></i>'}${app.escapeCardText(p.name)}${idx === e.localIdx ? ' <span class="text-emerald-600">(você)</span>' : ''}</span>
                <span class="text-sm font-black text-slate-500 shrink-0">${p.hand.length} ${p.hand.length === 1 ? 'carta' : 'cartas'}</span>
            </div>
        `).join('');
    }

    // Oponentes: todos menos quem está "vendo" a tela (o humano da vez; durante
    // a jogada do computador, o último humano que jogou). Cartas viradas.
    // Em rede, é sempre o aluno deste computador.
    if (!cur.isBot) e.viewerIdx = e.currentPlayerIndex;
    let viewerIdx = e.localIdx != null ? e.localIdx : e.viewerIdx;
    if (viewerIdx == null) viewerIdx = Math.max(0, e.players.findIndex(p => !p.isBot));
    const oppEl = document.getElementById('descarte-opponents');
    if (oppEl) {
        oppEl.innerHTML = e.players.map((p, idx) => {
            if (idx === viewerIdx) return '';
            const slots = p.hand.map((_, i) => {
                const { angle, lift, overlap } = handFanTransform(i, p.hand.length, 64);
                const style = `transform: rotate(${(-angle).toFixed(1)}deg) translateY(calc(var(--e-opp-h) * -${(lift / 215).toFixed(3)})); margin-left:calc(var(--e-opp-w) * -${overlap.toFixed(3)}); z-index:${i};`;
                return `<div class="descarte-opp-slot" style="${style}"><div class="descarte-opp-card" style="background-image:url('${backDesign}');"></div></div>`;
            }).join('');
            const active = idx === e.currentPlayerIndex && e.winner == null;
            const icon = p.isBot ? 'fa-robot' : 'fa-user';
            return `
                <div id="descarte-opp-${idx}" class="flex flex-col items-center ${active ? 'descarte-opp-active' : ''}" style="min-width:90px;">
                    <div class="flex items-start justify-center flex-nowrap" style="min-height:var(--e-opp-h);">${slots}</div>
                    <span class="descarte-opp-label"><i class="fa-solid ${icon} mr-1"></i>${app.escapeCardText(p.name)} · ${p.hand.length}</span>
                    ${active ? '<span class="descarte-opp-playing"><i class="fa-solid fa-ellipsis fa-beat-fade mr-1"></i>jogando</span>' : ''}
                </div>`;
        }).join('');
    }

    // Mão sempre visível (só jogável na vez do dono) em rede e contra o
    // computador; com vários humanos no mesmo aparelho, só a do humano da vez.
    const handOwner = e.players[handOwnerIdx(e)];
    const handEl = document.getElementById('descarte-hand');
    if (handEl) {
        if (e.localIdx == null && !singleHuman && (cur.isBot || e.awaitingHandoff || e.winner != null)) {
            handEl.innerHTML = '';
        } else {
            // Toda carta da mão pode ser clicada e tentada — não existe mais
            // distinção visual de "jogável"/"desabilitada". Quem decide se a
            // carta vale é descartePlayHandCard(), que mostra um popup e balança
            // a carta no lugar (descarteShakeHandCard) quando ela não combina.
            handEl.innerHTML = handOwner.hand.map((card, idx) => {
                const { angle, lift, overlap } = handFanTransform(idx, handOwner.hand.length);
                // Medidas relativas ao tamanho da carta (--e-hand-w/-h, ver CSS), que
                // varia com a altura da janela.
                const slotStyle = `transform: rotate(${angle.toFixed(1)}deg) translateY(calc(var(--e-hand-h) * ${(lift / 215).toFixed(3)})); margin-left:calc(var(--e-hand-w) * -${overlap.toFixed(3)}); z-index:${idx};`;
                return `
                    <div class="descarte-hand-slot" style="${slotStyle}">
                        <div class="descarte-hand-card" data-instance="${card.instanceId}" style="background-image:url('${frontDesign}'); background-size:${frontBgSize(frontDesign)};">
                            <div class="zoom-icon" title="Visualizar ampliado"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                            <div class="descarte-hand-card-inner">${cardFaceHtml(card, attributes)}</div>
                        </div>
                    </div>
                `;
            }).join('');
            handEl.querySelectorAll('.descarte-hand-card').forEach(el => {
                const instanceId = el.dataset.instance;
                const zoom = el.querySelector('.zoom-icon');
                if (zoom) zoom.onclick = (ev) => { ev.stopPropagation(); app.descartePreviewHandCard(instanceId); };
                el.onclick = () => app.descartePlayHandCard(instanceId);
            });
        }
    }

    const canAct = localTurn && !e.awaitingHandoff && !e.pendingWild;
    if (drawPileEl) drawPileEl.classList.toggle('opacity-40', !(canAct && !e.turnDrawn));
    // Sem nenhuma carta jogável (e ainda sem ter comprado), comprar é obrigatório:
    // o monte pulsa e o rótulo avisa.
    const mustDraw = canAct && !e.turnDrawn && !cur.hand.some(c => cardMatchesTags(c, topTags(app)));
    if (drawPileEl) {
        drawPileEl.classList.toggle('descarte-draw-hint', mustDraw);
        const drawLabel = drawPileEl.nextElementSibling;
        if (drawLabel) {
            drawLabel.innerText = mustDraw ? 'Compre uma carta!' : 'Comprar';
            drawLabel.classList.toggle('text-red-600', mustDraw);
            drawLabel.classList.toggle('text-slate-400', !mustDraw);
        }
    }
    const passBtn = document.getElementById('descarte-pass-btn');
    if (passBtn) passBtn.classList.toggle('hidden', !(canAct && e.turnDrawn));
    // Anfitrião de partida em rede: todo redesenho manda o estado novo (com
    // as compras ainda por animar) para o outro computador.
    const reshuffled = e.reshuffleFx || 0;
    e.reshuffleFx = 0;
    if (e.net && e.net.onRender) e.net.onRender((e.drawAnims || []).slice(), reshuffled);
    // A animação de reabastecer espera as compras em andamento terminarem.
    const pendingDraws = (e.drawAnims || []).length;
    fitCardTexts(document.getElementById('view-player') || document.getElementById('screen-game') || document);
    flushDrawAnims(app);
    if (reshuffled > 0) {
        playReshuffleFx(app, reshuffled, pendingDraws ? (pendingDraws - 1) * DRAW_STAGGER_MS + FLY_DRAW_MS : 0);
    }
}

// --- Montagem da partida e ações de jogador ---
// Compartilhadas entre a plataforma (playerMethods abaixo) e a página pública
// do link compartilhado (js/play-descarte.js + js/games/descarte/net.js).

// Cria a partida em app.state.descarte (baralho, mãos, carta inicial).
// `roster`: [{ name, isBot, remote? }] — quem está no índice 0 começa.
// `extra` entra no estado da partida (ex.: mode, localIdx, net).
function createMatch(app, sourceGame, roster, extra = {}) {
    const numPlayers = roster.length;
    app.state.activeGame = JSON.parse(JSON.stringify(sourceGame));
    const attributes = app.state.activeGame.cards.attributes;
    const { deck, cartasBase } = buildDeck(attributes, numPlayers);
    const shuffled = app.shuffleArray(deck);
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

    app.state.descarte = {
        players,
        drawPile,
        discardPile: discardTop ? [discardTop] : [],
        currentPlayerIndex: 0,
        direction: 1,
        turnDrawn: false,
        pendingWild: null,
        awaitingHandoff: false,
        winner: null,
        ...extra
    };
    return { numPlayers, handSize };
}

// Compra 1 carta para o jogador da vez. Retorna false se não há carta nenhuma
// (monte vazio e só a carta do topo na mesa) — aí a vez pode ser passada.
function drawForCurrent(app) {
    const e = descarte(app);
    const card = drawOne(app);
    if (!card) {
        e.turnDrawn = true;
        renderAll(app);
        return false;
    }
    e.players[e.currentPlayerIndex].hand.push(card);
    queueDrawAnim(app, e.currentPlayerIndex, card);
    e.turnDrawn = true;
    renderAll(app);
    return true;
}

function passTurn(app) {
    advanceTurn(app, 1);
    descarte(app).turnDrawn = false;
    afterTurnChange(app);
}

function chooseWild(app, attrIdx, valueId) {
    const e = descarte(app);
    const card = e.discardPile.find(c => c.instanceId === e.pendingWild.cardInstanceId);
    if (card) card.tags = [{ attr: attrIdx, valueId }];
    if (card) applyWildEffect(app, card);
    afterTurnChange(app);
}

// --- Partida em rede ---
// O computador do anfitrião roda o motor inteiro; o convidado só recebe a
// "visão" dele (a própria mão + quantas cartas cada um tem) e manda jogadas.
// Assim nenhum aluno recebe as cartas do outro.

// Jogada recebida do convidado (`playerIdx`), validada aqui no anfitrião.
function applyRemoteAction(app, playerIdx, action) {
    const e = descarte(app);
    if (!e || !action) return;
    const player = e.players[playerIdx];
    const ok = e.winner == null && !e.busy && e.currentPlayerIndex === playerIdx && player && player.remote;
    if (ok) {
        if (action.type === 'play' && !e.pendingWild) {
            const card = player.hand.find(c => c.instanceId === action.instanceId);
            if (card && cardMatchesTags(card, topTags(app))) { resolvePlay(app, playerIdx, card); return; }
        } else if (action.type === 'draw' && !e.pendingWild && !e.turnDrawn) {
            drawForCurrent(app); return;
        } else if (action.type === 'pass' && !e.pendingWild && e.turnDrawn) {
            passTurn(app); return;
        } else if (action.type === 'wild' && e.pendingWild) {
            const attr = app.state.activeGame.cards.attributes[action.attrIdx];
            if (masterValues(attr).some(v => v.id === action.valueId)) { chooseWild(app, action.attrIdx, action.valueId); return; }
        }
    }
    renderAll(app); // jogada recusada: reenvia o estado para destravar o convidado
}

// O que o anfitrião envia para o jogador `idx`.
function viewFor(app, idx, drawAnims = [], reshuffled = 0) {
    const e = descarte(app);
    return {
        you: idx,
        mode: e.mode,
        players: e.players.map(p => ({ name: p.name, isBot: !!p.isBot, count: p.hand.length })),
        hand: e.players[idx].hand,
        drawCount: e.drawPile.length,
        top: e.discardPile[e.discardPile.length - 1] || null,
        currentPlayerIndex: e.currentPlayerIndex,
        direction: e.direction,
        turnDrawn: e.turnDrawn,
        pendingWild: e.pendingWild,
        winner: e.winner,
        // Carta comprada só vai junto se for do próprio convidado.
        draws: drawAnims.map(d => ({ playerIdx: d.playerIdx, card: d.playerIdx === idx ? d.card : null })),
        reshuffled
    };
}

// No convidado: monta um estado "de mentira" a partir da visão (mãos dos
// outros e monte viram cartas vazias, só pela quantidade) e desenha a mesa
// com o mesmo renderAll da partida local.
function applyGuestView(app, view, net) {
    const prev = descarte(app);
    const hidden = (i, k) => ({ instanceId: `hidden-${i}-${k}`, kind: 'hidden', tags: [] });
    const players = view.players.map((p, i) => ({
        name: p.name,
        isBot: p.isBot,
        hand: i === view.you ? view.hand : Array.from({ length: p.count }, (_, k) => hidden(i, k))
    }));
    const e = {
        mode: view.mode,
        players,
        drawPile: new Array(view.drawCount).fill(null),
        discardPile: view.top ? [view.top] : [],
        currentPlayerIndex: view.currentPlayerIndex,
        direction: view.direction,
        turnDrawn: view.turnDrawn,
        pendingWild: view.pendingWild,
        awaitingHandoff: false,
        winner: view.winner,
        localIdx: view.you,
        net,
        drawAnims: (view.draws || []).map(d => ({ playerIdx: d.playerIdx, card: d.card || { instanceId: 'hidden' } })),
        reshuffleFx: view.reshuffled || 0
    };
    // Carta nova na mesa (ou valor escolhido num Escolher): efeito de pouso,
    // esperando a cópia que ainda está voando chegar.
    const prevTop = prev && prev.discardPile[prev.discardPile.length - 1];
    if (view.top && (!prevTop || prevTop.instanceId !== view.top.instanceId)) {
        e.landFx = true;
        e.landDelay = Math.max(0, (net.flightEndsAt || 0) - Date.now());
    }
    app.state.descarte = e;
    renderAll(app);

    const wildModal = document.getElementById('modal-descarte-wild');
    if (e.winner == null && e.pendingWild && e.currentPlayerIndex === e.localIdx) {
        if (!wildModal || wildModal.style.display !== 'flex') openWildModal(app, e.pendingWild.kind);
    } else if (wildModal) {
        wildModal.style.display = 'none';
    }
    const resultModal = document.getElementById('modal-descarte-result');
    if (e.winner != null && (!prev || prev.winner == null)) {
        openResultModal(app, e.winner, calculateDescarteScore(players, e.winner));
    } else if (e.winner == null && resultModal) {
        resultModal.style.display = 'none';
    }
}

// No convidado: anima a carta que outro jogador acabou de jogar.
function animateRemotePlay(app, playerIdx, card) {
    const e = descarte(app);
    if (!e || playerIdx === e.localIdx) return;
    animatePlay(app, playerIdx, card);
}

export const descarteEngine = {
    createMatch,
    startTurns: afterTurnChange,
    renderAll,
    applyRemoteAction,
    viewFor,
    applyGuestView,
    animateRemotePlay
};

export const playerMethods = {
    testGameFromCreator: function() {
        if (this.state.editingGame) {
            this.state.editingGame.is_draft = false;
            this.autoSaveNow();
        }
        this.state.isTestingFromCreator = true;
        this.state.selectedGameIdForPlay = null;
        this.descarteStartMatch();
    },

    openDifficultySelect: function(gameId) {
        this.state.selectedGameIdForPlay = gameId;
        this.descarteStartMatch();
    },

    // Na plataforma a partida é sempre 1 aluno contra o computador. As
    // partidas entre alunos (cada um no seu computador) ficam no link
    // compartilhado (play-descarte.html).
    descarteStartMatch: function() {
        const sourceGame = this.state.isTestingFromCreator
            ? this.state.editingGame
            : this.state.games.find(g => String(g.id) === String(this.state.selectedGameIdForPlay));
        if (!sourceGame) return;

        const { numPlayers, handSize } = createMatch(this, sourceGame,
            [{ name: 'Você', isBot: false }, { name: 'Computador', isBot: true }], { mode: 'solo' });

        this.switchView('player');
        document.getElementById('back-from-player-btn')?.classList.remove('hidden');
        document.getElementById('save-from-player-btn')?.classList.toggle('hidden', !this.state.isTestingFromCreator);

        afterTurnChange(this);
        this.showNotification(`Partida iniciada! ${numPlayers} jogadores, ${handSize} cartas na mão de cada um.`, 'Descarte a Carta');
    },

    descarteRestartMatch: function() {
        this.descarteCloseResultModal();
        if (this.state.descarte) this.descarteStartMatch();
    },

    descarteConfirmHandoff: function() {
        if (!this.state.descarte) return;
        this.state.descarte.awaitingHandoff = false;
        renderAll(this);
    },

    descartePlayHandCard: function(cardInstanceId) {
        const e = this.state.descarte;
        if (!canLocalAct(e)) return;
        const playerIdx = e.currentPlayerIndex;
        const player = e.players[playerIdx];
        const card = player.hand.find(c => c.instanceId === cardInstanceId);
        if (!card) return;
        if (!cardMatchesTags(card, topTags(this))) {
            this.descarteShakeHandCard(cardInstanceId);
            const hasValid = player.hand.some(c => cardMatchesTags(c, topTags(this)));
            if (!hasValid && !e.turnDrawn) {
                this.showNotification('Você não tem nenhuma carta que combine com a carta da mesa. Compre uma carta do monte para continuar.', 'Você precisa comprar uma carta');
                return;
            }
            this.showNotification('Essa carta não compartilha nenhum atributo com a carta da mesa. Tente outra.', 'Carta incorreta');
            return;
        }
        if (isGuest(e)) {
            animatePlay(this, playerIdx, card);
            sendToHost(this, { type: 'play', instanceId: cardInstanceId });
            return;
        }
        resolvePlay(this, playerIdx, card);
    },

    // Balança a carta clicada no lugar (ela nunca chega a sair da mão, já que
    // a jogada só é efetivada depois da checagem acima) — o retorno visual
    // de "ela volta" pedido pelo professor.
    descarteShakeHandCard: function(cardInstanceId) {
        const el = document.querySelector(`#descarte-hand .descarte-hand-card[data-instance="${cardInstanceId}"]`);
        if (!el) return;
        el.classList.remove('rejected');
        void el.offsetWidth; // força o navegador a reiniciar a animação se a carta já estava balançando
        el.classList.add('rejected');
        setTimeout(() => el.classList.remove('rejected'), 400);
    },

    descarteDrawCard: function() {
        const e = this.state.descarte;
        if (!canLocalAct(e) || e.turnDrawn) return;
        if (isGuest(e)) { sendToHost(this, { type: 'draw' }); return; }
        if (!drawForCurrent(this)) this.showNotification('Não há mais cartas para comprar: todas estão nas mãos dos jogadores. Passe a vez.', 'Monte vazio');
    },

    descartePassTurn: function() {
        const e = this.state.descarte;
        if (!canLocalAct(e) || !e.turnDrawn) return;
        if (isGuest(e)) { sendToHost(this, { type: 'pass' }); return; }
        passTurn(this);
    },

    descarteChooseWildValue: function(attrIdx, valueId) {
        const e = this.state.descarte;
        if (!e?.pendingWild) return;
        const modal = document.getElementById('modal-descarte-wild');
        if (modal) modal.style.display = 'none';
        if (isGuest(e)) { sendToHost(this, { type: 'wild', attrIdx, valueId }); return; }
        chooseWild(this, attrIdx, valueId);
    },

    descartePreviewHandCard: function(instanceId) {
        const e = this.state.descarte;
        if (!e || !this.state.activeGame) return;
        const owner = e.players[handOwnerIdx(e)];
        const card = owner.hand.find(c => c.instanceId === instanceId);
        if (!card) return;
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-card-container');
        const text = document.getElementById('preview-card-text');
        container.style.backgroundImage = `url('${this.state.activeGame.frontDesign || 'imagens/frente/frente01.png'}')`;
        container.style.backgroundSize = frontBgSize(this.state.activeGame.frontDesign || 'imagens/frente/frente01.png');
        container.style.backgroundPosition = 'center';
        // O conteúdo da carta é desenhado em tamanho de mão; aqui ele é ampliado
        // (scale) pra acompanhar o tamanho do zoom.
        const k = 2.4;
        container.innerHTML = `<div style="width:${(100 / k).toFixed(2)}%;height:${(100 / k).toFixed(2)}%;transform:scale(${k});transform-origin:center;flex-shrink:0;">${cardFaceHtml(card, this.state.activeGame.cards.attributes)}</div>`;
        text.innerText = 'Carta Selecionada';
        modal.style.display = 'flex';
        fitCardTexts(container);
    },

    descarteCloseResultModal: function() {
        const modal = document.getElementById('modal-descarte-result');
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
        const regraJaCompleta = /cartas especiais/i.test(this.stripHtml(rulesHtml));
        const template = `
            <div class="text-left space-y-4">
                <div>${rulesHtml}</div>
                ${regraJaCompleta ? '' : `<div class="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-200">
                    <p class="font-black text-sm uppercase tracking-widest text-slate-500">Cartas especiais:</p>
                    ${row(svgSkip(), 'Perder a Vez', 'o próximo jogador perde a vez.')}
                    ${row(svgReverse(), 'Inverter a Ordem', 'inverte o sentido da rodada.')}
                    ${row(svgDraw(1, '#FDE2B5'), 'Comprar 1', 'o próximo jogador compra 1 carta.')}
                    ${row(svgDraw(2, '#BAF7CE'), 'Comprar 2', 'o próximo jogador compra 2 cartas.')}
                    ${row(svgDraw(4, '#FCB6D4'), 'Comprar 4 e Escolher', 'jogável a qualquer momento. Você escolhe o novo valor em jogo e o próximo jogador compra 4 cartas.')}
                    ${row(svgChoose(), 'Escolher', 'jogável a qualquer momento. Você escolhe o novo valor em jogo, sem forçar compra.')}
                </div>
                <div class="p-4 bg-sky-50 rounded-2xl border border-sky-200">
                    <p class="text-sm text-sky-900"><i class="fa-solid fa-circle-info mr-1"></i> Uma carta só pode ser jogada sobre a carta da mesa se compartilhar o valor de pelo menos um dos dois atributos com ela.</p>
                </div>`}
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
        this.showNotification(this.richTextHtml(g.explicacao) || 'Explicação não definida.', 'Como Jogar');
    }
};
