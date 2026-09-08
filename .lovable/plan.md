# Usar datas e prazos da planilha na importação GTI

## O que será feito

Ajustar a importação da planilha GTI para aproveitar as datas que já vêm no arquivo, em vez de sempre recalcular os prazos:

- **Coluna `LEIT ANT`** → preenche o campo `leitura_anterior`.
- **Colunas de prazo da planilha** (`PRAZO INICIO`, `DATA INICIO`, `PRAZO FIM`, `DATA FIM`, etc.) → preenchem `prazo_inicial` e `prazo_final`.
- **Regra de precedência:** se a planilha trouxer os prazos, eles são mantidos. O cálculo automático de 28/32 dias só entra quando a planilha tem a `leitura_anterior` mas não trouxe um ou ambos os prazos.
- **Conversão de datas:** tratar tanto datas no formato texto (`dd/mm/aaaa`, `yyyy-mm-dd`) quanto datas serial do Excel.
- **Validação:** ignorar valores inválidos ou vazios, sem quebrar a importação.

## Onde será alterado

- `src/components/medicao-terceirizada/gti/GtiTab.tsx`
  - Ampliar o mapeamento de aliases para incluir `LEIT ANT` como `leitura_anterior`.
  - Adicionar aliases para colunas de prazo inicial e final já existentes.
  - Criar helper de parsing de datas robusto (texto + serial Excel).
  - Na montagem do objeto de importação:
    1. Usar `leitura_anterior` da planilha quando presente.
    2. Usar `prazo_inicial`/`prazo_final` da planilha quando presentes.
    3. Só recalcular os prazos automaticamente quando a planilha trouxer `leitura_anterior` mas deixar os prazos em branco.
  - Manter os avisos atuais para quando não encontrar colunas obrigatórias.

## O que não muda

- Nenhuma alteração no banco de dados.
- Nenhuma alteração na tela de edição manual nem no botão "Recalcular prazos".
- A regra de 28 a 32 dias continua valendo para cálculo automático e aviso visual.
