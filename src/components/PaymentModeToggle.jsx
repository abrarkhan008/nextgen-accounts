export default function PaymentModeToggle({ value, onChange }) {
  const modes = ["Cash", "Online", "Cheque"]; // add or remove types here
  return (
    <div>
      <label className="block text-xs font-medium text-steel-500 mb-1">
        Payment Type
      </label>
      <div className="flex rounded-lg bg-steel-100 p-1">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              value === m
                ? "bg-white shadow-card text-navy-700"
                : "text-steel-500"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
