import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CashIn from "./pages/CashIn";
import CashOut from "./pages/CashOut";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PartyLedger from "./pages/PartyLedger";
import EditTransaction from "./pages/EditTransaction";
import AccountLedger from "./pages/AccountLedger";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cash-in" element={<CashIn />} />
        <Route path="/cash-out" element={<CashOut />} />
        <Route path="/edit-transaction/:id" element={<EditTransaction />} />
        <Route path="/party-file" element={<PartyLedger />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account-ledger" element={<AccountLedger />} />
      </Route>
    </Routes>
  );
}
