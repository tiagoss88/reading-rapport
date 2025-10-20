import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const useLocationTracking = (enabled: boolean = true) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
    if (!MAPBOX_TOKEN) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      return data.features[0]?.place_name || null;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return null;
    }
  };

  const getPrecisaoRating = (precisao: number): string => {
    if (precisao < 20) return 'excelente';
    if (precisao < 50) return 'boa';
    if (precisao < 100) return 'aceitavel';
    return 'ruim';
  };

  const getHighAccuracyLocation = async (tentativa: number = 1): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const precisao = position.coords.accuracy;
          
          // Se precisão for boa (< 50m), aceitar
          if (precisao < 50) {
            resolve(position);
          } 
          // Se precisão for aceitável (< 100m) e já tentou 2 vezes, aceitar
          else if (precisao < 100 && tentativa >= 2) {
            resolve(position);
          }
          // Se ainda não atingiu o máximo de tentativas, tentar novamente
          else if (tentativa < 3) {
            setTimeout(async () => {
              try {
                const newPosition = await getHighAccuracyLocation(tentativa + 1);
                resolve(newPosition);
              } catch (err) {
                resolve(position); // Se falhar, usar a posição atual
              }
            }, 2000);
          } else {
            resolve(position); // Última tentativa, aceitar o que vier
          }
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  const sendLocation = async () => {
    try {
      // Buscar operador_id do usuário autenticado
      const { data: operadorData } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!operadorData) return;

      // Obter localização com alta precisão
      const position = await getHighAccuracyLocation();
      const precisao = position.coords.accuracy;
      
      // Obter nível de bateria (se disponível)
      let bateriaNivel = null;
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        bateriaNivel = Math.round(battery.level * 100);
      }

      // Obter endereço usando geocoding reverso
      const enderecoEstimado = await getAddressFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );

      await supabase.from('operador_localizacoes').insert({
        operador_id: operadorData.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precisao: precisao,
        velocidade: position.coords.speed ? position.coords.speed * 3.6 : null,
        bateria_nivel: bateriaNivel,
        timestamp: new Date().toISOString(),
        endereco_estimado: enderecoEstimado,
        fonte_localizacao: 'GPS',
        precisao_rating: getPrecisaoRating(precisao),
        tentativas_gps: 1
      });

    } catch (err) {
      console.error('Erro ao enviar localização:', err);
      setError('Erro ao obter localização GPS');
    }
  };

  useEffect(() => {
    if (!enabled || !user) return;

    if ('geolocation' in navigator) {
      setIsTracking(true);
      setError(null);

      // Enviar localização imediatamente
      sendLocation();

      // Configurar intervalo de 5 minutos (300.000 ms)
      intervalRef.current = setInterval(() => {
        sendLocation();
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
