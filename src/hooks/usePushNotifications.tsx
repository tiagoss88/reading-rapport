import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// IMPORTANTE: Substitua pela sua chave VAPID pública gerada
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || registeredRef.current || !VAPID_PUBLIC_KEY) return;

    const registerPush = async () => {
      try {
        // Check browser support
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.log('Push notifications not supported');
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }

        // Register custom service worker for push
        const registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;

        // Get push subscription
        const pushManager = (registration as any).pushManager;
        if (!pushManager) {
          console.log('PushManager not available');
          return;
        }

        let subscription = await pushManager.getSubscription();

        if (!subscription) {
          subscription = await pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const subscriptionJson = subscription.toJSON();
        const endpoint = subscriptionJson.endpoint!;
        const p256dh = subscriptionJson.keys!.p256dh!;
        const auth = subscriptionJson.keys!.auth!;

        // Save to Supabase (upsert by user_id + endpoint)
        const { error } = await supabase
          .from('push_subscriptions' as any)
          .upsert(
            {
              user_id: user.id,
              endpoint,
              p256dh,
              auth,
            },
            { onConflict: 'user_id,endpoint' }
          );

        if (error) {
          console.error('Error saving push subscription:', error);
        } else {
          console.log('Push subscription registered successfully');
          registeredRef.current = true;
        }
      } catch (err) {
        console.error('Error registering push notifications:', err);
      }
    };

    registerPush();
  }, [user]);
}
