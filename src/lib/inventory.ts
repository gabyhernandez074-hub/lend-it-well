export type FieldType = "text" | "textarea" | "number" | "select" | "yesno";

export interface Field {
  name: string;
  type: FieldType;
  options?: string[];
  /** label shown when the user picks "Otro" */
  otherPrompt?: string;
  otherNumeric?: boolean;
  /** extra field shown when a yes/no field is answered with followUpOn (default "Sí") */
  followUp?: string;
  followUpOn?: "Sí" | "No";
}

export interface Category {
  id: string;
  name: string;
  fields: Field[];
}

export interface Loan {
  borrower: string;
  phone: string;
  days: number;
  start: string; // ISO
  due: string; // ISO
}

export interface Item {
  code: string;
  categoryId: string;
  values: Record<string, string>;
  loan: Loan | null;
  lastLoan?: (Loan & { returnedAt: string; lateDays: number }) | null;
  pendingPrint?: boolean;
}

export const ESTADO = ["Perfecto", "Bueno", "Regular", "Malo"];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "libro",
    name: "Libro",
    fields: [
      { name: "Título", type: "text" },
      { name: "Autor(es)", type: "text" },
      { name: "Editorial", type: "text" },
      { name: "Año de publicación", type: "number" },
      { name: "Idioma", type: "select", options: ["Español", "Inglés", "Francés"] },
      {
        name: "Género",
        type: "select",
        options: [
          "Educación",
          "Ciencia ficción",
          "Terror",
          "Cuentos",
          "Fantasía",
          "Comic",
          "Mitología",
          "Poesía",
          "Ciencia",
          "Historia",
          "Ilustraciones",
          "Humor",
          "Aventura",
          "Otro",
        ],
        otherPrompt: "¿Cuál género?",
      },
      { name: "Estado", type: "select", options: ESTADO },
      { name: "Descripción", type: "textarea" },
      { name: "Destacados", type: "yesno", followUp: "Habilidad destacada" },
    ],
  },
  {
    id: "juego",
    name: "Juego de mesa",
    fields: [
      { name: "Nombre del juego", type: "text" },
      { name: "Marca", type: "text" },
      {
        name: "Tipo de juego",
        type: "select",
        options: [
          "Cartas",
          "Tablero",
          "Dados",
          "Fichas",
          "Memoria",
          "Palabras",
          "Preguntas",
          "Construcción",
          "Rompecabezas",
          "Educación",
          "Adivinanzas",
          "Dibujo",
          "Otros",
        ],
        otherPrompt: "¿Cuál tipo de juego?",
      },
      {
        name: "Edad recomendada",
        type: "select",
        options: ["+1", "+2", "+3", "+4", "+5", "+10", "+12", "Otro"],
        otherPrompt: "¿Para más de cuántos años?",
        otherNumeric: true,
      },
      {
        name: "Número de jugadores",
        type: "select",
        options: ["1", "2", "3", "4", "5", "6", "7", "8", "Otro"],
        otherPrompt: "¿Cuántos jugadores?",
        otherNumeric: true,
      },
      { name: "Nivel de dificultad", type: "select", options: ["Fácil", "Medio", "Difícil"] },
      { name: "Estado", type: "select", options: ESTADO },
      {
        name: "Piezas completas",
        type: "yesno",
        followUp: "¿Qué pieza(s) falta(n)?",
        followUpOn: "No",
      },
      { name: "Destacados", type: "yesno", followUp: "Habilidad destacada" },
    ],
  },
];

export const DAY = 86400000;

export function itemName(item: Item, categories: Category[]): string {
  const cat = categories.find((c) => c.id === item.categoryId);
  const key = cat?.fields[0]?.name;
  return (key ? item.values[key] : "") || "(sin nombre)";
}

export function categoryName(item: Item, categories: Category[]): string {
  return categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId;
}

export function daysLeft(loan: Loan): number {
  return Math.ceil((new Date(loan.due).getTime() - Date.now()) / DAY);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cat"
  );
}

export function generateCode(existing: Set<string>): string {
  let code = "";
  do {
    code = "PCL" + Math.floor(100000000 + Math.random() * 899999999).toString();
  } while (existing.has(code));
  return code;
}
