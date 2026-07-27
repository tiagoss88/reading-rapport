## Objetivo
Melhorar a tela do coletor em `/coletor/servicos-terceirizados`: busca por número do apartamento e apresentação agrupada dos Serviços Programados.

## 1. Busca por apartamento
No filtro de busca, além de condomínio, morador, endereço, tipo e protocolo, passar a considerar:
- `apartamento` (ex.: digitar "303" encontra o Apto 303)
- `bloco` (ex.: "A" ou "BL A")

Atualizar o placeholder para: "Buscar por condomínio, apto, bloco, morador, endereço, tipo ou protocolo...".

## 2. Agrupamento em "Serviços Programados"
Substituir a lista plana por uma hierarquia visual (sempre expandida, sem recolher):

```text
📅 Segunda, 28/07/2026                (12 serviços)
   ☀️ Manhã                           (7)
      ▸ ANHEMBI                        (3)
          [card] [card] [card]
      ▸ RESIDENCIAL PARQUE             (4)
          [card] ...
   🌙 Tarde                           (5)
      ...
📅 Sem data agendada
   ...
```

Regras:
- Ordenação: datas em ordem crescente; "Sem data" por último. Turnos na ordem Manhã → Tarde → Noite → Sem turno. Condomínios em ordem alfabética.
- Cada cabeçalho mostra a contagem de serviços do grupo.
- Estilo alinhado ao existente: cabeçalho de data em destaque (linha divisória + tipografia forte), turno como badge com o gradiente teal/roxo da seção, condomínio como subtítulo discreto com contador.
- Os cards permanecem exatamente como estão hoje (mesmo layout, badges, rodapé, ação "Ver Endereço").
- Quando a busca reduz o resultado, apenas os grupos com itens aparecem.

A seção "Serviços Essenciais" continua como lista plana (prioridade imediata).

## Detalhes técnicos
- Arquivo único: `src/pages/ColetorServicosTerceirizados.tsx`.
- Ampliar o predicado de `filteredServicos` com `apartamento`/`bloco` (comparação lowercase, tolerante a espaços).
- Criar um `useMemo` que transforma `programados` em uma estrutura `Data → Turno → Condomínio` e renderizar com `renderCard` reaproveitado.
- Datas formatadas com `date-fns` + `ptBR`, usando o padrão do projeto `new Date(iso + 'T00:00:00')` para evitar deslocamento de fuso.
- Sem alterações no backend.
