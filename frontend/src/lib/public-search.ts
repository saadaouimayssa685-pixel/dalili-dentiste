export type PublicFilterState = {
  q: string;
  gouvernorat: string;
  localite: string;
  speciality: string;
  source: string;
  name: string;
  withPhone: boolean;
};

export const EMPTY_FILTERS: PublicFilterState = {
  q: "",
  gouvernorat: "all",
  localite: "all",
  speciality: "all",
  source: "all",
  name: "",
  withPhone: false,
};

export const PAGE_SIZE = 20;