# Publicar e validar o servidor MCP

O código do MCP já está pronto (7 ferramentas, rota de consentimento, plugin no build) e o OAuth 2.1 com registro dinâmico já está ativo no backend. Falta colocar o servidor no ar e conferir se ele responde.

## Passos

1. Regerar e validar o manifesto das ferramentas MCP, garantindo que os 7 tools estejam corretos e descritos.
2. Fazer o deploy da função `mcp` no backend.
3. Testar o endpoint: confirmar que ele exige autenticação (401 sem token) e que publica os metadados de recurso protegido apontando para o servidor de autorização correto.
4. Conferir a rota de consentimento `/.lovable/oauth/consent` no app, incluindo o retorno correto após login.
5. Publicar o app para que a rota de consentimento fique disponível na URL oficial.

## Detalhes técnicos

- Endpoint final: `https://<projeto>.supabase.co/functions/v1/mcp`
- Emissor OAuth: `https://<projeto>.supabase.co/auth/v1`
- Validação: `app_mcp_server--extract_mcp_manifest`, deploy via ferramenta de edge functions, testes via requisições HTTP diretas.
- Nenhuma alteração de schema do banco; as ferramentas usam o token do usuário e respeitam RLS.

## Depois

Você recebe a URL do MCP para colar no OpenClaw; ele fará o registro dinâmico, abrirá a tela de consentimento e passará a operar como o usuário que autorizou.
