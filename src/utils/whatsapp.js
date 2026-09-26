import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export function buildTransactionMessage(t) {
  const date = new Date(t.createdAt).toLocaleDateString("en-GB");
  const lines = [
    `*NextGen PreFab — ${t.type === "IN" ? "Cash In" : "Cash Out"}*`,
    `Date: ${date}`,
    `Account: ${t.accountName}`,
  ];
  if (t.type === "IN") {
    if (t.creditedFrom) lines.push(`Credited From: ${t.creditedFrom}`);
  } else {
    if (t.department) lines.push(`Department: ${t.department}`);
    if (t.party) lines.push(`To: ${t.party}`);
    if (t.workDone) lines.push(`Work Done: ${t.workDone}`);
  }
  if (t.site) lines.push(`Site: ${t.site}`);
  lines.push(`Amount: ₹${Number(t.amount).toLocaleString("en-IN")}`);
  if (t.remark) lines.push(`Remark: ${t.remark}`);
  return lines.join("\n");
}

export async function shareTransactionOnWhatsApp(t, phoneNumber) {
  const text = encodeURIComponent(buildTransactionMessage(t));
  const digits = (phoneNumber || "").replace(/\D/g, "");
  const url = digits
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;

  if (Capacitor.isNativePlatform()) {
    // Hand off to the OS so it opens the actual WhatsApp app, not an in-app webview
    await Browser.open({ url });
  } else {
    window.open(url, "_blank");
  }
}
