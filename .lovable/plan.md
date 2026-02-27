

## Dividir Relatorios em submenu com Leituras e Servicos

Transformar o item "Relatorios" no menu lateral em um dropdown (igual ao "Medicao" e "Configuracoes"), com dois subitens: **Leituras** e **Servicos**.

### Alteracoes

**1. Criar `src/pages/RelatoriosLeituras.tsx`**
- Copia da pagina Relatorios atual, mas pre-filtrando apenas os tipos de leitura (`condominios_competencia`, `cadastro_condominios_uf`)
- Remove o selector de categoria e mostra direto o selector apenas com relatorios de leitura
- Layout title: "Relatorios de Leituras"

**2. Criar `src/pages/RelatoriosServicos.tsx`**
- Mesma estrutura, mas apenas com o tipo `rdo_servicos`
- Layout title: "Relatorios de Servicos"

**3. Atualizar `src/components/Layout.tsx`**
- Remover "Relatorios" do array `navigation`
- Criar um novo dropdown "Relatorios" (igual ao padrao de Medicao/Configuracoes) com:
  - Leituras → `/relatorios/leituras` (icon: FileText)
  - Servicos → `/relatorios/servicos` (icon: Wrench)

**4. Atualizar `src/App.tsx`**
- Adicionar rotas `/relatorios/leituras` e `/relatorios/servicos` com PermissionRoute `view_relatorios`
- Manter `/relatorios` redirecionando para `/relatorios/leituras` (ou remover)

**5. Atualizar `src/components/relatorios/RelatorioSelector.tsx`**
- Aceitar prop `categoria` para filtrar os relatorios disponiveis (so Leituras ou so Servicos)

