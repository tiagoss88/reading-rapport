

## Simplificar Tela de Login

### Objetivo

Remover as abas "Administração" e "Empreendimento" da tela de login, deixando apenas o formulário de login direto, sem tabs.

### Alteracao

**Arquivo: `src/pages/Login.tsx`**

- Remover os imports de `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Building2`, `Users` e `Link`
- Substituir toda a estrutura de `<Tabs>` pelo formulario de login direto (o conteudo que hoje esta dentro de `TabsContent value="login"`)
- Remover o `CardDescription` que menciona "area administrativa ou acesso do empreendimento"
- Manter apenas o formulario com email, senha e botao "Entrar"

### Resultado

A tela de login fica limpa, com apenas o logo, titulo e formulario de autenticacao, sem opcoes de navegacao entre abas.

