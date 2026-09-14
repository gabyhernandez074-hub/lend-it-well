import { categoryName, daysLeft, fmtDate, itemName, type Category, type Item } from "@/lib/inventory";

export function ItemDetails({ item, categories }: { item: Item; categories: Category[] }) {
  const cat = categories.find((c) => c.id === item.categoryId);
  const shown = (cat?.fields ?? []).flatMap((f) => {
    const rows: [string, string][] = [];
    if (item.values[f.name]) rows.push([f.name, item.values[f.name]!]);
    if (f.followUp && item.values[f.followUp]) rows.push([f.followUp, item.values[f.followUp]!]);
    return rows;
  });
  const extra = Object.entries(item.values).filter(
    ([k, v]) => v && !shown.some(([n]) => n === k),
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-muted p-3">
        <p className="text-lg font-bold text-foreground">{itemName(item, categories)}</p>
        <p className="text-sm text-muted-foreground">
          Categoría: {categoryName(item, categories)} · Código:{" "}
          <span className="font-mono">{item.code}</span>
        </p>
      </div>
      <dl className="divide-y divide-border rounded-xl border border-border">
        {[...shown, ...extra].map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
            <dt className="font-semibold text-foreground/70">{k}</dt>
            <dd className="col-span-2 whitespace-pre-wrap text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      {item.loan ? (
        <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="font-bold text-destructive">En préstamo</p>
          <p>Responsable: {item.loan.borrower}</p>
          {item.loan.phone && <p>Teléfono: {item.loan.phone}</p>}
          <p>
            Prestado el {fmtDate(item.loan.start)} por {item.loan.days} días · vence{" "}
            {fmtDate(item.loan.due)}
          </p>
          <p className={daysLeft(item.loan) < 0 ? "font-bold text-destructive" : "font-bold"}>
            {daysLeft(item.loan) < 0
              ? `${Math.abs(daysLeft(item.loan))} día(s) de retraso`
              : `${daysLeft(item.loan)} día(s) restantes`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-secondary/50 bg-secondary/15 p-3 text-sm font-bold text-foreground">
          Libre para préstamo
          {item.lastLoan && (
            <span className="block font-normal text-muted-foreground">
              Última persona: {item.lastLoan.borrower} (devuelto el {fmtDate(item.lastLoan.returnedAt)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
