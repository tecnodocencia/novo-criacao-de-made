// js/core/cardStyle.js
// Visual das cartas definido pelo professor no bloco Aparência, comum aos dois
// jogos (plataforma, links públicos, revisão e editor). Fica salvo em
// disciplineInfo.cartaVisual (jsonb já existente, sem coluna nova):
//   { front: { zoom, x, y }, back: { zoom, x, y }, fontScale }
// zoom: 1 = 100% (0.5 a 3) · x/y: posição da imagem em % (50 = centro)
// fontScale: tamanho da letra dentro da carta (1 = padrão, 0.7 a 1.6).

export const DEFAULT_ADJUST = { zoom: 1, x: 50, y: 50 };
export const FONT_SCALE_MIN = 0.7;
export const FONT_SCALE_MAX = 1.6;

function num(v, fallback, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

function normalizeAdjust(a) {
    a = a || {};
    return {
        zoom: num(a.zoom, 1, 0.5, 3),
        x: num(a.x, 50, 0, 100),
        y: num(a.y, 50, 0, 100)
    };
}

export function getCardVisual(game) {
    const v = game?.disciplineInfo?.cartaVisual || {};
    return {
        front: normalizeAdjust(v.front),
        back: normalizeAdjust(v.back),
        fontScale: num(v.fontScale, 1, FONT_SCALE_MIN, FONT_SCALE_MAX)
    };
}

export function isAdjusted(adj) {
    return !!adj && (adj.zoom !== 1 || adj.x !== 50 || adj.y !== 50);
}

// Partes do fundo de uma carta.
// `base` é o comportamento padrão de cada jogo quando não há ajuste:
//   'cover' (Código Secreto): imagem cobre a carta.
//   'fit'   (Descarte a Carta): imagem inteira (contain) + cópia ampliada atrás;
//           frentes prontas do MADE em 110% (escondem o contorno grosso).
// Com ajuste (zoom/posição), a largura da imagem vira zoom × largura da carta,
// na posição escolhida, e a cópia ampliada atrás preenche o que sobrar.
export function cardBgParts(url, adj, base = 'cover') {
    const u = `url('${url}')`;
    const builtInFront = (url || '').startsWith('imagens/frente/');
    if (isAdjusted(adj)) {
        const pos = `${adj.x}% ${adj.y}%`;
        if (builtInFront && base === 'fit') {
            const z = Math.round(110 * adj.zoom);
            return { image: u, size: `${z}% ${z}%`, position: pos };
        }
        return { image: `${u}, ${u}`, size: `${Math.round(100 * adj.zoom)}% auto, cover`, position: `${pos}, ${pos}` };
    }
    if (base === 'fit') {
        if (builtInFront) return { image: u, size: '110% 110%', position: 'center' };
        return { image: `${u}, ${u}`, size: 'contain, cover', position: 'center' };
    }
    return { image: u, size: 'cover', position: 'center' };
}

export function cardBgCss(url, adj, base) {
    const p = cardBgParts(url, adj, base);
    return `background-image:${p.image};background-size:${p.size};background-position:${p.position};background-repeat:no-repeat;`;
}

export function applyCardBg(el, url, adj, base) {
    if (!el) return;
    const p = cardBgParts(url, adj, base);
    el.style.backgroundImage = p.image;
    el.style.backgroundSize = p.size;
    el.style.backgroundPosition = p.position;
    el.style.backgroundRepeat = 'no-repeat';
}

// Tamanho da letra: variável CSS lida pelas regras de css/responsive.css e
// pelo ajuste automático de texto do Descarte (fitCardTexts).
export function applyCardFontScale(game, el = document.documentElement) {
    el.style.setProperty('--card-font-scale', String(getCardVisual(game).fontScale));
}

export function readCardFontScale(el) {
    const v = parseFloat(getComputedStyle(el || document.documentElement).getPropertyValue('--card-font-scale'));
    return Number.isFinite(v) && v > 0 ? v : 1;
}
