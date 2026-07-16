## Objetivo

Fazer com que **toda a interface administrativa** (não apenas Serviços) se adapte de forma fluida à resolução do dispositivo: perfeita em 1920×1080, confortável em notebooks (1366/1440), tablets e celulares — sem barras de rolagem horizontais desnecessárias e sem elementos "estourando" o layout.

## Diagnóstico

Hoje a maior parte das telas administrativas foi construída para desktop largo e "quebra" em resoluções menores. Problemas recorrentes:

1. **Tabelas com muitas colunas** (Serviços 13 col., Leituras, Empreendimentos, Operadores, Rastreamento, Relatórios) usam `overflow-hidden` ou nada — geram scroll horizontal grande.
2. **Cabeçalhos de Card** com título + botões em `flex-row` fixo quebram feio em <768px.
3. **Barras de filtros** (`flex flex-wrap gap-4`) com Selects de largura fixa (`w-[120px]`, `w-[180px]`) não se adaptam ao mobile.
4. **Layout principal** (`Layout.tsx`) usa padding fixo `p-6` e sidebar de 256px sem ajuste para telas médias.
5. **Diálogos** (Import, Novo Serviço, Execução) usam larguras fixas e vazam em telas menores.

O app do **coletor** (`/coletor/*`) já é mobile-first e permanece intocado.

## Estratégia (mobile-first, breakpoints Tailwind)

| Breakpoint | Faixa | Público-alvo |
|-----------|-------|--------------|
| base      | <640px | celular |
| sm        | ≥640px | celular grande |
| md        | ≥768px | tablet |
| lg        | ≥1024px | notebook pequeno |
| xl        | ≥1280px | notebook |
| 2xl       | ≥1536px | Full HD (1920×1080) |

Toda mudança usa classes Tailwind — sem CSS global novo, sem quebrar o design system existente.

## Mudanças propostas (apenas frontend/apresentação)

### A. Shell (`src/components/Layout.tsx`)
- Padding do `<main>` adaptativo: `p-3 sm:p-4 lg:p-6`.
- Sidebar já colapsa em mobile; adicionar auto-colapso em telas entre 1024–1279px (usar breakpoint para default `collapsed`).
- Header: título com `truncate` e `text-base sm:text-xl`.

### B. Padrão único para tabelas administrativas
Aplicar o mesmo padrão em todas as páginas de listagem:

1. Wrapper: `overflow-x-auto` (scroll aparece só quando necessário).
2. Colunas com **prioridade visual**: essenciais sempre visíveis, secundárias escondidas em breakpoints menores via `hidden md:table-cell`, `hidden lg:table-cell`, `hidden xl:table-cell`.
3. Padding e fontes já compactos (mantidos conforme regra do projeto).

Páginas afetadas:
- `MedicaoTerceirizada/Servicos.tsx` (13 col → prioridade descrita no plano anterior)
- `MedicaoTerceirizada/Leituras.tsx`
- `MedicaoTerceirizada/Empreendimentos.tsx`
- `MedicaoTerceirizada/PlanejamentoRotas.tsx`
- `MedicaoTerceirizada/Notificacoes.tsx`
- `Operadores.tsx`
- `RastreamentoOperadores.tsx`
- `RelatoriosLeituras.tsx`, `RelatoriosServicos.tsx`
- `PermissionsManagement.tsx`
- `TiposServico.tsx`, `ConfiguracoesSistema.tsx`

### C. Padrão para cabeçalhos de Card
`CardHeader` passa de `flex-row items-center justify-between` para:
```
flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
```
Grupos de botões: `flex flex-wrap gap-2 w-full sm:w-auto`. Em telas muito pequenas os botões podem exibir só ícone (`<span className="hidden sm:inline">Texto</span>`).

### D. Padrão para barras de filtro
Trocar `flex flex-wrap gap-4` + larguras fixas por:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-3
```
Selects: `w-full lg:w-[Xpx]`. Input de busca ocupa full-width no mobile.

### E. Dashboard (`Dashboard.tsx`)
Grades de KPIs: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` (já parcialmente aplicado, revisar).

### F. Diálogos (shadcn Dialog)
Definir tamanho máximo responsivo em diálogos grandes:
```
max-w-[95vw] sm:max-w-2xl lg:max-w-4xl
```
com `max-h-[90vh] overflow-y-auto` para conteúdo longo. Aplicar em: `ImportarPlanilhaDialog`, `NovoServicoNacionalGasDialog`, `ServicoNacionalGasDialog`, `DetalhesExecucaoDialog`, `EmpreendimentoTerceirizadoDialog`, `NovaColetaManualDialog`, `EditarColetaDialog`.

### G. Página Rastreamento
O mapa (`LocalizacaoOperadores`) recebe altura responsiva: `h-[50vh] lg:h-[calc(100vh-200px)]`, sidebar de operadores empilha abaixo em <lg.

## Fora de escopo
- App do coletor (`/coletor/*`) — já mobile-first.
- Nenhuma mudança em business logic, queries, migrations ou edge functions.
- Nenhuma alteração no design system (tokens, cores, fontes).
- Sem mudança de bibliotecas.

## Entrega em fases (para permitir revisão incremental)

**Fase 1 — Fundação:** Layout shell + padrões reutilizáveis aplicados em `MedicaoTerceirizada/Servicos.tsx` (piloto).
**Fase 2 — Listagens Medição:** Leituras, Empreendimentos, Planejamento, Notificações.
**Fase 3 — Outras áreas:** Dashboard, Operadores, Rastreamento, Relatórios, Configurações, Permissões.
**Fase 4 — Diálogos:** todos os dialogs grandes recebem largura/altura responsiva.

Se preferir, posso implementar tudo de uma vez ou apenas a Fase 1 primeiro como validação visual. Diga qual caminho seguir e eu executo.

## Verificação
Ao final de cada fase, rodar Playwright em 3 viewports (1920×1080, 1366×768, 375×812) e capturar screenshots das principais telas para confirmar ausência de scroll horizontal e legibilidade.
