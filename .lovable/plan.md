## Painel de Urgências — exibir UF e adicionar "Copiar Resumo"

### Mudança

**Arquivo único:** `src/components/medicao-terceirizada/PainelUrgencias.tsx`

Acrescentar duas melhorias ao painel "Serviços com Prazo Crítico":

1. **Mostrar a UF** em cada item da lista (badge discreto ao lado do nome do condomínio).
2. **Botão "Copiar Resumo"** no cabeçalho do card, gerando um texto formatado pronto para colar no grupo de WhatsApp dos técnicos.

### Detalhes

#### 1. Interface `ServicoNacionalGas`
Adicionar o campo `uf: string` (a coluna já existe na tabela `servicos_nacional_gas` e é NOT NULL, então não precisa de fallback).

#### 2. Exibição da UF na lista
Junto ao nome do condomínio, exibir um badge `outline` pequeno com a UF:
```
[BA] BA DUO HORTENSIAS — Apto 101
```
Posição: imediatamente antes do nome, com classe `text-[10px] px-1.5 py-0` para manter compacto.

#### 3. Botão "Copiar Resumo"
- Ícone `Copy` (lucide-react) + label "Copiar Resumo".
- Posição: dentro do `CardTitle`, à esquerda dos badges de contagem (vencidos/críticos), em `variant="outline" size="sm"`.
- Ao clicar abre um `Dialog` (mesmo padrão da Rota do Dia) com `textarea` somente-leitura + botão "Copiar" que usa `navigator.clipboard.writeText`.
- Toast de confirmação via `useToast` (`{ title: 'Copiado!', description: 'Resumo enviado para a área de transferência.' }`).

#### 4. Formato do texto do resumo

Agrupado por nível de urgência, mais crítico primeiro, com emojis para leitura rápida no WhatsApp:

```
🚨 Serviços com Prazo Crítico — 27/04/2026 14:30

🔴 VENCIDOS (3):
• [BA] BA DUO HORTENSIAS — Apto 101 — Religação — Vencido há 4h
• [SP] CONDOMÍNIO X — Bloco A Apto 22 — Desligamento — Vencido há 12h
• [BA] BA RESIDENCIAL Y — Apto 305 — Religação Emergencial — Data não informada

🟠 CRÍTICOS (2):
• [SP] EDIFÍCIO Z — Apto 12 — Religação — Falta 3h úteis
• [BA] CONDOMÍNIO W — Bloco B Apto 45 — Desligamento — Falta 6h úteis

🟡 ATENÇÃO (4):
• [BA] ...
```

Reaproveitar `formatarTempoRestante` já existente para a coluna de tempo. Data/hora atuais via `format(new Date(), 'dd/MM/yyyy HH:mm')` (date-fns já está em uso no projeto).

#### 5. Estado e imports
- Novo `useState` `resumoOpen`.
- Imports adicionais: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` de `@/components/ui/dialog`; `Copy` de `lucide-react`; `useToast` de `@/hooks/use-toast`; `format` de `date-fns`.

### Resultado

- Cada urgência mostra de imediato a UF, ajudando o despachante a direcionar o técnico certo.
- Um clique gera um resumo formatado, agrupado por nível e pronto para colar no grupo de WhatsApp.
- Sem mudanças em schema, queries, RLS ou outros componentes — a UF já vem na seleção atual de `servicos_nacional_gas`.
