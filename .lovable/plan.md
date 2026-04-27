## Remover alerta de serviços não associados

### Arquivo
`src/pages/MedicaoTerceirizada/Servicos.tsx` (linhas 193–203)

### Mudança
Remover o bloco do `Card` amarelo que exibe a mensagem `"X serviço(s) não foram associados a nenhum empreendimento cadastrado."` exibido acima das abas (Serviços / Agenda / Urgências).

### Observações
- Manter toda a lógica de cálculo de `servicosNaoAssociados` intacta caso seja usada em outros pontos; apenas o JSX do alerta é removido.
- Sem impacto em queries, dados ou outras telas.
