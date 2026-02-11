

## Corrigir algoritmo de balanceamento de rotas

### Problema raiz

O rebalanceamento atual falha em varios cenarios:

1. **Numero de rotas insuficiente**: `Math.round(totalPeso / metaPorRota)` pode arredondar para baixo, criando menos rotas do que o necessario. Ex: 5100 medidores / 750 = 6.8 -> 7 rotas. Mas 4600 / 750 = 6.13 -> 6 rotas, com capacidade maxima de 6 x 850 = 5100, muito apertado.

2. **Estrategia de movimento ineficiente**: O algoritmo tenta mover o ponto mais proximo do centroide destino, mas deveria priorizar mover os **menores pontos** primeiro (mais faceis de encaixar em clusters quase cheios).

3. **Apenas 100 iteracoes**: Para datasets grandes com muitos empreendimentos mal distribuidos, 100 iteracoes podem nao ser suficientes.

### Alteracoes no arquivo `src/lib/routeOptimizer.ts`

**1. Usar `Math.ceil` em vez de `Math.round` para calcular k**

Na funcao `optimizeRoutesWithConstraints`, trocar:
```
const k = Math.max(1, Math.round(totalPeso / metaPorRota));
```
por:
```
const k = Math.max(1, Math.ceil(totalPeso / metaPorRota));
```

Isso garante que sempre ha capacidade total suficiente para acomodar todos os medidores dentro do metaMax.

**2. Melhorar o algoritmo de rebalanceamento**

- Aumentar iteracoes de 100 para 500
- Ao buscar o melhor ponto para mover do cluster sobrecarregado, ordenar candidatos pelo menor peso primeiro (pontos menores sao mais faceis de realocar sem estourar o destino)
- Adicionar fallback: se nenhum ponto individual cabe em nenhum cluster existente, criar logica para tentar mover multiplos pontos pequenos em sequencia

**3. Adicionar validacao pos-rebalanceamento**

Apos o rebalanceamento, verificar se ainda existem clusters acima do metaMax. Se sim, tentar uma segunda passada mais agressiva que ignora a proximidade geografica e foca apenas em respeitar o limite de peso.

### Detalhes tecnicos da funcao `rebalanceClusters` melhorada

```text
rebalanceClusters(points, assignments, centroids, metaMax):
  maxIterations = 500
  
  para cada iteracao:
    1. Calcular peso total de cada cluster
    2. Encontrar o cluster mais sobrecarregado (maior excesso acima de metaMax)
    3. Se nenhum cluster excede metaMax -> parar (sucesso)
    4. Coletar todos os pontos do cluster sobrecarregado
    5. Ordenar esses pontos por peso CRESCENTE (menores primeiro)
    6. Para cada ponto (do menor ao maior):
       - Para cada cluster destino (do mais proximo ao mais distante):
         - Se clusterPeso[destino] + ponto.peso <= metaMax:
           - Mover o ponto -> proximo ciclo
    7. Se nenhum movimento foi possivel -> parar (impossivel melhorar)
```

### Resultado esperado

- Todas as rotas ficam dentro da faixa 700-850 medidores (ou o equivalente para 2 leituristas)
- Rotas que antes acumulavam 2000+ medidores serao divididas em rotas menores
- A coerencia geografica e mantida na medida do possivel, mas o respeito ao limite de peso tem prioridade

