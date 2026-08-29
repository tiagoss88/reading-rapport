import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "resumo_operacional",
  title: "Resumo operacional",
  description:
    "Retorna contagens de serviços por status e por tipo em um período de agendamento, opcionalmente filtrado por UF.",
  inputSchema: {
    uf: z.string().trim().length(2).optional(),
    data_inicio: z.string().trim().optional().describe("YYYY-MM-DD"),
    data_fim: z.string().trim().optional().describe("YYYY-MM-DD"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("servicos_nacional_gas")
      .select("status_atendimento, tipo_servico, valor_servico, uf, data_agendamento")
      .limit(5000);

    if (input.uf) query = query.eq("uf", input.uf.toUpperCase());
    if (input.data_inicio) query = query.gte("data_agendamento", input.data_inicio);
    if (input.data_fim) query = query.lte("data_agendamento", input.data_fim);

    const { data, error } = await query;
    if (error) return errorResult(error.message);

    const porStatus: Record<string, number> = {};
    const porTipo: Record<string, number> = {};
    let valorTotal = 0;

    for (const row of data ?? []) {
      porStatus[row.status_atendimento] = (porStatus[row.status_atendimento] ?? 0) + 1;
      porTipo[row.tipo_servico] = (porTipo[row.tipo_servico] ?? 0) + 1;
      if (typeof row.valor_servico === "number") valorTotal += row.valor_servico;
    }

    return jsonResult({
      total: data?.length ?? 0,
      por_status: porStatus,
      por_tipo: porTipo,
      valor_total: Number(valorTotal.toFixed(2)),
    });
  },
});
