## Preencher valor do serviço automaticamente por tipo

### Alteração: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`

Adicionar um mapeamento de valores fixos por tipo de serviço e pré-preencher o campo "Valor do Serviço" ao carregar a tela de execução:

**Mapeamento:**

- `religacao` / `religacao automatica` → R$ 61,15  
`religacao` Emergencial  → R$ 88,94
- `desligamento` → R$ 36,55
- `visita tecnica` → R$ 88,94

**Implementação:**

1. Criar constante `VALORES_SERVICO` com o mapeamento tipo → valor
2. No `useState` de `valorServico`, inicializar com o valor correspondente ao `servico.tipo_servico` (comparação case-insensitive, normalizando acentos)
3. O operador ainda poderá editar o valor manualmente se necessário

Alteração pontual — apenas inicialização do estado.