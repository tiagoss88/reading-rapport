# RDO por Data de Execução

Novo relatório em Relatórios de Serviços chamado **RDO - Data de Execução**, que mostra quando a ordem de serviço foi realmente fechada, em vez da data de solicitação. O RDO atual continua existindo, sem alteração.

## Como a data de execução é obtida

O cadastro de serviços não tem um campo próprio de "data de execução". O sistema guarda um histórico de mudanças de situação de cada serviço. A data de fechamento será a data em que a situação passou para "executado" (ou "concluído"). Quando não houver esse registro no histórico, usa-se a data da última alteração do serviço, e o relatório indica isso.

Serviços ainda não fechados aparecem com a data de execução em branco (conforme escolhido: todas as OS, com filtro de situação disponível).

## Colunas

Data de Execução, Condomínio, Bloco, Apartamento, Tipo de Serviço, Técnico, Situação, Valor (R$).

## Filtros

Período (início/fim) aplicado sobre a data de execução, Tipo de Serviço, Técnico, Situação e UF — os mesmos do RDO atual.

## Exportações

Excel/CSV e PDF com as mesmas colunas e o mesmo padrão visual dos demais relatórios, com o período de execução no cabeçalho do PDF.

## Detalhes técnicos

- Novo tipo `rdo_servicos_execucao` em `TipoRelatorio` (`src/pages/Relatorios.tsx`) e nova entrada na categoria Serviços em `RelatorioSelector.tsx`.
- Novo hook `src/hooks/useRelatorioServicosExecucao.tsx`:
  - consulta `servicos_nacional_gas` (mesmos filtros do RDO atual, excluindo tipos de leitura);
  - consulta `servicos_nacional_gas_historico` filtrando `campo_alterado = 'status_atendimento'` e `valor_novo in ('executado','concluido')`, pegando o registro mais recente por `servico_id`;
  - monta `data_execucao` a partir de `historico.created_at`; fallback para `updated_at` quando o serviço está fechado sem histórico; `null` quando não fechado;
  - filtra pela janela `dataInicio`/`dataFim` sobre `data_execucao`, mantendo os sem data apenas quando não há filtro efetivo, e ordena por data de execução decrescente.
- `FiltrosRelatorio.tsx`: reutiliza o mesmo bloco de filtros do `rdo_servicos` para o novo tipo e chama o novo hook.
- `TabelaRelatorio.tsx`, `exportCSV.ts`, `exportPDF.ts`: novo caso com as colunas acima e título "RDO - Relatório por Data de Execução".
- Sem mudanças de banco, RLS ou dados existentes.
