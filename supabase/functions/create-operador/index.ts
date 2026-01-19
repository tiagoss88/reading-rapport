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

    // Create client with user's auth token to verify identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
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

    // Criar usuário no Auth usando admin API (não faz login automático)
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        nome
      }
    })

    if (createAuthError) {
      throw createAuthError
    }

    if (!authData.user) {
      throw new Error('Falha ao criar usuário')
    }

    // Criar perfil do operador
    const { error: operadorError } = await supabaseAdmin
      .from('operadores')
      .insert({
        user_id: authData.user.id,
        nome,
        email,
        status: status || 'ativo'
      })

    if (operadorError) {
      // Se falhar ao criar operador, deletar o usuário criado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw operadorError
    }

    console.log(`Operador criado por usuário ${user.id}: ${authData.user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Operador criado com sucesso',
        user_id: authData.user.id
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
