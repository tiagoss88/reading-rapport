import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_servicos",
  title: "Listar serviços",
  description:
    "Lista serviços da Nacional Gás com filtros por UF, condomínio, apartamento, status, tipo, protocolo e período de agendamento.",
  inputSchema: {
    uf: z.string().trim().length(2).optional().describe("Sigla do estado, ex: CE ou BA"),
    condominio: z.string().trim().optional().describe("Parte do nome do condomínio"),
    apartamento: z.string().trim().optional(),
    bloco: z.string().trim().optional(),
    status: z
      .enum(["pendente", "agendado", "executado", "cancelado"])
      .optional()
      .describe("Status do atendimento"),
    tipo_servico: z.string().trim().optional(),
    numero_protocolo: z.string().trim().optional(),
    data_inicio: z.string().trim().optional().describe("Data inicial do agendamento (YYYY-MM-DD)"),
    data_fim: z.string().trim().optional().describe("Data final do agendamento (YYYY-MM-DD)"),
    limite: z.number().int().min(1).max(200).optional().describe("Máximo de registros (padrão 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("servicos_nacional_gas")
      .select(
        "id, numero_protocolo, data_solicitacao, uf, condominio_nome_original, bloco, apartamento, morador_nome, telefone, email, cpf_cnpj, tipo_servico, data_agendamento, turno, status_atendimento, tecnico_id, valor_servico, forma_pagamento, observacao"
      )
      .order("data_agendamento", { ascending: false, nullsFirst: false })
      .limit(input.limite ?? 50);

    if (input.uf) query = query.eq("uf", input.uf.toUpperCase());
    if (input.status) query = query.eq("status_atendimento", input.status);
    if (input.numero_protocolo) query = query.ilike("numero_protocolo", `%${input.numero_protocolo}%`);
    if (input.condominio) query = query.ilike("condominio_nome_original", `%${input.condominio}%`);
    if (input.apartamento) query = query.ilike("apartamento", `%${input.apartamento}%`);
    if (input.bloco) query = query.ilike("bloco", `%${input.bloco}%`);
    if (input.tipo_servico) query = query.ilike("tipo_servico", `%${input.tipo_servico}%`);
    if (input.data_inicio) query = query.gte("data_agendamento", input.data_inicio);
    if (input.data_fim) query = query.lte("data_agendamento", input.data_fim);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult({ total: data?.length ?? 0, servicos: data ?? [] });
  },
});
