import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const TRACKING_INTERVAL_MS = 600000; // 10 minutes

export const useLocationTracking = (enabled: boolean = true) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef = useRef(false);

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
          
          if (precisao < 50) {
            resolve(position);
          } else if (precisao < 100 && tentativa >= 2) {
            resolve(position);
          } else if (tentativa < 3) {
            setTimeout(async () => {
              try {
                const newPosition = await getHighAccuracyLocation(tentativa + 1);
                resolve(newPosition);
              } catch (err) {
                resolve(position);
              }
            }, 2000);
          } else {
            resolve(position);
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
    if (isSendingRef.current || !user) return;
    isSendingRef.current = true;

    try {
      const { data: operadorData } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!operadorData) return;

      const position = await getHighAccuracyLocation();
      const precisao = position.coords.accuracy;
      
      let bateriaNivel = null;
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        bateriaNivel = Math.round(battery.level * 100);
      }

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
    } finally {
      isSendingRef.current = false;
    }
  };

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      sendLocation();
    }, TRACKING_INTERVAL_MS);
  };

  useEffect(() => {
    if (!enabled || !user) return;

    if (!('geolocation' in navigator)) {
      setError('Geolocalização não disponível neste dispositivo');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Send immediately and start interval
    sendLocation();
    startInterval();

    // Page Visibility API: resume tracking when user returns to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendLocation();
        startInterval();
      } else {
        // Pause interval when app is in background to save battery
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setIsTracking(false);
    };
  }, [enabled, user]);

  return { isTracking, error };
};
