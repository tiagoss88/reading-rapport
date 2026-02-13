

## Reestruturar modulo de Relatorios

### O que muda
Remover os 17 tipos de relatorio antigos e substituir por apenas 2 relatorios focados e uteis:

1. **Leituras: Condominios Coletados por Competencia** - Mostra cada condominio, quantidade de medidores e o dia em que foi coletado
2. **Servicos: RDO (Relatorio Diario de Obra)** - Lista todos os servicos realizados com filtros de periodicidade, tipo de servico e tecnico

Ambos exportaveis em Excel (.xlsx) e PDF.

---

### Relatorio 1 - Condominios Coletados por Competencia

**Filtros:**
- Competencia (mes/ano) - campo select ou input mes/ano

**Colunas da tabela:**
| Condominio | UF | Qtd Medidores | Data da Coleta |
|---|---|---|---|

**Logica:** Agrupar leituras pela competencia selecionada, cruzando com `empreendimentos` para obter nome e quantidade de medidores. A data da coleta sera a data da primeira leitura registrada naquele condominio para aquela competencia.

---

### Relatorio 2 - RDO (Relatorio Diario de Obra)

**Filtros:**
- Periodicidade: Diario, Semanal, Mensal (define o agrupamento e o range de datas)
- Data inicio / Data fim
- Tipo de servico (opcional)
- Tecnico/Operador (opcional)

**Colunas da tabela:**
| Data | Condominio | Tipo Servico | Tecnico | Status | Descricao |
|---|---|---|---|---|---|

**Logica:** Buscar servicos (tabelas `servicos` e `servicos_nacional_gas`) no periodo selecionado, aplicando filtros opcionais. A periodicidade afeta a apresentacao (agrupamento por dia, semana ou mes).

---

### Detalhes tecnicos

**Arquivos a serem modificados:**

1. **`src/pages/Relatorios.tsx`** - Simplificar o tipo `TipoRelatorio` para apenas `'condominios_competencia' | 'rdo_servicos'`. Remover categorias antigas, deixar apenas "Leituras" e "Servicos" com 1 relatorio cada.

2. **`src/components/relatorios/RelatorioSelector.tsx`** - Reduzir para 2 opcoes apenas.

3. **`src/components/relatorios/FiltrosRelatorio.tsx`** - Reescrever filtros:
   - Para `condominios_competencia`: campo de competencia (mes/ano)
   - Para `rdo_servicos`: periodicidade (diario/semanal/mensal), datas, tipo servico, tecnico

4. **`src/components/relatorios/TabelaRelatorio.tsx`** - Reescrever com as 2 novas estruturas de colunas/linhas.

5. **`src/hooks/useRelatorioLeituras.tsx`** - Substituir toda logica por uma unica query que agrupa leituras por empreendimento + competencia, trazendo nome do condominio, UF, quantidade de medidores e data da coleta.

6. **`src/hooks/useRelatorioServicos.tsx`** - Substituir por query que busca servicos no periodo com joins para tipo, tecnico e condominio.

7. **`src/lib/exportPDF.ts`** - Atualizar titulos e colunas para os 2 novos relatorios.

8. **`src/lib/exportCSV.ts`** - Atualizar colunas para os 2 novos relatorios.

9. **`src/components/relatorios/ExportacaoButtons.tsx`** - Implementar exportacao Excel real usando a biblioteca `xlsx` (ja instalada) em vez do fallback CSV atual. Manter botoes PDF, Excel e CSV.

