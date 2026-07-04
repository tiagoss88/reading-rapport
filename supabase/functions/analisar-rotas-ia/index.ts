// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RotaResumo {
  rota: number;
  uf: string;
  centroide: { lat: number; lng: number };
  total_medidores: number;
  qtd_pontos: number;
  bairros?: string[];
  distancia_media_km?: number;
}

interface Payload {
  rotas: RotaResumo[];
  meta: { tecnicos?: number; meta_medidores?: number };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Payload;
    if (!body?.rotas || !Array.isArray(body.rotas) || body.rotas.length === 0) {
      return new Response(JSON.stringify({ error: "Payload inválido: rotas ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limita para evitar prompts gigantes
    const rotas = body.rotas.slice(0, 40);

    const systemPrompt = `Você é um especialista em roteirização de equipes de leitura de medidores de gás no Brasil.
Analise as rotas fornecidas (já geradas por algoritmo geográfico) e devolva sugestões práticas.
Considere: proximidade geográfica, equilíbrio de carga (medidores), coerência de bairros/regiões.
Faixa ideal de medidores por rota: 700–850 por leiturista.
Responda SEMPRE em português do Brasil.
Devolva APENAS um JSON válido, sem texto extra, sem markdown, sem crases.
Formato:
{
  "resumo_geral": "1 parágrafo curto",
  "rotas": [ { "rota": 1, "nome_sugerido": "...", "observacao": "..." } ],
  "alertas": [ { "severidade": "info|aviso|critico", "mensagem": "..." } ]
}`;

    const userPrompt = `Contexto:
- Técnicos disponíveis: ${body.meta?.tecnicos ?? "não informado"}
- Meta de medidores por rota: ${body.meta?.meta_medidores ?? "não informado"}

Rotas geradas:
${JSON.stringify(rotas, null, 2)}

Gere nomes curtos (ex: "Aldeota + Meireles"), observações objetivas por rota, e alertas relevantes.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      let errMsg = "Erro ao chamar IA";
      if (resp.status === 429) errMsg = "IA sobrecarregada. Tente novamente em instantes.";
      else if (resp.status === 402) errMsg = "Créditos de IA esgotados. Adicione créditos no workspace.";
      return new Response(JSON.stringify({ error: errMsg, detail: errText }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { resumo_geral: content, rotas: [], alertas: [] };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
