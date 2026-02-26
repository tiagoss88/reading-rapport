

## Adicionar Filtro de UF na Aba "Rota do Dia"

### Alteracao

**Arquivo: `src/pages/MedicaoTerceirizada/Leituras.tsx`**

1. Adicionar um novo state `filtroUFRotaDia` (separado do `filtroUF` das outras abas) com valor inicial `'todas'`.

2. No `CardHeader` da aba "Rota do Dia" (linha 195-202), adicionar um `Select` de UF ao lado do input de data, usando as `ufsDisponiveis` ja calculadas.

3. Filtrar `rotasDoDia` antes de renderizar na tabela: se `filtroUFRotaDia !== 'todas'`, mostrar apenas rotas cujo empreendimento tenha `uf` igual ao filtro selecionado.

### Resultado

A aba "Rota do Dia" passa a ter um seletor de UF ao lado do campo de data, permitindo visualizar apenas as rotas de um estado especifico.

