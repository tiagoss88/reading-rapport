import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser } from "../supabase";
import { buscarServicoDuplicado } from "@/lib/duplicidadeServico";

export default defineTool({
  name: "criar_servico",
  title: "Criar serviço",
  description:
    "Cria um novo serviço da Nacional Gás. O número de protocolo é gerado automaticamente. Informe UF e o nome do condomínio exatamente como cadastrado. Serviços duplicados (mesmo condomínio, unidade, morador e tipo, ainda em aberto) são bloqueados salvo permitir_duplicado.",
  inputSchema: {
    uf: z.string().trim().length(2).describe("CE ou BA"),
    condominio_nome: z.string().trim().min(1).describe("Nome do condomínio"),
    tipo_servico: z.string().trim().min(1).describe("Ex: Visita Técnica, Religação, Desligamento"),
    bloco: z.string().trim().optional(),
    apartamento: z.string().trim().optional(),
    morador_nome: z.string().trim().optional(),
    telefone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    cpf_cnpj: z.string().trim().optional(),
    fonte: z.string().trim().optional(),
    data_solicitacao: z.string().trim().optional().describe("YYYY-MM-DD"),
    data_agendamento: z.string().trim().optional().describe("YYYY-MM-DD"),
    turno: z.enum(["manha", "tarde"]).optional(),
    status_atendimento: z.enum(["pendente", "agendado", "executado", "cancelado"]).optional(),
    valor_servico: z.number().optional(),
    forma_pagamento: z.string().trim().optional(),
    observacao: z.string().trim().max(1000).optional(),
    permitir_duplicado: z
      .boolean()
      .optional()
      .describe("Cria mesmo que já exista serviço igual em aberto"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const uf = input.uf.toUpperCase();

    if (!input.permitir_duplicado) {
      const dup = await buscarServicoDuplicado(supabase as any, {
        uf,
        condominio_nome_original: input.condominio_nome,
        bloco: input.bloco,
        apartamento: input.apartamento,
        morador_nome: input.morador_nome,
        tipo_servico: input.tipo_servico,
      });
      if (dup) {
        return errorResult(
          `Serviço duplicado: já existe um atendimento em aberto (protocolo ${dup.numero_protocolo ?? dup.id}, status ${dup.status_atendimento}) para essa unidade, morador e tipo de serviço. Use permitir_duplicado=true para forçar.`
        );
      }
    }

    // Tenta vincular ao empreendimento cadastrado (mesma UF).
    const { data: emp } = await supabase
      .from("empreendimentos_terceirizados")
      .select("id, nome")
      .eq("uf", uf)
      .ilike("nome", `%${input.condominio_nome}%`)
      .limit(2);

    const empreendimento_id = emp && emp.length === 1 ? emp[0].id : null;


    const { data, error } = await supabase
      .from("servicos_nacional_gas")
      .insert({
        uf,
        empreendimento_id,
        condominio_nome_original: input.condominio_nome,
        bloco: input.bloco ?? null,
        apartamento: input.apartamento ?? null,
        morador_nome: input.morador_nome ?? null,
        telefone: input.telefone ?? null,
        email: input.email ?? null,
        cpf_cnpj: input.cpf_cnpj ?? null,
        fonte: input.fonte ?? "MCP",
        tipo_servico: input.tipo_servico,
        data_solicitacao: input.data_solicitacao ?? null,
        data_agendamento: input.data_agendamento ?? null,
        turno: input.turno ?? null,
        status_atendimento:
          input.status_atendimento ?? (input.data_agendamento ? "agendado" : "pendente"),
        valor_servico: input.valor_servico ?? null,
        forma_pagamento: input.forma_pagamento ?? null,
        observacao: input.observacao ?? null,
      })
      .select("id, numero_protocolo, condominio_nome_original, status_atendimento, data_agendamento")
      .single();

    if (error) return errorResult(error.message);
    return jsonResult({
      criado: data,
      empreendimento_vinculado: empreendimento_id ? emp?.[0]?.nome : null,
      aviso: empreendimento_id
        ? undefined
        : "Nenhum empreendimento único encontrado com esse nome; o serviço ficou sem vínculo.",
    });
  },
});
