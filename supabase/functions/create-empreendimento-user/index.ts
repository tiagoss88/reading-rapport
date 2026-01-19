import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateEmpreendimentoUserRequest {
  email: string;
  cnpj: string;
  empreendimento_id: string;
}

const createEmpreendimentoUserSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve conter 14 dígitos'),
  empreendimento_id: z.string().uuid('ID de empreendimento inválido')
})

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Check if user has admin role or manage_empreendimentos permission
    const { data: hasAdminRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    const { data: hasPermission } = await supabaseAdmin.rpc('has_permission', {
      _user_id: user.id,
      _permission: 'manage_empreendimentos'
    })

    if (!hasAdminRole && !hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Permissão insuficiente para criar usuários de empreendimento' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    const requestBody: CreateEmpreendimentoUserRequest = await req.json();

    // Validate input using Zod
    const validationResult = createEmpreendimentoUserSchema.safeParse(requestBody)
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos', 
          details: validationResult.error.errors.map(e => e.message).join(', ')
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    const { email, cnpj, empreendimento_id } = validationResult.data

    // Create the user with email and CNPJ as password
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: cnpj,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tipo_usuario: 'empreendimento',
        empreendimento_id: empreendimento_id
      }
    });

    if (createAuthError) {
      console.error("Error creating user:", createAuthError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createAuthError.message}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Link the empreendimento to the user
    const { error: linkError } = await supabaseAdmin
      .from('empreendimento_users')
      .insert({
        empreendimento_id: empreendimento_id,
        user_id: authData.user.id
      });

    if (linkError) {
      console.error("Error linking empreendimento to user:", linkError);
      // Try to delete the created user if linking fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: `Erro ao vincular empreendimento ao usuário: ${linkError.message}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Empreendimento user created by ${user.id}: ${authData.user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: authData.user.id,
        message: "Usuário criado com sucesso para o empreendimento"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-empreendimento-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
