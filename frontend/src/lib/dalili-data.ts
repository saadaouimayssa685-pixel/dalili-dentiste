import dentist1 from "@/assets/dentist-1.jpg";
import dentist2 from "@/assets/dentist-2.jpg";
import dentist3 from "@/assets/dentist-3.jpg";
import dentist4 from "@/assets/dentist-4.jpg";

export const GOUVERNORATS = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "La Manouba",
  "Le Kef",
  "Mahdia",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export const VILLES: Record<string, string[]> = {
  Ariana: ["Ariana Ville", "Raoued", "Soukra", "Ettadhamen"],
  Béja: ["Béja Nord", "Medjez el-Bab", "Testour"],
  "Ben Arous": ["Ben Arous", "Ezzahra", "Hammam Lif", "Radès"],
  Bizerte: ["Bizerte Nord", "Menzel Bourguiba", "Ras Jebel"],
  Gabès: ["Gabès Ville", "Mareth", "El Hamma"],
  Gafsa: ["Gafsa Sud", "Métlaoui", "Redeyef"],
  Jendouba: ["Jendouba", "Tabarka", "Bou Salem"],
  Kairouan: ["Kairouan Nord", "Sbikha", "Haffouz"],
  Kasserine: ["Kasserine Nord", "Sbeitla", "Fériana"],
  Kébili: ["Kébili Sud", "Douz", "Souk Lahad"],
  "La Manouba": ["Manouba", "Den Den", "Oued Ellil"],
  "Le Kef": ["Le Kef Est", "Dahmani", "Tajerouine"],
  Mahdia: ["Mahdia", "Ksour Essef", "Chebba"],
  Médenine: ["Médenine Nord", "Djerba Houmt Souk", "Zarzis"],
  Monastir: ["Monastir", "Ksar Hellal", "Moknine"],
  Nabeul: ["Nabeul", "Hammamet", "Kélibia", "Korba"],
  Sfax: ["Sfax Ville", "Sakiet Ezzit", "El Ain"],
  "Sidi Bouzid": ["Sidi Bouzid Ouest", "Regueb", "Menzel Bouzaiane"],
  Siliana: ["Siliana Nord", "Bouarada", "Makthar"],
  Sousse: ["Sousse Médina", "Hammam Sousse", "Msaken", "Kalâa Kebira"],
  Tataouine: ["Tataouine Nord", "Ghomrassen", "Remada"],
  Tozeur: ["Tozeur", "Nefta", "Degache"],
  Tunis: ["Tunis Centre", "El Menzah", "Lafayette", "Bab Bhar", "El Manar"],
  Zaghouan: ["Zaghouan", "Zriba", "El Fahs"],
};

export const SPECIALITES = [
  "Dentiste généraliste",
  "Orthodontie",
  "Implantologie",
  "Chirurgie dentaire",
  "Parodontologie",
  "Pédodontie",
  "Esthétique dentaire",
  "Prothèse dentaire",
];

export type Dentist = {
  id: string;
  name: string;
  speciality: string;
  gouvernorat: string;
  ville: string;
  rating: number;
  reviews: number;
  phone: string;
  photo: string;
  verified: boolean;
  address: string;
};

export const DENTISTS: Dentist[] = [
  {
    id: "1",
    name: "Dr. Amira Ben Salah",
    speciality: "Orthodontie",
    gouvernorat: "Tunis",
    ville: "El Menzah",
    rating: 4.9,
    reviews: 128,
    phone: "+216 71 234 567",
    photo: dentist1,
    verified: true,
    address: "12 Rue du Lac, El Menzah 6",
  },
  {
    id: "2",
    name: "Dr. Karim Trabelsi",
    speciality: "Implantologie",
    gouvernorat: "Sfax",
    ville: "Sfax Ville",
    rating: 4.8,
    reviews: 94,
    phone: "+216 74 445 210",
    photo: dentist2,
    verified: true,
    address: "Av. Habib Bourguiba, Sfax",
  },
  {
    id: "3",
    name: "Dr. Sonia Gharbi",
    speciality: "Esthétique dentaire",
    gouvernorat: "Sousse",
    ville: "Hammam Sousse",
    rating: 4.7,
    reviews: 76,
    phone: "+216 73 812 004",
    photo: dentist3,
    verified: true,
    address: "Rue de la Corniche, Hammam Sousse",
  },
  {
    id: "4",
    name: "Dr. Mohamed Ayari",
    speciality: "Chirurgie dentaire",
    gouvernorat: "Nabeul",
    ville: "Hammamet",
    rating: 4.9,
    reviews: 152,
    phone: "+216 72 260 918",
    photo: dentist4,
    verified: true,
    address: "Centre Yasmine, Hammamet",
  },
  {
    id: "5",
    name: "Dr. Ines Chaabane",
    speciality: "Pédodontie",
    gouvernorat: "Ariana",
    ville: "Soukra",
    rating: 4.6,
    reviews: 61,
    phone: "+216 71 707 330",
    photo: dentist3,
    verified: true,
    address: "Résidence Jasmin, Soukra",
  },
  {
    id: "6",
    name: "Dr. Hatem Mzoughi",
    speciality: "Parodontologie",
    gouvernorat: "Monastir",
    ville: "Monastir",
    rating: 4.5,
    reviews: 48,
    phone: "+216 73 460 771",
    photo: dentist2,
    verified: false,
    address: "Av. de l'Environnement, Monastir",
  },
  {
    id: "7",
    name: "Dr. Leila Hammami",
    speciality: "Dentiste généraliste",
    gouvernorat: "Bizerte",
    ville: "Bizerte Nord",
    rating: 4.4,
    reviews: 39,
    phone: "+216 72 431 655",
    photo: dentist1,
    verified: true,
    address: "Rue d'Alger, Bizerte",
  },
  {
    id: "8",
    name: "Dr. Slim Bouzid",
    speciality: "Prothèse dentaire",
    gouvernorat: "Gabès",
    ville: "Gabès Ville",
    rating: 4.3,
    reviews: 27,
    phone: "+216 75 279 143",
    photo: dentist4,
    verified: false,
    address: "Av. Farhat Hached, Gabès",
  },
];

export const SOURCES_PRINCIPALES = ["med.tn", "Tunisie Dentiste", "Tunisie Medicale"];
export const SOURCES_SECONDAIRES = [
  "Bonnes Adresses",
  "Go Africa Online",
  "Le RDV Médical",
  "Orthodontiste.tn",
  "Para Doctor",
  "Santé Tunisie",
  "Tunisie Médicale",
  "Tunisie Dentistes",
];
