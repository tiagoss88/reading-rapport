# Log de Erros do Sistema

Adicionar um registro de erros dentro de Configurações, para investigar o que acontece quando algo falha no app.

## O que será feito

1. **Captura automática de erros no app**
   - Erros JavaScript não tratados (`window.onerror`) e promessas rejeitadas (`unhandledrejection`).
   - Erros de operações no banco (falhas nas chamadas do backend) via um helper único de registro.
   - Cada registro guarda: data/hora, usuário logado (email/id), rota onde ocorreu, mensagem, detalhes técnicos (stack), dispositivo/navegador e severidade (erro/aviso).

2. **Nova tela "Log de Erros"** em `/configuracoes/logs` (acesso apenas admin, igual às Configurações do Sistema)
   - Lista mais recentes primeiro, com paginação (25/50/100).
   - Filtros: período, severidade, usuário e busca por texto na mensagem.
   - Clicar num item abre os detalhes completos (stack, rota, navegador).
   - Botões: atualizar, exportar CSV e limpar logs com mais de X dias.

3. **Retenção**: registros com mais de 30 dias podem ser apagados pelo botão de limpeza (sem job automático nesta etapa).

## Detalhes técnicos

- Tabela `logs_erro` no banco: `id`, `created_at`, `user_id`, `user_email`, `rota`, `severidade`, `mensagem`, `detalhes` (texto), `user_agent`, `contexto` (jsonb).
- GRANTs: `INSERT` para `authenticated` e `anon` (erros na tela de login), `SELECT`/`DELETE` apenas para admin via `has_role`; `ALL` para `service_role`. RLS habilitada com essas políticas.
- `src/lib/errorLogger.ts`: função `logError(error, contexto)` com fila e proteção contra loop/duplicatas (não registra o mesmo erro repetido em curto intervalo).
- Registro dos listeners globais em `src/main.tsx`.
- Nova página `src/pages/LogsErro.tsx` + rota admin em `App.tsx` + item no menu Configurações em `Layout.tsx`.

## Fora do escopo

- Logs das funções de servidor (edge functions) já ficam no painel de backend; não serão duplicados aqui nesta etapa.
