// ============================================================================
// Google Drive backup — the REAL thing (not a share-sheet).
// ----------------------------------------------------------------------------
// This signs the owner into their Google account (once) and then uploads the
// backup file directly into a private "NextGen Accounts" folder in THEIR
// Google Drive, using Google's official Drive API. To restore on another
// phone, they sign in with the same Google account and tap "Restore from
// Google Drive" — it lists the backups and pulls the one they pick.
//
// SETUP REQUIRED (one time, done by you in Google Cloud Console — the README
// walks through every click): you need a free "OAuth Client ID" of type
// "Android". Paste it into GOOGLE_CLIENT_ID below before building the app.
// ============================================================================

import { Browser } from "@capacitor/browser";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// ⬇️ PASTE your own OAuth Client ID here (see README.md, Part 2)
export const GOOGLE_CLIENT_ID =
  "418546648121-lnpkmv07fjdfc64fqr9q5mphpbmo7hre.apps.googleusercontent.com";

const REDIRECT_URI = `com.nextgen.accounts:/oauth2redirect`;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const TOKEN_KEY = "ng_google_tokens";
const FOLDER_NAME = "NextGen Accounts Backups";

function saveTokens(tokens) {
  const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000 - 30000;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...tokens, expiresAt }));
}
function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
  } catch {
    return null;
  }
}
export function isSignedIn() {
  return !!loadTokens();
}
export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
}

// --- PKCE helpers (this is what keeps the login secure without a server) ---
function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
async function makePkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(verifierBytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64url(digest);
  return { verifier, challenge };
}

// Opens Google's real sign-in page in the system browser (Chrome Custom
// Tabs) — never inside the app's own webview, which Google blocks for
// safety. When the user finishes, Google redirects back into the app.
export async function signIn() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Google sign-in only works in the installed Android app, not in the browser preview.",
    );
  }
  const { verifier, challenge } = await makePkcePair();

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&code_challenge=${challenge}&code_challenge_method=S256` +
    `&prompt=consent&access_type=offline`;

  const authCode = await new Promise((resolve, reject) => {
    let listenerHandle;
    CapApp.addListener("appUrlOpen", (data) => {
      if (data.url && data.url.startsWith(REDIRECT_URI)) {
        const url = new URL(data.url);
        const code = url.searchParams.get("code");
        Browser.close();
        listenerHandle?.remove();
        if (code) resolve(code);
        else reject(new Error("Sign-in was cancelled."));
      }
    }).then((h) => (listenerHandle = h));

    Browser.open({ url: authUrl }).catch(reject);
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      code: authCode,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok)
    throw new Error(tokens.error_description || "Google sign-in failed.");
  saveTokens(tokens);
  return tokens;
}

async function getAccessToken() {
  const tokens = loadTokens();
  if (!tokens) throw new Error("Not signed in to Google yet.");
  if (Date.now() < tokens.expiresAt) return tokens.access_token;

  // Access token expired — use the refresh token to get a new one silently.
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const fresh = await res.json();
  if (!res.ok) {
    signOut();
    throw new Error("Google session expired — please sign in again.");
  }
  saveTokens({ ...tokens, ...fresh });
  return fresh.access_token;
}

async function ensureBackupFolder(token) {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const list = await listRes.json();
  if (list.files && list.files.length > 0) return list.files[0].id;

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const created = await createRes.json();
  return created.id;
}

// Uploads the JSON backup straight into the "NextGen Accounts Backups"
// folder in the signed-in user's own Google Drive.
export async function uploadBackupToDrive(jsonString, fileName) {
  const token = await getAccessToken();
  const folderId = await ensureBackupFolder(token);

  const metadata = { name: fileName, parents: [folderId] };
  const boundary = "ng_backup_boundary";
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonString}\r\n--${boundary}--`;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) throw new Error("Upload to Google Drive failed.");
  return res.json();
}

// Lists the last 20 backups so the Settings screen can show a pick list.
export async function listDriveBackups() {
  const token = await getAccessToken();
  const folderId = await ensureBackupFolder(token);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,createdTime)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();
  return data.files || [];
}

// Downloads one chosen backup file's contents.
export async function downloadDriveBackup(fileId) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Could not download that backup.");
  return res.json();
}
