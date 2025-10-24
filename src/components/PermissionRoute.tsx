import { Navigate } from 'react-router-dom'
import { usePermissions, AppPermission, AppRole } from '@/contexts/PermissionsContext'

interface PermissionRouteProps {
  children: React.ReactNode
  permission?: AppPermission
  role?: AppRole
  permissions?: AppPermission[]
  roles?: AppRole[]
  requireAll?: boolean
  redirectTo?: string
}

export default function PermissionRoute({
  children,
  permission,
  role,
  permissions = [],
  roles = [],
  requireAll = false,
  redirectTo = '/not-authorized'
}: PermissionRouteProps) {
  const { hasPermission, hasRole, loading, permissions: userPermissions, roles: userRoles } = usePermissions()

  // Always wait for permissions to load before checking access
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Build arrays of all permissions and roles to check
  const permissionsToCheck = [
    ...(permission ? [permission] : []),
    ...permissions
  ]
  
  const rolesToCheck = [
    ...(role ? [role] : []),
    ...roles
  ]

  // Check permissions
  let hasRequiredPermissions = true
  if (permissionsToCheck.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = permissionsToCheck.every(hasPermission)
    } else {
      hasRequiredPermissions = permissionsToCheck.some(hasPermission)
    }
  }

  // Check roles
  let hasRequiredRoles = true
  if (rolesToCheck.length > 0) {
    if (requireAll) {
      hasRequiredRoles = rolesToCheck.every(hasRole)
    } else {
      hasRequiredRoles = rolesToCheck.some(hasRole)
    }
  }

  // Allow access if user has required permissions AND roles
  const hasAccess = hasRequiredPermissions && hasRequiredRoles

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}