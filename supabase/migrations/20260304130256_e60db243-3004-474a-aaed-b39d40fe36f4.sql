CREATE TABLE public.notificacoes_medidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_notificacao DATE NOT NULL,
  empreendimento_id UUID,
  condominio_nome TEXT NOT NULL,
  bloco TEXT NOT NULL,
  unidade TEXT NOT NULL,
  fotos TEXT[] DEFAULT '{}',
  operador_id UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notificacoes_medidores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notificacoes"
  ON public.notificacoes_medidores FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notificacoes"
  ON public.notificacoes_medidores FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notificacoes"
  ON public.notificacoes_medidores FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete notificacoes"
  ON public.notificacoes_medidores FOR DELETE TO authenticated
  USING (true);