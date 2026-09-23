// js/core/utils.js
export const utilsMethods = {
    autoResizeTextarea: function(elem) {
        if (!elem) return;
        elem.style.height = 'inherit';
        elem.style.height = `${elem.scrollHeight}px`;
    },

    toggleSymbolPicker: function() {
        const panel = document.getElementById('symbol-picker-panel');
        const caret = document.getElementById('symbol-picker-caret');
        if (!panel) return;
        panel.classList.toggle('hidden');
        if (caret) caret.classList.toggle('open', !panel.classList.contains('hidden'));
    },

    insertSpecialChar: function(char) {
        const el = document.getElementById('modal-card-content');
        if (!el) return;

        const selection = window.getSelection();
        let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        // Se o cursor não está dentro do campo (campo perdeu foco, ou nunca foi
        // clicado), cai para o fim do conteúdo — mesmo comportamento esperado de
        // "inserir no cursor" quando não há cursor visível.
        if (!range || !el.contains(range.commonAncestorContainer)) {
            el.focus();
            range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
        }

        range.deleteContents();
        const textNode = document.createTextNode(char);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        el.focus();
    },

    // Usada só para texto que é (e sempre foi) genuinamente plain-text, como
    // nomes de jogadores no ranking (dashboard.js). NÃO usar para renderizar
    // card.content — desde que #modal-card-content virou contenteditable,
    // card.content pode conter HTML de formatação (negrito/itálico/vermelho)
    // que deve ser renderizado como HTML confiável, não escapado. Ver stripHtml.
    escapeCardText: function(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    // Extrai só o texto visível de uma string HTML (usada em atributos alt e em
    // innerText, onde tags não fazem sentido).
    stripHtml: function(html) {
        if (html === null || html === undefined) return '';
        const div = document.createElement('div');
        div.innerHTML = String(html);
        return (div.textContent || div.innerText || '').trim();
    },

    shuffleArray: function(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    wrapSelectionInRed: function(elementId) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const selection = window.getSelection();
        if (selection.toString().length === 0) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('strong');
        span.style.color = '#b91c1c';
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
        // Manipulação via Range API não dispara evento 'input' de forma
        // confiável em todos os navegadores — diferente de digitação direta
        // no contenteditable (coberta pelo oninput do próprio elemento no
        // HTML) — por isso o auto-save é agendado explicitamente aqui.
        if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
    },

    // Alterna uma tag de formatação simples (negrito/itálico/sublinhado) na seleção:
    // se a seleção já está dentro dessa tag, remove-a; caso contrário, envolve o
    // texto selecionado com ela. Usa tags diferentes de <strong style="color:...">
    // (usada pelo destaque em vermelho acima) para as duas marcações não colidirem.
    toggleInlineFormat: function(elementId, tagName) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const selection = window.getSelection();
        if (selection.toString().length === 0) return;

        let node = selection.anchorNode;
        while (node && node !== el) {
            if (node.nodeName === tagName) {
                const parent = node.parentNode;
                while (node.firstChild) parent.insertBefore(node.firstChild, node);
                parent.removeChild(node);
                if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
                return;
            }
            node = node.parentNode;
        }

        const range = selection.getRangeAt(0);
        const wrapper = document.createElement(tagName);
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        selection.removeAllRanges();
        // Ver comentário em wrapSelectionInRed sobre Range API + evento 'input'.
        if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
    },

    toggleBold: function(elementId) { this.toggleInlineFormat(elementId, 'B'); },
    toggleItalic: function(elementId) { this.toggleInlineFormat(elementId, 'EM'); },
    toggleUnderline: function(elementId) { this.toggleInlineFormat(elementId, 'U'); },

    switchSymTab: function(tabId) {
        const panels = document.querySelectorAll('[id^="sym-panel-"]');
        if (tabId === 'todos') {
            panels.forEach(p => p.classList.remove('hidden'));
        } else {
            panels.forEach(p => p.classList.add('hidden'));
            const active = document.getElementById('sym-panel-' + tabId);
            if (active) active.classList.remove('hidden');
        }

        const tabs = document.querySelectorAll('[id^="sym-tab-"]');
        tabs.forEach(t => {
            t.className = 'px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition';
        });
        const activeTab = document.getElementById('sym-tab-' + tabId);
        if (activeTab) {
            activeTab.className = 'px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg bg-emerald-600 text-white transition';
        }
    },

    removeRedFromSelection: function(elementId) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const selection = window.getSelection();
        if (selection.toString().length === 0) return;

        const range = selection.getRangeAt(0);
        let node = selection.anchorNode;
        while (node && node !== el) {
            if (node.nodeName === 'STRONG' && node.style.color === 'rgb(185, 28, 28)') {
                const parent = node.parentNode;
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
                if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
                return;
            }
            node = node.parentNode;
        }
    }
};
