import { useState } from "react";
import { Field, inputClass } from "./Modal";
import type { Category, Field as F } from "@/lib/inventory";

export function FieldInput({
  field,
  value,
  followUpValue,
  onChange,
  onFollowUp,
}: {
  field: F;
  value: string;
  followUpValue?: string | undefined;
  onChange: (v: string) => void;
  onFollowUp?: (v: string) => void;
}) {
  const options = field.options ?? [];
  const otherActive =
    field.type === "select" && !!value && !options.includes(value) ? true : false;
  const [showOther, setShowOther] = useState(otherActive);

  if (field.type === "select") {
    const otherLabel = options.find((o) => o.startsWith("Otro")) ?? "Otro";
    return (
      <div className="space-y-2">
        <Field label={field.name}>
          <select
            className={inputClass}
            value={showOther || otherActive ? otherLabel : value}
            onChange={(e) => {
              if (e.target.value === otherLabel) {
                setShowOther(true);
                onChange("");
              } else {
                setShowOther(false);
                onChange(e.target.value);
              }
            }}
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        {(showOther || otherActive) && (
          <Field label={field.otherPrompt ?? "¿Cuál?"}>
            <input
              className={inputClass}
              inputMode={field.otherNumeric ? "numeric" : "text"}
              value={value}
              onChange={(e) =>
                onChange(field.otherNumeric ? e.target.value.replace(/[^0-9]/g, "") : e.target.value)
              }
            />
          </Field>
        )}
      </div>
    );
  }

  if (field.type === "yesno") {
    return (
      <div className="space-y-2">
        <Field label={field.name}>
          <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </Field>
        {field.followUp && value === "Sí" && (
          <Field label={field.followUp}>
            <input
              className={inputClass}
              value={followUpValue ?? ""}
              onChange={(e) => onFollowUp?.(e.target.value)}
            />
          </Field>
        )}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Field label={field.name}>
        <textarea
          rows={3}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }

  return (
    <Field label={field.name}>
      <input
        className={inputClass}
        inputMode={field.type === "number" ? "numeric" : "text"}
        value={value}
        onChange={(e) =>
          onChange(field.type === "number" ? e.target.value.replace(/[^0-9]/g, "") : e.target.value)
        }
      />
    </Field>
  );
}

export function FieldsEditor({
  category,
  values,
  onValues,
  onAddField,
}: {
  category: Category;
  values: Record<string, string>;
  onValues: (v: Record<string, string>) => void;
  onAddField: (name: string) => void;
}) {
  const [newField, setNewField] = useState("");
  const set = (k: string, v: string) => onValues({ ...values, [k]: v });

  return (
    <div className="space-y-3">
      {category.fields.map((f, idx) => (
        <div key={f.name}>
          <FieldInput
            field={idx === 0 ? { ...f, name: `${f.name} *` } : f}
            value={values[f.name] ?? ""}
            followUpValue={f.followUp ? values[f.followUp] : undefined}
            onChange={(v) => set(f.name, v)}
            onFollowUp={(v) => f.followUp && set(f.followUp, v)}
          />
        </div>
      ))}
      <div className="rounded-xl border border-dashed border-border p-3">
        <p className="mb-2 text-sm font-semibold text-foreground/70">
          Agregar nuevo campo a la categoría «{category.name}»
        </p>
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder={`Campo #${category.fields.length + 1}`}
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
          />
          <button
            type="button"
            className="shrink-0 rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground hover:opacity-90"
            onClick={() => {
              const n = newField.trim();
              if (!n) return;
              onAddField(n);
              setNewField("");
            }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
