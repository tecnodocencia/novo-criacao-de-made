// js/core/dashboard.js
import { dbService } from '../database.js';

export const dashboardMethods = {
    switchView: function(viewId) {
        document.querySelectorAll('.view-section').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });

        const target = document.getElementById(`view-${viewId}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Se for a aba de configurações, preenche os dados do usuário
        if (viewId === 'settings' && this.state.activeUser) {
            const emailEl = document.getElementById('settings-user-email');
            const roleEl = document.getElementById('settings-user-role');
            if (emailEl) emailEl.innerText = this.state.activeUser.email;
            if (roleEl) roleEl.innerText = this.state.activeUser.role || 'Usuário';
        }

        if (viewId === 'library' && this.state.activeUser) {
            this.refreshLibraryManager();
        }

        const sidebar = document.querySelector('aside');
        if (sidebar) {
            if (viewId === 'player') {
                sidebar.classList.add('hidden');
            } else {
                sidebar.classList.remove('hidden');
            }
        }

        document.querySelectorAll('.nav-btn').forEach(b => {
            if(b.getAttribute('data-view') === viewId) {
                b.className = "nav-btn w-full flex items-center p-3 rounded-xl transition bg-emerald-600 text-white";
            } else {
                b.className = "nav-btn w-full flex items-center p-3 rounded-xl transition text-slate-500 hover:bg-emerald-50";
            }
        });
    },

    renderDashboard: function() {
        const grid = document.getElementById('dashboard-grid');
        if(!grid) return;
        grid.innerHTML = '';

        this.state.games.forEach(game => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition group";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">M</div>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-4">${game.name || 'Sem título'}</h3>
                <div class="space-y-2 text-sm text-slate-500 mb-4">
                    <p><strong class="text-slate-800">Modelo:</strong> ${game.model || 'Código Secreto'}</p>
                    <p><strong class="text-slate-800">Disciplina:</strong> ${game.disciplineInfo?.disciplina || '-'}</p>
                    <p><strong class="text-slate-800">Conteúdo:</strong> ${game.disciplineInfo?.conteudo || '-'}</p>
                    <p><strong class="text-slate-800">Série:</strong> ${game.disciplineInfo?.serie || '-'}</p>
                    <p><strong class="text-slate-800">Autores:</strong> ${game.disciplineInfo?.autores?.length ? game.disciplineInfo.autores.join(', ') : '-'}</p>
                    <div class="pt-2 border-t border-slate-100 mt-2 space-y-1">
                        <p class="text-[10px] font-black uppercase text-slate-400">Enunciado</p>
                        <p class="text-xs">${game.enunciado || '-'}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black uppercase text-slate-400">Regra</p>
                        <p class="text-xs">${game.regra || '-'}</p>
                    </div>
                </div>
                <div class="rounded-3xl border border-slate-100 bg-slate-50 p-2 flex gap-2">
                    <button onclick="app.openDifficultySelect('${game.id}')" class="flex-1 bg-emerald-600 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-play"></i> Jogar
                    </button>
                    <button onclick="app.editGame('${game.id}')" class="bg-white border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-2xl text-xs transition hover:bg-slate-50">
                        Editar
                    </button>
                    <button onclick="app.shareGame('${game.id}')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl text-xs transition flex items-center gap-1" title="Compartilhar jogo">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                    <button onclick="app.manageRanking('${game.id}')" class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-2xl text-xs transition flex items-center gap-1" title="Gerenciar ranking">
                        <i class="fa-solid fa-trophy"></i>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    shareGame: async function(gameId) {
        const game = this.state.games.find(g => String(g.id) === String(gameId));
        if (!game) return;

        try {
            let shareCode = game.share_code;
            if (!shareCode) {
                shareCode = await dbService.gerarCodigoCompartilhamento(gameId);
                game.share_code = shareCode;
            }

            const origin = window.location.origin;
            const path = window.location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
            const playUrl = `${origin}${path}play.html?code=${shareCode}`;

            document.getElementById('modal-share-url').value = playUrl;
            document.getElementById('modal-share-game-name').innerText = game.name || 'Jogo';
            document.getElementById('modal-share').style.display = 'flex';
        } catch (err) {
            console.error(err);
            this.showNotification('Erro ao gerar link de compartilhamento: ' + err.message);
        }
    },

    copyShareUrl: function() {
        const input = document.getElementById('modal-share-url');
        if (!input) return;
        navigator.clipboard.writeText(input.value).then(() => {
            const btn = document.getElementById('modal-share-copy-btn');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
                setTimeout(() => { btn.innerHTML = original; }, 2000);
            }
        }).catch(() => {
            input.select();
            document.execCommand('copy');
        });
    },

    closeShareModal: function() {
        document.getElementById('modal-share').style.display = 'none';
    },

    // --- Gerenciar Ranking (limpar / remover jogadores) ---

    manageRanking: async function(gameId) {
        const game = this.state.games.find(g => String(g.id) === String(gameId));
        if (!game) return;

        if (!game.share_code) {
            this.showNotification('Este jogo ainda não foi compartilhado — gere o link (botão azul) antes de gerenciar o ranking. Sem compartilhamento, nenhum aluno pode ter pontuado nele ainda.');
            return;
        }

        this.state.rankingManageGameId = gameId;
        document.getElementById('modal-ranking-game-name').innerText = game.name || 'Jogo';
        document.getElementById('modal-ranking').style.display = 'flex';
        await this.refreshRankingManageList();
    },

    refreshRankingManageList: async function() {
        const game = this.state.games.find(g => String(g.id) === String(this.state.rankingManageGameId));
        const list = document.getElementById('ranking-manage-list');
        if (!game || !list) return;

        list.innerHTML = '<p class="text-slate-400 text-sm text-center py-6"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Carregando...</p>';

        try {
            const rows = await dbService.listarRankingCompletoJogo(game.share_code);

            if (rows.length === 0) {
                list.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Nenhum jogador no ranking deste jogo ainda.</p>';
                return;
            }

            list.innerHTML = rows.map((r, idx) => `
                <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span class="text-xs font-black text-slate-400 w-5 text-center shrink-0">${idx + 1}</span>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-slate-800 truncate text-sm">${this.escapeCardText(r.player_name)}</p>
                        <p class="text-[10px] text-slate-400">${r.score} pts &bull; ${r.attempts_used} tentativa${r.attempts_used !== 1 ? 's' : ''} &bull; Nível ${r.difficulty_level} &bull; ${new Date(r.played_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onclick="app.removeRankingEntry('${r.id}')" class="text-red-500 hover:bg-red-100 rounded-xl p-2 shrink-0 transition" title="Remover este jogador do ranking">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            list.innerHTML = '<p class="text-red-400 text-sm text-center py-6">Erro ao carregar ranking: ' + err.message + '</p>';
        }
    },

    removeRankingEntry: async function(playId) {
        try {
            await dbService.removerPartidaRanking(playId);
            await this.refreshRankingManageList();
        } catch (err) {
            console.error(err);
            this.showNotification('Erro ao remover jogador do ranking: ' + err.message);
        }
    },

    clearRanking: function() {
        const game = this.state.games.find(g => String(g.id) === String(this.state.rankingManageGameId));
        if (!game) return;

        this.showConfirm(
            'Limpar Ranking Completo',
            `Tem certeza que deseja apagar TODO o ranking de "${game.name}"? Todos os jogadores registrados serão removidos permanentemente. Essa ação não pode ser desfeita.`,
            async () => {
                try {
                    await dbService.limparRankingJogo(game.share_code);
                    await this.refreshRankingManageList();
                } catch (err) {
                    console.error(err);
                    this.showNotification('Erro ao limpar ranking: ' + err.message);
                }
            }
        );
    },

    closeRankingModal: function() {
        document.getElementById('modal-ranking').style.display = 'none';
        this.state.rankingManageGameId = null;
    },

    backFromPlayer: function() {
        const isTesting = this.state.isTestingFromCreator;

        this.state.activeGame = null;
        this.state.selectedGameIdForPlay = null;
        this.state.isTestingFromCreator = false;

        document.getElementById('back-from-player-btn').classList.add('hidden');

        if (isTesting) {
            this.switchView('creator');
            this.showStep(5);
        } else {
            this.switchView('dashboard');
        }
    }
};
