import { exportAllData, importAllData, setMeta } from '../db/storage';
import { Capacitor } from '@capacitor/core';

function isNative() {
  return Capacitor.isNativePlatform();
}

export function backupFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

// A local copy of the backup, saved to the phone's Files app / Downloads
// folder, or downloaded straight to the computer in the browser. Handy as a
// second safety net alongside Google Drive, and works even with no internet.
export async function backupToLocalFile() {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const fileName = backupFileName();

  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Cache, encoding: 'utf8' });
    const uriResult = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: 'NextGen Accounts Backup', url: uriResult.uri, dialogTitle: 'Save backup' });
  } else {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  }
  await setMeta({ lastBackup: new Date().toISOString() });
  return fileName;
}

export function restoreFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        await importAllData(data);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
