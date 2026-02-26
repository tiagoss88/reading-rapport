import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

export default function InstallAppBanner() {
  const { isVisible, isIOS, install, dismiss, canInstall } = useInstallPrompt();

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-primary-foreground rounded-lg p-3 flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2">
      <Download className="w-6 h-6 shrink-0" />
      <div className="flex-1 min-w-0">
        {isIOS ? (
          <p className="text-xs leading-tight">
            Toque em <Share className="w-3.5 h-3.5 inline-block mx-0.5" /> e depois em <strong>"Adicionar à Tela de Início"</strong> para instalar o app.
          </p>
        ) : (
          <p className="text-xs leading-tight">
            Instale o app para acesso rápido e notificações.
          </p>
        )}
      </div>
      {!isIOS && canInstall && (
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 text-xs h-8"
          onClick={install}
        >
          Instalar
        </Button>
      )}
      <button
        onClick={dismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
