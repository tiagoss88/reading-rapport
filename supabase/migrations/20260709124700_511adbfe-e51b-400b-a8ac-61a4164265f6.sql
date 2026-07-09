GRANT SELECT, INSERT, UPDATE, DELETE ON public.gti_leituras_mensais TO authenticated;
GRANT ALL ON public.gti_leituras_mensais TO service_role;
NOTIFY pgrst, 'reload schema';