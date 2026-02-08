

## Aba "Agenda" na Pagina de Servicos (Medicao Terceirizada)

### Resumo
Adicionar uma aba **Agenda** ao lado da aba **Servicos** existente, exibindo os servicos em formato de agenda semanal com drag and drop. A aba usa os mesmos dados da tabela `servicos_nacional_gas`, sem duplicar informacao.

---

### Como vai funcionar

1. A pagina de Servicos ganha duas abas: **Servicos** (tabela atual) e **Agenda** (nova visualizacao semanal)
2. A agenda mostra 7 colunas (segunda a domingo) + uma coluna "Sem Agendamento"
3. Cada servico aparece como um card com: Condominio, Bairro (endereco do empreendimento), Tipo de Servico e Status (com cor)
4. O usuario pode arrastar cards entre dias para reagendar -- a data e atualizada automaticamente no banco
5. Clicar no card abre o mesmo modal de edicao (ServicoNacionalGasDialog)
6. Filtros: UF, Status, Tipo de Servico (Bairro nao existe como campo separado no banco, sera extraido do endereco do empreendimento vinculado)
7. Navegacao por semana (anterior/proxima) com botao "Hoje"

### Cores de Status
- Pendente: amarelo
- Agendado: azul
- Executado: verde
- Cancelado: vermelho

---

### Arquivos a criar/modificar

#### 1. Novo arquivo: `src/components/medicao-terceirizada/AgendaSemanal.tsx`
Componente principal da agenda contendo:
- Navegacao de semana (botoes anterior/proxima/hoje)
- Filtros (UF, Status, Tipo de Servico, Bairro)
- Grid de 8 colunas: "Sem Agendamento" + Seg a Dom
- Cards arrastáveis com HTML5 Drag and Drop API nativa (sem dependencia extra)
- Ao soltar card em outro dia: mutation para atualizar `data_agendamento` na tabela `servicos_nacional_gas`
- Ao soltar na coluna "Sem Agendamento": define `data_agendamento` como `null`
- Clique no card abre `ServicoNacionalGasDialog`

#### 2. Modificar: `src/pages/MedicaoTerceirizada/Servicos.tsx`
- Adicionar componente `Tabs` (do radix/shadcn) com duas abas: "Servicos" e "Agenda"
- A aba "Servicos" contem todo o conteudo atual (sem alteracoes)
- A aba "Agenda" renderiza o componente `AgendaSemanal`
- Ambas as abas compartilham a mesma query `servicos-nacional-gas` via React Query, garantindo sincronizacao automatica

---

### Secao Tecnica

#### Estrutura do componente AgendaSemanal

```text
AgendaSemanal
├── Navegacao de Semana (prev / "Semana de DD/MM" / next / Hoje)
├── Filtros (UF, Status, Tipo, Bairro)
├── Grid de Colunas
│   ├── Coluna "Sem Agendamento" (servicos com data_agendamento = null)
│   ├── Segunda (servicos do dia)
│   ├── Terca
│   ├── ...
│   └── Domingo
└── Cards Arrastaveis
    ├── Nome do Condominio
    ├── Bairro (extraido de empreendimento.endereco)
    ├── Tipo de Servico
    └── Badge de Status (com cor)
```

#### Drag and Drop
- Implementado com HTML5 nativo (`draggable`, `onDragStart`, `onDragOver`, `onDrop`)
- Nenhuma biblioteca adicional necessaria
- Ao dropar, executa mutation:
  ```
  supabase.from('servicos_nacional_gas')
    .update({ data_agendamento: novaData })
    .eq('id', servicoId)
  ```
- Apos sucesso, invalida query `servicos-nacional-gas` para sincronizar ambas as abas

#### Modificacoes em Servicos.tsx
- Envolver conteudo existente em `<Tabs>` / `<TabsContent value="servicos">` 
- Adicionar `<TabsContent value="agenda">` com `<AgendaSemanal />`
- A query de dados ja existe e sera compartilhada (React Query cache)
- Passar `servicos` e `selectedServico`/`setSelectedServico` como props para o AgendaSemanal
- Reutilizar os dialogs existentes (ServicoNacionalGasDialog, ServicoHistoricoDialog)

#### Campo Bairro
- A tabela `servicos_nacional_gas` nao possui campo `bairro`
- O bairro sera extraido do endereco do empreendimento vinculado (`empreendimento.endereco`) quando disponivel
- Se nao houver empreendimento vinculado, exibe "-"

#### Performance
- Filtragem no frontend (dados ja carregados via React Query)
- Apenas servicos da semana visivel + sem agendamento sao renderizados
- Cards leves com informacoes minimas

