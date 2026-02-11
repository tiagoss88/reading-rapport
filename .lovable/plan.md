

## Corrigir balanceamento de carga no algoritmo de rotas

### Problema
O algoritmo k-means atual agrupa empreendimentos apenas por proximidade geografica, ignorando completamente o peso (quantidade de medidores). Isso causa rotas desbalanceadas onde algumas acumulam 2500+ medidores enquanto outras ficam com 700.

### Solucao
Adicionar uma fase de **rebalanceamento pos k-means** que redistribui empreendimentos entre rotas vizinhas para manter todas dentro da faixa-alvo (700-850 medidores por rota, ajustada por leituristas).

### Como funciona

O k-means continua agrupando por proximidade geografica (fase 1), mas apos o agrupamento, uma segunda fase redistribui empreendimentos de rotas sobrecarregadas para rotas vizinhas com capacidade disponivel:

```text
Fase 1: k-means normal (proximidade geografica) - ja existente
Fase 2: Rebalanceamento iterativo (novo)
  Repetir ate 50 vezes:
    1. Encontrar a rota com mais medidores acima da meta maxima
    2. Encontrar o empreendimento dessa rota mais proximo de outra rota que esteja abaixo da meta maxima
    3. Mover esse empreendimento para a rota vizinha
    4. Parar quando todas as rotas estiverem dentro da faixa ou nao houver mais movimentos possiveis
```

### Alteracoes

**Arquivo:** `src/lib/routeOptimizer.ts`

- Adicionar funcao `rebalanceClusters` que recebe os pontos, as atribuicoes do k-means, os centroides, e os limites min/max da meta
- A funcao identifica clusters acima do limite maximo e move pontos para clusters vizinhos que ainda tenham capacidade
- A escolha do ponto a mover prioriza o ponto mais proximo do centroide do cluster destino (mantem coerencia geografica)
- Chamar `rebalanceClusters` dentro de `optimizeRoutes` apos o k-means convergir, antes de renumerar as rotas
- Passar `metaMin` e `metaMax` como parametros para `optimizeRoutes` (com defaults para manter compatibilidade)

### Resultado esperado
Todas as rotas ficam o mais proximo possivel da faixa 700-850 medidores (ou a faixa ajustada para 2 leituristas), sem sacrificar totalmente a proximidade geografica.

