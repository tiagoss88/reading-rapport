import { Loader2, AlertTriangle } from 'lucide-react'
import Layout from '@/components/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEstoqueInstalacao } from '@/hooks/useEstoque'
import EstoqueNaoInstalado from '@/components/estoque/EstoqueNaoInstalado'
import MateriaisTab from '@/components/estoque/MateriaisTab'
import MovimentacoesTab from '@/components/estoque/MovimentacoesTab'
import ReceitasTab from '@/components/estoque/ReceitasTab'

function Conteudo() {
  const { estado, erro, recarregar } = useEstoqueInstalacao()

  if (estado === 'verificando') {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando o módulo de estoque...
      </div>
    )
  }
  if (estado === 'nao_instalado') return <EstoqueNaoInstalado onVerificar={() => void recarregar()} />
  if (estado === 'erro') {
    return (
      <Card>
        <CardContent className="p-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Não foi possível acessar o estoque.</p>
            <p className="text-xs text-muted-foreground">{erro?.message}</p>
            <Button size="sm" variant="outline" onClick={() => void recarregar()}>Tentar novamente</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="materiais" className="space-y-3">
      <TabsList>
        <TabsTrigger value="materiais">Materiais</TabsTrigger>
        <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        <TabsTrigger value="receitas">Baixa por serviço</TabsTrigger>
      </TabsList>
      <TabsContent value="materiais"><ErrorBoundary area="a aba Materiais"><MateriaisTab /></ErrorBoundary></TabsContent>
      <TabsContent value="movimentacoes"><ErrorBoundary area="a aba Movimentações"><MovimentacoesTab /></ErrorBoundary></TabsContent>
      <TabsContent value="receitas"><ErrorBoundary area="a aba Baixa por serviço"><ReceitasTab /></ErrorBoundary></TabsContent>
    </Tabs>
  )
}

export default function Estoque() {
  return (
    <Layout title="Estoque">
      <ErrorBoundary area="o Estoque">
        <Conteudo />
      </ErrorBoundary>
    </Layout>
  )
}
