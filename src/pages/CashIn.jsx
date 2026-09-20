import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccounts,
  addAccount,
  getAccountBalance,
  getSites,
  addSite,
  addTransaction,
} from "../db/storage";
import PickerWithAdd from "../components/PickerWithAdd";
import PaymentModeToggle from "../components/PaymentModeToggle";

export default function CashIn() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [sites, setSites] = useState([]);

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [creditedFrom, setCreditedFrom] = useState("");
  const [siteId, setSiteId] = useState("");
  const [remark, setRemark] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentBalance, setCurrentBalance] = useState(null);

  useEffect(() => {
    getAccounts().then(setAccounts);
    getSites().then(setSites);
  }, []);
  useEffect(() => {
    if (!accountId) {
      setCurrentBalance(null);
      return;
    }
    getAccountBalance(accountId).then(setCurrentBalance);
  }, [accountId]);

  const account = accounts.find((a) => a.id === accountId);
  const site = sites.find((s) => s.id === siteId);

  function reset() {
    setAmount("");
    setCreditedFrom("");
    setRemark("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!accountId || !amount) return;
    try {
      await addTransaction({
        type: "IN",
        accountId,
        accountName: account?.name || "",
        amount: Number(amount),
        paymentMode,
        creditedFrom: creditedFrom.trim(),
        site: site?.name || "",
        remark: remark.trim(),
        createdAt: new Date(date + "T12:00:00").getTime(),
      });
      setSaved(true);
      reset();
      getAccountBalance(accountId).then(setCurrentBalance);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      alert("Could not save: " + (e?.message || e));
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <h1 className="font-display text-lg font-semibold text-steel-900">
        Cash In
      </h1>

      <PickerWithAdd
        label="Account"
        value={accountId}
        onChange={setAccountId}
        options={accounts}
        onAdd={async (name) => {
          const a = await addAccount(name);
          setAccounts(await getAccounts());
          return a;
        }}
        placeholder="Select account"
      />

      {accountId && currentBalance !== null && (
        <div className="rounded-lg bg-navy-50 border border-navy-100 px-3 py-2 text-sm text-navy-700 flex justify-between">
          <span>Current balance</span>
          <span className="font-semibold">
            ₹{currentBalance.toLocaleString("en-IN")}
          </span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
      </div>
      <PaymentModeToggle value={paymentMode} onChange={setPaymentMode} />

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
            placeholder="0"
            className="flex-1 py-2.5 text-sm focus:outline-none"
          />
        </div>
        {accountId && amount && currentBalance !== null && (
          <p className="text-xs text-emerald-600 mt-1">
            New balance: ₹
            {(currentBalance + Number(amount)).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Credited From
        </label>
        <input
          value={creditedFrom}
          onChange={(e) => setCreditedFrom(e.target.value)}
          placeholder="e.g. Site collection, Bank transfer..."
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
      </div>

      <PickerWithAdd
        label="Work Site"
        value={siteId}
        onChange={setSiteId}
        options={sites}
        onAdd={async (name) => {
          const s = await addSite(name);
          setSites(await getSites());
          return s;
        }}
        placeholder="Select site"
      />

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Remark
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          placeholder="Note..."
          className="w-full rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!accountId || !amount}
        className="w-full rounded-xl bg-emerald-600 disabled:bg-steel-300 text-white font-medium py-3 active:bg-emerald-700"
      >
        Save Cash In
      </button>

      {saved && (
        <p className="text-center text-emerald-600 text-sm font-medium">
          Saved ✓
        </p>
      )}

      <button
        onClick={() => navigate("/")}
        className="w-full text-center text-sm text-steel-400 py-1"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
