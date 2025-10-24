import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '@/contexts/PermissionsContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export default function Index() {
  const navigate = useNavigate()
  const { hasPermission, loading } = usePermissions()
  const { user } = useAuth()

  useEffect(() => {
    const redirectUser = async () => {
      if (!user || loading) return

      // Verificar se é operador
      const { data: operadorData } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (operadorData) {
        navigate('/coletor', { replace: true })
        return
      }

      // Se tem permissão para dashboard, vai para lá
      if (hasPermission('view_dashboard')) {
        navigate('/dashboard', { replace: true })
        return
      }

      // Se tem permissão para leituras, vai para leituras
      if (hasPermission('view_leituras')) {
        navigate('/leituras', { replace: true })
        return
      }

      // Se tem permissão para agendamentos, vai para agendamentos
      if (hasPermission('view_agendamentos')) {
        navigate('/servicos/agendamentos', { replace: true })
        return
      }

      // Se não tem nenhuma permissão, vai para não autorizado
      navigate('/not-authorized', { replace: true })
    }

    redirectUser()
  }, [user, loading, hasPermission, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
