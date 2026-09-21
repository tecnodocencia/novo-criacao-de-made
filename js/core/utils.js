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
        const textarea = document.getElementById('modal-card-content');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        textarea.value = text.substring(0, start) + char + text.substring(end);

        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + char.length;
    },

    escapeCardText: function(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
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
                return;
            }
            node = node.parentNode;
        }

        const range = selection.getRangeAt(0);
        const wrapper = document.createElement(tagName);
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        selection.removeAllRanges();
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
            t.className = 'px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition';
        });
        const activeTab = document.getElementById('sym-tab-' + tabId);
        if (activeTab) {
            activeTab.className = 'px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-600 text-white transition';
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
                return;
            }
            node = node.parentNode;
        }
    }
};
