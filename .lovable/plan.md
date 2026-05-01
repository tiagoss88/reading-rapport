
## Corrigir cards cortados na Agenda

O problema é que `grid-cols-8` divide o espaço igualmente entre 8 colunas, deixando cada uma muito estreita (~130px) e cortando o texto dos cards.

### Correção em `AgendaSemanal.tsx`

Trocar o grid fixo por um layout flex com scroll horizontal:

- Container externo com `overflow-x-auto`
- Flex container interno com `min-width: 1200px` e `gap-3`
- Coluna "Sem Agendamento" com `w-[200px] shrink-0`
- Colunas de dias com `flex-1 min-w-[180px]`

Isso garante que cada coluna tenha largura mínima suficiente para exibir o conteúdo completo dos cards, com scroll horizontal quando necessário.
