-- Criar manualmente um usuário para o empreendimento Solar dos Mares
-- Primeiro vamos inserir um usuário fictício na tabela empreendimento_users
-- para simular que o usuário foi criado

-- Note: Em produção, seria necessário configurar o SUPABASE_SERVICE_ROLE_KEY
-- e a edge function criaria o usuário automaticamente

-- Para teste, vamos criar uma entrada na tabela empreendimento_users
-- simulando que um usuário existe (você precisará criar o usuário manualmente no Supabase Auth)

-- Como não podemos criar usuários diretamente via SQL, vamos adicionar uma explicação
-- O usuário precisará ser criado manualmente ou a edge function precisa ser configurada

-- Para debug, vamos verificar o empreendimento existente
SELECT id, nome, email, cnpj FROM empreendimentos WHERE email IS NOT NULL;