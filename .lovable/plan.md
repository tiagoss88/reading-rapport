

## Corrigir redirecionamento de operadores para o coletor

### Problema
Quando um operador faz login, o `ProtectedRoute` deveria redirecioná-lo para `/coletor`, mas em alguns casos (especialmente no PWA), os roles ainda não carregaram ou voltam vazios temporariamente. Isso faz o operador "passar" pelo `ProtectedRoute`, chegar ao `/dashboard`, e o `PermissionRoute` o redireciona para `/not-authorized` em vez de `/coletor`.

### Solução

**1. `src/components/PermissionRoute.tsx`**
- Detectar se o usuário é operador puro (mesma lógica do `ProtectedRoute`)
- Se for operador e não tiver a permissão necessária, redirecionar para `/coletor` em vez de `/not-authorized`
- Isso serve como "rede de segurança" caso o `ProtectedRoute` falhe em capturar o operador

**2. `src/components/ProtectedRoute.tsx`**
- Tornar a verificação mais robusta: se o usuário não tem nenhum role carregado (roles vazio) e as permissões já terminaram de carregar, aguardar um refresh antes de decidir
- Adicionar fallback: se após o carregamento o usuário não tem roles admin/gestor, redirecionar para `/coletor`

**3. `vite.config.ts`**
- Adicionar `start_url: '/'` no manifest do PWA para garantir que o app inicie na rota correta (que já faz o redirecionamento adequado)

### Detalhes técnicos

No `PermissionRoute`, antes de redirecionar para `/not-authorized`, verificar:
```text
Se usuario tem apenas roles de operador → redirecionar para /coletor
Senao → redirecionar para /not-authorized (comportamento atual)
```

No `ProtectedRoute`, melhorar a lógica:
```text
Se roles vazio E loading terminou → considerar como operador e redirecionar para /coletor
(evita que operadores sem roles caiam no dashboard)
```

Isso garante que, independentemente da ordem de carregamento, o operador sempre acabe no `/coletor`.
