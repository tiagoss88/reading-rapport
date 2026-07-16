## Problema
No diálogo "Editar Serviço" (`src/components/medicao-terceirizada/ServicoNacionalGasDialog.tsx`), a borda/anel de foco dos campos (ex.: Morador) fica cortada pela lateral do `ScrollArea`, pois o padding horizontal está aplicado no viewport do scroll e o `focus-visible:ring` (2px + offset) extrapola a área visível.

## Correção
Ajustar apenas o layout do dialog para dar espaço horizontal aos anéis de foco, sem alterar lógica:

1. Mover o padding horizontal do `ScrollArea` para um wrapper interno, ou trocar `px-6` por `px-1` no ScrollArea e envolver o conteúdo com `px-6`, garantindo que o ring dos inputs não seja cortado pela barra de rolagem.
2. Adicionar `pr-4` (ou similar) para reservar espaço da scrollbar e evitar sobreposição em resoluções menores.
3. Verificar visualmente em 1070px de largura (viewport atual) que nenhum campo aparece com borda cortada.

## Escopo
- Apenas `src/components/medicao-terceirizada/ServicoNacionalGasDialog.tsx`.
- Sem mudanças em validação, mutations ou schema.