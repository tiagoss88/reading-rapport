

## Corrigir deploy da Edge Function de reset de senha

### Problema
A Edge Function `reset-operador-password` nao esta sendo implantada no Supabase apesar do codigo estar correto. Ja foram feitas 3 tentativas de redeploy sem sucesso. O erro "Failed to fetch" indica que a URL da funcao nao existe no servidor.

### Solucao
Recriar a funcao com um nome diferente (`reset-password`) para contornar possiveis problemas de cache de deploy. Tambem atualizar a chamada no frontend para usar o novo nome.

### Alteracoes

**1. Criar `supabase/functions/reset-password/index.ts`**
- Mesmo codigo da funcao atual, mas em uma pasta com nome novo
- Manter os mesmos imports, CORS, logica de autenticacao e reset

**2. Atualizar `supabase/config.toml`**
- Substituir a entrada `[functions.reset-operador-password]` por `[functions.reset-password]`
- Manter `verify_jwt = false`

**3. Atualizar `src/pages/Operadores.tsx`**
- Alterar a chamada de `supabase.functions.invoke('reset-operador-password', ...)` para `supabase.functions.invoke('reset-password', ...)`

**4. Remover `supabase/functions/reset-operador-password/index.ts`**
- Limpar a funcao antiga que nao esta deployando

### Por que essa abordagem
Renomear a funcao forca o Lovable a criar um deploy completamente novo, evitando qualquer cache ou estado corrompido do deploy anterior. As outras funcoes (`create-operador`, `delete-operador`) funcionam normalmente, entao o problema e especifico desta funcao.
