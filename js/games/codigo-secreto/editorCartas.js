// js/games/codigo-secreto/editorCartas.js
export const editorCartasMethods = {
    renderEditorGrid: function() {
        const grid = document.getElementById('editor-grid');
        if(!grid || !this.state.editingGame) return;
        grid.innerHTML = '';
        this.state.editingGame.cards.forEach((card, idx) => {
            const cardEl = document.createElement('div');
            cardEl.className = `game-card flex flex-col p-3 cursor-pointer transition-all ${card.content || card.contentImage ? '' : 'empty'}`;
            cardEl.onclick = (e) => {
                if (e.target.closest('.status-badge')) return;
                this.openCardModal(idx);
            };

            const contentHtml = card.contentImage
                ? `<img src="${card.contentImage}" class="max-w-full max-h-24 object-contain rounded-lg mb-1" />`
                : `<p class="text-[11px] font-bold text-slate-800 text-center leading-tight line-clamp-3 px-1">${this.escapeCardText(card.content)}</p>`;

            cardEl.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    ${card.content || card.contentImage ? contentHtml : `
                        <i class="fa-solid fa-plus text-2xl text-slate-300"></i>
                        <span class="text-[9px] font-bold text-slate-400 mt-2">EDITAR</span>
                    `}
                </div>
                <div class="mt-2">
                    <button onclick="app.toggleCardCorrect(${idx})" class="status-badge w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider transition-colors ${card.isCorrect ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}">
                        <i class="fa-solid ${card.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <span>${card.isCorrect ? 'Possível' : 'Não é'}</span>
                    </button>
                </div>
            `;
            grid.appendChild(cardEl);
        });
    },

    toggleCardCorrect: function(idx) {
        if(!this.state.editingGame) return;
        const card = this.state.editingGame.cards[idx];
        if (!card.isCorrect) {
            const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
            if(correctCount >= 6) { this.showNotification("Você já atingiu o limite de 6 cartas possíveis."); return; }
        }
        card.isCorrect = !card.isCorrect;
        this.renderEditorGrid();
        this.updateSecretCardCounter();
    },

    updateSecretCardCounter: function() {
        const counterEl = document.getElementById('secret-card-counter');
        if (!counterEl || !this.state.editingGame) return;
        const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
        counterEl.innerText = `${correctCount} / 6 selecionadas`;
    },

    openCardModal: function(idx) {
        this.state.selectedCardIndex = idx;
        const card = this.state.editingGame.cards[idx];
        document.getElementById('modal-card-index').value = idx;
        document.getElementById('modal-card-content').value = card.content || "";

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

        const radios = document.getElementsByName('modal-card-correct');
        radios[0].checked = card.isCorrect === true;
        radios[1].checked = card.isCorrect === false;

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
        const content = document.getElementById('modal-card-content').value.trim();
        const isCorrectChecked = document.querySelector('input[name="modal-card-correct"]:checked').value === "true";

        const urlVal = document.getElementById('modal-card-image-url').value.trim();
        if (urlVal) {
            this.state.tempContentImage = urlVal;
        }

        const hasImage = !!this.state.tempContentImage || !!this.state.editingGame.cards[idx].contentImage;

        if (!content && !hasImage) { this.showNotification("A carta precisa ter texto ou uma imagem."); return; }

        if (isCorrectChecked && !this.state.editingGame.cards[idx].isCorrect) {
            const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
            if(correctCount >= 6) { this.showNotification("Você já atingiu o limite de 6 cartas possíveis."); return; }
        }

        this.state.editingGame.cards[idx].content = content;
        this.state.editingGame.cards[idx].isCorrect = isCorrectChecked;
        if (this.state.tempContentImage) {
            this.state.editingGame.cards[idx].contentImage = this.state.tempContentImage;
        }
        this.state.tempContentImage = null;

        this.closeCardModal();
        this.renderEditorGrid();
        this.updateSecretCardCounter();
    }
};
