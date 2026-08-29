import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_empreendimentos",
  title: "Listar empreendimentos",
  description: "Lista os condomínios (empreendimentos terceirizados) com UF, rota e quantidade de medidores.",
  inputSchema: {
    uf: z.string().trim().length(2).optional(),
    nome: z.string().trim().optional().describe("Parte do nome do condomínio"),
    rota: z.number().int().optional(),
    limite: z.number().int().min(1).max(500).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("empreendimentos_terceirizados")
      .select("id, nome, uf, endereco, rota, quantidade_medidores, latitude, longitude")
      .order("nome")
      .limit(input.limite ?? 200);

    if (input.uf) query = query.eq("uf", input.uf.toUpperCase());
    if (input.nome) query = query.ilike("nome", `%${input.nome}%`);
    if (input.rota !== undefined) query = query.eq("rota", input.rota);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ total: data?.length ?? 0, empreendimentos: data ?? [] });
  },
});
