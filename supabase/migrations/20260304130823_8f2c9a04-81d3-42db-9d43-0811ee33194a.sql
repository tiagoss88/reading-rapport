-- Remaining tables
CREATE TABLE public.operador_localizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id UUID REFERENCES operadores(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  precisao NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  bateria_nivel INTEGER,
  em_movimento BOOLEAN DEFAULT false,
  velocidade NUMERIC,
  endereco_estimado TEXT,
  fonte_localizacao TEXT,
  precisao_rating TEXT CHECK (precisao_rating IN ('excelente', 'boa', 'aceitavel', 'ruim')),
  tentativas_gps INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_operador_localizacoes_operador_id ON operador_localizacoes(operador_id);
CREATE INDEX idx_operador_localizacoes_timestamp ON operador_localizacoes(operador_id, timestamp DESC);
ALTER TABLE operador_localizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operadores podem inserir suas localizacoes" ON operador_localizacoes FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM operadores WHERE operadores.id = operador_localizacoes.operador_id AND operadores.user_id = auth.uid()));

CREATE POLICY "Admins e gestores podem ver todas as localizacoes" ON operador_localizacoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor_empreendimento'));

CREATE POLICY "Operadores podem ver suas localizacoes" ON operador_localizacoes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM operadores WHERE operadores.id = operador_localizacoes.operador_id AND operadores.user_id = auth.uid()));

CREATE OR REPLACE VIEW operadores_ultima_localizacao AS
SELECT DISTINCT ON (ol.operador_id)
  ol.id, ol.operador_id, o.nome AS operador_nome, o.email AS operador_email, o.status AS operador_status,
  ol.latitude, ol.longitude, ol.precisao, ol.timestamp, ol.bateria_nivel, ol.em_movimento, ol.velocidade,
  EXTRACT(EPOCH FROM (NOW() - ol.timestamp)) AS segundos_desde_atualizacao
FROM operador_localizacoes ol INNER JOIN operadores o ON o.id = ol.operador_id
WHERE o.status = 'ativo' ORDER BY ol.operador_id, ol.timestamp DESC;

-- Tipos servico
CREATE TABLE public.tipos_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  preco_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tipos_servico_nome ON public.tipos_servico(nome);
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins e gestores podem ver tipos" ON public.tipos_servico FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'manage_operadores') OR has_permission(auth.uid(), 'create_servicos'));
CREATE POLICY "Admins podem gerenciar tipos" ON public.tipos_servico FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'manage_operadores'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'manage_operadores'));
CREATE TRIGGER update_tipos_servico_updated_at BEFORE UPDATE ON public.tipos_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Empreendimentos terceirizados
CREATE TABLE public.empreendimentos_terceirizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, endereco TEXT NOT NULL,
  uf TEXT NOT NULL CHECK (uf IN ('BA', 'CE')),
  quantidade_medidores INTEGER NOT NULL DEFAULT 0,
  rota INTEGER NOT NULL CHECK (rota >= 1),
  latitude numeric, longitude numeric,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empreendimentos_terceirizados ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_empreendimentos_terceirizados_updated_at BEFORE UPDATE ON public.empreendimentos_terceirizados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins e gestores podem ver empreendimentos terceirizados" ON public.empreendimentos_terceirizados FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins e gestores podem criar empreendimentos terceirizados" ON public.empreendimentos_terceirizados FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins e gestores podem atualizar empreendimentos terceirizados" ON public.empreendimentos_terceirizados FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins podem deletar empreendimentos terceirizados" ON public.empreendimentos_terceirizados FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Operadores can also see empreendimentos_terceirizados for coletor
CREATE POLICY "Operadores podem ver empreendimentos terceirizados" ON public.empreendimentos_terceirizados FOR SELECT
USING (EXISTS (SELECT 1 FROM operadores WHERE user_id = auth.uid()));

-- Dias uteis
CREATE TABLE public.dias_uteis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf TEXT NOT NULL CHECK (uf IN ('BA', 'CE')),
  ano INTEGER NOT NULL, mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  numero_rota INTEGER NOT NULL CHECK (numero_rota >= 1),
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(uf, ano, mes, numero_rota)
);
ALTER TABLE public.dias_uteis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins e gestores podem ver dias uteis" ON public.dias_uteis FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins e gestores podem gerenciar dias uteis" ON public.dias_uteis FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

-- Rotas leitura
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
ALTER TABLE public.rotas_leitura ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_rotas_leitura_updated_at BEFORE UPDATE ON public.rotas_leitura FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins e gestores podem ver todas as rotas" ON public.rotas_leitura FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Operadores podem ver suas rotas" ON public.rotas_leitura FOR SELECT
USING (operador_id IN (SELECT id FROM operadores WHERE user_id = auth.uid()));
CREATE POLICY "Admins e gestores podem gerenciar rotas" ON public.rotas_leitura FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));

-- Servicos nacional gas
CREATE TABLE public.servicos_nacional_gas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_solicitacao DATE, uf TEXT NOT NULL CHECK (uf IN ('BA', 'CE')),
  empreendimento_id UUID REFERENCES public.empreendimentos_terceirizados(id) ON DELETE SET NULL,
  condominio_nome_original TEXT NOT NULL, bloco TEXT, apartamento TEXT,
  fonte TEXT, morador_nome TEXT, telefone TEXT, email TEXT,
  tipo_servico TEXT NOT NULL, data_agendamento DATE,
  status_atendimento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_atendimento IN ('pendente', 'agendado', 'executado', 'cancelado')),
  turno TEXT CHECK (turno IN ('manha', 'tarde') OR turno IS NULL),
  tecnico_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servicos_nacional_gas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_servicos_nacional_gas_updated_at BEFORE UPDATE ON public.servicos_nacional_gas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins e gestores podem ver servicos ng" ON public.servicos_nacional_gas FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins e gestores podem criar servicos ng" ON public.servicos_nacional_gas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins e gestores podem atualizar servicos ng" ON public.servicos_nacional_gas FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Admins podem deletar servicos ng" ON public.servicos_nacional_gas FOR DELETE
USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Operadores podem ver todos os servicos ng" ON public.servicos_nacional_gas FOR SELECT
USING (EXISTS (SELECT 1 FROM operadores WHERE user_id = auth.uid()));
CREATE POLICY "Operadores podem atualizar servicos ng" ON public.servicos_nacional_gas FOR UPDATE
USING (EXISTS (SELECT 1 FROM operadores WHERE user_id = auth.uid()));

-- Servicos nacional gas historico
CREATE TABLE public.servicos_nacional_gas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES public.servicos_nacional_gas(id) ON DELETE CASCADE,
  campo_alterado TEXT NOT NULL, valor_anterior TEXT, valor_novo TEXT,
  alterado_por UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servicos_nacional_gas_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins e gestores podem ver historico" ON public.servicos_nacional_gas_historico FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor_empreendimento'));
CREATE POLICY "Sistema pode inserir historico" ON public.servicos_nacional_gas_historico FOR INSERT WITH CHECK (true);

-- Historico trigger
CREATE OR REPLACE FUNCTION public.registrar_historico_servico()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
END; $$;
CREATE TRIGGER registrar_historico_servico_trigger AFTER UPDATE ON public.servicos_nacional_gas FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_servico();

-- Configuracoes sistema
CREATE TABLE public.configuracoes_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave varchar(100) UNIQUE NOT NULL, valor text, descricao text,
  tipo varchar(50) DEFAULT 'text',
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados podem ler configuracoes" ON public.configuracoes_sistema FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem inserir configuracoes" ON public.configuracoes_sistema FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem atualizar configuracoes" ON public.configuracoes_sistema FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem deletar configuracoes" ON public.configuracoes_sistema FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON public.configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- get_public_empreendimentos function
CREATE OR REPLACE FUNCTION public.get_public_empreendimentos()
RETURNS TABLE (id uuid, nome text, endereco text, latitude numeric, longitude numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT e.id, e.nome, e.endereco, e.latitude, e.longitude FROM public.empreendimentos e WHERE e.nome IS NOT NULL AND e.endereco IS NOT NULL;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_empreendimentos() TO anon, authenticated;

-- Add FK for notificacoes_medidores
ALTER TABLE public.notificacoes_medidores ADD CONSTRAINT fk_notificacoes_empreendimento FOREIGN KEY (empreendimento_id) REFERENCES public.empreendimentos_terceirizados(id);