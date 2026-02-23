

## Padronizar "leitura" em caixa alta na tabela de Serviços

### Problema
O campo `tipo_servico` é exibido exatamente como está no banco. Tipos como "INSTALACAO GERAL" e "DESLIGAMENTO" estão em maiúsculas, mas "leitura" está em minúsculas.

### Solução
Aplicar `.toUpperCase()` na exibição do `tipo_servico` na tabela, na linha 339 de `src/pages/MedicaoTerceirizada/Servicos.tsx`:

```
// Antes
<TableCell>{servico.tipo_servico}</TableCell>

// Depois
<TableCell>{servico.tipo_servico?.toUpperCase()}</TableCell>
```

### Arquivo a editar

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/pages/MedicaoTerceirizada/Servicos.tsx` | 339 | Adicionar `.toUpperCase()` ao render de `tipo_servico` |

