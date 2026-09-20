import * as XLSX from 'xlsx';

export function exportReportExcel({ rows, totals, fileName }) {
  const sheetData = rows.map((r) => ({
    Date: r.date, Type: r.type, Account: r.account, 'Party / Site': r.partySite, Remark: r.remark || '', 'Amount (₹)': r.amount
  }));
  sheetData.push({});
  sheetData.push({ Date: '', Type: '', Account: '', 'Party / Site': 'Total Cash In', Remark: '', 'Amount (₹)': totals.cashIn });
  sheetData.push({ Date: '', Type: '', Account: '', 'Party / Site': 'Total Cash Out', Remark: '', 'Amount (₹)': totals.cashOut });
  sheetData.push({ Date: '', Type: '', Account: '', 'Party / Site': 'Balance', Remark: '', 'Amount (₹)': totals.balance });

  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, fileName || 'report.xlsx');
}
