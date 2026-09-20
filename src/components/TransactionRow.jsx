import { useState } from "react";
import { shareTransactionOnWhatsApp } from "../utils/whatsapp";

export default function TransactionRow({ t }) {
  const [showShare, setShowShare] = useState(false);
  const [phone, setPhone] = useState(t.partyPhone || "");
  const isIn = t.type === "IN";
  const date = new Date(t.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="rounded-xl bg-white border border-steel-200 p-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-steel-900">
            {isIn
              ? t.accountName
              : `${t.accountName} → ${t.party || t.department || ""}`}
          </p>
          <p className="text-xs text-steel-400 mt-0.5">
            {date}
            {t.paymentMode ? ` · ${t.paymentMode}` : ""}
            {t.site ? ` · ${t.site}` : ""}
          </p>
          {isIn && t.creditedFrom && (
            <p className="text-xs text-steel-500 mt-0.5">
              Credited from: {t.creditedFrom}
            </p>
          )}
          {t.remark && (
            <p className="text-xs text-steel-400 mt-0.5 italic">"{t.remark}"</p>
          )}
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${isIn ? "text-emerald-600" : "text-brick-600"}`}
          >
            {isIn ? "+" : "−"}₹{t.amount.toLocaleString("en-IN")}
          </p>
          <button
            onClick={() => setShowShare((s) => !s)}
            className="text-[11px] text-navy-500 mt-1 underline underline-offset-2"
          >
            Share
          </button>
        </div>
      </div>

      {showShare && (
        <div className="mt-2 pt-2 border-t border-steel-100 flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            className="flex-1 rounded-lg border border-steel-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy-400"
          />
          <button
            onClick={() => shareTransactionOnWhatsApp(t, phone)}
            className="rounded-lg bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 active:bg-emerald-700"
          >
            WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
