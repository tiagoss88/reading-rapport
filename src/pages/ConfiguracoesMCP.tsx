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
const MCP_URL = `https://${projectRef}.supabase.co${manifest.path}`

export default function ConfiguracoesMCP() {
  const [copiado, setCopiado] = useState(false)
  const [testando, setTestando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL)
      setCopiado(true)
      toast.success('Endereço copiado')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  const testarConexao = async () => {
    setTestando(true)
    setResultado(null)
    try {
      const resp = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      })
      if (resp.status === 401) {
        const wwwAuth = resp.headers.get('www-authenticate')
        setResultado({
          ok: true,
          msg: wwwAuth
            ? 'Servidor no ar e exigindo autenticação OAuth (resposta 401 com metadados corretos).'
            : 'Servidor no ar e exigindo autenticação (401).',
        })
      } else if (resp.ok) {
        setResultado({ ok: true, msg: 'Servidor no ar e respondendo às chamadas MCP.' })
      } else {
        setResultado({ ok: false, msg: `Resposta inesperada do servidor (HTTP ${resp.status}).` })
      }
    } catch (e) {
      setResultado({ ok: false, msg: `Falha ao contatar o servidor: ${(e as Error).message}` })
    } finally {
      setTestando(false)
    }
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
              {resultado && (
                <span className={`text-xs ${resultado.ok ? 'text-green-600' : 'text-destructive'}`}>
                  {resultado.msg}
                </span>
              )}
            </div>
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
