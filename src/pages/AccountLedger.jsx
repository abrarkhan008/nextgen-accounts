import { useEffect, useMemo, useState } from "react";
import { getAccounts, getDepartments, getTransactions } from "../db/storage";
import { exportReportPdf, previewReportPdf } from "../utils/exportPdf";
import { exportReportExcel } from "../utils/exportExcel";

export default function AccountLedger() {
  const [mode, setMode] = useState("account"); // "account" | "department"
  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [allTxns, setAllTxns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAccounts().then(setAccounts);
    getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    setSelectedId("");
    setAllTxns([]);
  }, [mode]);

  const selectedAccount = accounts.find((a) => a.id === selectedId);
  const selectedDept = departments.find((d) => d.id === selectedId);
  const selectedLabel =
    mode === "account" ? selectedAccount?.name : selectedDept?.name;

  useEffect(() => {
    if (!selectedId) {
      setAllTxns([]);
      return;
    }
    setLoading(true);
    getTransactions().then((all) => {
      const filtered =
        mode === "account"
          ? all.filter((t) => t.accountId === selectedId)
          : all.filter((t) => t.department === selectedDept?.name);
      setAllTxns(filtered);
      setLoading(false);
    });
  }, [selectedId, mode, selectedDept]);

  const now = new Date();
  const isThisMonth = (t) => {
    const d = new Date(t.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  };

  const totals = useMemo(() => {
    const sum = (list, type) =>
      list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
    return {
      allIn: sum(allTxns, "IN"),
      allOut: sum(allTxns, "OUT"),
      monthIn: sum(allTxns.filter(isThisMonth), "IN"),
      monthOut: sum(allTxns.filter(isThisMonth), "OUT"),
    };
  }, [allTxns]);

  const rows = useMemo(
    () =>
      allTxns
        .slice()
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((t) => ({
          date: new Date(t.createdAt).toLocaleDateString("en-GB"),
          type: t.type,
          account: t.accountName,
          partySite:
            t.type === "IN"
              ? t.creditedFrom || t.site || "-"
              : t.party || t.site || "-",
          remark: t.remark,
          amount: t.amount,
        })),
    [allTxns],
  );

  const reportTotals = {
    cashIn: totals.allIn,
    cashOut: totals.allOut,
    balance:
      mode === "account"
        ? totals.allIn - totals.allOut
        : totals.allIn - totals.allOut,
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <h1 className="font-display text-lg font-semibold text-steel-900">
        Account / Group Ledger
      </h1>

      <div className="flex rounded-lg bg-steel-100 p-1">
        <button
          onClick={() => setMode("account")}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium ${
            mode === "account"
              ? "bg-white shadow-card text-navy-700"
              : "text-steel-500"
          }`}
        >
          By Account
        </button>
        <button
          onClick={() => setMode("department")}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium ${
            mode === "department"
              ? "bg-white shadow-card text-navy-700"
              : "text-steel-500"
          }`}
        >
          By Group
        </button>
      </div>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
      >
        <option value="">
          {mode === "account" ? "Select an account" : "Select a group"}
        </option>
        {(mode === "account" ? accounts : departments).map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      {selectedId && (
        <>
          <section className="rounded-xl bg-white border border-steel-200 shadow-card p-4 space-y-3">
            <p className="text-sm font-medium text-steel-500">
              {selectedLabel} — This Month
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-steel-500">Cash In</span>
              <span className="font-semibold text-emerald-600">
                ₹{totals.monthIn.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-steel-500">Cash Out</span>
              <span className="font-semibold text-brick-600">
                ₹{totals.monthOut.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-px bg-steel-100" />
            <p className="text-sm font-medium text-steel-500 pt-1">All Time</p>
            <div className="flex justify-between text-sm">
              <span className="text-steel-500">Cash In</span>
              <span className="font-semibold text-emerald-600">
                ₹{totals.allIn.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-steel-500">Cash Out</span>
              <span className="font-semibold text-brick-600">
                ₹{totals.allOut.toLocaleString("en-IN")}
              </span>
            </div>
            {mode === "account" && (
              <>
                <div className="h-px bg-steel-100" />
                <div className="flex justify-between">
                  <span className="font-medium text-steel-700">Balance</span>
                  <span className="font-display font-semibold text-lg text-navy-700">
                    ₹{(totals.allIn - totals.allOut).toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            )}
          </section>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() =>
                exportReportPdf({
                  title:
                    mode === "account"
                      ? "Account Statement"
                      : "Group Statement",
                  subtitle: selectedLabel,
                  rows,
                  totals: reportTotals,
                  fileName: `${selectedLabel}.pdf`,
                })
              }
              disabled={rows.length === 0}
              className="rounded-xl bg-navy-700 disabled:bg-steel-300 text-white text-sm font-medium py-3"
            >
              PDF
            </button>
            <button
              onClick={() =>
                previewReportPdf({
                  title:
                    mode === "account"
                      ? "Account Statement"
                      : "Group Statement",
                  subtitle: selectedLabel,
                  rows,
                  totals: reportTotals,
                })
              }
              disabled={rows.length === 0}
              className="rounded-xl border border-navy-300 text-navy-700 disabled:border-steel-300 disabled:text-steel-300 text-sm font-medium py-3"
            >
              Preview
            </button>
            <button
              onClick={() =>
                exportReportExcel({
                  rows,
                  totals: reportTotals,
                  fileName: `${selectedLabel}.xlsx`,
                })
              }
              disabled={rows.length === 0}
              className="rounded-xl bg-steel-700 disabled:bg-steel-300 text-white text-sm font-medium py-3"
            >
              Excel
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-steel-500">
              All transactions ({rows.length})
            </p>
            {loading && (
              <p className="text-sm text-steel-400 py-4 text-center">
                Loading…
              </p>
            )}
            {!loading && rows.length === 0 && (
              <p className="text-sm text-steel-400 py-4 text-center">
                No transactions yet.
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
                      {r.date} — {r.partySite}
                    </p>
                    {r.remark && (
                      <p className="text-xs text-steel-400 italic">
                        "{r.remark}"
                      </p>
                    )}
                  </div>
                  <span
                    className={`font-medium ${r.type === "IN" ? "text-emerald-600" : "text-brick-600"}`}
                  >
                    {r.type === "IN" ? "+" : "−"}₹
                    {r.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
