
## Redesign da Lista de Serviços

Melhorar a interface da aba "Serviços" na página `MedicaoTerceirizada/Servicos.tsx`, seguindo o HTML de referência enviado. Sem mudanças no banco de dados.

### Mudanças no arquivo `src/pages/MedicaoTerceirizada/Servicos.tsx`

**1. Tabela com melhor espaçamento e legibilidade**
- Aumentar padding das células (py-3 px-4 em vez do padrão compacto)
- Header da tabela com fundo `bg-gray-50`, borda inferior mais forte, texto uppercase 11px com letter-spacing
- Hover nas linhas com `bg-gray-50/80` e transição suave
- Bordas entre linhas mais sutis (`border-gray-100`)
- Protocolo com `font-mono font-semibold` e cor mais forte

**2. Status badges maiores e mais visuais**
- Padding aumentado (`px-3 py-1.5`), `min-w-[100px]`, `text-center`
- Cores mais definidas conforme referência:
  - Agendado: `bg-blue-50 text-blue-800`
  - Pendente: `bg-amber-50 text-amber-800`
  - Executado: `bg-emerald-50 text-emerald-800`
  - Cancelado: `bg-red-50 text-red-800`

**3. Coluna Condominio aprimorada**
- Nome em `font-semibold`
- Status de vinculacao como micro-badge com fundo colorido (verde para vinculado, amber para nao vinculado)

**4. Origem badges com cores da referencia**
- BG: fundo indigo claro `bg-indigo-100 text-indigo-800`
- NGD: fundo verde claro `bg-emerald-100 text-emerald-800`

**5. Botoes de acao com hover azul**
- Hover com `text-blue-600` e borda azul sutil
- Tooltips via atributo `title`

**6. Ordenacao de colunas (click no header)**
- Estado local `sortColumn` e `sortDirection`
- Colunas ordenaveis: Protocolo, Solicitacao, Condominio, Morador, Status
- Icone de seta no header ativo
- Ordenacao aplicada antes da paginacao

**7. Toolbar e filtros**
- Manter layout existente, apenas ajustar espaçamento para ficar mais respirado
- Busca com placeholder mais descritivo incluindo "protocolo"

### Arquivo modificado
- `src/pages/MedicaoTerceirizada/Servicos.tsx` -- ajustes de classes CSS e adição de lógica de ordenação

### Sem novas dependencias
Usa apenas Tailwind classes e componentes UI existentes.
