## Objetivo
Adicionar, na tela **Planejamento de Rotas** (`/medicao-terceirizada/rotas`), um botão que copia para a área de transferência um resumo formatado para WhatsApp, agrupado por **técnico (operador)**, listando os condomínios de cada rota do período selecionado.

## Onde
Arquivo: `src/pages/MedicaoTerceirizada/PlanejamentoRotas.tsx`

Novo botão ao lado de "Adicionar Dia Útil" no card de filtros:
- Rótulo: **"Copiar para WhatsApp"** (ícone `MessageCircle` ou `Copy` do lucide).
- Ao clicar: monta o texto, chama `navigator.clipboard.writeText(...)` e mostra `toast` de sucesso.

## Regras de agrupamento
Escopo = mês/ano/UF selecionados nos filtros (usa dados já carregados: `diasUteis`, `rotasLeitura`, `empreendimentos`).

1. Percorrer `rotasLeitura` do período.
2. Agrupar por **operador** (`operador.nome`). Rotas sem operador atribuído vão para um grupo **"Sem técnico atribuído"**.
3. Dentro de cada técnico, agrupar por **data** (ordenada asc), e listar os condomínios daquele dia (nome do empreendimento).
4. Deduplicar condomínios repetidos no mesmo dia/técnico.

## Formato do texto (WhatsApp)
```
*Planejamento de Rotas - Outubro/2026 (BA)*

*👷 João Silva*
📅 05/10 (seg) - Rota 01
  • Condomínio Sonata
  • Condomínio Barcelona
📅 07/10 (qua) - Rota 02
  • Varandas do Imbuí

*👷 Maria Souza*
📅 06/10 (ter) - Rota 01
  • Condomínio X
```
Data no formato `dd/MM (eee)` com `date-fns` + `ptBR`.

## Detalhes técnicos
- Sem mudanças no banco, sem novas queries — reaproveita `rotasLeitura` já buscada (que inclui `empreendimento.nome` e `operador.nome`).
- Se `rotasLeitura` estiver vazio no período, exibir toast "Nada planejado para copiar".
- Fallback de clipboard: se `navigator.clipboard` indisponível, usar `document.execCommand('copy')` via `<textarea>` temporária.

## Fora do escopo
- Envio direto ao WhatsApp (apenas cópia).
- Alterações em outras telas.
