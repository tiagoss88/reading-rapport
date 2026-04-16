

## Adicionar campo "Origem" (Particular / BG / NGD) ao formulário de Novo Serviço

### O que muda

Adicionar um campo `Select` chamado **"Origem"** ao formulário `NovoServicoNacionalGasDialog.tsx` para que o usuário possa informar se o serviço é **Particular**, **BG** ou **NGD**. Esse valor será salvo na coluna `fonte` da tabela `servicos_nacional_gas`, que já existe.

### Arquivo: `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`

**Schema Zod:** Adicionar campo `fonte` com `z.enum(['particular', 'bg', 'ngd'], { required_error: 'Selecione a origem' })`

**Default value:** `fonte: undefined` (obrigatório selecionar)

**UI:** Novo `FormField` com `Select` na mesma linha do campo UF e Tipo de Serviço (grid de 3 colunas), com as opções:
- `particular` → "Particular"
- `bg` → "BG"  
- `ngd` → "NGD"

**Insert:** Substituir `fonte: 'manual'` por `fonte: data.fonte`

### Nenhuma migração necessária
A coluna `fonte` (text, nullable) já existe na tabela `servicos_nacional_gas`.

### Nenhum outro arquivo alterado

