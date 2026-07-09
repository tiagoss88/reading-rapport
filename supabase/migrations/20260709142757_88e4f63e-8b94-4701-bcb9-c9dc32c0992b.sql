CREATE TABLE IF NOT EXISTS public.gti_leituras_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uf TEXT NOT NULL CHECK (uf IN ('CE','BA')),
  condominio TEXT NOT NULL,
  leitura_anterior DATE,
  prazo_inicial DATE,
  prazo_final DATE,
  mes_referencia INT NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INT NOT NULL CHECK (ano_referencia BETWEEN 2020 AND 2100),
  importado_por UUID,
  importado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gti_leituras_mensais TO authenticated;
GRANT ALL ON public.gti_leituras_mensais TO service_role;

ALTER TABLE public.gti_leituras_mensais ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS gti_unique_comp
  ON public.gti_leituras_mensais (uf, condominio, ano_referencia, mes_referencia);

CREATE INDEX IF NOT EXISTS idx_gti_competencia
  ON public.gti_leituras_mensais (ano_referencia, mes_referencia);

CREATE INDEX IF NOT EXISTS idx_gti_uf
  ON public.gti_leituras_mensais (uf);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gti_leituras_mensais'
      AND policyname = 'gti_select_all_auth'
  ) THEN
    CREATE POLICY "gti_select_all_auth" ON public.gti_leituras_mensais
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gti_leituras_mensais'
      AND policyname = 'gti_insert_admin_gestor'
  ) THEN
    CREATE POLICY "gti_insert_admin_gestor" ON public.gti_leituras_mensais
      FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor_empreendimento'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gti_leituras_mensais'
      AND policyname = 'gti_update_admin_gestor'
  ) THEN
    CREATE POLICY "gti_update_admin_gestor" ON public.gti_leituras_mensais
      FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor_empreendimento'))
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor_empreendimento'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gti_leituras_mensais'
      AND policyname = 'gti_delete_admin'
  ) THEN
    CREATE POLICY "gti_delete_admin" ON public.gti_leituras_mensais
      FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_gti_updated_at ON public.gti_leituras_mensais;
CREATE TRIGGER trg_gti_updated_at
  BEFORE UPDATE ON public.gti_leituras_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';