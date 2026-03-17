import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<string>('prompt');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    PushNotifications.checkPermissions().then(({ receive }) => {
      setPermissionStatus(receive);
    });
  }, []);

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) return;

    const { receive } = await PushNotifications.requestPermissions();
    setPermissionStatus(receive);

    if (receive === 'granted') {
      await PushNotifications.register();
    }
  };

  return { permissionStatus, requestPermission };
}
