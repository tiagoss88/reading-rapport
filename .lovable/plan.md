## Reverter comportamento do menu lateral

Voltar `src/components/Layout.tsx` ao comportamento original: sidebar fica no estado escolhido pelo usuário (via botão `PanelLeftOpen`/`PanelLeftClose`) e **não** minimiza sozinha ao clicar num item, nem expande no hover.

## Alterações

1. Remover estados `hovered` e `suppressHover`.
2. Remover derivação `isCompact` — voltar a usar `collapsed` diretamente em todos os condicionais (largura `w-16`/`w-64`, `justify-center`, `mr-3`, exibição de rótulos e submenus).
3. Remover handlers `onMouseEnter`/`onMouseLeave` do `<div>` da sidebar.
4. `handleNavClick()` volta a apenas fechar o drawer mobile: `setSidebarOpen(false)`. Continuar usando esse helper nos `onClick` dos `NavLink` (equivale ao original).
5. Botão de toggle manual volta ao `onClick={() => setCollapsed(!collapsed)}` (sem reset de hover).

## Fora do escopo
- Menu do Coletor não é afetado.
- Nenhuma outra tela/estilo muda.
