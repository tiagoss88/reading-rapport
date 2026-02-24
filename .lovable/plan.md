

## Remover indicador "Rastreamento ativo" do menu do coletor

Remover o bloco visual que mostra "Rastreamento ativo" e o indicador de erro de rastreamento no menu do coletor. O rastreamento continuará funcionando normalmente em segundo plano, apenas sem feedback visual para o operador.

### Arquivo a editar

**`src/pages/ColetorMenu.tsx`**

- Remover o bloco `{isTracking && (...)}` (linhas ~119-127)
- Remover o bloco `{error && (...)}` (linhas ~128-132)
- Opcionalmente remover o import e a chamada de `useLocationTracking` se não for mais referenciado (manter a chamada para que o rastreamento continue ativo, apenas remover a exibição)

Na prática: manter `const { } = useLocationTracking(true)` (sem desestruturar `isTracking` e `error`) ou simplesmente `useLocationTracking(true)` para que o hook continue executando.

