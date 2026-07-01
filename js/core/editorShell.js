// js/core/editorShell.js
import { dbService } from '../database.js';
import { getGame } from '../games/registry.js';

export const frontDesigns = [
    'imagens/frente/frente01.png',
    'imagens/frente/Cópia de Frente da Carta - Tipo 2.png',
    'imagens/frente/Cópia de Frente da Carta - Tipo 3.png'
];
export const backDesigns = [
    'imagens/verso/Cópia de Trás da carta - Esportes.png',
    'imagens/verso/Cópia de Trás da Carta - Humanas.png',
    'imagens/verso/Cópia de Trás da Carta - Línguas.png',
    'imagens/verso/Cópia de Trás da Carta - Matemática 1.png',
    'imagens/verso/Cópia de Trás da Carta - Matemática 2.png',
    'imagens/verso/Cópia de Trás da Carta - Natureza.png',
    'imagens/verso/Cópia de Trás da Carta Matemática 1 sem moldura.png',
    'imagens/verso/Cópia de Trás da Carta Matemática 2 sem moldura.png',
    'imagens/verso/Cópia de Trás da Carta Natureza sem moldura.png',
    'imagens/verso/Cópia de Trás da Carta Qui Fis.png'
];

export const editorShellMethods = {
    newGame: function() {
        const modelName = 'Código Secreto';
        const defaults = getGame(modelName).getDefaultData();
        this.state.editingGame = {
            id: "game-" + Date.now(),
            name: "",
            model: modelName,
            ...defaults
        };
        this.state.editingStep = 1;
        this.syncEditorUI();
        this.updateSecretCardCounter();
        this.switchView('creator');
    },

    editGame: function(id) {
        const g = this.state.games.find(x => x.id === id);
        this.state.editingGame = JSON.parse(JSON.stringify(g));
        this.state.editingStep = 1;
        this.syncEditorUI();
        this.updateSecretCardCounter();
        this.switchView('creator');
    },

    syncEditorUI: function() {
        if (!this.state.editingGame) return;
        const eg = this.state.editingGame;

        if (!eg.disciplineInfo) { eg.disciplineInfo = {}; }
        if (!Array.isArray(eg.disciplineInfo.autores)) { eg.disciplineInfo.autores = []; }

        if (document.getElementById('edit-game-name')) document.getElementById('edit-game-name').value = eg.name || "";
        if (document.getElementById('edit-game-model')) document.getElementById('edit-game-model').value = eg.model || "Código Secreto";
        document.querySelectorAll('#model-choices > div').forEach(d => d.style.borderColor = '#e5e7eb');
        const chosen = Array.from(document.querySelectorAll('#model-choices > div')).find(d => d.innerText.trim().includes(eg.model || ''));
        if (chosen) chosen.style.borderColor = '#10b981';

        const disciplinaSelect = document.getElementById('edit-game-disciplina');
        const serieSelect = document.getElementById('edit-game-serie');
        const discVal = eg.disciplineInfo.disciplina || 'Biologia';
        const serieVal = eg.disciplineInfo.serie || '1º ano';

        const discOption = Array.from(disciplinaSelect.options).find(o => o.value === discVal);
        if (!discOption) {
            document.getElementById('edit-game-disciplina-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-disciplina-outro').value = discVal;
            disciplinaSelect.value = 'Outro';
        } else {
            disciplinaSelect.value = discVal;
            document.getElementById('edit-game-disciplina-outro-wrap').classList.add('hidden');
        }

        const serieOption = Array.from(serieSelect.options).find(o => o.value === serieVal);
        if (!serieOption) {
            document.getElementById('edit-game-serie-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-serie-outro').value = serieVal;
            serieSelect.value = 'Outro';
        } else {
            serieSelect.value = serieVal;
            document.getElementById('edit-game-serie-outro-wrap').classList.add('hidden');
        }

        if (document.getElementById('edit-game-conteudo')) document.getElementById('edit-game-conteudo').value = eg.disciplineInfo.conteudo || "";
        if (document.getElementById('edit-game-regra')) document.getElementById('edit-game-regra').innerHTML = eg.regra || "";
        if (document.getElementById('edit-game-objetivo')) document.getElementById('edit-game-objetivo').innerHTML = eg.objetivo || "";
        if (document.getElementById('edit-game-enunciado')) document.getElementById('edit-game-enunciado').innerHTML = eg.enunciado || "";
        if (document.getElementById('edit-game-explicacao')) {
            document.getElementById('edit-game-explicacao').value = eg.explicacao || "";
            this.autoResizeTextarea(document.getElementById('edit-game-explicacao'));
        }

        document.getElementById('preview-front').src = eg.frontDesign || 'imagens/frente/frente01.png';
        document.getElementById('preview-back').src = eg.backDesign || 'imagens/verso/Cópia de Trás da Carta - Natureza.png';

        this.renderAuthorsList();
        this.renderEditorGrid();
        this.showStep(this.state.editingStep);
    },

    persistEditorFields: function() {
        if (!this.state.editingGame) return;

        this.state.editingGame.name = document.getElementById('edit-game-name')?.value || "Jogo sem Nome";
        this.state.editingGame.model = this.state.editingGame.model || document.getElementById('edit-game-model')?.value || "Código Secreto";

        if (!this.state.editingGame.disciplineInfo) this.state.editingGame.disciplineInfo = {};
        const disciplinaSelect = document.getElementById('edit-game-disciplina');
        if (disciplinaSelect && disciplinaSelect.value === 'Outro') {
            const outro = document.getElementById('edit-game-disciplina-outro')?.value.trim() || 'Outro';
            this.state.editingGame.disciplineInfo.disciplina = outro;
        } else {
            this.state.editingGame.disciplineInfo.disciplina = disciplinaSelect?.value || 'Biologia';
        }

        this.state.editingGame.disciplineInfo.conteudo = document.getElementById('edit-game-conteudo')?.value || "";

        const serieSelect = document.getElementById('edit-game-serie');
        if (serieSelect && serieSelect.value === 'Outro') {
            const outro = document.getElementById('edit-game-serie-outro')?.value.trim() || 'Outro';
            this.state.editingGame.disciplineInfo.serie = outro;
        } else {
            this.state.editingGame.disciplineInfo.serie = serieSelect?.value || '1º ano';
        }

        this.state.editingGame.regra = document.getElementById('edit-game-regra')?.innerHTML || "";
        this.state.editingGame.objetivo = document.getElementById('edit-game-objetivo')?.innerHTML || "";
        this.state.editingGame.enunciado = document.getElementById('edit-game-enunciado')?.innerHTML || "";
        this.state.editingGame.explicacao = document.getElementById('edit-game-explicacao')?.value || "";
    },

    showStep: function(step) {
        this.state.editingStep = step;
        document.querySelectorAll('.creator-step').forEach(el => el.classList.add('hidden'));

        const activeEl = document.getElementById(`creator-step-${step}`);
        if (activeEl) activeEl.classList.remove('hidden');

        const progressFill = document.getElementById('creator-progress-fill');
        if (progressFill) progressFill.style.width = `${(step / 5) * 100}%`;

        const titleMap = { 1: 'Dados do Jogo', 2: 'Regras e Aparência', 3: 'Enunciado e Feedbacks', 4: 'Criação de Cartas', 5: 'Revisão e Teste' };
        const stepLabel = document.getElementById('creator-step-current');
        const stepTitle = document.getElementById('creator-step-title');

        if (stepLabel) stepLabel.innerText = step;
        if (stepTitle) stepTitle.innerText = titleMap[step] || 'Editor';

        const prevBtn = document.getElementById('creator-prev-btn');
        const nextBtn = document.getElementById('creator-next-btn');
        const step5Actions = document.getElementById('creator-step-5-actions');

        if (prevBtn) prevBtn.classList.toggle('hidden', step === 1);
        if (nextBtn) nextBtn.classList.toggle('hidden', step === 5);
        if (step5Actions) step5Actions.classList.toggle('hidden', step !== 5);

        if (nextBtn) nextBtn.innerText = step === 4 ? 'Revisar' : 'Próximo';

        if (step === 5) {
            this.populateReviewStep();
        }

        document.getElementById('creator-validation-message').classList.add('hidden');
    },

    creatorNextStep: function() {
        this.persistEditorFields();
        const current = this.state.editingStep;

        if (current === 1) {
            if (!this.state.editingGame.name.trim()) { this.showValidationError("Insira o título do jogo."); return; }
            if (!this.state.editingGame.disciplineInfo.conteudo.trim()) { this.showValidationError("Insira o conteúdo do jogo."); return; }
        }
        if (current === 4) {
            const filledCount = this.state.editingGame.cards.filter(c => c.content.trim() !== "" || !!c.contentImage).length;
            if (filledCount < 12) { this.showValidationError("Preencha todas as 12 cartas com texto ou imagem antes de finalizar."); return; }
            const correctCount = this.state.editingGame.cards.filter(c => c.isCorrect).length;
            if (correctCount !== 6) { this.showValidationError("Exatamente 6 cartas precisam ser marcadas como possíveis para o código."); return; }
        }
        if (current < 5) {
            this.showStep(current + 1);
        }
    },

    creatorPrevStep: function() {
        this.persistEditorFields();
        if (this.state.editingStep > 1) {
            this.showStep(this.state.editingStep - 1);
        }
    },

    showValidationError: function(msg) {
        const el = document.getElementById('creator-validation-message');
        if (el) { el.innerText = msg; el.classList.remove('hidden'); }
    },

    saveGame: async function() {
        // Sincroniza o DOM com o state antes de salvar (garante campos do passo atual)
        this.persistEditorFields();
        try {
            const jogoSalvo = await dbService.salvarJogo(this.state.editingGame);

            const idx = this.state.games.findIndex(g => g.id === this.state.editingGame.id);
            if(idx !== -1) this.state.games[idx] = jogoSalvo;
            else this.state.games.push(jogoSalvo);

            this.state.editingGame = null;
            this.renderDashboard();
            this.switchView('dashboard');
            this.showNotification("Jogo salvo com sucesso!");
        } catch (error) {
            console.error(error);
            this.showNotification("Erro ao salvar o jogo no banco de dados.");
        }
    },

    openAuthorModal: function() {
        document.getElementById('modal-author').style.display = 'flex';
        document.getElementById('modal-input-author').value = '';
        document.getElementById('modal-input-author').focus();
    },

    closeAuthorModal: function() {
        document.getElementById('modal-author').style.display = 'none';
    },

    handleModalAuthorKeypress: function(event) {
        if (event.key === 'Enter') { event.preventDefault(); this.confirmAuthor(); }
    },

    confirmAuthor: function() {
        const input = document.getElementById('modal-input-author');
        if (!input) return;
        const value = input.value.trim();
        if (value && this.state.editingGame) {
            if (!this.state.editingGame.disciplineInfo) this.state.editingGame.disciplineInfo = {};
            if (!Array.isArray(this.state.editingGame.disciplineInfo.autores)) this.state.editingGame.disciplineInfo.autores = [];
            if (!this.state.editingGame.disciplineInfo.autores.includes(value)) {
                this.state.editingGame.disciplineInfo.autores.push(value);
                this.renderAuthorsList();
            }
        }
        this.closeAuthorModal();
    },

    removeAuthor: function(idx) {
        if(this.state.editingGame && Array.isArray(this.state.editingGame.disciplineInfo?.autores)) {
            this.state.editingGame.disciplineInfo.autores.splice(idx, 1);
            this.renderAuthorsList();
        }
    },

    renderAuthorsList: function() {
        const list = document.getElementById('edit-game-authors-list');
        if(!list || !this.state.editingGame) return;
        list.innerHTML = '';
        (this.state.editingGame.disciplineInfo.autores || []).forEach((author, idx) => {
            const chip = document.createElement('div');
            chip.className = 'author-chip';
            chip.innerHTML = `<span>${author}</span><button type="button" onclick="app.removeAuthor(${idx})">×</button>`;
            list.appendChild(chip);
        });
    },

    selectModel: function(modelName, el) {
        if (!this.state.editingGame) return;
        this.state.editingGame.model = modelName;
        document.querySelectorAll('#model-choices > div').forEach(d => d.style.borderColor = '#e5e7eb');
        if (el) el.style.borderColor = '#10b981';
    },

    handleDisciplinaSelectChange: function(e) {
        const val = e.target.value;
        if (val === 'Outro') {
            document.getElementById('edit-game-disciplina-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-disciplina-outro').focus();
        } else {
            document.getElementById('edit-game-disciplina-outro-wrap').classList.add('hidden');
        }
    },

    clearDisciplinaOutro: function() {
        const sel = document.getElementById('edit-game-disciplina');
        sel.value = sel.options[0].value;
        document.getElementById('edit-game-disciplina-outro').value = '';
        document.getElementById('edit-game-disciplina-outro-wrap').classList.add('hidden');
    },

    handleSerieSelectChange: function(e) {
        const val = e.target.value;
        if (val === 'Outro') {
            document.getElementById('edit-game-serie-outro-wrap').classList.remove('hidden');
            document.getElementById('edit-game-serie-outro').focus();
        } else {
            document.getElementById('edit-game-serie-outro-wrap').classList.add('hidden');
        }
    },

    clearSerieOutro: function() {
        const sel = document.getElementById('edit-game-serie');
        sel.value = sel.options[0].value;
        document.getElementById('edit-game-serie-outro').value = '';
        document.getElementById('edit-game-serie-outro-wrap').classList.add('hidden');
    },

    handleCardImageUpload: function(side, e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const idx = this.state.selectedCardIndex;
            if (typeof idx === 'number' && this.state.editingGame && this.state.editingGame.cards[idx]) {
                if (side === 'front') this.state.editingGame.cards[idx].frontImage = dataUrl;
                else this.state.editingGame.cards[idx].backImage = dataUrl;
            }
        };
        reader.readAsDataURL(file);
    },

    removeCardImage: function(side) {
        const idx = this.state.selectedCardIndex;
        if (typeof idx === 'number' && this.state.editingGame && this.state.editingGame.cards[idx]) {
            if (side === 'front') { this.state.editingGame.cards[idx].frontImage = null; }
            if (side === 'back') { this.state.editingGame.cards[idx].backImage = null; }
        }
    },

    toggleFrontDesign: function(dir) {
        if(!this.state.editingGame) return;
        let idx = frontDesigns.indexOf(this.state.editingGame.frontDesign);
        if(dir==='next') idx = (idx + 1) % frontDesigns.length;
        else idx = (idx - 1 + frontDesigns.length) % frontDesigns.length;
        this.state.editingGame.frontDesign = frontDesigns[idx];
        document.getElementById('preview-front').src = this.state.editingGame.frontDesign;
    },

    toggleBackDesign: function(dir) {
        if(!this.state.editingGame) return;
        let idx = backDesigns.indexOf(this.state.editingGame.backDesign);
        if(dir==='next') idx = (idx + 1) % backDesigns.length;
        else idx = (idx - 1 + backDesigns.length) % backDesigns.length;
        this.state.editingGame.backDesign = backDesigns[idx];
        document.getElementById('preview-back').src = this.state.editingGame.backDesign;
    },

    handleExternalFrontImageUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const userId = this.state.activeUser?.id || 'public';
            const fileName = `${userId}/design/front-${Date.now()}-${file.name}`;
            const publicUrl = await dbService.uploadImagem(file, fileName);

            document.getElementById('external-front-preview').src = publicUrl;
            document.getElementById('external-front-preview-wrapper').classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.frontDesign = publicUrl;
            document.getElementById('preview-front').src = publicUrl;
            document.getElementById('review-preview-front').src = publicUrl;
        } catch (error) {
            console.error(error);
            this.showNotification("Erro ao enviar frente da carta.");
        }
    },

    removeExternalFrontImage: function() {
        document.getElementById('external-front-file').value = '';
        document.getElementById('external-front-preview').src = '';
        document.getElementById('external-front-preview-wrapper').classList.add('hidden');
        if (this.state.editingGame) {
            this.state.editingGame.frontDesign = frontDesigns[0];
        }
        document.getElementById('preview-front').src = frontDesigns[0];
        document.getElementById('review-preview-front').src = frontDesigns[0];
    },

    handleExternalBackImageUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const userId = this.state.activeUser?.id || 'public';
            const fileName = `${userId}/design/back-${Date.now()}-${file.name}`;
            const publicUrl = await dbService.uploadImagem(file, fileName);

            document.getElementById('external-back-preview').src = publicUrl;
            document.getElementById('external-back-preview-wrapper').classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.backDesign = publicUrl;
            document.getElementById('preview-back').src = publicUrl;
            document.getElementById('review-preview-back').src = publicUrl;
        } catch (error) {
            console.error(error);
            this.showNotification("Erro ao enviar verso da carta.");
        }
    },

    removeExternalBackImage: function() {
        document.getElementById('external-back-file').value = '';
        document.getElementById('external-back-preview').src = '';
        document.getElementById('external-back-preview-wrapper').classList.add('hidden');
        if (this.state.editingGame) {
            this.state.editingGame.backDesign = backDesigns[0];
        }
        document.getElementById('preview-back').src = backDesigns[0];
        document.getElementById('review-preview-back').src = backDesigns[0];
    }
};
