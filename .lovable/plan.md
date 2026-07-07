## Diagnóstico

A Edge Function `reset-password` foi implantada com sucesso e está respondendo corretamente ao testá-la diretamente (retorna 401 "Autenticação necessária" quando chamada sem token, como esperado). Os logs de rede que vi na sessão são anteriores ao deploy, então o erro pode não estar mais ocorrendo.

## Verificação pedida

Antes de mudar código, preciso confirmar se o erro persiste com a função já implantada:

1. Recarregue a página `/operadores` (Ctrl+Shift+R para limpar cache) e tente "Gerar Nova Senha" novamente.
2. Se ainda falhar, me diga a mensagem exata do toast e/ou o status HTTP mostrado no console.

## Se ainda falhar após reload

Investigarei as duas causas prováveis:
- **CORS preflight**: comparar cabeçalhos permitidos com o que o navegador envia.
- **Permissão**: confirmar que o usuário tem `role=admin` ou `permission=manage_operadores` (o log já mostrou `role=admin`, então improvável).

Depois farei o ajuste pontual necessário.