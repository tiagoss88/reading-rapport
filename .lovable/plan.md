
## Melhorias no Rastreamento de Operadores

### Contexto e Limitações Técnicas

**Rastreamento em segundo plano verdadeiro** (mesmo após fechar o app) requer uma tecnologia chamada **Service Worker Background Sync** ou **Push Notifications com GPS** — funcionalidades nativas que browsers modernos suportam de forma limitada. Em um PWA web (que é o caso deste projeto), o comportamento real é:

- Enquanto a aba está aberta (mesmo minimizada): funciona perfeitamente com `setInterval`
- Após fechar a aba: o browser encerra o JavaScript, e não há como enviar GPS sem a aba aberta
- Em mobile como PWA instalado: há suporte parcial via **Page Visibility API** para pausar/retomar quando o app vai para background

A abordagem mais confiável sem backend nativo (Capacitor/React Native) é:
1. Aumentar o intervalo para **10 minutos** conforme solicitado
2. Usar **Page Visibility API** para retomar o tracking quando o operador volta ao app
3. Salvar o estado de tracking no `localStorage` para persistência entre sessões
4. Exibir no ColetorMenu um indicador claro de que o rastreamento está ativo

### Funcionalidade: Camada de Empreendimentos no Mapa

Os empreendimentos já possuem `latitude` e `longitude` no banco de dados (confirmado na tabela `empreendimentos` dos tipos). A ideia é adicionar um toggle na tela de rastreamento para exibir/ocultar os pins dos empreendimentos como uma segunda camada no mapa, possibilitando ver a proximidade entre operadores e condomínios.

---

### Alterações Planejadas

**1. `src/hooks/useLocationTracking.tsx` — Intervalo 10min + Persistência**

- Alterar o intervalo de 5 minutos para **10 minutos** (600.000ms)
- Adicionar **Page Visibility API**: quando o operador volta à aba, enviar localização imediatamente e reiniciar o intervalo
- Salvar `isTrackingEnabled` no `localStorage` para lembrar que o operador estava sendo rastreado

**2. `src/components/rastreamento/LocalizacaoOperadores.tsx` — Camada de Empreendimentos**

- Adicionar estado `showEmpreendimentos: boolean` (padrão: `false`)
- Adicionar **toggle Switch** no cabeçalho do painel lateral com label "Mostrar Empreendimentos"
- Buscar empreendimentos com coordenadas via Supabase quando o toggle for ativado
- Renderizar marcadores de empreendimentos no mapa com estilo diferenciado:
  - Ícone quadrado/diamante em cor roxa (`#7c3aed`) para diferenciar dos pins dos operadores
  - Mostrar nome do empreendimento no tooltip
- Ao clicar num marcador de empreendimento, exibir popup com nome e endereço
- Limpar marcadores ao desativar o toggle

**3. `src/pages/ColetorMenu.tsx` — Indicador Visual de Rastreamento**

- Exibir um indicador claro quando o rastreamento está ativo (ponto verde pulsando + texto "Rastreamento ativo")
- Exibir quando o erro ocorrer para orientar o operador

---

### Estrutura dos Marcadores de Empreendimentos

```text
+--------------------------+
|  Marcador do Operador    |   Marcador do Empreendimento
|  Pin circular colorido   |   Pin quadrado/hexagonal roxo
|  com iniciais (JS, AM)   |   com ícone de prédio (B)
|  Verde / Amarelo / Cinza |   Roxo (#7c3aed)
+--------------------------+
```

### Toggle de Controle

No painel lateral esquerdo, acima da lista de operadores:

```text
+----------------------------------+
|  Operadores Ativos (3)           |
|  [Switch] Mostrar Empreendimentos|
+----------------------------------+
|  [Card Operador 1]               |
|  [Card Operador 2]               |
+----------------------------------+
```

### Arquivos a Editar

| Arquivo | Mudança |
|---|---|
| `src/hooks/useLocationTracking.tsx` | Intervalo 10min, Page Visibility API |
| `src/components/rastreamento/LocalizacaoOperadores.tsx` | Toggle + marcadores de empreendimentos |
| `src/pages/ColetorMenu.tsx` | Indicador visual de rastreamento ativo |
