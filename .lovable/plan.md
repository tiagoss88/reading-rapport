## Objetivo
Mostrar o nome do técnico alocado ao lado do horário/turno no card de serviço da tela do coletor (`/coletor/servicos-terceirizados`).

## Alterações

**`src/pages/ColetorServicosTerceirizados.tsx`**

1. Incluir o técnico no `select` da consulta em `servicos_nacional_gas`:
   - Adicionar `tecnico:operadores!servicos_nacional_gas_tecnico_id_fkey(nome)` ao select (mesmo padrão já usado em `useRelatorioColetasSemPendencia` e `DetalhesExecucaoDialog`).
2. Estender a interface local de serviço com `tecnico?: { nome: string } | null`.
3. No card (linha ~440, onde é renderizado `data_agendamento · turno`), acrescentar após o turno um separador `·` seguido de um ícone `User` (lucide) + nome do técnico, quando existir.
   - Exemplo visual: `16/07 · Tarde · 👤 Mateus`
   - Se não houver técnico atribuído, não renderiza nada extra (mantém layout atual).
4. Manter as mesmas classes tipográficas/tamanho já usados na linha do horário para preservar a estética compacta.

Sem alterações de dados, RLS ou lógica de negócio — apenas leitura adicional e ajuste visual do card.