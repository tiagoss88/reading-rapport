

## Roteirizador Inteligente com Regras de Negocio

### Resumo
Evoluir o Roteirizador atual para respeitar regras de negocio especificas: meta de 700-850 medidores por rota, nao misturar UFs diferentes na mesma rota, calcular automaticamente a quantidade ideal de rotas, e exibir indicador de leituristas por rota.

---

### O que muda para o usuario

1. **Calculo automatico de rotas** - Em vez de digitar manualmente a quantidade, o sistema calcula com base na meta de 700-850 medidores por rota
2. **Meta de medidores visivel** - Cada rota mostra se esta dentro da faixa ideal (700-850), acima ou abaixo
3. **Separacao por UF obrigatoria** - O algoritmo nunca mistura empreendimentos de UFs diferentes na mesma rota
4. **Indicador de leituristas** - Cada rota mostra quantos leituristas sao necessarios (1 ou 2), baseado no total de medidores
5. **Campo "Leituristas por rota"** - Input para definir se a rota terá 1 ou 2 leituristas (ajusta a meta proporcionalmente)

---

### Alteracoes

#### 1. Modificar: `src/lib/routeOptimizer.ts`
- Adicionar campo `grupo` (string) ao `GeoPoint` para representar a UF
- Nova funcao `optimizeRoutesWithConstraints` que:
  - Separa os pontos por grupo (UF)
  - Para cada grupo, calcula k = totalMedidores / metaPorRota (arredondado)
  - Executa k-means dentro de cada grupo separadamente
  - Renumera as rotas sequencialmente entre todos os grupos
- Manter a funcao `optimizeRoutes` original como fallback

#### 2. Modificar: `src/components/medicao-terceirizada/Roteirizador.tsx`
- Remover o input "Quantidade de Rotas" manual
- Adicionar campo "Meta por rota" (default 750, range 700-850)
- Adicionar campo "Leituristas por rota" (1 ou 2, default 1; se 2, a meta dobra para 1400-1700)
- O numero de rotas e calculado automaticamente com base na meta
- Na lista de resultados, exibir:
  - Total de medidores com indicador de cor (verde = dentro da meta, amarelo = proximo, vermelho = fora)
  - Icone de leituristas (1 ou 2 pessoas)
  - Nome da UF do grupo
- Adicionar resumo geral: total de rotas, total de medidores, media por rota

---

### Secao Tecnica

#### Novo algoritmo (`optimizeRoutesWithConstraints`)

```text
Entrada: pontos[] = {id, lat, lng, peso, grupo}, metaPorRota = 750
Saida: pontos[] com campo 'rota' atribuido

1. Agrupar pontos por 'grupo' (UF)
2. Para cada grupo:
   a. totalPeso = soma dos pesos do grupo
   b. k = Math.round(totalPeso / metaPorRota)
   c. k = Math.max(1, k)
   d. Executar k-means no subconjunto (reutilizando optimizeRoutes)
3. Renumerar rotas sequencialmente: grupo1 rotas 1..k1, grupo2 rotas k1+1..k1+k2, etc.
4. Retornar todas as atribuicoes
```

#### Interface GeoPoint atualizada
- Adicionar `grupo: string` (UF do empreendimento)

#### Interface SimulationResult atualizada
- Adicionar `uf: string` para exibir de qual UF e a rota
- Adicionar `dentroMeta: 'ok' | 'baixo' | 'alto'` calculado com base na meta
- Adicionar `leituristas: number`

#### Painel lateral atualizado
- Input "Meta de medidores por rota": tipo number, min 500, max 1200, default 750
- Select "Leituristas por rota": 1 ou 2 (quando 2, meta efetiva = meta * 2)
- Badge com total de medidores do filtro atual
- Botao "Calcular Rotas" (renomeado de "Simular Distribuicao")
- Resultado: cada rota mostra cor da borda, nome "Rota X (UF)", medidores com badge de status, icone de leituristas

