

## Ajuste do PDF para fidelidade visual com o HTML v3

### O que muda

Reescrever `src/lib/exportRegistroAtendimento.ts` para que o PDF gerado via jsPDF reproduza fielmente o layout do HTML v3 — corrigindo espaçamentos, proporções e detalhes visuais que divergem entre a tela (dialog) e o PDF exportado.

### Correções específicas

| Problema atual | Correção |
|---|---|
| Linha do `drawSectionTitle` vai só até x=80 | Estender até `pw - LEFT` (largura completa como no HTML `border-bottom: 1px solid #eee`) |
| Caixa de observação muito curta | Aplicar altura mínima equivalente a ~40mm (150px do HTML) |
| Fotos sem legenda descritiva | Adicionar caption abaixo de cada foto ("Registro 01") com fonte 8pt cinza |
| Footer genérico | Atualizar para "Relatório de Atendimento Gerado via Sistema Lovable" |
| Seção de pagamento com grid 2 colunas sem CPF na mesma grid | CPF/CNPJ como 3º item na mesma grid (sem box separado) |
| Badge arredondamento insuficiente | Aumentar raio de `2` para `4` (pill shape como no HTML `border-radius: 20px`) |
| Espaçamento entre seções inconsistente | Padronizar `SECTION_GAP` para 10mm (equivalente ao `margin-bottom: 25px` do HTML) |
| Assinatura: espaço acima da linha muito curto | Aumentar gap de assinatura para 22mm (equivalente ao `margin-top: 60px` do HTML) |

### Arquivo: `src/lib/exportRegistroAtendimento.ts`

**Constantes atualizadas:**
- `SECTION_GAP = 10` (era 6)
- `ROW_H = 12` (era 14, ajuste para grid mais compacta)

**`drawSectionTitle`:** Linha azul fina (`0.2`) de `LEFT` até `pw - LEFT` em vez de parar em `x=80`

**`drawBadge`:** `roundedRect` com raio `4` (pill)

**Observação:** `min-height` de `Math.max(obsH, 40)` para garantir caixa visível mesmo com texto curto

**Fotos:** Caption com `doc.text("Registro XX", ...)` em font 8pt cinza abaixo da imagem, dentro do container arredondado

**Footer:** Texto atualizado para incluir "Lovable"

### Nenhum outro arquivo alterado
- O dialog (`DetalhesExecucaoDialog.tsx`) permanece intacto
- A interface `RegistroAtendimentoData` não muda

