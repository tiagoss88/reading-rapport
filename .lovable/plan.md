

## Redesign do DetalhesExecucaoDialog conforme modelo HTML

### O que muda

Reescrever o layout do `DetalhesExecucaoDialog` para espelhar visualmente o HTML enviado — com header azul, badge do tipo de serviço, grid 2 colunas com labels uppercase cinza, caixa de observação, seção de pagamento, área de assinaturas lado a lado, e grid de fotos com legendas.

### Arquivo: `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx`

**1. Header estilo relatório**
- Título "RELATÓRIO DE ATENDIMENTO" em azul (`text-blue-600`) à esquerda
- Data de geração e protocolo à direita em cinza pequeno
- Linha azul separadora (`border-b-2 border-blue-500`)

**2. Badge do tipo de serviço**
- Retângulo azul arredondado com texto branco (ex: "TROCA DE MEDIDOR")

**3. Seção "Resumo da Atividade"**
- Título de seção em azul uppercase com borda inferior cinza
- Grid 2 colunas (`grid grid-cols-2 gap-4`) com:
  - Label: `text-[8pt] uppercase text-gray-500 font-bold`
  - Valor: `text-sm text-black`
  - Campos: Condomínio/Local, Unidade, Estado, Cliente, Telefone, E-mail

**4. Seção "Observação do Técnico"**
- Caixa com borda cinza, fundo branco, min-height, texto pre-wrap

**5. Seção "Informações de Pagamento e Cadastro"**
- Grid 2 colunas: Forma de Pagamento, Valor, CPF/CNPJ (condicional)

**6. Área de Assinaturas**
- Duas colunas lado a lado:
  - Esquerda: imagem da assinatura digital + linha + "Assinatura do Cliente"
  - Direita: nome do técnico + linha + "Responsável Técnico"

**7. Registro Fotográfico**
- Grid 2 colunas com fotos em containers com borda arredondada
- Legenda abaixo de cada foto: "Registro 01", "Registro 02", etc.

**8. Footer**
- Texto centralizado cinza pequeno: "Relatório de Atendimento Gerado via Sistema"

**9. Botão Gerar PDF** — permanece no topo, sem alteração de lógica

### Dialog expandido
- `max-w-2xl` (mais largo que o atual `max-w-lg`) para acomodar o grid 2 colunas

### Componentes auxiliares
- Remover `Section` e `InfoRow` antigos
- Criar `SectionTitle` (título azul uppercase com borda) e `InfoItem` (label/value empilhados)

### Detalhes técnicos
- Apenas 1 arquivo alterado: `DetalhesExecucaoDialog.tsx`
- Sem mudança na query, lógica de PDF, ou interface de dados
- Layout puramente CSS com Tailwind, sem dependências novas

