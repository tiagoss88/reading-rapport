-- Módulo Financeiro (idempotente). Rode no SQL Editor do banco oficial.
-- Não cria triggers em servicos_nacional_gas: fechar OS nunca depende do financeiro.

create table if not exists public.financeiro_recebimentos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references public.servicos_nacional_gas(id) on delete cascade,
  data_pagamento date not null default current_date,
  valor numeric(12,2) not null check (valor > 0),
  forma_pagamento text not null,
  observacao text,
  criado_por uuid,
  estornado_em timestamptz,
  estornado_por uuid,
  motivo_estorno text,
  created_at timestamptz not null default now()
);

create table if not exists public.financeiro_situacao_os (
  servico_id uuid primary key references public.servicos_nacional_gas(id) on delete cascade,
  isento boolean not null default false,
  motivo_isencao text,
  atualizado_por uuid,
  updated_at timestamptz not null default now()
);

create index if not exists idx_fin_receb_servico on public.financeiro_recebimentos(servico_id);
create index if not exists idx_fin_receb_data on public.financeiro_recebimentos(data_pagamento);

grant select, insert, update, delete on public.financeiro_recebimentos to authenticated;
grant all on public.financeiro_recebimentos to service_role;
grant select, insert, update, delete on public.financeiro_situacao_os to authenticated;
grant all on public.financeiro_situacao_os to service_role;

alter table public.financeiro_recebimentos enable row level security;
alter table public.financeiro_situacao_os enable row level security;

drop policy if exists "fin_receb_admin" on public.financeiro_recebimentos;
create policy "fin_receb_admin" on public.financeiro_recebimentos
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "fin_sit_admin" on public.financeiro_situacao_os;
create policy "fin_sit_admin" on public.financeiro_situacao_os
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
