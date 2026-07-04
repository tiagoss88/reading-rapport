
## Objetivo

Evoluir o Roteirizador para:
1. Aceitar **nº de técnicos** como parâmetro principal e gerar rotas dinâmicas equilibradas.
2. Roteirizar também por **cliente** (não só por empreendimento), aproveitando as coordenadas georreferenciadas.
3. Usar **IA (Lovable AI Gateway — Gemini)** como assistente do roteirizador, não como motor de clustering: analisa o resultado, sugere melhorias, nomeia rotas por bairro/região e destaca inconsistências.

## Por que abordagem híbrida (algoritmo + IA), e não "só IA"

Enviar centenas/milhares de coordenadas para o LLM em cada simulação seria lento, caro e menos preciso que k-means. A divisão fica assim:

- **Algoritmo local (k-means já existente)** — faz o clustering geográfico e balanceamento por peso (medidores). Instantâneo, determinístico.
- **IA (Gemini 3 Flash)** — recebe *o resumo* das rotas (centroide, bairros predominantes, contagem, distância média) e devolve:
  - nome sugerido para cada rota ("Rota Aldeota + Meireles", "Rota Bairro Novo — Sul de Fortaleza")
  - alertas ("Rota 3 mistura bairros distantes: Aldeota e Messejana — considere separar")
  - sugestão de nº ideal de técnicos com base na dispersão e volume

## Escopo funcional

### 1. Nova aba/tab no Roteirizador: "Por Técnicos"
Mantém a aba atual (meta por rota) e adiciona uma segunda modalidade:

```
[Por Meta de Medidores]  [Por Nº de Técnicos]  ← nova
```

Campos da nova aba:
- **Nº de técnicos disponíveis** (input numérico, 1–20)
- **Nível a roteirizar**: Empreendimentos (atual) | Clientes (novo)
- **UF** (filtro existente)
- Botão **Calcular rotas** → executa k-means com `k = nºtécnicos` por UF
- Botão **Analisar com IA** → chama edge function, mostra sugestões abaixo

### 2. Roteirização a nível de cliente
Hoje só empreendimentos são roteirizados. Adicionar opção de rotear clientes individuais:
- Buscar clientes com `latitude`/`longitude` (tabela `clientes`)
- Peso = 1 medidor por cliente (ou usar campo se existir)
- Filtro por UF via `clientes.estado`
- Aplicar rota nos clientes usando um novo campo `rota_cliente` **ou** reaproveitando a lógica de `rotas_leitura` (a decidir na implementação após ler `rotas_leitura`)

> Nota: para o primeiro release, salvar apenas resultado da simulação em memória + exibir no mapa. Persistência de rota por cliente pode ser habilitada por botão "Aplicar" — se a tabela `clientes` não tiver campo adequado, criar migração para adicionar `rota` (int nullable) com GRANT + policy adequados.

### 3. Análise por IA — Edge Function

**Nova edge function**: `supabase/functions/analisar-rotas-ia/index.ts`

Fluxo:
1. Recebe do frontend um JSON compacto:
   ```json
   {
     "rotas": [
       { "rota": 1, "centroide": {"lat":-3.7, "lng":-38.5},
         "total_medidores": 780, "qtd_pontos": 42,
         "bairros": ["Aldeota","Meireles"], "uf": "CE",
         "distancia_media_km": 1.8 }
     ],
     "meta": { "tecnicos": 3, "meta_medidores": 750 }
   }
   ```
2. Monta prompt para Gemini (`google/gemini-3-flash-preview` via Lovable AI Gateway) pedindo:
   - `nome_sugerido` por rota
   - `alertas[]` (mistura de bairros distantes, sobrecarga, subutilização)
   - `resumo_geral` (1 parágrafo)
3. Usa `Output.object` (schema pequeno, sem bounds) via AI SDK → JSON estruturado
4. Retorna para o frontend, tratando 429/402 com mensagens claras

Segurança: `verify_jwt = true` (padrão), valida com Zod, usa `LOVABLE_API_KEY` (já existe nos secrets).

### 4. UI do resultado da IA
Em um card abaixo da lista de rotas:
- Resumo geral (parágrafo)
- Alertas em `Alert` destructive/warning
- Cada rota ganha um subtítulo com o `nome_sugerido` (ex: "Rota 1 · Aldeota + Meireles")
- Toggle para aplicar/ignorar os nomes sugeridos ao salvar

## Fora de escopo (podemos fazer depois)

- Chatbot completo/livre dentro do sistema
- IA otimizando ordem de visitação (TSP) dentro de cada rota
- IA acessando dados sensíveis dos clientes por RAG
- Assistente de IA em outras telas (coletor, admin geral)

## Detalhes técnicos

- **Modelo**: `google/gemini-3-flash-preview` via Lovable AI Gateway (secret `LOVABLE_API_KEY` já configurado). Sem necessidade de chave OpenAI/ChatGPT.
- **SDK**: `ai` + `@ai-sdk/openai-compatible` na edge function (Deno via `npm:` specifiers).
- **Preparação do payload** no frontend: para cada rota gerada pelo k-means, calcular centroide médio, agrupar bairros dominantes (via `clientes.bairro` ou `empreendimentos_terceirizados` — se necessário fazer join no frontend com dados já em memória), distância média ao centroide. Nunca enviar lista completa de pontos.
- **Tabelas envolvidas** (somente leitura no primeiro release, exceto empreendimentos):
  - `empreendimentos_terceirizados` (já usado)
  - `clientes` (novo — leitura para roteirização a nível de cliente)
  - `configuracoes_sistema` (mapbox token existente)
- **Migração eventual**: adicionar `rota INTEGER NULL` em `clientes` se o usuário quiser persistir rotas por cliente. Fazer só quando o usuário confirmar essa persistência.
- **Arquivos criados/editados**:
  - `supabase/functions/analisar-rotas-ia/index.ts` (novo)
  - `src/components/medicao-terceirizada/Roteirizador.tsx` (edit — tabs, campo técnicos, botão IA, exibição resultado IA)
  - `src/hooks/useAnaliseRotasIA.ts` (novo — encapsula chamada à edge function via `supabase.functions.invoke`)
- **Tratamento de erros IA**: 429 → toast "IA sobrecarregada, tente em instantes"; 402 → toast "Créditos de IA esgotados, adicione créditos nas configurações do workspace"; timeout → sugere reduzir nº de rotas ou tentar novamente.

## Entregável mínimo aprovável (MVP)

1. Aba "Por Nº de Técnicos" no Roteirizador com k-means
2. Botão "Analisar com IA" que retorna nomes de rota + alertas
3. UI mostrando os nomes e alertas junto de cada rota
4. Roteirização por cliente fica em fase 2 (após validar o motor com empreendimentos)

Se aprovar assim, começo pelo MVP e a roteirização de clientes vem em seguida.
