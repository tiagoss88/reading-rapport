

## Nova pagina "Leituras" dentro de Medicao Terceirizada

### Objetivo
Criar uma nova pagina acessivel em `/medicao-terceirizada/leituras` que permita ao gestor acompanhar o status das coletas: quais condominios ja foram coletados, quais estao pendentes e qual a rota planejada para o dia.

### Estrutura da pagina

A pagina tera 3 abas (Tabs):

**Aba 1 - Rota do Dia**
- Mostra a data atual (com seletor de data para consultar outros dias)
- Lista os empreendimentos planejados para o dia (tabela `rotas_leitura` filtrada pela data)
- Colunas: Condominio, Rota, Medidores, Operador Atribuido, Status (pendente/em andamento/concluido)
- Badge colorido por status

**Aba 2 - Coletas Realizadas**
- Filtros: Competencia (mes/ano), UF (opcional), Rota (opcional)
- Lista coletas confirmadas pelo coletor (tabela `servicos_nacional_gas` com `tipo_servico = 'leitura'` e `status_atendimento = 'executado'`)
- Colunas: Condominio, UF, Rota, Medidores, Tecnico, Data da Coleta, Foto (link)
- Ordenado por data mais recente

**Aba 3 - Pendentes**
- Mostra empreendimentos que ainda NAO tiveram coleta registrada na competencia selecionada
- Cruza `empreendimentos_terceirizados` com `servicos_nacional_gas` para identificar quem falta
- Colunas: Condominio, UF, Rota, Medidores
- Destaque visual para facilitar identificacao

---

### Detalhes tecnicos

**Arquivos novos:**
1. `src/pages/MedicaoTerceirizada/Leituras.tsx` - Pagina principal com as 3 abas

**Arquivos modificados:**
2. `src/App.tsx` - Adicionar rota `/medicao-terceirizada/leituras` com permissao admin
3. `src/components/Layout.tsx` - Adicionar item "Leituras" no submenu de Medicao Terceirizada (com icone `BookOpen` ou `ClipboardCheck`)

**Queries principais:**
- Rota do dia: `rotas_leitura` filtrada por data, com join em `empreendimentos_terceirizados` e `operadores`
- Coletas realizadas: `servicos_nacional_gas` filtrada por `tipo_servico = 'leitura'` e `status_atendimento = 'executado'`, com join em `empreendimentos_terceirizados` e `operadores`
- Pendentes: todos os `empreendimentos_terceirizados` menos os que ja tem coleta na competencia selecionada

