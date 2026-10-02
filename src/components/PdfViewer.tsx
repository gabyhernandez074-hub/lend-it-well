import { useCallback, useEffect, useRef, useState } from "react";

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};
type PdfPage = {
  getViewport: (p: { scale: number }) => { width: number; height: number };
  render: (p: {
    canvas: HTMLCanvasElement;
    viewport: { width: number; height: number };
    transform?: number[];
  }) => { promise: Promise<void>; cancel: () => void };
};

export function PdfViewer({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PdfDoc | null>(null);
  const taskRef = useRef<{ cancel: () => void } | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    docRef.current = null;
    setPages(0);
    setError(null);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
        const doc = (await pdfjs.getDocument({ url }).promise) as unknown as PdfDoc;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        docRef.current = doc;
        setPages(doc.numPages);
        setPage(1);
      } catch {
        if (!cancelled) setError("No se pudo cargar el instructivo. Intenta de nuevo.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || pages === 0) return;
    let cancelled = false;
    (async () => {
      if (taskRef.current) {
        try {
          taskRef.current.cancel();
        } catch {
          /* ignore */
        }
        taskRef.current = null;
      }
      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const container = scrollRef.current;
        const fit = container ? Math.max(0.2, (container.clientWidth - 24) / base.width) : 1;
        const scale = fitWidth ? fit : fit * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({ scale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const task = pdfPage.render({
          canvas,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        taskRef.current = task;
        await task.promise;
      } catch (e) {
        if (!cancelled && (e as { name?: string })?.name !== "RenderingCancelledException") {
          setError("No se pudo mostrar esta página.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, zoom, fitWidth, pages]);

  const changeZoom = useCallback((delta: number) => {
    setFitWidth(false);
    setZoom((z) => Math.min(4, Math.max(0.5, +(z + delta).toFixed(2))));
  }, []);

  if (error) return <p className="p-4 text-sm font-semibold text-destructive">{error}</p>;
  if (pages === 0) return <p className="p-4 text-sm text-muted-foreground">Cargando instructivo…</p>;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
        <button
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Página anterior"
        >
          ◀ Anterior
        </button>
        <span className="text-sm font-semibold text-foreground">
          Página {page} de {pages}
        </span>
        <button
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          aria-label="Página siguiente"
        >
          Siguiente ▶
        </button>
        <span className="mx-2 h-6 w-px bg-border" aria-hidden />
        <button
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground"
          onClick={() => changeZoom(-0.25)}
          aria-label="Reducir zoom"
        >
          −
        </button>
        <span className="min-w-12 text-center text-sm font-semibold text-foreground">
          {fitWidth ? "Ajustado" : `${Math.round(zoom * 100)}%`}
        </span>
        <button
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground"
          onClick={() => changeZoom(0.25)}
          aria-label="Aumentar zoom"
        >
          +
        </button>
        <button
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground"
          onClick={() => {
            setFitWidth(true);
            setZoom(1);
          }}
        >
          Ajustar a lo ancho
        </button>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-muted p-3">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-lg bg-white shadow" />
        </div>
      </div>
    </div>
  );
}
