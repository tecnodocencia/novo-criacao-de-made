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
        const frontDesign = eg.frontDesign || 'imagens/frente/frente01.png';

        // Mesmo desenho da carta no banco do jogo (renderPlayBank em player.js):
        // frente escolhida em Aparência + conteúdo numa área branca no meio.
        const cardHtml = (card, idx) => {
            const useBg = card.frontImage || frontDesign;
            const hasContent = !!(card.contentImage || this.stripHtml(card.content));
            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-full object-contain" />`
                : (card.content || '<span class="text-xs font-bold text-slate-400">Vazia</span>');
            return `
                <div class="flex flex-col items-center gap-1.5">
                    <div class="cs-review-card ${hasContent ? '' : 'opacity-60'}">
                        <div class="bank-card-inner" style="background-image: url('${useBg}'); background-size: cover; background-position: center;">
                            <div class="w-full h-full flex items-center justify-center p-2 ${card.frontImage ? 'bg-transparent' : 'bg-white/80'} rounded-[22px] overflow-hidden">
                                ${contentHtml}
                            </div>
                        </div>
                    </div>
                    <span class="text-[11px] font-black uppercase tracking-widest text-slate-500">Carta ${idx + 1}</span>
                </div>`;
        };

        const section = (title, subtitle, tone, cards, offset) => {
            const el = document.createElement('div');
            el.className = `col-span-full rounded-2xl border p-4 space-y-3 ${tone}`;
            el.innerHTML = `
                <div>
                    <p class="text-sm font-black">${title}</p>
                    <p class="text-xs opacity-80">${subtitle}</p>
                </div>
                <div class="cs-review-cards">${cards.map((c, i) => cardHtml(c, offset + i)).join('')}</div>`;
            grid.appendChild(el);
        };

        const cards = eg.cards || [];
        section('Cartas corretas', 'Fazem parte do código secreto que o aluno precisa descobrir.',
            'border-emerald-200 bg-emerald-50/60 text-emerald-900', cards.slice(0, 6), 0);
        section('Cartas distratoras', 'Aparecem no banco de cartas para confundir; não fazem parte do código.',
            'border-slate-200 bg-slate-50 text-slate-700', cards.slice(6), 6);
    }
};
