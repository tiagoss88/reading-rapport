import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logError } from '@/lib/errorLogger'
import { isChunkLoadError, recarregarPorChunk } from '@/lib/versionCheck'

interface Props {
  children: ReactNode
  /** Nome da área protegida, usado no log e na mensagem */
  area?: string
  /** Quando true, ocupa a tela inteira (proteção geral do app) */
  fullScreen?: boolean
}

interface State {
  erro: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    if (isChunkLoadError(erro) && recarregarPorChunk()) return
    void logError(erro, {
      origem: 'ErrorBoundary',
      area: this.props.area ?? 'app',
      componentStack: info.componentStack?.slice(0, 4000),
    })
  }

  private tentarNovamente = () => this.setState({ erro: null })

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div className={`flex items-center justify-center p-6 ${this.props.fullScreen ? 'min-h-screen' : 'min-h-[50vh]'}`}>
        <div className="max-w-md w-full rounded-lg border bg-card p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
          <h2 className="text-base font-semibold">
            {this.props.area ? `Não foi possível abrir ${this.props.area}` : 'Algo deu errado nesta tela'}
          </h2>
          <p className="text-sm text-muted-foreground">
            O problema foi registrado no Log de Erros. O restante do sistema continua funcionando.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            {!this.props.fullScreen && (
              <Button variant="outline" size="sm" onClick={this.tentarNovamente}>Tentar novamente</Button>
            )}
            <Button size="sm" onClick={() => window.location.reload()}>
              <RotateCw className="h-4 w-4 mr-1" /> Recarregar
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
