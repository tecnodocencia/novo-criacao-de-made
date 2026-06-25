// js/core/auth.js
import { dbService } from '../database.js';
import { getGame } from '../games/registry.js';

export const authMethods = {
    init: async function() {
        try {
            // Tenta carregar os jogos do banco de dados
            const jogosDoBanco = await dbService.listarJogos();
            if (jogosDoBanco && jogosDoBanco.length > 0) {
                this.state.games = jogosDoBanco;
            } else {
                this.loadDefaultGames();
            }
        } catch (error) {
            console.error("Erro ao carregar jogos do banco:", error);
            this.loadDefaultGames();
        }
        this.renderDashboard();
    },

    loadDefaultGames: function() {
        this.state.games = getGame('Código Secreto').getDemoGames();
    },

    setAuthMode: function(mode) {
        this.state.authMode = mode;
        document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
        document.getElementById('auth-login-btn').classList.toggle('bg-[#f5e7d6]', mode === 'login');
        document.getElementById('auth-login-btn').classList.toggle('text-[#bb3e44]', mode === 'login');
        document.getElementById('auth-register-btn').classList.toggle('bg-[#f5e7d6]', mode === 'register');
        document.getElementById('auth-register-btn').classList.toggle('text-[#bb3e44]', mode === 'register');
    },

    login: async function() {
        const email = document.getElementById('auth-email')?.value.trim();
        const password = document.getElementById('auth-password')?.value;
        const feedback = document.getElementById('auth-feedback');

        if (!email || !password) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Preencha email e senha para entrar.'; }
            return;
        }

        try {
            const user = await dbService.login(email, password);
            this.state.activeUser = user;
            document.getElementById('view-login').classList.remove('active');
            document.getElementById('main-layout').classList.remove('hidden');
            this.init();
        } catch (error) {
            console.error(error);
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.innerText = error.message === 'Invalid login credentials'
                    ? 'Email ou senha incorretos.'
                    : 'Erro ao conectar ao banco de dados: ' + error.message;
            }
        }
    },

    register: async function() {
        const email = document.getElementById('register-email')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const confirm = document.getElementById('register-password-confirm')?.value;
        const role = document.getElementById('register-role')?.value;
        const feedback = document.getElementById('auth-feedback');

        if(!email || !password || !confirm) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Preencha todos os campos.'; }
            return;
        }
        if(password !== confirm) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'As senhas não coincidem.'; }
            return;
        }

        try {
            await dbService.registrar(email, password, role);
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Conta criada com sucesso! Mude para aba Login.'; }
        } catch (error) {
            console.error(error);
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Erro ao criar conta. Email já existe?'; }
        }
    },

    logout: async function() {
        try {
            await dbService.logout();
            this.state.activeUser = null;
            document.getElementById('main-layout').classList.add('hidden');
            document.getElementById('view-login').classList.add('active');
            document.getElementById('view-login').classList.remove('hidden');
            this.setAuthMode('login');

            // Limpa campos de input
            const emailInput = document.getElementById('auth-email');
            const passInput = document.getElementById('auth-password');
            if(emailInput) emailInput.value = '';
            if(passInput) passInput.value = '';
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    }
};
