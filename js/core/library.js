// js/core/library.js
import { dbService } from '../database.js';

export const libraryMethods = {
    refreshLibraryManager: async function() {
        if (!this.state.activeUser) return;
        const grid = document.getElementById('manager-library-grid');
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p class="font-bold">Carregando imagens...</p>
            </div>
        `;

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            grid.innerHTML = '';
            if (imagens.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-slate-400">
                        <i class="fa-solid fa-image-slash text-3xl mb-4"></i>
                        <p class="font-bold">Sua biblioteca está vazia.</p>
                    </div>
                `;
                return;
            }
            imagens.forEach(img => {
                const item = document.createElement('div');
                item.className = "group relative aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all";
                item.innerHTML = `
                    <img src="${img.url}" class="w-full h-full object-contain p-4" />
                    <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <button onclick="app.previewImageDirect('${img.url}')" class="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:scale-110 transition">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </div>
                `;
                grid.appendChild(item);
            });
        } catch (error) {
            grid.innerHTML = `<p class="col-span-full text-center text-red-500">Erro ao carregar biblioteca.</p>`;
        }
    },

    previewImageDirect: function(url) {
        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-card-container');
        const text = document.getElementById('preview-card-text');

        container.style.backgroundImage = 'none';
        container.style.backgroundColor = 'white';
        container.innerHTML = `<img src="${url}" class="max-w-full max-h-full object-contain" />`;
        text.innerText = "Visualização da Imagem";
        modal.style.display = 'flex';
    },

    handleLibraryFileUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const userId = this.state.activeUser?.id || 'public';
            const fileName = `${userId}/${Date.now()}-${file.name}`;
            await dbService.uploadImagem(file, fileName);
            this.refreshLibraryManager();
            this.showNotification("Imagem enviada com sucesso!", "Sucesso");
        } catch (error) {
            console.error("Erro no upload:", error);
            this.showNotification("Erro ao enviar imagem: " + (error.message || "Erro desconhecido"));
        }
    },

    handleModalLibraryFileUpload: async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!this.state.activeUser) {
            this.showNotification("Você precisa estar logado para enviar imagens.");
            return;
        }

        const grid = document.getElementById('library-grid');
        const loadingEl = document.createElement('div');
        loadingEl.className = 'col-span-full flex items-center justify-center py-4 text-slate-400 gap-2';
        loadingEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span class="text-sm font-bold">Enviando imagem...</span>';
        grid.prepend(loadingEl);

        try {
            const userId = this.state.activeUser.id;
            const fileName = `${userId}/${Date.now()}-${file.name}`;
            await dbService.uploadImagem(file, fileName);
            // Reload the library grid inside the modal
            const imagens = await dbService.listarImagensUsuario(userId);
            this.renderLibrary(imagens);
            this.showNotification("Imagem enviada com sucesso! Clique nela para selecioná-la.", "Sucesso");
        } catch (error) {
            loadingEl.remove();
            console.error("Erro no upload:", error);
            this.showNotification("Erro ao enviar imagem: " + (error.message || "Erro desconhecido"));
        }
        // Reset the file input so the same file can be re-uploaded if needed
        event.target.value = '';
    },

    openImageLibrary: async function(targetType = 'card-content') {
        if (!this.state.activeUser) {
            this.showNotification("Você precisa estar logado para acessar sua biblioteca.");
            return;
        }

        this.state.libraryTarget = targetType; // 'card-content', 'front-design', 'back-design'

        const modal = document.getElementById('modal-library');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        const grid = document.getElementById('library-grid');
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p class="font-bold">Carregando suas imagens...</p>
            </div>
        `;

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            this.renderLibrary(imagens);
        } catch (error) {
            console.error("Erro ao carregar biblioteca:", error);
            grid.innerHTML = `<p class="col-span-full text-center">Erro ao carregar.</p>`;
        }
    },

    closeImageLibrary: function() {
        const modal = document.getElementById('modal-library');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    renderLibrary: function(imagens) {
        const grid = document.getElementById('library-grid');
        if (!grid) return;

        if (imagens.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <i class="fa-solid fa-image-slash text-3xl mb-4"></i>
                    <p class="font-bold">Sua biblioteca está vazia.</p>
                    <p class="text-xs">Envie imagens nas cartas para que elas apareçam aqui.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        imagens.forEach(img => {
            const item = document.createElement('div');
            item.className = "group relative aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all";
            item.onclick = () => this.selectImageFromLibrary(img.url);

            item.innerHTML = `
                <img src="${img.url}" class="w-full h-full object-contain" />
                <div class="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/20 flex items-center justify-center transition-all">
                    <i class="fa-solid fa-check text-white opacity-0 group-hover:opacity-100 text-2xl"></i>
                </div>
            `;
            grid.appendChild(item);
        });
    },

    selectImageFromLibrary: function(url) {
        const target = this.state.libraryTarget;

        if (target === 'card-content') {
            const preview = document.getElementById('modal-card-image-preview');
            const wrapper = document.getElementById('modal-card-image-preview-wrapper');
            if (preview) preview.src = url;
            if (wrapper) wrapper.classList.remove('hidden');
            const urlInput = document.getElementById('modal-card-image-url');
            if (urlInput) urlInput.value = '';
            this.state.tempContentImage = url;
        } else if (target === 'front-design') {
            const extFrontPreview = document.getElementById('external-front-preview');
            const extFrontWrapper = document.getElementById('external-front-preview-wrapper');
            if (extFrontPreview) extFrontPreview.src = url;
            if (extFrontWrapper) extFrontWrapper.classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.frontDesign = url;
            const previewFront = document.getElementById('preview-front');
            const reviewFront = document.getElementById('review-preview-front');
            if (previewFront) previewFront.src = url;
            if (reviewFront) reviewFront.src = url;
        } else if (target === 'back-design') {
            const extBackPreview = document.getElementById('external-back-preview');
            const extBackWrapper = document.getElementById('external-back-preview-wrapper');
            if (extBackPreview) extBackPreview.src = url;
            if (extBackWrapper) extBackWrapper.classList.remove('hidden');
            if (this.state.editingGame) this.state.editingGame.backDesign = url;
            const previewBack = document.getElementById('preview-back');
            const reviewBack = document.getElementById('review-preview-back');
            if (previewBack) previewBack.src = url;
            if (reviewBack) reviewBack.src = url;
        }

        this.closeImageLibrary();
    }
};
