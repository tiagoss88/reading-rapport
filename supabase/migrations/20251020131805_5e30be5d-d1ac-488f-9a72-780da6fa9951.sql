-- Recriar trigger on_user_role_changed que está faltando
DROP TRIGGER IF EXISTS on_user_role_changed ON public.user_roles;

CREATE TRIGGER on_user_role_changed
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_role_assignment();