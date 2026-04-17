import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateOperadorRequest {
  nome: string
  email: string
  password: string
  status: string
}

const createOperadorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha muito longa'),
  status: z.enum(['ativo', 'inativo'], { errorMap: () => ({ message: 'Status deve ser ativo ou inativo' }) })
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract token and verify identity
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Não autorizado', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service role para verificar permissões
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user has admin role or manage_operadores permission
    const { data: hasAdminRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    const { data: hasPermission } = await supabaseAdmin.rpc('has_permission', {
      _user_id: user.id,
      _permission: 'manage_operadores'
    })

    if (!hasAdminRole && !hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Permissão insuficiente para criar operadores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    
    // Validate input using Zod
    const validationResult = createOperadorSchema.safeParse(requestBody)
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos', 
          details: validationResult.error.errors.map(e => e.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { nome, email, password, status } = validationResult.data

    // Verificar se o usuário já existe no Auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError)
      throw listError
    }

    const existingUser = existingUsers?.users.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      // Verificar se já existe um operador com esse user_id
      const { data: existingOperador } = await supabaseAdmin
        .from('operadores')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()

      if (existingOperador) {
        return new Response(
          JSON.stringify({ error: 'Já existe um operador cadastrado com este email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Atualizar senha do usuário existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password, user_metadata: { nome } }
      )

      if (updateError) {
        throw updateError
      }

      userId = existingUser.id
      console.log(`Reutilizando usuário existente: ${userId}`)
    } else {
      // Criar novo usuário no Auth
      const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome }
      })

      if (createAuthError) throw createAuthError
      if (!authData.user) throw new Error('Falha ao criar usuário')

      userId = authData.user.id
      console.log(`Novo usuário Auth criado: ${userId}`)
    }

    // Criar perfil do operador
    const { error: operadorError } = await supabaseAdmin
      .from('operadores')
      .insert({
        user_id: userId,
        nome,
        email,
        status: status || 'ativo'
      })

    if (operadorError) {
      // Se falhar ao criar operador e era um usuário novo, deletar o usuário criado
      if (!existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      throw operadorError
    }

    console.log(`Operador criado por usuário ${user.id}: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Operador criado com sucesso',
        user_id: userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao criar operador:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao criar operador' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
