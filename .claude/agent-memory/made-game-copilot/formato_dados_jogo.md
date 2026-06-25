---
name: formato_dados_jogo
description: Schema real da tabela Supabase 'jogos', bucket de storage, e formato do objeto JS de um jogo Código Secreto
metadata:
  type: project
---

Confirmado em 2026-06-24 lendo `js/database.js` e `js/app.js` (objeto `editingGame`/`activeGame` e `loadDefaultGames`).

## Tabela Supabase `jogos`
Colunas confirmadas via `dbService.salvarJogo()` (payload exato) e `listarJogos()` (select `*` + remapeamento):
- `id` (uuid ou serial — upsert manda `id` só se não for um id temporário `game-<timestamp>`)
- `name` (text)
- `model` (text — hoje só `"Código Secreto"`)
- `frontdesign` (text, **lowercase**, é a URL/path da arte de frente) → mapeado para `frontDesign` no app
- `backdesign` (text, **lowercase**) → mapeado para `backDesign`
- `disciplineinfo` (provavelmente jsonb, **lowercase**) → mapeado para `disciplineInfo`
- `regra` (text, contém HTML — pode ter `<strong style="color:#b91c1c">`)
- `objetivo` (text, mesmo formato)
- `enunciado` (text, mesmo formato)
- `explicacao` (text simples, sem HTML — vem de `<textarea>`)
- `cards` (jsonb — array de objetos carta)
- `user_id` (uuid, FK auth.users, usado para RLS de listagem — `listarJogos` filtra `.eq('user_id', user.id)`)
- `created_at` (timestamp, usado para `order by ... desc`)

IMPORTANTE: não há `created_at`/RLS policies inspecionados diretamente (sem acesso ao dashboard Supabase nesta sessão) — apenas inferidos do código cliente. Se for preciso alterar schema, confirmar com o usuário antes de assumir nomes de coluna além dos listados acima.

## Mapeamento camelCase ↔ snake_case (em `js/database.js`)
`listarJogos()` espalha `...jogo` e sobrescreve com `frontDesign`, `backDesign`, `disciplineInfo` em camelCase — ou seja, o objeto retornado para o app tem AMBAS as chaves (lowercase original do banco + camelCase). O app.js só usa as camelCase.
`salvarJogo()` faz o caminho inverso (camelCase do app → lowercase do banco) explicitamente no payload.

## Formato do objeto `disciplineInfo`
```js
{
  disciplina: string,   // ex: "Biologia", ou valor de "Outro" digitado
  conteudo: string,
  serie: string,         // ex: "6º ano", ou valor de "Outro"
  autores: string[]      // PODE FALTAR em jogos antigos salvos antes desse campo — sempre validar com Array.isArray antes de usar métodos de array (bug corrigido em 2026-06-24, ver bugs_corrigidos)
}
```

## Formato de cada item em `cards` (array de 12 objetos no editor)
```js
{
  id: number | string,        // no editor novo: "new-0".."new-11"; em jogos salvos: pode ser number
  content: string,            // texto da carta (pode ser "" se só tiver imagem)
  contentImage: string|null,  // URL pública (Supabase Storage) ou data: URL (upload local não persistido) — opcional
  isCorrect: boolean,         // se é uma das 6 cartas "possíveis para o código secreto"
  pileId: number,             // não usado em lógica de jogo hoje, parece vestigial/decorativo
  frontImage: string|null,    // opcional, override visual por carta (raramente usado)
  backImage: string|null      // opcional, idem
}
```
Regra de validação no editor (passo 4 → 5): exatamente 12 cartas preenchidas (texto OU imagem) e exatamente 6 marcadas `isCorrect: true`. Ver `creatorNextStep()`.

## Estado runtime de uma partida em `app.state` (não persistido em jogo salvo, é efêmero por sessão de jogo)
- `secretCode`: array de cartas (subset de `cards` correto, com `instanceId` gerado via `crypto.randomUUID()`), tamanho = `currentCodeSize`.
- `currentGuess`: array de tamanho `currentCodeSize`, slots `null` ou carta com `instanceId`.
- `attempts`: array de `{ guess: [...cards], result: { black, white } }`.
- `currentDifficulty`: 1-4, mapeia para `difficultyRules[level] = { attempts, repeat, swap }`.
- `currentCodeSize`: 3-6 (ou resolvido de `codeSizeOption === 'random'` para um valor fixo no momento de início).
- `maxAttempts` fica dentro de `activeGame.maxAttempts` (cópia do jogo + campo extra), não em `state` direto.

## Bucket de Storage
`imagens_jogos` — usado tanto para biblioteca pessoal (`{userId}/{timestamp}-{filename}`) quanto para uploads de design externo de carta (`{userId}/design/front-{timestamp}-{filename}` e `back-{timestamp}-{filename}`). Path é sanitizado (remove acentos, espaços→hífen, lowercase) antes do upload.
