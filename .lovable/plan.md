
## Redesign da Agenda de Serviços

### Resumo
Redesenhar o componente AgendaSemanal com visual mais compacto e moderno, melhorar feedback visual de drag-and-drop, e permitir reordenação dos cards dentro de cada coluna de dia (apenas visual, sem persistência no banco).

### Sem alterações no banco de dados
A ordem dos cards é apenas local/visual — o usuário arrasta para reorganizar a pilha dentro de cada dia, mas essa ordem não é salva no backend.

### Mudanças no componente `AgendaSemanal.tsx`

**1. Cards de Serviço mais compactos e modernos**
- Padding reduzido (12px)
- Borda esquerda colorida por status (mantém padrão atual)
- Badge de número sequencial (posição na pilha) no canto superior direito
- Ícone drag-handle (⋮⋮) visível no hover
- Hover com sombra e leve elevação
- Tipo de serviço em badge uppercase compacto
- Localização com ícone de pin

**2. Drag-and-drop aprimorado**
- Arrastar cards entre colunas de dia (já existe — atualiza `data_agendamento`)
- Arrastar cards dentro da mesma coluna para reordenar a pilha (novo — apenas visual)
- Estado local `orderedByDay` controla a sequência dos cards por dia
- Feedback visual: card arrastado com opacidade + escala reduzida, zona de drop com fundo azul claro

**3. Colunas de dia melhoradas**
- Header mais estruturado: nome do dia, data formatada, contador em badge
- Coluna "Hoje" com destaque azul mais marcante (borda + fundo)
- Transições suaves (200ms)

**4. Filtros e navegação**
- Mantém filtros existentes (UF, Status, Tipo, Bairro) sem alterações funcionais
- Layout visual levemente mais compacto

### Arquivo modificado
- `src/components/medicao-terceirizada/AgendaSemanal.tsx` — redesign completo

### Sem novas dependências
Drag-and-drop nativo do HTML5 (já em uso).
