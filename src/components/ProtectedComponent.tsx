import { usePermissions, AppPermission, AppRole } from '@/contexts/PermissionsContext'

interface ProtectedComponentProps {
  children: React.ReactNode
  permission?: AppPermission
  role?: AppRole
  fallback?: React.ReactNode
  requireAll?: boolean // If true, requires ALL permissions/roles, otherwise ANY
  permissions?: AppPermission[]
  roles?: AppRole[]
}

export default function ProtectedComponent({
  children,
  permission,
  role,
  permissions = [],
  roles = [],
  fallback = null,
  requireAll = false
}: ProtectedComponentProps) {
  const { hasPermission, hasRole, loading } = usePermissions()

  if (loading) {
    return null
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

  // Show content if user has required permissions AND roles
  const shouldShow = hasRequiredPermissions && hasRequiredRoles

  return shouldShow ? <>{children}</> : <>{fallback}</>
}