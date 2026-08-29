import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_operadores",
  title: "Listar operadores",
  description: "Lista os técnicos/operadores cadastrados, com id, nome, e-mail e status.",
  inputSchema: {
    apenas_ativos: z.boolean().optional().describe("Padrão: true"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ apenas_ativos = true }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const supabase = supabaseForUser(ctx);

    let query = supabase.from("operadores").select("id, nome, email, status").order("nome");
    if (apenas_ativos) query = query.eq("status", "ativo");

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ total: data?.length ?? 0, operadores: data ?? [] });
  },
});
