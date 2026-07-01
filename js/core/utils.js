// js/core/utils.js
export const utilsMethods = {
    autoResizeTextarea: function(elem) {
        if (!elem) return;
        elem.style.height = 'inherit';
        elem.style.height = `${elem.scrollHeight}px`;
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

    switchSymTab: function(tabId) {
        const panels = document.querySelectorAll('[id^="sym-panel-"]');
        panels.forEach(p => p.classList.add('hidden'));
        const active = document.getElementById('sym-panel-' + tabId);
        if (active) active.classList.remove('hidden');

        const tabs = document.querySelectorAll('[id^="sym-tab-"]');
        tabs.forEach(t => {
            t.className = 'px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition';
        });
        const activeTab = document.getElementById('sym-tab-' + tabId);
        if (activeTab) {
            activeTab.className = 'px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-600 text-white transition';
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
