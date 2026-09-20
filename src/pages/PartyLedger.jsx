import { useEffect, useMemo, useState } from "react";
import { getDepartments, getTransactions } from "../db/storage";
import { exportReportPdf } from "../utils/exportPdf";
import { exportReportExcel } from "../utils/exportExcel";
import { shareTransactionOnWhatsApp } from "../utils/whatsapp";

export default function PartyLedger() {
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState("");
  const [allTxns, setAllTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartments().then((deps) => {
      const flat = deps.flatMap((d) =>
        d.vendors.map((v) => ({ ...v, department: d.name })),
      );
      setPeople(flat);
    });
  }, []);

  useEffect(() => {
    if (!selected) {
      setAllTxns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getTransactions().then((all) => {
      setAllTxns(
        all.filter((t) => t.party === selected || t.accountName === selected),
      );
      setLoading(false);
    });
  }, [selected]);

  const person = people.find((p) => p.name === selected);

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
              : t.site || t.department || "-",
          remark: t.remark,
          amount: t.amount,
        })),
    [allTxns],
  );

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <h1 className="font-display text-lg font-semibold text-steel-900">
        Person File
      </h1>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
      >
        <option value="">Select a person</option>
        {people.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name} ({p.department})
          </option>
        ))}
      </select>

      {selected && (
        <>
          {person?.whatsapp ? (
            <button
              onClick={() =>
                shareTransactionOnWhatsApp(
                  {
                    accountName: selected,
                    type: "OUT",
                    amount: totals.allOut,
                    remark: `Statement for ${selected}`,
                  },
                  person.whatsapp,
                )
              }
              className="w-full rounded-xl bg-emerald-600 text-white text-sm font-medium py-3 active:bg-emerald-700"
            >
              Share to {selected} on WhatsApp
            </button>
          ) : (
            <p className="text-xs text-brick-600 bg-brick-50 border border-brick-100 rounded-lg p-2">
              No WhatsApp number saved for {selected}. Add one in Settings.
            </p>
          )}

          <section className="rounded-xl bg-white border border-steel-200 shadow-card p-4 space-y-3">
            <p className="text-sm font-medium text-steel-500">
              {selected} — This Month
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
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                exportReportPdf({
                  title: "Party Statement",
                  subtitle: selected,
                  rows,
                  totals: {
                    cashIn: totals.allIn,
                    cashOut: totals.allOut,
                    balance: totals.allIn - totals.allOut,
                  },
                  fileName: `${selected}.pdf`,
                })
              }
              disabled={rows.length === 0}
              className="rounded-xl bg-navy-700 disabled:bg-steel-300 text-white text-sm font-medium py-3"
            >
              Download PDF
            </button>
            <button
              onClick={() =>
                exportReportExcel({
                  rows,
                  totals: {
                    cashIn: totals.allIn,
                    cashOut: totals.allOut,
                    balance: totals.allIn - totals.allOut,
                  },
                  fileName: `${selected}.xlsx`,
                })
              }
              disabled={rows.length === 0}
              className="rounded-xl bg-steel-700 disabled:bg-steel-300 text-white text-sm font-medium py-3"
            >
              Download Excel
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
