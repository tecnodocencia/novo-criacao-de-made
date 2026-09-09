// js/core/library.js
import { dbService } from '../database.js';
import { imageBankFolders } from './imageBank.js';

function findBankFolder(key) {
    return imageBankFolders.find(f => f.key === key) || null;
}

function bankFolderTileEl(folder, onClick) {
    const el = document.createElement('div');
    el.className = "group relative aspect-square bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border-2 border-emerald-100 overflow-hidden cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 text-center p-2";
    el.innerHTML = `
        <i class="fa-solid ${folder.icon} text-3xl text-emerald-500"></i>
        <span class="font-black text-sm text-emerald-700 leading-tight">${folder.label}</span>
        <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">${folder.images.length} imagens</span>
    `;
    el.onclick = onClick;
    return el;
}

function bankSectionHeaderEl() {
    const el = document.createElement('div');
    el.className = "col-span-full mb-1";
    el.innerHTML = `<h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Banco de Imagens</h3>`;
    return el;
}

function ownSectionHeaderEl(label) {
    const el = document.createElement('div');
    el.className = "col-span-full mt-2 mb-1";
    el.innerHTML = `<h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">${label}</h3>`;
    return el;
}

function folderBackHeaderEl(folder, onBack) {
    const el = document.createElement('div');
    el.className = "col-span-full flex items-center gap-3 mb-1";
    el.innerHTML = `
        <button class="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition shrink-0">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <i class="fa-solid ${folder.icon} text-emerald-500"></i>
        <h3 class="font-black text-slate-700">${folder.label}</h3>
        <span class="text-xs text-slate-400 font-bold">${folder.images.length} imagens</span>
    `;
    el.querySelector('button').onclick = onBack;
    return el;
}

// Monta as ladrilhos das pastas do Banco de Imagens (sempre disponíveis,
// pois são arquivos estáticos do site — não dependem do Supabase).
function appendBankFolderTiles(grid, onFolderClick) {
    grid.appendChild(bankSectionHeaderEl());
    imageBankFolders.forEach(folder => {
        grid.appendChild(bankFolderTileEl(folder, () => onFolderClick(folder.key)));
    });
}

// Renderiza dentro do container o conteúdo de uma pasta do banco (imagens
// clicáveis conforme onImageClick) com um cabeçalho "voltar".
function renderBankFolderInto(grid, folder, onBack, onImageClick, imageItemClass) {
    grid.innerHTML = '';
    grid.appendChild(folderBackHeaderEl(folder, onBack));
    folder.images.forEach(img => {
        const item = document.createElement('div');
        item.className = imageItemClass;
        item.innerHTML = `
            <img src="${img.url}" class="w-full h-full object-contain p-4" loading="lazy" />
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <i class="fa-solid fa-magnifying-glass text-white"></i>
            </div>
        `;
        item.onclick = () => onImageClick(img.url);
        grid.appendChild(item);
    });
}

// Estados possíveis para a seção "Minhas Imagens": undefined = carregando,
// [] = vazia, array populado = lista de imagens do usuário, Error = falha.
function renderOwnImagesStatus(container, imagensOrError, onImageClick) {
    if (imagensOrError === undefined) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-8 text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                <p class="font-bold text-sm">Carregando suas imagens...</p>
            </div>
        `;
        return;
    }

    if (imagensOrError instanceof Error) {
        container.innerHTML = `<p class="col-span-full text-center text-red-500 text-sm py-6">Erro ao carregar suas imagens.</p>`;
        return;
    }

    if (imagensOrError.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-slate-400">
                <i class="fa-solid fa-image-slash text-2xl mb-2"></i>
                <p class="font-bold text-sm">Sua biblioteca está vazia.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    imagensOrError.forEach(img => {
        const item = document.createElement('div');
        item.className = "group relative aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer";
        item.innerHTML = `
            <img src="${img.url}" class="w-full h-full object-contain p-4" />
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <i class="fa-solid fa-magnifying-glass text-white"></i>
            </div>
        `;
        item.onclick = () => onImageClick(img.url);
        container.appendChild(item);
    });
}

export const libraryMethods = {
    refreshLibraryManager: async function() {
        if (!this.state.activeUser) return;
        const grid = document.getElementById('manager-library-grid');

        const folder = findBankFolder(this.state.libraryManagerFolder);
        if (folder) {
            renderBankFolderInto(
                grid,
                folder,
                () => this.closeLibraryManagerFolder(),
                (url) => this.previewImageDirect(url),
                "group relative aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
            );
            return;
        }

        grid.innerHTML = '';
        appendBankFolderTiles(grid, (key) => this.openLibraryManagerFolder(key));
        grid.appendChild(ownSectionHeaderEl('Minhas Imagens'));

        const ownContainer = document.createElement('div');
        ownContainer.className = "col-span-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6";
        grid.appendChild(ownContainer);
        renderOwnImagesStatus(ownContainer, undefined, (url) => this.previewImageDirect(url));

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            // Se o professor já navegou para outra pasta enquanto isso carregava, não sobrescreve a tela atual.
            if (this.state.libraryManagerFolder || !document.body.contains(ownContainer)) return;
            renderOwnImagesStatus(ownContainer, imagens, (url) => this.previewImageDirect(url));
        } catch (error) {
            console.error("Erro ao carregar biblioteca:", error);
            if (this.state.libraryManagerFolder || !document.body.contains(ownContainer)) return;
            renderOwnImagesStatus(ownContainer, error, (url) => this.previewImageDirect(url));
        }
    },

    openLibraryManagerFolder: function(key) {
        this.state.libraryManagerFolder = key;
        this.refreshLibraryManager();
    },

    closeLibraryManagerFolder: function() {
        this.state.libraryManagerFolder = null;
        this.refreshLibraryManager();
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
            this.state.libraryModalFolder = null;
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
        this.state.libraryModalFolder = null;

        const modal = document.getElementById('modal-library');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        this.renderLibrary(undefined);

        try {
            const imagens = await dbService.listarImagensUsuario(this.state.activeUser.id);
            this.renderLibrary(imagens);
        } catch (error) {
            console.error("Erro ao carregar biblioteca:", error);
            this.renderLibrary(error);
        }
    },

    closeImageLibrary: function() {
        const modal = document.getElementById('modal-library');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        this.state.libraryModalFolder = null;
    },

    openLibraryModalFolder: function(key) {
        this.state.libraryModalFolder = key;
        this.renderLibrary(this.state.libraryModalImagens);
    },

    closeLibraryModalFolder: function() {
        this.state.libraryModalFolder = null;
        this.renderLibrary(this.state.libraryModalImagens);
    },

    // imagens: undefined (carregando) | Error (falha) | array (lista, possivelmente vazia)
    renderLibrary: function(imagens) {
        const grid = document.getElementById('library-grid');
        if (!grid) return;

        if (!(imagens instanceof Error)) {
            this.state.libraryModalImagens = imagens;
        }

        const folder = findBankFolder(this.state.libraryModalFolder);
        if (folder) {
            renderBankFolderInto(
                grid,
                folder,
                () => this.closeLibraryModalFolder(),
                (url) => this.selectImageFromLibrary(url),
                "group relative aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all"
            );
            return;
        }

        grid.innerHTML = '';
        appendBankFolderTiles(grid, (key) => this.openLibraryModalFolder(key));
        grid.appendChild(ownSectionHeaderEl('Minhas Imagens'));

        const ownContainer = document.createElement('div');
        ownContainer.className = "col-span-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4";
        grid.appendChild(ownContainer);

        if (imagens === undefined) {
            ownContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-8 text-slate-400">
                    <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                    <p class="font-bold text-sm">Carregando suas imagens...</p>
                </div>
            `;
            return;
        }

        if (imagens instanceof Error) {
            ownContainer.innerHTML = `<p class="col-span-full text-center text-red-500 text-sm py-6">Erro ao carregar suas imagens.</p>`;
            return;
        }

        if (imagens.length === 0) {
            ownContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-slate-400">
                    <i class="fa-solid fa-image-slash text-2xl mb-2"></i>
                    <p class="font-bold text-sm">Sua biblioteca está vazia.</p>
                    <p class="text-xs">Envie imagens nas cartas para que elas apareçam aqui.</p>
                </div>
            `;
            return;
        }

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
            ownContainer.appendChild(item);
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
