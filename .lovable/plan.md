

## Mover Painel de Urgencias para uma aba "Prazos"

### O que muda
Remover o painel de urgencias do topo da pagina e criar uma nova aba **"Prazos"** ao lado de "Servicos" e "Agenda", onde o conteudo de servicos com prazo critico ficara organizado.

### Alteracoes

**Arquivo: `src/pages/MedicaoTerceirizada/Servicos.tsx`**

1. Remover o `<PainelUrgencias>` que esta acima das tabs (linhas 175-178)
2. Adicionar uma nova `<TabsTrigger value="prazos">` com icone `AlertTriangle` e texto "Prazos" ao lado da aba "Agenda"
3. Adicionar um novo `<TabsContent value="prazos">` que renderiza o componente `PainelUrgencias` com os servicos e a funcao `onEditServico`
4. Opcionalmente, adicionar um badge com a contagem de servicos urgentes na aba "Prazos" para chamar atencao mesmo sem clicar nela

### Resultado
A pagina ficara mais limpa, com o painel de prazos acessivel pela aba dedicada, sem ocupar espaco no topo quando o usuario esta trabalhando na lista de servicos ou na agenda.

