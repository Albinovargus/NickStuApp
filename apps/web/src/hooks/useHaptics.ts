import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function useHaptics() {
  const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!Capacitor.isNativePlatform()) return;
    await Haptics.impact({ style });
  };

  const vibrate = async () => {
    if (!Capacitor.isNativePlatform()) return;
    await Haptics.vibrate();
  };

  return { impact, vibrate };
}
