import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useLocationTracking = (enabled: boolean = true) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendLocation = async (position: GeolocationPosition) => {
    try {
      // Buscar operador_id do usuário autenticado
      const { data: operadorData } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!operadorData) return;

      // Obter nível de bateria (se disponível)
      let bateriaNivel = null;
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        bateriaNivel = Math.round(battery.level * 100);
      }

      await supabase.from('operador_localizacoes').insert({
        operador_id: operadorData.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precisao: position.coords.accuracy,
        velocidade: position.coords.speed ? position.coords.speed * 3.6 : null,
        bateria_nivel: bateriaNivel,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Erro ao enviar localização:', err);
    }
  };

  useEffect(() => {
    if (!enabled || !user) return;

    if ('geolocation' in navigator) {
      setIsTracking(true);

      // Enviar localização imediatamente
      navigator.geolocation.getCurrentPosition(sendLocation);

      // Configurar intervalo de 5 minutos (300.000 ms)
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          sendLocation,
          (err) => setError(err.message),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }, 300000); // 5 minutos

    } else {
      setError('Geolocalização não disponível neste dispositivo');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsTracking(false);
    };
  }, [enabled, user]);

  return { isTracking, error };
};
