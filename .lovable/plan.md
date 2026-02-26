

## Adicionar Prompt de Instalacao do PWA

O projeto tem a configuracao PWA via `vite-plugin-pwa` mas nao tem nenhum codigo para capturar o evento `beforeinstallprompt` e exibir um banner/popup convidando o usuario a instalar o app.

### Alteracoes

**1. Criar `src/hooks/useInstallPrompt.tsx`**
- Hook que escuta o evento `beforeinstallprompt` do navegador
- Armazena o evento para disparar a instalacao quando o usuario clicar
- Controla estado de visibilidade do banner (com localStorage para nao mostrar repetidamente)

**2. Criar `src/components/InstallAppBanner.tsx`**
- Banner fixo no topo ou bottom da tela do coletor
- Botao "Instalar App" que chama `prompt()` no evento salvo
- Botao para dispensar o banner
- Design mobile-friendly, compacto

**3. Integrar no `src/pages/ColetorMenu.tsx`**
- Renderizar o `InstallAppBanner` no menu principal do coletor
- So aparece quando o navegador suporta instalacao e o app ainda nao foi instalado

### Nota
- No iOS/Safari, o evento `beforeinstallprompt` nao existe. Para iOS, o banner mostrara instrucoes manuais: "Toque em Compartilhar > Adicionar a Tela de Inicio"
- No Android/Chrome, o prompt nativo sera disparado automaticamente ao clicar no botao

