import JsBarcode from "jsbarcode";

export function barcodeDataUrl(code: string, label?: string): string {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, code, {
    format: "CODE128",
    displayValue: true,
    fontSize: 28,
    height: 110,
    width: 2.4,
    margin: 6,
    text: label ? `${code}` : code,
  });
  return canvas.toDataURL("image/png");
}
