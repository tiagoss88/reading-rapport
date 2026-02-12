

## Adicionar botao de reenvio/redefinicao de senha para operadores

### Objetivo
Permitir que o administrador redefina a senha de um operador diretamente pela lista, enviando uma nova senha temporaria ou gerando um link de redefinicao.

### Abordagem escolhida
Adicionar um botao de "Redefinir Senha" na coluna de acoes de cada operador. Ao clicar, abre um dialog pedindo a nova senha. A redefinicao sera feita via uma nova Edge Function que usa o `admin.updateUserById` do Supabase para alterar a senha do usuario.

### Alteracoes

**1. Nova Edge Function: `supabase/functions/reset-operador-password/index.ts`**
- Recebe `operador_id` e `new_password`
- Verifica autenticacao e permissao (admin ou `manage_operadores`)
- Busca o `user_id` do operador na tabela `operadores`
- Usa `supabaseAdmin.auth.admin.updateUserById(userId, { password })` para redefinir a senha
- Retorna sucesso ou erro

**2. Modificar `src/pages/Operadores.tsx`**
- Adicionar um botao com icone de chave (`KeyRound`) na coluna de acoes, ao lado do editar e excluir
- Ao clicar, abre um dialog simples pedindo a nova senha (com confirmacao)
- Ao confirmar, chama `supabase.functions.invoke('reset-operador-password', { body: { operador_id, new_password } })`
- Exibe toast de sucesso ou erro

### Resultado
O administrador podera redefinir a senha de qualquer operador sem precisar excluir e recriar o cadastro. O operador recebera a nova senha diretamente do administrador (comunicacao fora do sistema).

