// js/play-descarte.js — Página pública do Descarte a Carta (link compartilhado,
// sem login). O aluno escolhe entre jogar contra o computador (no próprio
// computador) ou jogar com um colega, cada um no seu computador: nesse caso os
// dois abrem este mesmo link, escolhem a mesma opção e a partida só começa
// quando os dois estão na sala (ver js/games/descarte/net.js).
//
// A mesa é a mesma da plataforma: o partial partials/games/descarte/player.html
// e o motor de js/games/descarte/player.js, que esperam um objeto `app` com
// `state` e os métodos de utilidade/modal — montado aqui, sem o resto do app.
import { supabase } from './supabase.js?v=2';
import { utilsMethods } from './core/utils.js?v=8';
import { modalMethods } from './core/modals.js?v=1';
import { playerMethods, descarteEngine as engine } from './games/descarte/player.js?v=37';
import { joinLobby, joinMatch, uid } from './games/descarte/net.js?v=1';

const MODEL_NAMES = ['Descarte a Carta', 'Eliminação'];
const MODE_LABELS = {
    solo: '1 aluno + computador',
    trio: '2 alunos + computador',
    duo: '2 alunos, sem computador'
};
// Tempo máximo esperando o colega aparecer na sala da partida depois de a
// dupla ser formada (ex.: ele fechou a aba nesse instante). Passou disso,
// volta para a sala de espera.
const MATCH_JOIN_TIMEOUT_MS = 12000;

const ps = {
    game: null,
    shareCode: '',
    me: { id: uid(), name: '' },
    mode: null,
    lobby: null,     // sala de espera (joinLobby)
    match: null,     // canal da partida (joinMatch)
    role: null,      // 'host' | 'guest'
    partnerName: '',
    joinTimer: null,
    guestNet: null
};

function showScreen(id) {
    document.querySelectorAll('.play-screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + id));
}

function closeGameModals() {
    ['modal-descarte-wild', 'modal-descarte-result', 'modal-preview', 'modal-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function isOnline() { return ps.mode === 'trio' || ps.mode === 'duo'; }

function matchRunning() {
    const e = app.state.descarte;
    return !!(e && e.winner == null);
}

// ─── Partida contra o computador ─────────────────────────────────────────────
function startSolo() {
    ps.mode = 'solo';
    engine.createMatch(app, ps.game,
        [{ name: ps.me.name, isBot: false }, { name: 'Computador', isBot: true }], { mode: 'solo' });
    showGame();
    engine.startTurns(app);
}

// ─── Partida entre alunos (cada um no seu computador) ────────────────────────
function enterLobby(mode) {
    ps.mode = mode;
    document.getElementById('waiting-mode').innerText = MODE_LABELS[mode];
    document.getElementById('waiting-title').innerText = 'Aguardando outro aluno...';
    document.getElementById('waiting-text').innerText =
        `Peça para um colega abrir este mesmo link, digitar o nome e escolher “${MODE_LABELS[mode]}”. A partida começa assim que ele entrar na sala.`;
    showScreen('waiting');
    ps.lobby = joinLobby(supabase, {
        shareCode: ps.shareCode,
        mode,
        me: ps.me,
        onPaired: ({ role, roomId }) => { ps.lobby = null; openMatch(role, roomId); }
    });
}

function openMatch(role, roomId) {
    ps.role = role;
    ps.partnerName = '';
    document.getElementById('waiting-title').innerText = 'Colega encontrado!';
    document.getElementById('waiting-text').innerText = 'Preparando a partida...';
    ps.guestNet = { role: 'guest', send: action => ps.match && ps.match.send('action', action) };
    ps.match = joinMatch(supabase, {
        roomId,
        me: ps.me,
        onMessage,
        onPartnerJoin: (p) => {
            ps.partnerName = p.name || 'Colega';
            if (ps.role === 'host' && !app.state.descarte) startOnlineAsHost();
        },
        onPartnerLeave: () => endOnline(`${ps.partnerName || 'O outro aluno'} saiu da partida.`)
    });
    ps.joinTimer = setTimeout(() => {
        if (app.state.descarte) return;
        leaveMatch();
        enterLobby(ps.mode);
    }, MATCH_JOIN_TIMEOUT_MS);
}

// O anfitrião é o jogador 0 (começa) e o convidado, o 1; no modo com
// computador, ele é o 3º jogador e roda aqui, no computador do anfitrião.
function startOnlineAsHost() {
    clearTimeout(ps.joinTimer);
    const roster = [
        { name: ps.me.name, isBot: false },
        { name: ps.partnerName, isBot: false, remote: true }
    ];
    if (ps.mode === 'trio') roster.push({ name: 'Computador', isBot: true });
    const net = {
        role: 'host',
        onRender: (draws, reshuffled) => ps.match && ps.match.send('state', engine.viewFor(app, 1, draws, reshuffled)),
        onPlayAnim: (playerIdx, card) => ps.match && ps.match.send('anim', { playerIdx, card })
    };
    closeGameModals();
    engine.createMatch(app, ps.game, roster, { mode: ps.mode, localIdx: 0, net });
    showGame();
    engine.startTurns(app);
}

function onMessage(event, payload) {
    if (event === 'bye') { endOnline(`${ps.partnerName || 'O outro aluno'} saiu da partida.`); return; }
    if (ps.role === 'host') {
        if (event === 'action') engine.applyRemoteAction(app, 1, payload);
        else if (event === 'restart') {
            startOnlineAsHost();
            app.showNotification(`${ps.partnerName} começou uma nova partida.`, 'Nova partida');
        }
        return;
    }
    if (event === 'state') {
        clearTimeout(ps.joinTimer);
        // O convidado não monta a partida (createMatch), só desenha a mesa.
        if (!app.state.activeGame) app.state.activeGame = JSON.parse(JSON.stringify(ps.game));
        if (!document.getElementById('screen-game').classList.contains('active')) showGame();
        engine.applyGuestView(app, payload, ps.guestNet);
    } else if (event === 'anim') {
        engine.animateRemotePlay(app, payload.playerIdx, payload.card);
    }
}

function leaveMatch() {
    clearTimeout(ps.joinTimer);
    if (ps.lobby) { ps.lobby.leave(); ps.lobby = null; }
    if (ps.match) { ps.match.leave(); ps.match = null; }
}

// Sai da partida (ou da espera) e volta para a escolha de modo.
function exitToModes() {
    leaveMatch();
    app.state.descarte = null;
    app.state.activeGame = null;
    closeGameModals();
    showModes();
}

function endOnline(message) {
    if (!ps.match) return;
    exitToModes();
    app.showNotification(message, 'Partida encerrada');
}

function showGame() {
    showScreen('game');
    document.getElementById('back-from-player-btn')?.classList.remove('hidden');
    document.getElementById('save-from-player-btn')?.classList.add('hidden');
}

// ─── Ranking (só partidas jogadas pelo link compartilhado) ───────────────────
// Mesma tabela do Código Secreto (public_plays), sem colunas novas: no
// Descarte, difficulty_level guarda o modo da partida (ver RANKING_MODES) e
// code_size, o número de jogadores. Cada computador registra só o resultado
// do aluno que está nele; o ranking mostra apenas as vitórias.
const RANKING_MODES = { solo: 1, trio: 2, duo: 3 };
const RANKING_MODE_LABELS = { 1: MODE_LABELS.solo, 2: MODE_LABELS.trio, 3: MODE_LABELS.duo };

function formatDateTimeBR(dateStr) {
    const d = new Date(dateStr);
    if (!dateStr || isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function showModes() {
    showScreen('mode');
    loadRanking();
}

async function loadRanking() {
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.innerHTML = '<p class="text-slate-400 text-sm text-center py-4"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Carregando...</p>';
    try {
        const { data, error } = await supabase.from('public_plays').select('*')
            .eq('share_code', ps.shareCode).eq('won', true)
            .order('score', { ascending: false }).order('played_at', { ascending: true })
            .limit(10);
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Nenhuma vitória registrada ainda. Seja o primeiro!</p>';
            return;
        }
        const me = (ps.me.name || '').toLowerCase();
        list.innerHTML = data.map((play, idx) => {
            const medal = idx === 0 ? '<i class="fa-solid fa-medal text-amber-400"></i>'
                : idx === 1 ? '<i class="fa-solid fa-medal text-slate-400"></i>'
                : idx === 2 ? '<i class="fa-solid fa-medal text-amber-700"></i>'
                : `<span class="text-sm font-black text-slate-500">${idx + 1}</span>`;
            const isMe = play.player_name.toLowerCase() === me;
            return `
                <div class="flex items-center gap-3 p-3 rounded-2xl border ${idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'} ${isMe ? 'ring-2 ring-emerald-400' : ''}">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${idx < 3 ? '' : 'bg-slate-100'}">${medal}</div>
                    <div class="flex-1 min-w-0 text-left">
                        <p class="font-bold text-slate-800 truncate text-sm">${app.escapeCardText(play.player_name)}${isMe ? ' <span class="text-emerald-700 text-xs">(você)</span>' : ''}</p>
                        <p class="text-[11px] text-slate-400">${RANKING_MODE_LABELS[play.difficulty_level] || ''} &bull; ${formatDateTimeBR(play.played_at)}</p>
                    </div>
                    <span class="font-black text-emerald-600 text-lg shrink-0">${play.score} <span class="text-xs">pts</span></span>
                </div>`;
        }).join('');
    } catch (err) {
        console.warn('Não foi possível carregar o ranking:', err.message);
        list.innerHTML = '<p class="text-red-400 text-sm text-center py-4">Não foi possível carregar o ranking agora.</p>';
    }
}

// Chamado pelo motor quando a partida termina (openResultModal).
async function saveMatchResult(winnerIdx, score) {
    const e = app.state.descarte;
    if (!e) return;
    const localIdx = e.localIdx != null ? e.localIdx : e.players.findIndex(p => !p.isBot);
    const won = winnerIdx === localIdx;
    const subEl = document.getElementById('descarte-result-subtitle');
    try {
        const { data, error } = await supabase.from('public_plays').insert([{
            share_code: ps.shareCode,
            player_name: ps.me.name,
            score: won ? score : 0,
            attempts_used: 0,
            won,
            difficulty_level: RANKING_MODES[ps.mode] || 1,
            code_size: e.players.length
        }]).select().single();
        if (error) throw error;
        if (!won || !data) return;
        const [{ count: better }, { count: total }] = await Promise.all([
            supabase.from('public_plays').select('id', { count: 'exact', head: true })
                .eq('share_code', ps.shareCode).eq('won', true)
                .or(`score.gt.${data.score},and(score.eq.${data.score},played_at.lt.${data.played_at})`),
            supabase.from('public_plays').select('id', { count: 'exact', head: true })
                .eq('share_code', ps.shareCode).eq('won', true)
        ]);
        if (subEl && app.state.descarte === e) {
            subEl.innerText += ` — Você ficou em ${(better || 0) + 1}º lugar${total ? ` de ${total}` : ''} no ranking!`;
        }
    } catch (err) {
        console.warn('Não foi possível salvar o resultado no ranking:', err.message);
    }
}

// ─── Objeto `app` usado pelo motor e pelos onclick do partial/modais ─────────
const app = {
    state: { descarte: null, activeGame: null },
    ...utilsMethods,
    ...modalMethods,
    ...playerMethods,

    // "Nova Partida" (barra lateral) e "Jogar Novamente" (fim de partida).
    descarteRestartMatch() {
        const restart = () => {
            closeGameModals();
            if (!isOnline()) { startSolo(); return; }
            if (!ps.match) return;
            if (ps.role === 'host') startOnlineAsHost();
            else ps.match.send('restart', {});
        };
        if (isOnline() && matchRunning()) {
            app.showConfirm('Nova Partida', 'A partida atual será encerrada para os dois jogadores. Começar outra?', restart);
            return;
        }
        restart();
    },

    // Botão "Voltar" da mesa.
    backFromPlayer() {
        if (isOnline() && matchRunning()) {
            app.showConfirm('Sair da Partida', 'Se você sair, a partida termina para o seu colega também. Deseja sair?', exitToModes);
            return;
        }
        exitToModes();
    },

    descarteExit() { exitToModes(); },

    // Fim de partida (o motor chama em openResultModal): grava no ranking.
    onDescarteMatchEnd(winnerIdx, score) { saveMatchResult(winnerIdx, score); },

    startFromWelcome() {
        const input = document.getElementById('player-name-input');
        const name = (input ? input.value : '').trim();
        if (!name) {
            if (input) { input.classList.add('border-red-400'); input.focus(); }
            return;
        }
        if (input) input.classList.remove('border-red-400');
        ps.me.name = name;
        document.getElementById('mode-player-name').innerText = name;
        showModes();
    },

    chooseMode(mode) {
        if (mode === 'solo') startSolo();
        else enterLobby(mode);
    },

    cancelWaiting() {
        exitToModes();
    },

    goToWelcome() {
        showScreen('welcome');
    }
};
window.app = app;

// ─── Inicialização ───────────────────────────────────────────────────────────
async function init() {
    ps.shareCode = new URLSearchParams(window.location.search).get('code') || '';
    const fail = (msg) => {
        document.getElementById('error-message').innerText = msg;
        showScreen('error');
    };
    if (!ps.shareCode) { fail('Nenhum código de jogo foi fornecido na URL. Verifique o link.'); return; }

    try {
        const [{ data, error }, partial] = await Promise.all([
            supabase.from('jogos').select('*').eq('share_code', ps.shareCode).single(),
            fetch(`partials/games/descarte/player.html?v=${Date.now()}`, { cache: 'no-store' }).then(r => r.text())
        ]);
        if (error || !data) throw new Error('Jogo não encontrado ou link inválido.');

        // Link de outro modelo (ex.: Código Secreto) aberto nesta página.
        if (!MODEL_NAMES.includes(data.model)) {
            window.location.replace(`play.html${window.location.search}`);
            return;
        }
        if (!data.cards || !Array.isArray(data.cards.attributes) || data.cards.attributes.length < 2) {
            throw new Error('Este jogo ainda não tem as cartas configuradas.');
        }

        ps.game = {
            ...data,
            model: 'Descarte a Carta',
            frontDesign: data.frontdesign,
            backDesign: data.backdesign,
            disciplineInfo: data.disciplineinfo
        };
        document.getElementById('descarte-mount').innerHTML = partial;

        const info = ps.game.disciplineInfo || {};
        document.title = `${ps.game.name || 'Descarte a Carta'} — MADE`;
        document.getElementById('welcome-game-name').innerText = ps.game.name || 'Jogo sem título';
        document.getElementById('welcome-disciplina').innerText = info.disciplina || '-';
        document.getElementById('welcome-conteudo').innerText = info.conteudo || '-';
        document.getElementById('welcome-serie').innerText = info.serie || '-';
        const autores = Array.isArray(info.autores) ? info.autores.filter(Boolean) : [];
        document.getElementById('welcome-autores').innerText = autores.length ? autores.join(', ') : '-';

        showScreen('welcome');
        document.getElementById('player-name-input').focus();
    } catch (err) {
        console.error(err);
        fail(err.message || 'Erro ao carregar o jogo.');
    }
}

window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('modal-notification')) app.closeNotification();
    if (event.target === document.getElementById('modal-preview')) app.closePreviewModal();
});
// Fechar a aba avisa o colega na hora (a presença também perceberia, mais devagar).
window.addEventListener('pagehide', () => leaveMatch());

document.addEventListener('DOMContentLoaded', init);
