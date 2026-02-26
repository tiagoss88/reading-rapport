import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/contexts/PermissionsContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

const OPERATOR_ROLES = ['operador_completo', 'operador_leitura', 'operador_servicos'] as const

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, signIn, signUp, loading: authLoading } = useAuth()
  const { roles, loading: permissionsLoading } = usePermissions()
  const { toast } = useToast()
  const navigate = useNavigate()

  const isOperatorOnly = roles.length > 0 && roles.every(r =>
    (OPERATOR_ROLES as readonly string[]).includes(r)
  )

  // Check for email verification success
  useEffect(() => {
    const checkEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (type === 'signup' && accessToken) {
        console.log('Email verification successful, redirecting...')
        toast({
          title: "Email verificado!",
          description: "Redirecionando para o sistema...",
        })
        
        // Wait a moment for auth state to update, then redirect
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 1000)
      }
    }
    
    checkEmailVerification()
  }, [toast, navigate])

  // Show loading while auth is initializing
  if (authLoading || (user && permissionsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    console.log('User is logged in, redirecting...')
    return <Navigate to={isOperatorOnly ? '/coletor' : '/'} replace />
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    toast({
      title: "Login realizado com sucesso!",
    })
    
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signUp(email, password, nome)
    
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/892c54e7-3475-4c04-9684-1d8a666056d9.png" 
              alt="Agasen Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Leituras de Gás</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}