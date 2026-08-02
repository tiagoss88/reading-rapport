# Eliminar definitivamente a inicialização desatualizada

## Objetivo

Garantir que cada abertura do sistema carregue a versão publicada mais recente, sem exigir limpeza manual de cache, preservando a instalação na tela inicial e as notificações push.

## Diagnóstico confirmado

- O service worker do aplicativo usa `NetworkFirst` com timeout de 3 segundos e mantém navegações HTML em cache por até 24 horas. Quando a rede demora, ele pode entregar uma versão anterior logo na inicialização.
- Há dois service workers concorrendo pelo escopo raiz: `/sw.js` para cache offline e `/sw-push.js` para notificações. Isso torna o controle e a atualização do aplicativo inconsistentes.
- O pedido é por atualização confiável; não há necessidade declarada de o sistema abrir completamente sem internet.

## Implementação

1. **Remover o cache offline do aplicativo**
   - Retirar o `vite-plugin-pwa` da geração e do registro do service worker de navegação.
   - Remover o registro de `/sw.js` da inicialização React.
   - Manter os arquivos versionados pelo Vite com hash, que já atualizam automaticamente sem reaproveitar bundles antigos.

2. **Desativar instalações antigas com segurança**
   - Publicar temporariamente, no mesmo caminho `/sw.js`, um service worker de encerramento.
   - Ele apagará somente os caches antigos do Workbox, assumirá as páginas abertas, recarregará os clientes e se desregistrará mesmo se alguma etapa falhar.
   - Não apagará dados do usuário, sessão, IndexedDB nem caches de notificações.

3. **Preservar a instalação como aplicativo**
   - Criar um manifesto estático com nome, ícones, cores, orientação e modo standalone equivalentes aos atuais.
   - Referenciar o manifesto e os ícones no cabeçalho da aplicação.
   - A instalação na tela inicial continuará disponível, mas sem o cache offline responsável pelas versões antigas.

4. **Isolar notificações push**
   - Manter `/sw-push.js` exclusivamente para notificações, sem transformá-lo em cache do app.
   - Ajustar seu registro para não depender de `navigator.serviceWorker.ready`, evitando que outro worker seja confundido com o worker de notificações.

5. **Validar a atualização**
   - Gerar a versão de produção e confirmar que não existe mais service worker Workbox nem cache de navegação.
   - Simular um navegador que já possua `/sw.js`, confirmar a remoção do worker/cache antigo e verificar que uma segunda abertura busca o HTML atual pela rede.
   - Confirmar que o manifesto permanece válido, a instalação continua disponível e o worker de push permanece registrado.

## Resultado esperado

O sistema sempre consulta a versão atual ao iniciar. Usuários que ainda possuem a instalação antiga serão corrigidos automaticamente na primeira visita após a publicação, sem usar o botão “Limpar cache”.

## Observação técnica

A versão de encerramento de `/sw.js` deve permanecer publicada por pelo menos um ciclo de implantação para alcançar navegadores que ainda tenham o cache antigo. Depois disso, o arquivo poderá ser removido em uma publicação futura.