# Prazos automáticos na aba Leituras / GTI

Ao informar a data da leitura anterior, o sistema já mostra sozinho o prazo inicial (28 dias corridos depois) e o prazo final (32 dias corridos depois).

## Como vai funcionar

- **Digitou a data, apareceu o prazo.** Em qualquer lugar onde a data da leitura anterior é preenchida — na edição de um registro e na lista — os dois prazos são calculados na hora.
- **Regra:** prazo inicial = leitura anterior + 28 dias; prazo final = leitura anterior + 32 dias.
- **Edição direta na lista.** A coluna "Leitura anterior" passa a ter um campo de data editável (para quem tem permissão). Ao escolher a data, os prazos aparecem preenchidos e são gravados junto.
- **Ajuste manual continua possível.** Se alguém alterar um prazo à mão, o valor é respeitado; se ficar fora da janela de 28 a 32 dias, aparece um aviso discreto em amarelo na linha, sem bloquear.
- **Botão "Recalcular prazos"** no topo: preenche os prazos de todos os registros do mês exibido que tenham data de leitura anterior, seguindo a regra.
- **Importação de planilha:** quando a planilha traz a leitura anterior mas não traz os prazos, eles passam a ser preenchidos automaticamente pela mesma regra (prazos vindos da planilha continuam prevalecendo).

## Detalhes técnicos

- Arquivo único: `src/components/medicao-terceirizada/gti/GtiTab.tsx`.
- Função utilitária `calcularPrazos(leituraAnterior)` usando `addDays` do `date-fns` sobre data local (`yyyy-MM-ddT00:00:00`), retornando `{ prazo_inicial, prazo_final }` em `yyyy-MM-dd`.
- `EditDialog`: `onChange` da leitura anterior recalcula os dois prazos; campos de prazo permanecem editáveis.
- Tabela principal: célula de leitura anterior vira `Input type="date"` compacto que dispara o mesmo `salvarEdicao` já existente (mantém o fallback `configuracoes_sistema` quando a tabela dedicada não está disponível).
- Validação visual: diferença em dias fora de 28–32 marca a linha com aviso; nenhuma gravação é bloqueada.
- Botão "Recalcular prazos" percorre os registros filtrados e grava em lote pelo mesmo caminho de update já usado.
- Sem mudanças no banco de dados nem nas colunas existentes.
