

## Alteracoes no Coletor

### Resumo
Modificar o menu do coletor para: (1) substituir a sessao "Leituras" por uma listagem de empreendimentos terceirizados filtrados por UF e organizados por rota, e (2) remover a opcao "Ordem de Servico".

---

### Resultado Final do Menu

O menu do coletor tera apenas **2 opcoes**:
1. **Leituras** - Mostra empreendimentos terceirizados por UF, organizados por rota
2. **Servicos Terceirizados** - Permanece como esta

---

### Alteracoes Detalhadas

#### 1. ColetorMenu.tsx - Simplificar menu
- Remover o card "Ordem de Servico" (que navega para `/coletor/servicos`)
- Alterar o card "Leituras" para navegar diretamente para uma nova pagina de empreendimentos terceirizados por UF
- Atualizar descricao do card Leituras para "Empreendimentos por UF e Rota"
- Remover imports nao utilizados

#### 2. Nova pagina: ColetorLeiturasTerceirizadas.tsx
Substituir o fluxo antigo de leituras (ColetorSync) por uma nova pagina que:
- Exibe um seletor de UF no topo (dropdown ou lista de botoes com as UFs disponiveis)
- Busca os empreendimentos da tabela `empreendimentos_terceirizados` filtrados pela UF selecionada
- Organiza os empreendimentos por numero de rota
- Cada card mostra: nome do empreendimento, endereco, quantidade de medidores e numero da rota
- Visual limpo e mobile-friendly, seguindo o mesmo estilo das outras telas do coletor

#### 3. App.tsx - Atualizar rotas
- Remover a rota `/coletor/servicos` (Ordem de Servico)
- Remover import de `ColetorServicos`
- Alterar rota `/coletor-sync` para apontar para a nova pagina `ColetorLeiturasTerceirizadas`
- Manter rotas `/coletor/unidades/:empreendimentoId` e `/coletor/leitura/:clienteId` caso ainda sejam uteis, ou remover se nao forem mais necessarias no fluxo terceirizado

---

### Secao Tecnica

#### Novo arquivo: `src/pages/ColetorLeiturasTerceirizadas.tsx`
- Query na tabela `empreendimentos_terceirizados` com filtro `.eq('uf', selectedUF)` e `.order('rota')`
- Estado local para UF selecionada
- Busca as UFs disponiveis com `select('uf')` + distinct ou agrupamento no frontend
- Cada card de empreendimento e clicavel e pode navegar para detalhes ou lista de servicos daquele empreendimento
- Botao voltar para `/coletor`

#### Arquivo: `src/pages/ColetorMenu.tsx`
- Remover bloco JSX do card "Ordem de Servico" (linhas 102-127)
- Alterar `goToLeituras` para navegar para `/coletor-sync` (ja existente) ou nova rota
- Atualizar texto do card Leituras

#### Arquivo: `src/App.tsx`
- Remover rota `/coletor/servicos` e import `ColetorServicos`
- Atualizar rota `/coletor-sync` para usar novo componente

