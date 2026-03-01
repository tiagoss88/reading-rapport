

## Bug: Rotas de diferentes UFs misturadas no planejamento

### Causa raiz

No `RotaDiariaDialog.tsx` (linha 77-92), a query de `rotas_leitura` filtra apenas por `data` (date), sem filtrar por UF. Quando BA rota 01 e CE rota 01 caem na mesma data, todos os empreendimentos de ambas as UFs aparecem juntos.

### Correção

1. **`RotaDiariaDialog.tsx`** - Filtrar `rotas_leitura` no client-side usando o `uf` do empreendimento retornado pelo join, já que `rotas_leitura` não tem coluna `uf` diretamente:
   - Na query (linha 82-88), incluir `uf` no select do empreendimento (já inclui `id, nome, quantidade_medidores` -- adicionar `uf`)
   - No agrupamento `groupedByEmpreendimento` (linha 177-200), filtrar apenas registros onde `empreendimento.uf === diaUtil.uf`
   - Na lista `empreendimentosNaRota` (linha 202), aplicar o mesmo filtro por UF
   - Na função `getOperadoresDoEmpreendimento` (linha 205-208), aplicar o mesmo filtro

Alternativamente, a abordagem mais limpa: filtrar os `rotasLeitura` uma vez e usar o resultado filtrado em todos os lugares. Criar um `filteredRotasLeitura` que filtra por `empreendimento.uf === diaUtil.uf`.

### Arquivos alterados

- `src/components/medicao-terceirizada/RotaDiariaDialog.tsx`

