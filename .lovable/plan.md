

## Sidebar minimizavel no desktop

### O que muda
Adicionar um botao para minimizar/expandir o menu lateral no desktop. Quando minimizado, o sidebar mostra apenas os icones (sem texto), liberando mais espaco para o conteudo principal como o mapa.

### Comportamento

- **Expandido** (padrao): sidebar com 256px (w-64), mostrando icones + textos como hoje
- **Minimizado**: sidebar com ~64px (w-16), mostrando apenas icones centralizados
- **Botao de toggle**: um botao com icone de seta no rodape ou topo do sidebar para alternar entre os estados
- **Tooltips**: no modo minimizado, ao passar o mouse sobre um icone, exibir o nome do item via atributo `title`
- **Dropdowns**: no modo minimizado, os dropdowns (Medicao Terceirizada, Configuracoes) ficam ocultos -- ao expandir, reaparecem normalmente
- **Transicao suave**: animacao CSS na largura do sidebar

### Alteracoes

**Arquivo: `src/components/Layout.tsx`**

1. Adicionar estado `collapsed` com `useState(false)`
2. Alterar a classe do sidebar de `w-64` fixo para condicional: `collapsed ? 'w-16' : 'w-64'`
3. Ocultar textos quando `collapsed` e true (nome dos itens, titulo "Sistema de Leituras", labels dos dropdowns)
4. Centralizar icones no modo colapsado
5. Ocultar subitens de dropdowns quando colapsado
6. Adicionar botao de toggle (icone `PanelLeftClose`/`PanelLeftOpen` ou `ChevronLeft`/`ChevronRight`) no header do sidebar
7. Ajustar o botao "Sair" para mostrar apenas o icone quando colapsado
8. Adicionar `title` nos itens de navegacao para tooltip nativo no modo colapsado
9. Importar icones adicionais (`PanelLeftClose`, `PanelLeftOpen`) de lucide-react

### Detalhes tecnicos

- O estado `collapsed` so se aplica no desktop (lg+). No mobile, o comportamento atual com overlay permanece inalterado
- A transicao de largura usa `transition-all duration-300` para animacao suave
- O conteudo principal se ajusta automaticamente pois usa `flex-1`
- O logo pode ser trocado para versao compacta (apenas icone) no modo colapsado

