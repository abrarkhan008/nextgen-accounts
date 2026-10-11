// // ============================================================================
// // NextGen Accounts — Data Layer (real SQLite on the phone)
// // ----------------------------------------------------------------------------
// // On an installed Android app, every function below reads/writes a real
// // SQLite database file on the device (via @capacitor-community/sqlite).
// // While you are testing in a normal web browser (`npm run dev`), there is no
// // SQLite engine available, so this file automatically falls back to
// // localStorage instead — same functions, same behaviour, just a different
// // engine underneath. You never have to think about which one is active;
// // every screen just calls these functions and "await"s the answer.
// // ============================================================================

// import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
// import { Capacitor } from "@capacitor/core";

// const DB_NAME = "nextgen_accounts";
// let db = null;
// let sqlite = null;
// const isNative = () => Capacitor.isNativePlatform();

// function uid() {
//   return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// }

// // ---------------------------------------------------------------------------
// // Web fallback (used only inside a normal browser during development)
// // ---------------------------------------------------------------------------
// const LS_KEYS = {
//   ACCOUNTS: "ng_accounts",
//   SITES: "ng_sites",
//   DEPARTMENTS: "ng_departments",
//   TRANSACTIONS: "ng_transactions",
//   META: "ng_meta",
// };

// function lsRead(key, fallback) {
//   try {
//     const raw = localStorage.getItem(key);
//     return raw ? JSON.parse(raw) : fallback;
//   } catch {
//     return fallback;
//   }
// }
// function lsWrite(key, value) {
//   localStorage.setItem(key, JSON.stringify(value));
// }

// // ---------------------------------------------------------------------------
// // Initialization
// // ---------------------------------------------------------------------------
// export async function initDatabase() {
//   if (!isNative()) {
//     // Browser dev mode: seed localStorage once, nothing else to do.
//     if (lsRead(LS_KEYS.ACCOUNTS, null) === null) {
//       lsWrite(LS_KEYS.ACCOUNTS, [
//         { id: uid(), name: "Rizwan", isOwner: 1 },
//         { id: uid(), name: "Amith", isOwner: 0 },
//         { id: uid(), name: "Yaseen", isOwner: 0 },
//         { id: uid(), name: "Salman", isOwner: 0 },
//         { id: uid(), name: "Abrar", isOwner: 0 },
//       ]);
//     }
//     if (lsRead(LS_KEYS.SITES, null) === null) {
//       lsWrite(LS_KEYS.SITES, [
//         { id: uid(), name: "Bogadi" },
//         { id: uid(), name: "Nararyan" },
//         { id: uid(), name: "Surya" },
//       ]);
//     }
//     if (lsRead(LS_KEYS.DEPARTMENTS, null) === null) {
//       lsWrite(LS_KEYS.DEPARTMENTS, [
//         { id: uid(), name: "Fabricators", vendors: [] },
//         { id: uid(), name: "Suppliers", vendors: [] },
//         { id: uid(), name: "Others", vendors: [] },
//       ]);
//     }
//     if (lsRead(LS_KEYS.TRANSACTIONS, null) === null)
//       lsWrite(LS_KEYS.TRANSACTIONS, []);
//     if (lsRead(LS_KEYS.META, null) === null)
//       lsWrite(LS_KEYS.META, {
//         companyName: "NextGen PreFab",
//         lastBackup: null,
//         lastDriveBackup: null,
//       });
//     return;
//   }

//   // Native (Android app): open / create the real SQLite database file.
//   sqlite = new SQLiteConnection(CapacitorSQLite);
//   const ret = await sqlite.checkConnectionsConsistency();
//   const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
//   db =
//     ret.result && isConn
//       ? await sqlite.retrieveConnection(DB_NAME, false)
//       : await sqlite.createConnection(
//           DB_NAME,
//           false,
//           "no-encryption",
//           1,
//           false,
//         );

//   await db.open();
//   await db.execute(`
//     CREATE TABLE IF NOT EXISTS accounts (
//       id TEXT PRIMARY KEY, name TEXT NOT NULL, isOwner INTEGER DEFAULT 0
//     );
//     CREATE TABLE IF NOT EXISTS sites (
//       id TEXT PRIMARY KEY, name TEXT NOT NULL
//     );
//     CREATE TABLE IF NOT EXISTS departments (
//       id TEXT PRIMARY KEY, name TEXT NOT NULL
//     );
//        CREATE TABLE IF NOT EXISTS vendors (
//       id TEXT PRIMARY KEY, departmentId TEXT NOT NULL, name TEXT NOT NULL, whatsapp TEXT
//     );
//        CREATE TABLE IF NOT EXISTS transactions (
//       id TEXT PRIMARY KEY, type TEXT NOT NULL, accountId TEXT, accountName TEXT,
//       amount REAL, department TEXT, party TEXT, partyPhone TEXT, workDone TEXT, site TEXT,
//       remark TEXT, creditedFrom TEXT, createdAt INTEGER
//     );
//     CREATE TABLE IF NOT EXISTS meta (
//       key TEXT PRIMARY KEY, value TEXT
//     );
//   `);
//   // Fix for old databases: add missing columns (safe to run every time)
//   for (const sql of [
//     "ALTER TABLE transactions ADD COLUMN partyPhone TEXT",
//     "ALTER TABLE transactions ADD COLUMN paymentMode TEXT",
//     "ALTER TABLE transactions ADD COLUMN paymentReference TEXT",
//     "ALTER TABLE vendors ADD COLUMN whatsapp TEXT",
//   ]) {
//     try {
//       await db.execute(sql);
//     } catch (e) {
//       // column already exists, that is fine
//     }
//   }

//   const accCount = (await db.query("SELECT COUNT(*) as c FROM accounts"))
//     .values[0].c;
//   if (accCount === 0) {
//     const seedAccounts = ["Rizwan", "Amith", "Yaseen", "Salman", "Abrar"];
//     for (let i = 0; i < seedAccounts.length; i++) {
//       await db.run(
//         "INSERT INTO accounts (id, name, isOwner) VALUES (?, ?, ?)",
//         [uid(), seedAccounts[i], i === 0 ? 1 : 0],
//       );
//     }
//     for (const s of ["Bogadi", "Nararyan", "Surya"]) {
//       await db.run("INSERT INTO sites (id, name) VALUES (?, ?)", [uid(), s]);
//     }
//     for (const d of ["Fabricators", "Suppliers", "Others"]) {
//       await db.run("INSERT INTO departments (id, name) VALUES (?, ?)", [
//         uid(),
//         d,
//       ]);
//     }
//     await db.run("INSERT INTO meta (key, value) VALUES (?, ?)", [
//       "companyName",
//       "NextGen PreFab",
//     ]);
//   }
// }

// // ---------------------------------------------------------------------------
// // Accounts
// // ---------------------------------------------------------------------------
// export async function getAccounts() {
//   if (!isNative()) return lsRead(LS_KEYS.ACCOUNTS, []);
//   return (await db.query("SELECT * FROM accounts")).values || [];
// }
// export async function addAccount(name) {
//   const acc = { id: uid(), name: name.trim(), isOwner: 0 };
//   if (!isNative()) {
//     const list = lsRead(LS_KEYS.ACCOUNTS, []);
//     list.push(acc);
//     lsWrite(LS_KEYS.ACCOUNTS, list);
//     return acc;
//   }
//   await db.run("INSERT INTO accounts (id, name, isOwner) VALUES (?, ?, ?)", [
//     acc.id,
//     acc.name,
//     0,
//   ]);
//   return acc;
// }
// export async function deleteAccount(id) {
//   if (!isNative())
//     return lsWrite(
//       LS_KEYS.ACCOUNTS,
//       lsRead(LS_KEYS.ACCOUNTS, []).filter((a) => a.id !== id),
//     );
//   await db.run("DELETE FROM accounts WHERE id = ?", [id]);
// }

// export async function getAccountBalance(accountId) {
//   const txns = await getTransactions();
//   let bal = 0;
//   for (const t of txns) {
//     if (t.type === "IN" && t.accountId === accountId) bal += t.amount;
//     if (t.type === "OUT" && t.accountId === accountId) bal -= t.amount;
//   }
//   return bal;
// }

// // ---------------------------------------------------------------------------
// // Sites
// // ---------------------------------------------------------------------------
// export async function getSites() {
//   if (!isNative()) return lsRead(LS_KEYS.SITES, []);
//   return (await db.query("SELECT * FROM sites")).values || [];
// }
// export async function addSite(name) {
//   const site = { id: uid(), name: name.trim() };
//   if (!isNative()) {
//     const list = lsRead(LS_KEYS.SITES, []);
//     list.push(site);
//     lsWrite(LS_KEYS.SITES, list);
//     return site;
//   }
//   await db.run("INSERT INTO sites (id, name) VALUES (?, ?)", [
//     site.id,
//     site.name,
//   ]);
//   return site;
// }
// export async function deleteSite(id) {
//   if (!isNative())
//     return lsWrite(
//       LS_KEYS.SITES,
//       lsRead(LS_KEYS.SITES, []).filter((s) => s.id !== id),
//     );
//   await db.run("DELETE FROM sites WHERE id = ?", [id]);
// }

// // ---------------------------------------------------------------------------
// // Departments + vendors (nested, so departments come back with a .vendors array)
// // ---------------------------------------------------------------------------
// export async function getDepartments() {
//   if (!isNative()) return lsRead(LS_KEYS.DEPARTMENTS, []);
//   const deps = (await db.query("SELECT * FROM departments")).values || [];
//   const vendors = (await db.query("SELECT * FROM vendors")).values || [];
//   return deps.map((d) => ({
//     ...d,
//     vendors: vendors.filter((v) => v.departmentId === d.id),
//   }));
// }
// export async function addDepartment(name) {
//   const dep = { id: uid(), name: name.trim(), vendors: [] };
//   if (!isNative()) {
//     const list = lsRead(LS_KEYS.DEPARTMENTS, []);
//     list.push(dep);
//     lsWrite(LS_KEYS.DEPARTMENTS, list);
//     return dep;
//   }
//   await db.run("INSERT INTO departments (id, name) VALUES (?, ?)", [
//     dep.id,
//     dep.name,
//   ]);
//   return dep;
// }
// export async function deleteDepartment(id) {
//   if (!isNative())
//     return lsWrite(
//       LS_KEYS.DEPARTMENTS,
//       lsRead(LS_KEYS.DEPARTMENTS, []).filter((d) => d.id !== id),
//     );
//   await db.run("DELETE FROM vendors WHERE departmentId = ?", [id]);
//   await db.run("DELETE FROM departments WHERE id = ?", [id]);
// }
// export async function addVendor(departmentId, vendorName, whatsapp = "") {
//   const vendor = {
//     id: uid(),
//     name: vendorName.trim(),
//     whatsapp: (whatsapp || "").trim(),
//   };
//   if (!isNative()) {
//     const deps = lsRead(LS_KEYS.DEPARTMENTS, []);
//     const dep = deps.find((d) => d.id === departmentId);
//     if (!dep) return null;
//     dep.vendors.push(vendor);
//     lsWrite(LS_KEYS.DEPARTMENTS, deps);
//     return vendor;
//   }
//   await db.run(
//     "INSERT INTO vendors (id, departmentId, name, whatsapp) VALUES (?, ?, ?, ?)",
//     [vendor.id, departmentId, vendor.name, vendor.whatsapp],
//   );
//   return vendor;
// }
// export async function updateVendorPhone(departmentId, vendorId, whatsapp) {
//   if (!isNative()) {
//     const deps = lsRead(LS_KEYS.DEPARTMENTS, []);
//     const dep = deps.find((d) => d.id === departmentId);
//     const v = dep?.vendors.find((v) => v.id === vendorId);
//     if (v) v.whatsapp = (whatsapp || "").trim();
//     lsWrite(LS_KEYS.DEPARTMENTS, deps);
//     return;
//   }
//   await db.run("UPDATE vendors SET whatsapp = ? WHERE id = ?", [
//     (whatsapp || "").trim(),
//     vendorId,
//   ]);
// }

// export async function deleteVendor(departmentId, vendorId) {
//   if (!isNative()) {
//     const deps = lsRead(LS_KEYS.DEPARTMENTS, []);
//     const dep = deps.find((d) => d.id === departmentId);
//     if (dep) dep.vendors = dep.vendors.filter((v) => v.id !== vendorId);
//     return lsWrite(LS_KEYS.DEPARTMENTS, deps);
//   }
//   await db.run("DELETE FROM vendors WHERE id = ?", [vendorId]);
// }

// // ---------------------------------------------------------------------------
// // Transactions
// // ---------------------------------------------------------------------------
// export async function getTransactions() {
//   if (!isNative())
//     return lsRead(LS_KEYS.TRANSACTIONS, []).sort(
//       (a, b) => b.createdAt - a.createdAt,
//     );
//   return (
//     (await db.query("SELECT * FROM transactions ORDER BY createdAt DESC"))
//       .values || []
//   );
// }

// export async function addTransaction(txn) {
//   const record = {
//     id: uid(),
//     createdAt: Date.now(),
//     ...txn,
//     partyPhone: txn.partyPhone || "",
//   };
//   if (!isNative()) {
//     const list = lsRead(LS_KEYS.TRANSACTIONS, []);
//     list.push(record);
//     lsWrite(LS_KEYS.TRANSACTIONS, list);
//     return record;
//   }
//   await db.run(
//     `INSERT INTO transactions
//      (id, type, accountId, accountName, amount, department, party, partyPhone, workDone, site, remark, creditedFrom, paymentMode, paymentReference, createdAt)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       record.id,
//       record.type,
//       record.accountId || null,
//       record.accountName || "",
//       record.amount || 0,
//       record.department || "",
//       record.party || "",
//       record.partyPhone || "",
//       record.workDone || "",
//       record.site || "",
//       record.remark || "",
//       record.creditedFrom || "",
//       record.paymentMode || "",
//       record.paymentReference || "",
//       record.createdAt,
//     ],
//   );
//   return record;
// }
// export async function deleteTransaction(id) {
//   if (!isNative())
//     return lsWrite(
//       LS_KEYS.TRANSACTIONS,
//       lsRead(LS_KEYS.TRANSACTIONS, []).filter((t) => t.id !== id),
//     );
//   await db.run("DELETE FROM transactions WHERE id = ?", [id]);
// }
// export async function getTransactionById(id) {
//   if (!isNative())
//     return lsRead(LS_KEYS.TRANSACTIONS, []).find((t) => t.id === id) || null;
//   const rows =
//     (await db.query("SELECT * FROM transactions WHERE id = ?", [id])).values ||
//     [];
//   return rows[0] || null;
// }

// export async function updateTransaction(id, patch) {
//   const existing = await getTransactionById(id);
//   if (!existing) return null;
//   const merged = { ...existing, ...patch };

//   if (!isNative()) {
//     const list = lsRead(LS_KEYS.TRANSACTIONS, []);
//     const idx = list.findIndex((t) => t.id === id);
//     if (idx === -1) return null;
//     list[idx] = merged;
//     lsWrite(LS_KEYS.TRANSACTIONS, list);
//     return merged;
//   }

//   await db.run(
//     `UPDATE transactions SET
//        type = ?, accountId = ?, accountName = ?, amount = ?, department = ?,
//        party = ?, partyPhone = ?, workDone = ?, site = ?, remark = ?,
//        creditedFrom = ?, paymentMode = ?, paymentReference = ?, createdAt = ?
//      WHERE id = ?`,
//     [
//       merged.type,
//       merged.accountId || null,
//       merged.accountName || "",
//       merged.amount || 0,
//       merged.department || "",
//       merged.party || "",
//       merged.partyPhone || "",
//       merged.workDone || "",
//       merged.site || "",
//       merged.remark || "",
//       merged.creditedFrom || "",
//       merged.paymentMode || "",
//       merged.paymentReference || "",
//       merged.createdAt,
//       id,
//     ],
//   );
//   return merged;
// }

// export async function getTodayTotals() {
//   const start = new Date();
//   start.setHours(0, 0, 0, 0);
//   const txns = (await getTransactions()).filter(
//     (t) => t.createdAt >= start.getTime(),
//   );
//   const cashIn = txns
//     .filter((t) => t.type === "IN")
//     .reduce((s, t) => s + t.amount, 0);
//   const cashOut = txns
//     .filter((t) => t.type === "OUT")
//     .reduce((s, t) => s + t.amount, 0);
//   return { cashIn, cashOut, balance: cashIn - cashOut };
// }
// export async function getOverallTotals() {
//   const txns = await getTransactions();
//   const cashIn = txns
//     .filter((t) => t.type === "IN")
//     .reduce((s, t) => s + t.amount, 0);
//   const cashOut = txns
//     .filter((t) => t.type === "OUT")
//     .reduce((s, t) => s + t.amount, 0);
//   return { cashIn, cashOut, balance: cashIn - cashOut };
// }
// export async function searchTransactions(query) {
//   const q = query.trim().toLowerCase();
//   const all = await getTransactions();
//   if (!q) return all;
//   return all.filter((t) => {
//     const haystack = [
//       t.accountName,
//       t.party,
//       t.site,
//       t.department,
//       t.remark,
//       t.workDone,
//       t.creditedFrom,
//       t.paymentMode,
//       new Date(t.createdAt).toLocaleDateString("en-GB"),
//     ]
//       .filter(Boolean)
//       .join(" ")
//       .toLowerCase();
//     return haystack.includes(q);
//   });
// }
// export async function getTransactionsByMonth(year, month) {
//   const all = await getTransactions();
//   return all.filter((t) => {
//     const d = new Date(t.createdAt);
//     return d.getFullYear() === year && d.getMonth() === month;
//   });
// }
// export async function getTransactionsByYear(year) {
//   const all = await getTransactions();
//   return all.filter((t) => new Date(t.createdAt).getFullYear() === year);
// }

// // ---------------------------------------------------------------------------
// // Meta / settings (also stores backup timestamps)
// // ---------------------------------------------------------------------------
// export async function getMeta() {
//   if (!isNative())
//     return lsRead(LS_KEYS.META, {
//       companyName: "NextGen PreFab",
//       lastBackup: null,
//       lastDriveBackup: null,
//     });
//   const rows = (await db.query("SELECT * FROM meta")).values || [];
//   const obj = {
//     companyName: "NextGen PreFab",
//     lastBackup: null,
//     lastDriveBackup: null,
//   };
//   rows.forEach((r) => {
//     obj[r.key] = r.value;
//   });
//   return obj;
// }
// export async function setMeta(patch) {
//   if (!isNative()) {
//     const meta = { ...(await getMeta()), ...patch };
//     lsWrite(LS_KEYS.META, meta);
//     return meta;
//   }
//   for (const [key, value] of Object.entries(patch)) {
//     await db.run("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [
//       key,
//       String(value),
//     ]);
//   }
//   return getMeta();
// }

// // ---------------------------------------------------------------------------
// // Full export / import — used by both the "share as file" backup and the
// // "Backup to Google Drive" button. This is a plain JSON snapshot of every
// // table, so restoring it works the same way no matter where the file came
// // from (Drive, WhatsApp, email, a USB cable, anything).
// // ---------------------------------------------------------------------------
// export async function exportAllData() {
//   return {
//     exportedAt: new Date().toISOString(),
//     accounts: await getAccounts(),
//     sites: await getSites(),
//     departments: await getDepartments(),
//     transactions: await getTransactions(),
//     meta: await getMeta(),
//   };
// }

// export async function importAllData(data) {
//   if (!data || typeof data !== "object") throw new Error("Invalid backup file");

//   if (!isNative()) {
//     if (data.accounts) lsWrite(LS_KEYS.ACCOUNTS, data.accounts);
//     if (data.sites) lsWrite(LS_KEYS.SITES, data.sites);
//     if (data.departments) lsWrite(LS_KEYS.DEPARTMENTS, data.departments);
//     if (data.transactions) lsWrite(LS_KEYS.TRANSACTIONS, data.transactions);
//     if (data.meta) lsWrite(LS_KEYS.META, data.meta);
//     return;
//   }

//   // Native: wipe every table, then reinsert everything from the backup file.
//   await db.run("DELETE FROM accounts");
//   await db.run("DELETE FROM sites");
//   await db.run("DELETE FROM vendors");
//   await db.run("DELETE FROM departments");
//   await db.run("DELETE FROM transactions");

//   for (const a of data.accounts || [])
//     await db.run("INSERT INTO accounts (id, name, isOwner) VALUES (?, ?, ?)", [
//       a.id,
//       a.name,
//       a.isOwner ? 1 : 0,
//     ]);
//   for (const s of data.sites || [])
//     await db.run("INSERT INTO sites (id, name) VALUES (?, ?)", [s.id, s.name]);
//   for (const d of data.departments || []) {
//     await db.run("INSERT INTO departments (id, name) VALUES (?, ?)", [
//       d.id,
//       d.name,
//     ]);
//     for (const v of d.vendors || [])
//       await db.run(
//         "INSERT INTO vendors (id, departmentId, name, whatsapp) VALUES (?, ?, ?, ?)",
//         [v.id, d.id, v.name, v.whatsapp || ""],
//       );
//   }
//   for (const t of data.transactions || []) {
//     await db.run(
//       `INSERT INTO transactions (id, type, accountId, accountName, amount, department, party, partyPhone, workDone, site, remark, creditedFrom, paymentMode, paymentReference, createdAt)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         t.id,
//         t.type,
//         t.accountId || null,
//         t.accountName || "",
//         t.amount || 0,
//         t.department || "",
//         t.party || "",
//         t.partyPhone || "",
//         t.workDone || "",
//         t.site || "",
//         t.remark || "",
//         t.creditedFrom || "",
//         t.paymentMode || "",
//         t.paymentReference || "",
//         t.createdAt,
//       ],
//     );
//   }
//   if (data.meta) await setMeta(data.meta);
// }

// NextGen Accounts — Data Layer (shared online database)
// All 3 users read/write the same data through the server.

const API_URL = "https://nextgen-server-4w4w.onrender.com"; // <-- change this
const APP_KEY = "Nextgenprefab2026"; // <-- same as Render APP_KEY

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API_URL + "/api" + path, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", "x-app-key": APP_KEY },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(
      "No internet, or server is waking up. Try again in a minute.",
    );
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    let m = "Server error";
    try {
      m = (await res.json()).error || m;
    } catch {}
    throw new Error(m);
  }
  return res.json();
}

// Wakes up the free server (can take up to a minute the first time)
export async function initDatabase() {
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(API_URL + "/health");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 5000));
  }
}

// ---------------- Accounts ----------------
export async function getAccounts() {
  return (await api("/accounts")) || [];
}
export async function addAccount(name) {
  const acc = { id: uid(), name: name.trim(), isOwner: 0 };
  await api(`/accounts/${acc.id}`, { method: "PUT", body: acc });
  return acc;
}
export async function deleteAccount(id) {
  await api(`/accounts/${id}`, { method: "DELETE" });
}
export async function getAccountBalance(accountId) {
  const txns = await getTransactions();
  let bal = 0;
  for (const t of txns) {
    if (t.type === "IN" && t.accountId === accountId) bal += t.amount;
    if (t.type === "OUT" && t.accountId === accountId) bal -= t.amount;
  }
  return bal;
}

// ---------------- Sites ----------------
export async function getSites() {
  return (await api("/sites")) || [];
}
export async function addSite(name) {
  const site = { id: uid(), name: name.trim() };
  await api(`/sites/${site.id}`, { method: "PUT", body: site });
  return site;
}
export async function deleteSite(id) {
  await api(`/sites/${id}`, { method: "DELETE" });
}

// ---------------- Departments + vendors ----------------
export async function getDepartments() {
  const [deps, vendors] = await Promise.all([
    api("/departments"),
    api("/vendors"),
  ]);
  return (deps || []).map((d) => ({
    ...d,
    vendors: (vendors || []).filter((v) => v.departmentId === d.id),
  }));
}
export async function addDepartment(name) {
  const dep = { id: uid(), name: name.trim() };
  await api(`/departments/${dep.id}`, { method: "PUT", body: dep });
  return { ...dep, vendors: [] };
}
export async function deleteDepartment(id) {
  const vendors = (await api("/vendors")) || [];
  for (const v of vendors.filter((v) => v.departmentId === id))
    await api(`/vendors/${v.id}`, { method: "DELETE" });
  await api(`/departments/${id}`, { method: "DELETE" });
}
export async function addVendor(departmentId, vendorName, whatsapp = "") {
  const vendor = {
    id: uid(),
    departmentId,
    name: vendorName.trim(),
    whatsapp: (whatsapp || "").trim(),
  };
  await api(`/vendors/${vendor.id}`, { method: "PUT", body: vendor });
  return vendor;
}
export async function updateVendorPhone(departmentId, vendorId, whatsapp) {
  const v = await api(`/vendors/${vendorId}`);
  if (!v) return;
  await api(`/vendors/${vendorId}`, {
    method: "PUT",
    body: { ...v, whatsapp: (whatsapp || "").trim() },
  });
}
export async function deleteVendor(departmentId, vendorId) {
  await api(`/vendors/${vendorId}`, { method: "DELETE" });
}

// ---------------- Transactions ----------------
export async function getTransactions() {
  const list = (await api("/transactions")) || [];
  return list.sort((a, b) => b.createdAt - a.createdAt);
}
export async function addTransaction(txn) {
  const record = {
    id: uid(),
    createdAt: Date.now(),
    ...txn,
    partyPhone: txn.partyPhone || "",
  };
  await api(`/transactions/${record.id}`, { method: "PUT", body: record });
  return record;
}
export async function deleteTransaction(id) {
  await api(`/transactions/${id}`, { method: "DELETE" });
}
export async function getTransactionById(id) {
  return await api(`/transactions/${id}`);
}
export async function updateTransaction(id, patch) {
  const existing = await getTransactionById(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  await api(`/transactions/${id}`, { method: "PUT", body: merged });
  return merged;
}

export async function getTodayTotals() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const txns = (await getTransactions()).filter(
    (t) => t.createdAt >= start.getTime(),
  );
  const cashIn = txns
    .filter((t) => t.type === "IN")
    .reduce((s, t) => s + t.amount, 0);
  const cashOut = txns
    .filter((t) => t.type === "OUT")
    .reduce((s, t) => s + t.amount, 0);
  return { cashIn, cashOut, balance: cashIn - cashOut };
}
export async function getOverallTotals() {
  const txns = await getTransactions();
  const cashIn = txns
    .filter((t) => t.type === "IN")
    .reduce((s, t) => s + t.amount, 0);
  const cashOut = txns
    .filter((t) => t.type === "OUT")
    .reduce((s, t) => s + t.amount, 0);
  return { cashIn, cashOut, balance: cashIn - cashOut };
}
export async function searchTransactions(query) {
  const q = query.trim().toLowerCase();
  const all = await getTransactions();
  if (!q) return all;
  return all.filter((t) => {
    const haystack = [
      t.accountName,
      t.party,
      t.site,
      t.department,
      t.remark,
      t.workDone,
      t.creditedFrom,
      t.paymentMode,
      new Date(t.createdAt).toLocaleDateString("en-GB"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
export async function getTransactionsByMonth(year, month) {
  const all = await getTransactions();
  return all.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
export async function getTransactionsByYear(year) {
  const all = await getTransactions();
  return all.filter((t) => new Date(t.createdAt).getFullYear() === year);
}

// ---------------- Meta ----------------
export async function getMeta() {
  const saved = (await api("/meta/main")) || {};
  return {
    companyName: "NextGen PreFab",
    lastBackup: null,
    lastDriveBackup: null,
    ...saved,
  };
}
export async function setMeta(patch) {
  const merged = { ...(await getMeta()), ...patch };
  await api("/meta/main", { method: "PUT", body: merged });
  return merged;
}

// ---------------- Export / Import (Drive + file backups use these) ----------------
export async function exportAllData() {
  return {
    exportedAt: new Date().toISOString(),
    accounts: await getAccounts(),
    sites: await getSites(),
    departments: await getDepartments(),
    transactions: await getTransactions(),
    meta: await getMeta(),
  };
}
export async function importAllData(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid backup file");
  await api("/import", { method: "POST", body: data });
}
