
## Corrigir o “Erro ao salvar” ao confirmar serviço

### Diagnóstico
O problema atual não está mais no formulário de execução.

Os uploads de foto e assinatura estão funcionando, mas o salvamento falha no `update` final porque o preview em execução está apontando para um backend diferente do backend configurado neste projeto. No backend atual do projeto, os campos da execução já existem; no backend que está respondendo ao preview, pelo menos `assinatura_url` não existe, e por isso o serviço não conclui.

### O que vou corrigir
1. Realinhar o preview para usar o backend correto do projeto atual.
2. Confirmar que a estrutura ativa da tabela `servicos_nacional_gas` tenha estes campos:
   - `forma_pagamento`
   - `valor_servico`
   - `cpf_cnpj`
   - `assinatura_url`
3. Revalidar o fluxo completo de confirmação do serviço.
4. Melhorar a mensagem de erro em tela para não mostrar apenas “Erro ao salvar”, mas sim um diagnóstico mais claro caso haja novo desalinhamento de estrutura.

### Arquivos / áreas impactadas
- `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`
  - manter o fluxo atual de upload e confirmação
  - melhorar o tratamento da falha retornada pelo backend
- Backend do projeto
  - alinhar a conexão usada pelo preview
  - garantir a migration ativa da tabela `servicos_nacional_gas`

### Resultado esperado
Ao clicar em “Concluir Serviço”, o sistema deverá:
- enviar fotos e assinatura normalmente
- atualizar o serviço para `executado`
- salvar observação, forma de pagamento, valor, CPF/CNPJ e assinatura
- permitir visualizar esses dados depois no detalhe da execução

### Detalhes técnicos
- Evidência atual:
  - upload da foto: sucesso
  - upload da assinatura: sucesso
  - falha acontece só no `PATCH` de `servicos_nacional_gas`
- O código já está preparado para os campos novos
- Os tipos gerados do projeto também já incluem `assinatura_url`
- Portanto, a correção principal é de alinhamento do backend ativo no preview, não de layout, câmera, compactação ou canvas
