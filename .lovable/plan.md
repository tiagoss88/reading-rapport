

## Tela de detalhes do servico terceirizado no coletor

### O que muda
Ao clicar em um servico na lista, em vez de nao acontecer nada, abre uma tela de detalhes completa com todas as informacoes do servico. O botao "Marcar como Executado" sai da listagem e vai para dentro dessa tela, com confirmacao antes de executar.

### Fluxo do usuario
1. Operador ve a lista de servicos (cards simplificados, sem botao de executar)
2. Clica em um card
3. Abre tela de detalhes mostrando:
   - Tipo de servico (titulo)
   - Status (badge)
   - Nome do morador
   - Telefone
   - Email
   - Condominio
   - Bloco / Apartamento
   - Data de agendamento e turno
   - Observacao
4. Botao "Marcar como Executado" no final
5. Ao clicar, aparece um dialog de confirmacao: "Tem certeza que deseja marcar este servico como executado?"
6. Confirma -> atualiza status -> volta para a lista

### Alteracoes tecnicas

**1. `src/pages/ColetorServicosTerceirizados.tsx`**
- Adicionar `telefone` e `email` na query do Supabase e na interface `ServicoTerceirizado`
- Adicionar state `selectedServico` para controlar qual servico esta aberto
- Remover o botao "Marcar como Executado" dos cards da lista
- Tornar os cards clicaveis (onClick -> setSelectedServico)
- Adicionar state `showConfirmDialog` para o double-check
- Renderizar condicionalmente: se `selectedServico` existe, mostra a tela de detalhes; senao, mostra a lista
- Na tela de detalhes:
  - Botao de voltar (seta) que limpa `selectedServico`
  - Todas as informacoes do servico em layout limpo
  - Botao "Marcar como Executado" ao final
- Dialog de confirmacao usando `AlertDialog` antes de executar a acao

Nenhum arquivo novo precisa ser criado - todas as alteracoes ficam no mesmo componente para manter a simplicidade.
