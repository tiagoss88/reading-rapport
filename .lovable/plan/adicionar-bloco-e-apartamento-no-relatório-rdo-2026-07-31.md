# Adicionar Bloco e Apartamento no relatório RDO

## O que será feito
Incluir duas colunas — "Bloco" e "Apartamento" — logo após a coluna "Condomínio" no relatório RDO de Serviços, tanto na tabela na tela quanto nas três exportações (PDF, Excel e CSV). Quando o serviço não tiver bloco ou apartamento, a célula fica com "-" (vazia nas exportações).

Ordem final das colunas:
Data | Condomínio | Bloco | Apartamento | Tipo Serviço | Técnico | Status | Valor (R$)

## Detalhes técnicos
- `src/hooks/useRelatorioServicos.tsx`: incluir `bloco` e `apartamento` no `select` e no objeto de resultado.
- `src/components/relatorios/TabelaRelatorio.tsx`: novos `TableHead`/`TableCell` no caso `rdo_servicos`.
- `src/lib/exportPDF.ts`, `src/lib/exportCSV.ts` e `src/components/relatorios/ExportacaoButtons.tsx` (Excel): acrescentar os dois campos nos headers e nas linhas do caso `rdo_servicos`, mantendo o formato de moeda já aplicado na coluna de valor.
