# Liberar o acesso do OpenClaw por OAuth

Verifiquei agora o estado atual: o servidor OAuth do sistema **já está ligado**, com cadastro automático de aplicativos externos habilitado, e a tela de autorização (`/.lovable/oauth/consent`) responde normalmente no endereço oficial `https://ngd.agasen.com.br`. O login também já devolve o usuário para a tela de autorização depois de entrar.

Ou seja, não falta "ligar" nada — falta garantir que o OpenClaw esteja usando o endereço certo e concluir o teste de ponta a ponta.

## Passos

1. Reaplicar a configuração do servidor OAuth (operação segura, mantém o que já existe) para confirmar que está ativa e apontando para o endereço oficial do sistema.
2. Conferir os três endereços que o OpenClaw usa: o servidor MCP, os dados do recurso protegido e os dados do servidor de autorização.
3. Republicar a função do MCP, garantindo que a versão no ar é a atual.
4. Fazer um teste real de conexão no navegador: abrir a tela de autorização com login e confirmar que os botões Autorizar/Recusar funcionam e devolvem o usuário ao aplicativo que pediu acesso.
5. Entregar a você um bloco pronto para colar no OpenClaw, com o endereço do servidor e a configuração manual, caso ele não descubra sozinho.

## Detalhes técnicos

- Endpoint MCP: `https://cfyhskxjvvqpnnzsebud.supabase.co/functions/v1/mcp` (não usar `ngd.agasen.com.br/mcp` — esse endereço serve o site, por isso o 404 relatado).
- Emissor OAuth: `https://cfyhskxjvvqpnnzsebud.supabase.co/auth/v1`; registro dinâmico de clientes ativo.
- Consentimento em `/.lovable/oauth/consent`, já roteado em `src/App.tsx`, com preservação de `next` no login.
- Sem mudanças de banco: as ferramentas do MCP usam o token do usuário e respeitam as regras de acesso atuais.
