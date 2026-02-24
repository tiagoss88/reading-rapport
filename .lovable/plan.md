

## Corrigir status da Rota do Dia após upload do comprovante

### Diagnóstico

A "Rota do Dia" lê da tabela `rotas_leitura`, que tem seu próprio campo `status` (inicializado como `'pendente'`). Quando o operador confirma a coleta em `ColetorEmpreendimentoDetalhe`, o código insere um registro na tabela `servicos_nacional_gas` com `status_atendimento: 'executado'`, mas **nunca atualiza o `status` da `rotas_leitura`**. Por isso, mesmo após o upload da foto, a Rota do Dia continua mostrando "Pendente".

### Solução

Após inserir o registro na `servicos_nacional_gas`, atualizar a linha correspondente em `rotas_leitura` para `status: 'concluido'`.

### Arquivo a editar

**`src/pages/ColetorEmpreendimentoDetalhe.tsx`** (linhas 98-111)

Após o insert na `servicos_nacional_gas`, adicionar:

```typescript
// Atualizar status da rota_leitura para concluido
const hoje = new Date().toISOString().split('T')[0]
await supabase
  .from('rotas_leitura')
  .update({ status: 'concluido' })
  .eq('empreendimento_id', empreendimentoId!)
  .eq('data', hoje)
```

Isso garante que, se o empreendimento estiver na rota do dia, seu status será atualizado automaticamente para "Concluído" na mesma operação de confirmação da coleta.

