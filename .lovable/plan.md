
## Card "Coletas Confirmadas" — filtrar por competência atual

### Mudança

**Arquivo único:** `src/pages/Dashboard.tsx`

Alterar a query de `coletasConfirmadas` em `fetchDashboardData` para contar apenas as coletas de leitura executadas no mês corrente (competência atual), em vez de todas as coletas históricas.

### Detalhes

1. Calcular o início do mês atual e o início do próximo mês (formato `YYYY-MM-DD`).
2. Adicionar filtros à query:
   - `.eq('tipo_servico', 'leitura')` — considerar apenas coletas de leitura
   - `.gte('data_agendamento', inicioMes)`
   - `.lt('data_agendamento', proximoMes)`
3. Atualizar o texto auxiliar do card de `"Total de coletas realizadas"` para `"Coletas realizadas na competência atual (MM/AAAA)"`, usando o mês corrente formatado.

### Resultado

- O card "Coletas Confirmadas" passa a refletir apenas o volume do mês vigente, dando uma leitura mais útil de produtividade.
- Sem impacto em schema, migrations ou outros relatórios.
