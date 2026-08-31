CREATE TABLE public.logs_erro (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text,
  rota text,
  severidade text NOT NULL DEFAULT 'error',
  mensagem text NOT NULL,
  detalhes text,
  user_agent text,
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_logs_erro_created_at ON public.logs_erro (created_at DESC);
CREATE INDEX idx_logs_erro_severidade ON public.logs_erro (severidade);

GRANT INSERT ON public.logs_erro TO anon;
GRANT INSERT, SELECT, DELETE ON public.logs_erro TO authenticated;
GRANT ALL ON public.logs_erro TO service_role;

ALTER TABLE public.logs_erro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
ON public.logs_erro FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view error logs"
ON public.logs_erro FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete error logs"
ON public.logs_erro FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));