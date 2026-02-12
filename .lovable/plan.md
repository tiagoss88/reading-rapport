
## Transformar o app em PWA (instalavel pelo navegador)

### O que muda
O operador podera "instalar" o app no celular diretamente pelo Chrome (opcao "Instalar app" ou "Adicionar a tela inicial"), com o icone/logo da AGASEN. O app abrira em tela cheia, sem barra do navegador, como um app nativo.

### Alteracoes tecnicas

**1. Instalar dependencia `vite-plugin-pwa`**

**2. Configurar `vite.config.ts`**
- Adicionar o plugin `VitePWA` com:
  - Manifest com nome "AGASEN - Coletor", cores da marca, icones (192px e 512px)
  - `display: 'standalone'` para abrir sem barra do navegador
  - `navigateFallbackDenylist: [/^\/~oauth/]` para nao interferir com autenticacao
  - Registro automatico do service worker

**3. Copiar logo da AGASEN para icones PWA**
- Copiar a imagem do favicon atual para `public/icon-192.png` e `public/icon-512.png` (substituindo os existentes)
- Atualizar `index.html` com meta tags para PWA:
  - `<meta name="theme-color">` com a cor da marca
  - `<link rel="apple-touch-icon">` para iOS
  - `<link rel="manifest">` (gerado automaticamente pelo plugin)

**4. Atualizar `index.html`**
- Adicionar meta tags de tema e apple-touch-icon
- Atualizar titulo para "AGASEN - Coletor"
- Manter o favicon atual

Apos essas alteracoes, quando o operador acessar o app pelo Chrome no celular, o navegador exibira automaticamente a opcao "Instalar app" ou o operador pode ir em Menu > "Instalar app" / "Adicionar a tela inicial".
