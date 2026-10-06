-- Índices de desempenho (idempotente: pode rodar mais de uma vez)
create index if not exists idx_servicos_ng_created_at on public.servicos_nacional_gas (created_at desc);
create index if not exists idx_servicos_ng_uf_status on public.servicos_nacional_gas (uf, status_atendimento);
do $$ begin
  if to_regclass('public.estoque_movimentacoes') is not null then
    create index if not exists idx_estoque_mov_created_at on public.estoque_movimentacoes (created_at desc);
    create index if not exists idx_estoque_mov_servico on public.estoque_movimentacoes (servico_id);
    create index if not exists idx_estoque_mov_mat_arm on public.estoque_movimentacoes (material_id, armazem_id);
  end if;
end $$;
