## Plano

1. Confirmar a origem do erro
   - A chamada atual no navegador está indo para um backend antigo/diferente (`mxof...`), enquanto o backend ativo deste projeto é outro.
   - Isso explica por que a função testada diretamente respondeu, mas a tela continua com `Failed to fetch`.

2. Ajustar a configuração usada pelo app
   - Verificar onde a aplicação está lendo as variáveis públicas do backend.
   - Corrigir a divergência para que o frontend chame o backend atual do projeto.
   - Não editar o cliente auto-gerado diretamente; usar o caminho compatível com a estrutura do projeto.

3. Revisar a função `reset-password`
   - Garantir CORS completo para a chamada do navegador.
   - Manter validação por JWT dentro da função.
   - Manter checagem de permissão/admin antes de alterar senha.
   - Retornar mensagens de erro úteis para a interface.

4. Melhorar o tratamento de erro na tela de Operadores
   - Exibir uma mensagem mais clara quando a função não puder ser chamada.
   - Evitar fechar o modal automaticamente sem mostrar o motivo.

5. Validar o fluxo
   - Testar a chamada da função após o ajuste.
   - Verificar se a senha gerada aparece no modal e pode ser copiada.
   - Confirmar que não há novo erro de CORS ou `Failed to fetch`.

## Observação técnica

O log de rede mostra:

```text
POST ...mxoflglqsxupkzrbodkm.../functions/v1/reset-password
Error: Failed to fetch
```

Mas o backend ativo informado pelo projeto é diferente. Portanto, sim: pode ser uma alteração/configuração manual antiga ou uma divergência de ambiente que deixou o frontend apontando para outro backend.