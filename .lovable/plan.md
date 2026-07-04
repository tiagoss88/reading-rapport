
## Comportamento

Após o usuário clicar em qualquer item de navegação da sidebar (item principal ou subitem dos grupos Medição / Relatórios / Configurações), a sidebar automaticamente muda para o estado **minimizado** (`collapsed = true`, largura `w-16`, só ícones) no desktop. No mobile continua fechando o drawer como já faz hoje.

O usuário ainda pode reexpandir a qualquer momento clicando no botão `PanelLeftOpen` no topo da sidebar. Ao passar o mouse sobre a sidebar minimizada, ela **expande temporariamente** enquanto o mouse estiver sobre ela e volta a minimizar quando o mouse sai — assim consegue navegar nos submenus sem precisar clicar em expandir.

## Alterações em `src/components/Layout.tsx`

1. Criar helper `handleNavClick()` que executa `setSidebarOpen(false)` (mobile) **e** `setCollapsed(true)` (desktop). Substituir todos os `onClick={() => setSidebarOpen(false)}` dos `NavLink` por `handleNavClick`.
2. Adicionar estado `hovered` e handlers `onMouseEnter` / `onMouseLeave` no `<div>` da sidebar. Largura efetiva vira `collapsed && !hovered ? 'w-16' : 'w-64'`. Todo o conteúdo condicional que hoje usa `collapsed` passa a usar `isCompact = collapsed && !hovered` para decidir se mostra rótulos e submenus.
3. Manter transição `transition-all duration-300 ease-in-out` para o efeito visual suave.
4. Não alterar o botão manual de expandir/minimizar — segue funcionando.

## Fora do escopo
- Menu do Coletor (`ColetorMenu`) — layout diferente, não é afetado.
- Persistir preferência entre sessões.
- Nenhuma mudança de estilo/cores além da largura.
