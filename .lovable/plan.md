Ajustar a tabela da aba **Serviços** (Medição Terceirizada › Serviços) conforme solicitado.

### Alterações
1. **Remover a coluna Protocolo** do cabeçalho e das linhas da tabela de serviços.
2. **Reposicionar a coluna UF** para imediatamente antes da coluna Origem.
3. **Atualizar o `colSpan`** da linha vazia ("Nenhum serviço encontrado") de 13 para 12, refletindo a nova quantidade de colunas.
4. **Remover o ordenador (sort) da coluna Protocolo** do cabeçalho, já que a coluna não será mais exibida.

### Ordem das colunas após a mudança
Checkbox | UF | Origem | Solicitação | Condomínio | Bloco/Apto | Morador | Tipo | Agendamento | Técnico | Status | Ações

### Escopo
- Apenas a visualização da tabela na aba **Serviços** (`src/pages/MedicaoTerceirizada/Servicos.tsx`).
- Nenhuma alteração de backend, banco de dados, filtros de busca, outros diálogos ou abas (Agenda/Urgências).
- A busca por protocolo continua funcionando no campo de pesquisa, mesmo sem a coluna visível.

### Validação
- Verificar no preview que a coluna Protocolo não aparece.
- Verificar que UF fica antes de Origem.
- Confirmar que a tabela continua responsiva e sem quebras de layout na resolução atual (1070px).