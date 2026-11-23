// js/core/utils.js
// Clicar num botão da barra de formatação não pode tirar o foco/seleção do
// campo de texto, senão o navegador perde o trecho selecionado antes do clique.
if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', (e) => {
        if (e.target && e.target.closest && e.target.closest('.richtext-btn')) e.preventDefault();
    });
}

// Devolve { sel, range } se há texto selecionado DENTRO do campo `el`.
function selectionInside(el) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return null;
    return { sel, range };
}

function selectNodeContents(sel, node) {
    const r = document.createRange();
    r.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(r);
}


// --- Cor do texto (barra de formatação) ---
// O botão "A" pinta o trecho selecionado com a cor atual; a setinha ao lado
// abre uma paleta (e um seletor livre "Outra cor") para trocar essa cor. A
// cor escolhida fica lembrada neste navegador e aparece no sublinhado do "A".
const TEXT_COLORS = [
    '#b91c1c', '#ea580c', '#ca8a04', '#15803d', '#0d9488',
    '#1d4ed8', '#7c3aed', '#db2777', '#0f172a', '#64748b'
];
const TEXT_COLOR_KEY = 'made.textColor';
let currentTextColor = '#b91c1c';
try { currentTextColor = localStorage.getItem(TEXT_COLOR_KEY) || currentTextColor; } catch (e) {}
let colorPickerTarget = null;
let colorPickerRange = null;

function paintColorIndicators() {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--rt-color', currentTextColor);
}
if (typeof document !== 'undefined') paintColorIndicators();

function setCurrentTextColor(color) {
    currentTextColor = color;
    try { localStorage.setItem(TEXT_COLOR_KEY, color); } catch (e) {}
    paintColorIndicators();
}

function isColoredStrong(node) {
    return !!node && node.nodeName === 'STRONG' && !!(node.style && node.style.color);
}

function unwrapNode(node) {
    const parent = node.parentNode;
    if (!parent) return;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
}

function closeTextColorPicker() {
    const pop = document.getElementById('richtext-color-pop');
    if (pop) pop.classList.add('hidden');
    colorPickerTarget = null;
}

function restoreColorPickerRange() {
    if (!colorPickerRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(colorPickerRange);
}

function ensureTextColorPicker(app) {
    let pop = document.getElementById('richtext-color-pop');
    if (pop) return pop;
    pop = document.createElement('div');
    pop.id = 'richtext-color-pop';
    pop.className = 'richtext-color-pop hidden';
    pop.innerHTML = `
        <p class="richtext-color-pop-title">Cor da letra</p>
        <p class="richtext-color-pop-hint">Selecione um trecho do texto e clique numa cor para pintar as letras.</p>
        <div class="richtext-color-grid">
            ${TEXT_COLORS.map(c => `<button type="button" class="richtext-color-swatch" data-color="${c}" style="background:${c}" title="Pintar as letras com esta cor"></button>`).join('')}
        </div>
        <label class="richtext-color-custom" title="Escolher qualquer outra cor para as letras">
            <input type="color" value="${currentTextColor}">
            <span>Outra cor da letra...</span>
        </label>`;
    document.body.appendChild(pop);

    pop.addEventListener('mousedown', (e) => {
        // Mantém a seleção no campo de texto (menos no seletor livre, que
        // precisa do clique para abrir a janela de cores do navegador).
        if (e.target.closest('.richtext-color-swatch')) e.preventDefault();
    });
    const applyAndClose = (color) => {
        const target = colorPickerTarget;
        const hadSelection = !!colorPickerRange;
        setCurrentTextColor(color);
        const el = target && document.getElementById(target);
        if (el) el.focus();
        restoreColorPickerRange();
        closeTextColorPicker();
        // Sem trecho selecionado, só troca a cor do botão "A" (vale para o próximo uso).
        if (target && hadSelection) app.applyTextColor(target);
    };
    pop.querySelectorAll('.richtext-color-swatch').forEach(btn => {
        btn.addEventListener('click', () => applyAndClose(btn.dataset.color));
    });
    const input = pop.querySelector('input[type="color"]');
    input.addEventListener('change', () => applyAndClose(input.value));
    document.addEventListener('mousedown', (e) => {
        if (pop.classList.contains('hidden')) return;
        if (e.target.closest('#richtext-color-pop') || e.target.closest('.richtext-color-caret')) return;
        closeTextColorPicker();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTextColorPicker(); });
    window.addEventListener('resize', closeTextColorPicker);
    return pop;
}

// Menu lateral em gaveta no celular (ver css/responsive.css): qualquer
// botão do menu fecha a gaveta depois do clique.
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('nav-open')) return;
        if (e.target.closest && e.target.closest('#app-sidebar button')) document.body.classList.remove('nav-open');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') document.body.classList.remove('nav-open');
    });
}

export const utilsMethods = {
    toggleMobileNav: function(force) {
        const open = typeof force === 'boolean' ? force : !document.body.classList.contains('nav-open');
        document.body.classList.toggle('nav-open', open);
    },


    // Textos ricos (regra, objetivo, enunciado, explicação) são HTML; textos
    // antigos eram texto puro com "\n" — converte para exibir com quebras.
    richTextHtml: function(text) {
        const t = text || '';
        return t.includes('<') ? t : t.replace(/\n/g, '<br>');
    },

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

    // Pinta o trecho selecionado com a cor atual (ou `color`, se vier). Se o
    // trecho já é exatamente um destaque colorido, só troca a cor dele.
    applyTextColor: function(elementId, color) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const inside = selectionInside(el);
        if (!inside) {
            if (typeof this.showNotification === 'function') this.showNotification('Selecione primeiro o trecho do texto que você quer colorir.');
            return;
        }
        const { sel: selection, range } = inside;
        const useColor = color || currentTextColor;

        let node = range.commonAncestorContainer;
        while (node && node !== el) {
            if (isColoredStrong(node) && node.textContent === range.toString()) {
                node.style.color = useColor;
                if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
                return;
            }
            node = node.parentNode;
        }

        const span = document.createElement('strong');
        span.style.color = useColor;
        span.appendChild(range.extractContents());
        // Destaques antigos dentro do trecho passam a ter a cor nova.
        span.querySelectorAll('strong').forEach(n => { if (isColoredStrong(n)) unwrapNode(n); });
        range.insertNode(span);
        selectNodeContents(selection, span);
        // Manipulação via Range API não dispara evento 'input' de forma
        // confiável em todos os navegadores — diferente de digitação direta
        // no contenteditable (coberta pelo oninput do próprio elemento no
        // HTML) — por isso o auto-save é agendado explicitamente aqui.
        if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
    },

    // Nome antigo, mantido para chamadas existentes.
    wrapSelectionInRed: function(elementId) { this.applyTextColor(elementId); },

    openTextColorPicker: function(elementId, btn) {
        const pop = ensureTextColorPicker(this);
        if (!pop.classList.contains('hidden') && colorPickerTarget === elementId) {
            closeTextColorPicker();
            return;
        }
        const el = document.getElementById(elementId);
        const inside = el ? selectionInside(el) : null;
        colorPickerRange = inside ? inside.range.cloneRange() : null;
        colorPickerTarget = elementId;
        pop.querySelector('input[type="color"]').value = currentTextColor;
        pop.querySelectorAll('.richtext-color-swatch').forEach(b => b.classList.toggle('active', b.dataset.color === currentTextColor));
        pop.classList.remove('hidden');
        const r = btn.getBoundingClientRect();
        const w = pop.offsetWidth;
        pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
        pop.style.top = (r.bottom + 6) + 'px';
    },

    // Alterna uma tag de formatação simples (negrito/itálico/sublinhado) na seleção:
    // se a seleção já está dentro dessa tag, remove-a; caso contrário, envolve o
    // texto selecionado com ela. Usa tags diferentes de <strong style="color:...">
    // (usada pelo destaque em vermelho acima) para as duas marcações não colidirem.
    toggleInlineFormat: function(elementId, tagName) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const inside = selectionInside(el);
        if (!inside) return;
        const { sel: selection, range } = inside;

        let node = range.commonAncestorContainer;
        while (node && node !== el) {
            if (node.nodeName === tagName) {
                const parent = node.parentNode;
                const first = node.firstChild;
                const last = node.lastChild;
                while (node.firstChild) parent.insertBefore(node.firstChild, node);
                parent.removeChild(node);
                if (first && last) {
                    const r = document.createRange();
                    r.setStartBefore(first);
                    r.setEndAfter(last);
                    selection.removeAllRanges();
                    selection.addRange(r);
                }
                if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
                return;
            }
            node = node.parentNode;
        }

        const wrapper = document.createElement(tagName);
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        selectNodeContents(selection, wrapper);
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

    // Tira a cor (qualquer cor) do trecho selecionado.
    removeRedFromSelection: function(elementId) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const inside = selectionInside(el);
        if (!inside) return;
        const { range } = inside;
        const targets = new Set();
        let node = range.commonAncestorContainer;
        while (node && node !== el) {
            if (isColoredStrong(node)) targets.add(node);
            node = node.parentNode;
        }
        el.querySelectorAll('strong').forEach(n => {
            if (isColoredStrong(n) && range.intersectsNode(n)) targets.add(n);
        });
        if (!targets.size) return;
        targets.forEach(unwrapNode);
        if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
    }
};
