# Relatórios de Estoque

## O que muda para você
- No menu **Relatórios** aparece um novo item **Estoque** (visível só para administradores), ao lado de Leituras e Serviços.
- Dentro dele, três relatórios:
  1. **Saldo atual** — cada material com saldo por armazém, total, estoque mínimo e indicação "abaixo do mínimo". Filtros: armazém, categoria, só ativos.
  2. **Movimentações no período** — data/hora, armazém, material, tipo (entrada, saída, ajuste, transferência), quantidade, motivo, protocolo da OS. Filtros: período, armazém, material, tipo. Totais de entradas e saídas no fim.
  3. **Consumo por serviço** — material gasto nas OS fechadas no período, agrupado por tipo de serviço, com opção de ver por técnico e por OS (protocolo). Filtros: período, armazém/UF, tipo de serviço, técnico.
- Todos com exportação em PDF, Excel e CSV, no mesmo padrão dos relatórios atuais.
- Se o estoque ainda não estiver instalado no banco, a página mostra um aviso e o resto do sistema continua funcionando.

## Detalhes técnicos
- Nova página `src/pages/RelatoriosEstoque.tsx`, rota `/relatorios/estoque` em `App.tsx` (lazy + ErrorBoundary + PermissionRoute admin), item no dropdown de Relatórios em `Layout.tsx` (só admin).
- Página própria (não reutiliza `FiltrosRelatorio`/`TabelaRelatorio`, que já estão grandes): seletor dos 3 tipos, filtros, tabela e botões de exportação.
- Hook `src/hooks/useRelatoriosEstoque.ts` reutilizando `sbEstoque`, `useEstoqueInstalacao`, `useArmazens` de `useEstoque.ts`:
  - Saldo: `materiais` + `v_estoque_saldo_armazem`.
  - Movimentações: `estoque_movimentacoes` no período + nomes de material/armazém + protocolo; par com `transferencia_id` exibido como transferência.
  - Consumo: saídas com `servico_id` no período, cruzadas com `servicos_nacional_gas` (tipo_servico, tecnico_id, uf, protocolo) e `operadores` (nome).
- Exportação: utilitário `src/lib/exportEstoque.ts` (jsPDF/autotable paisagem, xlsx, CSV) seguindo o estilo de `exportPDF.ts`.
- Nenhuma mudança de banco, regras de acesso ou telas existentes.
