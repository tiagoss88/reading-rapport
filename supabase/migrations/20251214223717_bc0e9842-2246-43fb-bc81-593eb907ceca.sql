-- 1. Tabela de Empreendimentos Terceirizados
CREATE TABLE public.empreendimentos_terceirizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  uf TEXT NOT NULL CHECK (uf IN ('BA', 'CE')),
  quantidade_medidores INTEGER NOT NULL DEFAULT 0,
  rota INTEGER NOT NULL CHECK (rota >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Dias Úteis (cadastro manual por UF/mês)
CREATE TABLE public.dias_uteis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf TEXT NOT NULL CHECK (uf IN ('BA', 'CE')),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  numero_rota INTEGER NOT NULL CHECK (numero_rota >= 1),
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(uf, ano, mes, numero_rota)
);

-- 3. Tabela de Rotas de Leitura (planejamento diário)
CREATE TABLE public.rotas_leitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos_terceirizados(id) ON DELETE CASCADE,
  operador_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Serviços Nacional Gás
CREATE TABLE public.servicos_nacional_gas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_solicitacao DATE,
  uf TEXT NOT NULL CHECK (uf IN ('BA', 'CE')),
  empreendimento_id UUID REFERENCES public.empreendimentos_terceirizados(id) ON DELETE SET NULL,
  condominio_nome_original TEXT NOT NULL,
  bloco TEXT,
  apartamento TEXT,
  fonte TEXT,
  morador_nome TEXT,
  telefone TEXT,
  email TEXT,
  tipo_servico TEXT NOT NULL,
  data_agendamento DATE,
  status_atendimento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_atendimento IN ('pendente', 'agendado', 'executado', 'cancelado')),
  turno TEXT CHECK (turno IN ('manha', 'tarde') OR turno IS NULL),
  tecnico_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de Histórico de Serviços
CREATE TABLE public.servicos_nacional_gas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES public.servicos_nacional_gas(id) ON DELETE CASCADE,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  alterado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_empreendimentos_terceirizados_updated_at
  BEFORE UPDATE ON public.empreendimentos_terceirizados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rotas_leitura_updated_at
  BEFORE UPDATE ON public.rotas_leitura
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_nacional_gas_updated_at
  BEFORE UPDATE ON public.servicos_nacional_gas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar histórico de alterações
CREATE OR REPLACE FUNCTION public.registrar_historico_servico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campo TEXT;
  valor_ant TEXT;
  valor_nov TEXT;
BEGIN
  -- Comparar cada campo e registrar alterações
  IF OLD.data_agendamento IS DISTINCT FROM NEW.data_agendamento THEN
    INSERT INTO servicos_nacional_gas_historico (servico_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
    VALUES (NEW.id, 'data_agendamento', OLD.data_agendamento::TEXT, NEW.data_agendamento::TEXT, auth.uid());
  END IF;
  
  IF OLD.status_atendimento IS DISTINCT FROM NEW.status_atendimento THEN
    INSERT INTO servicos_nacional_gas_historico (servico_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
    VALUES (NEW.id, 'status_atendimento', OLD.status_atendimento, NEW.status_atendimento, auth.uid());
  END IF;
  
  IF OLD.turno IS DISTINCT FROM NEW.turno THEN
    INSERT INTO servicos_nacional_gas_historico (servico_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
    VALUES (NEW.id, 'turno', OLD.turno, NEW.turno, auth.uid());
  END IF;
  
  IF OLD.tecnico_id IS DISTINCT FROM NEW.tecnico_id THEN
    INSERT INTO servicos_nacional_gas_historico (servico_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
    VALUES (NEW.id, 'tecnico_id', OLD.tecnico_id::TEXT, NEW.tecnico_id::TEXT, auth.uid());
  END IF;
  
  IF OLD.observacao IS DISTINCT FROM NEW.observacao THEN
    INSERT INTO servicos_nacional_gas_historico (servico_id, campo_alterado, valor_anterior, valor_novo, alterado_por)
    VALUES (NEW.id, 'observacao', OLD.observacao, NEW.observacao, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar histórico
CREATE TRIGGER registrar_historico_servico_trigger
  AFTER UPDATE ON public.servicos_nacional_gas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_servico();

-- Habilitar RLS
ALTER TABLE public.empreendimentos_terceirizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dias_uteis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas_leitura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_nacional_gas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_nacional_gas_historico ENABLE ROW LEVEL SECURITY;

-- RLS para empreendimentos_terceirizados
CREATE POLICY "Admins e gestores podem ver empreendimentos terceirizados"
  ON public.empreendimentos_terceirizados FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins e gestores podem criar empreendimentos terceirizados"
  ON public.empreendimentos_terceirizados FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins e gestores podem atualizar empreendimentos terceirizados"
  ON public.empreendimentos_terceirizados FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins podem deletar empreendimentos terceirizados"
  ON public.empreendimentos_terceirizados FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS para dias_uteis
CREATE POLICY "Admins e gestores podem ver dias uteis"
  ON public.dias_uteis FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins e gestores podem gerenciar dias uteis"
  ON public.dias_uteis FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

-- RLS para rotas_leitura
CREATE POLICY "Admins e gestores podem ver todas as rotas"
  ON public.rotas_leitura FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Operadores podem ver suas rotas"
  ON public.rotas_leitura FOR SELECT
  USING (operador_id IN (SELECT id FROM operadores WHERE user_id = auth.uid()));

CREATE POLICY "Admins e gestores podem gerenciar rotas"
  ON public.rotas_leitura FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

-- RLS para servicos_nacional_gas
CREATE POLICY "Admins e gestores podem ver servicos"
  ON public.servicos_nacional_gas FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins e gestores podem criar servicos"
  ON public.servicos_nacional_gas FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins e gestores podem atualizar servicos"
  ON public.servicos_nacional_gas FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Admins podem deletar servicos"
  ON public.servicos_nacional_gas FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS para historico
CREATE POLICY "Admins e gestores podem ver historico"
  ON public.servicos_nacional_gas_historico FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Sistema pode inserir historico"
  ON public.servicos_nacional_gas_historico FOR INSERT
  WITH CHECK (true);