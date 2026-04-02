

## Mover ícone Eye para o final da coluna Ações

### Alteração: `src/pages/MedicaoTerceirizada/Servicos.tsx` (linhas 392-403)

Reordenar os botões para que o Eye fique **depois** do Pencil e History, mantendo o alinhamento dos dois primeiros ícones igual para todos os serviços:

```
Antes:  [Eye] [Pencil] [History]
Depois: [Pencil] [History] [Eye]
```

Mover o bloco condicional do Eye (linhas 393-397) para depois do botão History (após linha 403).

