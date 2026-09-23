// js/games/codigo-secreto/editorCartas.js
export const editorCartasMethods = {
    renderEditorGrid: function() {
        const grid = document.getElementById('editor-grid');
        if(!grid || !this.state.editingGame) return;
        grid.innerHTML = '';

        const sectionHeader = (label, colorClasses) => {
            const el = document.createElement('div');
            el.className = `col-span-full flex items-center gap-2 ${colorClasses} rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest`;
            el.innerHTML = label;
            return el;
        };

        this.state.editingGame.cards.forEach((card, idx) => {
            if (idx === 0) {
                grid.appendChild(sectionHeader('<i class="fa-solid fa-check-circle"></i> Cartas corretas (posições 1–6) — fazem parte do Código Secreto', 'bg-emerald-100 text-emerald-700'));
            }
            if (idx === 6) {
                grid.appendChild(sectionHeader('<i class="fa-solid fa-times-circle"></i> Cartas distratoras (posições 7–12) — nunca fazem parte do Código Secreto', 'bg-red-100 text-red-700'));
            }

            const cardEl = document.createElement('div');
            cardEl.className = `game-card flex flex-col p-3 cursor-pointer transition-all ${card.content || card.contentImage ? '' : 'empty'}`;
            cardEl.title = 'Clique para editar o conteúdo desta carta (texto ou imagem).';
            cardEl.onclick = () => this.openCardModal(idx);

            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-24 object-contain rounded-lg mb-1" />`
                : `<p class="text-xs font-bold text-slate-800 text-center leading-tight line-clamp-3 px-1">${card.content || ''}</p>`;

            cardEl.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    ${card.content || card.contentImage ? contentHtml : `
                        <i class="fa-solid fa-plus text-2xl text-slate-300"></i>
                        <span class="text-[10px] font-bold text-slate-400 mt-2">EDITAR</span>
                    `}
                </div>
                <div class="mt-2">
                    <div title="${card.isCorrect ? 'Esta carta pode fazer parte do Código Secreto (posição fixa).' : 'Esta carta é apenas distratora e nunca faz parte do Código Secreto (posição fixa).'}" class="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider ${card.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}">
                        <i class="fa-solid ${card.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <span>${card.isCorrect ? 'Correta' : 'Distratora'}</span>
                    </div>
                </div>
            `;
            grid.appendChild(cardEl);
        });
    },

    updateSecretCardCounter: function() {
        const counterEl = document.getElementById('secret-card-counter');
        if (!counterEl || !this.state.editingGame) return;
        const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
        counterEl.innerText = `${correctCount} / 6 corretas`;
    },

    openCardModal: function(idx) {
        this.state.selectedCardIndex = idx;
        const card = this.state.editingGame.cards[idx];
        document.getElementById('modal-card-index').value = idx;
        document.getElementById('modal-card-content').innerHTML = card.content || "";

        const preview = document.getElementById('modal-card-image-preview');
        const wrapper = document.getElementById('modal-card-image-preview-wrapper');
        const urlInput = document.getElementById('modal-card-image-url');
        urlInput.value = (card.contentImage && !card.contentImage.startsWith('data:')) ? card.contentImage : '';

        if (card.contentImage) {
            preview.src = card.contentImage;
            wrapper.classList.remove('hidden');
        } else {
            preview.src = '';
            wrapper.classList.add('hidden');
        }

        const statusEl = document.getElementById('modal-card-status');
        if (statusEl) {
            statusEl.className = `rounded-2xl p-4 flex items-center gap-3 text-sm font-bold ${card.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`;
            statusEl.innerHTML = card.isCorrect
                ? '<i class="fa-solid fa-check-circle"></i> Esta é uma carta correta (posição ' + (idx + 1) + ' de 12) — pode fazer parte do Código Secreto.'
                : '<i class="fa-solid fa-times-circle"></i> Esta é uma carta distratora (posição ' + (idx + 1) + ' de 12) — nunca faz parte do Código Secreto.';
        }

        this.switchSymTab('todos');
        document.getElementById('modal-card').style.display = 'flex';
    },

    closeCardModal: function() {
        document.getElementById('modal-card').style.display = 'none';
        this.state.tempContentImage = null;
    },

    handleCardImageUrlInput: function(event) {
        const url = event.target.value.trim();
        const preview = document.getElementById('modal-card-image-preview');
        const wrapper = document.getElementById('modal-card-image-preview-wrapper');

        if (url) {
            preview.src = url;
            wrapper.classList.remove('hidden');
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
        document.getElementById('modal-card-image-url').value = '';
        document.getElementById('modal-card-image-preview').src = '';
        document.getElementById('modal-card-image-preview-wrapper').classList.add('hidden');
        this.state.tempContentImage = null;
        if (typeof this.state.selectedCardIndex === 'number' && this.state.editingGame) {
             this.state.editingGame.cards[this.state.selectedCardIndex].contentImage = null;
        }
    },

    saveCardModal: function() {
        const idx = parseInt(document.getElementById('modal-card-index').value);
        const content = document.getElementById('modal-card-content').innerHTML;
        // .innerHTML pode vir com markup "vazio" (ex: "<br>" deixado pelo
        // navegador ao apagar tudo) — a checagem de "tem texto" usa a versão
        // sem tags, não o innerHTML bruto.
        const hasText = this.stripHtml(content).length > 0;

        const urlVal = document.getElementById('modal-card-image-url').value.trim();
        if (urlVal) {
            this.state.tempContentImage = urlVal;
        }

        const hasImage = !!this.state.tempContentImage || !!this.state.editingGame.cards[idx].contentImage;

        if (!hasText && !hasImage) { this.showNotification("A carta precisa ter texto ou uma imagem."); return; }

        this.state.editingGame.cards[idx].content = hasText ? content : '';
        // isCorrect não é mais editável aqui — é fixo pela posição da carta
        // (as 6 primeiras são sempre corretas, as 6 últimas sempre distratoras).
        if (this.state.tempContentImage) {
            this.state.editingGame.cards[idx].contentImage = this.state.tempContentImage;
        }
        this.state.tempContentImage = null;

        this.closeCardModal();
        this.renderEditorGrid();
        this.updateSecretCardCounter();
        this.scheduleAutoSave();
    }
};
