
## Problema

Ao gerar as rotas, empreendimentos de bairros muito distantes acabam na mesma rota (ex.: Rota 01). Causas identificadas em `src/lib/routeOptimizer.ts`:

1. **Distância euclidiana em lat/lng** — ignora a distorção (1° de longitude ≠ 1° de latitude fora do equador). Isso deforma os clusters.
2. **Centroide inicial aleatório** — cada execução parte de um ponto diferente, gerando resultados instáveis e às vezes ruins.
3. **Rebalanceamento "agressivo" (2ª passagem)** — quando um cluster passa da meta, move pontos para **qualquer** cluster com espaço, **ignorando a distância**. É a principal razão de rotas ficarem misturando bairros distantes.
4. **K-means com só 20 iterações** e centroide não ponderado pelo nº de medidores.

## O que vou alterar (só `src/lib/routeOptimizer.ts`)

1. **Distância Haversine** (metros reais) substituindo a euclidiana em lat/lng.
2. **Inicialização k-means++ determinística** (seed baseada no conjunto de pontos) — resultados estáveis e mais bem espalhados.
3. **Centroide ponderado por `peso`** (nº de medidores) e mais iterações (até 50 com critério de parada por convergência).
4. **Rebalanceamento respeitando proximidade**:
   - 1ª passada: mover apenas para o cluster **mais próximo** que ainda caiba na `metaMax`.
   - Remover a 2ª passada "ignora geografia". Em vez disso, permitir uma **folga controlada** (ex.: até 10% acima de `metaMax`) antes de forçar movimento distante, e priorizar mover o ponto **mais próximo da fronteira** de outro cluster (não o menor peso).
5. **Pós-processo de compactação**: para cada cluster, se um ponto estiver muito mais próximo do centroide de outro cluster do que do próprio, trocar (respeitando capacidade). Reduz "outliers" que puxam a rota para outro bairro.
6. **Ordem de numeração das rotas** passa a considerar lat+lng (varredura em zigue-zague) em vez de só longitude, mantendo rotas vizinhas com números próximos.

Nenhuma mudança em UI, banco ou no fluxo do `Roteirizador.tsx` — apenas o algoritmo interno. A assinatura de `optimizeRoutes` e `optimizeRoutesWithConstraints` permanece igual.

## Detalhes técnicos

- `distance(a, b)` → Haversine em metros (R=6371000).
- `weightedCentroid(points)` → soma(lat·peso)/soma(peso).
- `selectInitialCentroids` → k-means++ com PRNG semeada por hash dos ids (determinístico).
- Convergência: parar quando nenhum ponto muda de cluster **ou** deslocamento máximo do centroide < 5 m.
- Rebalance: `metaMaxSoft = metaMax * 1.10` como folga; só move para vizinho mais próximo cujo `peso + candidato ≤ metaMaxSoft`. Se depois disso ainda houver cluster estourado, aceita-se a folga em vez de misturar bairros.

## Validação

- Rodar novamente com "Rota 01" na mesma base e conferir no mapa que os pontos ficam contíguos.
- Somatórios por rota devem continuar respeitando (aproximadamente) a meta configurada.
