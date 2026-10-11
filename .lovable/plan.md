# Financeiro: ignorar Religação e Desligamento

## O que muda para você
Além de "Leitura", o Financeiro passa a ignorar também os serviços de **Religação** e **Desligamento**, pois o valor deles vem da contratante junto com as leituras.

- Somem de Contas a receber, Recebimentos, Resumo, Inadimplência e das exportações.
- O bloco financeiro também deixa de aparecer na edição dessas OS.
- Reconhece variações: Religação, Religação automática, Religação emergencial, Religamento, Desligamento, Desligação (com ou sem acento, maiúsculas, plural).
- Não muda nada em Serviços, coletor, relatórios de serviço ou estoque. Sem alteração de banco.
- Continuam cobrados: Instalação, Visita técnica, Troca de medidor etc.

## Detalhes técnicos
- `src/hooks/useFinanceiro.ts`: ampliar `TIPOS_NAO_COBRADOS` para `['leitura', 'religacao', 'religamento', 'desligamento', 'desligacao']`.
- Ajustar `TERMOS_IGNORADOS` para também gerar o plural "-coes" (religacoes, desligacoes), mantendo a regra de prefixo por palavra inteira.
- A filtragem já é centralizada em `useFinanceiroDados` e `FinanceiroDaOsCard`, então nenhum outro arquivo precisa mudar.
- Atualizar a memória do projeto (regra de tipos não cobrados no Financeiro).
- Se existirem recebimentos já lançados em OS desses tipos, ficam guardados no banco, apenas não aparecem.
