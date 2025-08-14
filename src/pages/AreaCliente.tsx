import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileText, LogOut } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface EmpreendimentoData {
  id: string
  nome: string
  endereco: string
  email: string
  cnpj: string
  tipo_gas: string
  preco_kg_gas?: number
  preco_m3_gas?: number
}

export default function AreaCliente() {
  const [empreendimento, setEmpreendimento] = useState<EmpreendimentoData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchEmpreendimentoData()
    }
  }, [user])

  const fetchEmpreendimentoData = async () => {
    try {
      // First, get the empreendimento_id from empreendimento_users table
      const { data: linkData, error: linkError } = await supabase
        .from('empreendimento_users')
        .select('empreendimento_id')
        .eq('user_id', user?.id)
        .single()

      if (linkError) {
        throw new Error('Usuário não vinculado a nenhum empreendimento')
      }

      // Then get the empreendimento data
      const { data: empData, error: empError } = await supabase
        .from('empreendimentos')
        .select('*')
        .eq('id', linkData.empreendimento_id)
        .single()

      if (empError) throw empError

      setEmpreendimento(empData)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/empreendimento/login" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!empreendimento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Empreendimento não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                Não foi possível localizar os dados do seu empreendimento.
              </p>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{empreendimento.nome}</h1>
              <p className="text-sm text-muted-foreground">Área do Cliente</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Informações do Empreendimento */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Informações do Empreendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <p className="text-lg">{empreendimento.nome}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Endereço</Label>
                <p>{empreendimento.endereco}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p>{empreendimento.email}</p>
              </div>
              {empreendimento.tipo_gas && (
                <div>
                  <Label className="text-sm font-medium">Tipo de Gás</Label>
                  <p>{empreendimento.tipo_gas}</p>
                </div>
              )}
              {empreendimento.preco_kg_gas && (
                <div>
                  <Label className="text-sm font-medium">Preço do Gás por Kg</Label>
                  <p>R$ {empreendimento.preco_kg_gas.toFixed(2)}</p>
                </div>
              )}
              {empreendimento.preco_m3_gas && (
                <div>
                  <Label className="text-sm font-medium">Preço do Gás por m³</Label>
                  <p>R$ {empreendimento.preco_m3_gas.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu de Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Unidades
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção em construção */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Área em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                Esta é a área exclusiva do seu empreendimento. Novas funcionalidades serão adicionadas em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
      {children}
    </label>
  )
}