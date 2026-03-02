import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('new-services-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'servicos',
        },
        (payload) => {
          const novo = payload.new as any;
          toast({
            title: '🔔 Novo Serviço',
            description: `Serviço "${novo.tipo_servico || 'N/A'}" agendado para ${novo.data_agendamento || 'sem data'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'servicos_nacional_gas',
        },
        (payload) => {
          const novo = payload.new as any;
          toast({
            title: '🔔 Novo Serviço Nacional Gás',
            description: `${novo.tipo_servico || 'Serviço'} - ${novo.condominio || 'sem condomínio'}`,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);
}
