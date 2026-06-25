// js/games/codigo-secreto/review.js
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
        eg.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `p-3 rounded-xl border flex flex-col items-center justify-center text-center text-xs font-semibold ${card.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`;
            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-20 object-contain rounded-lg mb-1" />${card.content ? `<p class="mt-1">${this.escapeCardText(card.content)}</p>` : ''}`
                : `<p>${this.escapeCardText(card.content)}</p>`;
            cardEl.innerHTML = contentHtml;
            grid.appendChild(cardEl);
        });
    }
};
