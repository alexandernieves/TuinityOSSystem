
import { api } from './api';
import { loadSession } from './auth-storage';

const VAPID_PUBLIC_KEY = 'BPXJHfVjNcQ1uTwOdN0ZXKU05H_UT_1E_96BTlP5SjSgFb_-K1MW3n6f4y7krhIQftZIads8TLpmg-tjtF_Quiw';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            return subscription;
        }

        const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        const session = loadSession();
        if (session) {
            await api('/notifications/subscribe', {
                method: 'POST',
                accessToken: session.accessToken,
                body: JSON.stringify(newSubscription)
            });
            console.log('Successfully subscribed to Web Push');
        }

        return newSubscription;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Push registration aborted or timed out.');
        } else {
            console.warn('Push notification registration failed (non-critical):', error);
        }
    }
}
