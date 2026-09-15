import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import logo from "@/assets/pocalana-logo.png.asset.json";
import { StoreProvider, useStore, FILE_NAME } from "@/lib/store";
import { Modal, Field, inputClass } from "@/components/Modal";
import { ItemDetails } from "@/components/ItemDetails";
import { AddItemModal } from "@/components/AddItemModal";
import { EditItemModal } from "@/components/EditItemModal";
import { PrintCodes } from "@/components/PrintCodes";
import { categoryName, daysLeft, fmtDate, itemName, DAY, type Item } from "@/lib/inventory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pocalana · Inventario de biblioteca" },
      {
        name: "description",
        content:
          "Sistema de inventario de biblioteca Pocalana: control de libros y juegos de mesa por código de barras, préstamos y devoluciones.",
      },
      { property: "og:title", content: "Pocalana · Inventario de biblioteca" },
      {
        property: "og:description",
        content: "Control de libros, juegos de mesa, préstamos y devoluciones por código de barras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <StoreProvider>
      <Home />
    </StoreProvider>
  ),
});

type ModalKind =
  | null
  | "consulta"
  | "prestamo"
  | "devolucion"
  | "agregar"
  | "editar"
  | "inventario"
  | "imprimir"
  | "destacados";

function Home() {
  const store = useStore();
  const { items, categories, upsertItem, exportFile, importFile } = store;
  const [code, setCode] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<Item | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  function withItem(kind: ModalKind) {
    const found = items.find((i) => i.code === code.trim());
    if (!found) {
      setNotFound(`No se encontró ningún elemento con el código ${code.trim() || "—"}.`);
      setActive(null);
      setModal(kind);
      return;
    }
    setNotFound(null);
    setActive(found);
    setModal(kind);
  }

  const loans = useMemo(
    () =>
      items
        .filter((i) => i.loan)
        .sort((a, b) => daysLeft(a.loan!) - daysLeft(b.loan!)),
    [items],
  );
  const destacados = useMemo(
    () => items.filter((i) => i.values["Destacados"] === "Sí" || i.values["Habilidad destacada"]),
    [items],
  );

  const close = () => {
    setModal(null);
    setActive(null);
    setCode("");
    scanRef.current?.focus();
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-primary px-5 py-2.5">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="Logo Pocalana" className="h-11 w-11 rounded-lg object-cover" />
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-primary-foreground">
              POCALANA · Inventario de biblioteca
            </h1>
            <p className="text-xs text-primary-foreground/80">
              Archivo de control: {FILE_NAME} · {items.length} elementos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
          <button
            className="rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/25"
            onClick={() => fileRef.current?.click()}
          >
            Cargar Excel
          </button>
          <button
            className="rounded-lg bg-card px-3 py-1.5 text-sm font-semibold text-primary hover:opacity-90"
            onClick={exportFile}
          >
            Guardar Excel
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-4 p-4">
        {/* Columna izquierda */}
        <aside className="flex min-h-0 flex-col gap-3">
          <button
            className="rounded-xl bg-accent px-4 py-3 font-bold text-accent-foreground shadow hover:opacity-90"
            onClick={() => setModal("destacados")}
          >
            ★ Destacados ({destacados.length})
          </button>
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card shadow">
            <h2 className="border-b border-border px-4 py-2 font-bold text-foreground">
              Devoluciones por urgencia
            </h2>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {loans.length === 0 && (
                <li className="text-sm text-muted-foreground">No hay préstamos activos.</li>
              )}
              {loans.map((i) => {
                const d = daysLeft(i.loan!);
                return (
                  <li key={i.code} className="rounded-lg border border-border p-2 text-sm">
                    <p className="font-semibold text-foreground">{itemName(i, categories)}</p>
                    <p className={d < 0 ? "font-bold text-destructive" : "font-bold text-secondary"}>
                      {d < 0 ? `${Math.abs(d)} día(s) de retraso` : `${d} día(s) restantes`}
                    </p>
                    <p className="text-muted-foreground">{i.loan!.borrower}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Centro */}
        <section className="flex min-h-0 flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow">
            <div className="flex items-center gap-6">
              <div className="flex flex-1 flex-col gap-3">
                <div className="text-sm text-foreground/80">
                  <p className="font-bold text-foreground">Instrucciones</p>
                  <ol className="list-decimal pl-4">
                    <li>Escanee aquí el codigo de barras</li>
                    <li>Selecciones la opcion que desee</li>
                  </ol>
                </div>
                <Field label="Escáner de código de barras">
                  <input
                    ref={scanRef}
                    autoFocus
                    className={`${inputClass} text-lg font-mono`}
                    placeholder="Escanea aquí el código…"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && withItem("consulta")}
                  />
                </Field>
              </div>

              <div className="flex shrink-0 flex-col gap-3">
                <button
                  className="w-full rounded-lg bg-primary px-5 py-3 text-base font-semibold text-primary-foreground"
                  onClick={() => withItem("consulta")}
                >
                  Consultar información
                </button>
                <button
                  className="w-full rounded-lg bg-secondary px-5 py-3 text-base font-semibold text-secondary-foreground"
                  onClick={() => withItem("prestamo")}
                >
                  Préstamo
                </button>
                <button
                  className="w-full rounded-lg bg-accent px-5 py-3 text-base font-semibold text-accent-foreground"
                  onClick={() => withItem("devolucion")}
                >
                  Devolución
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ["Agregar nuevo elemento", "agregar"],
                ["Editar elemento", "editar"],
                ["Abrir inventario", "inventario"],
                ["Imprimir nuevos códigos de barras", "imprimir"],
              ] as [string, ModalKind][]
            ).map(([label, kind]) => (
              <button
                key={label}
                onClick={() => setModal(kind)}
                className="rounded-2xl border border-border bg-card px-5 py-6 text-lg font-bold text-foreground shadow transition hover:border-primary hover:text-primary"
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </main>

      {modal === "consulta" && (
        <Modal title="Información del elemento" onClose={close}>
          {active ? <ItemDetails item={active} categories={categories} /> : <Warn text={notFound!} />}
        </Modal>
      )}

      {modal === "prestamo" && (
        <Modal title="Nuevo préstamo" onClose={close}>
          {!active ? (
            <Warn text={notFound!} />
          ) : active.loan ? (
            <div className="space-y-2 rounded-xl bg-destructive/10 p-3 text-sm">
              <p className="font-bold text-destructive">
                «{itemName(active, categories)}» aún está ocupado.
              </p>
              <p>Responsable: {active.loan.borrower}</p>
              {active.loan.phone && <p>Teléfono: {active.loan.phone}</p>}
              <p>
                Prestado el {fmtDate(active.loan.start)} · vence {fmtDate(active.loan.due)}
              </p>
            </div>
          ) : (
            <LoanForm
              item={active}
              onDone={(it) => {
                upsertItem(it);
                close();
              }}
              name={itemName(active, categories)}
            />
          )}
        </Modal>
      )}

      {modal === "devolucion" && (
        <Modal title="Devolución" onClose={close}>
          {!active ? (
            <Warn text={notFound!} />
          ) : !active.loan ? (
            <p className="rounded-xl bg-muted p-3 text-sm font-semibold">
              «{itemName(active, categories)}» ya se encontraba disponible para su préstamo.
            </p>
          ) : (
            <ReturnPanel
              item={active}
              name={itemName(active, categories)}
              onConfirm={(it) => upsertItem(it)}
            />
          )}
        </Modal>
      )}

      {modal === "agregar" && <AddItemModal onClose={close} />}
      {modal === "editar" && <EditItemModal onClose={close} />}
      {modal === "imprimir" && <PrintCodes onClose={close} />}

      {modal === "inventario" && (
        <Modal title="Inventario completo" onClose={close} wide>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                {["#", "Código de barras", "Categoría", "Nombre", "Estado", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={i.code} className="border-t border-border">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{i.code}</td>
                  <td className="px-3 py-2">{categoryName(i, categories)}</td>
                  <td className="px-3 py-2">{itemName(i, categories)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        i.loan ? "font-semibold text-destructive" : "font-semibold text-secondary"
                      }
                    >
                      {i.loan ? "Prestado" : "Libre"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                      onClick={() => setDetail(i)}
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    El inventario está vacío.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Modal>
      )}

      {detail && (
        <Modal title="Detalle del elemento" onClose={() => setDetail(null)}>
          <ItemDetails item={detail} categories={categories} />
        </Modal>
      )}

      {modal === "destacados" && (
        <Modal title="Elementos destacados" onClose={close}>
          <ul className="space-y-2">
            {destacados.length === 0 && (
              <li className="text-sm text-muted-foreground">Aún no hay elementos destacados.</li>
            )}
            {destacados.map((i) => (
              <li key={i.code} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-bold">{itemName(i, categories)}</p>
                <p className="text-muted-foreground">{categoryName(i, categories)}</p>
                <p className="font-semibold text-accent">
                  {i.values["Habilidad destacada"] || "Sin habilidad registrada"}
                </p>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}

function Warn({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive">{text}</p>
  );
}

function LoanForm({
  item,
  name,
  onDone,
}: {
  item: Item;
  name: string;
  onDone: (i: Item) => void;
}) {
  const [days, setDays] = useState("");
  const [borrower, setBorrower] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-muted p-3 text-sm">
        <strong>{name}</strong> está libre para préstamo.
      </p>
      <Field label="¿Cuántos días será prestado? *">
        <input
          className={inputClass}
          inputMode="numeric"
          value={days}
          onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <Field label="Nombre del responsable *">
        <input className={inputClass} value={borrower} onChange={(e) => setBorrower(e.target.value)} />
      </Field>
      <Field label="Número de teléfono (opcional)">
        <input
          className={inputClass}
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
        />
      </Field>
      {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
      <button
        className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
        onClick={() => {
          const d = Number(days);
          if (!d || !borrower.trim()) {
            setErr("Los días de préstamo y el nombre del responsable son obligatorios.");
            return;
          }
          const start = new Date();
          onDone({
            ...item,
            loan: {
              borrower: borrower.trim(),
              phone: phone.trim(),
              days: d,
              start: start.toISOString(),
              due: new Date(start.getTime() + d * DAY).toISOString(),
            },
          });
        }}
      >
        Iniciar préstamo
      </button>
    </div>
  );
}

function ReturnPanel({
  item,
  name,
  onConfirm,
}: {
  item: Item;
  name: string;
  onConfirm: (i: Item) => void;
}) {
  const [done, setDone] = useState(false);
  const loan = item.loan!;
  const late = Math.max(0, -daysLeft(loan));

  if (done) {
    return (
      <div className="space-y-2 rounded-xl bg-secondary/15 p-3 text-sm">
        <p className="font-bold">Devolución registrada · «{name}» ya está libre.</p>
        <p>Devuelto por: {loan.borrower}</p>
        {loan.phone && <p>Teléfono: {loan.phone}</p>}
        {late > 0 && (
          <p className="font-bold text-destructive">
            ⚠ Advertencia: la devolución tuvo {late} día(s) de demora.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-muted p-3 text-sm">
        «{name}» está prestado a <strong>{loan.borrower}</strong> desde el {fmtDate(loan.start)}.
      </p>
      <button
        className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
        onClick={() => {
          onConfirm({
            ...item,
            loan: null,
            lastLoan: { ...loan, returnedAt: new Date().toISOString(), lateDays: late },
          });
          setDone(true);
        }}
      >
        Confirmar devolución
      </button>
    </div>
  );
}
