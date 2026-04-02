

## Plano: Tela de execução de serviço terceirizado no coletor

### O que muda

O botão "Marcar como Executado" na tela de detalhes do serviço será renomeado para **"Iniciar Atividade"** e, ao clicar, abrirá uma **nova tela de execução** (em vez do diálogo de confirmação simples). Essa tela conterá o resumo do serviço e formulário completo para registro da execução.

### Campos da tela de execução

1. **Resumo da atividade** (somente leitura) — tipo de serviço, condomínio, bloco/apto, morador, telefone
2. **Observação** — textarea para descrever o serviço realizado
3. **Registro fotográfico** — upload múltiplo (câmera ou galeria), com compressão via `smartCompress`, upload para bucket `medidor-fotos`
4. **Forma de pagamento** — dropdown com opções: Fatura, Pix, Cartão de Crédito, Boleto, Outro
5. **Valor do serviço** — input numérico, preenchimento manual
6. **CPF/CNPJ** — campo texto com máscara para emissão de nota fiscal
7. **Assinatura do cliente** — canvas para assinatura digital (touch/mouse), com botão "Limpar"

### Novos campos no banco de dados

Será necessário adicionar colunas à tabela `servicos_nacional_gas` via migração:

```sql
ALTER TABLE servicos_nacional_gas
  ADD COLUMN forma_pagamento text,
  ADD COLUMN valor_servico numeric,
  ADD COLUMN cpf_cnpj text,
  ADD COLUMN assinatura_url text;
```

A observação já é salva no campo `observacao` existente. As fotos seguem o padrão atual (concatenadas na observação ou em campo separado — usaremos o formato existente de `observacao`).

### Arquivos alterados/criados

**1. Migração SQL** — adicionar 4 colunas em `servicos_nacional_gas`

**2. Criar `src/components/medicao-terceirizada/ExecucaoServicoTerceirizadoDialog.tsx`**
- Componente de tela cheia (não dialog modal) com:
  - Resumo do serviço (read-only)
  - Textarea observação
  - Upload de fotos (reutilizando padrão de `smartCompress` + upload para `medidor-fotos`)
  - Select forma de pagamento
  - Input valor do serviço
  - Input CPF/CNPJ
  - Canvas de assinatura (HTML5 Canvas com eventos touch/mouse)
  - Botão "Concluir Serviço" que faz upload das fotos e assinatura, atualiza `servicos_nacional_gas` com todos os campos, marca status como `executado`

**3. Alterar `src/pages/ColetorServicosTerceirizados.tsx`**
- Renomear botão para "Iniciar Atividade"
- Remover `AlertDialog` de confirmação
- Adicionar estado para abrir tela de execução
- Ao clicar, navegar para o componente de execução passando os dados do serviço
- No `onSuccess`, recarregar lista e voltar à lista

### Assinatura digital

Implementação com `<canvas>` nativo:
- Captura eventos `mousedown/mousemove/mouseup` e `touchstart/touchmove/touchend`
- Botão "Limpar" para resetar
- Na submissão, converte canvas para blob PNG, faz upload para `medidor-fotos`, salva URL em `assinatura_url`

### Fluxo do operador

1. Lista de serviços → clica no serviço → vê detalhes
2. Clica "Iniciar Atividade" → abre tela de execução com resumo
3. Preenche observação, fotos, pagamento, valor, CPF/CNPJ, assinatura
4. Clica "Concluir Serviço" → upload de imagens/assinatura → update no banco → volta à lista

