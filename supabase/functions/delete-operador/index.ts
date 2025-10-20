import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteOperadorRequest {
  operador_id: string
}

const deleteOperadorSchema = z.object({
  operador_id: z.string().uuid('ID do operador inválido')
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    
    // Validate input using Zod
    const validationResult = deleteOperadorSchema.safeParse(requestBody)
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos', 
          details: validationResult.error.errors.map(e => e.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operador_id } = validationResult.data

    // Criar cliente Supabase com service role para ter permissões de admin
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

    // Buscar o operador para obter o user_id
    const { data: operador, error: fetchError } = await supabaseAdmin
      .from('operadores')
      .select('user_id')
      .eq('id', operador_id)
      .single()

    if (fetchError || !operador) {
      return new Response(
        JSON.stringify({ error: 'Operador não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deletar o registro na tabela operadores
    const { error: deleteOperadorError } = await supabaseAdmin
      .from('operadores')
      .delete()
      .eq('id', operador_id)

    if (deleteOperadorError) {
      throw deleteOperadorError
    }

    // Deletar o usuário do Supabase Auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      operador.user_id
    )

    if (deleteUserError) {
      console.error('Erro ao deletar usuário do Auth:', deleteUserError)
      // Nota: mesmo se falhar ao deletar do Auth, consideramos sucesso
      // pois o operador foi removido da tabela
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Operador deletado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao deletar operador:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao deletar operador' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
