/**
 * Client HTTP de l'espace grand public.
 * Toutes les requêtes passent par le proxy interne `/api/*` qui relaie
 * vers le backend FastAPI Dalili (variable serveur FASTAPI_BASE_URL).
 */

export type ApiDentist = {
  id: string;
  name: string;
  speciality: string | null;
  gouvernorat: string | null;
  localite: string | null;
  address: string | null;
  phone: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  sources: string[];
};

export type DentistsResponse = {
  items: ApiDentist[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicStats = {
  dentists: number | null;
  withPhone: number | null;
  governoratesCovered: number | null;
  governoratesTotal: number;
};

export type FiltersResponse = {
  gouvernorats: string[];
  localites: Record<string, string[]>;
  specialites: string[];
  sources: string[];
};

export type GovernorateCount = { name: string; count: number };

export type OverviewDataResponse = {
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
  localities: { locality: string; governorate: string | null; dentists: number }[];
  quality: { label: string; value: number; tone: "good" | "warn" }[];
};

export type ScanStatus = {
  available: boolean;
  engine?: string | undefined;
  languages?: string[] | undefined;
};

export type ScanFields = {
  name: string;
  speciality: string;
  phone: string;
  address: string;
  localite: string;
};

export type ChatReply = {
  sessionId: string;
  message: string;
  filters?: { speciality?: string; gouvernorat?: string; localite?: string } | null;
  dentists?: ApiDentist[];
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function str(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === "number") return String(value);
  return null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pick(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

async function request<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined> },
): Promise<T> {
  if (typeof window === "undefined") throw new ApiError("Requête côté serveur ignorée", 0);
  const url = new URL(path, window.location.origin);
  for (const [k, v] of Object.entries(init?.params ?? {})) {
    if (v !== undefined && v !== "" && v !== "all") url.searchParams.set(k, String(v));
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), init);
  } catch {
    throw new ApiError("Service temporairement indisponible.", 0);
  }
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = rec(await res.json());
      message = str(pick(body, ["message", "detail", "error"])) ?? message;
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

function normalizeDentist(raw: unknown, index: number): ApiDentist {
  const o = rec(raw);
  const sourcesRaw = pick(o, ["sources", "source_list", "source"]);
  const single = str(sourcesRaw);
  const sources: string[] = Array.isArray(sourcesRaw)
    ? sourcesRaw.map((s) => str(rec(s)["name"]) ?? str(s)).filter((s): s is string => !!s)
    : single
      ? [single]
      : [];

  return {
    id: str(pick(o, ["id", "dentist_id", "uuid", "_id"])) ?? `dentist-${index}`,
    name: str(pick(o, ["name", "full_name", "nom", "raison_sociale"])) ?? "Nom non communiqué",
    speciality: str(pick(o, ["speciality", "specialty", "specialite", "specialité"])),
    gouvernorat: str(pick(o, ["gouvernorat", "governorate", "region"])),
    localite: str(pick(o, ["localite", "locality", "ville", "city", "delegation"])),
    address: str(pick(o, ["address", "adresse"])),
    phone: str(pick(o, ["phone", "telephone", "tel", "phone_number"])),
    googleMapsUrl: str(pick(o, ["googleMapsUrl", "google_maps_url", "maps_url", "map_url"])),
    latitude: num(pick(o, ["latitude", "lat"])),
    longitude: num(pick(o, ["longitude", "lng", "lon"])),
    sources,
  };
}

export type DentistQuery = {
  q?: string;
  gouvernorat?: string;
  localite?: string;
  speciality?: string;
  source?: string;
  name?: string;
  withPhone?: boolean;
  page: number;
  pageSize: number;
};

export async function fetchDentists(query: DentistQuery): Promise<DentistsResponse> {
  const data = rec(
    await request<unknown>("/api/dentists", {
      params: {
        q: query.q,
        search: query.q,
        gouvernorat: query.gouvernorat,
        localite: query.localite,
        speciality: query.speciality,
        source: query.source,
        name: query.name,
        has_phone: query.withPhone ? "true" : undefined,
        page: query.page,
        page_size: query.pageSize,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      },
    }),
  );

  const listRaw = pick(data, ["items", "results", "data", "dentists"]);
  const list = Array.isArray(listRaw) ? listRaw : Array.isArray(data) ? (data as unknown[]) : [];
  const items = list.map(normalizeDentist);
  const total = num(pick(data, ["total", "count", "total_count"])) ?? items.length;

  return {
    items,
    total,
    page: num(pick(data, ["page"])) ?? query.page,
    pageSize: num(pick(data, ["page_size", "pageSize", "limit"])) ?? query.pageSize,
  };
}

export async function fetchDentist(id: string): Promise<ApiDentist> {
  return normalizeDentist(await request<unknown>(`/api/dentists/${encodeURIComponent(id)}`), 0);
}

export async function fetchStats(): Promise<PublicStats> {
  const o = rec(await request<unknown>("/api/stats"));
  return {
    dentists: num(pick(o, ["dentists", "unique_dentists", "total_dentists", "dentists_count"])),
    withPhone: num(pick(o, ["with_phone", "withPhone", "phones", "dentists_with_phone"])),
    governoratesCovered: num(pick(o, ["governorates_covered", "gouvernorats_couverts"])),
    governoratesTotal: num(pick(o, ["governorates_total"])) ?? 24,
  };
}

export async function fetchFilters(): Promise<FiltersResponse> {
  const o = rec(await request<unknown>("/api/dentists/filters"));
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => str(rec(x)["name"]) ?? str(x)).filter((s): s is string => !!s) : [];
  const localitesRaw = rec(pick(o, ["localites", "localities", "villes"]));
  const localites: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(localitesRaw)) localites[k] = arr(v);
  return {
    gouvernorats: arr(pick(o, ["gouvernorats", "governorates"])),
    localites,
    specialites: arr(pick(o, ["specialites", "specialities", "specialties"])),
    sources: arr(pick(o, ["sources"])),
  };
}

export async function fetchGovernorates(): Promise<GovernorateCount[]> {
  const data = await request<unknown>("/api/governorates");
  const listRaw = Array.isArray(data) ? data : pick(rec(data), ["items", "governorates", "data"]);
  const list = Array.isArray(listRaw) ? listRaw : [];
  return list
    .map((raw) => {
      const o = rec(raw);
      return {
        name: str(pick(o, ["name", "gouvernorat", "governorate", "label"])) ?? "",
        count: num(pick(o, ["count", "dentists", "total", "dentists_count"])) ?? 0,
      };
    })
    .filter((g) => g.name.length > 0);
}

export async function fetchScanStatus(): Promise<ScanStatus> {
  const o = rec(await request<unknown>("/api/scan-card/status"));
  const available = pick(o, ["available", "enabled", "ready", "ocr_available"]);
  return {
    available: available === true || available === "true",
    engine: str(pick(o, ["engine", "provider"])) ?? undefined,
    languages: Array.isArray(o["languages"]) ? (o["languages"] as string[]) : undefined,
  };
}

export async function scanCard(file: File): Promise<ScanFields> {
  const form = new FormData();
  form.append("file", file);
  const data = rec(await request<unknown>("/api/scan-card", { method: "POST", body: form }));
  const o = rec(pick(data, ["fields", "data", "result"]) ?? data);
  return {
    name: str(pick(o, ["name", "nom", "full_name"])) ?? "",
    speciality: str(pick(o, ["speciality", "specialite", "specialty"])) ?? "",
    phone: str(pick(o, ["phone", "telephone", "tel"])) ?? "",
    address: str(pick(o, ["address", "adresse"])) ?? "",
    localite: str(pick(o, ["localite", "ville", "city", "locality"])) ?? "",
  };
}

export async function sendChat(message: string, sessionId: string): Promise<ChatReply> {
  const o = rec(
    await request<unknown>("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    }),
  );
  const f = rec(pick(o, ["filters", "search_filters", "suggested_filters"]));
  const speciality = str(pick(f, ["speciality", "specialite", "specialty"]));
  const gouvernorat = str(pick(f, ["gouvernorat", "governorate"]));
  const localite = str(pick(f, ["localite", "ville", "locality"]));
  const dentistsRaw = pick(o, ["dentists", "results", "items", "matches"]);
  const dentists = Array.isArray(dentistsRaw) ? dentistsRaw.map(normalizeDentist) : [];
  return {
    sessionId: str(pick(o, ["session_id", "sessionId"])) ?? sessionId,
    message:
      str(pick(o, ["message", "reply", "answer", "response", "text"])) ??
      "Je n'ai pas de réponse pour le moment.",
    ...(dentists.length ? { dentists } : {}),
    filters:
      speciality || gouvernorat || localite
        ? {
            ...(speciality ? { speciality } : {}),
            ...(gouvernorat ? { gouvernorat } : {}),
            ...(localite ? { localite } : {}),
          }
        : null,
  };
}

export async function resetChat(sessionId: string): Promise<void> {
  await request<unknown>(`/api/chat/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

export async function submitCabinetProposal(fields: ScanFields): Promise<void> {
  await request<unknown>("/api/cabinet-proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
}

export function initials(name: string): string {
  const parts = name
    .replace(/^(Dr\.?|Docteur|Pr\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export async function fetchOverview(filters?: {
  gouvernorat?: string;
  speciality?: string;
  source?: string;
}): Promise<OverviewDataResponse> {
  return request<OverviewDataResponse>("/api/overview", {
    ...(filters ? { params: filters } : {}),
  });
}
