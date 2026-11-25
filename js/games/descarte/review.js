// js/games/descarte/review.js
import { countBaseCards } from './model.js?v=6';
import { cardFaceHtml, fitCardTexts, frontBgSize, resolveTextBackdrop, TEXT_BACKDROP_CLASSES } from './player.js?v=38';

export const reviewMethods = {
    populateReviewStep: function() {
        if (!this.state.editingGame) return;
        const eg = this.state.editingGame;

        const setSpan = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text || '-';
        };
        const setHtml = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html || '-';
        };

        setSpan('review-game-name', eg.name);
        setSpan('review-game-model', eg.model);
        setSpan('review-game-disciplina', eg.disciplineInfo.disciplina);
        setSpan('review-game-conteudo', eg.disciplineInfo.conteudo);
        setSpan('review-game-serie', eg.disciplineInfo.serie);
        setSpan('review-game-autores', (eg.disciplineInfo.autores || []).join(', ') || 'Nenhum');

        setHtml('review-game-enunciado', eg.enunciado);
        const rEl = document.getElementById('review-game-regra'); if (rEl) rEl.innerHTML = eg.regra || '-';
        const oEl = document.getElementById('review-game-objetivo'); if (oEl) oEl.innerHTML = eg.objetivo || '-';
        setHtml('review-game-explicacao', this.richTextHtml(eg.explicacao));

        document.getElementById('review-preview-front').src = eg.frontDesign || 'imagens/frente/frente01.png';
        document.getElementById('review-preview-back').src = eg.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

        const grid = document.getElementById('review-cards-grid');
        grid.innerHTML = '';

        const attributes = eg.cards?.attributes || [];
        const filled = (attr) => (attr?.values || []).filter(v => this.stripHtml(v.text) || v.image);
        const values0 = filled(attributes[0]);
        const values1 = filled(attributes[1]);
        const front = eg.frontDesign || 'imagens/frente/frente01.png';
        const bgSize = frontBgSize(front);

        // Mesma carta da mesa de jogo: imagem da frente + face desenhada por
        // cardFaceHtml (player.js), com a faixa atrás do texto escolhida em Aparência.
        const cardHtml = (card, caption, isMaster) => `
            <div class="flex flex-col items-center gap-1.5">
                <div class="descarte-review-card" style="background-image:url('${front}'); background-size:${bgSize};">
                    ${isMaster ? '<span class="descarte-review-star" title="Tem carta mestre"><i class="fa-solid fa-star"></i></span>' : ''}
                    <div class="descarte-hand-card-inner">${cardFaceHtml(card, attributes)}</div>
                </div>
                ${caption ? `<span class="text-[11px] font-black uppercase tracking-widest text-slate-500 text-center leading-tight">${caption}</span>` : ''}
            </div>`;

        const section = (title, subtitle, cardsHtml) => {
            const el = document.createElement('div');
            el.className = 'col-span-full space-y-3';
            el.innerHTML = `
                <div>
                    <p class="text-sm font-black text-slate-700">${title}</p>
                    ${subtitle ? `<p class="text-xs text-slate-500">${subtitle}</p>` : ''}
                </div>
                <div class="descarte-review-cards descarte-text-${resolveTextBackdrop(eg)}">${cardsHtml}</div>`;
            grid.appendChild(el);
        };

        const name0 = attributes[0]?.name || 'Atributo 1';
        const name1 = attributes[1]?.name || 'Atributo 2';
        const baseCards = [];
        values0.forEach(v0 => values1.forEach(v1 => baseCards.push({
            card: { kind: 'base', tags: [{ attr: 0, valueId: v0.id }, { attr: 1, valueId: v1.id }] },
            master: v0.isMaster || v1.isMaster
        })));
        section(
            `Cartas do jogo (${countBaseCards(attributes)})`,
            `Cada carta junta 1 valor de ${this.escapeCardText(name0)} (em cima) com 1 valor de ${this.escapeCardText(name1)} (embaixo). A estrela marca as cartas com valor mestre.`,
            baseCards.length ? baseCards.map(c => cardHtml(c.card, '', c.master)).join('') : '<p class="text-sm text-slate-500">Nenhuma carta ainda: preencha os valores no bloco Criação de Cartas.</p>'
        );

        // Um exemplo de cada carta especial (as que carregam valor usam o primeiro de cada atributo).
        const tag0 = values0[0] ? [{ attr: 0, valueId: values0[0].id }] : [];
        const tag1 = values1[0] ? [{ attr: 1, valueId: values1[0].id }] : [];
        const specials = [
            { card: { kind: 'draw1', tags: tag0 }, caption: 'Compra 1' },
            { card: { kind: 'draw2', tags: tag1 }, caption: 'Compra 2' },
            { card: { kind: 'skip', tags: tag0 }, caption: 'Perde a vez*' },
            { card: { kind: 'reverse', tags: tag1 }, caption: 'Inverte a ordem*' },
            { card: { kind: 'draw4choose', tags: [] }, caption: 'Compra 4 e escolhe' },
            { card: { kind: 'choose', tags: [] }, caption: 'Escolhe' }
        ];
        section(
            'Cartas especiais (exemplos)',
            'Entram no baralho junto com as cartas acima. *Só nas partidas com 3 jogadores.',
            specials.map(sp => cardHtml(sp.card, sp.caption, false)).join('')
        );

        // A faixa da partida fica no <body>; aqui quem decide é cada grupo de cartas.
        document.body.classList.remove(...TEXT_BACKDROP_CLASSES);
        requestAnimationFrame(() => fitCardTexts(grid));
    }
};
