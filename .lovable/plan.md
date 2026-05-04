
# Tooltip nos Cards da Agenda Semanal

## Problema
Os cards na agenda semanal truncam textos longos (nome do condomínio, tipo de serviço, status, morador), impossibilitando a leitura completa sem clicar.

## Solução
Adicionar um **HoverCard** (popover ao passar o mouse) em cada card, exibindo todas as informações completas sem alterar o tamanho ou layout atual dos cards.

### Informações exibidas no hover:
- Nome completo do condomínio
- Bloco e Apartamento
- Nome do morador (se houver)
- Tipo de serviço completo
- Status
- Turno (se houver)
- Bairro/Endereço (se houver)
- Observação (se houver)

## Arquivo alterado
- `src/components/medicao-terceirizada/AgendaSemanal.tsx` -- Envolver o `ServiceCard` com `HoverCard` do Radix, exibindo um painel com todos os dados formatados ao hover.
