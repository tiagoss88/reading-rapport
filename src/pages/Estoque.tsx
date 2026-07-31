import { useState } from 'react'
import Layout from '@/components/Layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Boxes } from 'lucide-react'
import MateriaisTab from '@/components/estoque/MateriaisTab'
import MovimentacoesTab from '@/components/estoque/MovimentacoesTab'
import ReceitaServicoTab from '@/components/estoque/ReceitaServicoTab'
import ResumoEstoqueTab from '@/components/estoque/ResumoEstoqueTab'

export default function Estoque() {
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey(k => k + 1)

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Boxes className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Estoque / Almoxarifado</h1>
            <p className="text-xs text-muted-foreground">Controle de materiais, entradas, saídas e consumo por serviço</p>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="space-y-3">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="receita">Receita por serviço</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <ResumoEstoqueTab refreshKey={refreshKey} />
          </TabsContent>
          <TabsContent value="materiais">
            <MateriaisTab onChanged={bump} />
          </TabsContent>
          <TabsContent value="movimentacoes">
            <MovimentacoesTab onChanged={bump} refreshKey={refreshKey} />
          </TabsContent>
          <TabsContent value="receita">
            <ReceitaServicoTab onChanged={bump} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
