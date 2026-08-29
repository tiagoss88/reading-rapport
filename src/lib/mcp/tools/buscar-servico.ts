import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "buscar_servico",
  title: "Buscar serviço",
  description: "Retorna os detalhes completos de um serviço pelo número de protocolo ou pelo ID.",
  inputSchema: {
    numero_protocolo: z.string().trim().optional().describe("Ex: NG-000123"),
    id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ numero_protocolo, id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    if (!numero_protocolo && !id) return errorResult("Informe numero_protocolo ou id.");
    const supabase = supabaseForUser(ctx);

    let query = supabase.from("servicos_nacional_gas").select("*").limit(1);
    query = id ? query.eq("id", id) : query.eq("numero_protocolo", numero_protocolo!);

    const { data, error } = await query.maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Serviço não encontrado.");
    return jsonResult(data);
  },
});
