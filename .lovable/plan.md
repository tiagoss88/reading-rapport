

## Reordenar informacoes nos cards da lista de servicos

### O que muda
Alterar a ordem das informacoes nos cards da lista para:

1. Tipo de servico + Status (mesma linha)
2. Condominio
3. Bloco / APT
4. Cliente (nome do morador)

### Alteracao tecnica

**`src/pages/ColetorServicosTerceirizados.tsx`** (linhas 389-407)

Reordenar os elementos dentro do card, movendo o nome do morador para depois do bloco/apartamento:

```text
Antes:                          Depois:
1. Tipo + Status                1. Tipo + Status
2. Morador                      2. Condominio
3. Condominio                   3. Bloco / APT
4. Bloco / APT                  4. Morador (cliente)
```

Alteracao simples de posicao dos elementos JSX, sem mudanca de logica ou dados.

