

## Adicionar busca de condominios no campo "Condominio" do Novo Servico

### O que muda
O campo "Condominio" no dialog de Novo Servico deixara de ser um input simples e passara a ter sugestoes automaticas conforme o usuario digita. As sugestoes virao dos nomes de condominios ja cadastrados na tabela `servicos_nacional_gas` (campo `condominio_nome_original`), permitindo localizar rapidamente um condominio existente. O usuario ainda podera digitar um nome novo que nao exista nas sugestoes.

### Detalhes tecnicos

**Arquivo: `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`**

1. Adicionar uma query para buscar nomes distintos de condominios existentes:
   - Query na tabela `servicos_nacional_gas`, selecionando `condominio_nome_original` distinto, ordenado alfabeticamente

2. Substituir o `<Input>` do campo `condominio_nome_original` (linhas 177-189) por um componente com autocomplete usando `<Popover>` + `<Command>` (cmdk), que:
   - Permite digitacao livre (o valor digitado e mantido mesmo sem selecionar uma sugestao)
   - Filtra as sugestoes conforme o texto digitado (minimo 2 caracteres)
   - Ao selecionar uma sugestao, preenche o campo com o nome completo
   - Mantem a validacao obrigatoria existente

3. O componente usara os mesmos padroes ja existentes no projeto (Popover/Command do shadcn, como usado em `CriarServico.tsx` para combobox de empreendimentos)

