import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTodayTotals,
  getOverallTotals,
  getTransactions,
  searchTransactions,
} from "../db/storage";
import TransactionRow from "../components/TransactionRow";

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [today, setToday] = useState({ cashIn: 0, cashOut: 0, balance: 0 });
  const [overall, setOverall] = useState({ cashIn: 0, cashOut: 0, balance: 0 });
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load(silent) {
    if (!silent) setLoading(true);
    const [t, o, list] = await Promise.all([
      getTodayTotals(),
      getOverallTotals(),
      query
        ? searchTransactions(query)
        : getTransactions().then((all) => all.slice(0, 8)),
    ]);
    setToday(t);
    setOverall(o);
    setTxns(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, [query]);

  return (
    <div className="px-4 pt-4 space-y-4">
      <section className="rounded-2xl bg-navy-700 text-white p-4 shadow-card">
        <p className="text-navy-200 text-xs font-medium mb-2">Today</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-navy-100">Cash In</span>
          <span className="font-semibold text-emerald-300">
            ₹{today.cashIn.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-navy-100">Cash Out</span>
          <span className="font-semibold text-brick-300">
            ₹{today.cashOut.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="h-px bg-white/15 mb-3" />
        <div className="flex justify-between items-baseline">
          <span className="text-navy-100 text-sm">Overall Balance</span>
          <span className="font-display font-semibold text-2xl">
            ₹{overall.balance.toLocaleString("en-IN")}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/cash-in")}
          className="rounded-xl bg-white border border-steel-200 shadow-card py-4 flex flex-col items-center gap-1 active:scale-[0.98] transition"
        >
          <span className="text-emerald-600 text-2xl font-semibold">+</span>
          <span className="text-sm font-medium text-steel-700">Cash In</span>
        </button>
        <button
          onClick={() => navigate("/cash-out")}
          className="rounded-xl bg-white border border-steel-200 shadow-card py-4 flex flex-col items-center gap-1 active:scale-[0.98] transition"
        >
          <span className="text-brick-600 text-2xl font-semibold">−</span>
          <span className="text-sm font-medium text-steel-700">Cash Out</span>
        </button>
        <button
          onClick={() => navigate("/party-file")}
          className="rounded-xl bg-white border border-steel-200 shadow-card py-4 flex flex-col items-center gap-1 active:scale-[0.98] transition"
        >
          <span className="text-navy-600 text-2xl font-semibold">📄</span>
          <span className="text-sm font-medium text-steel-700">
            Person File
          </span>
        </button>
        <button
          onClick={() => navigate("/account-ledger")}
          className="rounded-xl bg-white border border-steel-200 shadow-card py-4 flex flex-col items-center gap-1 active:scale-[0.98] transition"
        >
          <span className="text-navy-600 text-2xl font-semibold">📊</span>
          <span className="text-sm font-medium text-steel-700">
            Account / Group
          </span>
        </button>
      </section>

      <section>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, site, or month..."
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
      </section>

      <section>
        <p className="text-xs font-medium text-steel-500 mb-2">
          {query ? "Search Results" : "Recent Transactions"}
        </p>
        <div className="space-y-2">
          {loading && (
            <p className="text-sm text-steel-400 py-6 text-center">Loading…</p>
          )}
          {!loading && txns.length === 0 && (
            <p className="text-sm text-steel-400 py-6 text-center">
              No transactions yet.
            </p>
          )}
          {!loading &&
            txns.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/edit-transaction/${t.id}`)}
                className="cursor-pointer active:opacity-70"
              >
                <TransactionRow t={t} />
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
