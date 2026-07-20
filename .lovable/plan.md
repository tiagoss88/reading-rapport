## Diagnóstico

Confirmei no banco (`servicos_nacional_gas`): **não existe nenhum registro** com condomínio ANHEMBI nem com apartamento 303 vinculado a ele. Ou seja, a mensagem de "duplicado" **não vem de um serviço já cadastrado** — vem da própria detecção **dentro do arquivo que está sendo importado**.

A lógica está em `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx` (linhas 62–173):

- A chave de duplicidade é: `uf | condominio | bloco | apartamento | tipo_servico | morador_nome`.
- `normUnidade` remove tudo que não é letra/número **e remove zeros à esquerda** (ex.: `0303` vira `303`).
- `normCondo` remove sufixos como `(GTI)` e o prefixo `BA `.
- Ao percorrer as linhas, se duas linhas geram a mesma chave, a segunda é marcada como "duplicado" — mesmo que, no mundo real, sejam solicitações legítimas diferentes (datas/turnos/observações distintos).

Causas prováveis do falso positivo em "ANHEMBI BL A AP 303":

1. O arquivo tem, de fato, **duas linhas** para a mesma unidade + mesmo tipo de serviço + mesmo morador (ou morador vazio nos dois). Isso pode ser legítimo (2ª visita, retorno).
2. Ou existe outra unidade cujo bloco/apartamento, após a normalização (remoção de zeros e caracteres), colapsa para a mesma chave (ex.: `A / 303` vs `A / 0303`, ou `BL A / 303` vs `A / 303`).

## Plano

1. **Investigação guiada** — adicionar um log de debug que, ao marcar um duplicado, imprime no console:
   - as duas linhas envolvidas (índice na planilha + valores originais de bloco, apto, tipo, morador),
   - a chave normalizada que colidiu.
   Isso permite ver exatamente qual outra linha da própria planilha causou a marcação em ANHEMBI 303.

2. **Ajuste na regra de duplicidade** para reduzir falsos positivos:
   - Incluir `data_agendamento` (quando existir) na chave: duas solicitações para a mesma unidade em datas diferentes não são duplicadas.
   - Quando `morador_nome` estiver vazio nas duas linhas, **não** considerar duplicado automaticamente — exigir que também coincida `data_agendamento` (ou pelo menos `data_solicitacao`) para marcar.
   - Mostrar no tooltip/badge "Duplicado" o motivo (qual linha da planilha ou qual protocolo do banco causou o match), para o usuário conseguir decidir.

3. **Permitir importar mesmo assim** — manter a opção atual que ignora duplicados, mas adicionar um checkbox "Importar duplicados marcados" para os casos legítimos (retorno, 2ª visita).

### Arquivos afetados

- `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx` — ajuste em `makeDuplicateKey`, `markDuplicates`, UI do preview e do rodapé de importação.

### Fora de escopo

- Alterações no schema do banco.
- Alterações em outras telas (Serviços, Coletor).