

## Redesign do Menu do Coletor conforme modelo HTML

### O que muda

Reescrever `src/pages/ColetorMenu.tsx` para adotar o design do mockup fornecido — container centralizado com cantos arredondados, header azul claro com avatar/nome do operador, itens de menu em lista limpa (sem cards), e botão "Sair" vermelho suave no rodapé.

### Arquivo: `src/pages/ColetorMenu.tsx`

**Layout geral:**
- Container branco centralizado (`max-w-sm`, `rounded-2xl`, `shadow-lg`, borda sutil)
- Fundo da página mantém o gradiente existente

**Header (`bg-[#E7F1FF]`):**
- Avatar circular (60px) com iniciais do usuário (ou ícone User)
- Nome do operador extraído de `user?.user_metadata?.nome` ou email
- Link "Ver perfil" em `text-[#007bff]` que abre o `ProfileDialog`
- Texto do nome em `text-[#003366]` bold

**Lista de itens:**
- Cada item é um `div` clicável com ícone + texto (sem cards, sem descrições)
- Ícones: `Calendar` (Cronograma), `FileCheck` (Confirmação), `Wrench` (Serviços), `Bell` (Notificações)
- Estado padrão: ícone e texto em `text-[#888]`/`text-gray-600`
- Hover: `bg-[#f8f9fa]` com `text-[#007bff]`
- Item ativo (baseado na rota atual): `bg-[#E7F1FF]`, `text-[#007bff]`, `font-semibold`
- Cada item envolvido em `ProtectedComponent` conforme permissões existentes
- Gap de 5px entre itens, padding de 15px no container da lista

**Botão Sair (rodapé):**
- Centralizado, `rounded-full`, `bg-[#F8D7DA]`, `text-[#721C24]`
- Ícone `Power` + texto "Sair"
- Hover: `bg-[#f5c6cb]`
- Borda superior sutil (`border-t border-gray-100`)

**Mantido:**
- `useLocationTracking`, `useRealtimeNotifications`, `InstallAppBanner`
- Toda lógica de navegação e logout
- `ProtectedComponent` para cada item

**Imports atualizados:**
- Adicionar: `FileCheck`, `Wrench`, `Power` de `lucide-react`
- Remover: `Card*`, `BookOpen`, `Building2`, `ChevronRight`, `LogOut`

### Nenhum outro arquivo alterado

