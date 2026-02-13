

## Corrigir redirecionamento de operadores e remover tela "Acesso nao autorizado"

### Problema atual
Operadores estao chegando na pagina `/not-authorized` ("Voce nao tem permissao para acessar esta pagina") em vez de serem redirecionados para `/coletor`. Isso acontece porque:
- O `PermissionRoute` redireciona para `/not-authorized` quando o usuario nao tem a permissao necessaria
- A pagina `/not-authorized` nao verifica se o usuario e operador para redireciona-lo ao coletor
- Ao dar refresh em rotas admin, o operador pode cair nessa tela

### Alteracoes

**1. `src/pages/NotAuthorized.tsx`** - Transformar em redirecionador inteligente
- Em vez de mostrar a mensagem de erro, verificar o perfil do usuario
- Se for operador, redirecionar para `/coletor`
- Se for admin/gestor sem permissao para aquela pagina especifica, redirecionar para `/dashboard`
- Remover completamente a tela de "Voce nao tem permissao"

**2. `src/components/PermissionRoute.tsx`** - Ajustar redirect padrao
- Alterar o `redirectTo` padrao de `/not-authorized` para logica condicional:
  - Operadores sempre redirecionam para `/coletor`
  - Outros usuarios redirecionam para `/dashboard`
- Isso elimina a necessidade da pagina NotAuthorized

**3. `src/components/ProtectedRoute.tsx`** - Sem alteracoes
- A logica atual ja redireciona operadores para `/coletor`, esta correta

### Resultado esperado
- Admin faz login ou refresh: ve o dashboard normalmente
- Operador faz login ou refresh em qualquer rota: sempre vai para `/coletor`
- A tela "Voce nao tem permissao" nunca mais aparece para ninguem

