# Corrigir empreendimentos ausentes no planejamento replicado

## Diagnóstico confirmado no código

A janela mostra **“Empreendimentos da rota: 18”** usando o cadastro-base de empreendimentos da Rota 01/CE, não os registros efetivamente adicionados em `rotas_leitura`. Por isso o cabeçalho pode indicar 18 enquanto a lista planejada está vazia.

Na replicação, a consulta de planejamento existente busca o mês inteiro sem restringir a UF. Se já houver qualquer registro da BA na mesma data escolhida para o CE, o sistema entende que o dia do CE já está planejado e ignora a rota inteira quando “Substituir” está desligado. Com “Substituir” ligado, a exclusão atual também alcança todas as UFs daquela data.

## Correções

1. **Isolar a replicação por UF**
   - Consultar o planejamento existente com o empreendimento relacionado e considerar somente a UF selecionada.
   - A decisão “dia já planejado” passa a verificar apenas registros da mesma UF.
   - Ao substituir, excluir somente os registros da UF atual, preservando o planejamento de outros estados na mesma data.

2. **Carregar corretamente a rota diária**
   - Buscar os registros da data já restringidos à UF da janela por relacionamento obrigatório com o empreendimento.
   - Manter o agrupamento por empreendimento para não duplicar clientes que possuem mais de um operador.
   - Exibir erro de carregamento na própria janela, em vez de apresentar “nenhum empreendimento” quando a consulta falhar.

3. **Corrigir o resumo da janela**
   - Trocar o número do cabeçalho para a quantidade efetivamente adicionada ao planejamento.
   - Mostrar separadamente a quantidade cadastrada para a rota quando for útil, evitando que “18” pareça confirmar uma inserção que não ocorreu.

4. **Atualização imediata após replicar**
   - Invalidar explicitamente as consultas do dia e do mês/UF de destino.
   - Ao concluir, informar de forma clara quantos empreendimentos foram inseridos e quantos foram ignorados por já existirem **na mesma UF**.

## Arquivos

- `src/components/medicao-terceirizada/ReplicarPlanejamentoDialog.tsx`
- `src/components/medicao-terceirizada/RotaDiariaDialog.tsx`

## Validação

- Replicar a Rota 01 para `03/08/2026` no CE mesmo que a BA tenha planejamento nessa data.
- Abrir a rota e confirmar que os 18 empreendimentos aparecem uma única vez.
- Confirmar que substituir o CE não remove registros da BA.
- Confirmar que o total exibido no cabeçalho coincide com a lista carregada.