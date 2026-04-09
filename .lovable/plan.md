

## Redesign dos cards da Lista de Serviços conforme modelo HTML

### O que muda

Atualizar a view de listagem em `src/pages/ColetorServicosTerceirizados.tsx` para:

1. **Barra de busca** — Input de texto acima dos filtros de UF para filtrar por nome do condomínio, endereço ou morador em tempo real
2. **Novo layout dos cards** — Seguindo a hierarquia do HTML anexo:
   - Header do card: ícone por tipo de serviço + tipo em uppercase + badge de status colorido
   - Body: nome do condomínio em destaque (bold, maior) + detalhes da unidade (Bloco/Apto) em cinza abaixo
   - Footer: horário/turno à esquerda + botão "Ver Endereço" à direita (abre Google Maps)
3. **Badges de status com cores semânticas fixas** — Agendado: azul `#007bff`, Pendente: laranja `#ff9800`, Atrasado/Cancelado: vermelho `#f44336`
4. **Botão "Ver Endereço"** — Abre `https://www.google.com/maps/search/?api=1&query=ENDERECO` no app de mapas do dispositivo

### Arquivo: `src/pages/ColetorServicosTerceirizados.tsx`

**Imports adicionais**: `Search`, `MapPin`, `Wrench`, `ClipboardList`, `AlertTriangle`, `Eye` de `lucide-react`; `Input` de `@/components/ui/input`

**Estado novo**: `searchTerm` (string) para a busca

**Função helper**: `getServiceIcon(tipo: string)` — retorna ícone Lucide conforme tipo de serviço (ClipboardList para visita, Wrench para troca, AlertTriangle para inspeção, etc.)

**Filtragem**: Combinar filtro de UF com busca textual (condomínio, endereço do empreendimento, morador)

**Card redesenhado** (list view, linhas 386-413):
```text
┌─────────────────────────────────────┐
│ 📋 VISITA TÉCNICA        [Agendado]│  ← header: ícone + tipo + badge
│                                     │
│ CONDOMÍNIO SANTA ISABELLA           │  ← body: nome bold
│ Bloco B, Apto 102                   │  ← unit details em cinza
│─────────────────────────────────────│
│ Horário: 09:30        [Ver Endereço]│  ← footer: turno + botão mapa
└─────────────────────────────────────┘
```

**Botão "Ver Endereço"**: `onClick` com `stopPropagation` abre `window.open(googleMapsUrl, '_blank')` usando o endereço do empreendimento vinculado

**Badges atualizados**:
- `agendado` → `bg-[#007bff] text-white`
- `pendente` → `bg-[#ff9800] text-white`
- `cancelado` → `bg-[#f44336] text-white`

### Nenhum outro arquivo alterado

