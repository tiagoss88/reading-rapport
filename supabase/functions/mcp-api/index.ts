// Servidor MCP com autenticação por CHAVE FIXA (sem OAuth).
// Endpoint: /functions/v1/mcp-api  — cabeçalho: Authorization: Bearer <MCP_API_KEY>
// Mantém as mesmas 7 ferramentas do servidor MCP OAuth.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-api-key, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- banco de dados do sistema ----------
const DB_URL = (Deno.env.get("NGD_SUPABASE_URL") ?? "https://mxoflglqsxupkzrbodkm.supabase.co").trim();
const DB_KEY = (Deno.env.get("NGD_SERVICE_ROLE_KEY") ?? "").trim();

const db = () => {
  if (!DB_KEY) throw new Error("NGD_SERVICE_ROLE_KEY não configurada no servidor.");
  return createClient(DB_URL, DB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
};

// ---------- duplicidade (mesma regra de src/lib/duplicidadeServico.ts) ----------
const STATUS_ABERTO = ["pendente", "agendado"];

const normText = (v: unknown): string =>
  (v ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const normCondo = (v: unknown): string => {
  let s = normText(v);
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/^ba\s+/, " ");
  s = s.replace(/\b(condominio|cond|residencial|resid|edificio|ed)\b/g, " ");
  return s.replace(/[^a-z0-9]/g, "");
};

const normUnidade = (v: unknown): string => {
  let s = normText(v).replace(/[^a-z0-9]/g, "");
  if (s === "unico" || s === "u") s = "";
  return s.replace(/^0+/, "");
};

// deno-lint-ignore no-explicit-any
const dupKey = (row: any): string =>
  [
    normText(row.uf),
    normCondo(row.condominio_nome_original),
    normUnidade(row.bloco),
    normUnidade(row.apartamento),
    normText(row.morador_nome).replace(/[^a-z0-9]/g, ""),
    normText(row.tipo_servico).replace(/[^a-z0-9]/g, ""),
  ].join("|");

// ---------- ferramentas ----------
type Handler = (args: Record<string, unknown>) => Promise<unknown>;
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, boolean>;
  handler: Handler;
};

const str = (d?: string) => ({ type: "string", ...(d ? { description: d } : {}) });
const num = (d?: string) => ({ type: "number", ...(d ? { description: d } : {}) });
const bool = (d?: string) => ({ type: "boolean", ...(d ? { description: d } : {}) });
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});

const STATUS = ["pendente", "agendado", "executado", "cancelado"];

const tools: Tool[] = [
  {
    name: "listar_servicos",
    title: "Listar serviços",
    description:
      "Lista serviços da Nacional Gás com filtros por UF, condomínio, apartamento, status, tipo, protocolo e período de agendamento.",
    inputSchema: obj({
      uf: str("Sigla do estado, ex: CE ou BA"),
      condominio: str("Parte do nome do condomínio"),
      apartamento: str(),
      bloco: str(),
      status: { type: "string", enum: STATUS },
      tipo_servico: str(),
      numero_protocolo: str(),
      data_inicio: str("YYYY-MM-DD"),
      data_fim: str("YYYY-MM-DD"),
      limite: num("Máximo de registros (padrão 50, até 200)"),
    }),
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: async (i) => {
      const limite = Math.min(Math.max(Number(i.limite ?? 50) || 50, 1), 200);
      let q = db()
        .from("servicos_nacional_gas")
        .select(
          "id, numero_protocolo, data_solicitacao, uf, condominio_nome_original, bloco, apartamento, morador_nome, telefone, email, cpf_cnpj, tipo_servico, data_agendamento, turno, status_atendimento, tecnico_id, valor_servico, forma_pagamento, observacao",
        )
        .order("data_agendamento", { ascending: false, nullsFirst: false })
        .limit(limite);

      if (i.uf) q = q.eq("uf", String(i.uf).toUpperCase());
      if (i.status) q = q.eq("status_atendimento", String(i.status));
      if (i.numero_protocolo) q = q.ilike("numero_protocolo", `%${i.numero_protocolo}%`);
      if (i.condominio) q = q.ilike("condominio_nome_original", `%${i.condominio}%`);
      if (i.apartamento) q = q.ilike("apartamento", `%${i.apartamento}%`);
      if (i.bloco) q = q.ilike("bloco", `%${i.bloco}%`);
      if (i.tipo_servico) q = q.ilike("tipo_servico", `%${i.tipo_servico}%`);
      if (i.data_inicio) q = q.gte("data_agendamento", String(i.data_inicio));
      if (i.data_fim) q = q.lte("data_agendamento", String(i.data_fim));

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { total: data?.length ?? 0, servicos: data ?? [] };
    },
  },
  {
    name: "buscar_servico",
    title: "Buscar serviço",
    description: "Retorna os detalhes completos de um serviço pelo número de protocolo ou pelo ID.",
    inputSchema: obj({ numero_protocolo: str("Ex: NG-000123"), id: str("UUID do serviço") }),
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: async ({ numero_protocolo, id }) => {
      if (!numero_protocolo && !id) throw new Error("Informe numero_protocolo ou id.");
      let q = db().from("servicos_nacional_gas").select("*").limit(1);
      q = id ? q.eq("id", String(id)) : q.eq("numero_protocolo", String(numero_protocolo));
      const { data, error } = await q.maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Serviço não encontrado.");
      return data;
    },
  },
  {
    name: "listar_empreendimentos",
    title: "Listar empreendimentos",
    description: "Lista os condomínios (empreendimentos terceirizados) com UF, rota e quantidade de medidores.",
    inputSchema: obj({ uf: str(), nome: str("Parte do nome do condomínio"), rota: num(), limite: num() }),
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: async (i) => {
      const limite = Math.min(Math.max(Number(i.limite ?? 200) || 200, 1), 500);
      let q = db()
        .from("empreendimentos_terceirizados")
        .select("id, nome, uf, endereco, rota, quantidade_medidores, latitude, longitude")
        .order("nome")
        .limit(limite);
      if (i.uf) q = q.eq("uf", String(i.uf).toUpperCase());
      if (i.nome) q = q.ilike("nome", `%${i.nome}%`);
      if (i.rota !== undefined && i.rota !== null) q = q.eq("rota", Number(i.rota));
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { total: data?.length ?? 0, empreendimentos: data ?? [] };
    },
  },
  {
    name: "listar_operadores",
    title: "Listar operadores",
    description: "Lista os técnicos/operadores cadastrados, com id, nome, e-mail e status.",
    inputSchema: obj({ apenas_ativos: bool("Padrão: true") }),
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: async ({ apenas_ativos = true }) => {
      let q = db().from("operadores").select("id, nome, email, status").order("nome");
      if (apenas_ativos) q = q.eq("status", "ativo");
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { total: data?.length ?? 0, operadores: data ?? [] };
    },
  },
  {
    name: "resumo_operacional",
    title: "Resumo operacional",
    description:
      "Retorna contagens de serviços por status e por tipo em um período de agendamento, opcionalmente filtrado por UF.",
    inputSchema: obj({ uf: str(), data_inicio: str("YYYY-MM-DD"), data_fim: str("YYYY-MM-DD") }),
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: async (i) => {
      let q = db()
        .from("servicos_nacional_gas")
        .select("status_atendimento, tipo_servico, valor_servico, uf, data_agendamento")
        .limit(5000);
      if (i.uf) q = q.eq("uf", String(i.uf).toUpperCase());
      if (i.data_inicio) q = q.gte("data_agendamento", String(i.data_inicio));
      if (i.data_fim) q = q.lte("data_agendamento", String(i.data_fim));
      const { data, error } = await q;
      if (error) throw new Error(error.message);

      const porStatus: Record<string, number> = {};
      const porTipo: Record<string, number> = {};
      let valorTotal = 0;
      for (const row of data ?? []) {
        porStatus[row.status_atendimento] = (porStatus[row.status_atendimento] ?? 0) + 1;
        porTipo[row.tipo_servico] = (porTipo[row.tipo_servico] ?? 0) + 1;
        if (typeof row.valor_servico === "number") valorTotal += row.valor_servico;
      }
      return {
        total: data?.length ?? 0,
        por_status: porStatus,
        por_tipo: porTipo,
        valor_total: Number(valorTotal.toFixed(2)),
      };
    },
  },
  {
    name: "criar_servico",
    title: "Criar serviço",
    description:
      "Cria um novo serviço da Nacional Gás. O protocolo é gerado automaticamente. Serviços duplicados (mesmo condomínio, unidade, morador e tipo, ainda em aberto) são bloqueados salvo permitir_duplicado.",
    inputSchema: obj(
      {
        uf: str("CE ou BA"),
        condominio_nome: str("Nome do condomínio"),
        tipo_servico: str("Ex: Visita Técnica, Religação, Desligamento"),
        bloco: str(),
        apartamento: str(),
        morador_nome: str(),
        telefone: str(),
        email: str(),
        cpf_cnpj: str(),
        fonte: str(),
        data_solicitacao: str("YYYY-MM-DD"),
        data_agendamento: str("YYYY-MM-DD"),
        turno: { type: "string", enum: ["manha", "tarde"] },
        status_atendimento: { type: "string", enum: STATUS },
        valor_servico: num(),
        forma_pagamento: str(),
        observacao: str(),
        permitir_duplicado: bool("Cria mesmo que já exista serviço igual em aberto"),
      },
      ["uf", "condominio_nome", "tipo_servico"],
    ),
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    handler: async (i) => {
      const client = db();
      const uf = String(i.uf).toUpperCase();

      if (!i.permitir_duplicado) {
        const alvo = {
          uf,
          condominio_nome_original: i.condominio_nome,
          bloco: i.bloco,
          apartamento: i.apartamento,
          morador_nome: i.morador_nome,
          tipo_servico: i.tipo_servico,
        };
        const { data: abertos, error: errDup } = await client
          .from("servicos_nacional_gas")
          .select(
            "id, numero_protocolo, status_atendimento, uf, condominio_nome_original, bloco, apartamento, morador_nome, tipo_servico",
          )
          .in("status_atendimento", STATUS_ABERTO)
          .eq("uf", uf)
          .limit(1000);
        if (errDup) throw new Error(errDup.message);
        const chave = dupKey(alvo);
        const dup = (abertos ?? []).find((s) => dupKey(s) === chave);
        if (dup) {
          throw new Error(
            `Serviço duplicado: já existe um atendimento em aberto (protocolo ${dup.numero_protocolo ?? dup.id}, status ${dup.status_atendimento}) para essa unidade, morador e tipo de serviço. Use permitir_duplicado=true para forçar.`,
          );
        }
      }

      const { data: emp } = await client
        .from("empreendimentos_terceirizados")
        .select("id, nome")
        .eq("uf", uf)
        .ilike("nome", `%${i.condominio_nome}%`)
        .limit(2);
      const empreendimento_id = emp && emp.length === 1 ? emp[0].id : null;

      const { data, error } = await client
        .from("servicos_nacional_gas")
        .insert({
          uf,
          empreendimento_id,
          condominio_nome_original: i.condominio_nome,
          bloco: i.bloco ?? null,
          apartamento: i.apartamento ?? null,
          morador_nome: i.morador_nome ?? null,
          telefone: i.telefone ?? null,
          email: i.email ?? null,
          cpf_cnpj: i.cpf_cnpj ?? null,
          fonte: i.fonte ?? "MCP",
          tipo_servico: i.tipo_servico,
          data_solicitacao: i.data_solicitacao ?? null,
          data_agendamento: i.data_agendamento ?? null,
          turno: i.turno ?? null,
          status_atendimento: i.status_atendimento ?? (i.data_agendamento ? "agendado" : "pendente"),
          valor_servico: i.valor_servico ?? null,
          forma_pagamento: i.forma_pagamento ?? null,
          observacao: i.observacao ?? null,
        })
        .select("id, numero_protocolo, condominio_nome_original, status_atendimento, data_agendamento")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "Serviço duplicado: já existe um atendimento em aberto igual a este. Use permitir_duplicado=true para forçar.",
          );
        }
        throw new Error(error.message);
      }

      return {
        criado: data,
        empreendimento_vinculado: empreendimento_id ? emp?.[0]?.nome : null,
        aviso: empreendimento_id
          ? undefined
          : "Nenhum empreendimento único encontrado com esse nome; o serviço ficou sem vínculo.",
      };
    },
  },
  {
    name: "atualizar_servico",
    title: "Atualizar serviço",
    description:
      "Atualiza campos de um serviço existente (identificado por ID ou protocolo): agendamento, turno, status, técnico, valor, forma de pagamento e observação.",
    inputSchema: obj({
      id: str("UUID do serviço"),
      numero_protocolo: str(),
      data_agendamento: str("YYYY-MM-DD"),
      turno: { type: "string", enum: ["manha", "tarde"] },
      status_atendimento: { type: "string", enum: STATUS },
      tecnico_id: str("ID do operador (ver listar_operadores)"),
      morador_nome: str(),
      telefone: str(),
      email: str(),
      cpf_cnpj: str(),
      valor_servico: num(),
      forma_pagamento: str(),
      observacao: str(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    handler: async (input) => {
      const { id, numero_protocolo, ...campos } = input;
      if (!id && !numero_protocolo) throw new Error("Informe id ou numero_protocolo.");
      const updates = Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined && v !== null));
      if (Object.keys(updates).length === 0) throw new Error("Nenhum campo para atualizar.");

      let q = db().from("servicos_nacional_gas").update(updates);
      q = id ? q.eq("id", String(id)) : q.eq("numero_protocolo", String(numero_protocolo));
      const { data, error } = await q.select(
        "id, numero_protocolo, condominio_nome_original, bloco, apartamento, status_atendimento, data_agendamento, turno, tecnico_id, valor_servico",
      );
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("Serviço não encontrado.");
      return { atualizados: data.length, servicos: data };
    },
  },
];

// ---------- autenticação por chave ----------
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function chaveValida(req: Request): boolean {
  const esperada = (Deno.env.get("MCP_API_KEY") ?? "").trim();
  if (!esperada) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const apiKey = (req.headers.get("x-api-key") ?? "").trim();
  return timingSafeEqual(bearer, esperada) || timingSafeEqual(apiKey, esperada);
}

// ---------- JSON-RPC ----------
const SERVER_INFO = { name: "ag-ngd", title: "ag-ngd (chave de API)", version: "0.1.0" };
const INSTRUCTIONS =
  "Ferramentas do sistema de medição e serviços da Nacional Gás (UFs CE e BA). Datas no formato YYYY-MM-DD.";

// deno-lint-ignore no-explicit-any
async function handleRpc(msg: any): Promise<unknown | null> {
  const { id, method, params } = msg ?? {};
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

  if (method === "initialize") {
    return reply({
      protocolVersion: params?.protocolVersion === "2024-11-05" ? "2024-11-05" : "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO,
      instructions: INSTRUCTIONS,
    });
  }
  if (method === "notifications/initialized" || method?.startsWith?.("notifications/")) return null;
  if (method === "ping") return reply({});
  if (method === "tools/list") {
    return reply({
      tools: tools.map((t) => ({
        name: t.name,
        title: t.title,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: t.annotations,
      })),
    });
  }
  if (method === "resources/list") return reply({ resources: [] });
  if (method === "prompts/list") return reply({ prompts: [] });
  if (method === "tools/call") {
    const tool = tools.find((t) => t.name === params?.name);
    if (!tool) return fail(-32602, `Ferramenta desconhecida: ${params?.name}`);
    try {
      const out = await tool.handler((params?.arguments ?? {}) as Record<string, unknown>);
      return reply({ content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
    } catch (e) {
      return reply({ content: [{ type: "text", text: (e as Error).message }], isError: true });
    }
  }
  return fail(-32601, `Método não suportado: ${method}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!chaveValida(req)) {
    return json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Chave de API inválida ou ausente." } },
      401,
    );
  }

  if (req.method === "GET") {
    return json({ status: "ok", server: SERVER_INFO, tools: tools.map((t) => t.name) });
  }

  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }, 400);
  }

  if (Array.isArray(body)) {
    const results = (await Promise.all(body.map((m) => handleRpc(m)))).filter((r) => r !== null);
    return results.length ? json(results) : new Response(null, { status: 202, headers: corsHeaders });
  }

  const result = await handleRpc(body);
  if (result === null) return new Response(null, { status: 202, headers: corsHeaders });
  return json(result);
});
