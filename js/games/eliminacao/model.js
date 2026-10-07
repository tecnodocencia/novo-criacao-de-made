// js/games/eliminacao/model.js
//
// Modelo "Eliminação" (apelido interno "Can Can") — jogo de cartas por
// eliminação. O professor define 2 atributos de conteúdo (ex.: "Relevo" e
// "Região"), cada um com 2 a 9 valores. Uma carta-base representa uma
// combinação (valor do atributo 1, valor do atributo 2). Em cada atributo o
// professor marca exatamente 2 valores como "cartas mestre" — os mesmos 2
// valores usados nas cartas especiais "Comprar 4 e Escolher" / "Escolher".
//
// Ver js/games/eliminacao/player.js para o motor de partida (baralho, mãos,
// turnos, bot) que consome os dados gerados aqui.

export const SPECIAL_KINDS = ['skip', 'reverse', 'draw1', 'draw2', 'draw4choose', 'choose'];

export function uuid() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDefaultData() {
    return {
        is_draft: true,
        frontDesign: "imagens/frente/frente01.png",
        backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
        disciplineInfo: { disciplina: "Geografia", conteudo: "Relevo e Região", serie: "6º ano", autores: [] },
        regra: 'Cada carta tem dois atributos. Uma carta só pode ser jogada sobre a carta da mesa se compartilhar o valor de pelo menos um dos dois atributos com ela. Jogue uma carta válida da sua mão a cada rodada; se não tiver nenhuma, compre uma carta. Cartas especiais podem pular a vez, inverter a ordem, obrigar o próximo jogador a comprar cartas ou permitir escolher um novo valor em jogo. Quem ficar sem cartas primeiro vence a partida.',
        objetivo: 'Ser o primeiro a se livrar de todas as cartas da mão, sempre jogando cartas que compartilhem pelo menos um atributo com a última carta jogada na mesa.',
        enunciado: 'Jogue uma carta da sua mão que compartilhe o valor de <strong style="color:#b91c1c">pelo menos um atributo</strong> com a carta do topo da mesa.',
        explicacao: '• Cada carta tem 2 atributos (por exemplo, um valor do Atributo 1 e um valor do Atributo 2).\n• Você só pode jogar uma carta que compartilhe pelo menos um desses valores com a carta do topo da mesa.\n• Se não tiver nenhuma carta válida, compre uma carta do monte.\n• Cartas especiais podem pular a vez do próximo jogador, inverter a ordem, obrigar a compra de cartas ou deixar você escolher um novo valor em jogo.\n• O primeiro jogador a ficar sem cartas na mão vence a partida.',
        // Estrutura específica do modelo Eliminação: 2 atributos, cada um com
        // 2 a 9 valores. Cada valor pode ser texto simples, texto com
        // destaque em vermelho (mesmo mecanismo do Código Secreto) ou
        // imagem. Exatamente 2 valores por atributo são "cartas mestre"
        // (isMaster), usadas também nas cartas +4/Escolher.
        cards: {
            attributes: [
                { name: '', values: [
                    { id: uuid(), text: '', image: null, isMaster: false },
                    { id: uuid(), text: '', image: null, isMaster: false }
                ] },
                { name: '', values: [
                    { id: uuid(), text: '', image: null, isMaster: false },
                    { id: uuid(), text: '', image: null, isMaster: false }
                ] }
            ]
        }
    };
}

// --- Regras derivadas da quantidade de cartas-base (decisões 3 e 4) ---

export function countBaseCards(attributes) {
    if (!attributes || !attributes[0] || !attributes[1]) return 0;
    return (attributes[0].values?.length || 0) * (attributes[1].values?.length || 0);
}

export function computeHandSize(cartasBase, numPlayers) {
    const raw = Math.round(cartasBase / (numPlayers + 2));
    return Math.min(7, Math.max(3, raw));
}

export function computeSpecialCopies(cartasBase) {
    const raw = Math.round(cartasBase / 10);
    return Math.min(4, Math.max(2, raw));
}

// Lista de valores marcados como "carta mestre" num atributo (deveria ter
// exatamente 2, mas a função é defensiva: usa os que existirem).
export function masterValues(attribute) {
    if (!attribute || !Array.isArray(attribute.values)) return [];
    return attribute.values.filter(v => v.isMaster);
}

// --- Construção do baralho de uma partida ---

// Gera as cartas-base (uma combinação por par de valores — sem cópias).
function buildBaseCards(attributes) {
    const [a0, a1] = attributes;
    const cards = [];
    (a0.values || []).forEach(v0 => {
        (a1.values || []).forEach(v1 => {
            cards.push({
                instanceId: uuid(),
                kind: 'base',
                tags: [{ attr: 0, valueId: v0.id }, { attr: 1, valueId: v1.id }]
            });
        });
    });
    return cards;
}

// Gera `copies` cartas de um tipo com tag única (atributo+valor), espalhando
// as cópias entre os dois atributos e entre os valores disponíveis (em vez
// de sortear com reposição) para o baralho não ficar desbalanceado.
function buildTaggedSpecial(kind, attributes, copies) {
    const out = [];
    for (let i = 0; i < copies; i++) {
        const attrIdx = i % 2;
        const values = attributes[attrIdx].values;
        const valueId = values[i % values.length].id;
        out.push({ instanceId: uuid(), kind, tags: [{ attr: attrIdx, valueId }] });
    }
    return out;
}

function buildWildCards(kind, copies) {
    const out = [];
    for (let i = 0; i < copies; i++) {
        out.push({ instanceId: uuid(), kind, tags: [], wild: true });
    }
    return out;
}

// Monta o baralho completo (não embaralhado) para uma partida com
// `numPlayers` jogadores (2 ou 3). Perder a Vez / Retornar a Ordem só
// entram com 3 jogadores (decisão do professor/produto, ver tarefa).
export function buildDeck(attributes, numPlayers) {
    const baseCards = buildBaseCards(attributes);
    const cartasBase = baseCards.length;
    const copies = computeSpecialCopies(cartasBase);
    const includeSkipReverse = numPlayers === 3;

    const specials = [
        ...(includeSkipReverse ? buildTaggedSpecial('skip', attributes, copies) : []),
        ...(includeSkipReverse ? buildTaggedSpecial('reverse', attributes, copies) : []),
        ...buildTaggedSpecial('draw1', attributes, copies),
        ...buildTaggedSpecial('draw2', attributes, copies),
        ...buildWildCards('draw4choose', copies),
        ...buildWildCards('choose', copies)
    ];

    return { deck: [...baseCards, ...specials], cartasBase, copies };
}

// --- Regras de combinação (match) ---

// Uma carta "wild" (ainda não resolvida) é sempre jogável. As demais são
// jogáveis se compartilharem pelo menos um par (atributo, valor) com a
// carta/tags do topo da mesa.
export function cardMatchesTags(card, topTags) {
    if (card.wild) return true;
    if (!Array.isArray(card.tags) || card.tags.length === 0) return false;
    return card.tags.some(t => topTags.some(tt => tt.attr === t.attr && tt.valueId === t.valueId));
}

// --- Pontuação (decisão 7) ---
// Vencedor ganha pontos = soma, por oponente, das cartas que sobraram na mão × 10.
export function calculateElimScore(players, winnerIndex) {
    return players.reduce((sum, p, idx) => idx === winnerIndex ? sum : sum + (p.hand.length * 10), 0);
}
