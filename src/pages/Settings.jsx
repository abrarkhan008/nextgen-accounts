import { useEffect, useRef, useState } from "react";
import {
  getAccounts,
  addAccount,
  deleteAccount,
  getSites,
  addSite,
  deleteSite,
  getDepartments,
  addDepartment,
  deleteDepartment,
  addVendor,
  deleteVendor,
  updateVendorPhone,
  getMeta,
  exportAllData,
  importAllData,
  setMeta,
} from "../db/storage";
import {
  backupToLocalFile,
  restoreFromFile,
  backupFileName,
} from "../utils/backup";
import {
  isSignedIn,
  signIn,
  signOut,
  uploadBackupToDrive,
  listDriveBackups,
  downloadDriveBackup,
} from "../utils/googleDrive";
import { Capacitor } from "@capacitor/core";

export default function Settings() {
  const [accounts, setAccounts] = useState([]);
  const [sites, setSites] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [meta, setMetaState] = useState({
    lastBackup: null,
    lastDriveBackup: null,
  });
  const [newAccount, setNewAccount] = useState("");
  const [newSite, setNewSite] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newVendorFor, setNewVendorFor] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [driveList, setDriveList] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const fileRef = useRef(null);
  const isNative = Capacitor.isNativePlatform();

  async function refreshAll() {
    setAccounts(await getAccounts());
    setSites(await getSites());
    setDepartments(await getDepartments());
    setMetaState(await getMeta());
    setSignedIn(isSignedIn());
  }
  useEffect(() => {
    refreshAll();
  }, []);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 4000);
  }

  // --- Local file backup (works with no internet, second safety net) ------
  async function handleLocalBackup() {
    setBusy(true);
    try {
      await backupToLocalFile();
      flash("Backup file saved.");
      await refreshAll();
    } catch (e) {
      flash("Backup failed: " + e.message);
    }
    setBusy(false);
  }
  async function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await restoreFromFile(file);
      await refreshAll();
      flash("Backup restored successfully.");
    } catch {
      flash("Could not read that backup file.");
    }
    e.target.value = "";
  }

  // --- Google Drive backup (the real thing) --------------------------------
  async function handleGoogleSignIn() {
    setBusy(true);
    try {
      await signIn();
      setSignedIn(true);
      flash("Signed in to Google.");
    } catch (e) {
      flash(e.message);
    }
    setBusy(false);
  }
  function handleGoogleSignOut() {
    signOut();
    setSignedIn(false);
    setDriveList(null);
    flash("Signed out.");
  }
  async function handleDriveBackup() {
    setBusy(true);
    try {
      const data = await exportAllData();
      await uploadBackupToDrive(
        JSON.stringify(data, null, 2),
        backupFileName(),
      );
      await setMeta({ lastDriveBackup: new Date().toISOString() });
      await refreshAll();
      flash("Saved to Google Drive ✓");
    } catch (e) {
      flash(e.message);
    }
    setBusy(false);
  }
  async function handleShowDriveBackups() {
    setBusy(true);
    try {
      setDriveList(await listDriveBackups());
    } catch (e) {
      flash(e.message);
    }
    setBusy(false);
  }
  async function handleRestoreFromDrive(fileId) {
    setBusy(true);
    try {
      const data = await downloadDriveBackup(fileId);
      await importAllData(data);
      await refreshAll();
      setDriveList(null);
      flash("Restored from Google Drive ✓");
    } catch (e) {
      flash(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <h1 className="font-display text-lg font-semibold text-steel-900">
        Settings
      </h1>

      {/* Google Drive backup */}
      <Section title="Backup to Google Drive">
        <p className="text-xs text-steel-500 mb-3">
          Last Google Drive backup:{" "}
          {meta.lastDriveBackup
            ? new Date(meta.lastDriveBackup).toLocaleString("en-IN")
            : "Never"}
        </p>
        {/* 
        {!isNative && (
          <p className="text-xs text-brick-600 bg-brick-50 border border-brick-100 rounded-lg p-2 mb-3">
            Google sign-in only works in the installed Android app, not this
            browser preview.
          </p>
        )} */}

        {!signedIn && (
          <button
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="w-full rounded-xl bg-white border border-steel-300 text-steel-800 text-sm font-medium py-3 disabled:opacity-60"
          >
            Sign in with Google
          </button>
        )}

               {signedIn && (
          <div className="space-y-2">
            <button
              onClick={handleDriveBackup}
              disabled={busy}
              className="w-full rounded-xl bg-navy-700 text-white text-sm font-medium py-3 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save Backup to Google Drive"}
            </button>
            <button
              onClick={handleShowDriveBackups}
              disabled={busy}
              className="w-full rounded-xl border border-navy-300 text-navy-700 text-sm font-medium py-3 disabled:opacity-60"
            >
              Restore from Google Drive
            </button>
            <button
              onClick={handleGoogleSignOut}
              className="w-full text-center text-xs text-steel-400 py-1"
            >
              Sign out of Google
            </button>
          </div>
        )}

        {driveList && (
          <div className="mt-3 space-y-2">
            {driveList.length === 0 && (
              <p className="text-xs text-steel-400">
                No backups found in Drive yet.
              </p>
            )}
            {driveList.map((f) => (
              <button
                key={f.id}
                onClick={() => handleRestoreFromDrive(f.id)}
                className="w-full text-left rounded-lg border border-steel-200 px-3 py-2 text-sm hover:bg-steel-50"
              >
                <p className="text-steel-800">{f.name}</p>
                <p className="text-xs text-steel-400">
                  {new Date(f.createdTime).toLocaleString("en-IN")}
                </p>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Local file backup (fallback) */}
      <Section title="Local Backup File (no internet needed)">
        <p className="text-xs text-steel-500 mb-3">
          Last local backup:{" "}
          {meta.lastBackup
            ? new Date(meta.lastBackup).toLocaleString("en-IN")
            : "Never"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleLocalBackup}
            disabled={busy}
            className="rounded-xl bg-steel-700 text-white text-sm font-medium py-3 disabled:opacity-60"
          >
            {busy ? "Working..." : "Save Backup File"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-navy-300 text-navy-700 text-sm font-medium py-3"
          >
            Restore From File
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleRestoreFile}
          className="hidden"
        />
      </Section>

      {msg && (
        <p className="text-xs text-center text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg py-2">
          {msg}
        </p>
      )}

      {/* Accounts */}
      <Section title="Accounts (people)">
        <AddRow
          value={newAccount}
          setValue={setNewAccount}
          placeholder="New account name"
          onAdd={async () => {
            if (!newAccount.trim()) return;
            await addAccount(newAccount);
            setNewAccount("");
            setAccounts(await getAccounts());
          }}
        />
        <List
          items={accounts}
          onDelete={async (id) => {
            await deleteAccount(id);
            setAccounts(await getAccounts());
          }}
        />
      </Section>

      {/* Sites */}
      <Section title="Work Sites">
        <AddRow
          value={newSite}
          setValue={setNewSite}
          placeholder="New site name"
          onAdd={async () => {
            if (!newSite.trim()) return;
            await addSite(newSite);
            setNewSite("");
            setSites(await getSites());
          }}
        />
        <List
          items={sites}
          onDelete={async (id) => {
            await deleteSite(id);
            setSites(await getSites());
          }}
        />
      </Section>

      {/* Departments + vendors */}
      <Section title="Departments & Parties">
        <AddRow
          value={newDept}
          setValue={setNewDept}
          placeholder="New department (e.g. Fabricators)"
          onAdd={async () => {
            if (!newDept.trim()) return;
            await addDepartment(newDept);
            setNewDept("");
            setDepartments(await getDepartments());
          }}
        />
        <div className="space-y-3 mt-3">
          {departments.map((d) => (
            <div key={d.id} className="rounded-lg border border-steel-200 p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-steel-800">{d.name}</p>
                <button
                  onClick={async () => {
                    await deleteDepartment(d.id);
                    setDepartments(await getDepartments());
                  }}
                  className="text-xs text-brick-600"
                >
                  Delete
                </button>
              </div>
              <AddRow
                small
                value={newVendorFor[d.id] || ""}
                setValue={(v) => setNewVendorFor((s) => ({ ...s, [d.id]: v }))}
                placeholder={`Add name under ${d.name}`}
                onAdd={async () => {
                  const v = (newVendorFor[d.id] || "").trim();
                  if (!v) return;
                  await addVendor(d.id, v);
                  setNewVendorFor((s) => ({ ...s, [d.id]: "" }));
                  setDepartments(await getDepartments());
                }}
              />
              <div className="space-y-2 mt-2">
                {d.vendors.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 rounded-lg border border-steel-200 px-2.5 py-1.5"
                  >
                    <span className="text-xs text-steel-700 flex-1">
                      {v.name}
                    </span>
                    <input
                      defaultValue={v.whatsapp || ""}
                      placeholder="WhatsApp number"
                      onBlur={async (e) => {
                        await updateVendorPhone(d.id, v.id, e.target.value);
                        setDepartments(await getDepartments());
                      }}
                      className="w-32 rounded-md border border-steel-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-navy-400"
                    />
                    <button
                      onClick={async () => {
                        await deleteVendor(d.id, v.id);
                        setDepartments(await getDepartments());
                      }}
                      className="text-steel-400 hover:text-brick-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <p className="text-center text-xs text-steel-300 pt-4">
        NextGen PreFab Accounts · v1.1
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl bg-white border border-steel-200 shadow-card p-4">
      <p className="text-sm font-semibold text-steel-800 mb-3">{title}</p>
      {children}
    </section>
  );
}

function AddRow({ value, setValue, placeholder, onAdd, small }) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        placeholder={placeholder}
        className={`flex-1 rounded-lg border border-steel-200 px-3 ${small ? "py-1.5 text-xs" : "py-2.5 text-sm"} focus:outline-none focus:ring-2 focus:ring-navy-400`}
      />
      <button
        onClick={onAdd}
        className={`rounded-lg bg-navy-700 text-white ${small ? "px-3 text-xs" : "px-4 text-sm"} font-medium`}
      >
        Add
      </button>
    </div>
  );
}

function List({ items, onDelete }) {
  if (items.length === 0)
    return <p className="text-xs text-steel-400 mt-2">None added yet.</p>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {items.map((i) => (
        <span
          key={i.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-steel-100 text-steel-700 text-xs px-3 py-1.5"
        >
          {i.name}
          <button
            onClick={() => onDelete(i.id)}
            className="text-steel-400 hover:text-brick-600"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
