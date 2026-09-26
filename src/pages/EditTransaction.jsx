import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getAccounts,
  getSites,
} from "../db/storage";
import PaymentModeToggle from "../components/PaymentModeToggle";

export default function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [txn, setTxn] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [siteName, setSiteName] = useState("");
  const [remark, setRemark] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [creditedFrom, setCreditedFrom] = useState("");
  const [workDone, setWorkDone] = useState("");

  useEffect(() => {
    Promise.all([getTransactionById(id), getAccounts(), getSites()]).then(
      ([t, accs, sts]) => {
        if (!t) {
          alert("Transaction not found.");
          navigate("/");
          return;
        }
        setTxn(t);
        setAccounts(accs);
        setSites(sts);
        setAccountId(t.accountId || "");
        setAmount(String(t.amount ?? ""));
        setDate(new Date(t.createdAt).toISOString().slice(0, 10));
        setSiteName(t.site || "");
        setRemark(t.remark || "");
        setPaymentMode(t.paymentMode || "Cash");
        setPaymentReference(t.paymentReference || "");
        setCreditedFrom(t.creditedFrom || "");
        setWorkDone(t.workDone || "");
        setLoading(false);
      },
    );
  }, [id, navigate]);

  if (loading || !txn) {
    return <p className="text-sm text-steel-400 py-10 text-center">Loading…</p>;
  }

  const account = accounts.find((a) => a.id === accountId);

  async function handleSave() {
    if (!accountId || !amount) return;
    try {
      await updateTransaction(id, {
        accountId,
        accountName: account?.name || txn.accountName,
        amount: Number(amount),
        site: siteName,
        remark: remark.trim(),
        paymentMode,
        paymentReference: paymentReference.trim(),
        creditedFrom: txn.type === "IN" ? creditedFrom.trim() : txn.creditedFrom,
        workDone: txn.type === "OUT" ? workDone.trim() : txn.workDone,
        createdAt: new Date(date + "T12:00:00").getTime(),
      });
      setSaved(true);
      setTimeout(() => navigate("/"), 900);
    } catch (e) {
      alert("Could not save: " + (e?.message || e));
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    try {
      await deleteTransaction(id);
      navigate("/");
    } catch (e) {
      alert("Could not delete: " + (e?.message || e));
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-steel-900">
          Edit {txn.type === "IN" ? "Cash In" : "Cash Out"}
        </h1>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            txn.type === "IN"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-brick-50 text-brick-600"
          }`}
        >
          {txn.type === "IN" ? "Cash In" : "Cash Out"}
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Account
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
        />
      </div>

      <PaymentModeToggle
        value={paymentMode}
        onChange={setPaymentMode}
        reference={paymentReference}
        onReferenceChange={setPaymentReference}
      />

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Amount
        </label>
        <div className="flex items-center rounded-lg border border-steel-200 bg-white px-3">
          <span className="text-steel-400 mr-1">₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 py-2.5 text-sm focus:outline-none"
          />
        </div>
      </div>

      {txn.type === "IN" ? (
        <div>
          <label className="block text-xs font-medium text-steel-500 mb-1">
            Credited From
          </label>
          <input
            value={creditedFrom}
            onChange={(e) => setCreditedFrom(e.target.value)}
            className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-steel-500 mb-1">
            Work Done
          </label>
          <input
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
          />
          <p className="text-xs text-steel-400 mt-1">
            Department / Party name can't be changed here — delete and re-add
            if that needs to change.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Work Site
        </label>
        <select
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">No site</option>
          {sites.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Remark
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!accountId || !amount}
        className="w-full rounded-xl bg-navy-700 disabled:bg-steel-300 text-white font-medium py-3 active:bg-navy-800"
      >
        Save Changes
      </button>

      {saved && (
        <p className="text-center text-emerald-600 text-sm font-medium">
          Saved ✓
        </p>
      )}

      <button
        onClick={handleDelete}
        className="w-full rounded-xl border border-brick-300 text-brick-600 font-medium py-3"
      >
        Delete Transaction
      </button>

      <button
        onClick={() => navigate("/")}
        className="w-full text-center text-sm text-steel-400 py-1"
      >
        Cancel
      </button>
    </div>
  );
}