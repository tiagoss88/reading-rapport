## Reorganização da Lista de Serviços (Coletor) — Essenciais vs Programados

### Arquivo único alterado
`src/pages/ColetorServicosTerceirizados.tsx`

### Categorização

Helper `isEssencial(tipo: string)` — normaliza para minúsculas + remove acentos e retorna `true` se contiver:
- `religacao` (cobre Religação, Religação Automática, Religação Emergencial)
- `desligamento` (cobre Desligamento)

Demais tipos → **Programados**.

### Lógica de exibição

1. Sobre o `filteredServicos` atual (que já aplica busca + filtro de UF), particionar em:
   - `essenciais` — sempre renderizados na primeira seção.
   - `programados` — renderizados na segunda seção.
2. A ordenação atual por `data_agendamento` é mantida **dentro** de cada grupo.
3. Cabeçalho de cada seção só aparece quando o respectivo grupo tem itens.
4. Empty state atual continua valendo apenas quando ambos os grupos estão vazios.
5. Filtros (UF + busca) continuam funcionando normalmente — a separação é aplicada **depois** do filtro, garantindo que os essenciais permaneçam destacados em qualquer combinação.

### Estrutura visual

**Seção "Serviços Essenciais"** (no topo)
- Cabeçalho:
  - Quadrado 32px com gradiente laranja-vermelho (`from-[#ff6b6b] to-[#ee5a6f]`) e ícone `Zap` branco.
  - Título "Serviços Essenciais" em gradient text laranja-vermelho, bold, ~text-xl.
  - Badge contagem ao lado.
  - Descrição: "Serviços prioritários: religação, religação automática, religação emergencial e desligamento" em texto cinza pequeno.
- Cards essenciais:
  - Layout flex com **barra lateral 4px** com gradiente vertical laranja-vermelho.
  - Badge "ESSENCIAL" pill (rounded-full) com gradiente laranja-vermelho, texto branco bold 11px, no topo do card.
  - Demais informações (tipo de serviço, condomínio, bloco/apto, data/turno, botão "Ver Endereço") seguem o mesmo conteúdo já exibido hoje.

**Seção "Serviços Programados"** (abaixo)
- Cabeçalho equivalente, com gradiente azul-roxo (`from-[#4ecdc4] to-[#6c5cE7]`) e ícone `AlertTriangle`.
- Título em gradient text azul-roxo.
- Descrição: "Demais serviços agendados para execução".
- Cards com barra lateral 4px e badge "PROGRAMADO" no mesmo gradiente azul-roxo.

### Ajustes nos cards

- Wrapper externo: `flex` (com a sidebar à esquerda) + `rounded-xl overflow-hidden bg-white shadow-sm`.
- Hover: `transition-all duration-300 hover:shadow-lg hover:scale-[1.02]` (cubic-bezier definido via classe `ease-[cubic-bezier(0.34,1.56,0.64,1)]`).
- Estrutura interna preservada: ícone + tipo de serviço, condomínio em negrito, bloco/apartamento, rodapé com data/turno + botão "Ver Endereço", badge de status (Agendado/Pendente) à direita do header.
- Animação de entrada `animate-fade-in` com pequeno delay em cascata (`style={{ animationDelay: ... }}`) para suavizar.

### Header e filtros

- Header e barra de busca permanecem.
- Filtros de UF (Todos / BA / CE) **mantidos como estão hoje** (apenas BA e CE têm dados — não vou adicionar SP/MG porque não existem registros nessas UFs no sistema). Caso queira adicionar SP/MG, posso incluir após sua confirmação.
- Botão de UF ativo com `bg-gradient-to-br from-blue-600 to-blue-700 shadow-md`.

### Sem impacto em
- Queries / Supabase.
- Tela de detalhes do serviço.
- Tela de execução (`ExecucaoServicoTerceirizado`).
- Outros módulos.

### Observação
O design system do projeto é compacto (memória `ui/design-system-constraints` define base 14px). Vou aplicar os gradientes e tamanhos solicitados nas seções e badges, mas mantendo paddings e tipografia coerentes com o resto do app coletor (sem inflar cards a ponto de quebrar densidade já estabelecida).
