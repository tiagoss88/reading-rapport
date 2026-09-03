import { useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { AlertTriangle, Check, Copy, Loader2, Plug, ShieldCheck, Wifi } from 'lucide-react'
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

// O manifesto é gerado junto com a function publicada: o emissor OAuth aponta
// para o projeto onde a function MCP realmente está no ar. Usar a env do runtime
// pode apontar para outro projeto e resultar em 404 ("function not found").
const issuerFromManifest = manifest.auth?.issuer ?? ''
const baseFromManifest = issuerFromManifest.replace(/\/auth\/v1\/?$/, '')
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? ''
const BASE = baseFromManifest || `https://${projectRef}.supabase.co`
const MCP_URL = `${BASE}${manifest.path}`
const RESOURCE_METADATA_URL = `${MCP_URL}/.well-known/oauth-protected-resource`
const ISSUER = issuerFromManifest || `${BASE}/auth/v1`
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

  const tools = manifest.mcp?.tools ?? []
  const leitura = tools.filter((t) => t.annotations?.readOnlyHint)
  const escrita = tools.filter((t) => !t.annotations?.readOnlyHint)

  return (
    <Layout title="Integração MCP (API)">
      <div className="space-y-4 max-w-4xl">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plug className="h-4 w-4" />
              Servidor MCP — {manifest.mcp?.server?.title || manifest.mcp?.server?.name}
            </CardTitle>
            <CardDescription>
              Endereço para conectar agentes de IA (OpenClaw, Claude, ChatGPT, Cursor) a este sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs break-all">{MCP_URL}</code>
              <Button variant="outline" size="sm" onClick={copiar}>
                {copiado ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use exatamente este endereço. O domínio do site (ngd.agasen.com.br) <strong>não</strong> é o servidor MCP
              e retorna 404 / página do sistema para o agente.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">versão {manifest.mcp?.server?.version}</Badge>
              <Badge variant="secondary">{tools.length} ferramentas</Badge>
              <Badge variant="secondary">transporte: HTTP (streamable)</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={testarConexao} disabled={testando}>
                {testando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wifi className="h-4 w-4 mr-1" />}
                Testar conexão
              </Button>
            </div>
            {checks && (
              <div className="space-y-1.5">
                {checks.map((c) => (
                  <div key={c.nome} className="rounded-md border p-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      {c.ok ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{c.nome}</span>
                      <span className={`text-xs ${c.ok ? 'text-green-600' : 'text-destructive'}`}>{c.detalhe}</span>
                    </div>
                    <code className="text-[10px] text-muted-foreground break-all">{c.url}</code>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Como conectar</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
              <li>No agente (OpenClaw, Claude, ChatGPT), adicione um servidor MCP e cole o endereço acima.</li>
              <li>O agente abrirá a tela de login deste sistema — entre com seu e-mail e senha.</li>
              <li>Aprove a tela de consentimento ("Conectar ... à sua conta").</li>
              <li>Pronto: o agente passa a enxergar as ferramentas listadas abaixo.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Configuração manual (se o agente retornar 404)</CardTitle>
            <CardDescription>
              Alguns agentes antigos procuram os metadados OAuth na raiz do domínio e recebem 404. Nesse caso,
              informe os endereços abaixo manualmente no OpenClaw.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-sm">
            <ul className="space-y-1.5 text-xs">
              {[
                ['Servidor MCP', MCP_URL],
                ['Metadados do recurso', RESOURCE_METADATA_URL],
                ['Metadados de autorização', AS_METADATA_URL],
                ['Autorização', AUTHORIZE_URL],
                ['Token', TOKEN_URL],
                ['Registro dinâmico de cliente', REGISTER_URL],
              ].map(([nome, url]) => (
                <li key={nome} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="w-56 shrink-0 text-muted-foreground">{nome}</span>
                  <code className="break-all">{url}</code>
                </li>
              ))}
            </ul>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Bloco de configuração pronto</span>
                <Button variant="outline" size="sm" onClick={() => copiarTexto(CONFIG_MANUAL, 'Configuração copiada')}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <pre className="rounded-md bg-muted p-3 text-[11px] overflow-x-auto">{CONFIG_MANUAL}</pre>
            </div>
          </CardContent>
        </Card>

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
