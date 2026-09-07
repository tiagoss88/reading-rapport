# Conexão do OpenClaw por chave de API (sem OAuth)

O login por OAuth está travando o OpenClaw. A solução é criar um segundo endereço de conexão que usa apenas uma **chave fixa**: você copia a chave, cola no OpenClaw e pronto — sem tela de login, sem consentimento.

O endereço atual com OAuth continua existindo e funcionando para outros agentes.

## O que muda para você

Na tela **Configurações → Integração MCP (API)** aparece um novo bloco no topo: **"Conexão rápida por chave"**, com:

- O endereço do servidor por chave, com botão "Copiar".
- A chave de acesso, exibida mascarada com botão "Copiar" e "Mostrar".
- Um bloco de configuração pronto para colar no OpenClaw (endereço + cabeçalho de autenticação).
- Botão "Testar conexão" que confirma se o servidor responde e se a chave é aceita.

As mesmas 7 ferramentas de hoje ficam disponíveis: listar serviços, buscar serviço, listar condomínios, listar operadores, resumo operacional, criar serviço e atualizar serviço (consulta e escrita).

## Segurança

- A chave é gerada automaticamente (valor aleatório longo) e guardada no cofre de segredos do sistema, não no código.
- Quem tem a chave age com acesso administrativo aos dados de serviços, condomínios e operadores — trate como senha.
- É possível trocar a chave a qualquer momento (gerar de novo invalida a anterior).
- Só administradores enxergam a página.

## Detalhes técnicos

- Novo segredo `MCP_API_KEY` criado via `generate_secret` (64 caracteres).
- Nova Edge Function `mcp-api` (`verify_jwt = false`), escrita à mão — não gerada pelo plugin MCP — implementando MCP Streamable HTTP JSON-RPC: `initialize`, `tools/list`, `tools/call`, com CORS liberado e resposta `application/json`.
  - Autenticação: cabeçalho `Authorization: Bearer <MCP_API_KEY>` ou `x-api-key`; comparação em tempo constante; 401 com corpo JSON-RPC em caso de chave inválida.
  - Acesso aos dados via cliente `service_role` (a chave já é a credencial), com as mesmas consultas/validações das ferramentas em `src/lib/mcp/tools/*`, incluindo a checagem de duplicidade de `criar_servico` (`permitir_duplicado`) e o tratamento do erro 23505.
  - Os esquemas de entrada são declarados como JSON Schema no `tools/list`, espelhando os `zod` atuais.
- `src/lib/mcp/**` e `supabase/functions/mcp/index.ts` (auto-gerado) não são alterados; o caminho OAuth permanece intacto.
- `src/pages/ConfiguracoesMCP.tsx`: novo card no topo com endereço `${BASE}/functions/v1/mcp-api`, snippet de configuração (`type: http`, `headers: { Authorization: "Bearer <chave>" }`) e teste de conexão chamando `tools/list` com a chave.
- A chave não pode ser lida do navegador a partir do cofre; a página busca o valor mascarado/completo por uma rota da própria função (`GET /whoami` autenticada pela sessão de admin) ou, se preferir simplicidade, exibe apenas instruções e o botão de teste. Implementação escolhida: a função expõe `POST` com ação `reveal_key` autorizada pelo JWT de um usuário admin do sistema, para que a página possa mostrar e copiar a chave sem expô-la publicamente.
- Deploy das funções e verificação com `curl` ao final (`tools/list` com e sem chave).
