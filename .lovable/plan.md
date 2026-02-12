
## Adicionar insercao manual de servicos

### O que muda
Adicionar um botao "Novo Servico" ao lado do botao "Importar Planilha" na pagina de Servicos, permitindo cadastrar um servico pontual manualmente atraves de um formulario em dialog.

### Alteracoes

**Arquivo 1: Novo componente `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`**

Criar um dialog com formulario completo para insercao manual, contendo os campos:
- **UF** (obrigatorio) - Select com opcoes BA e CE
- **Condominio** (obrigatorio) - Input texto livre + Select opcional para vincular a um empreendimento cadastrado
- **Bloco** - Input texto (opcional)
- **Apartamento** - Input texto (opcional)
- **Morador** - Input texto (opcional)
- **Telefone** - Input texto (opcional)
- **Email** - Input texto (opcional)
- **Tipo de Servico** (obrigatorio) - Input texto
- **Data Solicitacao** - Input date (opcional)
- **Data Agendamento** - Input date (opcional)
- **Turno** - Select manha/tarde (opcional)
- **Tecnico** - Select com operadores ativos (opcional)
- **Status** - Select (pendente, agendado, executado, cancelado), padrao "pendente"
- **Observacao** - Textarea (opcional)

O formulario usara `react-hook-form` + `zod` para validacao, seguindo o mesmo padrao do `ServicoNacionalGasDialog` existente. Ao salvar, fara um `insert` na tabela `servicos_nacional_gas` e invalidara a query `servicos-nacional-gas`.

Tambem buscara os empreendimentos cadastrados para permitir vinculacao opcional via select.

**Arquivo 2: `src/pages/MedicaoTerceirizada/Servicos.tsx`**

- Importar o novo componente `NovoServicoNacionalGasDialog`
- Adicionar estado `novoDialogOpen`
- Adicionar botao "Novo Servico" (com icone `Plus`) ao lado do botao "Importar Planilha" no header do card
- Renderizar o dialog controlado pelo estado

### Resultado esperado
O usuario tera um botao "Novo Servico" que abre um formulario completo para cadastrar solicitacoes pontuais sem precisar importar uma planilha.
