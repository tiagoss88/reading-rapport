# Corrigir contagem duplicada na replicação de planejamento

## O que está acontecendo

No planejamento, uma mesma rota pode ter **vários operadores atribuídos ao mesmo empreendimento** — e cada atribuição gera uma linha própria em `rotas_leitura`. O diálogo "Replicar mês anterior" conta essas linhas cruas, então um empreendimento atendido por 2 operadores é contado 2 vezes, e seus medidores também. É por isso que a Rota 01 aparece com 36 empreendimentos / 2570 medidores em vez dos 18 clientes reais.

Observação: essa é a causa mais provável pelo padrão exato (18 → 36). A implementação começa confirmando isso no console antes de mudar os números exibidos.

## Correções

1. **Contagem por empreendimento único**
   - Agrupar os itens da rota por `empreendimento_id` antes de contar.
   - "36 empreend." passa a mostrar clientes distintos (18).
   - Total de medidores somado uma única vez por empreendimento.
   - O resumo final do diálogo ("Serão replicadas X rotas, Y empreendimentos, Z medidores") usa a mesma contagem.

2. **Inserção sem duplicar**
   - Ao replicar, gerar no máximo um registro por par (data destino + empreendimento + operador), eliminando pares repetidos.
   - Com "manter operadores" desligado, gerar apenas uma linha por empreendimento (sem operador).

3. **Empreendimentos que não apareciam nas rotas**
   - O aviso "Dia já planejado — será ignorado" faz a rota inteira ser pulada silenciosamente quando a data destino já tem planejamento e "substituir" está desmarcado.
   - Deixar isso explícito: destacar visualmente a linha ignorada e informar no resultado quantas rotas foram puladas por esse motivo, sugerindo marcar "substituir".

## Detalhes técnicos

Arquivo afetado: `src/components/medicao-terceirizada/ReplicarPlanejamentoDialog.tsx`

- No `useMemo` das linhas, criar `empreendimentosUnicos = Map<empreendimento_id, empreendimento>` a partir de `itens`; usar `size` para a contagem e somar `quantidade_medidores` sobre os valores do Map.
- Manter `itens` (linhas cruas) apenas para preservar as atribuições de operador na inserção.
- Na mutation, deduplicar `registros` por chave `${empreendimento_id}|${operador_id ?? ''}`.
