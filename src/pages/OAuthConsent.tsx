import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>
}

function oauthApi(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth
}

export default function OAuthConsent() {
  const [params] = useSearchParams()
  const authorizationId = params.get('authorization_id') ?? ''
  const [details, setDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!authorizationId) {
        setError('Requisição inválida: authorization_id ausente.')
        return
      }
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        const next = window.location.pathname + window.location.search
        window.location.href = '/login?next=' + encodeURIComponent(next)
        return
      }
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId)
      if (!active) return
      if (error) {
        setError(error.message)
        return
      }
      const immediate = data?.redirect_url ?? data?.redirect_to
      if (immediate && !data?.client) {
        window.location.href = immediate
        return
      }
      setDetails(data)
    })()
    return () => {
      active = false
    }
  }, [authorizationId])

  async function decide(approve: boolean) {
    setBusy(true)
    const api = oauthApi()
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId)
    if (error) {
      setBusy(false)
      setError(error.message)
      return
    }
    const target = data?.redirect_url ?? data?.redirect_to
    if (!target) {
      setBusy(false)
      setError('O servidor de autorização não retornou um redirecionamento.')
      return
    }
    window.location.href = target
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">
            {error
              ? 'Não foi possível continuar'
              : details
                ? `Conectar ${details.client?.name ?? 'aplicativo'} à sua conta`
                : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && details && (
            <>
              <p className="text-sm text-muted-foreground">
                {details.client?.name ?? 'O aplicativo'} poderá consultar e registrar informações no
                sistema usando as mesmas permissões da sua conta.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
                  Recusar
                </Button>
                <Button disabled={busy} onClick={() => decide(true)}>
                  Autorizar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
