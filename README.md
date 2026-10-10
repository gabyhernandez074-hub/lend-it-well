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

The Windows installer is an `.exe` created with NSIS and is written to:

```text
src-tauri/target/release/bundle/nsis/
```

You can also build only the Windows `.exe` installer with:

```sh
npm run tauri:build:exe
```

The compiled application executable itself is also available at:

```text
src-tauri/target/release/pocalana.exe
```

The NSIS installer is recommended for distribution because it installs the
application and creates the normal Windows shortcuts. The raw executable can
run without an installer but does not create shortcuts or uninstall entries.

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
