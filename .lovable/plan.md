

## Corrigir alinhamento do PDF — reescrita do exportRegistroAtendimento

### Problemas identificados no PDF atual

1. **Box do Resumo com altura fixa** (62mm) — gera espaço vazio excessivo quando os dados são curtos
2. **Box de Pagamento com altura fixa** (18mm) — CPF/CNPJ fica fora da caixa
3. **Hack de deletar/recriar página** (linhas 190-192) para resolver z-index — abordagem frágil que causa desalinhamentos
4. **Espaçamentos inconsistentes** entre seções

### Solução

Reescrever `src/lib/exportRegistroAtendimento.ts` com uma abordagem de **duas passadas**:
1. Calcular a altura real de cada seção primeiro
2. Desenhar background, depois conteúdo — sem deletar/recriar páginas

### Mudanças específicas

**1. Eliminar o hack de deletePage/addPage** (linhas 138-221)
- Desenhar o background box ANTES do conteúdo, usando altura calculada dinamicamente
- Cada row tem altura fixa de 14mm, então `boxH = numRows * 14 + padding`

**2. Resumo da Atividade — altura dinâmica**
- 4 rows x 14mm + 8mm padding = calcular conforme dados presentes
- Background desenhado primeiro, conteúdo por cima

**3. Pagamento — altura dinâmica**
- Se tem CPF/CNPJ: 2 rows (forma+valor, cpf) dentro do mesmo box
- Se não tem: 1 row apenas
- Background ajustado ao conteúdo real

**4. Espaçamento uniforme**
- 6mm entre seções (em vez de valores mistos 2/4/8)
- Margens internas consistentes (4mm padding)

### Arquivo impactado
- `src/lib/exportRegistroAtendimento.ts` — reescrita da função principal, helpers mantidos

### Detalhes técnicos
- Remover linhas 138-221 (primeiro desenho + hack de delete)
- Substituir por: calcular alturas → desenhar bg → desenhar conteúdo, tudo sequencial
- Manter `drawHeader`, `drawFooter`, `drawSectionTitle`, `drawLabelValue`, `drawBadge` sem mudança
- Manter interface `RegistroAtendimentoData` intacta

