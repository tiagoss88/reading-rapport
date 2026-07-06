# Sugestão automática de divisão entre técnicos

Adicionar, dentro da janela **Planejamento - Rota XX** (`RotaDiariaDialog`), um novo botão **"Sugerir divisão"** que ajuda o usuário a distribuir os empreendimentos do dia entre os técnicos disponíveis.

A sugestão é apenas uma **proposta**: o usuário revisa e decide se aplica ou descarta. Nada é gravado no banco antes do "Aplicar".

## Fluxo do usuário

1. Na janela de planejamento do dia, ao lado de "Copiar para WhatsApp", aparece o botão **Sugerir divisão** (ícone de varinha/wand).
2. Clicar abre um segundo diálogo **"Sugerir divisão automática"** com:
   - Contador: "X empreendimentos • Y medidores no dia".
   - Lista de operadores ativos com checkbox — o usuário marca quem estará disponível.
   - Campo opcional "Prioridade" com dois toggles: **Balancear medidores** (padrão ligado) e **Agrupar por proximidade** (padrão ligado).
   - Botão **Gerar sugestão**.
3. Após gerar, a mesma janela mostra o **preview** — uma coluna por técnico com os condomínios propostos, total de medidores e um mini-indicador de equilíbrio (ex.: "Téc. A: 8 condos / 412 medidores").
4. Rodapé com dois botões:
   - **Descartar** — fecha sem alterar nada.
   - **Aplicar sugestão** — grava no banco e fecha.
5. Ao aplicar, o sistema:
   - Remove as atribuições atuais de operador dos empreendimentos já adicionados ao dia (mantém o empreendimento na rota, apenas troca/insere o `operador_id`).
   - Insere um registro `rotas_leitura` por par empreendimento × técnico conforme a sugestão.
   - Mostra toast "Divisão aplicada" e a tabela do dia atualiza.

Escopo confirmado: **somente os empreendimentos já adicionados ao dia** são redistribuídos. Empreendimentos da rota que não estão no dia são ignorados.

## Algoritmo (misto: medidores + proximidade)

1. Carregar os empreendimentos do dia com `quantidade_medidores`, `latitude`, `longitude`.
2. **Clusterização por proximidade** — agrupar em N clusters (N = nº de técnicos marcados) usando k-means simples sobre lat/lng:
   - Sementes iniciais: os N empreendimentos mais distantes entre si (heurística "farthest-first").
   - Empreendimentos sem lat/lng entram num pool "sem geo" e são distribuídos no passo 3.
   - 5–10 iterações são suficientes para o volume típico (dezenas de condos).
3. **Rebalanceamento por medidores** — depois do clustering, comparar a soma de medidores de cada cluster. Enquanto o desvio for maior que ~15% da média:
   - Mover o empreendimento **de fronteira** (mais próximo do centróide do cluster vizinho) do cluster mais pesado para o mais leve.
   - Limite de 50 trocas para evitar loop.
4. Distribuir empreendimentos "sem geo" atribuindo cada um ao técnico com menor total de medidores no momento.
5. Ordenar clusters por lat média (norte→sul) e atribuir a cada técnico marcado, na ordem em que aparecem na lista.

Se o usuário desligar "Agrupar por proximidade", pula-se o passo 2 e usa-se apenas balanceamento greedy por medidores (LPT: ordena empreendimentos por medidores desc e coloca cada um no técnico com menor total).

Se o usuário desligar "Balancear medidores", pula-se o passo 3 (fica só o clustering geográfico).

## Detalhes técnicos

- **Arquivo novo:** `src/lib/sugerirDivisaoRota.ts` — funções puras (`kmeansGeo`, `rebalancearPorMedidores`, `sugerirDivisao`) recebendo `{ empreendimentos, tecnicos, opcoes }` e retornando `Record<operadorId, empreendimentoId[]>` + estatísticas por técnico. Sem dependência de bibliotecas externas.
- **Componente novo:** `src/components/medicao-terceirizada/SugerirDivisaoDialog.tsx` — recebe `diaUtil`, lista de empreendimentos já no dia (com lat/lng e medidores) e lista de operadores ativos. Faz o cálculo em memória, mostra preview e, no Aplicar, executa as mutações Supabase.
- **Edição em `RotaDiariaDialog.tsx`:**
  - Novo botão no cabeçalho (ícone `Wand2` do lucide).
  - Abre `SugerirDivisaoDialog` passando `groupedByEmpreendimento` + `operadores`.
  - Após aplicar, chama `invalidateAll()` para recarregar a tabela.
- **Mutação de aplicação:** usa as operações já existentes do dialog (delete `rotas_leitura` do dia + insert dos novos pares). Feita em batch com `Promise.all`, dentro de uma única mutation React Query para bloquear a UI durante a gravação.
- Sem alterações em schema, RLS ou edge functions.

## Fora de escopo

- Rebalancear entre múltiplos dias / múltiplas rotas.
- Otimização de rota interna do técnico (ordem de visita) — já é tratada pelo `Roteirizador`.
- Persistir preferências do usuário (nº padrão de técnicos, toggles).
