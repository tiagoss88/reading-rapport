
## Redirecionar operadores automaticamente para o coletor

### Problema atual
Quando um operador faz login (seja pela tela `/coletor/login` ou pela tela `/login`), ele pode acessar rotas administrativas como `/dashboard`. O sistema nao diferencia o destino com base no papel do usuario.

### O que muda
1. **Login do operador redireciona para o coletor** - Ao fazer login, se o usuario tiver papel de operador (operador_completo, operador_leitura, operador_servicos), ele sera redirecionado automaticamente para `/coletor` em vez de `/dashboard`.
2. **Rotas administrativas bloqueiam operadores** - O `ProtectedRoute` (usado nas rotas admin) passa a verificar se o usuario e operador e, nesse caso, redireciona para `/coletor`.
3. **Login administrativo (`/login`) tambem redireciona operadores** - Se um operador entrar pela tela admin, ele sera levado ao coletor.

### Alteracoes tecnicas

**1. `src/components/ProtectedRoute.tsx`**
- Importar `usePermissions` do contexto de permissoes
- Verificar se o usuario possui apenas papeis de operador (sem `admin` nem `gestor_empreendimento`)
- Se for operador puro, redirecionar para `/coletor` com `<Navigate to="/coletor" replace />`

**2. `src/pages/Login.tsx`**
- Apos o login bem-sucedido, consultar os papeis do usuario
- Se for operador, redirecionar para `/coletor` em vez de `/`
- No redirect automatico (quando `user` ja existe), tambem verificar o papel

**3. `src/pages/ColetorLogin.tsx`**
- Manter o comportamento atual (ja redireciona para `/coletor`)
- Nenhuma alteracao necessaria

**4. `src/pages/Index.tsx`**
- Adicionar verificacao de papel: se operador, redirecionar para `/coletor` em vez de `/dashboard`

Dessa forma, o operador fica restrito ao sistema do coletor independentemente de como ele faca login.
