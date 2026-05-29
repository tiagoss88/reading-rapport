## Objetivo

Transformar o bloco cinza somente-leitura (Condomínio / Unidade / Morador / Tipo) do diálogo **Editar Serviço** em campos editáveis pelo ADM, para corrigir informações incompletas passadas pelo cliente.

## Arquivo afetado

- `src/components/medicao-terceirizada/ServicoNacionalGasDialog.tsx`

## Campos que se tornam editáveis

Adicionar ao `formSchema` e ao formulário:

- **Morador (nome)** — `morador_nome` (texto)
- **Telefone** — `telefone` (texto, opcional)
- **E-mail** — `email` (texto, opcional, validação de email)
- **CPF/CNPJ** — `cpf_cnpj` (texto, opcional)
- **Bloco** — `bloco` (texto, opcional)
- **Apartamento** — `apartamento` (texto, opcional)
- **Tipo de Serviço** — `tipo_servico` (select com os tipos existentes do sistema)

Mantidos como somente-leitura (identificação principal):
- **Condomínio** — continua exibido como contexto no topo, sem edição (alteração de condomínio é fluxo distinto).

## Layout proposto

```text
┌─ Editar Serviço ─────────────────────────┐
│ Condomínio: RESERVA DAS PLANTAS (ctx)    │
├──────────────────────────────────────────┤
│ Seção "Dados do Cliente"                 │
│  Morador        Telefone                 │
│  E-mail         CPF/CNPJ                 │
│  Bloco          Apartamento              │
│  Tipo de Serviço                         │
├──────────────────────────────────────────┤
│ Seção "Agendamento" (campos atuais)      │
│  Data | Turno | Técnico | Status | Obs   │
└──────────────────────────────────────────┘
```

## Comportamento

- Ao abrir, `form.reset` preenche todos os novos campos com os valores atuais do serviço.
- O `update` da mutation envia também os novos campos para `servicos_nacional_gas`.
- Toast de sucesso/erro mantém o padrão atual.
- Invalidação de `['servicos-nacional-gas']` continua igual.

## Fora do escopo

- Não altera o diálogo de coletas (`EditarColetaDialog`).
- Não altera RLS — usuários ADM já possuem permissão de UPDATE na tabela.
- Não inclui histórico/auditoria de alterações (pode ser feito em pedido futuro).
