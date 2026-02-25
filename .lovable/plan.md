

## Ordenar Condomínios por Operador no Cronograma

### Objetivo

Dentro de cada card de rota expandido, ordenar os condomínios pelo nome do operador designado, agrupando visualmente os condomínios de cada operador.

### Alteração

**Arquivo: `src/pages/ColetorCronograma.tsx`**

Na renderização dos empreendimentos dentro do `CollapsibleContent` (por volta da linha 210), antes de mapear `emps`, ordenar o array pelo nome do primeiro operador designado. Condomínios sem operador ficam no final da lista.

Lógica de ordenação:

```tsx
const empsSorted = [...emps].sort((a, b) => {
  const opA = getOperadoresDoEmpreendimento(a.id, dia.data)
  const opB = getOperadoresDoEmpreendimento(b.id, dia.data)
  const nomeA = opA[0] || 'zzz' // sem operador vai pro final
  const nomeB = opB[0] || 'zzz'
  return nomeA.localeCompare(nomeB)
})
```

Depois, substituir `emps.map(...)` por `empsSorted.map(...)` na renderização.

### Resumo

- 1 arquivo alterado: `src/pages/ColetorCronograma.tsx`
- Adiciona ordenação dos condomínios por nome do operador dentro de cada rota expandida
- Condomínios sem operador atribuído aparecem por último

