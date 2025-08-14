import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, cnpj, empreendimento_id }: CreateEmpreendimentoUserRequest = await req.json();

    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create the user with email and CNPJ as password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: cnpj,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tipo_usuario: 'empreendimento',
        empreendimento_id: empreendimento_id
      }
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
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

    console.log("Empreendimento user created successfully:", authData.user.id);

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