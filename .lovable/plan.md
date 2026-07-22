text
## Objetivo
Reorganizar o menu lateral para separar a navegação de medição da navegação de operação de campo.

## Alterações previstas

### 1. `src/components/Layout.tsx`
- Dividir o array `medicaoTerceirizadaItems` em dois:
  - `medicaoTerceirizadaItems`: Leituras, Empreendimentos, Planejamento, Notificações.
  - `operacaoItems`: Serviços, Georreferenciamento.
- Adicionar estado `operacaoOpen` controlado, inicializado como `true` quando a rota começar com `/medicao-terceirizada` e o item ativo for Serviços ou Georreferenciamento.
- Atualizar o `useEffect` de expansão automática para abrir o grupo correto conforme a rota atual.
- Inserir um novo dropdown "Operação" no menu, abaixo do dropdown "Medição", com o mesmo padrão visual e comportamento de colapso (incluindo modo compacto para a barra reduzida).
- Manter a permissão de visualização do grupo `Operação` igual à de `Medição` (perfis admin e gestor_empreendimento).
- Ajustar ícones para os grupos: `Handshake` para Medição; ícone de ferramentas/campo (ex: `Wrench` ou `Navigation2`) para Operação.

## Critérios de aceitação
- Menu lateral mostra Medição e Operação como grupos separados.
- Itens corretos aparecem dentro de cada grupo.
- Grupo ativo expande automaticamente ao acessar Serviços ou Georreferenciamento.
- Layout continua colapsável e responsivo.
- Nenhuma alteração de backend ou banco de dados.