

## Corrigir visibilidade dos resultados do Roteirizador

### Problema
O painel lateral esquerdo (w-80) tem altura fixa (`h-[calc(100vh-180px)]`). Os controles (filtro UF, meta, leituristas, badges, botao) ja ocupam a maior parte dessa altura. Quando os resultados da simulacao aparecem abaixo do Separator, o ScrollArea nao tem espaco visivel restante para exibi-los.

### Solucao
Reorganizar o layout do painel lateral para que **todo o conteudo** (controles + resultados) fique dentro de uma unica area com scroll, garantindo que o usuario possa rolar para ver os resultados apos clicar em "Calcular Rotas".

### Alteracoes

**Arquivo:** `src/components/medicao-terceirizada/Roteirizador.tsx`

- Mover a estrutura do Card para usar um unico ScrollArea que engloba tanto os controles quanto os resultados
- O CardHeader tera apenas o titulo "Roteirizador"
- O CardContent contera um ScrollArea com:
  - Controles (filtro UF, meta, leituristas, badges, botao Calcular)
  - Separator (quando ha resultados)
  - Lista de resultados da simulacao
  - Botao "Aplicar Rotas"
- Isso garante que todo o conteudo e acessivel via scroll

### Resultado esperado
Apos clicar em "Calcular Rotas", o usuario podera rolar o painel lateral para ver todas as rotas geradas, o resumo e o botao "Aplicar Rotas".

