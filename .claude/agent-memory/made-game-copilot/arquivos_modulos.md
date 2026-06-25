---
name: arquivos_modulos
description: Mapa de onde cada módulo do MADE está implementado no repositório (SPA de página única)
metadata:
  type: project
---

Confirmado em 2026-06-24 lendo os 4 arquivos completos do projeto.

## Estrutura geral
Projeto é uma SPA simples sem build step: Tailwind via CDN (`<script src="https://cdn.tailwindcss.com">`), Font Awesome via CDN, Supabase JS via ESM CDN (`@supabase/supabase-js/+esm`). Não há bundler, não há package.json, não há testes automatizados.

- `index.html` (~1490 linhas) — contém TODAS as telas/seções (`view-section`) e modais, mostrados/escondidos via `classList` em `js/app.js`. Não há roteamento de URL, é tudo client-state.
- `js/app.js` (~1850+ linhas) — único arquivo de lógica. Objeto global `window.app = { state: {...}, ...métodos }`. Todo HTML inline usa `onclick="app.metodoX()"`.
- `js/database.js` (183 linhas) — camada de abstração Supabase (`dbService`). Mapeia snake_case do banco para camelCase do app.
- `js/supabase.js` (8 linhas) — só inicializa o client (`createClient`). Credenciais hardcoded no arquivo (URL + chave publishable).

## Módulos dentro de index.html (por id de section/elemento)
- **Login/Auth**: `#view-login`, `#login-form`, `#register-form`, toggle via `app.setAuthMode()`.
- **Layout principal**: `#main-layout` (sidebar fixa + `<main>`), nav via `.nav-btn` + `app.switchView(viewId)`.
- **Dashboard**: `#view-dashboard` → `#dashboard-grid` (cards de jogos, renderizados por `renderDashboard()`).
- **Configurações**: `#view-settings`.
- **Biblioteca de imagens (gerenciador)**: `#view-library` → `#manager-library-grid` (`refreshLibraryManager()`). Upload usa `dbService.uploadImagem` no bucket `imagens_jogos`.
- **Biblioteca de imagens (modal de seleção dentro do editor)**: `#modal-library` → `#library-grid` (`openImageLibrary(targetType)` / `renderLibrary()` / `selectImageFromLibrary(url)`). `targetType` pode ser `'card-content'`, `'front-design'`, `'back-design'`.
- **Editor (Novo Jogo / Editar Jogo)**: `#view-creator`, 5 passos (`#creator-step-1` a `#creator-step-5`), navegação via `creatorNextStep()`/`creatorPrevStep()`/`showStep(n)`.
  - Passo 1 "Dados do Jogo": título, modelo (`#model-choices`, só "Código Secreto" disponível hoje), disciplina/série com opção "Outro", autores (`#edit-game-authors-list`, modal `#modal-author`).
  - Passo 2 "Regras e Aparência": regra/objetivo (contenteditable + botões "Marcar Vermelho"/"Retirar a Cor Vermelha"), design de frente/verso (toggle entre presets ou upload externo via biblioteca).
  - Passo 3 "Enunciado e Feedbacks": enunciado (contenteditable) + explicação (textarea).
  - Passo 4 "Criação de Cartas": grid de 12 cartas (`#editor-grid`), modal `#modal-card` para editar cada carta (texto, imagem, se é "possível para o código").
  - Passo 5 "Revisão e Teste": `populateReviewStep()` mostra tudo; botões "Testar Jogo" (`testGameFromCreator()`) e "Salvar Jogo" (`saveGame()`).
- **Player (Modo Jogo)**: `#view-player` — 3 colunas: banco de cartas esquerda (`#play-item-bank`), centro (header com metadados + enunciado + slots secretos `#play-secret-slots` + slots de tentativa `#play-drop-slots` + botão Validar), histórico à direita (`#play-history-list` + painel de info de nível `#play-level-info`, adicionado em 2026-06-24).
- **Modais**: `#modal-notification`, `#modal-card`, `#modal-author`, `#modal-difficulty` (dificuldade + tamanho do código), `#modal-solution` (resultado final com flip 3D das cartas secretas), `#modal-confirm`, `#modal-preview` (lupa/zoom), `#modal-library`.

## Fluxo de telas
`newGame()` / `editGame(id)` → editor (5 passos) → `testGameFromCreator()` abre `#modal-difficulty` → player em modo teste (`isTestingFromCreator=true`) → `backFromPlayer()` volta para o passo 5 do editor. Ou: dashboard → `openDifficultySelect(gameId)` → `#modal-difficulty` → `playGame(id)` → player real → `backFromPlayer()` volta ao dashboard.
