// js/games/descarte/net.js
//
// Salas do Descarte a Carta no link compartilhado (play-descarte.html): alunos
// que abrem o mesmo link e escolhem o mesmo modo se encontram aqui e jogam
// cada um no seu computador. Usa só o Supabase Realtime (presença +
// broadcast), sem nenhuma tabela no banco.
//
// 1. Sala de espera — canal `descarte-lobby:<código>:<modo>`. Quem está
//    esperando aparece na presença; a lista é ordenada por chegada e forma
//    duplas (1º com 2º, 3º com 4º...). O 1º da dupla convida o 2º; quando ele
//    aceita, os dois saem da espera e vão para o canal da partida.
// 2. Partida — canal `descarte-match:<sala>`. O anfitrião (quem convidou)
//    roda o motor (js/games/descarte/player.js) e manda para o convidado só
//    a visão dele; o convidado manda as jogadas de volta.

const INVITE_TIMEOUT_MS = 6000;

export function uid() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// `onPaired({ role: 'host' | 'guest', roomId })` é chamado uma única vez.
export function joinLobby(supabase, { shareCode, mode, me, onPaired }) {
    const channel = supabase.channel(`descarte-lobby:${shareCode}:${mode}`, {
        config: { presence: { key: me.id }, broadcast: { self: false } }
    });
    const joinedAt = Date.now();
    let done = false;
    let invite = null; // { roomId, to, at } — convite enviado ainda sem resposta

    function waitingList() {
        return Object.values(channel.presenceState())
            .map(metas => metas[0])
            .filter(p => p && p.id)
            .sort((a, b) => (a.t - b.t) || (a.id < b.id ? -1 : 1));
    }

    function tryPair() {
        if (done) return;
        const list = waitingList();
        const i = list.findIndex(p => p.id === me.id);
        // Só o 1º de cada dupla convida; o 2º espera o convite.
        if (i < 0 || i % 2 === 1 || !list[i + 1]) return;
        const partner = list[i + 1];
        if (invite && invite.to === partner.id && Date.now() - invite.at < INVITE_TIMEOUT_MS) return;
        invite = { roomId: uid(), to: partner.id, at: Date.now() };
        channel.send({ type: 'broadcast', event: 'invite', payload: { from: me.id, to: partner.id, roomId: invite.roomId } });
        // Sem resposta (o colega pode ter formado dupla com outro), tenta de novo.
        setTimeout(tryPair, INVITE_TIMEOUT_MS + 200);
    }

    function finish(role, roomId) {
        done = true;
        // Pequena espera para o "aceito" sair antes de fechar o canal.
        setTimeout(() => supabase.removeChannel(channel), 400);
        onPaired({ role, roomId });
    }

    channel.on('presence', { event: 'sync' }, tryPair);
    channel.on('broadcast', { event: 'invite' }, ({ payload }) => {
        if (done || !payload || payload.to !== me.id) return;
        channel.send({ type: 'broadcast', event: 'accept', payload: { from: me.id, to: payload.from, roomId: payload.roomId } });
        finish('guest', payload.roomId);
    });
    channel.on('broadcast', { event: 'accept' }, ({ payload }) => {
        if (done || !payload || payload.to !== me.id || !invite || payload.roomId !== invite.roomId) return;
        finish('host', payload.roomId);
    });
    channel.subscribe(status => {
        if (status === 'SUBSCRIBED') channel.track({ id: me.id, name: me.name, t: joinedAt });
    });

    return {
        leave() {
            if (done) return;
            done = true;
            supabase.removeChannel(channel);
        }
    };
}

// Canal da partida. `onMessage(evento, dados)` recebe: 'state' e 'anim'
// (anfitrião -> convidado), 'action' e 'restart' (convidado -> anfitrião) e
// 'bye' (qualquer um saiu). `onPartnerJoin(presença)` / `onPartnerLeave()`
// avisam quando o outro aluno entra ou cai da sala.
export function joinMatch(supabase, { roomId, me, onMessage, onPartnerJoin, onPartnerLeave }) {
    const channel = supabase.channel(`descarte-match:${roomId}`, {
        config: { presence: { key: me.id }, broadcast: { self: false } }
    });
    let partnerHere = false;
    let closed = false;

    channel.on('presence', { event: 'sync' }, () => {
        if (closed) return;
        const st = channel.presenceState();
        const other = Object.keys(st).find(k => k !== me.id);
        if (other && !partnerHere) {
            partnerHere = true;
            onPartnerJoin(st[other][0] || {});
        } else if (!other && partnerHere) {
            partnerHere = false;
            onPartnerLeave();
        }
    });
    ['state', 'anim', 'action', 'restart', 'bye'].forEach(event => {
        channel.on('broadcast', { event }, ({ payload }) => { if (!closed) onMessage(event, payload || {}); });
    });
    channel.subscribe(status => {
        if (status === 'SUBSCRIBED') channel.track({ id: me.id, name: me.name });
    });

    return {
        send(event, payload) {
            if (closed) return;
            channel.send({ type: 'broadcast', event, payload });
        },
        leave() {
            if (closed) return;
            channel.send({ type: 'broadcast', event: 'bye', payload: {} });
            closed = true;
            setTimeout(() => supabase.removeChannel(channel), 300);
        }
    };
}
