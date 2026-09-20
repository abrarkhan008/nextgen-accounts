import { useState } from "react";

export default function PickerWithAdd({
  label,
  value,
  onChange,
  options,
  onAdd,
  placeholder = "Select",
  withPhone = false,
}) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitAdd() {
    const trimmed = newVal.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    setBusy(true);
    const created = await onAdd(trimmed, newPhone.trim());
    onChange(created?.id || trimmed);
    setNewVal("");
    setNewPhone("");
    setAdding(false);
    setBusy(false);
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-steel-500 mb-1">
          {label}
        </label>
      )}
      {!adding ? (
        <div className="flex gap-2">
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
          >
            <option value="">{placeholder}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-11 rounded-lg bg-navy-700 text-white text-xl font-medium flex items-center justify-center active:bg-navy-800"
            aria-label={`Add new ${label || "item"}`}
          >
            +
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !withPhone && submitAdd()}
              placeholder={`New ${label ? label.toLowerCase() : "name"}`}
              className="flex-1 rounded-lg border border-navy-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
            />
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewVal("");
                setNewPhone("");
              }}
              className="w-11 rounded-lg bg-steel-200 text-steel-600 text-sm"
            >
              ✕
            </button>
          </div>
          {withPhone && (
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              placeholder="WhatsApp number (optional, one-time)"
              className="w-full rounded-lg border border-navy-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
            />
          )}
          <button
            type="button"
            disabled={busy}
            onClick={submitAdd}
            className="w-full rounded-lg bg-brick-600 text-white text-sm font-medium py-2 active:bg-brick-700 disabled:opacity-60"
          >
            {busy ? "…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
