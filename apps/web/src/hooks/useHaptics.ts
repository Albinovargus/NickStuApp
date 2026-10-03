import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style });
};

const vibrate = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.vibrate();
};

// Module-level so the functions keep their identity across renders (safe in hook deps).
const haptics = { impact, vibrate };

export function useHaptics() {
  return haptics;
}
