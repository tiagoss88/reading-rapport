# Alerta de serviço repetido mesmo quando o anterior já foi executado

## O que está acontecendo

Hoje o sistema só considera "duplicado" quando existe outro serviço **em aberto** (pendente ou agendado) para o mesmo condomínio, unidade, morador e tipo de serviço.

No caso do Privilege Premium BL 4 AP 203, o serviço anterior já estava **executado ou cancelado**. Por isso a importação não marcou nada e o registro entrou normalmente — o comportamento atual, mas não o que você espera.

## O que vai mudar

Na importação de planilha, cada linha passa a ser comparada com **todos** os serviços já cadastrados, não só os em aberto:

- **Já existe em aberto** — continua marcado como duplicado e fica fora da importação (comportamento atual).
- **Já existe executado/cancelado** — passa a aparecer marcado em amarelo, com o texto "Já existe (protocolo NG-000123 - executado em 10/08/2026)". Essas linhas ficam desmarcadas por padrão, e você decide se quer importar mesmo assim.

O resumo do topo passa a mostrar as duas contagens separadas: duplicados em aberto e repetidos já atendidos.

A mesma verificação entra na tela **Novo Serviço**: se já houver um atendimento igual, mesmo encerrado, aparece o aviso antes de salvar com o protocolo e a data, e você confirma ou cancela.

## Detalhes técnicos

- `src/lib/duplicidadeServico.ts`: `buscarServicoDuplicado` passa a aceitar um modo que também consulta status encerrados e retorna `status_atendimento` e `data_agendamento`/`updated_at` para a mensagem. A chave normalizada (UF + condomínio + bloco + apto + morador + tipo) não muda.
- `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`: a consulta de serviços existentes deixa de filtrar por `STATUS_ABERTO` e passa a mapear chave -> {protocolo, status, data}; `markDuplicates` classifica em `aberto` x `historico`; o preview ganha o segundo badge e o segundo motivo.
- `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`: o diálogo de confirmação passa a exibir também o status do serviço encontrado.
- Nada muda no banco: o índice único `uniq_servico_ng_aberto` continua valendo só para serviços em aberto, para não bloquear reatendimentos legítimos.
