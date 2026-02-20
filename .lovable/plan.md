
## Simplificar busca de empreendimentos para uma única tabela

### Problema atual

O `fetchEmpreendimentos` em `src/components/rastreamento/LocalizacaoOperadores.tsx` (linhas 74–89) busca **apenas** da tabela `empreendimentos`, que tem somente 2 registros georreferenciados.

### Solução

Trocar a origem dos dados para **`empreendimentos_terceirizados`**, que já possui 97+ condomínios com `latitude` e `longitude` cadastrados — uma única query, sem complexity extra.

### Alteração técnica

**Arquivo: `src/components/rastreamento/LocalizacaoOperadores.tsx`** — somente a função `fetchEmpreendimentos`:

```typescript
// ANTES
const { data, error } = await supabase
  .from('empreendimentos')
  .select('id, nome, endereco, latitude, longitude')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);

// DEPOIS
const { data, error } = await supabase
  .from('empreendimentos_terceirizados')
  .select('id, nome, endereco, latitude, longitude')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);
```

Só essa linha muda. Nenhuma outra lógica precisa ser alterada — os marcadores, popups e toggle continuam funcionando exatamente como estão.
