import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAndShareFile } from "./saveFile";

export async function exportReportPdf({
  title,
  subtitle,
  rows,
  totals,
  fileName,
}) {
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

  const base64 = doc.output("datauristring").split(",")[1];
  await saveAndShareFile(fileName, base64);
}
