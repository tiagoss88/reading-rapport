# Materiais utilizados na execução da OS (coletor)

## O que muda para o operador
Na tela de execução do serviço no coletor, entre "Registro Fotográfico" e "Forma de Pagamento", entra o card **Materiais utilizados**:
- a lista já vem preenchida com os materiais configurados para aquele tipo de serviço, nas quantidades padrão;
- o operador pode alterar as quantidades, tirar itens ou adicionar outros materiais com uma busca simples;
- a opção "Nenhum material utilizado" deixa a lista vazia de propósito.

Quando ele finalizar a OS, os itens informados saem automaticamente do armazém do estado (UF) da OS.

## Regras
- A baixa usa o que o operador informou. A baixa automática pela configuração só acontece quando nada foi informado. Assim não há baixa em dobro.
- O operador não vê saldos nem acessa o Estoque. Ele só registra o que usou. As telas de Estoque continuam só para administradores.
- Se o estoque não estiver instalado, ou se não existir armazém ativo para a UF da OS, o card não aparece ou mostra só um aviso. A OS fecha normalmente e o erro vai para o Log de Erros.
- Se a gravação dos materiais falhar, a OS fecha mesmo assim e o operador vê um aviso. O administrador pode lançar a baixa manual depois.
- Os materiais aparecem em Movimentações (motivo "Baixa pelo técnico - OS NG-xxxxxx"), no relatório Consumo por serviço e no aviso "já saiu para esta OS" da baixa manual.

## Banco (script manual para rodar no editor SQL)
Novo `supabase/manual/estoque_coletor.sql`, idempotente:
- `listar_materiais_os(servico_id)`: função security definer que devolve os materiais ativos (id, nome, unidade) e a quantidade padrão do tipo de serviço da OS. Só funciona para usuários logados.
- `registrar_materiais_os(servico_id, itens jsonb)`: função security definer que confere se quem chama é o técnico da OS, um operador ativo ou um admin. Ela busca o armazém ativo pela UF da OS e grava uma saída por item, com `servico_id`. Não grava nada se a OS já tiver saídas, para não duplicar. Devolve a quantidade de itens gravados.
- Libera a execução das duas funções para `authenticated`.

A tela de Estoque passa a avisar quando esse script ainda não foi rodado, com o botão de copiar, igual aos outros.

## Detalhes técnicos
- Novo componente `src/components/medicao-terceirizada/MateriaisUtilizadosCard.tsx`, carregado dentro de um ErrorBoundary. Ele chama `listar_materiais_os`; se a função não existir (PGRST202/42883), o card não aparece.
- Em `ExecucaoServicoTerceirizado.tsx`, `handleSubmit` chama `registrar_materiais_os` **antes** de `updateServicoComFotos`. Assim o trigger `trg_baixa_estoque`, que só age quando a OS ainda não tem saídas, não duplica. Uma falha no RPC é tratada à parte e não impede o fechamento da OS.
- Com "Nenhum material utilizado" marcado, o envio usa `itens = []` e um marcador explícito. A função grava uma movimentação de quantidade zero? Não: ela grava `observacao` no histórico. Para não reativar a baixa automática, o trigger recriado no script também ignora OS com a marca `sem_materiais`, guardada numa tabela leve `estoque_os_sem_material(servico_id)` gravada pela própria função.
