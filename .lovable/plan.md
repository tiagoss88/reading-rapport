# Replicar planejamento do mês anterior

Objetivo: reaproveitar o planejamento já feito na competência anterior, apenas encaixando cada rota no dia útil correspondente do mês atual, com a opção de manter (ou não) o operador atribuído antes.

## Como vai funcionar

Na tela **Planejamento**, ao lado de "Adicionar Dia Útil", entra o botão **Replicar mês anterior**.

Ao clicar, abre uma janela que:

1. Mostra o período de origem (mês anterior à seleção atual, mesma UF) e o período de destino (mês/ano selecionado).
2. Lista, rota por rota, o que existe no mês anterior: data antiga, empreendimentos planejados, operadores atribuídos e total de medidores.
3. Faz o pareamento automático **por número de rota**: a Rota 01 do mês anterior vai para a data cadastrada como Rota 01 do mês atual, e assim por diante.
4. Permite ajustar a data de destino de cada rota num seletor (lista só os dias úteis já cadastrados no mês atual).
5. Traz duas opções gerais:
   - **Manter operadores da competência anterior** (ligado por padrão). Se desligado, os empreendimentos são copiados sem operador, ficando "não atribuído".
   - **Substituir planejamento existente no dia de destino** (desligado por padrão). Se desligado, dias que já tiverem planejamento são ignorados e sinalizados na lista.
6. Marca/desmarca quais rotas replicar.
7. Exibe um resumo antes de confirmar (X rotas, Y empreendimentos, Z medidores) e só grava após o usuário aceitar.

Casos tratados e sinalizados na janela:
- Rota do mês anterior sem dia útil equivalente cadastrado no mês atual → fica desabilitada com aviso "sem dia útil cadastrado".
- Operador anterior hoje inativo → o empreendimento é copiado sem operador, com aviso.
- Empreendimento que não existe mais → ignorado, com aviso.

## Detalhes técnicos

- Nova janela `ReplicarPlanejamentoDialog.tsx` em `src/components/medicao-terceirizada/`, acionada por botão em `src/pages/MedicaoTerceirizada/PlanejamentoRotas.tsx`.
- Leitura de origem: `dias_uteis` filtrado por uf/ano/mês anterior + `rotas_leitura` no intervalo daquele mês, com join em `empreendimentos_terceirizados` e `operadores` (mesmo padrão já usado na página).
- Pareamento: mapa `numero_rota → data` do mês atual (`dias_uteis` já carregado) contra o mesmo mapa do mês anterior.
- Gravação: `insert` em lote em `rotas_leitura` com `data` de destino, `empreendimento_id`, `operador_id` (ou `null` conforme a opção) e `status: 'pendente'`. Quando "substituir" estiver ligado, um `delete` das rotas daquela data precede o insert.
- Operadores validados contra a lista de `operadores` com `status = 'ativo'`.
- Ao final, invalida as queries `dias-uteis`, `rotas-leitura` e `rotas-leitura-dia` para a tela refletir imediatamente.
- Nenhuma alteração de banco é necessária: as tabelas e colunas usadas já existem.
