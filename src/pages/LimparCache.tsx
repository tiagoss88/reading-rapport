import { useEffect, useState } from 'react'
import { clearAppCache } from '@/lib/clearAppCache'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function LimparCache() {
  const [status, setStatus] = useState<'running' | 'done' | 'error'>('running')
  const [msg, setMsg] = useState('Limpando cache...')

  useEffect(() => {
    (async () => {
      try {
        await clearAppCache()
        setStatus('done')
        setMsg('Cache limpo. Recarregando...')
        setTimeout(() => { window.location.href = '/' }, 1200)
      } catch (e: any) {
        setStatus('error')
        setMsg(e?.message || 'Erro ao limpar cache')
      }
    })()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        {status === 'running' && <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />}
        {status === 'done' && <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />}
        {status === 'error' && <XCircle className="h-10 w-10 mx-auto text-destructive" />}
        <p className="text-sm text-muted-foreground">{msg}</p>
      </div>
    </div>
  )
}
