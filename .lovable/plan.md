## Adicionar filtro UF no relatório RDO de Serviços

### Mudanças

**1. `src/components/relatorios/FiltrosRelatorio.tsx`**
- Habilitar a query `ufs_disponiveis` também para `tipoRelatorio === 'rdo_servicos'` (atualmente só carrega para `cadastro_condominios_uf` e `coletas_sem_pendencia`).
- Dentro do bloco `tipoRelatorio === 'rdo_servicos'`, adicionar um novo Select "UF" (com opção "Todas") que atualiza `filtros.ufFiltro`. Posicionar logo após o filtro "Status".

**2. `src/hooks/useRelatorioServicos.tsx`**
- Receber `ufFiltro` dos filtros.
- Em `queryNacionalGas`: aplicar `.eq('uf', ufFiltro)` quando definido (tabela já tem coluna `uf`).
- Em `queryInternos` (tabela `servicos` → `empreendimentos`): a tabela `empreendimentos` interna provavelmente não tem `uf` por condomínio nesse contexto. Vou verificar; se não houver, o filtro UF se aplica apenas aos serviços `nacional_gas` (que é a fonte principal do módulo Medição). A maneira mais segura: quando `ufFiltro` estiver definido, aplicar apenas em `queryNacionalGas` e pular `queryInternos` (retornar lista vazia para internos), já que o escopo do projeto é Nacional Gás.

### Observações
- O tipo `FiltrosRelatorioType` já possui `ufFiltro`, então não há mudanças em `Relatorios.tsx`/`RelatoriosServicos.tsx`.
- A lista de UFs vem de `empreendimentos_terceirizados.uf` (mesma fonte usada nos outros relatórios), garantindo consistência.