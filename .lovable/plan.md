## Remover filtro "Periodicidade" do RDO de Serviços

### Contexto
O relatório RDO de Serviços já possui filtros de **Data Início** e **Data Fim**, tornando o campo "Periodicidade" (Diário/Semanal/Mensal) redundante. Confirmado que `filtros.periodicidade` não é consumido por nenhum hook de geração de relatório (`useRelatorioServicos`, etc.), apenas existe no formulário e nos defaults.

### Mudanças

**`src/components/relatorios/FiltrosRelatorio.tsx`**
- Remover o bloco `<div>` do Select de Periodicidade (linhas ~187-204) dentro do branch `tipoRelatorio === 'rdo_servicos'`.

### Não alterar
- O tipo `periodicidade?` em `src/pages/Relatorios.tsx` e os defaults em `RelatoriosServicos.tsx` / `RelatoriosLeituras.tsx` permanecem (campo opcional, sem efeito) para evitar churn em outros lugares. Se desejar, em uma etapa futura posso remover também do tipo.

### Resultado
A grade de filtros do RDO passa a mostrar: Data Início, Data Fim, Tipo de Serviço, Técnico, Status e UF — sem o seletor de Periodicidade.