// js/games/eliminacao/review.js
import { countBaseCards } from './model.js?v=2';

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
        setSpan('review-game-disciplina', eg.disciplineInfo.disciplina);
        setSpan('review-game-conteudo', eg.disciplineInfo.conteudo);
        setSpan('review-game-serie', eg.disciplineInfo.serie);
        setSpan('review-game-autores', (eg.disciplineInfo.autores || []).join(', ') || 'Nenhum');

        setHtml('review-game-enunciado', eg.enunciado);
        const rEl = document.getElementById('review-game-regra'); if (rEl) rEl.innerHTML = eg.regra || '-';
        const oEl = document.getElementById('review-game-objetivo'); if (oEl) oEl.innerHTML = eg.objetivo || '-';
        setSpan('review-game-explicacao', eg.explicacao);

        document.getElementById('review-preview-front').src = eg.frontDesign || 'imagens/frente/frente01.png';
        document.getElementById('review-preview-back').src = eg.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

        const grid = document.getElementById('review-cards-grid');
        grid.innerHTML = '';

        const attributes = eg.cards?.attributes || [];
        const cartasBase = countBaseCards(attributes);

        const summary = document.createElement('div');
        summary.className = 'col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 text-center';
        summary.innerText = `${cartasBase} cartas-base (combinações possíveis entre os dois atributos)`;
        grid.appendChild(summary);

        attributes.forEach((attr, idx) => {
            const header = document.createElement('div');
            header.className = 'col-span-full mt-2';
            header.innerHTML = `<p class="text-xs font-black uppercase tracking-widest text-slate-500">${attr.name || ('Atributo ' + (idx + 1))}</p>`;
            grid.appendChild(header);

            attr.values.forEach(val => {
                const cardEl = document.createElement('div');
                cardEl.className = `p-3 rounded-xl border flex flex-col items-center justify-center text-center text-sm font-semibold relative ${val.isMaster ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700'}`;
                const contentHtml = val.image
                    ? `<img src="${val.image}" class="max-w-full max-h-20 object-contain rounded-lg mb-1" />${val.text ? `<p class="mt-1">${val.text}</p>` : ''}`
                    : `<p>${val.text || ''}</p>`;
                cardEl.innerHTML = `${val.isMaster ? '<span class="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] rounded-full w-6 h-6 flex items-center justify-center shadow"><i class="fa-solid fa-star"></i></span>' : ''}${contentHtml}`;
                grid.appendChild(cardEl);
            });
        });
    }
};
