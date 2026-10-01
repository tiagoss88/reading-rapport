-- =====================================================================
-- ESTOQUE - Materiais informados pelo técnico no coletor (idempotente)
-- Requer: estoque_producao.sql e estoque_armazens.sql já executados.
-- =====================================================================

-- OS fechadas sem uso de material (impede a baixa automática)
CREATE TABLE IF NOT EXISTS public.estoque_os_sem_material (
  servico_id uuid PRIMARY KEY REFERENCES public.servicos_nacional_gas(id) ON DELETE CASCADE,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.estoque_os_sem_material TO authenticated;
GRANT ALL ON public.estoque_os_sem_material TO service_role;
ALTER TABLE public.estoque_os_sem_material ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_admin_sem_material" ON public.estoque_os_sem_material;
CREATE POLICY "estoque_admin_sem_material" ON public.estoque_os_sem_material FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Lista de materiais para o coletor (com quantidade padrão do tipo da OS)
CREATE OR REPLACE FUNCTION public.listar_materiais_os(p_servico_id uuid)
RETURNS TABLE(id uuid, nome text, unidade text, quantidade_padrao numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_tipo text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT s.tipo_servico INTO v_tipo FROM public.servicos_nacional_gas s WHERE s.id = p_servico_id;
  RETURN QUERY
    SELECT m.id, m.nome, m.unidade,
           (SELECT tsm.quantidade FROM public.tipo_servico_materiais tsm
             WHERE tsm.material_id = m.id AND upper(trim(tsm.tipo_servico)) = upper(trim(v_tipo)) LIMIT 1)
      FROM public.materiais m
     WHERE m.ativo
     ORDER BY m.nome;
END $$;

-- Grava os materiais usados na OS (saída do armazém da UF da OS)
CREATE OR REPLACE FUNCTION public.registrar_materiais_os(p_servico_id uuid, p_itens jsonb, p_sem_material boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_os record; v_armazem uuid; v_qtd integer := 0; v_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT s.id, s.uf, s.numero_protocolo, s.tecnico_id INTO v_os FROM public.servicos_nacional_gas s WHERE s.id = p_servico_id;
  IF v_os.id IS NULL THEN RAISE EXCEPTION 'OS não encontrada'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin')
          OR EXISTS (SELECT 1 FROM public.operadores o WHERE o.user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF EXISTS (SELECT 1 FROM public.estoque_movimentacoes WHERE servico_id = p_servico_id AND tipo = 'saida') THEN
    RETURN 0;
  END IF;

  IF p_sem_material OR p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    INSERT INTO public.estoque_os_sem_material (servico_id, criado_por) VALUES (p_servico_id, auth.uid())
      ON CONFLICT (servico_id) DO NOTHING;
    RETURN 0;
  END IF;

  SELECT a.id INTO v_armazem FROM public.armazens a
   WHERE a.ativo AND upper(trim(a.uf)) = upper(trim(v_os.uf)) ORDER BY a.created_at LIMIT 1;
  IF v_armazem IS NULL THEN RAISE EXCEPTION 'Nenhum armazém ativo para a UF %', v_os.uf; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
    IF (v_item->>'quantidade')::numeric > 0 THEN
      INSERT INTO public.estoque_movimentacoes (material_id, armazem_id, tipo, quantidade, motivo, servico_id, operador_id, criado_por)
      VALUES ((v_item->>'material_id')::uuid, v_armazem, 'saida', (v_item->>'quantidade')::numeric,
              trim('Baixa pelo técnico - OS ' || coalesce(v_os.numero_protocolo, '')), p_servico_id,
              (SELECT o.id FROM public.operadores o WHERE o.user_id = auth.uid() LIMIT 1), auth.uid());
      v_qtd := v_qtd + 1;
    END IF;
  END LOOP;
  RETURN v_qtd;
END $$;

REVOKE ALL ON FUNCTION public.listar_materiais_os(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.registrar_materiais_os(uuid, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_materiais_os(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_materiais_os(uuid, jsonb, boolean) TO authenticated;

-- Baixa automática: ignora OS marcadas como "sem material"
CREATE OR REPLACE FUNCTION public.baixa_estoque_ao_executar_servico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_armazem uuid;
BEGIN
  BEGIN
    IF NEW.status_atendimento IN ('executado', 'concluido')
       AND OLD.status_atendimento IS DISTINCT FROM NEW.status_atendimento
       AND NEW.tipo_servico IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.tipo_servico_materiais tsm
                   WHERE upper(trim(tsm.tipo_servico)) = upper(trim(NEW.tipo_servico)))
       AND NOT EXISTS (SELECT 1 FROM public.estoque_movimentacoes
                       WHERE servico_id = NEW.id AND tipo = 'saida')
       AND NOT EXISTS (SELECT 1 FROM public.estoque_os_sem_material WHERE servico_id = NEW.id) THEN
      SELECT id INTO v_armazem FROM public.armazens
       WHERE ativo AND upper(trim(uf)) = upper(trim(NEW.uf))
       ORDER BY created_at LIMIT 1;
      IF v_armazem IS NULL THEN
        RAISE EXCEPTION 'Nenhum armazém ativo para a UF %', NEW.uf;
      END IF;
      INSERT INTO public.estoque_movimentacoes (material_id, armazem_id, tipo, quantidade, motivo, servico_id, operador_id, criado_por)
      SELECT tsm.material_id, v_armazem, 'saida', tsm.quantidade,
             'Baixa automática: ' || NEW.tipo_servico, NEW.id, NEW.tecnico_id, auth.uid()
      FROM public.tipo_servico_materiais tsm
      JOIN public.materiais m ON m.id = tsm.material_id AND m.ativo
      WHERE upper(trim(tsm.tipo_servico)) = upper(trim(NEW.tipo_servico));
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Baixa de estoque ignorada para o serviço %: %', NEW.id, SQLERRM;
    BEGIN
      IF to_regclass('public.logs_erro') IS NOT NULL THEN
        EXECUTE 'INSERT INTO public.logs_erro (severidade, mensagem, detalhes, rota, contexto) VALUES ($1, $2, $3, $4, $5)'
          USING 'warning', 'Baixa automática de estoque falhou', SQLERRM, 'trigger:baixa_estoque',
                jsonb_build_object('servico_id', NEW.id, 'tipo_servico', NEW.tipo_servico, 'uf', NEW.uf);
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END;
  END;
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
