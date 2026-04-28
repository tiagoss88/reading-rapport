## Corrigir Relatório RDO de Serviços para mostrar apenas Serviços Nacional Gás

### Problema identificado
O relatório RDO está unindo registros de **duas tabelas diferentes**:
1. `servicos` (sistema legado de medição interna) — contém centenas de "Leitura"
2. `servicos_nacional_gas` (sistema atual da Nacional Gás) — onde estão religação, desligamento, visita técnica, etc.

Como o escopo do projeto é exclusivamente **Medição Nacional Gás**, a tabela `servicos` está poluindo o relatório com leituras antigas e escondendo os serviços reais.

Trecho atual de `src/hooks/useRelatorioServicos.tsx`:
```ts
// Query servicos internos (LEGADO - deve ser removida)
let queryInternos = supabase.from('servicos').select(...)
// Query servicos nacional gas (CORRETA)
let queryNacionalGas = supabase.from('servicos_nacional_gas').select(...)
```

Os dois resultados são concatenados em `resultados[]`, fazendo a "Leitura" do legado dominar a lista.

### Mudança

**Arquivo: `src/hooks/useRelatorioServicos.tsx`**
- Remover totalmente a query `queryInternos` (`servicos`) e o respectivo bloco de mapeamento.
- Manter apenas `servicos_nacional_gas` como fonte de dados do RDO.
- Remover o bloco condicional `ufFiltro ? Promise.resolve(...) : queryInternos.order(...)` — basta executar a query Nacional Gás direto.

### Resultado esperado
O relatório RDO passará a mostrar **apenas** serviços da `servicos_nacional_gas`: religação, religação automática, religação emergencial, desligamento, visita técnica, troca de medidor, etc. — sem as "Leituras" do sistema legado.

### Observação adicional
Caso depois da correção ainda apareçam registros com `tipo_servico = 'Leitura'` dentro de `servicos_nacional_gas`, o problema estará no **import da planilha** (mapeamento de coluna). Nesse caso vou inspecionar `ImportarPlanilhaDialog.tsx` em uma segunda etapa.