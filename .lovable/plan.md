

## Gerar PDF "Registro de Atendimento" a partir dos detalhes da execução

### O que muda

Adicionar um botão **"Gerar Relatório PDF"** no `DetalhesExecucaoDialog`. Ao clicar, gera um PDF no estilo do documento de referência (Registro de Atendimento), com os dados do serviço executado, e faz download automático.

### Arquivos impactados

**1. `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx`**

- Ampliar a query para trazer mais campos do serviço (endereço do empreendimento, dados do cliente/morador, UF, etc.)
- Adicionar botão "Gerar Relatório" com ícone `Download` no header do dialog
- Chamar função de geração de PDF ao clicar

**2. Novo: `src/lib/exportRegistroAtendimento.ts`**

Função que recebe os dados do serviço e gera um PDF usando `jsPDF` (já instalado no projeto):

- **Cabeçalho**: "REGISTRO DE ATENDIMENTO" com dados da empresa
- **Dados do consumidor**: nome do morador, condomínio, endereço, bloco/apartamento
- **Dados do serviço**: tipo de serviço, data de agendamento, data de execução, turno, status
- **Técnico responsável**: nome do operador
- **Observações**: texto do técnico
- **Forma de pagamento e valor**
- **CPF/CNPJ**
- **Assinatura do cliente**: imagem embutida no PDF (carregada via fetch da URL)
- **Rodapé**: data/hora de geração

### Layout do PDF

```text
┌──────────────────────────────────────┐
│       REGISTRO DE ATENDIMENTO        │
├──────────────────────────────────────┤
│ Consumidor: [morador_nome]           │
│ Ponto de Consumo: [condomínio]       │
│ Endereço: [endereço empreendimento]  │
│ Bloco: [bloco]  Apt: [apartamento]   │
│ UF: [uf]                             │
├──────────────────────────────────────┤
│ Tipo de Serviço: [tipo_servico]      │
│ Data Agendamento: [data]             │
│ Turno: [turno]                       │
│ Técnico: [nome operador]             │
│ Status: [status_atendimento]         │
├──────────────────────────────────────┤
│ OBSERVAÇÕES                          │
│ [texto observação]                   │
├──────────────────────────────────────┤
│ Forma Pagamento: [forma_pagamento]   │
│ Valor: R$ [valor_servico]            │
│ CPF/CNPJ: [cpf_cnpj]                │
├──────────────────────────────────────┤
│ Assinatura do Cliente:               │
│ [imagem assinatura]                  │
│                                      │
│ Data: [data geração]                 │
└──────────────────────────────────────┘
```

### Detalhes técnicos

- Usa `jsPDF` + `jspdf-autotable` já disponíveis no projeto
- A assinatura é carregada como imagem via `fetch` da URL e convertida para base64 antes de inserir no PDF
- Fotos do registro fotográfico serão listadas como links no PDF (não embutidas, para manter o arquivo leve)
- Download automático com nome: `registro_atendimento_[data]_[condominio].pdf`

