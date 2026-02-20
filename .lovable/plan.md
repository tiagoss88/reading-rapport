
## Corrigir logo da Agasen e renomear "Medição Terceirizada" para "Medição"

### Problemas identificados

1. **Logo não aparece**: O arquivo existe em `public/lovable-uploads/124d1417-15e6-4436-a1b4-66550bac6e66.png`, mas a referência via caminho público pode estar falhando. A solução é mover o logo para `src/assets/` e importá-lo como módulo ES6, que é a forma correta e mais confiável em React/Vite.

2. **Texto "Medição Terceirizada"**: Aparece em 2 lugares no `Layout.tsx` — no botão do dropdown (linha 157) e no `title` do NavLink colapsado (linha 143).

### Alterações

**Arquivo: `src/components/Layout.tsx`**

1. Copiar o logo de `public/lovable-uploads/` para `src/assets/agasen-logo.png`
2. Adicionar `import agasenLogo from '@/assets/agasen-logo.png'` no topo do arquivo
3. Substituir os dois `src="/lovable-uploads/124d1417-15e6-4436-a1b4-66550bac6e66.png"` por `src={agasenLogo}` (linhas 88 e 97)
4. Alterar `title="Medição Terceirizada"` → `title="Medição"` (linha 143)
5. Alterar o texto `Medição Terceirizada` → `Medição` (linha 157)
