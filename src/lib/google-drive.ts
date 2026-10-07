const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_FILE_NAME = "pocalana-inventory-backup.json";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }) => GoogleTokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export interface CloudInventoryBackup {
  categories: unknown[];
  items: unknown[];
  savedAt: string;
}

let scriptPromise: Promise<void> | null = null;

function getClientId() {
  const clientId = import.meta.env["VITE_GOOGLE_CLIENT_ID"];
  if (!clientId) {
    throw new Error(
      "Google Drive no está configurado. Define VITE_GOOGLE_CLIENT_ID en el archivo .env.local.",
    );
  }
  return clientId;
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el inicio de sesión de Google."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function requestAccessToken(): Promise<string> {
  await loadGoogleIdentityServices();

  return new Promise((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || "Autorización cancelada."));
          return;
        }
        resolve(response.access_token);
      },
    });

    if (!client) {
      reject(new Error("Google Identity Services no está disponible."));
      return;
    }

    client.requestAccessToken({ prompt: "consent" });
  });
}

async function driveRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Drive respondió ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

async function findBackup(token: string): Promise<{ id: string } | null> {
  const query = encodeURIComponent(
    `name = '${DRIVE_FILE_NAME}' and trashed = false and 'appDataFolder' in parents`,
  );
  const result = await driveRequest<{ files: { id: string }[] }>(
    token,
    `/files?spaces=appDataFolder&fields=files(id)&q=${query}`,
  );
  return result.files[0] ?? null;
}

export async function uploadInventoryBackup(
  categories: unknown[],
  items: unknown[],
): Promise<void> {
  const token = await requestAccessToken();
  const existing = await findBackup(token);
  const metadata = {
    name: DRIVE_FILE_NAME,
    ...(existing ? {} : { parents: ["appDataFolder"] }),
    mimeType: "application/json",
  };
  const body: CloudInventoryBackup = {
    categories,
    items,
    savedAt: new Date().toISOString(),
  };
  const boundary = `pocalana-${Date.now()}`;
  const multipart = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    JSON.stringify(body),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const response = await fetch(
    existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: existing ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudo guardar la copia en Google Drive (${response.status}).`);
  }
}

export async function downloadInventoryBackup(): Promise<CloudInventoryBackup> {
  const token = await requestAccessToken();
  const file = await findBackup(token);
  if (!file) throw new Error("No existe una copia de inventario en Google Drive.");

  return driveRequest<CloudInventoryBackup>(token, `/files/${file.id}?alt=media`);
}
