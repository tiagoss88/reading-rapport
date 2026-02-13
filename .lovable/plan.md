

## Corrigir loading infinito no PermissionsContext

### Problema
No `useEffect` (linha 126-131), fazemos:
1. `setInitialLoadComplete(false)` - agenda atualização de estado
2. `setLoading(true)` - agenda atualização de estado
3. `fetchUserPermissions()` - executa imediatamente

O problema e que `fetchUserPermissions` captura o valor antigo de `initialLoadComplete` (ainda `true` do render anterior). Resultado:
- Linha 59: `if (!initialLoadComplete)` e `false` (valor antigo e `true`), entao vai para o `else` e seta `refreshing` em vez de `loading`
- Linha 118 (finally): `if (!initialLoadComplete)` e `false` novamente, entao **nunca executa** `setLoading(false)`
- Loading fica `true` para sempre

### Solucao
Modificar `fetchUserPermissions` para aceitar um parametro `isReset` que indica se e um reset de usuario. Quando `isReset = true`, a funcao sempre seta `loading = true` no inicio e `loading = false` no finally, independente de `initialLoadComplete`.

### Alteracao

**`src/contexts/PermissionsContext.tsx`**

Alterar a funcao `fetchUserPermissions` para receber um parametro opcional `isReset`:

```text
fetchUserPermissions(isReset?: boolean):
  - Se isReset ou !initialLoadComplete: setar loading = true
  - Senao: setar refreshing = true
  - No finally: 
    - Se isReset ou !initialLoadComplete: setar initialLoadComplete = true, loading = false
    - Sempre: setar refreshing = false
```

E no useEffect, chamar `fetchUserPermissions(true)` para indicar que e um reset de usuario.

Isso garante que o `loading` seja corretamente gerenciado independente do estado da closure.
