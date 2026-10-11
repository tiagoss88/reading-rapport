# Módulo Financeiro — controle de pagamentos por OS

## Objetivo
Saber, para cada serviço executado, quanto foi cobrado, quanto foi recebido e o que está pendente.

## O que o usuário verá

**Menu Operação > Financeiro** (somente administradores), com 3 abas:

1. **Contas a receber** — lista de OS executadas com valor do serviço.
   - Colunas: Nº OS, data de execução, condomínio/unidade, morador, tipo, técnico, valor, recebido, saldo, situação (Pendente / Parcial / Pago / Isento).
   - Filtros: período, UF, situação, forma de pagamento, busca por OS/condomínio/morador.
   - Totais no topo: a receber, recebido, pendente, nº de OS em aberto.
   - Botão **Registrar recebimento** em cada OS.
2. **Recebimentos** — histórico de todos os lançamentos (data, valor, forma, quem lançou, observação), com opção de estornar lançamento errado.
3. **Resumo** — totais por mês, UF, forma de pagamento e técnico; lista de OS pendentes há mais de X dias.

**Registrar recebimento** (janela): data do pagamento, valor (sugere o saldo), forma (Pix, dinheiro, cartão, boleto, transferência), observação. Permite pagamentos parciais; a situação atualiza sozinha. Opção "Marcar como isento" com motivo.

**Técnico em campo**: continua informando forma de pagamento e valor ao fechar a OS (campos que já existem). Isso aparece no Financeiro como "Informado pelo técnico — aguardando conferência"; o escritório confirma o recebimento real.

**Relatórios > Financeiro**: Contas a receber, Recebimentos por período e Inadimplência, com exportação PDF/Excel/CSV.

**Editar Serviço / Detalhes**: bloco somente leitura com situação financeira da OS.

## Detalhes técnicos
- Script idempotente `supabase/manual/financeiro.sql`:
  - Tabela `financeiro_recebimentos` (servico_id, data_pagamento, valor, forma_pagamento, observacao, criado_por, estornado_em, estornado_por, motivo_estorno) com GRANTs e RLS só admin.
  - Tabela `financeiro_situacao_os` (servico_id único, isento, motivo_isencao) — admin.
  - View `financeiro_contas_receber` juntando `servicos_nacional_gas` (valor_servico, forma_pagamento informada) + soma de recebimentos não estornados, calculando saldo e situação.
  - Índices por servico_id e data_pagamento.
  - Nenhum trigger em `servicos_nacional_gas` (fechar OS nunca depende do financeiro).
- Front: `src/pages/Operacao/Financeiro.tsx` com `React.lazy` + `ErrorBoundary` e checagem de tabela ausente (PGRST205) mostrando aviso "rode o script".
- Hook `useFinanceiro.ts` (React Query), `RegistrarRecebimentoDialog.tsx`, aba de relatórios reutilizando `exportPDF/exportCSV`.
- Rotas/menu em `App.tsx` e `Layout.tsx`; card em `ServicoNacionalGasDialog.tsx`.
- Registrar regra em `AGENTS.md`: financeiro isolado em tabelas próprias, sem triggers na OS.

## Para ativar
Rodar o script `financeiro.sql` no banco oficial e publicar.
