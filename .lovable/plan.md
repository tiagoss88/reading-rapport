# Mover "Georreferenciamento" para o menu "Medição"

## O que muda

No menu lateral, o item **Georreferenciamento** sai do grupo **Operação** e passa para o grupo **Medição**.

- **Medição:** Leituras, Empreendimentos, Planejamento, Notificações, Georreferenciamento
- **Operação:** Serviços (único item restante)

O endereço da página continua o mesmo, então links salvos seguem funcionando.

## Detalhes técnicos

Em `src/components/Layout.tsx`:
- Mover a entrada `{ name: 'Georreferenciamento', href: '/medicao-terceirizada/georreferenciamento', icon: Navigation2 }` de `operacaoItems` para o fim de `medicaoTerceirizadaItems`.
- Ajustar `operacaoPaths` para conter apenas `/medicao-terceirizada/servicos`, de modo que o grupo **Medição** fique destacado/aberto ao acessar a página de georreferenciamento.
- Sem mudanças de rotas, permissões ou lógica de dados.
