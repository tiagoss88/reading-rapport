-- Limpeza completa do sistema mantendo apenas o usuário admin
-- Admin ID: ac274a2c-b961-4c9d-b228-15cc48c10675
-- ATENÇÃO: Esta operação é IRREVERSÍVEL!

-- 1. Deletar localizações de operadores
DELETE FROM public.operador_localizacoes;

-- 2. Deletar leituras
DELETE FROM public.leituras;

-- 3. Deletar serviços
DELETE FROM public.servicos;

-- 4. Deletar serviços externos
DELETE FROM public.servicos_externos;

-- 5. Deletar clientes
DELETE FROM public.clientes;

-- 6. Deletar associações empreendimento-usuários (exceto admin)
DELETE FROM public.empreendimento_users
WHERE user_id != 'ac274a2c-b961-4c9d-b228-15cc48c10675';

-- 7. Deletar empreendimentos
DELETE FROM public.empreendimentos;

-- 8. Deletar operadores (exceto o admin se houver)
DELETE FROM public.operadores
WHERE user_id != 'ac274a2c-b961-4c9d-b228-15cc48c10675';

-- 9. Deletar roles de usuários (exceto admin)
DELETE FROM public.user_roles
WHERE user_id != 'ac274a2c-b961-4c9d-b228-15cc48c10675';

-- 10. Deletar permissões de usuários (exceto admin)
DELETE FROM public.user_permissions
WHERE user_id != 'ac274a2c-b961-4c9d-b228-15cc48c10675';