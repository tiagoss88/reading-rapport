## Objetivo

Na aba **Urgente** (componente `PainelUrgencias`), adicionar um botão **"Roteirizar"** que abre um popup onde o usuário informa a quantidade de técnicos. O sistema então distribui os serviços urgentes (filtrados pela UF atual) em N rotas por proximidade, priorizando quem tem mais dias vencidos/críticos.

## Fluxo do usuário

1. Usuário abre a aba **Urgente** e (opcionalmente) filtra por UF.
2. Clica em **Roteirizar** (novo botão no header do painel, ao lado de "Copiar Resumo").
3. Popup abre com:
   - Campo numérico **Quantidade de técnicos** (1–20, padrão 2).
   - Opção **Incluir apenas os filtrados pela UF selecionada** (default: ligada).
   - Botão **Gerar rotas**.
4. Ao gerar, o popup mostra N cartões (Técnico 1, Técnico 2, …), cada um com:
   - Cor identificadora, total de serviços, UF(s).
   - Lista dos serviços na ordem sugerida de atendimento (nearest-neighbor a partir do serviço mais urgente do grupo).
   - Endereço (condomínio + bloco/apto) e prazo restante.
5. Botões **Copiar rota** (por técnico) e **Copiar todas as rotas** (texto pronto para WhatsApp), além de **Fechar**.

Sem gravação no banco nesta primeira versão — apenas geração e cópia. Isso mantém o escopo pequeno e evita mexer no schema/estado dos serviços.

## Regras de agrupamento

- **Nunca misturar UFs** na mesma rota (mesma regra já usada em `optimizeRoutesWithConstraints`).
- Serviços **sem coordenadas** (empreendimento sem lat/lng) vão para um bloco separado "Sem geolocalização — atribuir manualmente" dentro do popup, não entram no k-means.
- Peso de cada ponto = 1 (a métrica é quantidade de serviços, não medidores).
- Se uma UF tem menos serviços que o total de técnicos solicitados, os técnicos excedentes ficam sem rota naquela UF (mostrar aviso).

## Implementação técnica

**Dados**
- `servicos_nacional_gas` já tem `empreendimento_id`. Buscar `empreendimentos_terceirizados (id, latitude, longitude, endereco)` para os IDs presentes nos urgentes.
- Fazer o fetch dentro do popup via `useQuery` só quando abrir, para não pesar o painel.

**Algoritmo**
- Reutilizar `optimizeRoutesWithConstraints` de `src/lib/routeOptimizer.ts` passando:
  - `points`: um por serviço urgente com coordenada; `grupo = uf`; `peso = 1`.
  - `metaPorRota = Math.ceil(totalServicosDaUf / techsSolicitados)` calculado por UF.
- Após clusterizar, dentro de cada rota, ordenar por **nearest-neighbor** partindo do serviço com menor `diasRestantes` (mais urgente) — heurística simples, sem depender de API externa.

**UI**
- Novo componente `src/components/medicao-terceirizada/RoteirizarUrgentesDialog.tsx`.
- Alterar `src/components/medicao-terceirizada/PainelUrgencias.tsx`:
  - Adicionar botão **Roteirizar** no header (mesma linha de "Copiar Resumo").
  - Estado `roteirizarOpen` e render do novo Dialog passando `urgentes` + `ufFiltro`.
- Estilo consistente com o painel atual (Tailwind + shadcn Dialog/Card/Badge/Button).

**Cópia para WhatsApp**
Formato por técnico:
```
🧑 Técnico 1 — SP (8 serviços)
1. [SP] Cond. X — Bloco A Apto 12 — Religação — Vence hoje
2. [SP] Cond. Y — Apto 3 — Desligamento — 1 dia útil
...
```

## Arquivos afetados

- `src/components/medicao-terceirizada/PainelUrgencias.tsx` — botão + estado + render do dialog.
- `src/components/medicao-terceirizada/RoteirizarUrgentesDialog.tsx` — novo.
- (Nenhum arquivo do backend / schema.)

## Fora de escopo (posso adicionar depois se quiser)

- Persistir a rota gerada no banco / atribuir tecnico_id automaticamente.
- Mapa visual com as rotas coloridas (dá para reaproveitar o Mapbox do `Roteirizador`).
- Otimização real de TSP (hoje uso nearest-neighbor, que é suficiente para dezenas de pontos).
