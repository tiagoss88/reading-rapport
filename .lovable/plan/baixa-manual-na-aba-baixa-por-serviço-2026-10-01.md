# Baixa manual na aba "Baixa por serviço"

## O que muda
A aba ganha dois modos no topo: **Baixa manual** (nova, aberta por padrão) e **Materiais por tipo de serviço** (a configuração que já existe hoje, sem alterações).

### Baixa manual
1. **Vincular a uma OS (opcional)**: campo de busca por protocolo (NG-000000), condomínio, bloco/apartamento ou morador. Mostra até 20 resultados com protocolo, condomínio/unidade, tipo, status e UF. Ao escolher uma OS:
   - o armazém do mesmo estado da OS é sugerido;
   - os materiais configurados para aquele tipo de serviço já entram na lista com as quantidades padrão, que podem ser editadas ou removidas;
   - aparece o aviso de quanto material já saiu para essa OS, para evitar baixa em dobro.
2. **Sem OS**: a opção "Saída avulsa (sem OS)" exige um motivo, como perda, avaria, empréstimo ou uso interno.
3. **Itens**: escolha o material e a quantidade e adicione quantos precisar. O saldo do armazém aparece ao lado, com alerta quando a quantidade passa do saldo. A baixa continua permitida, mas pede confirmação.
4. **Confirmar baixa**: grava uma saída para cada item, com armazém, OS (se tiver), motivo e observação. Depois limpa o formulário.
5. **Últimas baixas manuais**: lista curta com as 10 saídas mais recentes feitas por aqui, para conferência.

As baixas aparecem normalmente em Movimentações e nos Relatórios de Estoque. O relatório "Consumo por serviço" passa a contar também as baixas manuais ligadas a uma OS.

## Detalhes técnicos
- Não precisa de mudança no banco: `estoque_movimentacoes` já tem `servico_id`, `motivo`, `observacao`, `armazem_id` e `criado_por`. As saídas são gravadas com `tipo='saida'`. O motivo usa o prefixo "Baixa manual" ou "Baixa manual - OS".
- A busca de OS consulta `servicos_nacional_gas` com `ilike` em `numero_protocolo`, `condominio_nome_original`, `bloco`, `apartamento` e `morador_nome`, com debounce de 300ms e limite de 20.
- Novo componente `src/components/estoque/BaixaManualTab.tsx`. `ReceitasTab` passa a ter um seletor de modo. O conteúdo atual vai para o modo "Materiais por tipo de serviço".
- Continua dentro do ErrorBoundary atual da aba. O acesso segue restrito a administradores, como hoje.
