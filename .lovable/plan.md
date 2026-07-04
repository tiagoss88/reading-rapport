## Problema

No card de resumo das rotas simuladas, cada rota mostra apenas a contagem (`42 emprend.`) e o total de medidores, mas não lista **quais empreendimentos** foram alocados. O usuário precisa ver os nomes para conferir a distribuição.

## Correção

Tornar cada linha de rota expansível: um clique revela a lista dos empreendimentos daquela rota.

**Arquivo**: `src/components/medicao-terceirizada/Roteirizador.tsx`

**Mudanças**:
1. Adicionar estado `expandedRotas: Set<number>` para controlar quais rotas estão abertas.
2. Envolver cada linha de rota em um botão clicável com chevron (▶/▼) que alterna a expansão.
3. Quando expandido, renderizar uma lista compacta abaixo da linha com:
   - Nome do empreendimento
   - Endereço curto (truncado)
   - Quantidade de medidores
   - Ordenados por nome
4. Adicionar botões "Expandir todas" / "Recolher todas" no topo do resumo (ao lado do total de rotas).
5. Manter altura contida com scroll — a `ScrollArea` do painel já cuida disso.
6. Ao clicar em um item da lista, centralizar/zoomar o mapa no marcador daquele empreendimento (bônus curto, reaproveita `map.current.flyTo`).

Sem alteração de backend, cálculo ou layout geral — só progressão de UI da lista existente.
