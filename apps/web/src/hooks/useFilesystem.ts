import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export function useFilesystem() {
  const writeFile = async (path: string, data: string) => {
    if (!Capacitor.isNativePlatform()) {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  };

  const readFile = async (path: string) => {
    if (!Capacitor.isNativePlatform()) return null;

    const result = await Filesystem.readFile({
      path,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    return result.data as string;
  };

  return { writeFile, readFile };
}
