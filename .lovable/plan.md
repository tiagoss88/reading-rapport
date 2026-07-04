## Problema

Ao clicar num item, `handleNavClick()` faz `setCollapsed(true)` + `setHovered(false)`, mas o mouse ainda está sobre a sidebar. O React re-renderiza e o `onMouseEnter`/`onMouseOver` dispara imediatamente (ou o `setHovered(false)` é sobrescrito pelo evento pendente), voltando `hovered = true` e reexpandindo. Visualmente parece que "tentou minimizar e voltou".

## Correção em `src/components/Layout.tsx`

1. Adicionar estado `suppressHover` (boolean). Quando `handleNavClick()` roda: `setCollapsed(true)`, `setHovered(false)`, `setSuppressHover(true)`.
2. O handler `onMouseEnter` só chama `setHovered(true)` se `!suppressHover`.
3. O handler `onMouseLeave` chama `setHovered(false)` **e** `setSuppressHover(false)` — assim, quando o usuário efetivamente tirar o mouse da sidebar, o hover-expand volta a funcionar normalmente na próxima entrada.
4. Nada mais muda: botão manual, mobile drawer, submenus e estilos continuam iguais.

## Resultado esperado

- Clicar em item → sidebar minimiza e permanece minimizada mesmo com o mouse ainda sobre ela.
- Usuário tira o mouse da sidebar e passa de novo → expande temporariamente (comportamento hover atual).
- Botão `PanelLeftOpen` continua reexpandindo manualmente.
