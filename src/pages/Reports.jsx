import { useEffect, useMemo, useState } from "react";
import {
  getTransactions,
  getTransactionsByMonth,
  getTransactionsByYear,
  getAccounts,
  getSites,
} from "../db/storage";
import { exportReportPdf } from "../utils/exportPdf";
import { exportReportExcel } from "../utils/exportExcel";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MODE_LABELS = { monthly: "Monthly", yearly: "Yearly", all: "All Time" };

export default function Reports() {
  const thisYear = new Date().getFullYear();
  const [mode, setMode] = useState("monthly");
  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState(new Date().getMonth());
  const [accountFilter, setAccountFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [sites, setSites] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccounts().then(setAccounts);
    getSites().then(setSites);
  }, []);

  useEffect(() => {
    setLoading(true);
    let fetcher;
    if (mode === "monthly") fetcher = getTransactionsByMonth(year, month);
    else if (mode === "yearly") fetcher = getTransactionsByYear(year);
    else fetcher = getTransactions();
    fetcher.then((list) => {
      let out = list;
      if (accountFilter) out = out.filter((t) => t.accountId === accountFilter);
      if (siteFilter) out = out.filter((t) => t.site === siteFilter);
      setTxns(out);
      setLoading(false);
    });
  }, [mode, year, month, accountFilter, siteFilter]);

  const totals = useMemo(() => {
    const cashIn = txns
      .filter((t) => t.type === "IN")
      .reduce((s, t) => s + t.amount, 0);
    const cashOut = txns
      .filter((t) => t.type === "OUT")
      .reduce((s, t) => s + t.amount, 0);
    return { cashIn, cashOut, balance: cashIn - cashOut };
  }, [txns]);

  const rows = useMemo(
    () =>
      txns
        .slice()
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((t) => ({
          date: new Date(t.createdAt).toLocaleDateString("en-GB"),
          type: t.type === "IN" ? "IN" : "OUT",
          account: t.accountName,
          mode: t.paymentMode || "",
          partySite:
            t.type === "IN"
              ? t.creditedFrom || t.site || "-"
              : t.party || t.department || t.site || "-",
          remark: t.remark,
          amount: t.amount,
        })),
    [txns],
  );

  const periodLabel =
    mode === "monthly"
      ? `${MONTHS[month]} ${year}`
      : mode === "yearly"
        ? `Year ${year}`
        : "All Time";
  const label = siteFilter
    ? `${siteFilter} Project — ${periodLabel}`
    : periodLabel;
  const periodFile =
    mode === "monthly"
      ? `${MONTHS[month]}-${year}`
      : mode === "yearly"
        ? `Year-${year}`
        : "All-Time";
  const fileBase = siteFilter ? `${siteFilter}-${periodFile}` : periodFile;
  const reportTitle = siteFilter
    ? `${siteFilter} Project Report`
    : `${MODE_LABELS[mode]} Report`;

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <h1 className="font-display text-lg font-semibold text-steel-900">
        Reports
      </h1>

      <div className="flex rounded-lg bg-steel-100 p-1">
        {Object.keys(MODE_LABELS).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium ${mode === m ? "bg-white shadow-card text-navy-700" : "text-steel-500"}`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {mode !== "all" && (
        <div className="grid grid-cols-2 gap-3">
          {mode === "monthly" && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
          >
            {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      <select
        value={siteFilter}
        onChange={(e) => setSiteFilter(e.target.value)}
        className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
      >
        <option value="">All Projects</option>
        {sites.map((s) => (
          <option key={s.id} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={accountFilter}
        onChange={(e) => setAccountFilter(e.target.value)}
        className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
      >
        <option value="">All Accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <section className="rounded-xl bg-white border border-steel-200 shadow-card p-4">
        <p className="text-sm font-medium text-steel-500 mb-3">{label}</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-steel-500">Total In</span>
          <span className="font-semibold text-emerald-600">
            ₹{totals.cashIn.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-steel-500">Total Out</span>
          <span className="font-semibold text-brick-600">
            ₹{totals.cashOut.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="h-px bg-steel-100 mb-3" />
        <div className="flex justify-between">
          <span className="font-medium text-steel-700">Balance</span>
          <span className="font-display font-semibold text-lg text-navy-700">
            ₹{totals.balance.toLocaleString("en-IN")}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() =>
            exportReportPdf({
              title: reportTitle,
              subtitle: label,
              rows,
              totals,
              fileName: `${fileBase}.pdf`,
            })
          }
          disabled={rows.length === 0}
          className="rounded-xl bg-navy-700 disabled:bg-steel-300 text-white text-sm font-medium py-3"
        >
          Download PDF
        </button>
        <button
          onClick={() =>
            exportReportExcel({ rows, totals, fileName: `${fileBase}.xlsx` })
          }
          disabled={rows.length === 0}
          className="rounded-xl bg-steel-700 disabled:bg-steel-300 text-white text-sm font-medium py-3"
        >
          Download Excel
        </button>
      </div>

      <button
        onClick={async () => {
          const shareText = `${label}\nTotal In: ₹${totals.cashIn}\nTotal Out: ₹${totals.cashOut}\nBalance: ₹${totals.balance}`;
          try {
            if (Capacitor.isNativePlatform()) {
              await Share.share({
                title: `NextGen Accounts — ${label}`,
                text: shareText,
              });
            } else if (navigator.share) {
              await navigator.share({
                title: `NextGen Accounts — ${label}`,
                text: shareText,
              });
            } else {
              alert(
                "Sharing isn't supported in this browser preview. It will work in the installed app.",
              );
            }
          } catch (e) {
            // user cancelled the share sheet — ignore
          }
        }}
        className="w-full rounded-xl border border-navy-300 text-navy-700 text-sm font-medium py-3"
      >
        Share Summary
      </button>

      <div className="space-y-2 pt-2">
        <p className="text-xs font-medium text-steel-500">
          Transactions in this report ({rows.length})
        </p>
        {loading && (
          <p className="text-sm text-steel-400 py-4 text-center">Loading…</p>
        )}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-steel-400 py-4 text-center">
            No transactions found.
          </p>
        )}
        {!loading &&
          rows.map((r, i) => (
            <div
              key={i}
              className="flex justify-between items-center rounded-lg bg-white border border-steel-100 px-3 py-2 text-sm"
            >
              <div>
                <p className="text-steel-800">
                  {r.account} — {r.partySite}
                </p>
                <p className="text-xs text-steel-400">
                  {r.date}
                  {r.mode ? ` · ${r.mode}` : ""}
                </p>
              </div>
              <span
                className={`font-medium ${r.type === "IN" ? "text-emerald-600" : "text-brick-600"}`}
              >
                {r.type === "IN" ? "+" : "−"}₹{r.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
