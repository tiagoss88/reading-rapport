# Página de Integração MCP/API (OpenClaw) em Configurações

Adicionar em Configurações um item "Integração MCP (API)" que reúne tudo que o usuário precisa para conectar o OpenClaw / Claude / ChatGPT ao sistema.

## O que a tela mostra

- **Endereço do servidor MCP** (endpoint público) com botão "Copiar".
- **Como conectar**: passos numerados (adicionar o endereço no agente, fazer login com e-mail e senha do sistema, aprovar a tela de consentimento).
- **Tipo de autenticação**: OAuth 2.1 com o próprio login do sistema — sem chave fixa. Aviso de que o agente age com as permissões do usuário que autorizou.
- **Ferramentas disponíveis**: lista com nome, título e descrição de cada ferramenta (consulta e escrita), com destaque para as que gravam dados.
- **Teste de conexão**: botão que chama o endpoint e mostra se ele está no ar e respondendo com os metadados de autenticação corretos.

Acesso restrito a administradores, igual a "Sistema" e "Log de Erros".

## Detalhes técnicos

- Nova página `src/pages/ConfiguracoesMCP.tsx`.
- Rota `/configuracoes/mcp` em `src/App.tsx`, protegida com `role: 'admin'` no mesmo padrão de `/configuracoes/logs`.
- Novo item em `configuracoesItems` de `src/components/Layout.tsx` (ícone `Plug`), role admin.
- A lista de ferramentas é lida de `.lovable/mcp/manifest.json` (import estático), então acompanha automaticamente mudanças no servidor MCP.
- Endpoint montado a partir de `VITE_SUPABASE_URL` + o `path` do manifesto (`/functions/v1/mcp`).
- Teste de conexão: `fetch` no endpoint; 401 com cabeçalho `WWW-Authenticate` é considerado sucesso (servidor no ar exigindo OAuth).

Nenhuma mudança no servidor MCP em si — apenas uma tela de documentação e diagnóstico dentro do sistema.
