# Chave de acesso gerada automaticamente para o OpenClaw

O servidor de conexão por chave (`mcp-api`) já está no ar e a tela em Configurações já mostra o endereço e o bloco de configuração. Falta só a chave. Em vez de pedir valores no formulário, o próprio sistema passa a gerar e guardar a chave.

## Como vai funcionar

- Na tela **Configurações → Integração MCP (API)**, no bloco "Conexão rápida por chave", aparece um botão **"Gerar chave de acesso"**.
- Ao clicar, o sistema cria uma chave longa e aleatória, guarda no banco e mostra na tela com botão de copiar (com opção de ocultar/mostrar).
- Se já existir uma chave, a tela mostra quando foi criada e oferece **"Gerar nova chave"** (a anterior deixa de funcionar imediatamente, com aviso antes de confirmar).
- O bloco de configuração pronto para colar no OpenClaw passa a vir com a chave real preenchida, não com o texto de exemplo.
- Só administradores veem e geram a chave.

## Sobre o acesso ao banco

Hoje o servidor por chave precisa de uma credencial administrativa do banco que ainda não foi informada. Para não depender disso, ele passa a usar a credencial padrão que o próprio ambiente da função já fornece — nenhum valor a digitar. Como o servidor identifica o chamador pela chave e não por um usuário logado, as consultas rodam com acesso administrativo; por isso a chave deve ser tratada como senha e entregue só a quem pode ver e gravar todos os serviços.

Continua pendente confirmar de qual banco o servidor lê: a função está publicada no projeto de backend atual, e é esse banco que ela vai consultar. Se os serviços que você espera ver estiverem em outro banco, o primeiro teste vai voltar vazio e aí resolvemos apontando o servidor para o banco certo.

## Detalhes técnicos

- Migração: tabela `mcp_api_keys` (`id`, `token_hash`, `prefixo`, `criado_em`, `criado_por`, `revogado_em`), com GRANTs e RLS restrita a admin (`has_role`/padrão de permissão já usado no projeto). O token em claro fica em coluna própria acessível só via função `security definer` para admin, ou é guardado cifrado e reexibido apenas ao gerar — a escolha final é guardar o valor em claro com RLS admin, para permitir reexibir depois.
- Nova edge function `mcp-api-key` (`verify_jwt` padrão, valida JWT + papel admin em código) com ações `get` e `rotate`.
- `supabase/functions/mcp-api/index.ts`: troca a validação por `MCP_API_KEY` por consulta à tabela (comparação em tempo constante, cache curto em memória) e passa a usar `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` do ambiente da função, removendo `NGD_SUPABASE_URL`/`NGD_SERVICE_ROLE_KEY`.
- `supabase/config.toml`: `[functions.mcp-api] verify_jwt = false`.
- `src/pages/ConfiguracoesMCP.tsx`: carregar a chave existente, botões gerar/rotacionar/copiar, snippet com a chave real, manter o teste de conexão já existente.
