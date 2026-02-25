

## Diagnóstico: Redirecionamento ao Dashboard

### Problema identificado

O console mostra claramente o erro:
```
No routes matched location "/coletor/leituras-terceirizadas"
```

A URL que o preview está tentando acessar (`/coletor/leituras-terceirizadas`) **não existe** no `App.tsx`. A rota correta para a tela de leituras terceirizadas é `/coletor-sync`, não `/coletor/leituras-terceirizadas`.

Para a página de atualização de rotas CE, a rota correta é `/admin/atualizar-rotas-ce`.

### Causa raiz

O Lovable está direcionando o preview para uma URL que não está registrada nas rotas do aplicativo. Como não existe rota `*` (catch-all) no `App.tsx`, nada é renderizado e o sistema redireciona o usuário admin para o dashboard.

### Solução

**Nenhuma alteração de código necessária.** Para acessar a página de atualização de rotas CE:

1. Na barra de endereço do preview, altere manualmente a URL para:
   `https://id-preview--8ceaa74b-3fa6-4180-8171-f694f135a9b1.lovable.app/admin/atualizar-rotas-ce`

2. Certifique-se de estar logado com a conta admin (`tiago@agasen.com.br`)

3. Clique em "Executar Atualização" para rodar o script

Se preferir acessar pela URL publicada, primeiro publique o projeto clicando em "Share" / "Publish" no canto superior direito do Lovable.

