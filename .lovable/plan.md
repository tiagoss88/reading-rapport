## Adicionar coluna "Valor do Serviço" no RDO

Incluir o valor de cada serviço no relatório RDO (tela, PDF e CSV) para facilitar o cálculo de comissões.

### Alterações

1. **`src/hooks/useRelatorioServicos.tsx`**
   - Incluir `valor_servico` no `select` da query em `servicos_nacional_gas`.
   - Adicionar o campo `valor_servico` (numérico, podendo ser `null`) ao objeto retornado.

2. **`src/components/relatorios/TabelaRelatorio.tsx`** (case `rdo_servicos`)
   - Novo `<TableHead>Valor (R$)</TableHead>` após "Status".
   - Nova célula formatada em BRL (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`), exibindo `-` quando ausente.
   - Alinhar valor à direita.

3. **`src/lib/exportPDF.ts`** (case `rdo_servicos`)
   - Acrescentar coluna "Valor (R$)" e formatar valor em BRL (ou `-`).

4. **`src/lib/exportCSV.ts`** (case `rdo_servicos`)
   - Acrescentar coluna "Valor (R$)" com o número formatado (vírgula decimal pt-BR).

### Fora do escopo

- Cálculo automático de comissão.
- Edição do valor pelo relatório (já existe no diálogo de edição do serviço).
- Totalizadores/somatório no rodapé (posso adicionar depois se desejado).
