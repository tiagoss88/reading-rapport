## Objetivo

Limpar a visão **Serviços / Agenda** removendo dois tipos de cards que poluem a tela:

1. **Leituras** — já têm sua própria sessão (Medição / Leituras).
2. **Serviços já executados** — fluxo encerrado, não precisam aparecer no planejamento.

## Mudança

Editar `src/components/medicao-terceirizada/AgendaSemanal.tsx`, no `useMemo` do `filtered` (linhas ~95-107), adicionando dois novos filtros base aplicados antes dos demais:

- Excluir registros cujo `tipo_servico` contenha "leitura" (case-insensitive), mesma regra já usada no relatório RDO.
- Excluir registros com `status_atendimento === 'executado'`.

```ts
const filtered = useMemo(() =>
  servicos.filter(s => {
    // Ocultar leituras (têm sessão própria)
    if ((s.tipo_servico || '').toLowerCase().includes('leitura')) return false
    // Ocultar serviços já executados
    if (s.status_atendimento === 'executado') return false

    if (ufFilter !== 'all' && s.uf !== ufFilter) return false
    if (statusFilter !== 'all' && s.status_atendimento !== statusFilter) return false
    if (tipoFilter !== 'all' && s.tipo_servico !== tipoFilter) return false
    if (bairroFilter !== 'all') {
      const bairro = extrairBairro((s.empreendimento as any)?.endereco)
      if (bairro !== bairroFilter) return false
    }
    return true
  }),
  [servicos, ufFilter, statusFilter, tipoFilter, bairroFilter]
)
```

## Efeito

- Agenda passa a mostrar apenas serviços ativos (pendente, agendado, em andamento, etc.) — sem leituras e sem executados.
- Listas auxiliares de filtro (`ufs`, `tipos`, `bairros`) continuam baseadas em `servicos` cru, sem impacto.
- A página principal **Medição / Serviços** (lista) **não é alterada** — continua mostrando tudo como hoje.
- Relatórios RDO e demais telas permanecem inalterados.

## Fora de escopo

- Nenhuma alteração de banco de dados.
- Nenhuma mudança em outras abas/telas.