# Conexão do OpenClaw ao MCP — diagnóstico e correção

## O que já foi verificado agora

O servidor MCP está no ar e respondendo corretamente:

- `POST .../functions/v1/mcp` → 401 com o cabeçalho `WWW-Authenticate` correto (comportamento esperado antes do login).
- Metadados do recurso protegido → 200, apontando para o servidor de autorização certo.
- Metadados do servidor de autorização (caminho conforme a norma RFC 8414) → 200.

Ou seja: não há 404 no endereço correto do MCP.

## Onde o 404 realmente aparece

Dois caminhos retornam 404 e são as causas prováveis do erro no OpenClaw:

1. **Endereço errado configurado no cliente.** Se foi informado o domínio do app (`https://ngd.agasen.com.br/...`) em vez do endereço do servidor MCP, o cliente cai na página do site (ou em "Not found"), nunca no MCP.
2. **Descoberta na raiz.** Alguns clientes procuram os metadados de autorização em `https://<host>/.well-known/oauth-authorization-server` (raiz), que retorna 404. O caminho válido inclui o sufixo do emissor. Clientes que seguem a versão atual da especificação funcionam; clientes antigos falham com 404.

## Plano

1. Confirmar com você qual endereço exato está cadastrado no OpenClaw (e se ele mostra o 404 na conexão ou já no passo de login).
2. Se for endereço errado: usar o endereço oficial mostrado em Configurações → Integração MCP (botão "Copiar") e reconectar.
3. Se for descoberta na raiz (cliente antigo): documentar na página de Integração MCP os endereços de autorização, token e registro dinâmico para preenchimento manual no OpenClaw, incluindo um bloco de configuração pronto para copiar.
4. Ampliar a página Configurações → Integração MCP com um diagnóstico mais completo: testar o endpoint MCP, os metadados do recurso e os metadados de autorização, mostrando o status de cada um, para identificar a falha sem depender de suporte.
5. Validar o fluxo completo de login (tela de consentimento em `/.lovable/oauth/consent`) após a reconexão.

## Detalhes técnicos

- Endpoint MCP: `https://<project-ref>.supabase.co/functions/v1/mcp`
- Metadados do recurso: `<endpoint>/.well-known/oauth-protected-resource`
- Emissor OAuth: `https://<project-ref>.supabase.co/auth/v1` (metadados em `/.well-known/oauth-authorization-server/auth/v1`)
- Nenhuma alteração de backend/edge function é necessária: o servidor já responde corretamente. As mudanças previstas são só na página de Integração MCP (diagnóstico e instruções).
