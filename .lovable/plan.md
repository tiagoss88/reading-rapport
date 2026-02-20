
## Reordenar itens do submenu "Medição"

### Alteração

**Arquivo: `src/components/Layout.tsx`**

Reordenar o array `medicaoTerceirizadaItems` (atualmente na ordem: Empreendimentos, Leituras, Planejamento de Rotas, Georreferenciamento, Serviços) para a nova ordem solicitada:

1. Leituras
2. Serviços
3. Empreendimentos
4. Planejamento de Rotas
5. Georreferenciamento

```typescript
const medicaoTerceirizadaItems = [
  { name: 'Leituras',               href: '/medicao-terceirizada/leituras',              icon: BookOpen },
  { name: 'Serviços',               href: '/medicao-terceirizada/servicos',              icon: Wrench },
  { name: 'Empreendimentos',        href: '/medicao-terceirizada/empreendimentos',        icon: Building2 },
  { name: 'Planejamento de Rotas',  href: '/medicao-terceirizada/rotas',                 icon: MapPin },
  { name: 'Georreferenciamento',    href: '/medicao-terceirizada/georreferenciamento',   icon: Navigation2 },
]
```

Nenhuma outra parte do código precisa ser alterada.
