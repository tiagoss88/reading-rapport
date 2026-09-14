# Relatório: Serviços Recebidos com Atraso

Novo relatório para comprovar que a GTI enviou solicitações já vencidas, comparando a data em que o serviço foi solicitado com o momento exato em que ele entrou no sistema (importação da planilha ou cadastro manual).

## O que o relatório mostra

Apenas os serviços cujo registro no sistema ocorreu depois da data de solicitação, a partir do número mínimo de dias escolhido.

Colunas:
- Protocolo
- UF
- Condomínio / Bloco / Apartamento
- Tipo de serviço
- Data da solicitação (dd/MM/yyyy)
- Data e hora da inclusão no sistema (dd/MM/yyyy HH:mm)
- Dias de atraso (diferença entre as duas datas)
- Situação atual do atendimento

Ordenação: maior atraso primeiro.

## Filtros

- Período de inclusão no sistema (início / fim) — quando a planilha foi lançada
- Atraso mínimo em dias (padrão 1)
- UF
- Tipo de serviço
- Situação

## Exportação

PDF, Excel e CSV, no mesmo padrão dos demais relatórios, com o período e o atraso mínimo impressos no cabeçalho para servir como evidência.

## Onde fica

Em Relatórios de Serviços, como novo item na lista: "Serviços Recebidos com Atraso".

## Detalhes técnicos

- Novo hook `src/hooks/useRelatorioServicosRecebidosAtraso.tsx`, lendo `servicos_nacional_gas` (`data_solicitacao`, `created_at`, `numero_protocolo`, condomínio, bloco, apartamento, tipo, uf, status).
- `created_at` é o carimbo de quando o registro entrou no sistema (importação ou cadastro manual); é essa hora que aparece como "inclusão".
- Atraso calculado em dias corridos entre `data_solicitacao` e a data local (UTC-3) de `created_at`; datas instanciadas com `T00:00:00` conforme o padrão do projeto.
- Filtro de período aplicado sobre `created_at`; registros sem `data_solicitacao` ficam fora.
- Novo tipo `servicos_recebidos_atraso` em `TipoRelatorio` e campo `atrasoMinimoDias` em `FiltrosRelatorioType` (`src/pages/Relatorios.tsx`).
- Ajustes em `RelatorioSelector.tsx` (categoria Serviços), `FiltrosRelatorio.tsx` (novos filtros), `TabelaRelatorio.tsx` (colunas), `exportPDF.ts`, `exportCSV.ts` e `ExportacaoButtons.tsx`.
- Sem alterações de banco, RLS ou dados existentes.
