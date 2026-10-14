// js/games/descarte/editorCartas.js
// Bloco "Criação de Cartas" do editor para o modelo Descarte a Carta: o professor
// define 2 atributos (nome + 2 a 9 valores cada) e marca exatamente 2
// valores "carta mestre" por atributo. Ver js/games/descarte/model.js para
// as regras derivadas (cartas-base, cópias de especiais, cartas mestre).
import { countBaseCards, uuid } from './model.js?v=4';

const ATTR_LABELS = ['Atributo 1', 'Atributo 2'];

// Helper interno (não precisa de despacho por modelo, por isso não é um
// método do objeto exportado — ver nota de arquitetura em player.js).
function getCurrentValue(app) {
    const eg = app.state.editingGame;
    if (!eg || typeof app.state.descarteSelectedAttr !== 'number') return null;
    return eg.cards.attributes[app.state.descarteSelectedAttr]?.values[app.state.descarteSelectedValueIdx] || null;
}

export const editorCartasMethods = {
    renderEditorGrid: function() {
        const eg = this.state.editingGame;
        if (!eg || !eg.cards || !eg.cards.attributes) return;

        eg.cards.attributes.forEach((attr, attrIdx) => {
            const nameInput = document.getElementById(`descarte-attr-${attrIdx}-name`);
            if (nameInput && nameInput.value !== (attr.name || '')) nameInput.value = attr.name || '';

            const grid = document.getElementById(`descarte-attr-${attrIdx}-values`);
            if (!grid) return;
            grid.innerHTML = '';

            attr.values.forEach((val, valueIdx) => {
                const chip = document.createElement('div');
                const hasContent = !!(this.stripHtml(val.text) || val.image);
                chip.className = `game-card flex flex-col p-3 cursor-pointer transition-all relative ${hasContent ? '' : 'empty'}`;
                chip.title = 'Clique para editar este valor (texto ou imagem).';
                chip.onclick = () => this.descarteOpenValueModal(attrIdx, valueIdx);

                const contentHtml = val.image
                    ? `<img src="${val.image}" class="max-w-full max-h-20 object-contain rounded-lg mb-1" />`
                    : `<p class="text-xs font-bold text-slate-800 text-center leading-tight line-clamp-3 px-1">${val.text || ''}</p>`;

                chip.innerHTML = `
                    ${val.isMaster ? `<div class="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-[11px] shadow" title="Carta mestre deste atributo"><i class="fa-solid fa-star"></i></div>` : ''}
                    <button type="button" title="Remover este valor" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center text-[11px] z-10">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div class="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        ${hasContent ? contentHtml : `
                            <i class="fa-solid fa-plus text-2xl text-slate-300"></i>
                            <span class="text-[10px] font-bold text-slate-400 mt-2">EDITAR</span>
                        `}
                    </div>
                `;
                chip.querySelector('button').onclick = (e) => {
                    e.stopPropagation();
                    this.descarteRemoveAttributeValue(attrIdx, valueIdx);
                };
                grid.appendChild(chip);
            });

            const addBtn = document.getElementById(`descarte-attr-${attrIdx}-add`);
            if (addBtn) addBtn.disabled = attr.values.length >= 9;

            const hint = document.getElementById(`descarte-attr-${attrIdx}-hint`);
            if (hint) {
                const masterCount = attr.values.filter(v => v.isMaster).length;
                const parts = [];
                parts.push(`${attr.values.length} / 9 valores (mínimo 2)`);
                parts.push(`${masterCount} / 2 cartas mestre`);
                hint.innerHTML = parts.join(' &bull; ');
                hint.className = `text-xs font-bold mt-2 ${attr.values.length >= 2 && masterCount === 2 ? 'text-emerald-700' : 'text-amber-700'}`;
            }
        });

        const totalEl = document.getElementById('descarte-total-base-cards');
        if (totalEl) totalEl.innerText = String(countBaseCards(eg.cards.attributes));
    },

    descarteUpdateAttributeName: function(attrIdx, event) {
        if (!this.state.editingGame) return;
        this.state.editingGame.cards.attributes[attrIdx].name = event.target.value;
        this.scheduleAutoSave();
    },

    descarteAddAttributeValue: function(attrIdx) {
        const eg = this.state.editingGame;
        if (!eg) return;
        const attr = eg.cards.attributes[attrIdx];
        if (attr.values.length >= 9) {
            this.showNotification('Cada atributo pode ter no máximo 9 valores.');
            return;
        }
        attr.values.push({ id: uuid(), text: '', image: null, isMaster: false });
        this.renderEditorGrid();
        this.saveNow();
        this.descarteOpenValueModal(attrIdx, attr.values.length - 1);
    },

    descarteRemoveAttributeValue: function(attrIdx, valueIdx) {
        const eg = this.state.editingGame;
        if (!eg) return;
        const attr = eg.cards.attributes[attrIdx];
        if (attr.values.length <= 2) {
            this.showNotification('Cada atributo precisa de pelo menos 2 valores.');
            return;
        }
        attr.values.splice(valueIdx, 1);
        this.renderEditorGrid();
        this.saveNow();
    },

    descarteOpenValueModal: function(attrIdx, valueIdx) {
        const eg = this.state.editingGame;
        if (!eg) return;
        const val = eg.cards.attributes[attrIdx].values[valueIdx];
        this.state.descarteSelectedAttr = attrIdx;
        this.state.descarteSelectedValueIdx = valueIdx;
        this.state.descarteTempValueImage = null;

        document.getElementById('descarte-value-modal-attr-label').innerText = eg.cards.attributes[attrIdx].name || ATTR_LABELS[attrIdx];
        document.getElementById('descarte-value-modal-content').innerHTML = val.text || '';
        document.getElementById('descarte-value-modal-master').checked = !!val.isMaster;

        const preview = document.getElementById('descarte-value-modal-image-preview');
        const wrapper = document.getElementById('descarte-value-modal-image-preview-wrapper');
        const urlInput = document.getElementById('descarte-value-modal-image-url');
        urlInput.value = (val.image && !val.image.startsWith('data:')) ? val.image : '';

        if (val.image) {
            preview.src = val.image;
            wrapper.classList.remove('hidden');
        } else {
            preview.src = '';
            wrapper.classList.add('hidden');
        }

        document.getElementById('modal-descarte-value').style.display = 'flex';
    },

    descarteCloseValueModal: function() {
        document.getElementById('modal-descarte-value').style.display = 'none';
        this.state.descarteTempValueImage = null;
    },

    descarteHandleValueImageUrlInput: function(event) {
        const url = event.target.value.trim();
        const preview = document.getElementById('descarte-value-modal-image-preview');
        const wrapper = document.getElementById('descarte-value-modal-image-preview-wrapper');
        if (url) {
            preview.src = url;
            wrapper.classList.remove('hidden');
            this.state.descarteTempValueImage = url;
        } else {
            const current = getCurrentValue(this);
            if (!current || !current.image?.startsWith('data:')) {
                preview.src = '';
                wrapper.classList.add('hidden');
            }
            this.state.descarteTempValueImage = null;
        }
    },

    descarteRemoveValueImage: function() {
        document.getElementById('descarte-value-modal-image-url').value = '';
        document.getElementById('descarte-value-modal-image-preview').src = '';
        document.getElementById('descarte-value-modal-image-preview-wrapper').classList.add('hidden');
        this.state.descarteTempValueImage = null;
        const current = getCurrentValue(this);
        if (current) current.image = null;
    },

    descarteSaveValueModal: function() {
        const val = getCurrentValue(this);
        if (!val) return;

        const content = document.getElementById('descarte-value-modal-content').innerHTML;
        const hasText = this.stripHtml(content).length > 0;

        const urlVal = document.getElementById('descarte-value-modal-image-url').value.trim();
        if (urlVal) this.state.descarteTempValueImage = urlVal;

        const hasImage = !!this.state.descarteTempValueImage || !!val.image;
        if (!hasText && !hasImage) {
            this.showNotification('O valor precisa ter texto ou uma imagem.');
            return;
        }

        val.text = hasText ? content : '';
        if (this.state.descarteTempValueImage) val.image = this.state.descarteTempValueImage;

        const wantsMaster = document.getElementById('descarte-value-modal-master').checked;
        if (wantsMaster) {
            const attr = this.state.editingGame.cards.attributes[this.state.descarteSelectedAttr];
            const currentMasters = attr.values.filter(v => v.isMaster && v.id !== val.id);
            if (currentMasters.length >= 2) {
                this.showNotification('Este atributo já tem 2 cartas mestre. Desmarque uma delas antes de marcar outra.');
                return;
            }
        }
        val.isMaster = wantsMaster;

        this.state.descarteTempValueImage = null;
        this.descarteCloseValueModal();
        this.renderEditorGrid();
        this.saveNow();
    },

    // --- Validação (delegada pelo editor genérico, ver editorShell.js) ---
    validateCreatorCards: function() {
        const eg = this.state.editingGame;
        if (!eg || !eg.cards || !eg.cards.attributes) return { valid: false, message: 'Dados das cartas ausentes.' };

        for (let i = 0; i < 2; i++) {
            const attr = eg.cards.attributes[i];
            if (!attr.name || !attr.name.trim()) {
                return { valid: false, message: `Dê um nome ao ${ATTR_LABELS[i]}.` };
            }
            if (attr.values.length < 2) {
                return { valid: false, message: `${ATTR_LABELS[i]} (${attr.name}) precisa de pelo menos 2 valores.` };
            }
            const filled = attr.values.filter(v => this.stripHtml(v.text) || v.image);
            if (filled.length < attr.values.length) {
                return { valid: false, message: `Preencha todos os valores de ${attr.name} com texto ou imagem.` };
            }
            const masterCount = attr.values.filter(v => v.isMaster).length;
            if (masterCount !== 2) {
                return { valid: false, message: `Marque exatamente 2 cartas mestre em ${attr.name} (hoje: ${masterCount}).` };
            }
        }
        return { valid: true, message: '' };
    },

    isCardsBlockComplete: function() {
        return this.validateCreatorCards().valid;
    }
};
