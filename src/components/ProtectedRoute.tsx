import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/contexts/PermissionsContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const OPERATOR_ROLES = ['operador_completo', 'operador_leitura', 'operador_servicos'] as const

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { roles, loading: permissionsLoading } = usePermissions()

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user only has operator roles (no admin/gestor), redirect to coletor
  const isOperatorOnly = roles.length > 0 && roles.every(r => 
    (OPERATOR_ROLES as readonly string[]).includes(r)
  )

  if (isOperatorOnly) {
    return <Navigate to="/coletor" replace />
  }

  return <>{children}</>
}
