import { useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Check, Copy, Loader2, Plug, ShieldCheck, Wifi } from 'lucide-react'
import mcpManifest from '../../.lovable/mcp/manifest.json'

type ManifestTool = {
  name: string
  title?: string
  description?: string
  annotations?: {
    readOnlyHint?: boolean
    destructiveHint?: boolean
  }
}

const manifest = mcpManifest as unknown as {
  path: string
  auth?: { type?: string; issuer?: string }
  mcp: { server: { name: string; title?: string; version?: string }; tools: ManifestTool[] }
}

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? ''
const BASE = `https://${projectRef}.supabase.co`
const MCP_URL = `${BASE}${manifest.path}`
const RESOURCE_METADATA_URL = `${MCP_URL}/.well-known/oauth-protected-resource`
const ISSUER = manifest.auth?.issuer || `${BASE}/auth/v1`
const AS_METADATA_URL = `${BASE}/.well-known/oauth-authorization-server/auth/v1`
const AUTHORIZE_URL = `${ISSUER}/oauth/authorize`
const TOKEN_URL = `${ISSUER}/oauth/token`
const REGISTER_URL = `${ISSUER}/oauth/clients/register`

const CONFIG_MANUAL = JSON.stringify(
  {
    mcpServers: {
      'ag-ngd': {
        type: 'http',
        url: MCP_URL,
        oauth: {
          issuer: ISSUER,
          authorization_endpoint: AUTHORIZE_URL,
          token_endpoint: TOKEN_URL,
          registration_endpoint: REGISTER_URL,
          scopes: [],
        },
      },
    },
  },
  null,
  2,
)

type Check = { nome: string; url: string; ok: boolean; detalhe: string }

export default function ConfiguracoesMCP() {
  const [copiado, setCopiado] = useState(false)
  const [testando, setTestando] = useState(false)
  const [checks, setChecks] = useState<Check[] | null>(null)

  const copiarTexto = async (texto: string, msg = 'Copiado') => {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success(msg)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  const copiar = async () => {
    await copiarTexto(MCP_URL, 'Endereço copiado')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const testarConexao = async () => {
    setTestando(true)
    setChecks(null)
    const resultados: Check[] = []

    // 1) Endpoint MCP
    try {
      const resp = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      })
      if (resp.status === 401) {
        const wwwAuth = resp.headers.get('www-authenticate')
        resultados.push({
          nome: 'Endpoint MCP',
          url: MCP_URL,
          ok: true,
          detalhe: wwwAuth
            ? 'No ar, exigindo login OAuth (401 com metadados corretos).'
            : 'No ar, exigindo login (401).',
        })
      } else if (resp.ok) {
        resultados.push({ nome: 'Endpoint MCP', url: MCP_URL, ok: true, detalhe: 'No ar e respondendo.' })
      } else if (resp.status === 404) {
        resultados.push({
          nome: 'Endpoint MCP',
          url: MCP_URL,
          ok: false,
          detalhe: '404 — o servidor MCP não está publicado neste endereço.',
        })
      } else {
        resultados.push({ nome: 'Endpoint MCP', url: MCP_URL, ok: false, detalhe: `HTTP ${resp.status}.` })
      }
    } catch (e) {
      resultados.push({ nome: 'Endpoint MCP', url: MCP_URL, ok: false, detalhe: `Falha de rede: ${(e as Error).message}` })
    }

    // 2) Metadados do recurso protegido
    for (const [nome, url] of [
      ['Metadados do recurso', RESOURCE_METADATA_URL],
      ['Metadados de autorização', AS_METADATA_URL],
    ] as const) {
      try {
        const resp = await fetch(url)
        resultados.push({
          nome,
          url,
          ok: resp.ok,
          detalhe: resp.ok ? 'Disponível (200).' : `Indisponível (HTTP ${resp.status}).`,
        })
      } catch (e) {
        resultados.push({ nome, url, ok: false, detalhe: `Falha de rede: ${(e as Error).message}` })
      }
    }

    setChecks(resultados)
    setTestando(false)
  }


        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Autenticação e segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2 text-sm text-muted-foreground">
            <p>
              Autenticação <strong>OAuth 2.1</strong> com o próprio login do sistema — não existe chave fixa nem token
              colado.
            </p>
            <p>
              O agente age <strong>com as permissões do usuário que autorizou</strong> a conexão. Um operador só
              enxerga o que já enxergaria na interface.
            </p>
            <p className="text-xs">Emissor: <code className="break-all">{manifest.auth?.issuer}</code></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Ferramentas disponíveis</CardTitle>
            <CardDescription>Ações que o agente pode executar através do servidor.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Consulta</h3>
              <div className="space-y-2">
                {leitura.map((t) => (
                  <ToolRow key={t.name} tool={t} />
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2">Escrita (gravam dados)</h3>
              <div className="space-y-2">
                {escrita.map((t) => (
                  <ToolRow key={t.name} tool={t} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

function ToolRow({ tool }: { tool: ManifestTool }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{tool.title || tool.name}</span>
        <code className="text-xs text-muted-foreground">{tool.name}</code>
        {tool.annotations?.readOnlyHint && <Badge variant="secondary" className="text-[10px]">somente leitura</Badge>}
        {tool.annotations?.destructiveHint && <Badge variant="destructive" className="text-[10px]">altera dados</Badge>}
      </div>
      {tool.description && <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>}
    </div>
  )
}
