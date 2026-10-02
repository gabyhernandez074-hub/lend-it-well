import type { ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
  wide,
  full,
  bodyClass,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  full?: boolean;
  bodyClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div
        className={`flex w-full flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ${
          full ? "h-[93vh] max-w-[min(97vw,1500px)]" : `max-h-[90vh] ${wide ? "max-w-5xl" : "max-w-xl"}`
        }`}
      >
        <header className="flex items-center justify-between gap-4 bg-primary px-5 py-3">
          <h2 className="text-lg font-bold text-primary-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 text-xl leading-none text-primary-foreground/90 hover:text-primary-foreground"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className={bodyClass ?? "overflow-y-auto px-5 py-4"}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
