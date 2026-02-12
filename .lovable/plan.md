

## Corrigir erro na Edge Function de redefinição de senha

### Problema
A Edge Function `reset-operador-password` não está respondendo no Supabase, resultando no erro "Failed to send a request to the Edge Function". Isso geralmente acontece quando a função não foi implantada corretamente.

### Solução
Reimplantar a Edge Function sem alterações no código. O código da função e os headers CORS já estão corretos. Basta forçar um novo deploy da função.

### Detalhes técnicos
- A função `supabase/functions/reset-operador-password/index.ts` já existe com CORS e lógica corretos
- O `supabase/config.toml` já registra a função com `verify_jwt = false`
- Será feita uma pequena alteração cosmética no arquivo da função (adicionar log) para forçar o redeploy automático pelo Lovable
