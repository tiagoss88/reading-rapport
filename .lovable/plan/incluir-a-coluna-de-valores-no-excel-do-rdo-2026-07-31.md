# Incluir a coluna de valores no Excel do RDO

## Problema
No relatório "RDO - Serviços", a tela, o PDF e o CSV já mostram a coluna "Valor (R$)", mas a exportação para Excel gera apenas Data, Condomínio, Tipo Serviço, Técnico e Status — o valor fica de fora.

## O que será feito
Adicionar a coluna "Valor (R$)" na exportação Excel do RDO, como último campo, na mesma ordem das outras exportações.

O valor será gravado como número real (não texto), com formato de moeda brasileira aplicado na célula, para permitir somas e filtros direto no Excel. Serviços sem valor ficam com célula vazia.

## Detalhes técnicos
- Arquivo: `src/components/relatorios/ExportacaoButtons.tsx`, função `exportarExcel`, caso `rdo_servicos`.
- Header: acrescentar `'Valor (R$)'`; linha: `item.valor_servico != null ? Number(item.valor_servico) : null`.
- Aplicar `z = 'R$ #,##0.00'` nas células da coluna de valor via `XLSX.utils` após montar a planilha, e definir larguras de coluna (`!cols`) para leitura.
- Nenhuma mudança em consulta de dados, PDF ou CSV.
