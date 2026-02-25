

## Icone de Perfil no Menu do Coletor

### Objetivo

Adicionar um botao de perfil ao lado do botao "Sair" no header do menu do coletor, permitindo que o operador visualize seu perfil e troque sua senha.

### Alteracoes

**Arquivo: `src/pages/ColetorMenu.tsx`**

- Importar o componente `ProfileDialog` de `@/components/ProfileDialog` (ja existe no projeto e permite troca de senha).
- No header, ao lado do botao de logout, adicionar o `<ProfileDialog />` que renderiza um botao com avatar e abre um dialog de perfil.
- Os dois botoes (perfil + sair) ficarao lado a lado com `flex items-center gap-1`.

### Layout resultante

```text
┌──────────────────────────────────┐
│ 👤 Menu Principal     [perfil][×]│
│    operador@email.com            │
└──────────────────────────────────┘
```

O componente `ProfileDialog` ja possui:
- Exibicao do email do usuario (somente leitura)
- Campos para nova senha e confirmacao
- Validacao e chamada a `supabase.auth.updateUser`

Nenhum componente novo precisa ser criado. Apenas uma importacao e insercao no JSX do header.

