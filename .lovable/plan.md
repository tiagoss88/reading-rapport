# Refinar a sugestão de divisão para priorizar região

## Diagnóstico

O algoritmo atual faz, nesta ordem:

1. **K-means geográfico** com sementes "farthest-first" — cria N clusters por proximidade.
2. **Rebalanceamento por medidores** — enquanto o técnico mais pesado tiver >15% acima da média, move o empreendimento de fronteira para o cluster mais leve.
3. **Ordenação norte→sul** e atribuição aos técnicos na ordem em que estão na lista.

O problema que gerou a mistura no caso do Paulo Vitor tem três causas:

- **Rebalanceamento agressivo.** A tolerância de 15% é muito estreita; para empurrar medidores até bater a meta, o algoritmo move condomínios que ficam geograficamente "no meio" de outro cluster, quebrando a coerência regional.
- **Sementes farthest-first pegam outliers.** Um condomínio isolado vira semente e "puxa" vizinhos distantes por falta de alternativa mais próxima.
- **Distância euclidiana em graus** é aceitável, mas não penaliza saltos grandes o suficiente frente ao ganho de balanceamento.

## O que muda

1. **Inverter a prioridade.** Regionalidade passa a ser a restrição forte; balanceamento vira ajuste fino.
2. **Sementes k-means++** em vez de farthest-first — reduz outliers e produz clusters mais compactos.
3. **Rebalanceamento com trava geográfica.** Um empreendimento só é movido para outro cluster se:
   - a distância ao centróide do novo cluster for **≤ 1,5× a distância ao centróide atual** (evita saltos regionais), **e**
   - a tolerância alvo de desequilíbrio subir de 15% para **25%** por padrão (equilíbrio "saudável", não perfeito).
4. **Score de compactação** exibido no preview: para cada técnico, mostrar a distância média entre os condomínios daquele cluster (em km aprox.) para o usuário perceber quando a divisão ficou espalhada.
5. **Novo toggle "Priorizar região (mais rígido)"** no diálogo — quando ligado, usa tolerância de 40% e trava de 1,2×; quando desligado, mantém o comportamento antigo (mais equilibrado, menos compacto). Padrão: **ligado**.
6. **Empreendimentos sem coordenadas** deixam de entrar em cluster geográfico e são listados numa faixa "Sem coordenadas — atribuir manualmente" no preview, com sugestão inicial no técnico mais leve (o usuário pode reatribuir clicando).

## Detalhes técnicos

- **Editar** `src/lib/sugerirDivisaoRota.ts`:
  - Substituir `farthestFirst` por `kmeansPlusPlus` (sementes proporcionais ao quadrado da distância mínima).
  - Reescrever `rebalancearPorMedidores` para aceitar `tolerancia` e `travaDistancia` como parâmetros e aplicar a restrição de "só move se não afastar demais".
  - Adicionar `calcularCompactacao(cluster)` — média das distâncias ao centróide, convertida grosseiramente em km (`grau × 111`).
  - Novo parâmetro na assinatura pública: `opcoes.priorizarRegiao: boolean`.
- **Editar** `src/components/medicao-terceirizada/SugerirDivisaoDialog.tsx`:
  - Novo `Switch` "Priorizar região (mais rígido)" com estado padrão `true`.
  - No card de preview de cada técnico, adicionar linha "Compactação: ~X km" abaixo do "% desvio".
  - Sinalizar separadamente empreendimentos sem coordenadas.

## Fora de escopo

- Trocar a fonte geográfica (endereço → geocoding). Se muitos condomínios estão sem lat/lng, esse é um problema à parte.
- Restringir cluster por bairro/CEP (o schema não tem essa coluna).
- Persistir preferência do toggle entre sessões.
