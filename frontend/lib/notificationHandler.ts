/**
 * 📱 MOBILE NOTIFICATION HANDLER - MAJOR'S VIBRATION REQUIREMENTS
 * 
 * Handles:
 * - Push notifications with vibration
 * - Toast notifications
 * - Sound alerts
 * - Badge updates
 */

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'urgent';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  vibrate?: boolean;
  sound?: boolean;
  requireInteraction?: boolean;
}

/**
 * Show notification with VIBRATION (Major's requirement!)
 */
export function showNotificationWithVibration(options: NotificationOptions): void {
  const {
    title,
    message,
    type,
    priority = 'medium',
    vibrate = true,
    sound = true,
    requireInteraction = false
  } = options;

  // VIBRATION PATTERNS (Major's dizzle whizzle!)
  const vibrationPatterns = {
    urgent: [200, 100, 200, 100, 200], // Long buzz pattern for URGENT
    high: [100, 50, 100], // Medium buzz for HIGH priority
    medium: [100], // Single buzz for MEDIUM
    low: [50] // Quick buzz for LOW
  };

  // VIBRATE THE PHONE, GODAMT!
  if (vibrate && 'vibrate' in navigator) {
    const pattern = vibrationPatterns[priority] || vibrationPatterns.medium;
    navigator.vibrate(pattern);
    console.log(`📳 VIBRATING with pattern:`, pattern, 'for priority:', priority);
  }

  // Show browser notification if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    const notif = new Notification(title, {
      body: message,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `notification-${Date.now()}`,
      requireInteraction: requireInteraction || priority === 'urgent',
      vibrate: vibrate ? vibrationPatterns[priority] : undefined,
      data: {
        type,
        priority,
        timestamp: Date.now()
      }
    });

    // Auto-close after delay (unless urgent)
    if (priority !== 'urgent' && !requireInteraction) {
      setTimeout(() => notif.close(), 5000);
    }

    // Click handler
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  }

  // Play sound for URGENT alerts
  if (sound && priority === 'urgent') {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBR1yz/DdljEJHGi66+ifVRQLRp/e8rdfKAUpa8jv45ZGCh1ntOrtnF0YDUef3/C7aSwGI3DG79+TPQoXZLXn7qdbGwxKn9zvunAiBiNvxO7dmkGCRYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBR1yz/DdljEJHGi66+ifVRQLRp/e8rdfKAUpa8jv45ZGCh1ntOrtnF0YDUef3/C7aSwGI3DG79+TPQoXZLXn7qdbGwxKn9zvunAiBiNvxO7dmkGCRYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBR1yz/DdljEJHGi66+ifVRQLRp/e8rdfKAUpa8jv45ZGCh1ntOrtnF0YDUef3/C7aSwGI3DG79+TPQoXZLXn7qdbGwxKn9zvunAiBiNvxO7dmkE=');
      audio.volume = 0.3;
      audio.play().catch(err => console.log('🔇 Could not play sound:', err));
    } catch (err) {
      console.log('🔇 Audio not supported');
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('❌ Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * VIBRATE for SELL signal (Major's requirement!)
 */
export function vibrateForSellSignal(): void {
  if ('vibrate' in navigator) {
    // URGENT pattern: Long buzzes for SELL
    navigator.vibrate([300, 100, 300, 100, 300]);
    console.log('🚨 VIBRATING for SELL SIGNAL!');
  }
}

/**
 * VIBRATE for watchlist price alert (Major's requirement!)
 */
export function vibrateForPriceAlert(type: 'high' | 'low'): void {
  if ('vibrate' in navigator) {
    // Different patterns for high vs low
    const pattern = type === 'high' 
      ? [200, 50, 200] // Quick double buzz for HIGH
      : [100, 50, 100, 50, 100]; // Triple buzz for LOW
    navigator.vibrate(pattern);
    console.log(`📈📉 VIBRATING for ${type.toUpperCase()} price alert!`);
  }
}

/**
 * VIBRATE for take profit reached (Major's requirement!)
 */
export function vibrateForTakeProfit(): void {
  if ('vibrate' in navigator) {
    // Victory pattern: Ascending buzzes
    navigator.vibrate([100, 50, 150, 50, 200]);
    console.log('💰 VIBRATING for TAKE PROFIT!');
  }
}

