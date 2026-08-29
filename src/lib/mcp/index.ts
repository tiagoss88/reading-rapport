import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listarServicos from "./tools/listar-servicos";
import buscarServico from "./tools/buscar-servico";
import listarEmpreendimentos from "./tools/listar-empreendimentos";
import listarOperadores from "./tools/listar-operadores";
import resumoOperacional from "./tools/resumo-operacional";
import criarServico from "./tools/criar-servico";
import atualizarServico from "./tools/atualizar-servico";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ag-ngd",
  title: "ag-ngd",
  version: "0.1.0",
  instructions:
    "Ferramentas do sistema de medição e serviços da Nacional Gás (UFs CE e BA). Use listar_servicos/buscar_servico para consultar atendimentos, listar_empreendimentos para condomínios, listar_operadores para técnicos, resumo_operacional para contagens, criar_servico para abrir um novo atendimento e atualizar_servico para agendar, atribuir técnico ou mudar status. Datas no formato YYYY-MM-DD.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listarServicos,
    buscarServico,
    listarEmpreendimentos,
    listarOperadores,
    resumoOperacional,
    criarServico,
    atualizarServico,
  ],
});
