import { DENTISTS, SOURCES_PRINCIPALES, SOURCES_SECONDAIRES } from "@/lib/dalili-data";

export type ProProfile = "dentiste" | "delegue" | "prospecteur";

export type ProAccount = {
  profile: ProProfile;
  fullName: string;
  email: string;
  phone: string;
  extra: Record<string, string>;
};

export type SourceFeed = {
  sourceId: string;
  name: string;
  url: string;
  status: "Actif" | "En pause" | "Erreur";
  updatedAt: string;
  rows: number;
  tier: "Principale" | "Secondaire";
  columns: string[];
  preview: string[][];
};

const previewColumns = ["Nom", "Spécialité", "Gouvernorat", "Ville", "Téléphone"];

const previewRows = (offset: number) =>
  DENTISTS.slice(offset, offset + 5).map((d) => [
    d.name,
    d.speciality,
    d.gouvernorat,
    d.ville,
    d.phone,
  ]);

export const SOURCE_FEEDS: SourceFeed[] = [
  ...SOURCES_PRINCIPALES.map((name, i) => ({
    sourceId: ["med.tn", "tunisie_dentiste", "tunisie_medicale"][i] ?? name.toLowerCase(),
    name,
    url: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.tn`,
    status: "Actif" as SourceFeed["status"],
    updatedAt: ["04/08/2026 06:12", "03/08/2026 22:40", "28/07/2026 09:05"][i] ?? "04/08/2026",
    rows: [1842, 1176, 604][i] ?? 400,
    tier: "Principale" as const,
    columns: previewColumns,
    preview: previewRows(i),
  })),
  ...SOURCES_SECONDAIRES.map((name, i) => ({
    sourceId:
      [
        "bonnes_adresses",
        "goafricaonline",
        "lerdvmedical",
        "orthodontiste_tn",
        "para_doctor",
        "sante_tunisie",
        "tunisie_medicale",
        "tunisie_dentiste",
      ][i] ?? name.toLowerCase(),
    name,
    url: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    status: "Actif" as SourceFeed["status"],
    updatedAt: `${String(20 + (i % 9)).padStart(2, "0")}/07/2026 14:${String(10 + i).padStart(2, "0")}`,
    rows: 120 + i * 47,
    tier: "Secondaire" as const,
    columns: previewColumns,
    preview: previewRows(i % 4),
  })),
];

const ALL_SOURCES = SOURCE_FEEDS.map((s) => s.name);

export const DENTIST_SOURCES: Record<string, string[]> = Object.fromEntries(
  DENTISTS.map((d, i) => [
    d.id,
    [ALL_SOURCES[i % 3]!, ALL_SOURCES[3 + (i % 8)]!].concat(
      d.verified ? [ALL_SOURCES[(i + 1) % 3]!] : [],
    ),
  ]),
);

export const QUALITE = [
  { label: "Complétude des fiches", value: 87 },
  { label: "Téléphones valides", value: 94 },
  { label: "Adresses géocodées", value: 72 },
  { label: "Spécialités renseignées", value: 81 },
];

export const DOUBLONS = [
  { a: "Dr. Amira Ben Salah", b: "Dr Amira BenSalah", score: 96, sources: ["med.tn", "Tunisie Dentiste"] },
  { a: "Dr. Karim Trabelsi", b: "Cabinet K. Trabelsi", score: 88, sources: ["med.tn", "Para Doctor"] },
  { a: "Dr. Sonia Gharbi", b: "Dr. S. Gharbi", score: 79, sources: ["Santé Tunisie", "med.tn"] },
];

export const LOGS = [
  { time: "04/08/2026 06:12", level: "Info", message: "Import med.tn terminé — 1 842 lignes" },
  { time: "04/08/2026 05:58", level: "Info", message: "Déduplication : 37 doublons fusionnés" },
  { time: "03/08/2026 22:40", level: "Info", message: "Import Tunisie Medicale termine - 1 176 lignes" },
  { time: "03/08/2026 19:04", level: "Info", message: "Santé Tunisie : source accessible et suivie" },
  { time: "02/08/2026 08:31", level: "Info", message: "Scan carte : 12 fiches créées" },
];

export type DatasetExportKind = "complete" | "verified" | "duplicates" | "localities";
export type DatasetExportFormat = "csv" | "xlsx";

export const TELECHARGEMENTS: {
  name: string;
  format: string;
  fileFormat: DatasetExportFormat;
  kind: DatasetExportKind;
  size: string;
  updatedAt: string;
}[] = [
  {
    name: "Annuaire complet",
    format: "XLSX",
    fileFormat: "xlsx",
    kind: "complete",
    size: "2,4 Mo",
    updatedAt: "04/08/2026",
  },
  {
    name: "Dentistes vérifiés",
    format: "XLSX",
    fileFormat: "xlsx",
    kind: "verified",
    size: "1,1 Mo",
    updatedAt: "04/08/2026",
  },
  {
    name: "Doublons détectés",
    format: "CSV",
    fileFormat: "csv",
    kind: "duplicates",
    size: "180 Ko",
    updatedAt: "03/08/2026",
  },
  {
    name: "Localités & gouvernorats",
    format: "CSV",
    fileFormat: "csv",
    kind: "localities",
    size: "42 Ko",
    updatedAt: "01/08/2026",
  },
];

export function toCsv(columns: string[], rows: string[][]) {
  return [columns, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function sourceExportUrl(sourceId: string, format: "csv" | "xlsx") {
  const apiBase = typeof window === "undefined" ? "http://127.0.0.1:8000" : window.location.origin;
  const url = new URL("/api/exports/source", apiBase);
  url.searchParams.set("source", sourceId);
  url.searchParams.set("format", format);
  return url.toString();
}

export function triggerSourceExport(sourceId: string, format: "csv" | "xlsx") {
  const a = document.createElement("a");
  a.href = sourceExportUrl(sourceId, format);
  a.target = "_blank";
  a.rel = "noreferrer";
  a.click();
}

export function datasetExportUrl(kind: DatasetExportKind, format: DatasetExportFormat) {
  const apiBase = typeof window === "undefined" ? "http://127.0.0.1:8000" : window.location.origin;
  const url = new URL("/api/exports/dataset", apiBase);
  url.searchParams.set("kind", kind);
  url.searchParams.set("format", format);
  return url.toString();
}

export function triggerDatasetExport(kind: DatasetExportKind, format: DatasetExportFormat) {
  const a = document.createElement("a");
  a.href = datasetExportUrl(kind, format);
  a.target = "_blank";
  a.rel = "noreferrer";
  a.click();
}
