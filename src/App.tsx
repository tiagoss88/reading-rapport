import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Empreendimentos from '@/pages/Empreendimentos'
import Clientes from '@/pages/Clientes'
import Leituras from '@/pages/Leituras'
import Operadores from '@/pages/Operadores'
import OperadorApp from '@/pages/OperadorApp'
import ColetorLogin from '@/pages/ColetorLogin'
import ColetorMenu from '@/pages/ColetorMenu'
import ColetorSync from '@/pages/ColetorSync'
import ColetorUnidades from '@/pages/ColetorUnidades'
import ColetorLeitura from '@/pages/ColetorLeitura'
import EmpreendimentoLogin from '@/pages/EmpreendimentoLogin'
import AreaCliente from '@/pages/AreaCliente'
import ProtectedRoute from '@/components/ProtectedRoute'
import ColetorProtectedRoute from '@/components/ColetorProtectedRoute'
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/empreendimento/login" element={<EmpreendimentoLogin />} />
              <Route path="/area-cliente" element={<AreaCliente />} />
              <Route path="/operador" element={<OperadorApp />} />
              <Route path="/coletor/login" element={<ColetorLogin />} />
              <Route path="/coletor" element={
                <ColetorProtectedRoute>
                  <ColetorMenu />
                </ColetorProtectedRoute>
              } />
              <Route path="/coletor-sync" element={
                <ColetorProtectedRoute>
                  <ColetorSync />
                </ColetorProtectedRoute>
              } />
              <Route path="/coletor/unidades/:empreendimentoId" element={
                <ColetorProtectedRoute>
                  <ColetorUnidades />
                </ColetorProtectedRoute>
              } />
              <Route path="/coletor/leitura/:clienteId" element={
                <ColetorProtectedRoute>
                  <ColetorLeitura />
                </ColetorProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/empreendimentos" element={
                <ProtectedRoute>
                  <Empreendimentos />
                </ProtectedRoute>
              } />
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              } />
              <Route path="/leituras" element={
                <ProtectedRoute>
                  <Leituras />
                </ProtectedRoute>
              } />
              <Route path="/operadores" element={
                <ProtectedRoute>
                  <Operadores />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
