

## Plano: Unificar campo de busca e seleção de condomínio

### Problema
Atualmente existem dois campos separados: um `Input` para buscar e um `Select` para escolher. O usuário quer um único campo autocomplete.

### Solução
Substituir os dois campos por um único `Input` com dropdown de sugestões (mesmo padrão já usado em `ColetorNotificacoes.tsx`):
- Ao digitar, filtra os empreendimentos e mostra lista suspensa
- Ao clicar em uma sugestão, preenche o campo e define o `empreendimentoId`
- Botão X para limpar seleção
- Quando selecionado, exibe o nome + rota/UF no input

### Arquivo alterado
**`src/components/medicao-terceirizada/NovaColetaManualDialog.tsx`** (linhas 133-153)
- Remover imports de `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Adicionar estado `showSuggestions` (boolean)
- Substituir os dois campos por um `Input` com `onChange` que filtra + mostra dropdown absoluto
- Ao selecionar: setar `empreendimentoId`, preencher `buscaEmp` com nome, fechar dropdown
- Ao limpar: resetar ambos estados

