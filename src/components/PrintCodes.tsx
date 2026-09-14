import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import { barcodeDataUrl } from "@/lib/barcode";
import { itemName } from "@/lib/inventory";

const PAGE_W = 210;
const CELL_W = 50;
const CELL_H = 30;
const COLS = 4;
const ROWS = 9;
const MARGIN_X = (PAGE_W - COLS * CELL_W) / 2;
const MARGIN_Y = (297 - ROWS * CELL_H) / 2;

export function PrintCodes({ onClose }: { onClose: () => void }) {
  const { items, categories, setItems } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const pending = useMemo(() => items.filter((i) => i.pendingPrint), [items]);
  const list = showAll ? items : pending;

  const toggle = (code: string) =>
    setSelected((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));

  function buildPdf() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    selected.forEach((code, idx) => {
      const posOnPage = idx % (COLS * ROWS);
      if (idx > 0 && posOnPage === 0) doc.addPage();
      const col = posOnPage % COLS;
      const row = Math.floor(posOnPage / COLS);
      const x = MARGIN_X + col * CELL_W + 5;
      const y = MARGIN_Y + row * CELL_H + 5;
      doc.addImage(barcodeDataUrl(code), "PNG", x, y, 40, 20);
    });
    if (selected.length === 0) doc.text("Selecciona códigos para imprimir", 20, 20);
    return doc;
  }

  return (
    <Modal title="Imprimir códigos de barras" onClose={onClose} wide>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground"
              onClick={() => setSelected(list.map((i) => i.code))}
            >
              Seleccionar todos
            </button>
            <button
              className="rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
              onClick={() => setSelected([])}
            >
              Limpiar
            </button>
            <button
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Ver solo pendientes" : "Renovar códigos"}
            </button>
          </div>
          <p className="mb-2 text-sm text-muted-foreground">
            {showAll
              ? "Todo el inventario (reimpresión de códigos ya impresos)."
              : "Códigos pendientes por imprimir."}
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {list.length === 0 && (
              <li className="text-sm text-muted-foreground">No hay códigos en esta lista.</li>
            )}
            {list.map((i) => (
              <li key={i.code}>
                <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(i.code)}
                    onChange={() => toggle(i.code)}
                  />
                  <span className="font-mono text-xs">{i.code}</span>
                  <span className="truncate">{itemName(i, categories)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col">
          <div className="mb-2 flex gap-2">
            <button
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              onClick={() => setPreview(buildPdf().output("bloburl") as unknown as string)}
            >
              Previsualizar
            </button>
            <button
              disabled={selected.length === 0}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              onClick={() => {
                buildPdf().save("codigos_pocalana.pdf");
                setItems(
                  items.map((i) =>
                    selected.includes(i.code) ? { ...i, pendingPrint: false } : i,
                  ),
                );
                setSelected([]);
              }}
            >
              Descargar ({selected.length})
            </button>
          </div>
          <div className="h-72 overflow-hidden rounded-lg border border-border bg-muted">
            {preview ? (
              <iframe title="Previsualización" src={preview} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Previsualización del PDF (36 códigos por hoja)
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
