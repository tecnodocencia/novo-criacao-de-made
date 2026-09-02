// js/core/auth.js
import { dbService } from '../database.js';
import { getGame } from '../games/registry.js';

export const authMethods = {
    init: async function() {
        if (!this._recoveryListenerAttached) {
            this._recoveryListenerAttached = true;
            dbService.onAuthStateChange((event) => {
                if (event === 'PASSWORD_RECOVERY') this.enterRecoveryMode();
            });
        }
        if (dbService.isPasswordRecoveryPending()) {
            this.enterRecoveryMode();
            return;
        }

        if (!this.state.activeUser) {
            this.state.activeUser = await dbService.getCurrentUser();
        }
        if (!this.state.activeUser) {
            // Nenhuma sessão salva: permanece na tela de login (estado padrão do HTML).
            return;
        }

        document.getElementById('view-login').classList.remove('active');
        document.getElementById('main-layout').classList.remove('hidden');

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

    enterRecoveryMode: function() {
        document.getElementById('main-layout')?.classList.add('hidden');
        document.getElementById('view-login')?.classList.remove('hidden');
        document.getElementById('view-login')?.classList.add('active');
        this.setAuthMode('recovery');
    },

    loadDefaultGames: function() {
        this.state.games = getGame('Código Secreto').getDemoGames();
    },

    setAuthMode: function(mode) {
        this.state.authMode = mode;
        document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
        document.getElementById('forgot-form')?.classList.toggle('hidden', mode !== 'forgot');
        document.getElementById('recovery-form')?.classList.toggle('hidden', mode !== 'recovery');
        document.getElementById('auth-mode-toggle')?.classList.toggle('hidden', mode === 'forgot' || mode === 'recovery');
        document.getElementById('auth-login-btn').classList.toggle('bg-[#f5e7d6]', mode === 'login');
        document.getElementById('auth-login-btn').classList.toggle('text-[#bb3e44]', mode === 'login');
        document.getElementById('auth-register-btn').classList.toggle('bg-[#f5e7d6]', mode === 'register');
        document.getElementById('auth-register-btn').classList.toggle('text-[#bb3e44]', mode === 'register');
        const feedback = document.getElementById('auth-feedback');
        if (feedback) feedback.classList.add('hidden');
        if (mode === 'forgot') {
            const forgotEmail = document.getElementById('forgot-email');
            const currentEmail = document.getElementById('auth-email')?.value.trim();
            if (forgotEmail && currentEmail) forgotEmail.value = currentEmail;
        }
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
            const { user, hasSession } = await dbService.registrar(email, password, role);
            if (user && user.identities && user.identities.length === 0) {
                if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Este email já está cadastrado. Tente fazer login.'; }
                return;
            }

            if (hasSession) {
                // Cadastro sem exigência de confirmação por email: já entra direto.
                this.state.activeUser = user;
                document.getElementById('view-login').classList.remove('active');
                document.getElementById('main-layout').classList.remove('hidden');
                this.init();
                return;
            }

            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.innerText = 'Conta criada! Confirme seu email pelo link enviado e depois mude para a aba Login.';
            }
        } catch (error) {
            console.error(error);
            const knownMessages = {
                'User already registered': 'Este email já está cadastrado. Tente fazer login.',
                'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
                'Unable to validate email address: invalid format': 'Formato de email inválido.',
                'Signup requires a valid password': 'Informe uma senha válida.',
                'Email rate limit exceeded': 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
            };
            const friendly = knownMessages[error.message];
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.innerText = friendly || `Erro ao criar conta: ${error.message}`;
            }
        }
    },

    sendPasswordReset: async function() {
        const email = document.getElementById('forgot-email')?.value.trim();
        const feedback = document.getElementById('auth-feedback');

        if (!email) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Informe seu email para continuar.'; }
            return;
        }

        try {
            await dbService.resetPasswordForEmail(email);
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.innerText = 'Se esse email estiver cadastrado, enviamos um link de redefinição. Confira sua caixa de entrada.';
            }
        } catch (error) {
            console.error(error);
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = `Erro ao enviar email: ${error.message}`; }
        }
    },

    updatePasswordAfterRecovery: async function() {
        const password = document.getElementById('recovery-password')?.value;
        const confirm = document.getElementById('recovery-password-confirm')?.value;
        const feedback = document.getElementById('auth-feedback');

        if (!password || !confirm) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'Preencha a nova senha nos dois campos.'; }
            return;
        }
        if (password !== confirm) {
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = 'As senhas não coincidem.'; }
            return;
        }

        try {
            await dbService.updatePassword(password);
            await dbService.logout();
            this.setAuthMode('login');
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.innerText = 'Senha atualizada com sucesso! Faça login com sua nova senha.';
            }
        } catch (error) {
            console.error(error);
            if (feedback) { feedback.classList.remove('hidden'); feedback.innerText = `Erro ao salvar nova senha: ${error.message}`; }
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
