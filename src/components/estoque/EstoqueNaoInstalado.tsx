import { Database, Copy, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import scriptInstalacao from '../../../supabase/manual/estoque_producao.sql?raw'
import scriptArmazens from '../../../supabase/manual/estoque_armazens.sql?raw'

export default function EstoqueNaoInstalado({ onVerificar, somenteArmazens = false }: { onVerificar: () => void; somenteArmazens?: boolean }) {
  const { toast } = useToast()
  const script = somenteArmazens ? scriptArmazens : `${scriptInstalacao}\n\n${scriptArmazens}`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(script)
      toast({ title: 'Script copiado', description: 'Cole e execute no editor SQL do banco.' })
    } catch {
      toast({ title: 'Não foi possível copiar', description: 'Selecione o texto abaixo e copie manualmente.', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Database className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              {somenteArmazens ? 'Atualização do estoque pendente (armazéns)' : 'Módulo de estoque ainda não instalado no banco'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Copie o script, execute no editor SQL do banco e depois clique em "Verificar novamente".
              Pode ser executado mais de uma vez. O restante do sistema não é afetado.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={copiar}><Copy className="h-4 w-4 mr-1" /> Copiar script</Button>
          <Button size="sm" variant="outline" onClick={onVerificar}><RotateCw className="h-4 w-4 mr-1" /> Verificar novamente</Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre">{script}</pre>
      </CardContent>
    </Card>
  )
}
