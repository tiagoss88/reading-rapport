

## Adicionar coluna "Data Solicitação" na tabela de serviços

### Alteração: `src/pages/MedicaoTerceirizada/Servicos.tsx`

Adicionar uma nova coluna **"Solicitação"** na tabela, entre "UF" e "Agendamento", exibindo o campo `data_solicitacao` formatado como `dd/MM/yyyy`. Quando não houver data, exibirá "-".

1. Adicionar `<TableHead>Solicitação</TableHead>` após a coluna "UF" (linha 323)
2. Adicionar `<TableCell>` correspondente após a célula de UF (após linha 363), formatando `servico.data_solicitacao` com `format(new Date(...), 'dd/MM/yyyy')`
3. Atualizar o `colSpan` do estado vazio de `10` para `11`

