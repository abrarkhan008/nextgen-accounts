import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccounts,
  addAccount,
  getAccountBalance,
  getSites,
  addSite,
  getDepartments,
  addDepartment,
  addVendor,
  addTransaction,
} from "../db/storage";
import PickerWithAdd from "../components/PickerWithAdd";

export default function CashOut() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [sites, setSites] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [accountId, setAccountId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [amount, setAmount] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [siteId, setSiteId] = useState("");
  const [remark, setRemark] = useState("");
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentBalance, setCurrentBalance] = useState(null);
  const [paymentMode, setPaymentMode] = useState("Cash");

  useEffect(() => {
    getAccounts().then(setAccounts);
    getSites().then(setSites);
    getDepartments().then(setDepartments);
  }, []);
  useEffect(() => {
    if (!accountId) {
      setCurrentBalance(null);
      return;
    }
    getAccountBalance(accountId).then(setCurrentBalance);
  }, [accountId]);

  const account = accounts.find((a) => a.id === accountId);
  const department = departments.find((d) => d.id === departmentId);
  const vendors = department?.vendors || [];
  const vendor = vendors.find((v) => v.id === vendorId);
  const site = sites.find((s) => s.id === siteId);

  function reset() {
    setAmount("");
    setWorkDone("");
    setRemark("");
    setVendorId("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!accountId || !amount) return;
    try {
      await addTransaction({
        type: "OUT",
        accountId,
        accountName: account?.name || "",
        amount: Number(amount),
        paymentMode,
        department: department?.name || "",
        party: vendor?.name || "",
        partyPhone: vendor?.whatsapp || "",
        workDone: workDone.trim(),
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
        Cash Out
      </h1>

      <PickerWithAdd
        label="From Account"
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
          <span>Balance in this account</span>
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

      <PickerWithAdd
        label="Department"
        value={departmentId}
        onChange={(id) => {
          setDepartmentId(id);
          setVendorId("");
        }}
        options={departments}
        onAdd={async (name) => {
          const d = await addDepartment(name);
          setDepartments(await getDepartments());
          return d;
        }}
        placeholder="Select department"
      />

      {departmentId && (
        <PickerWithAdd
          label={`${department?.name || "Party"} Name`}
          value={vendorId}
          onChange={setVendorId}
          options={vendors}
          withPhone
          onAdd={async (name, phone) => {
            await addVendor(departmentId, name, phone);
            const updated = await getDepartments();
            setDepartments(updated);
            const dep = updated.find((d) => d.id === departmentId);
            return dep.vendors[dep.vendors.length - 1];
          }}
          placeholder="Select name"
        />
      )}

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
          <p
            className={`text-xs mt-1 ${currentBalance - Number(amount) < 0 ? "text-brick-600" : "text-steel-500"}`}
          >
            Balance after this: ₹
            {(currentBalance - Number(amount)).toLocaleString("en-IN")}
            {currentBalance - Number(amount) < 0 ? " (goes negative)" : ""}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Work Done
        </label>
        <input
          value={workDone}
          onChange={(e) => setWorkDone(e.target.value)}
          placeholder="e.g. MS Plate delivery, Fabrication work..."
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
        className="w-full rounded-xl bg-brick-600 disabled:bg-steel-300 text-white font-medium py-3 active:bg-brick-700"
      >
        Save Cash Out
      </button>

      {saved && (
        <p className="text-center text-brick-600 text-sm font-medium">
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
  function PaymentModeToggle({ value, onChange }) {
    const modes = ["Cash", "Online", "Cheque"];
    return (
      <div>
        <label className="block text-xs font-medium text-steel-500 mb-1">
          Payment Mode
        </label>
        <div className="flex gap-2">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                value === m
                  ? "bg-navy-700 text-white border-navy-700"
                  : "bg-white text-steel-600 border-steel-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
