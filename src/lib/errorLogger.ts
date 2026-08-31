import { supabase } from '@/integrations/supabase/client'

export type Severidade = 'error' | 'warning'

interface LogContexto {
  [key: string]: unknown
}

const recentes = new Map<string, number>()
const JANELA_DEDUP_MS = 15000
let instalado = false

function deveIgnorar(mensagem: string) {
  if (!mensagem) return true
  const ignorar = [
    'ResizeObserver loop',
    'Failed to fetch dynamically imported module',
    'Load failed',
  ]
  return ignorar.some((p) => mensagem.includes(p))
}

function extrair(erro: unknown): { mensagem: string; detalhes?: string } {
  if (erro instanceof Error) {
    return { mensagem: erro.message || erro.name, detalhes: erro.stack ?? undefined }
  }
  if (typeof erro === 'string') return { mensagem: erro }
  try {
    return { mensagem: JSON.stringify(erro).slice(0, 500) }
  } catch {
    return { mensagem: String(erro) }
  }
}

export async function logError(
  erro: unknown,
  contexto: LogContexto = {},
  severidade: Severidade = 'error'
) {
  try {
    const { mensagem, detalhes } = extrair(erro)
    if (deveIgnorar(mensagem)) return

    const chave = `${severidade}:${mensagem}:${window.location.pathname}`
    const agora = Date.now()
    const ultimo = recentes.get(chave)
    if (ultimo && agora - ultimo < JANELA_DEDUP_MS) return
    recentes.set(chave, agora)
    if (recentes.size > 200) recentes.clear()

    let userId: string | null = null
    let userEmail: string | null = null
    try {
      const { data } = await supabase.auth.getSession()
      userId = data.session?.user?.id ?? null
      userEmail = data.session?.user?.email ?? null
    } catch {
      // sessão indisponível — segue sem identificação
    }

    await supabase.from('logs_erro').insert({
      user_id: userId,
      user_email: userEmail,
      rota: window.location.pathname + window.location.search,
      severidade,
      mensagem: mensagem.slice(0, 2000),
      detalhes: detalhes ? detalhes.slice(0, 8000) : null,
      user_agent: navigator.userAgent,
      contexto: contexto as never,
    })
  } catch {
    // nunca propagar erro do próprio logger
  }
}

export function instalarCapturaGlobalDeErros() {
  if (instalado) return
  instalado = true

  window.addEventListener('error', (event) => {
    const erro = event.error ?? event.message
    void logError(erro, {
      origem: 'window.onerror',
      arquivo: event.filename,
      linha: event.lineno,
      coluna: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    void logError(event.reason, { origem: 'unhandledrejection' })
  })
}
