/**
 * Données du dashboard statistique de l'espace professionnel.
 *
 * Ces valeurs sont des mocks réalistes. Pour brancher l'API plus tard,
 * il suffit de remplacer `getOverviewData()` par un appel réseau
 * (server function / fetch) renvoyant le même type `OverviewData`.
 */

export type OverviewFilters = {
  gouvernorat: string;
  speciality: string;
  source: string;
  from: string;
  to: string;
};

export const OVERVIEW_DEFAULT_FILTERS: OverviewFilters = {
  gouvernorat: "all",
  speciality: "all",
  source: "all",
  from: "2026-01-01",
  to: "2026-07-31",
};

export type OverviewData = {
  updatedAt: string;
  kpis: {
    dentists: number;
    rows: number;
    withPhone: number;
    withPhonePct: number;
    governorates: string;
    governoratesPct: number;
  };
  monthly: { month: string; dentists: number }[];
  topGovernorates: { name: string; dentists: number }[];
  specialities: { name: string; value: number }[];
  sources: { name: string; phone: number; noPhone: number; duplicates: number }[];
  coverage: { name: string; dentists: number }[];
  localities: { locality: string; governorate: string; dentists: number }[];
  quality: { label: string; value: number; tone: "good" | "warn" }[];
};

export const OVERVIEW_SPECIALITIES = [
  "Omnipratique",
  "Chirurgie orale",
  "Orthodontie",
  "Parodontologie",
  "Implantologie",
];

export const OVERVIEW_SOURCES = [
  "med.tn",
  "Tunisie Médicale",
  "Tunisie Dentiste",
  "Para Doctor",
  "Go Africa Online",
];

const DATA: OverviewData = {
  updatedAt: "29/07/2026 · 12:52",
  kpis: {
    dentists: 4095,
    rows: 4295,
    withPhone: 3598,
    withPhonePct: 87.8,
    governorates: "24/24",
    governoratesPct: 100,
  },
  monthly: [
    { month: "Jan", dentists: 2840 },
    { month: "Fév", dentists: 3010 },
    { month: "Mar", dentists: 3225 },
    { month: "Avr", dentists: 3418 },
    { month: "Mai", dentists: 3607 },
    { month: "Juin", dentists: 3862 },
    { month: "Juil", dentists: 4095 },
  ],
  topGovernorates: [
    { name: "Tunis", dentists: 962 },
    { name: "Sfax", dentists: 528 },
    { name: "Sousse", dentists: 431 },
    { name: "Ariana", dentists: 388 },
    { name: "Nabeul", dentists: 301 },
    { name: "Monastir", dentists: 264 },
    { name: "Ben Arous", dentists: 249 },
    { name: "Rades", dentists: 173 },
    { name: "Bizerte", dentists: 158 },
    { name: "Gabès", dentists: 121 },
  ],
  specialities: [
    { name: "Omnipratique", value: 2314 },
    { name: "Chirurgie orale", value: 612 },
    { name: "Orthodontie", value: 548 },
    { name: "Parodontologie", value: 361 },
    { name: "Implantologie", value: 260 },
  ],
  sources: [
    { name: "med.tn", phone: 1284, noPhone: 176, duplicates: 82 },
    { name: "Tunisie Médicale", phone: 842, noPhone: 121, duplicates: 47 },
    { name: "Tunisie Dentiste", phone: 668, noPhone: 143, duplicates: 39 },
    { name: "Para Doctor", phone: 452, noPhone: 168, duplicates: 24 },
    { name: "Go Africa Online", phone: 352, noPhone: 89, duplicates: 18 },
  ],
  coverage: [
    { name: "Tunis", dentists: 962 },
    { name: "Ariana", dentists: 388 },
    { name: "Ben Arous", dentists: 249 },
    { name: "La Manouba", dentists: 112 },
    { name: "Bizerte", dentists: 158 },
    { name: "Nabeul", dentists: 301 },
    { name: "Zaghouan", dentists: 41 },
    { name: "Béja", dentists: 58 },
    { name: "Jendouba", dentists: 63 },
    { name: "Le Kef", dentists: 47 },
    { name: "Siliana", dentists: 34 },
    { name: "Sousse", dentists: 431 },
    { name: "Monastir", dentists: 264 },
    { name: "Mahdia", dentists: 118 },
    { name: "Kairouan", dentists: 104 },
    { name: "Kasserine", dentists: 52 },
    { name: "Sidi Bouzid", dentists: 49 },
    { name: "Sfax", dentists: 528 },
    { name: "Gafsa", dentists: 71 },
    { name: "Tozeur", dentists: 29 },
    { name: "Kébili", dentists: 27 },
    { name: "Gabès", dentists: 121 },
    { name: "Médenine", dentists: 96 },
    { name: "Tataouine", dentists: 26 },
  ],
  localities: [
    { locality: "Tunis Centre", governorate: "Tunis", dentists: 312 },
    { locality: "El Menzah", governorate: "Tunis", dentists: 208 },
    { locality: "Sfax Ville", governorate: "Sfax", dentists: 196 },
    { locality: "Sousse Médina", governorate: "Sousse", dentists: 171 },
    { locality: "Soukra", governorate: "Ariana", dentists: 149 },
    { locality: "Ariana Ville", governorate: "Ariana", dentists: 138 },
    { locality: "Hammamet", governorate: "Nabeul", dentists: 127 },
    { locality: "Monastir", governorate: "Monastir", dentists: 118 },
    { locality: "Ezzahra", governorate: "Ben Arous", dentists: 104 },
    { locality: "Bizerte Nord", governorate: "Bizerte", dentists: 92 },
    { locality: "Gabès Ville", governorate: "Gabès", dentists: 78 },
    { locality: "Djerba Houmt Souk", governorate: "Médenine", dentists: 64 },
  ],
  quality: [
    { label: "Complétude téléphone", value: 87.8, tone: "good" },
    { label: "Complétude spécialité", value: 81.6, tone: "good" },
    { label: "Complétude localité", value: 92.3, tone: "good" },
    { label: "Doublons détectés", value: 4.9, tone: "warn" },
    { label: "Qualité globale", value: 86.5, tone: "good" },
  ],
};

/** Point d'entrée unique — à remplacer par un appel API le moment venu. */
export function getOverviewData(_filters?: OverviewFilters): OverviewData {
  return DATA;
}

export const formatNumber = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ");
export const formatPct = (n: number) => `${n.toString().replace(".", ",")} %`;