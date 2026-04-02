

## Corrigir erro ao salvar serviço — valor com vírgula

### Problema

O campo "Valor do Serviço" aceita valores com vírgula (ex: `792,90`), mas `parseFloat("792,90")` retorna `NaN` em JavaScript, causando erro ao gravar no banco.

### Solução: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`

Na linha 188, substituir a conversão do valor para tratar a vírgula como separador decimal:

```tsx
// De:
valor_servico: valorServico ? parseFloat(valorServico) : null,

// Para:
valor_servico: valorServico ? parseFloat(valorServico.replace(',', '.')) : null,
```

Alteração de 1 linha. O operador poderá digitar tanto `792.90` quanto `792,90`.

