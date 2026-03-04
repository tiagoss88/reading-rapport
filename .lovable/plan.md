

## Plano: Botão "Copiar Resumo" na Rota do Dia

### Objetivo
Adicionar um botão no header da aba "Rota do Dia" que abre um dialog com texto formatado separando condomínios **Concluídos** e **Pendentes** do dia, pronto para copiar e enviar via WhatsApp.

### Alteração
**`src/pages/MedicaoTerceirizada/Leituras.tsx`**

1. Adicionar estado `resumoOpen` (boolean) e botão ao lado do filtro de UF/data no header da aba "Rota do Dia"
2. Criar um `Dialog` com o resumo textual gerado a partir de `rotasAgrupadas`:
   - Separar em duas listas: **Concluídos** (statusEfetivo === 'concluido') e **Pendentes** (demais)
   - Formato do texto:
     ```
     📋 Rota do Dia - DD/MM/YYYY

     ✅ CONCLUÍDOS (X):
     • Condomínio A - Rota 1
     • Condomínio B - Rota 2

     ⏳ PENDENTES (Y):
     • Condomínio C - Rota 3
     • Condomínio D - Rota 4
     ```
3. Botão "Copiar" usa `navigator.clipboard.writeText()` com toast de confirmação
4. O texto é exibido num `<pre>` ou `<textarea>` selecionável para cópia manual também
5. Respeitar o filtro de UF ativo (`filtroUFRotaDia`)

### Componentes usados
Apenas componentes já existentes: `Dialog`, `Button`, `toast`. Nenhum arquivo novo necessário.

