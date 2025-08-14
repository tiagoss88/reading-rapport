import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Camera, FileText, Download } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCPF } from '@/lib/formatters'

interface Cliente {
  id: string
  identificacao_unidade: string
  nome?: string
  cpf?: string
  status: string
  empreendimentos?: {
    nome: string
  }
}

interface Leitura {
  id: string
  leitura_atual: number
  data_leitura: string
  observacao?: string
  tipo_observacao?: string
  foto_url?: string
  operadores?: {
    nome: string
  }
}

interface ClienteHistoricoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
}

export default function ClienteHistorico({ open, onOpenChange, cliente }: ClienteHistoricoProps) {
  const [leituras, setLeituras] = useState<Leitura[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && cliente) {
      fetchLeituras()
    }
  }, [open, cliente])

  const fetchLeituras = async () => {
    if (!cliente) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leituras')
        .select(`
          *,
          operadores:operador_id (nome)
        `)
        .eq('cliente_id', cliente.id)
        .order('data_leitura', { ascending: false })

      if (error) throw error
      setLeituras(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularConsumo = (leituraAtual: number, leituraAnterior?: number) => {
    if (!leituraAnterior) return null
    return Math.max(0, leituraAtual - leituraAnterior)
  }

  const getObservacaoBadge = (tipo?: string) => {
    switch (tipo) {
      case 'medidor_danificado':
        return <Badge variant="destructive">Medidor Danificado</Badge>
      case 'local_inacessivel':
        return <Badge variant="secondary">Local Inacessível</Badge>
      case 'cliente_ausente':
        return <Badge variant="outline">Cliente Ausente</Badge>
      case 'leitura_estimada':
        return <Badge variant="secondary">Leitura Estimada</Badge>
      default:
        return tipo ? <Badge variant="outline">{tipo}</Badge> : null
    }
  }

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank')
  }

  if (!cliente) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Histórico de Consumo
          </DialogTitle>
          <DialogDescription>
            {cliente.identificacao_unidade} - {cliente.empreendimentos?.nome}
            {cliente.nome && (
              <span className="block text-sm">
                Cliente: {cliente.nome}
                {cliente.cpf && <span> • CPF: {formatCPF(cliente.cpf)}</span>}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : leituras.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma leitura encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Este cliente ainda não possui histórico de leituras
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {leituras.map((leitura, index) => {
                const leituraAnterior = leituras[index + 1]?.leitura_atual
                const consumo = calcularConsumo(leitura.leitura_atual, leituraAnterior)
                
                return (
                  <Card key={leitura.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {format(new Date(leitura.data_leitura), 'MMMM yyyy', { locale: ptBR })}
                          </CardTitle>
                          <CardDescription>
                            Leitura realizada em {format(new Date(leitura.data_leitura), 'dd/MM/yyyy', { locale: ptBR })}
                            {leitura.operadores?.nome && (
                              <span> • Operador: {leitura.operadores.nome}</span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {leitura.leitura_atual.toLocaleString('pt-BR')} m³
                          </div>
                          {consumo !== null && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Consumo: {consumo.toLocaleString('pt-BR')} m³
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-3">
                        {/* Observações */}
                        {(leitura.observacao || leitura.tipo_observacao) && (
                          <div className="flex flex-wrap gap-2 items-center">
                            {getObservacaoBadge(leitura.tipo_observacao)}
                            {leitura.observacao && (
                              <span className="text-sm text-muted-foreground">
                                {leitura.observacao}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Foto do medidor */}
                        {leitura.foto_url && (
                          <div>
                            <div className="flex items-center mb-2">
                              <Camera className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Foto do medidor:</span>
                            </div>
                            <div 
                              className="relative w-48 h-36 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleImageClick(leitura.foto_url!)}
                            >
                              <img
                                src={leitura.foto_url}
                                alt="Foto do medidor"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder.svg'
                                }}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs">Clique para ampliar</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}