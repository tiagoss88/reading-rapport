

## Filtrar serviços tipo "leitura" da listagem de Serviços

### Mudança

Adicionar filtro na query do Supabase e/ou na lógica de `filteredServicos` para excluir serviços com `tipo_servico` contendo "leitura" (case-insensitive).

### Arquivo: `src/pages/MedicaoTerceirizada/Servicos.tsx`

**Linha ~131-142:** Adicionar condição ao filtro existente:

```typescript
const filteredServicos = servicos?.filter(servico => {
  // Não exibir serviços tipo "leitura"
  if (servico.tipo_servico?.toLowerCase().includes('leitura')) return false
  
  const matchesSearch = 
    servico.condominio_nome_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.morador_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.apartamento?.toLowerCase().includes(searchTerm.toLowerCase())
  
  const matchesUf = ufFilter === 'all' || servico.uf === ufFilter
  const matchesStatus = statusFilter === 'all' || servico.status_atendimento === statusFilter
  const matchesTipo = tipoFilter === 'all' || servico.tipo_servico === tipoFilter
  
  return matchesSearch && matchesUf && matchesStatus && matchesTipo
})
```

### Impacto

- Serviços com tipo "leitura", "Leitura", "LEITURA" ou qualquer variação ficam ocultos na aba Serviços
- Não afeta os contadores de urgências ou a agenda semanal
- Lógica de paginação e filtros permanece intacta

