
## Compactar tabela de Serviços — eliminar scroll horizontal

A tabela ficou larga demais com padding `py-3 px-4`. Vou reduzir para o padrão compacto do projeto e otimizar larguras.

### Mudanças em `src/pages/MedicaoTerceirizada/Servicos.tsx`

**1. Reduzir padding de todas as células**
- Headers: `h-9 px-2` (de `py-3 px-4`)
- Body cells: `py-1.5 px-2` (de `py-3 px-4`)
- Font sizes: `text-xs` no body, `text-[10px]` nos headers

**2. Compactar conteúdo das colunas**
- "Bloco/Apto" abreviado para "Bl X - Ap Y"
- Turno abreviado para "(M)" ou "(T)" em vez de "(Manhã)"/"(Tarde)"
- Condomínio com `max-w-[180px] truncate`
- Morador com `max-w-[120px] truncate`
- Técnico com `max-w-[100px] truncate`
- `whitespace-nowrap` em Protocolo, Solicitação, Agendamento, Bloco/Apto

**3. Compactar badges**
- Status: `px-2 py-0.5 text-[10px]` (de `px-3 py-1.5 min-w-[100px]`)
- Origem: `px-1.5 py-0 text-[10px]` (de `text-[11px]`)
- Vinculação: texto inline sem fundo (de micro-badge)

**4. Compactar botões de ação**
- `h-7 w-7` (de `h-8 w-8`), ícones `h-3.5 w-3.5`
- Coluna ações: `w-[80px]` (de `w-[110px]`)
- Gap entre botões: `gap-0.5`

**5. Container da tabela**
- `overflow-hidden` em vez de `overflow-x-auto` para evitar scroll horizontal
- Remover `shadow-sm` extra

### Arquivo modificado
- `src/pages/MedicaoTerceirizada/Servicos.tsx`
