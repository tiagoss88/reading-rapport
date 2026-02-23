

## Adicionar filtro de Status ao Relatório RDO

O usuário quer filtrar os resultados do relatório RDO por status do serviço (agendado, em_andamento, concluido, etc.).

### Arquivos a editar

**1. `src/pages/Relatorios.tsx`** — Adicionar campo `statusServico` ao tipo `FiltrosRelatorioType`:
```typescript
export interface FiltrosRelatorioType {
  // ... campos existentes
  statusServico?: string; // novo
}
```

**2. `src/components/relatorios/FiltrosRelatorio.tsx`** — Adicionar o Select de Status após o filtro de Técnico:
- Opções: Todos, Agendado, Em Andamento, Concluído, Cancelado, Pendente, Executado
- Valor salvo em `filtros.statusServico`

**3. `src/hooks/useRelatorioServicos.tsx`** — Aplicar o filtro nas queries:
- Na query `servicos`: `.eq('status', statusServico)` quando definido
- Na query `servicos_nacional_gas`: `.eq('status_atendimento', statusServico)` quando definido

### Detalhes técnicos

As duas tabelas usam nomes de coluna diferentes (`status` vs `status_atendimento`) e valores de status ligeiramente diferentes. O filtro será aplicado em ambas as queries separadamente, garantindo que apenas os serviços com o status selecionado sejam retornados.

Valores de status possíveis:
- Serviços internos (`servicos`): agendado, em_andamento, concluido, cancelado
- Serviços Nacional Gás (`servicos_nacional_gas`): pendente, agendado, executado, cancelado

O Select mostrará todos os valores possíveis, e cada query filtrará pelo valor correspondente à sua tabela.

