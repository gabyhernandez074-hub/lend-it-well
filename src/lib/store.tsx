import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";
import { DEFAULT_CATEGORIES, type Category, type Item } from "./inventory";

const STORAGE_KEY = "pocalana_inventario_v1";
export const FILE_NAME = "inventario_pocalana.xlsx";

interface Data {
  categories: Category[];
  items: Item[];
}

interface Store extends Data {
  setCategories: (c: Category[]) => void;
  setItems: (i: Item[]) => void;
  upsertItem: (i: Item) => void;
  removeItem: (code: string) => void;
  getItem: (code: string) => Item | undefined;
  exportFile: () => void;
  importFile: (file: File) => Promise<void>;
  ready: boolean;
}

const Ctx = createContext<Store | null>(null);

function toSheets(data: Data) {
  const wb = XLSX.utils.book_new();
  const inv = data.items.map((it, i) => ({
    "#": i + 1,
    "Código de barras": it.code,
    Categoría: data.categories.find((c) => c.id === it.categoryId)?.name ?? it.categoryId,
    CategoríaID: it.categoryId,
    Nombre: it.values[data.categories.find((c) => c.id === it.categoryId)?.fields[0]?.name ?? ""] ?? "",
    Estado: it.loan ? "Prestado" : "Libre",
    Responsable: it.loan?.borrower ?? "",
    Teléfono: it.loan?.phone ?? "",
    "Días de préstamo": it.loan?.days ?? "",
    "Fecha préstamo": it.loan?.start ?? "",
    "Fecha devolución": it.loan?.due ?? "",
    "Pendiente impresión": it.pendingPrint ? "SI" : "NO",
    Datos: JSON.stringify(it.values),
    UltimoPrestamo: JSON.stringify(it.lastLoan ?? null),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inv), "Inventario");
  const cats = data.categories.map((c) => ({
    ID: c.id,
    Categoría: c.name,
    Campos: JSON.stringify(c.fields),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cats), "Categorias");
  return wb;
}

function fromWorkbook(wb: XLSX.WorkBook): Data {
  const catRows: Record<string, string>[] = wb.Sheets["Categorias"]
    ? XLSX.utils.sheet_to_json(wb.Sheets["Categorias"])
    : [];
  const categories: Category[] = catRows.length
    ? catRows.map((r) => ({
        id: String(r["ID"]),
        name: String(r["Categoría"]),
        fields: JSON.parse(String(r["Campos"] || "[]")),
      }))
    : DEFAULT_CATEGORIES;
  const invRows: Record<string, string>[] = wb.Sheets["Inventario"]
    ? XLSX.utils.sheet_to_json(wb.Sheets["Inventario"])
    : [];
  const items: Item[] = invRows.map((r) => {
    const loanStart = r["Fecha préstamo"];
    return {
      code: String(r["Código de barras"]),
      categoryId: String(r["CategoríaID"] ?? r["Categoría"]),
      values: JSON.parse(String(r["Datos"] || "{}")),
      loan: loanStart
        ? {
            borrower: String(r["Responsable"] ?? ""),
            phone: String(r["Teléfono"] ?? ""),
            days: Number(r["Días de préstamo"] ?? 0),
            start: String(loanStart),
            due: String(r["Fecha devolución"]),
          }
        : null,
      lastLoan: JSON.parse(String(r["UltimoPrestamo"] || "null")),
      pendingPrint: String(r["Pendiente impresión"]).toUpperCase() === "SI",
    };
  });
  return { categories, items };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>({ categories: DEFAULT_CATEGORIES, items: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      setCategories: (categories) => setData((d) => ({ ...d, categories })),
      setItems: (items) => setData((d) => ({ ...d, items })),
      upsertItem: (item) =>
        setData((d) => {
          const exists = d.items.some((i) => i.code === item.code);
          return {
            ...d,
            items: exists ? d.items.map((i) => (i.code === item.code ? item : i)) : [...d.items, item],
          };
        }),
      removeItem: (code) => setData((d) => ({ ...d, items: d.items.filter((i) => i.code !== code) })),
      getItem: (code) => data.items.find((i) => i.code === code.trim()),
      exportFile: () => XLSX.writeFile(toSheets(data), FILE_NAME),
      importFile: async (file: File) => {
        const buf = await file.arrayBuffer();
        setData(fromWorkbook(XLSX.read(buf, { type: "array" })));
      },
    }),
    [data, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore fuera de StoreProvider");
  return ctx;
}
