## Problema

Hoje a sugestão de divisão gera clusters ruins mesmo com todos os condomínios georreferenciados. Revisando `src/lib/sugerirDivisaoRota.ts`, encontrei as causas:

1. **Distância errada** — usa distância euclidiana em graus (`Δlat² + Δlng²`). Como 1° de longitude ≠ 1° de latitude fora do equador, clusters ficam "esticados" no eixo E-O.
2. **K-means++ pseudo-determinístico** — a primeira semente é sempre o índice 0 e as próximas escolhem sempre o ponto na "metade do peso acumulado", sem múltiplas inicializações. Resultado: uma única partição, geralmente subótima.
3. **Centroides não-ponderados** — todos os condos pesam igual, mas o objetivo é balancear medidores. Um condo de 500 medidores desloca menos o centroide que deveria.
4. **Rebalanceamento destrói a compactação** — move condo por condo entre "mais pesado ↔ mais leve" apenas comparando distâncias ao centroide, com uma "trava" arbitrária (`1.2×` / `1.5×`). Em UFs com poucos condos isso troca pontos entre regiões distantes.
5. **Sem-coordenadas jogados no técnico mais leve** — mesmo quando poderiam ser inferidos por cidade/bairro (mas isso é secundário; ver nota).
6. **Ordenação de clusters só por latitude** — o casamento cluster → técnico é feito só pela latitude média, ignorando longitude/vizinhança.

## Nova metodologia

Substituir o algoritmo por um **k-means ponderado + capacitado geográfico**:

1. **Distância Haversine** (km reais) em vez de euclidiana em graus.
2. **K-means++ real, best-of-N inicializações** (ex.: 10 rodadas com sementes aleatórias ponderadas por d², escolhe a partição com menor inércia total = soma das distâncias ao centroide, ponderada por medidores).
3. **Centroides ponderados por medidores** — deslocamento proporcional ao peso do condo.
4. **Atribuição capacitada** — em vez de "mover do maior pro menor", cada iteração atribui os condos ao cluster mais próximo respeitando um teto (`média × (1 + tolerância)`). Ordena condos por medidores decrescentes e aloca cada um no cluster mais próximo que ainda cabe. Isso mantém compactação e balanceamento juntos.
5. **Tolerância única e clara** — expor no dialog "Tolerância de balanceamento" (10% / 20% / 30%), removendo os 3 switches confusos e a "trava" mágica.
6. **Casamento cluster → técnico por proximidade sequencial** — ordena por longitude e depois latitude (varredura O-L, N-S) em vez de só latitude.
7. **Sem-coordenadas** — mantém a distribuição atual (técnico mais leve), mas destaca no resumo.
8. **Métricas visíveis no resultado** — além de "desvio %" e "km", mostrar "raio máximo (km)" do cluster para deixar óbvia a qualidade geográfica.

## Mudanças no dialog (`SugerirDivisaoDialog.tsx`)

- Remover switches `Balancear medidores` / `Agrupar por proximidade` / `Priorizar região` (o novo algoritmo faz os dois sempre).
- Adicionar um seletor único: **Tolerância de balanceamento**: `Rígida (±10%)` / `Média (±20%)` / `Frouxa (±30%)`. Default: Média.
- Adicionar coluna "raio máx" no card de cada técnico.

## Arquivos afetados

- `src/lib/sugerirDivisaoRota.ts` — reescrita do algoritmo (mantém a mesma assinatura pública `sugerirDivisao` para não quebrar callers; `SugestaoOpcoes` passa a ter `tolerancia: 'rigida' | 'media' | 'frouxa'`).
- `src/components/medicao-terceirizada/SugerirDivisaoDialog.tsx` — troca os 3 switches pelo seletor de tolerância e mostra o raio máx.

Sem mudanças no banco, nas rotas ou na lógica de aplicação (`rotas_leitura` continua igual).

## Detalhes técnicos

```text
Haversine(a,b) = 2R·asin(√(sin²(Δφ/2) + cos(φa)·cos(φb)·sin²(Δλ/2))),  R=6371 km

Loop principal (por inicialização):
  centroides ← kmeans++ ponderado por medidores
  repetir até estabilizar (máx 30 iter):
    ordena condos por medidores desc
    para cada condo c:
      candidatos ← clusters ordenados por Haversine(c, centroide)
      atribui ao primeiro que tenha total + c.medidores ≤ teto
      se nenhum couber, atribui ao mais próximo (tolerância será relaxada)
    recalcula centroides ponderados
  inércia ← Σ medidores_c · Haversine(c, centroide_do_cluster)²

Escolhe a inicialização com menor inércia.
```

Teto = `mediaMedidores × (1 + tolerancia)` com `tolerancia ∈ {0.10, 0.20, 0.30}`. Se depois de N iterações algum cluster estourar (todos os condos "não coubem"), o teto é multiplicado por 1.1 e refaz — garante convergência mesmo com condos gigantes.
