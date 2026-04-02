

## Plano: Ícone de detalhes da execução para serviços executados

### O que muda

Na coluna **Ações** da tabela de serviços, adicionar um novo ícone (olho — `Eye`) que aparece **apenas** quando o status é `executado`. Ao clicar, abre um dialog exibindo os dados preenchidos pelo operador em campo.

### Novo componente: `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx`

Dialog que recebe o `servicoId`, busca os dados do serviço no banco e exibe:

- **Observação do técnico** (campo `observacao`, parseando o formato existente que separa fotos e texto)
- **Fotos do serviço** (extraídas da `observacao`, exibidas em grid clicável)
- **Forma de pagamento** (`forma_pagamento`)
- **Valor do serviço** (`valor_servico`, formatado como R$)
- **CPF/CNPJ** (`cpf_cnpj`)
- **Assinatura do cliente** (`assinatura_url`, exibida como imagem)

Cada seção com ícone descritivo e renderização condicional (só aparece se o dado existir).

### Alteração: `src/pages/MedicaoTerceirizada/Servicos.tsx`

1. Importar `Eye` do lucide-react e o novo `DetalhesExecucaoDialog`
2. Adicionar estado `detalhesDialogOpen` e `detalhesServicoId`
3. Na coluna de ações (linha ~389-396), adicionar botão com ícone `Eye` condicionado a `servico.status_atendimento === 'executado'`
4. Renderizar o `DetalhesExecucaoDialog` no final do componente

### Detalhes técnicos

- O campo `observacao` usa formato concatenado: `Fotos comprovante: [URLs] | Obs: [texto]`. O dialog fará parsing para separar fotos e texto.
- A assinatura é uma URL de imagem PNG armazenada no storage.

