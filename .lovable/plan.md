

## Adicionar filtro de Rota na tela de Leituras do Coletor

### Resumo
Adicionar um segundo seletor (dropdown) para que o operador escolha qual rota deseja visualizar, alem de corrigir o erro que ocorre ao selecionar "BA".

---

### Problema atual
1. Ao selecionar uma UF com muitos empreendimentos (ex: BA com 97 na Rota 1), a pagina tenta renderizar todos de uma vez, causando erro
2. O operador nao consegue filtrar por rota especifica

### Solucao

#### Arquivo: `src/pages/ColetorLeiturasTerceirizadas.tsx`

**Adicionar:**
- Novo estado `selectedRota` para armazenar a rota selecionada
- Segundo dropdown "Selecione a Rota" que aparece apos selecionar a UF
- As opcoes de rota sao extraidas dos empreendimentos ja filtrados pela UF
- Os empreendimentos so sao exibidos quando **ambos** UF e Rota estiverem selecionados

**Corrigir:**
- O valor `selectedUF` inicia como string vazia `''`, mas ao selecionar "all" nao limpa o filtro corretamente. Ajustar para que `selectedUF === 'all'` nao aplique filtro de UF
- Ao trocar de UF, resetar a rota selecionada
- Buscar as rotas disponiveis com query separada filtrada pela UF selecionada

**Fluxo do operador:**
1. Seleciona a UF (ex: BA)
2. Aparece o dropdown de Rota com as rotas disponiveis (ex: Rota 1, Rota 2, ...)
3. Seleciona a rota desejada
4. Apenas os empreendimentos daquela UF + Rota sao exibidos

### Secao Tecnica

- Adicionar estado: `const [selectedRota, setSelectedRota] = useState<string>('')`
- Computar rotas disponiveis via `useMemo` a partir dos empreendimentos filtrados por UF
- Filtrar `empreendimentosPorRota` para mostrar apenas a rota selecionada
- Ao mudar UF (`onValueChange`), chamar `setSelectedRota('')` para resetar
- Manter o agrupamento visual por rota mas exibir apenas a rota escolhida (ou permitir "Todas as Rotas")
- Corrigir tratamento do valor "all" no Select de UF para nao enviar como filtro na query

