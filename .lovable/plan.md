

## Plano: Relatório de Coletas "Sem Pendências" por Competência

### O que é
Novo relatório na categoria **Leituras** que lista as confirmações de coleta (registros em `servicos_nacional_gas` com `tipo_servico='leitura'` e `status_atendimento='executado'`) realizadas pelos técnicos, com filtros por mês, UF e técnico.

### Dados exibidos na tabela
| Condomínio | UF | Técnico | Data Coleta | Observação |
|---|---|---|---|---|
| Nome do empreendimento | BA/CE | Nome do operador | dd/MM/yyyy | Obs (se houver) |

Com totalizador no final: quantidade total de coletas.

### Arquivos modificados

**1. `src/pages/Relatorios.tsx`**
- Adicionar `'coletas_sem_pendencia'` ao tipo `TipoRelatorio`

**2. `src/components/relatorios/RelatorioSelector.tsx`**
- Adicionar entrada `{ value: 'coletas_sem_pendencia', label: 'Coletas Sem Pendência', categoria: 'Leituras' }`

**3. `src/components/relatorios/FiltrosRelatorio.tsx`**
- Adicionar bloco de filtros para `coletas_sem_pendencia`: competência (mês), UF (select com UFs disponíveis), e técnico (select com operadores)
- No `handleGerarRelatorio`, chamar o novo hook

**4. Novo arquivo: `src/hooks/useRelatorioColetasSemPendencia.tsx`**
- Query em `servicos_nacional_gas` filtrando `tipo_servico='leitura'`, `status_atendimento='executado'`
- Filtro por `data_agendamento` dentro do mês selecionado (competência)
- Filtro opcional por `uf` e `tecnico_id`
- Join com `empreendimentos_terceirizados` (nome) e `operadores` (nome do técnico)
- Retorna array com: `condominio`, `uf`, `tecnico`, `data_coleta`, `observacao`

**5. `src/components/relatorios/TabelaRelatorio.tsx`**
- Adicionar colunas e linhas para `coletas_sem_pendencia`

**6. `src/components/relatorios/ExportacaoButtons.tsx` (Excel interno)**
- Adicionar mapeamento de colunas/linhas para `coletas_sem_pendencia`

**7. `src/lib/exportPDF.ts` e `src/lib/exportCSV.ts`**
- Adicionar caso `coletas_sem_pendencia` com título e colunas correspondentes

### Nenhuma alteração de banco necessária
Os dados já existem em `servicos_nacional_gas`. Apenas leitura (SELECT).

