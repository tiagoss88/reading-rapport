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
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  HardHat
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
  const isCompact = collapsed

  const handleNavClick = () => {
    setSidebarOpen(false)
  }


  
  const operacaoPaths = ['/medicao-terceirizada/servicos', '/medicao-terceirizada/georreferenciamento']
  const isOperacaoPath = operacaoPaths.some(p => pathname.startsWith(p))
  const isMedicaoPath = pathname.startsWith('/medicao-terceirizada') && !isOperacaoPath

  const [medicaoTerceirizadaOpen, setMedicaoTerceirizadaOpen] = useState(() => isMedicaoPath)
  const [operacaoOpen, setOperacaoOpen] = useState(() => isOperacaoPath)
  const [relatoriosOpen, setRelatoriosOpen] = useState(() => pathname.startsWith('/relatorios'))
  const [configuracoesOpen, setConfiguracoesOpen] = useState(() => ['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p)))

  useEffect(() => {
    if (isMedicaoPath) setMedicaoTerceirizadaOpen(true)
    if (isOperacaoPath) setOperacaoOpen(true)
    if (pathname.startsWith('/relatorios')) setRelatoriosOpen(true)
    if (['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p))) setConfiguracoesOpen(true)
  }, [pathname, isMedicaoPath, isOperacaoPath])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, permission: 'view_dashboard' },
    { name: 'Rastreamento', href: '/rastreamento', icon: MapPin, permission: 'view_rastreamento_operadores' },
  ]

  const relatoriosItems = [
    { name: 'Leituras', href: '/relatorios/leituras', icon: BookOpen },
    { name: 'Serviços', href: '/relatorios/servicos', icon: Wrench },
  ]

  const medicaoTerceirizadaItems = [
    { name: 'Leituras', href: '/medicao-terceirizada/leituras', icon: BookOpen },
    { name: 'Empreendimentos', href: '/medicao-terceirizada/empreendimentos', icon: Building2 },
    { name: 'Planejamento', href: '/medicao-terceirizada/rotas', icon: MapPin },
    { name: 'Notificações', href: '/medicao-terceirizada/notificacoes', icon: Bell },
  ]

  const operacaoItems = [
    { name: 'Serviços', href: '/medicao-terceirizada/servicos', icon: Wrench },
    { name: 'Georreferenciamento', href: '/medicao-terceirizada/georreferenciamento', icon: Navigation2 },
  ]

  const configuracoesItems = [
    { name: 'Sistema', href: '/configuracoes/sistema', icon: Settings, role: 'admin' },
    { name: 'Tipos de Serviço', href: '/configuracoes/tipos-servico', icon: Wrench, permission: 'manage_operadores' },
    { name: 'Operadores', href: '/operadores', icon: UserCheck, permission: 'manage_operadores' },
    { name: 'Permissões', href: '/permissions', icon: Shield, role: 'admin' }
  ]

  const navLinkClass = (isActive: boolean) =>
    `flex items-center ${isCompact ? 'justify-center' : ''} px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  const subNavLinkClass = (isActive: boolean) =>
    `flex items-center ${isCompact ? 'justify-center' : ''} px-3 py-2 text-sm rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${isCompact ? 'w-16' : 'w-64'} bg-card border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-3 border-b">
          {!isCompact && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={agasenLogo}
                alt="Agasen Logo" 
                className="h-8 w-auto object-contain flex-shrink-0"
              />
              <h1 className="text-lg font-semibold whitespace-nowrap">Sistema de Leituras</h1>
            </div>
          )}
          {isCompact && (
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
            onClick={handleNavClick}
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
                  onClick={handleNavClick}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isCompact ? '' : 'mr-3'}`} />
                  {!isCompact && item.name}
                </NavLink>
              </ProtectedComponent>
            ))}
            
            {/* Medição Terceirizada Dropdown */}
            <ProtectedComponent roles={["admin", "gestor_empreendimento"]}>
              <div className="space-y-1">
                {isCompact ? (
                  <NavLink
                    to="/medicao-terceirizada/leituras"
                    title="Medição"
                    className={({ isActive }) => navLinkClass(isActive || isMedicaoPath)}
                    onClick={handleNavClick}
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
                            onClick={handleNavClick}
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

            {/* Operação Dropdown */}
            <ProtectedComponent roles={["admin", "gestor_empreendimento"]}
            >
              <div className="space-y-1">
                {isCompact ? (
                  <NavLink
                    to="/medicao-terceirizada/servicos"
                    title="Operação"
                    className={({ isActive }) => navLinkClass(isActive || isOperacaoPath)}
                    onClick={handleNavClick}
                  >
                    <HardHat className="h-5 w-5 flex-shrink-0" />
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => setOperacaoOpen(!operacaoOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <div className="flex items-center">
                        <HardHat className="mr-3 h-5 w-5 flex-shrink-0" />
                        Operação
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${operacaoOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {operacaoOpen && (
                      <div className="ml-8 space-y-1">
                        {operacaoItems.map((item) => (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            title={item.name}
                            className={({ isActive }) => subNavLinkClass(isActive)}
                            onClick={handleNavClick}
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
            
            {/* Relatórios Dropdown */}
            <ProtectedComponent permission="view_relatorios">
              <div className="space-y-1">
                {isCompact ? (
                  <NavLink
                    to="/relatorios/leituras"
                    title="Relatórios"
                    className={({ isActive }) => navLinkClass(isActive || pathname.startsWith('/relatorios'))}
                    onClick={handleNavClick}
                  >
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => setRelatoriosOpen(!relatoriosOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <div className="flex items-center">
                        <BarChart3 className="mr-3 h-5 w-5 flex-shrink-0" />
                        Relatórios
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${relatoriosOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {relatoriosOpen && (
                      <div className="ml-8 space-y-1">
                        {relatoriosItems.map((item) => (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            title={item.name}
                            className={({ isActive }) => subNavLinkClass(isActive)}
                            onClick={handleNavClick}
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

            {/* Rastreamento */}
            {navigation.slice(1).map((item) => (
              <ProtectedComponent key={item.name} permission={item.permission as any}>
                <NavLink
                  to={item.href}
                  title={item.name}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={handleNavClick}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isCompact ? '' : 'mr-3'}`} />
                  {!isCompact && item.name}
                </NavLink>
              </ProtectedComponent>
            ))}
            
            {/* Configurações Dropdown */}
            <ProtectedComponent permissions={["manage_operadores"]} roles={["admin"]}>
              <div className="space-y-1">
                {isCompact ? (
                  <NavLink
                    to="/configuracoes/sistema"
                    title="Configurações"
                    className={({ isActive }) => navLinkClass(isActive || ['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p)))}
                    onClick={handleNavClick}
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
                              onClick={handleNavClick}
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
            <LogOut className={`h-4 w-4 ${isCompact ? '' : 'mr-2'}`} />
            {!isCompact && 'Sair'}
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={handleNavClick}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        <header className="bg-card border-b h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 gap-3">
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2 flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold truncate">{title}</h2>
          </div>
          <div className="flex items-center flex-shrink-0">
            <ProfileDialog />
          </div>
        </header>
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  )
}
