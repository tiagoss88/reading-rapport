## Problema encontrado

O sistema hoje tem **dois backends configurados ao mesmo tempo** e é isso que causa comportamento inconsistente a cada atualização:

- **Backend NOVO (Lovable Cloud atual):** `cfyhskxjvvqpnnzsebud`
  - Usado por: `.env`, `supabase/config.toml`, migrações, edge functions, tipos gerados.
- **Backend ANTIGO:** `mxoflglqsxupkzrbodkm`
  - Ainda referenciado em: `vite.config.ts` (hard‑coded via `define`) e `VPS_REQUIREMENTS.md`.

O `vite.config.ts` está sobrescrevendo as variáveis do `.env` na hora do build:

```ts
define: {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://mxoflglqsxupkzrbodkm...'),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('...'),
  'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify('mxoflglqsxupkzrbodkm'),
}
```

Resultado prático: o app publicado abre conectado ao backend antigo, enquanto tudo que é feito aqui (migrações, funções, tabelas novas como `gti_leituras_mensais`, `servicos_nacional_gas`, permissões, etc.) vai para o backend novo. Isso explica “sumiço” de dados, dados que aparecem em um lugar e não em outro, e comportamento diferente entre preview e produção.

## O que a plano vai ajustar

1. **`vite.config.ts`** — remover completamente o bloco `define` que fixa URL/keys do backend antigo. O client já lê `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do `.env`, que apontam para o backend correto (`cfyhskxjvvqpnnzsebud`). Nenhum outro campo do arquivo muda (PWA, plugins, alias permanecem).

2. **`VPS_REQUIREMENTS.md`** — substituir o exemplo de `.env.production` para referenciar o backend atual do Lovable Cloud, evitando que um deploy em VPS futuro reintroduza o backend antigo.

3. **Verificação pós‑mudança**
   - Confirmar via build que `VITE_SUPABASE_URL` resolvida é `https://cfyhskxjvvqpnnzsebud.supabase.co`.
   - Confirmar no preview (após flush do HMR) que login, listagem de serviços e leituras continuam funcionando — todos passando a bater no backend novo, como já é o caso das migrações.

## O que NÃO será alterado

- Nenhuma tabela, policy, edge function ou secret.
- Nenhum código de negócio (Roteirizador, Serviços, GTI, PWA, etc.).
- `supabase/config.toml` já está correto.

## Efeito esperado

A partir da próxima publicação o app inteiro (preview e produção) passa a usar um único backend — o mesmo onde as migrações e funções vivem — eliminando a divergência que aparece a cada atualização.