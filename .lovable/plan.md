## Problema

No popup **Roteirizar Serviços Urgentes**, só aparecem dois cards e o segundo fica cortado na parte inferior. O `ScrollArea` dentro do `DialogContent` flex não está calculando altura corretamente, então a lista não rola e ainda "vaza" para fora do dialog.

## Correção

Em `src/components/medicao-terceirizada/RoteirizarUrgentesDialog.tsx`:

1. Trocar `ScrollArea` por um `<div>` simples com `flex-1 overflow-y-auto min-h-0` — o `min-h-0` é o que falta para o filho de um flex column colapsar corretamente e permitir scroll interno.
2. Ajustar o `DialogContent`:
   - Adicionar `overflow-hidden` para conter o scroll interno.
   - Aumentar `max-h-[85vh]` para `h-[85vh]` (altura fixa em vez de máxima) para o flex ter altura definida.
3. Remover os `-mx-6 px-6` que eram do ScrollArea; o container já respeita o padding do DialogContent.
4. Manter cabeçalho (título + controles) e rodapé fora da área rolável, para que apenas a lista de rotas role.

Sem mudanças no algoritmo, no schema, no botão do painel ou em qualquer outro arquivo.

## Arquivos afetados

- `src/components/medicao-terceirizada/RoteirizarUrgentesDialog.tsx` (apenas layout do dialog).
