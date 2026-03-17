import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';

export function useCamera() {
  const takePhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      return Camera.getPhoto({ resultType: CameraResultType.Uri });
    }

    return new Promise<{ webPath: string }>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          resolve({ webPath: URL.createObjectURL(file) });
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.addEventListener('cancel', () => {
        reject(new Error('File selection cancelled'));
      });
      input.click();
    });
  };

  return { takePhoto };
}
