import { useState } from "react";
import { Modal, Field, inputClass } from "./Modal";
import { FieldsEditor } from "./ItemForm";
import { useStore } from "@/lib/store";
import { generateCode, itemName, slug, type Category } from "@/lib/inventory";

export function AddItemModal({ onClose }: { onClose: () => void }) {
  const { items, categories, setCategories, upsertItem } = useStore();
  const [code, setCode] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [pendingPrint, setPendingPrint] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [catId, setCatId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatFields, setNewCatFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const category = categories.find((c) => c.id === catId);

  function verifyScan() {
    const c = scanInput.trim();
    if (!c) return;
    const existing = items.find((i) => i.code === c);
    if (existing) {
      setWarning(
        `⚠ El código ${c} ya pertenece a «${itemName(existing, categories)}». No puede usarse de nuevo; se recomienda generar un código nuevo.`,
      );
      return;
    }
    setWarning(null);
    setCode(c);
    setPendingPrint(false);
  }

  function createCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const cat: Category = {
      id: slug(name) + "-" + Math.random().toString(36).slice(2, 6),
      name,
      fields: [
        { name: "Nombre del elemento", type: "text" },
        ...newCatFields.map((f) => ({ name: f, type: "text" as const })),
      ],
    };
    setCategories([...categories, cat]);
    setCatId(cat.id);
    setNewCatName("");
    setNewCatFields([]);
  }

  function addFieldToCategory(name: string) {
    setCategories(
      categories.map((c) =>
        c.id === catId ? { ...c, fields: [...c.fields, { name, type: "text" }] } : c,
      ),
    );
  }

  function save() {
    if (!category) return;
    const nameKey = category.fields[0]!.name;
    if (!values[nameKey]?.trim()) {
      setMsg(`El campo «${nameKey}» es obligatorio.`);
      return;
    }
    const clean: Record<string, string> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v && v.trim()) clean[k] = v.trim();
    });
    upsertItem({ code, categoryId: category.id, values: clean, loan: null, pendingPrint });
    onClose();
  }

  return (
    <Modal title="Agregar nuevo elemento" onClose={onClose}>
      {!code ? (
        <div className="space-y-4">
          <Field label="Escanear código de barras existente">
            <div className="flex gap-2">
              <input
                autoFocus
                className={inputClass}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyScan()}
                placeholder="Escanea aquí…"
              />
              <button
                className="shrink-0 rounded-lg bg-secondary px-4 font-semibold text-secondary-foreground"
                onClick={verifyScan}
              >
                Verificar
              </button>
            </div>
          </Field>
          {warning && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive">
              {warning}
            </p>
          )}
          <div className="text-center text-sm text-muted-foreground">o</div>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
            onClick={() => {
              setCode(generateCode(new Set(items.map((i) => i.code))));
              setPendingPrint(true);
              setWarning(null);
            }}
          >
            Generar nuevo código (queda pendiente de impresión)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="rounded-lg bg-muted p-3 text-sm">
            Código asignado: <span className="font-mono font-bold">{code}</span>
            {pendingPrint && " · pendiente de impresión"}
          </p>

          <Field label="Categoría">
            <select
              className={inputClass}
              value={catId}
              onChange={(e) => {
                setCatId(e.target.value);
                setValues({});
              }}
            >
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">Otro (nueva categoría)</option>
            </select>
          </Field>

          {catId === "__new" && (
            <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
              <Field label="Nombre de la nueva categoría">
                <input
                  className={inputClass}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </Field>
              <p className="text-sm text-muted-foreground">
                Campo #1: <strong>Nombre del elemento</strong> (obligatorio)
              </p>
              <ul className="space-y-1 text-sm">
                {newCatFields.map((f, i) => (
                  <li key={f} className="flex items-center justify-between rounded bg-muted px-2 py-1">
                    <span>
                      Campo #{i + 2}: {f}
                    </span>
                    <button
                      className="text-destructive"
                      onClick={() => setNewCatFields(newCatFields.filter((x) => x !== f))}
                    >
                      quitar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder={`Campo #${newCatFields.length + 2}`}
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
                <button
                  className="shrink-0 rounded-lg bg-secondary px-4 font-semibold text-secondary-foreground"
                  onClick={() => {
                    const n = newFieldName.trim();
                    if (n) setNewCatFields([...newCatFields, n]);
                    setNewFieldName("");
                  }}
                >
                  Agregar campo
                </button>
              </div>
              <button
                className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
                onClick={createCategory}
              >
                Crear categoría
              </button>
            </div>
          )}

          {category && (
            <>
              <FieldsEditor
                category={category}
                values={values}
                onValues={setValues}
                onAddField={addFieldToCategory}
              />
              {msg && <p className="text-sm font-semibold text-destructive">{msg}</p>}
              <button
                className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
                onClick={save}
              >
                Guardar elemento
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
