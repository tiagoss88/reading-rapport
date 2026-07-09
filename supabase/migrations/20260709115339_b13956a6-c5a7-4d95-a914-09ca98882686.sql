
CREATE TABLE public.gti_leituras_mensais (
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gti_unique_comp UNIQUE (uf, condominio, ano_referencia, mes_referencia)
);

CREATE INDEX idx_gti_competencia ON public.gti_leituras_mensais (ano_referencia, mes_referencia);
CREATE INDEX idx_gti_uf ON public.gti_leituras_mensais (uf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gti_leituras_mensais TO authenticated;
GRANT ALL ON public.gti_leituras_mensais TO service_role;

ALTER TABLE public.gti_leituras_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gti_select_all_auth" ON public.gti_leituras_mensais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "gti_insert_admin_gestor" ON public.gti_leituras_mensais
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor_empreendimento'));

CREATE POLICY "gti_update_admin_gestor" ON public.gti_leituras_mensais
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor_empreendimento'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor_empreendimento'));

CREATE POLICY "gti_delete_admin" ON public.gti_leituras_mensais
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_gti_updated_at
  BEFORE UPDATE ON public.gti_leituras_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
