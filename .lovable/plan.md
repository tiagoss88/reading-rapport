## Problema

O erro "Failed to send a request to the Edge Function" ao clicar em "Gerar Nova Senha" ocorre porque a Edge Function `reset-password` não está implantada no backend (não há logs registrados e o navegador recebe "Failed to fetch" sem status HTTP).

## Solução

Implantar a Edge Function `reset-password` que já existe no código (`supabase/functions/reset-password/index.ts`) e está declarada em `supabase/config.toml`.

### Passo único
- Fazer deploy da função `reset-password` no backend.

Não são necessárias mudanças de código — o arquivo já contém validação de auth, checagem de permissão `manage_operadores`/admin, e geração de senha segura.

## Verificação
- Após deploy, testar chamando a função via botão "Gerar Nova Senha" em /operadores.
- Confirmar que retorna `{ success: true, generated_password: "..." }`.