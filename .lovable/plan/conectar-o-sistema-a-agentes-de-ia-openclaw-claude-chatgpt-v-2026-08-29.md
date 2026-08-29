# Conectar o sistema a agentes de IA (OpenClaw / Claude / ChatGPT) via MCP

Sim. A forma correta hoje é expor o sistema como um **servidor MCP** (Model Context Protocol): o agente se conecta ao endpoint, faz login como um usuário real do sistema e passa a enxergar um conjunto de "ferramentas" que você define — consultar serviços, criar novos serviços, consultar empreendimentos, etc.

Vantagem sobre uma API REST tradicional: o agente descobre sozinho o que pode fazer, e cada chamada respeita exatamente as mesmas permissões (RLS) do usuário que autorizou a conexão. Nenhum dado fica exposto publicamente.

## Como o usuário vai usar

1. No OpenClaw (ou Claude/ChatGPT), adiciona o endereço do servidor MCP do sistema.
2. O agente abre a tela de login do sistema; o usuário entra com e-mail e senha dele.
3. Aparece uma tela de consentimento ("Conectar OpenClaw à sua conta") — o usuário aprova.
4. A partir daí o agente age **como aquele usuário**, respeitando o perfil dele (admin, gestor, operador).

## Ferramentas iniciais propostas

Leitura:
- `listar_servicos` — filtros por UF, condomínio, status, período, protocolo
- `buscar_servico` — detalhes de um serviço por protocolo ou ID
- `listar_empreendimentos` — condomínios terceirizados por UF
- `listar_operadores` — técnicos ativos
- `resumo_operacional` — contagens por status/período

Escrita:
- `criar_servico` — novo serviço (condomínio, bloco, apartamento, morador, telefone, tipo, data, turno, valor)
- `atualizar_servico` — status, data de agendamento, turno, técnico, observação, valor

Se quiser, dá para começar só com leitura e liberar escrita depois.

## Segurança

- Autenticação OAuth 2.1 com o login já existente do sistema — nada de chave fixa ou token colado.
- As ferramentas consultam o banco com o token do usuário, então as regras de RLS atuais valem igual.
- Nenhum acesso administrativo (service role) é usado nas ferramentas.

## Detalhes técnicos

- Pacote `@lovable.dev/mcp-js` + `zod`; ferramentas em `src/lib/mcp/tools/`, registro em `src/lib/mcp/index.ts`.
- Plugin `mcpPlugin()` no `vite.config.ts` gera a Edge Function `supabase/functions/mcp`, que é publicada no backend.
- Fábrica `src/lib/mcp/supabase.ts` que cria o cliente com o token verificado do chamador.
- Servidor OAuth 2.1 ativado no backend + página de consentimento em `/.lovable/oauth/consent`, com a rota de login preservando o retorno (`next`).
- Deploy da função `mcp` ao final; endpoint fica em `https://<projeto>/functions/v1/mcp`.

## Observação sobre operações longas

Chamadas MCP são síncronas com timeout do cliente. Geração de PDF pesada, importação de planilha grande e processamento de fotos ficam fora do MCP — continuam sendo feitos na interface do sistema.
