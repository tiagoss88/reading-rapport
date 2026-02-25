

## Detalhes da Rota ao Clicar no Card do Cronograma

### Objetivo

Ao clicar em um card de rota no Cronograma de Leitura, expandir ou abrir um painel mostrando os empreendimentos (clientes) daquela rota e os operadores designados para cada um.

### Alterações

**Arquivo: `src/pages/ColetorCronograma.tsx`**

- Adicionar estado `expandedDiaId` para controlar qual card esta expandido (accordion-style, apenas um aberto por vez).
- Tornar cada card clicavel (cursor-pointer + indicador visual tipo chevron).
- Ao clicar, expandir uma secao abaixo do resumo mostrando:
  - Lista de empreendimentos da rota (nome, endereco, quantidade de medidores).
  - Para cada empreendimento, os operadores designados (cruzando `rotasLeitura` por `empreendimento_id`).
  - Se nenhum operador designado, exibir "Sem operador atribuido".
- Adicionar import de `ChevronDown`/`ChevronUp` do lucide-react.
- A query de `rotas_leitura` ja traz `empreendimento_id` e `operador.nome` -- basta filtrar por empreendimento na secao expandida.
- Usar `Collapsible` do radix ou simplesmente renderizacao condicional com animacao CSS.

### Layout expandido (dentro do card)

```text
┌─────────────────────────────────────┐
│ Rota 18                  2 operador │
│ 25 de fevereiro                     │
│ 7 empreendimentos · 340 medidores   │
│ ▼                                   │
├─────────────────────────────────────┤
│  🏢 Condominio Solar das Flores     │
│     45 medidores                    │
│     → João Silva, Maria Santos      │
│─────────────────────────────────────│
│  🏢 Residencial Bela Vista          │
│     30 medidores                    │
│     → João Silva                    │
│─────────────────────────────────────│
│  🏢 Edifício Monte Carlo            │
│     55 medidores                    │
│     → Sem operador atribuído        │
└─────────────────────────────────────┘
```

### Detalhes tecnicos

- Sem queries adicionais: os dados de `empreendimentos_terceirizados` e `rotas_leitura` ja estao carregados.
- Filtrar `rotasLeitura` por `empreendimento_id` para obter os operadores de cada empreendimento naquela data.
- Usar `Collapsible` + `CollapsibleContent` do radix para animacao suave de abertura/fechamento.

