# Permitir escolher o dia de destino na replicação

## Problema

No diálogo "Replicar planejamento do mês anterior", o seletor de destino só lista dias úteis já cadastrados no mês atual. Como agosto/2026 (BA) ainda não tem dias úteis cadastrados, a lista fica vazia, todas as rotas mostram "Sem dia útil cadastrado" e o checkbox fica desabilitado — impossível selecionar a rota ou definir a data.

## O que muda

1. **Escolher qualquer data do mês atual**: além dos dias úteis já cadastrados, o campo de destino passa a permitir escolher uma data livre via calendário, restrito ao mês/ano da competência atual (fins de semana desabilitados por padrão, com opção de liberar).
2. **Criar o dia útil automaticamente**: ao replicar, se a data escolhida ainda não existir em `dias_uteis` para aquela UF/competência, ela é criada com o mesmo número de rota da origem (respeitando números já usados).
3. **Checkbox liberado**: a rota pode ser marcada assim que uma data válida for escolhida; sem data, o botão de replicar continua bloqueado com aviso claro.
4. **Preenchimento padrão inteligente**: quando não existe dia útil cadastrado, o sistema pré-sugere o N-ésimo dia útil do mês atual (mesma posição ordinal do mês anterior), ainda editável pelo usuário.
5. **Seleção não é mais resetada**: as escolhas manuais deixam de ser sobrescritas a cada recarregamento dos dados; o preenchimento automático só ocorre na abertura do diálogo.

## Detalhes técnicos

- Arquivo: `src/components/medicao-terceirizada/ReplicarPlanejamentoDialog.tsx`
- Trocar o `Select` de destino por um controle combinado: lista de dias úteis existentes + `Popover` com `Calendar` (date-fns, formato `yyyy-MM-dd`, sem conversão UTC — usar `T00:00:00`).
- Ajustar o `useEffect` de inicialização para depender apenas de `open` (guardar flag de inicializado) em vez de `linhas`.
- Na mutation, antes de inserir em `rotas_leitura`, fazer upsert em `dias_uteis` (`uf`, `ano`, `mes`, `numero_rota`, `data`) quando a data não existir, e invalidar `['dias-uteis']`.
- Remover `disabled={!destino}` do checkbox quando houver data escolhida manualmente.
