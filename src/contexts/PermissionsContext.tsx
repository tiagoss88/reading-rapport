import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export type AppPermission =
  | 'view_dashboard'
  | 'manage_empreendimentos'
  | 'manage_clientes'
  | 'view_leituras'
  | 'create_leituras'
  | 'manage_operadores'
  | 'create_servicos'
  | 'manage_agendamentos'
  | 'coletor_leituras'
  | 'coletor_servicos'
  | 'view_agendamentos'

export type AppRole =
  | 'admin'
  | 'gestor_empreendimento'
  | 'operador_completo'
  | 'operador_leitura'
  | 'operador_servicos'

interface PermissionsContextType {
  permissions: AppPermission[]
  roles: AppRole[]
  hasPermission: (permission: AppPermission) => boolean
  hasRole: (role: AppRole) => boolean
  isAdmin: boolean
  loading: boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<AppPermission[]>([])
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUserPermissions = async () => {
    if (!user) {
      setPermissions([])
      setRoles([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    try {
      // Fetch user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const userRolesList = userRoles?.map(r => r.role as AppRole) || []
      setRoles(userRolesList)

      // If user is admin, they have all permissions
      if (userRolesList.includes('admin')) {
        const { data: allPermissions } = await supabase
          .from('permissions')
          .select('name')
        
        const allPerms = allPermissions?.map(p => p.name as AppPermission) || []
        setPermissions(allPerms)
      } else {
        // Fetch specific permissions for non-admin users
        const { data: userPermissions } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', user.id)

        const userPerms = userPermissions?.map(p => p.permission as AppPermission) || []
        setPermissions(userPerms)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setPermissions([])
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserPermissions()
  }, [user])

  const hasPermission = (permission: AppPermission): boolean => {
    return permissions.includes(permission)
  }

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role)
  }

  const isAdmin = roles.includes('admin')

  const refreshPermissions = async () => {
    await fetchUserPermissions()
  }

  const value = {
    permissions,
    roles,
    hasPermission,
    hasRole,
    isAdmin,
    loading,
    refreshPermissions,
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}