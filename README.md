# Pocalana

Pocalana is a library inventory application for books, board games, custom
categories, loans, returns, and barcode printing.

The logo and user guide are stored locally in `public/pocalana-logo.png` and
`public/instructivo_pocalana.pdf`, so they remain available in the packaged
desktop application without an internet connection.

## Development

Install the current Node.js LTS release, Rust, and the Tauri system
prerequisites for your operating system. Then install the JavaScript
dependencies and start the web app:

```sh
npm install
npm run dev
```

## Tauri desktop app

Run the Windows desktop shell in development mode:

```sh
npm run tauri:dev
```

The Tauri configuration starts Vite on localhost and opens the native window.
A production Windows installer can be built with:

```sh
npm run tauri:build
```

`src-tauri/tauri.conf.json` enables all Tauri bundle targets, so the same
project can be built on macOS or Linux without application code changes. Build
on the target operating system, or use the corresponding Rust target and
platform SDK/toolchain for cross-compilation:

```sh
npm run tauri -- build --target <rust-target>
```

Examples include `x86_64-pc-windows-msvc`, `aarch64-apple-darwin`, and
`x86_64-unknown-linux-gnu`. Platform installers require the native signing and
packaging tools for that target.

## Google Drive backup

The application can keep a cloud backup without a paid database or server.
It uses the user's Google Drive storage and the Drive API's private
`appDataFolder`, so the backup is not visible as a normal file in Drive.
The backup contains the inventory and categories as JSON and is separate from
the local browser storage and Excel export.

To configure it:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Drive API**.
3. Configure the OAuth consent screen. For personal use, **External** is
   sufficient; add the Google account as a test user while the app is in
   testing.
4. Create an OAuth client ID of type **Web application**.
5. Add the development origins `http://localhost:5173` and
   `http://127.0.0.1:5173` to **Authorized JavaScript origins**.
6. Copy `.env.example` to `.env.local` and set:

   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

Use **Guardar en Drive** to sign in and save a backup, and **Restaurar Drive**
to recover it after reinstalling the application. The first authorization
opens Google's sign-in/consent dialog. The app never receives the Google
password and does not require a paid Google Cloud account.

The backup is manual: save to Drive after important changes. The application
continues to work offline using local storage. The backup is stored in
Google's private application-data area rather than a user-selected visible
folder; this avoids requiring a separate folder picker or broader Drive
permissions.
