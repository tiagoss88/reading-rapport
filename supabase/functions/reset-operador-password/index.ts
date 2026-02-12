import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const resetPasswordSchema = z.object({
  operador_id: z.string().uuid('ID do operador inválido'),
  new_password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha muito longa'),
})

serve(async (req: Request) => {
  console.log('Reset password function called:', req.method)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check permissions
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
        JSON.stringify({ error: 'Permissão insuficiente' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    const validationResult = resetPasswordSchema.safeParse(requestBody)

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: validationResult.error.errors.map(e => e.message).join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operador_id, new_password } = validationResult.data

    // Get operador's user_id
    const { data: operador, error: opError } = await supabaseAdmin
      .from('operadores')
      .select('user_id, nome')
      .eq('id', operador_id)
      .single()

    if (opError || !operador) {
      return new Response(
        JSON.stringify({ error: 'Operador não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reset password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      operador.user_id,
      { password: new_password }
    )

    if (updateError) throw updateError

    console.log(`Senha redefinida para operador ${operador.nome} por usuário ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Senha redefinida com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao redefinir senha' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
