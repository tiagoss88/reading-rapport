import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "atualizar_servico",
  title: "Atualizar serviço",
  description:
    "Atualiza campos de um serviço existente (identificado por ID ou protocolo): agendamento, turno, status, técnico, valor, forma de pagamento e observação.",
  inputSchema: {
    id: z.string().uuid().optional(),
    numero_protocolo: z.string().trim().optional(),
    data_agendamento: z.string().trim().optional().describe("YYYY-MM-DD"),
    turno: z.enum(["manha", "tarde"]).optional(),
    status_atendimento: z.enum(["pendente", "agendado", "executado", "cancelado"]).optional(),
    tecnico_id: z.string().uuid().optional().describe("ID do operador (ver listar_operadores)"),
    morador_nome: z.string().trim().optional(),
    telefone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    cpf_cnpj: z.string().trim().optional(),
    valor_servico: z.number().optional(),
    forma_pagamento: z.string().trim().optional(),
    observacao: z.string().trim().max(1000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const { id, numero_protocolo, ...campos } = input;
    if (!id && !numero_protocolo) return errorResult("Informe id ou numero_protocolo.");

    const updates = Object.fromEntries(
      Object.entries(campos).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(updates).length === 0) return errorResult("Nenhum campo para atualizar.");

    const supabase = supabaseForUser(ctx);
    let query = supabase.from("servicos_nacional_gas").update(updates);
    query = id ? query.eq("id", id) : query.eq("numero_protocolo", numero_protocolo!);

    const { data, error } = await query.select(
      "id, numero_protocolo, condominio_nome_original, bloco, apartamento, status_atendimento, data_agendamento, turno, tecnico_id, valor_servico"
    );

    if (error) return errorResult(error.message);
    if (!data || data.length === 0) return errorResult("Serviço não encontrado ou sem permissão.");
    return jsonResult({ atualizados: data.length, servicos: data });
  },
});
