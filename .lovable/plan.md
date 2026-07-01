## Objetivo
Mover o botão "Copiar para WhatsApp" do topo da página de Planejamento de Rotas para dentro do diálogo de cada rota (aberto pelo botão "Planejar"), permitindo copiar apenas os condomínios/técnicos daquela rota/dia específica.

## Alterações

### 1. `src/pages/MedicaoTerceirizada/PlanejamentoRotas.tsx`
- Remover o botão "Copiar para WhatsApp" ao lado de "Adicionar Dia Útil".
- Remover a função `handleCopiarWhatsApp` e o ícone `MessageCircle` do import (não usado em outro lugar da página).

### 2. `src/components/medicao-terceirizada/RotaDiariaDialog.tsx`
- Adicionar botão "Copiar para WhatsApp" no cabeçalho do diálogo (variant outline, ícone `MessageCircle`).
- Criar `handleCopiarWhatsApp` local que usa os dados já carregados no diálogo (empreendimentos daquela rota + técnicos atribuídos).
- Agrupar por técnico dentro daquela rota específica (fallback "Sem técnico atribuído" quando não houver).
- Formato do texto copiado:
  ```text
  *Rota NN - dd/MM (eee)*

  *👷 Nome do Técnico*
  • Condomínio X
  • Condomínio Y

  *👷 Outro Técnico*
  • Condomínio Z
  ```
- Usar `navigator.clipboard.writeText` com fallback `document.execCommand('copy')`.
- Toast de confirmação via `useToast` (já importado no arquivo).

## Fora do escopo
- Nenhuma mudança no banco de dados.
- Nenhuma mudança na lógica de atribuição/execução de rotas.
