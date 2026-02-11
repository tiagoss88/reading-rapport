

## Corrigir mapa que desaparece ao trocar de aba

### Problema
Quando o usuario vai para a aba "Roteirizador" e volta para "Georreferenciamento", o mapa some completamente. Isso acontece porque:

1. O `TabsContent` desmonta o conteudo da aba quando ela nao esta ativa, destruindo o elemento DOM do mapa
2. Porem a referencia `map.current` continua apontando para o mapa antigo (destruido)
3. Ao voltar para a aba, o `initializeMap` verifica `if (map.current) return` e nao recria o mapa

### Solucao
Adicionar um efeito de cleanup que limpa `map.current` quando o componente da aba e desmontado, e tambem resetar `mapReady`. Assim, ao reentrar na aba, o mapa sera reinicializado corretamente.

### Alteracoes

**Arquivo:** `src/pages/MedicaoTerceirizada/Georreferenciamento.tsx`

- Adicionar um `useEffect` de cleanup que, ao desmontar, chama `map.current.remove()` e seta `map.current = null` e `setMapReady(false)`
- Remover `map.current` da condicao de guarda do `initializeMap` useCallback deps (ja esta correto, mas o cleanup resolve o problema)
- Isso garante que toda vez que a aba Georreferenciamento e montada novamente, o mapa e recriado do zero

### Detalhe tecnico

Adicionar este efeito apos o `useEffect` que chama `initializeMap`:

```text
useEffect(() => {
  return () => {
    // Cleanup ao desmontar: destruir o mapa para permitir reinicializacao
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    markersRef.current = [];
    setMapReady(false);
  };
}, []);
```

Isso resolve o ciclo: montar -> criar mapa -> trocar aba -> desmontar -> limpar referencia -> voltar -> montar -> criar mapa novamente.

