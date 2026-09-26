import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { saveAndShareFile } from "./saveFile";

function buildDoc({ title, subtitle, rows, totals }) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(21, 42, 74);
  doc.text("NextGen PreFab", 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text(title, 14, 26);
  if (subtitle) doc.text(subtitle, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Date", "Type", "Account", "Party/Site", "Remark", "Amount (₹)"]],
    body: rows.map((r) => [
      r.date,
      r.type,
      r.account,
      r.partySite,
      r.remark || "-",
      r.amount.toLocaleString("en-IN"),
    ]),
    headStyles: { fillColor: [21, 42, 74] },
    styles: { fontSize: 9 },
    theme: "striped",
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Total Cash In:  Rs. ${totals.cashIn.toLocaleString("en-IN")}`,
    14,
    finalY,
  );
  doc.text(
    `Total Cash Out: Rs. ${totals.cashOut.toLocaleString("en-IN")}`,
    14,
    finalY + 7,
  );
  doc.setFont(undefined, "bold");
  doc.text(
    `Balance:        Rs. ${totals.balance.toLocaleString("en-IN")}`,
    14,
    finalY + 14,
  );

  return doc;
}

export async function exportReportPdf({
  title,
  subtitle,
  rows,
  totals,
  fileName,
}) {
  const doc = buildDoc({ title, subtitle, rows, totals });
  const base64 = doc.output("datauristring").split(",")[1];
  await saveAndShareFile(fileName, base64);
}

export async function previewReportPdf({ title, subtitle, rows, totals }) {
  const doc = buildDoc({ title, subtitle, rows, totals });
  const blobUrl = doc.output("bloburl");
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: blobUrl });
  } else {
    window.open(blobUrl, "_blank");
  }
}
