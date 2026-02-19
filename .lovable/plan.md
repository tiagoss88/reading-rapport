

## Remover campo "Vincular a Empreendimento" e vincular automaticamente

### O que muda
O campo separado "Vincular a Empreendimento" sera removido do formulario. Quando o usuario selecionar um condominio existente no autocomplete, o sistema buscara automaticamente o `empreendimento_id` associado a esse condominio (do ultimo servico cadastrado com esse nome) e preenchera internamente. Se o condominio for novo (digitado manualmente), o `empreendimento_id` ficara como `null`.

Isso simplifica o formulario e elimina a redundancia.

### Detalhes tecnicos

**Arquivo: `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`**

1. **Alterar a query de condominios** (linhas 72-83): em vez de buscar apenas `condominio_nome_original`, buscar tambem `empreendimento_id` para criar um mapa `nome -> empreendimento_id`

2. **Criar um mapa de vinculacao**: `useMemo` que mapeia cada nome de condominio ao seu `empreendimento_id` mais recente (caso haja)

3. **Auto-vincular ao selecionar**: quando o usuario seleciona um condominio no autocomplete, alem de preencher o nome, setar automaticamente `form.setValue('empreendimento_id', ...)` com o valor do mapa

4. **Limpar vinculacao ao digitar nome novo**: quando o usuario digita livremente (sem selecionar do autocomplete), limpar o `empreendimento_id` para `null`

5. **Remover o campo "Vincular a Empreendimento"** (linhas 251-276): remover o `FormField` inteiro do formulario, pois a vinculacao passa a ser automatica

