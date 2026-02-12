

## Gerar senha aleatoria ao redefinir senha do operador

### Problema
A Edge Function `reset-password` continua com problemas de deploy. Alem disso, o fluxo atual pede que o admin digite uma senha manualmente.

### Nova abordagem
Gerar a senha aleatoria diretamente na Edge Function (no servidor), sem precisar que o admin digite. O admin clica em "Redefinir Senha", confirma, e o sistema gera uma senha segura de 12 caracteres e a exibe na tela para ser copiada.

### Alteracoes

**1. Edge Function `supabase/functions/reset-password/index.ts`**
- Remover o campo `new_password` do body (nao sera mais enviado pelo frontend)
- Gerar senha aleatoria de 12 caracteres no servidor usando `crypto.getRandomValues`
- Retornar a senha gerada no response: `{ success: true, generated_password: "AbC123xYz..." }`
- Manter toda a logica de autenticacao e permissoes

**2. Frontend `src/pages/Operadores.tsx`**
- Remover os states `newPassword` e `confirmPassword`
- Substituir o dialog de digitacao de senha por um dialog de confirmacao simples ("Tem certeza que deseja gerar uma nova senha?")
- Ao confirmar, chamar a Edge Function sem enviar senha
- Apos sucesso, exibir um dialog com a senha gerada para o admin copiar
- Adicionar botao de copiar senha para a area de transferencia
- Simplificar o `handleResetPassword` para nao precisar de validacao de senha

### Detalhes tecnicos

Geracao de senha no servidor:
```
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const array = new Uint8Array(12)
crypto.getRandomValues(array)
const password = Array.from(array, b => chars[b % chars.length]).join('')
```
- Exclui caracteres ambiguos (0, O, l, 1, I) para facilitar leitura
- 12 caracteres alfanumericos = seguranca adequada

Fluxo do usuario:
1. Admin clica no icone de chave ao lado do operador
2. Dialog de confirmacao aparece: "Gerar nova senha para [nome]?"
3. Admin confirma
4. Sistema gera senha e exibe na tela com botao de copiar
5. Admin copia e envia ao operador

