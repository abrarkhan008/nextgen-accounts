import { Capacitor } from "@capacitor/core";

export async function saveAndShareFile(fileName, base64Data) {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_");

  if (!Capacitor.isNativePlatform()) {
    // normal browser
    const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Android app
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  await Filesystem.writeFile({
    path: safeName,
    data: base64Data,
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({
    path: safeName,
    directory: Directory.Cache,
  });
  await Share.share({
    title: safeName,
    url: uri,
    dialogTitle: "Save or share",
  });
}
