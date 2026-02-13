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
  | 'create_servicos_externos'
  | 'manage_agendamentos'
  | 'coletor_leituras'
  | 'coletor_servicos'
  | 'view_agendamentos'
  | 'view_rastreamento_operadores'
  | 'view_relatorios'

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
  refreshing: boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<AppPermission[]>([])
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUserPermissions = async () => {
    if (!user) {
      setPermissions([])
      setRoles([])
      setInitialLoadComplete(true)
      setLoading(false)
      return
    }

    // Only block UI on initial load, subsequent refreshes happen in background
    if (!initialLoadComplete) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    
    try {
      // Set timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )

      // Fetch user roles with timeout
      const rolesPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const { data: userRoles, error: rolesError } = await Promise.race([
        rolesPromise,
        timeoutPromise
      ]) as any

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        // Fallback: assign default role if no roles found
        setRoles([])
        setPermissions([])
        setLoading(false)
        return
      }

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
      // Fallback permissions for authenticated users
      setPermissions(['view_dashboard'])
      setRoles([])
    } finally {
      if (!initialLoadComplete) {
        setInitialLoadComplete(true)
        setLoading(false)
      }
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Reset loading state when user changes to prevent race condition
    setInitialLoadComplete(false)
    setLoading(true)
    fetchUserPermissions()
  }, [user?.id])

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
    refreshing,
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