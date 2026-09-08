# Padronizar datas da GTI no formato dd/MM/yyyy

## O que será feito

Padronizar a exibição e edição de datas na aba GTI para o formato brasileiro **dd/MM/yyyy** em todos os pontos de interação.

## Escopo

- **Lista principal:** manter o formato dd/MM/yyyy já usado nas células de exibição.
- **Edição inline na lista:** substituir o `<input type="date">` nativo por um seletor de data compacto (Shadcn Datepicker) que mostre e grave no formato dd/MM/yyyy.
- **Diálogo de edição:** substituir os três campos de data nativos por Shadcn Datepicker, todos no formato dd/MM/yyyy.
- **Preview da importação:** formatar as colunas "Leit. ant.", "Prazo ini." e "Prazo fim" como dd/MM/yyyy em vez do formato ISO.
- **Exportação CSV:** já está em dd/MM/yyyy; manter.

## Como será implementado

- Criar um componente local reutilizável (por exemplo, `GtiDatePicker`) baseado no padrão Shadcn Datepicker, usando `date-fns` para formatar como `dd/MM/yyyy` e converter de/para o valor ISO (`yyyy-MM-dd`) usado internamente.
- Usar `pointer-events-auto` no calendário quando estiver dentro de diálogo/popover, conforme o padrão do projeto.
- Manter a lógica de cálculo automático de prazos (28/32 dias) e o aviso visual fora da janela.
- Nenhuma alteração no banco de dados nem nas regras de negócio.

## Arquivo alterado

- `src/components/medicao-terceirizada/gti/GtiTab.tsx`
