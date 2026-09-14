import { useState } from "react";
import { Modal, Field, inputClass } from "./Modal";
import { FieldsEditor } from "./ItemForm";
import { useStore } from "@/lib/store";
import { itemName, type Item } from "@/lib/inventory";

export function EditItemModal({ onClose }: { onClose: () => void }) {
  const { items, categories, setCategories, upsertItem, removeItem } = useStore();
  const [scan, setScan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [mode, setMode] = useState<"choose" | "edit" | "delete">("choose");
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);

  const category = item ? categories.find((c) => c.id === item.categoryId) : undefined;

  function verify() {
    const found = items.find((i) => i.code === scan.trim());
    if (!found) {
      setError(`Error: el código ${scan.trim() || "—"} no existe en el inventario.`);
      setItem(null);
      return;
    }
    setError(null);
    setItem(found);
    setValues(found.values);
    setMode("choose");
  }

  return (
    <Modal title="Editar elemento" onClose={onClose}>
      {!item ? (
        <div className="space-y-3">
          <Field label="Escanea el código de barras">
            <div className="flex gap-2">
              <input
                autoFocus
                className={inputClass}
                value={scan}
                onChange={(e) => setScan(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
              />
              <button
                className="shrink-0 rounded-lg bg-secondary px-4 font-semibold text-secondary-foreground"
                onClick={verify}
              >
                Buscar
              </button>
            </div>
          </Field>
          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}
        </div>
      ) : mode === "choose" ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-muted p-3 text-sm">
            <strong>{itemName(item, categories)}</strong> · código{" "}
            <span className="font-mono">{item.code}</span>
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground"
              onClick={() => setMode("edit")}
            >
              Editar
            </button>
            <button
              className="flex-1 rounded-lg bg-destructive px-4 py-2 font-semibold text-destructive-foreground"
              onClick={() => setMode("delete")}
            >
              Eliminar elemento
            </button>
          </div>
        </div>
      ) : mode === "edit" ? (
        <div className="space-y-4">
          {category && (
            <FieldsEditor
              category={category}
              values={values}
              onValues={setValues}
              onAddField={(name) =>
                setCategories(
                  categories.map((c) =>
                    c.id === category.id ? { ...c, fields: [...c.fields, { name, type: "text" }] } : c,
                  ),
                )
              }
            />
          )}
          <button
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
            onClick={() => setConfirming(true)}
          >
            Finalizar
          </button>
          {confirming && (
            <Modal title="Confirmar cambios" onClose={() => setConfirming(false)}>
              <p className="mb-4 text-sm">¿Deseas guardar los cambios hechos a este elemento?</p>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
                  onClick={() => {
                    const clean: Record<string, string> = {};
                    Object.entries(values).forEach(([k, v]) => {
                      if (v && v.trim()) clean[k] = v.trim();
                    });
                    upsertItem({ ...item, values: clean });
                    onClose();
                  }}
                >
                  Confirmar cambios
                </button>
                <button
                  className="flex-1 rounded-lg bg-muted px-4 py-2 font-semibold text-foreground"
                  onClick={() => {
                    setValues(item.values);
                    setConfirming(false);
                  }}
                >
                  Descartar cambios
                </button>
              </div>
            </Modal>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive">
            ¿Confirmas eliminar «{itemName(item, categories)}»? Esta acción no se podrá revertir.
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-lg bg-destructive px-4 py-2 font-semibold text-destructive-foreground"
              onClick={() => {
                removeItem(item.code);
                onClose();
              }}
            >
              Sí, eliminar
            </button>
            <button
              className="flex-1 rounded-lg bg-muted px-4 py-2 font-semibold text-foreground"
              onClick={() => setMode("choose")}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
