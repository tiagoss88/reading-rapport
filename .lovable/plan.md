

## Indicar empreendimentos já coletados na competência atual (Coletor)

### Problema

A tela de listagem de empreendimentos no coletor (`ColetorLeiturasTerceirizadas.tsx`) exibe todos os empreendimentos sem distinção, mesmo que já tenham sido coletados na competência atual. O operador não tem como saber quais já foram feitos e pode re-coletar por engano.

### Solução

Adicionar verificação de coletas já realizadas na competência atual e exibir indicador visual nos empreendimentos já coletados, mantendo-os na lista (para eventual re-coleta se necessário) mas com destaque claro.

### Arquivo a editar

**`src/pages/ColetorLeiturasTerceirizadas.tsx`**

1. **Nova query**: buscar `empreendimento_id` dos serviços com `tipo_servico = 'leitura'` e `status_atendimento = 'executado'` na competência atual (mês/ano correntes, filtrado por `data_agendamento` entre primeiro e último dia do mês)
2. **Criar Set** com IDs já coletados para lookup O(1)
3. **Badge visual** em cada card: se o empreendimento está no Set, exibir badge verde "Coletado" com ícone CheckCircle; caso contrário, badge amarela "Pendente"
4. **Ordenação**: empreendimentos pendentes aparecem primeiro na lista, coletados vão para o final
5. **Contador no header**: exibir "X de Y coletados" para dar visão geral ao operador

### Detalhes visuais

- Badge "Coletado": fundo verde claro, texto verde escuro, ícone CheckCircle
- Badge "Pendente": fundo amarelo claro, texto amarelo escuro
- Cards coletados com leve opacidade reduzida (opacity-60) para direcionar atenção aos pendentes
- Aplicar tanto na lista filtrada por UF/Rota quanto nos resultados de busca por nome

### Detalhes técnicos

- Query usa `gte`/`lte` com primeiro e último dia do mês atual
- Filtro `not('empreendimento_id', 'is', null)` para evitar registros órfãos
- Mesma lógica aplicada a `displayList` (busca e filtro)
- Sem dependência de nova tabela ou migração — usa dados já existentes em `servicos_nacional_gas`

