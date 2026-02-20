import { NavLink, useLocation } from 'react-router-dom'
import agasenLogo from '@/assets/agasen-logo.png'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedComponent from '@/components/ProtectedComponent'
import ProfileDialog from '@/components/ProfileDialog'
import { 
  Home, 
  Building2, 
  UserCheck,
  LogOut,
  Menu,
  Wrench,
  ChevronDown,
  Settings,
  MapPin,
  BarChart3,
  Shield,
  Handshake,
  Navigation2,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
  title: string
}

export default function Layout({ children, title }: LayoutProps) {
  const { signOut } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  
  const [medicaoTerceirizadaOpen, setMedicaoTerceirizadaOpen] = useState(() => pathname.startsWith('/medicao-terceirizada'))
  const [configuracoesOpen, setConfiguracoesOpen] = useState(() => ['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p)))

  useEffect(() => {
    if (pathname.startsWith('/medicao-terceirizada')) setMedicaoTerceirizadaOpen(true)
    if (['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p))) setConfiguracoesOpen(true)
  }, [pathname])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, permission: 'view_dashboard' },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3, permission: 'view_relatorios' },
    { name: 'Rastreamento', href: '/rastreamento', icon: MapPin, permission: 'view_rastreamento_operadores' },
  ]

  const medicaoTerceirizadaItems = [
    { name: 'Leituras', href: '/medicao-terceirizada/leituras', icon: BookOpen },
    { name: 'Serviços', href: '/medicao-terceirizada/servicos', icon: Wrench },
    { name: 'Empreendimentos', href: '/medicao-terceirizada/empreendimentos', icon: Building2 },
    { name: 'Planejamento de Rotas', href: '/medicao-terceirizada/rotas', icon: MapPin },
    { name: 'Georreferenciamento', href: '/medicao-terceirizada/georreferenciamento', icon: Navigation2 },
  ]

  const configuracoesItems = [
    { name: 'Sistema', href: '/configuracoes/sistema', icon: Settings, role: 'admin' },
    { name: 'Tipos de Serviço', href: '/configuracoes/tipos-servico', icon: Wrench, permission: 'manage_operadores' },
    { name: 'Operadores', href: '/operadores', icon: UserCheck, permission: 'manage_operadores' },
    { name: 'Permissões', href: '/permissions', icon: Shield, role: 'admin' }
  ]

  const navLinkClass = (isActive: boolean) =>
    `flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  const subNavLinkClass = (isActive: boolean) =>
    `flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 text-sm rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-16' : 'w-64'} bg-card border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-3 border-b">
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={agasenLogo}
                alt="Agasen Logo" 
                className="h-8 w-auto object-contain flex-shrink-0"
              />
              <h1 className="text-lg font-semibold whitespace-nowrap">Sistema de Leituras</h1>
            </div>
          )}
          {collapsed && (
            <img 
              src={agasenLogo}
              alt="Agasen Logo" 
              className="h-8 w-8 object-contain mx-auto"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex flex-shrink-0"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="mt-6 flex-1">
          <div className="space-y-1 px-3">
            {/* Dashboard */}
            {navigation.slice(0, 1).map((item) => (
              <ProtectedComponent key={item.name} permission={item.permission as any}>
                <NavLink
                  to={item.href}
                  title={item.name}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && item.name}
                </NavLink>
              </ProtectedComponent>
            ))}
            
            {/* Medição Terceirizada Dropdown */}
            <ProtectedComponent roles={["admin", "gestor_empreendimento"]}>
              <div className="space-y-1">
                {collapsed ? (
                  <NavLink
                    to="/medicao-terceirizada/empreendimentos"
                    title="Medição"
                    className={({ isActive }) => navLinkClass(isActive || pathname.startsWith('/medicao-terceirizada'))}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Handshake className="h-5 w-5 flex-shrink-0" />
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => setMedicaoTerceirizadaOpen(!medicaoTerceirizadaOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <div className="flex items-center">
                        <Handshake className="mr-3 h-5 w-5 flex-shrink-0" />
                        Medição
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${medicaoTerceirizadaOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {medicaoTerceirizadaOpen && (
                      <div className="ml-8 space-y-1">
                        {medicaoTerceirizadaItems.map((item) => (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            title={item.name}
                            className={({ isActive }) => subNavLinkClass(isActive)}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            {item.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ProtectedComponent>
            
            {/* Relatórios, Rastreamento */}
            {navigation.slice(1).map((item) => (
              <ProtectedComponent key={item.name} permission={item.permission as any}>
                <NavLink
                  to={item.href}
                  title={item.name}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && item.name}
                </NavLink>
              </ProtectedComponent>
            ))}
            
            {/* Configurações Dropdown */}
            <ProtectedComponent permissions={["manage_operadores"]} roles={["admin"]}>
              <div className="space-y-1">
                {collapsed ? (
                  <NavLink
                    to="/configuracoes/sistema"
                    title="Configurações"
                    className={({ isActive }) => navLinkClass(isActive || ['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p)))}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => setConfiguracoesOpen(!configuracoesOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <div className="flex items-center">
                        <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                        Configurações
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${configuracoesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {configuracoesOpen && (
                      <div className="ml-8 space-y-1">
                        {configuracoesItems.map((item) => (
                          <ProtectedComponent 
                            key={item.name} 
                            permission={item.permission as any}
                            role={item.role as any}
                          >
                            <NavLink
                              to={item.href}
                              title={item.name}
                              className={({ isActive }) => subNavLinkClass(isActive)}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                              {item.name}
                            </NavLink>
                          </ProtectedComponent>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ProtectedComponent>
          </div>
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full"
            title="Sair"
          >
            <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && 'Sair'}
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        <header className="bg-card border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-3"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <div className="flex items-center">
            <ProfileDialog />
          </div>
        </header>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
