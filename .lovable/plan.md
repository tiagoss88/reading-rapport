

## Adicionar aba "Roteirizador" na pagina de Georreferenciamento

### Resumo
Transformar a pagina de Georreferenciamento em uma pagina com duas abas: "Georreferenciamento" (conteudo atual) e "Roteirizador" (nova funcionalidade para simular a melhor distribuicao de rotas entre empreendimentos).

---

### O que o usuario vera

**Aba Georreferenciamento** - Conteudo atual, sem alteracoes.

**Aba Roteirizador:**
1. Painel lateral com:
   - Filtro de UF
   - Campo para definir quantidade de rotas desejadas (ex: 5, 10, 15, 20)
   - Botao "Simular Distribuicao" que executa o algoritmo de agrupamento
   - Resultado da simulacao: lista de rotas geradas com quantidade de empreendimentos e total de medidores por rota
   - Botao "Aplicar Rotas" para salvar a nova distribuicao no banco
2. Mapa mostrando os empreendimentos coloridos pelas rotas simuladas (cores diferentes das rotas atuais vs simuladas)

### Algoritmo de distribuicao
- Implementacao de agrupamento por proximidade geografica (k-means simplificado) no frontend
- Usa latitude/longitude dos empreendimentos georreferenciados
- Distribui os empreendimentos em N clusters tentando equilibrar por proximidade geografica
- Opcionalmente considera o peso (quantidade_medidores) para balancear carga de trabalho entre rotas

---

### Alteracoes

#### 1. Modificar: `src/pages/MedicaoTerceirizada/Georreferenciamento.tsx`
- Envolver o conteudo atual em um componente `Tabs` com duas abas
- Aba "Georreferenciamento" contem o componente atual (extraido para um sub-componente ou mantido inline)
- Aba "Roteirizador" renderiza o novo componente

#### 2. Criar: `src/components/medicao-terceirizada/Roteirizador.tsx`
Novo componente com:
- Proprio mapa Mapbox (instancia separada)
- Filtro de UF para selecionar quais empreendimentos entram na simulacao
- Input numerico para quantidade de rotas desejadas
- Botao "Simular" que executa o agrupamento k-means
- Mapa exibe marcadores coloridos por rota simulada
- Lista lateral mostrando cada rota simulada com: cor, quantidade de empreendimentos, total de medidores
- Botao "Aplicar Rotas" que atualiza o campo `rota` de cada empreendimento no banco

#### 3. Criar: `src/lib/routeOptimizer.ts`
Funcao utilitaria de agrupamento k-means:
- Recebe array de pontos (lat, lng, id, quantidade_medidores)
- Recebe numero de clusters desejado
- Retorna array com atribuicao de rota para cada ponto
- Algoritmo iterativo simples (10-20 iteracoes) que agrupa por proximidade usando distancia euclidiana nas coordenadas

---

### Secao Tecnica

#### Algoritmo k-means simplificado (`routeOptimizer.ts`)

```text
Entrada: pontos[] = {id, lat, lng, peso}, k = numero de rotas
Saida: pontos[] com campo 'rota' atribuido (1 a k)

1. Selecionar k centroides iniciais (pontos mais distantes entre si)
2. Repetir 20 vezes:
   a. Atribuir cada ponto ao centroide mais proximo
   b. Recalcular centroides como media das coordenadas do cluster
3. Ordenar clusters por longitude (oeste para leste) e renumerar rotas 1..k
4. Retornar atribuicoes
```

#### Estrutura do Roteirizador

```text
Roteirizador
+-- Painel Esquerdo (w-80)
|   +-- Filtro UF
|   +-- Input "Quantidade de Rotas" (min 2, max 20)
|   +-- Botao "Simular Distribuicao"
|   +-- Separador
|   +-- Resultado da Simulacao (ScrollArea)
|       +-- Card por rota: cor, qtd empreendimentos, total medidores
|   +-- Botao "Aplicar Rotas" (salvar no banco)
+-- Mapa Mapbox (flex-1)
    +-- Marcadores coloridos por rota simulada
    +-- Popup com info do empreendimento
```

#### Tabs na pagina principal
- Usar componente `Tabs` de `@/components/ui/tabs`
- Tab "Georreferenciamento" com value="geo"
- Tab "Roteirizador" com value="roteirizador"
- O mapa de cada aba e independente (instancias separadas do Mapbox)
- Token do Mapbox compartilhado via mesma query `configuracoes_sistema`

#### Aplicar rotas no banco
- Mutation batch: atualizar campo `rota` em `empreendimentos_terceirizados` para cada empreendimento
- Usar `Promise.all` com updates individuais ou loop sequencial
- Invalidar queries apos sucesso
- Confirmar com dialog antes de aplicar (acao destrutiva que altera rotas existentes)

