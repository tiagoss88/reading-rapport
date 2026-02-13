

## Corrigir race condition no carregamento de permissoes apos login

### Problema raiz
Quando o app inicia sem usuario logado, o `PermissionsContext` marca `initialLoadComplete = true` e `loading = false`. Quando o usuario faz login, as permissoes sao buscadas novamente, mas como `initialLoadComplete` ja e `true`, o sistema usa `refreshing` em vez de `loading`. Isso faz com que `loading` fique `false` enquanto os roles ainda estao sendo carregados.

Resultado: a pagina de Login ve `loading = false` com `roles = []`, interpreta que o usuario nao e operador, e redireciona para `/` em vez de `/coletor`. O usuario acaba em `/not-authorized`.

### Solucao
Resetar o estado de carregamento quando o usuario muda (login/logout), garantindo que o `loading` volte a `true` ate que os novos roles sejam carregados.

### Alteracoes

**1. `src/contexts/PermissionsContext.tsx`**
- Quando o `user` muda (de null para um usuario logado), resetar `initialLoadComplete` para `false` e `loading` para `true`
- Isso garante que todos os componentes que dependem de `permissionsLoading` aguardem o carregamento correto dos roles do novo usuario

Logica corrigida:
```text
useEffect quando user muda:
  1. Se user mudou, resetar initialLoadComplete = false e loading = true
  2. Chamar fetchUserPermissions
  3. fetchUserPermissions ve initialLoadComplete = false, mantem loading = true
  4. Ao terminar, seta loading = false com os roles corretos
```

**2. `src/pages/Login.tsx`**
- Nenhuma alteracao necessaria. A pagina ja verifica `permissionsLoading` corretamente (linha 55). O problema e que `loading` nao reflete o estado real.

**3. `src/components/ProtectedRoute.tsx`**
- Nenhuma alteracao necessaria. A logica atual esta correta, so nao funciona porque `loading` termina antes dos roles estarem disponiveis.

### Resultado esperado
- Operador faz login → loading fica true ate roles carregarem → Login detecta operador → redireciona para `/coletor`
- Admin faz login → loading fica true ate roles carregarem → Login detecta admin → redireciona para `/`  → Index redireciona para `/dashboard`
