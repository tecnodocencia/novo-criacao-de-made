// js/play.js — Página pública de jogo (sem autenticação obrigatória)
import { supabase } from './supabase.js';
import { difficultyRules } from './games/codigo-secreto/model.js';

// ─── Estado global do jogo ───────────────────────────────────────────────────
const gs = {
    game: null,          // Dados do jogo (do Supabase, já remapeados)
    shareCode: '',
    playerName: '',
    secretCode: [],      // Array de cards que formam o código secreto
    currentGuess: [],    // Array de cards ou null por posição
    currentDifficulty: 1,
    currentCodeSize: 4,
    attempts: [],        // [{ guess, black, white }]
    gameOver: null,      // 'win' | 'loss' | null
    selectedCard: null,  // { card, bankEl } — card selecionado para colocar
    currentResult: null  // { score, attemptsUsed, won } após o fim do jogo
};

// ─── Utilitários ─────────────────────────────────────────────────────────────
function escapeHtml(text) {
    if (text == null) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Gerenciamento de telas ───────────────────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.play-screen').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const target = document.getElementById('screen-' + id);
    if (!target) return;
    target.classList.add('active');
    target.style.display = id === 'game' ? 'flex' : '';
}

// ─── Notificação / Confirm / Preview ────────────────────────────────────────
function showNotification(message, title = '') {
    document.getElementById('notif-play-title').innerText = title;
    document.getElementById('notif-play-message').innerText = message;
    document.getElementById('modal-notification-play').style.display = 'flex';
}

let confirmCallback = null;
function showConfirm(message, onConfirm) {
    document.getElementById('confirm-play-message').innerText = message;
    document.getElementById('modal-confirm-play').style.display = 'flex';
    confirmCallback = onConfirm;
}

function previewCard(card) {
    const container = document.getElementById('preview-play-card-container');
    if (card.contentImage) {
        container.innerHTML = `<img src="${card.contentImage}" alt="${escapeHtml(card.content)}"
            style="max-height:280px; max-width:100%; object-fit:contain; border-radius:12px;">`;
    } else {
        container.innerHTML = `<p class="text-2xl font-black text-slate-800 text-center">${escapeHtml(card.content)}</p>`;
    }
    document.getElementById('preview-play-card-text').innerText = card.content || '';
    document.getElementById('modal-preview-play').style.display = 'flex';
}

// ─── Seleção de dificuldade ───────────────────────────────────────────────────
function selectCodeSize(size) {
    gs.currentCodeSize = size;
    document.querySelectorAll('.play-size-btn').forEach(btn => {
        const active = parseInt(btn.dataset.size) === size;
        btn.className = 'play-size-btn' + (active ? ' active' : '');
    });
}

function selectDifficultyLevel(level) {
    gs.currentDifficulty = level;
    document.querySelectorAll('.play-level-btn').forEach(btn => {
        const active = parseInt(btn.dataset.level) === level;
        btn.className = 'play-level-btn' + (active ? ' active' : '');
    });
}

// ─── Criação do código secreto ────────────────────────────────────────────────
function createSecretCode() {
    const pool = gs.game.cards.filter(c => c.isCorrect);
    const codeSize = gs.currentCodeSize;
    const rules = difficultyRules[gs.currentDifficulty];

    if (pool.length < codeSize) {
        gs.currentCodeSize = pool.length;
        showNotification(
            `Este jogo tem ${pool.length} cartas corretas. Tamanho do código ajustado para ${pool.length}.`,
            'Aviso'
        );
    }

    const shuffled = shuffleArray(pool);
    if (rules.repeat) {
        return Array.from({ length: gs.currentCodeSize }, (_, i) => shuffled[i % shuffled.length]);
    }
    return shuffled.slice(0, gs.currentCodeSize);
}

// ─── Início do jogo ───────────────────────────────────────────────────────────
function startGame() {
    gs.secretCode = createSecretCode();
    gs.currentGuess = Array(gs.currentCodeSize).fill(null);
    gs.attempts = [];
    gs.gameOver = null;
    gs.selectedCard = null;

    showScreen('game');

    renderGameHeader();
    renderEnunciado();
    renderSecretSlots();
    renderDropSlots();
    renderBankCards();
    updateAttemptCounter();
    updateLevelInfo();
    document.getElementById('play-history-list').innerHTML = '';
}

// ─── Renderização do header ───────────────────────────────────────────────────
function renderGameHeader() {
    const info = gs.game.disciplineInfo || {};
    document.getElementById('play-header-title').innerText = gs.game.name || '-';
    document.getElementById('play-header-disciplina').innerText = info.disciplina || '-';
    document.getElementById('play-header-conteudo').innerText = info.conteudo || '-';
    document.getElementById('play-header-serie').innerText = info.serie || '-';
    document.getElementById('play-header-player').innerText = gs.playerName;
}

function renderEnunciado() {
    const el = document.getElementById('play-enunciado-content');
    if (el) el.innerHTML = gs.game.enunciado || '';
}

// ─── Slots secretos ───────────────────────────────────────────────────────────
function renderSecretSlots() {
    const container = document.getElementById('play-secret-slots');
    container.innerHTML = '';
    for (let i = 0; i < gs.currentCodeSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'secret-card-slot';
        slot.id = `secret-slot-play-${i}`;
        if (gs.game.backDesign) {
            slot.style.backgroundImage = `url('${gs.game.backDesign}')`;
            slot.style.backgroundSize = 'cover';
            slot.style.backgroundPosition = 'center';
        }
        container.appendChild(slot);
    }
}

// ─── Slots de tentativa (drop slots) ─────────────────────────────────────────
function renderDropSlots() {
    const container = document.getElementById('play-drop-slots');
    container.innerHTML = '';
    for (let i = 0; i < gs.currentCodeSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'drop-slot';
        slot.dataset.slot = String(i);
        slot.innerHTML = `<span class="text-slate-400 text-xs font-black">${i + 1}</span>`;
        slot.addEventListener('click', () => handleDropSlotClick(i));
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('card-id');
            if (cardId) placeCardInSlot(cardId, i);
        });
        container.appendChild(slot);
    }
}

// ─── Banco de cartas ──────────────────────────────────────────────────────────
function renderBankCards() {
    const bank = document.getElementById('play-item-bank');
    bank.innerHTML = '';

    const cards = shuffleArray(gs.game.cards);
    cards.forEach(card => {
        const bankCard = document.createElement('div');
        bankCard.className = 'bank-card';
        bankCard.dataset.cardId = String(card.id);
        bankCard.draggable = true;

        let innerContent;
        if (card.contentImage) {
            innerContent = `<img src="${card.contentImage}" alt="${escapeHtml(card.content)}"
                style="max-height:82px; max-width:100%; object-fit:contain; border-radius:8px; pointer-events:none;">`;
        } else {
            innerContent = `<p class="text-[10px] font-black text-slate-800 text-center leading-tight">${escapeHtml(card.content)}</p>`;
        }

        const cardIdStr = escapeHtml(String(card.id));
        bankCard.innerHTML = `
            <div class="bank-card-inner" data-card-inner-id="${cardIdStr}">
                ${innerContent}
                <button class="zoom-icon" title="Ampliar">
                    <i class="fa-solid fa-magnifying-glass-plus" style="font-size:9px;"></i>
                </button>
            </div>
        `;

        const inner = bankCard.querySelector('.bank-card-inner');
        const zoomBtn = bankCard.querySelector('.zoom-icon');

        inner.addEventListener('click', (e) => {
            if (e.target === zoomBtn || zoomBtn.contains(e.target)) return;
            selectBankCard(String(card.id));
        });
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewCard(card);
        });

        bankCard.addEventListener('dragstart', e => {
            e.dataTransfer.setData('card-id', String(card.id));
            gs.selectedCard = { card, bankEl: bankCard };
        });

        bank.appendChild(bankCard);
    });
}

// ─── Seleção e posicionamento de carta ───────────────────────────────────────
function getBankEl(cardId) {
    return document.querySelector(`.bank-card[data-card-id="${String(cardId)}"]`);
}

function selectBankCard(cardIdStr) {
    const card = gs.game.cards.find(c => String(c.id) === cardIdStr);
    if (!card) return;

    const bankEl = getBankEl(cardIdStr);
    if (!bankEl) return;
    const inner = bankEl.querySelector('.bank-card-inner');

    // Deselect se clicar na mesma carta
    if (gs.selectedCard && String(gs.selectedCard.card.id) === cardIdStr) {
        inner.classList.remove('card-selected');
        gs.selectedCard = null;
        return;
    }

    // Deselect anterior
    document.querySelectorAll('.bank-card-inner').forEach(e => e.classList.remove('card-selected'));

    inner.classList.add('card-selected');
    gs.selectedCard = { card, bankEl };

    // Coloca automaticamente no primeiro slot vazio
    const firstEmpty = gs.currentGuess.findIndex(c => c === null);
    if (firstEmpty !== -1) {
        handleDropSlotClick(firstEmpty);
    }
}

function placeCardInSlot(cardIdStr, slotIndex) {
    const card = gs.game.cards.find(c => String(c.id) === String(cardIdStr));
    if (!card) return;
    const bankEl = getBankEl(cardIdStr);
    if (!bankEl) return;

    // Se slot já ocupado, devolve carta anterior ao banco
    if (gs.currentGuess[slotIndex]) {
        const prevId = String(gs.currentGuess[slotIndex].id);
        const prevBankEl = getBankEl(prevId);
        if (prevBankEl) prevBankEl.style.visibility = 'visible';
    }

    gs.currentGuess[slotIndex] = card;
    bankEl.style.visibility = 'hidden';

    // Deseleciona
    document.querySelectorAll('.bank-card-inner').forEach(e => e.classList.remove('card-selected'));
    gs.selectedCard = null;

    renderDropSlotContent(slotIndex);
}

function handleDropSlotClick(slotIndex) {
    if (gs.selectedCard) {
        placeCardInSlot(String(gs.selectedCard.card.id), slotIndex);
    } else if (gs.currentGuess[slotIndex]) {
        // Devolve carta ao banco
        const card = gs.currentGuess[slotIndex];
        gs.currentGuess[slotIndex] = null;
        const bankEl = getBankEl(String(card.id));
        if (bankEl) bankEl.style.visibility = 'visible';
        renderDropSlotContent(slotIndex);
    }
}

function removeFromSlot(slotIndex) {
    if (!gs.currentGuess[slotIndex]) return;
    const card = gs.currentGuess[slotIndex];
    gs.currentGuess[slotIndex] = null;
    const bankEl = getBankEl(String(card.id));
    if (bankEl) bankEl.style.visibility = 'visible';
    renderDropSlotContent(slotIndex);
}

function renderDropSlotContent(slotIndex) {
    const slot = document.querySelector(`.drop-slot[data-slot="${slotIndex}"]`);
    if (!slot) return;
    const card = gs.currentGuess[slotIndex];

    if (card) {
        let content;
        if (card.contentImage) {
            content = `<img src="${card.contentImage}" alt="${escapeHtml(card.content)}"
                style="max-height:120px; max-width:90%; object-fit:contain; border-radius:12px; pointer-events:none;">`;
        } else {
            content = `<p class="text-[10px] font-black text-slate-800 text-center leading-tight px-1">${escapeHtml(card.content)}</p>`;
        }
        slot.classList.add('filled');
        slot.innerHTML = `
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:8px;position:relative;">
                ${content}
                <button onclick="playApp.removeFromSlot(${slotIndex})"
                    style="position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;background:rgba(239,68,68,0.85);color:white;border:none;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:900;line-height:1;">
                    ✕
                </button>
            </div>
        `;
    } else {
        slot.classList.remove('filled');
        slot.innerHTML = `<span class="text-slate-400 text-xs font-black">${slotIndex + 1}</span>`;
    }

    // Reanexa handlers de drop após alterar innerHTML
    slot.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        handleDropSlotClick(slotIndex);
    };
    slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const cardId = e.dataTransfer.getData('card-id');
        if (cardId) placeCardInSlot(cardId, slotIndex);
    });
}

// ─── Counters e Info ──────────────────────────────────────────────────────────
function updateAttemptCounter() {
    const rules = difficultyRules[gs.currentDifficulty];
    const used = gs.attempts.length;
    document.getElementById('current-attempt-play').innerText = String(used + 1);
    document.getElementById('total-attempts-play').innerText = String(rules.attempts - used);
}

function updateLevelInfo() {
    const level = gs.currentDifficulty;
    const rules = difficultyRules[level];
    const names = { 1: 'Iniciante', 2: 'Intermediario', 3: 'Avancado', 4: 'Especialista' };
    document.getElementById('level-info-nivel-play').innerText = `${level} - ${names[level] || ''}`;
    document.getElementById('level-info-cartas-play').innerText = String(gs.currentCodeSize);
    document.getElementById('level-info-repeticao-play').innerText = rules.repeat ? 'Sim' : 'Nao';
    document.getElementById('level-info-troca-play').innerText = rules.swap > 0 ? `${rules.swap} pos.` : 'Nao';
}

// ─── Validação ────────────────────────────────────────────────────────────────
function validateGuess() {
    if (gs.gameOver) return;

    const codeSize = gs.currentCodeSize;
    if (gs.currentGuess.some(c => c === null)) {
        showNotification(`Preencha todos os ${codeSize} espacos antes de validar!`, 'Aviso');
        return;
    }

    const secret = gs.secretCode;
    const guess = gs.currentGuess;
    let black = 0;
    const secretCounts = {};
    const guessCounts = {};

    for (let i = 0; i < codeSize; i++) {
        if (String(secret[i].id) === String(guess[i].id)) {
            black++;
        } else {
            const sId = String(secret[i].id);
            const gId = String(guess[i].id);
            secretCounts[sId] = (secretCounts[sId] || 0) + 1;
            guessCounts[gId] = (guessCounts[gId] || 0) + 1;
        }
    }

    let white = 0;
    for (const id in guessCounts) {
        if (secretCounts[id]) white += Math.min(guessCounts[id], secretCounts[id]);
    }

    gs.attempts.push({ guess: [...guess], black, white });
    addHistoryRow([...guess], black, white);

    // Devolve cartas ao banco e limpa slots
    for (let i = 0; i < codeSize; i++) {
        if (gs.currentGuess[i]) {
            const bankEl = getBankEl(String(gs.currentGuess[i].id));
            if (bankEl) bankEl.style.visibility = 'visible';
        }
    }
    gs.currentGuess = Array(codeSize).fill(null);
    renderDropSlots();

    const rules = difficultyRules[gs.currentDifficulty];

    if (black === codeSize) {
        gs.gameOver = 'win';
        setTimeout(() => openSolutionModal('win'), 600);
    } else if (gs.attempts.length >= rules.attempts) {
        gs.gameOver = 'loss';
        setTimeout(() => openSolutionModal('loss'), 600);
    } else {
        updateAttemptCounter();
    }
}

// ─── Linha de histórico ───────────────────────────────────────────────────────
function addHistoryRow(guess, black, white) {
    const list = document.getElementById('play-history-list');
    const neutral = gs.currentCodeSize - black - white;
    const attemptNum = gs.attempts.length;

    // Remove 'recent' do row anterior
    list.querySelectorAll('.history-row.recent').forEach(r => r.classList.remove('recent'));

    const dots = [
        ...Array(black).fill('green'),
        ...Array(white).fill('yellow'),
        ...Array(neutral).fill('white')
    ];
    const dotHtml = dots.map(d => `<div class="feedback-dot ${d}"></div>`).join('');

    const cardsHtml = guess.map(card => {
        let inner;
        if (card.contentImage) {
            inner = `<img src="${card.contentImage}" alt="${escapeHtml(card.content)}"
                style="max-height:55px;max-width:100%;object-fit:contain;border-radius:6px;">`;
        } else {
            inner = `<p style="font-size:8px;font-weight:900;text-align:center;line-height:1.2;">${escapeHtml(card.content)}</p>`;
        }
        return `<div class="history-mini-card">${inner}</div>`;
    }).join('');

    const row = document.createElement('div');
    row.className = 'history-row recent';
    row.innerHTML = `
        <div style="min-width:22px;text-align:center;">
            <span style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;">${attemptNum}</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">${cardsHtml}</div>
        <div class="feedback-grid">${dotHtml}</div>
    `;

    list.prepend(row);
}

// ─── Modal de solução ─────────────────────────────────────────────────────────
function openSolutionModal(result) {
    const won = result === 'win';
    const attemptsUsed = gs.attempts.length;
    const rules = difficultyRules[gs.currentDifficulty];
    const score = won
        ? Math.max(0, (rules.attempts - attemptsUsed) * 100 + gs.currentCodeSize * 10)
        : 0;

    gs.currentResult = { score, attemptsUsed, won };
    savePublicScore(score, attemptsUsed, won);

    const icon = document.getElementById('solution-play-icon');
    icon.className = won
        ? 'fa-solid fa-star text-amber-400'
        : 'fa-solid fa-face-sad-tear text-slate-400';

    document.getElementById('solution-play-title').innerText = won
        ? 'Voce Acertou o Codigo!'
        : 'Codigo Revelado';
    document.getElementById('solution-play-subtitle').innerText = won
        ? `${attemptsUsed} tentativa${attemptsUsed !== 1 ? 's' : ''} — Pontuacao: ${score} pts`
        : 'Nao foi dessa vez. O codigo era:';

    // Gera cards com animacao de flip
    const container = document.getElementById('play-solution-cards');
    container.innerHTML = '';
    gs.secretCode.forEach((card, i) => {
        let frontContent;
        if (card.contentImage) {
            frontContent = `<img src="${card.contentImage}" alt="${escapeHtml(card.content)}"
                style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            frontContent = `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:8px;">
                <p style="font-size:11px;font-weight:900;text-align:center;line-height:1.3;color:#0f172a;">${escapeHtml(card.content)}</p>
            </div>`;
        }

        const backBg = gs.game.backDesign
            ? `url('${gs.game.backDesign}')`
            : 'linear-gradient(135deg, #047857, #10b981)';

        const cardEl = document.createElement('div');
        cardEl.className = 'solution-card-container';
        cardEl.innerHTML = `
            <div class="solution-card-inner">
                <div class="solution-card-front bg-white border border-slate-200" style="overflow:hidden;">${frontContent}</div>
                <div class="solution-card-back" style="background-image:${backBg};background-size:cover;background-position:center;"></div>
            </div>
        `;
        container.appendChild(cardEl);
        setTimeout(() => cardEl.classList.add('flipped'), (i + 1) * 300);
    });

    document.getElementById('modal-solution-play').style.display = 'flex';
}

// ─── Salvar resultado público ─────────────────────────────────────────────────
async function savePublicScore(score, attemptsUsed, won) {
    try {
        await supabase.from('public_plays').insert([{
            share_code: gs.shareCode,
            player_name: gs.playerName,
            score,
            attempts_used: attemptsUsed,
            won,
            difficulty_level: gs.currentDifficulty,
            code_size: gs.currentCodeSize
        }]);
    } catch (err) {
        console.warn('Nao foi possivel salvar resultado:', err.message);
    }
}

// ─── Ranking ──────────────────────────────────────────────────────────────────
async function showRanking() {
    document.getElementById('modal-solution-play').style.display = 'none';
    showScreen('ranking');

    document.getElementById('ranking-game-name').innerText = gs.game.name || 'Jogo';

    const r = gs.currentResult;
    if (r) {
        const icon = r.won ? 'fa-trophy text-amber-400' : 'fa-face-sad-tear text-slate-400';
        const bg = r.won ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200';
        const txtColor = r.won ? 'text-emerald-600' : 'text-slate-500';
        document.getElementById('player-result').innerHTML = `
            <div class="${bg} border rounded-2xl p-4 text-center mb-4">
                <i class="fa-solid ${icon} text-2xl mb-2"></i>
                <p class="text-sm font-black text-slate-700">${r.won ? 'Parabens, ' + escapeHtml(gs.playerName) + '!' : 'Boa tentativa, ' + escapeHtml(gs.playerName) + '!'}</p>
                <p class="text-3xl font-black ${txtColor} my-1">${r.score} <span class="text-lg">pts</span></p>
                <p class="text-xs text-slate-500">${r.attemptsUsed} tentativa${r.attemptsUsed !== 1 ? 's' : ''} usada${r.attemptsUsed !== 1 ? 's' : ''} &bull; Nivel ${gs.currentDifficulty} &bull; Codigo: ${gs.currentCodeSize} cartas</p>
            </div>
        `;
    }

    const list = document.getElementById('ranking-list');
    list.innerHTML = '<p class="text-slate-400 text-sm text-center py-4"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Carregando...</p>';

    try {
        const { data, error } = await supabase
            .from('public_plays')
            .select('*')
            .eq('share_code', gs.shareCode)
            .eq('won', true)
            .order('score', { ascending: false })
            .order('played_at', { ascending: true })
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Nenhuma vitoria registrada ainda. Seja o primeiro!</p>';
            return;
        }

        // Destaca o jogador atual na posicao em que aparece
        const currentPlayerName = gs.playerName.toLowerCase();
        list.innerHTML = data.map((play, idx) => {
            const isCurrentPlayer = play.player_name.toLowerCase() === currentPlayerName;
            const rankColors = idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100';
            const medalIcon = idx === 0
                ? '<i class="fa-solid fa-medal text-amber-400"></i>'
                : idx === 1
                ? '<i class="fa-solid fa-medal text-slate-400"></i>'
                : idx === 2
                ? '<i class="fa-solid fa-medal text-amber-700"></i>'
                : `<span class="text-xs font-black text-slate-500">${idx + 1}</span>`;
            return `
                <div class="flex items-center gap-3 p-3 rounded-2xl ${rankColors} border ${isCurrentPlayer ? 'ring-2 ring-emerald-400' : ''}">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${idx < 3 ? '' : 'bg-slate-100'}">${medalIcon}</div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-slate-800 truncate text-sm">${escapeHtml(play.player_name)}${isCurrentPlayer ? ' <span style="color:#047857;font-size:10px;">(voce)</span>' : ''}</p>
                        <p class="text-[10px] text-slate-400">${play.attempts_used} tentativa${play.attempts_used !== 1 ? 's' : ''} &bull; Nivel ${play.difficulty_level} &bull; ${play.code_size} cartas</p>
                    </div>
                    <span class="font-black text-emerald-600 text-lg shrink-0">${play.score}</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        list.innerHTML = '<p class="text-red-400 text-sm text-center">Erro ao carregar ranking. Tente novamente.</p>';
    }
}

// ─── Reiniciar jogo ───────────────────────────────────────────────────────────
function restartGame() {
    document.getElementById('modal-solution-play').style.display = 'none';
    startGame();
}

// ─── Inicialização ─────────────────────────────────────────────────────────────
async function init() {
    gs.shareCode = new URLSearchParams(window.location.search).get('code') || '';

    if (!gs.shareCode) {
        document.getElementById('error-message').innerText = 'Nenhum codigo de jogo foi fornecido na URL. Verifique o link.';
        showScreen('error');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('jogos')
            .select('*')
            .eq('share_code', gs.shareCode)
            .single();

        if (error || !data) throw new Error('Jogo nao encontrado ou link invalido.');

        gs.game = {
            ...data,
            frontDesign: data.frontdesign,
            backDesign: data.backdesign,
            disciplineInfo: data.disciplineinfo
        };

        const info = gs.game.disciplineInfo || {};
        document.getElementById('welcome-game-name').innerText = gs.game.name || 'Jogo sem titulo';
        document.getElementById('welcome-disciplina').innerText = info.disciplina || '-';
        document.getElementById('welcome-conteudo').innerText = info.conteudo || '-';
        document.getElementById('welcome-serie').innerText = info.serie || '-';
        document.getElementById('welcome-autores').innerText = (info.autores || []).join(', ') || '-';

        showScreen('welcome');
        document.getElementById('player-name-input').focus();
    } catch (err) {
        console.error(err);
        document.getElementById('error-message').innerText = err.message || 'Erro ao carregar o jogo.';
        showScreen('error');
    }
}

// ─── API global (usada pelos onclick do HTML) ─────────────────────────────────
window.playApp = {
    // Tela de boas-vindas
    startFromWelcome() {
        const input = document.getElementById('player-name-input');
        const name = (input ? input.value : '').trim();
        if (!name) {
            if (input) { input.classList.add('border-red-400'); input.focus(); }
            return;
        }
        if (input) input.classList.remove('border-red-400');
        gs.playerName = name;

        // Atualiza tela de dificuldade
        const nameEl = document.getElementById('diff-player-name');
        if (nameEl) nameEl.innerText = name;

        selectCodeSize(4);
        selectDifficultyLevel(1);
        showScreen('difficulty');
    },

    selectCodeSize,
    selectDifficultyLevel,
    startGame,
    validateGuess,
    removeFromSlot,

    previewCard(cardIdStr) {
        const card = gs.game.cards.find(c => String(c.id) === String(cardIdStr));
        if (card) previewCard(card);
    },

    askRestart() {
        if (gs.gameOver) { restartGame(); return; }
        showConfirm('Deseja reiniciar? Seu progresso atual sera perdido.', restartGame);
    },

    showGameRules() { showNotification(gs.game.regra || 'Nenhuma regra definida.', 'Regras do Jogo'); },
    showObjetivo() { showNotification(gs.game.objetivo || 'Nenhum objetivo definido.', 'Objetivo'); },
    showExplicacao() { showNotification(gs.game.explicacao || 'Nenhuma explicacao.', 'Como Jogar'); },

    closeNotificationPlay() { document.getElementById('modal-notification-play').style.display = 'none'; },
    closePreviewPlay() { document.getElementById('modal-preview-play').style.display = 'none'; },
    closeSolutionPlay() { document.getElementById('modal-solution-play').style.display = 'none'; },

    confirmPlay() {
        document.getElementById('modal-confirm-play').style.display = 'none';
        if (confirmCallback) { confirmCallback(); confirmCallback = null; }
    },
    cancelPlay() {
        document.getElementById('modal-confirm-play').style.display = 'none';
        confirmCallback = null;
    },

    showRanking,
    restartGame,
    goToWelcome() { showScreen('welcome'); }
};

document.addEventListener('DOMContentLoaded', init);
