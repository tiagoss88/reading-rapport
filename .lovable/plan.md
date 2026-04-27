## Botão "Copiar Resumo" na aba Pendentes (Leituras)

### Objetivo
Adicionar um botão "Copiar Resumo" na aba **Pendentes** da página `Leituras` (Medição), gerando texto pronto para envio no WhatsApp dos operadores com a lista de condomínios ainda não coletados na competência atual, respeitando os filtros de UF e Rota já aplicados.

### Arquivo
`src/pages/MedicaoTerceirizada/Leituras.tsx`

### Mudanças

1. **Novo estado**
   - `const [resumoPendentesOpen, setResumoPendentesOpen] = useState(false)` (separado do `resumoOpen` da Rota do Dia).

2. **Botão no `CardHeader` da aba Pendentes**
   - Posicionado ao lado dos filtros (mesmo padrão visual do botão da Rota do Dia: `Button variant="outline" size="sm"` com ícone `Copy`).
   - Desabilitado quando `pendentesFiltrados.length === 0`.

3. **Dialog de resumo**
   - Reaproveita o padrão do `Dialog` existente da Rota do Dia: `textarea` readonly + botão "Copiar" que usa `navigator.clipboard.writeText` e dispara `toast`.
   - Formato do texto:
     ```
     ⏳ Leituras Pendentes — <Mês/Ano da competência>
     [UF: BA | Rota: 3]      ← linha só aparece quando há filtro ativo
     Total: N condomínios

     • [BA] Nome do Condomínio — Rota 3 — 24 medidores
     • [CE] Nome do Condomínio — Rota 1 — 18 medidores
     ...
     ```
   - Agrupamento opcional por UF quando `filtroUF === 'todas'` (cabeçalho `── BA (X) ──`, `── CE (Y) ──`) para melhor leitura no WhatsApp; quando filtrado por UF, lista corrida.
   - Ordenação: por UF, depois Rota, depois Nome.

4. **Label da competência**
   - Reutilizar `competenciaOptions` para obter o label legível (ex.: "Abril 2026") a partir de `competencia`.

### Comportamento esperado
- Botão visível apenas na aba Pendentes; não interfere no botão existente da Rota do Dia.
- Conteúdo do resumo reflete exatamente o que está sendo exibido na tabela (filtros UF/Rota aplicados).
- Toast "Copiado!" confirma a ação.
- Sem alterações em queries, schema ou outros componentes.
