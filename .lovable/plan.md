Ajustar a tabela da aba **Serviços** (Medição Terceirizada › Serviços) ocultando mais duas colunas conforme solicitado.

### Alterações
1. **Remover a coluna Agendamento** do cabeçalho e das linhas da tabela de serviços.
2. **Remover a coluna Técnico** do cabeçalho e das linhas da tabela de serviços.
3. **Atualizar o `colSpan`** da linha vazia ("Nenhum serviço encontrado") de 12 para 10, refletindo a nova quantidade de colunas.

### Ordem das colunas após a mudança
Checkbox | UF | Origem | Solicitação | Condomínio | Bloco/Apto | Morador | Tipo | Status | Ações

### Escopo
- Apenas a visualização da tabela na aba **Serviços** (`src/pages/MedicaoTerceirizada/Servicos.tsx`).
- Nenhuma alteração de backend, banco de dados, filtros de busca, outros diálogos ou abas (Agenda/Urgências).
- As informações de agendamento e técnico continuam disponíveis ao abrir o histórico/detalhes do serviço.

### Validação
- Verificar no preview que as colunas Agendamento e Técnico não aparecem.
- Confirmar que a tabela continua sem quebras de layout.