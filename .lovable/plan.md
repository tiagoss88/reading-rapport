

## Plano: Edição de Coletas Realizadas no Painel Admin

### Objetivo
Adicionar botão de edição em cada linha da aba "Coletas Realizadas", abrindo um dialog que permita ao admin:
- Substituir/adicionar foto comprovante
- Editar observação
- Inserir coleta manualmente (botão "Nova Coleta Manual" no header)

### Contexto técnico
As coletas são registros em `servicos_nacional_gas` com `tipo_servico='leitura'` e `status_atendimento='executado'`. A foto fica concatenada no campo `observacao` no formato `Foto comprovante: [URL] | Obs: [texto]`.

### Alterações

**1. Criar dialog `EditarColetaDialog`** (novo componente)
- Props: `coleta` (dados da coleta), `open`, `onOpenChange`, `onSuccess`
- Campos editáveis:
  - **Foto**: exibe foto atual (se houver), botão para substituir/adicionar com upload para bucket `medidor-fotos` + compressão via `smartCompress`
  - **Observação**: textarea com texto extraído da observação atual
- Ao salvar: reconstrói o campo `observacao` no formato existente e faz `UPDATE` em `servicos_nacional_gas`

**2. Criar dialog `NovaColetaManualDialog`** (novo componente)
- Permite admin registrar coleta manual sem passar pelo coletor
- Campos: Condomínio (autocomplete de `empreendimentos_terceirizados`), Data, Foto (upload), Observação
- Insere em `servicos_nacional_gas` com `tipo_servico='leitura'`, `status_atendimento='executado'`

**3. Modificar `src/pages/MedicaoTerceirizada/Leituras.tsx`**
- Adicionar coluna "Ações" na tabela de coletas com botão de edição (ícone `Pencil`)
- Adicionar botão "Nova Coleta Manual" no header da aba "Coletas Realizadas"
- Importar e renderizar os dois novos dialogs
- Invalidar query `coletas-realizadas` após edição/criação

### Arquivos
- **Criados**: `src/components/medicao-terceirizada/EditarColetaDialog.tsx`, `src/components/medicao-terceirizada/NovaColetaManualDialog.tsx`
- **Modificado**: `src/pages/MedicaoTerceirizada/Leituras.tsx`

