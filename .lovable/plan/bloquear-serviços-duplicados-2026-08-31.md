# Bloquear serviços duplicados

## Por que hoje entram duplicados

Verifiquei o código de entrada de serviços. Hoje existem três caminhos para criar um serviço e apenas um deles tem checagem:

1. **Importação de planilha** — tem checagem, mas a chave de duplicidade exige que o **nome do morador E a data de agendamento** sejam iguais. Se a planilha vier sem morador ou com data diferente, a linha passa como nova. Além disso, linhas sem morador e sem data nunca são marcadas (regra `hasDuplicateSignal`), e existe a opção "Importar mesmo os duplicados".
2. **Cadastro manual** (Novo serviço Nacional Gás) — não faz nenhuma verificação antes de inserir.
3. **API/MCP** (`criar_servico`, usado por agentes externos) — também insere direto, sem verificação.
4. **Banco de dados** — não há índice único; qualquer inserção repetida é aceita.

## Regra de duplicidade a adotar

Um serviço é duplicado quando coincidem, de forma normalizada (sem acentos, maiúsculas/minúsculas, zeros à esquerda, "BL/AP" etc.):

- Condomínio (UF + nome)
- Unidade (bloco + apartamento)
- Nome do cliente/morador
- Tipo de serviço

Serviços já **executados** ou **cancelados** não bloqueiam um novo pedido — o bloqueio vale contra serviços em aberto (pendente/agendado). Assim uma revisita legítima continua possível.

## O que será feito

1. **Utilitário único de chave de duplicidade** (`src/lib/duplicidadeServico.ts`) com a normalização acima, reaproveitado por todos os caminhos, substituindo a lógica que hoje vive só no importador.
2. **Importação de planilha**: passa a usar a nova chave (sem exigir data nem depender de "sinal" de morador); mantém a lista de duplicados com motivo e protocolo do serviço existente, e mantém a opção de forçar (com confirmação explícita).
3. **Cadastro manual**: antes de salvar, consulta serviços em aberto com a mesma chave e mostra um aviso com o protocolo existente, exigindo confirmação para prosseguir.
4. **API/MCP `criar_servico`**: retorna erro informando o protocolo do serviço já existente, a menos que seja enviado `permitir_duplicado: true`.
5. **Trava no banco**: índice único parcial em `servicos_nacional_gas` sobre a chave normalizada, limitado a status `pendente`/`agendado`, garantindo que nenhum caminho (inclusive futuro) crie a mesma pendência duas vezes.
6. **Relatório de duplicados existentes**: consulta para listar o que já está duplicado hoje, para você decidir o que cancelar antes de aplicar o índice único (o índice só é criado depois da limpeza).

## Detalhes técnicos

- Normalização: `lower` + remoção de acentos + remoção de não-alfanuméricos; bloco "único"/"U"/vazio equivalentes; apartamento sem zeros à esquerda.
- Índice: coluna gerada ou expressão `immutable` com `unaccent`-free (usando `translate`/`regexp_replace`) para permitir índice único parcial `WHERE status_atendimento IN ('pendente','agendado')`.
- Sem alteração de layout; apenas diálogos de aviso/confirmação nos formulários.
