import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: userData, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' })
    const { data: hasPermission } = await supabaseAdmin.rpc('has_permission', { _user_id: userData.user.id, _permission: 'manage_operadores' })

    if (!isAdmin && !hasPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { operador_id, new_email } = await req.json()

    if (!operador_id || !new_email) {
      return new Response(JSON.stringify({ error: 'operador_id e new_email são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get the operador's user_id
    const { data: operador, error: opError } = await supabaseAdmin
      .from('operadores')
      .select('user_id')
      .eq('id', operador_id)
      .single()

    if (opError || !operador) {
      return new Response(JSON.stringify({ error: 'Operador não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update email in Auth
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(operador.user_id, {
      email: new_email,
      email_confirm: true
    })

    if (authUpdateError) {
      return new Response(JSON.stringify({ error: `Erro ao atualizar Auth: ${authUpdateError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update email in operadores table
    const { error: tableError } = await supabaseAdmin
      .from('operadores')
      .update({ email: new_email, updated_at: new Date().toISOString() })
      .eq('id', operador_id)

    if (tableError) {
      return new Response(JSON.stringify({ error: `Erro ao atualizar tabela: ${tableError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, message: 'Email atualizado com sucesso' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
