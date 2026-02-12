

## Corrigir deploy da Edge Function `reset-operador-password`

### Problema
A Edge Function `reset-operador-password` existe no codigo mas nao foi implantada no Supabase. O erro "Failed to send a request to the Edge Function" indica que a funcao nao esta acessivel no servidor.

### Solucao
Reescrever a funcao com uma pequena simplificacao para forcar o deploy. A mudanca principal sera remover a dependencia do Zod (que pode estar causando falha no deploy) e fazer a validacao manualmente, alinhando o estilo com as outras Edge Functions que ja funcionam.

### Alteracoes

**Arquivo: `supabase/functions/reset-operador-password/index.ts`**
- Remover import do Zod (possivel causa de falha no deploy)
- Fazer validacao manual dos campos `operador_id` e `new_password`
- Manter toda a logica de autenticacao, permissoes e reset de senha
- Manter os CORS headers completos

### Detalhes tecnicos
As outras Edge Functions (`create-operador`, `delete-operador`) usam Zod sem problemas, porem o import `https://deno.land/x/zod@v3.22.4/mod.ts` pode estar falhando no ambiente de deploy. Simplificar a funcao removendo essa dependencia elimina esse ponto de falha. Se o problema for outro (como cache de deploy), a reescrita completa do arquivo tambem forca um novo deploy limpo.

