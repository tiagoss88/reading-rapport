A página administrativa de serviços (`/medicao-terceirizada/servicos`) já permite buscar por número de protocolo. O que falta é o mesmo comportamento na tela do coletor (`/coletor/servicos-terceirizados`).

## Alterações propostas

1. **`src/pages/ColetorServicosTerceirizados.tsx`**
   - Incluir `numero_protocolo` no filtro de busca local (junto a condomínio, morador, endereço e tipo de serviço).
   - Atualizar o placeholder do input para: "Buscar por condomínio, morador, endereço, tipo ou protocolo...".

## Impacto
- O operador poderá localizar serviços digitando parte ou a totalidade do número de protocolo (ex: `NG-000123`).
- A busca continua case-insensitive e com comportamento instantâneo sobre os dados já carregados.
- Nenhuma alteração de backend é necessária; o campo `numero_protocolo` já vem no select da consulta existente.