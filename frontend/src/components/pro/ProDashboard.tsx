import {
  BadgeCheck,
  Copy,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileSearch,
  Inbox,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Map as MapIcon,
  Phone,
  RefreshCw,
  Rows3,
  ScanLine,
  ScrollText,
  Search,
  Server,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import clinicImage from "@/assets/professional/professional-dashboard-clinic.webp";
import { TunisiaCoverageMap } from "@/components/pro/overview/TunisiaCoverageMap";
import { OverviewDashboard } from "@/components/pro/overview/OverviewDashboard";
import { ScanCard } from "@/components/site/ScanCard";
import { SearchEngine, type Filters } from "@/components/site/SearchEngine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DENTISTS, GOUVERNORATS, VILLES } from "@/lib/dalili-data";
import { getOverviewData } from "@/lib/overview-data";
import {
  DENTIST_SOURCES,
  DOUBLONS,
  LOGS,
  QUALITE,
  SOURCE_FEEDS,
  TELECHARGEMENTS,
  downloadCsv,
  triggerDatasetExport,
  triggerSourceExport,
  toCsv,
  type SourceFeed,
} from "@/lib/pro-data";

const NAV = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "dentists", label: "Dentistes", icon: UserRound },
  { id: "sources", label: "Sources de données", icon: Database },
  { id: "quality", label: "Qualité des données", icon: ShieldCheck },
  { id: "duplicates", label: "Doublons", icon: Copy },
  { id: "localities", label: "Localités", icon: MapPin },
  { id: "database", label: "Base de données", icon: Server },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "scan", label: "Scan carte", icon: ScanLine },
  { id: "map", label: "Cartographie", icon: MapIcon },
  { id: "downloads", label: "Téléchargements", icon: FileSpreadsheet },
] as const;

type SectionId = (typeof NAV)[number]["id"];

const MAIN_NAV = NAV.slice(0, 8);

const KPIS = [
  { icon: UserRoundCheck, label: "Dentistes uniques", value: "4 095" },
  { icon: Rows3, label: "Lignes sources", value: "4 295" },
  { icon: Phone, label: "Avec téléphone", value: "3 598" },
  { icon: MapPinned, label: "Gouvernorats couverts", value: "24/24" },
];

const LAST_UPDATE = "Dernière mise à jour : 29/07/2026 · 12:52";

function initials(name: string) {
  return name
    .replace(/[^A-Za-zÀ-ÿ ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function EmptyState({
  icon: Icon = Inbox,
  title = "Aucun résultat trouvé",
  message = "Modifiez les critères de recherche ou actualisez les données.",
  action,
}: {
  icon?: typeof Inbox;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-turquoise/40 bg-soft-2/50 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-turquoise/12 text-turquoise">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-bold text-navy">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label={label}
          onClick={onClick}
          className="size-9 rounded-full"
        >
          <Icon className="size-[18px] text-navy" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const ACTION_CARDS = [
  {
    id: "scan",
    title: "Scanner une carte",
    description: "OCR carte visite, extraction telephone, cabinet, adresse et specialite.",
    icon: ScanLine,
    emoji: "OCR",
    tone: "from-turquoise/18 to-primary/8",
  },
  {
    id: "map",
    title: "Cartographie",
    description: "Visualiser la couverture nationale avec une carte de Tunisie dynamique.",
    icon: MapIcon,
    emoji: "MAP",
    tone: "from-primary/14 to-turquoise/10",
  },
  {
    id: "sources",
    title: "Sources & qualite",
    description: "Suivre les sources actives, doublons, logs et qualite des fiches.",
    icon: Database,
    emoji: "DATA",
    tone: "from-violet-500/10 to-turquoise/12",
  },
] as const;

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SourceBadges({ sources }: { sources: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <Badge
          key={s}
          variant="secondary"
          className="rounded-full bg-turquoise/12 text-[11px] font-semibold text-turquoise"
        >
          {s}
        </Badge>
      ))}
    </div>
  );
}

function ProActionHub({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (section: SectionId) => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {ACTION_CARDS.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`group overflow-hidden rounded-3xl border bg-card text-left shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
              selected ? "border-primary ring-4 ring-primary/10" : "border-border"
            }`}
          >
            <div className={`relative min-h-36 bg-gradient-to-br ${item.tone} p-5`}>
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/70 blur-sm" />
              <div className="absolute bottom-3 right-4 text-5xl font-black text-navy/5">
                {item.emoji}
              </div>
              <div className="relative flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-turquoise shadow-sm">
                  <item.icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-navy">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <span className="relative mt-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-primary">
                Ouvrir le module
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}

export function ProDashboard() {
  const [section, setSection] = useState<SectionId>("overview");
  const [preview, setPreview] = useState<SourceFeed | null>(null);
  const [filters, setFilters] = useState<Filters>({
    gouvernorat: "all",
    ville: "all",
    speciality: "all",
  });
  const overviewData = useMemo(() => getOverviewData(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (NAV.some((item) => item.id === hash)) setSection(hash as SectionId);
  }, []);

  const results = useMemo(
    () =>
      DENTISTS.filter(
        (d) =>
          (filters.gouvernorat === "all" || d.gouvernorat === filters.gouvernorat) &&
          (filters.ville === "all" || d.ville === filters.ville) &&
          (filters.speciality === "all" || d.speciality === filters.speciality),
      ),
    [filters],
  );

  const current = NAV.find((n) => n.id === section)!;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Espace professionnel
            </p>
            <p className="truncate px-2 pt-0.5 font-bold text-navy">Dalili Dentiste Tounsi</p>
            <nav className="mt-4 flex min-w-0 max-w-full gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
              {MAIN_NAV.map((n) => {
                const active = n.id === section;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSection(n.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:w-full ${
                      active
                        ? "bg-turquoise text-turquoise-foreground"
                        : "text-muted-foreground hover:bg-soft hover:text-navy"
                    }`}
                  >
                    <n.icon className="size-[18px] shrink-0" />
                    <span className="whitespace-nowrap">{n.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="space-y-6">
          {section === "overview" ? null : (
            <header className="relative overflow-hidden rounded-[20px] border border-border shadow-[var(--shadow-card)]">
              <img
                src={clinicImage}
                alt="Cabinet dentaire moderne, lumineux et professionnel"
                width={1600}
                height={600}
                loading="lazy"
                className="h-40 w-full object-cover sm:h-52"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/10" />
              <div className="absolute inset-0 flex flex-col justify-center gap-1 px-5 sm:px-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                  {current.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Espace professionnel Dalili Dentiste Tounsi
                </p>
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-turquoise">
                  <RefreshCw className="size-[18px]" /> {LAST_UPDATE}
                </p>
              </div>
            </header>
          )}

          {section === "overview" ? null : <ProActionHub active={section} onSelect={setSection} />}

          {section === "overview" ? null : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </p>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-turquoise/12 text-turquoise">
                    <k.icon className="size-[18px]" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-navy">{k.value}</p>
              </div>
            ))}
          </div>
          )}

          {section === "overview" ? (
            <>
              <OverviewDashboard />
            </>
          ) : null}

          {section === "dentists" ? (
            <>
              <SearchEngine filters={filters} onChange={setFilters} />
              <Panel
                title="Dentistes référencés"
                description="Chaque fiche indique ses sources d'origine."
              >
                <div className="space-y-3">
                  {results.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-soft/50 p-4"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-navy">
                          {d.name}
                          {d.verified ? <BadgeCheck className="size-4 text-turquoise" /> : null}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {d.speciality} · {d.gouvernorat} · {d.ville}
                        </p>
                        <div className="mt-2">
                          <SourceBadges sources={DENTIST_SOURCES[d.id] ?? []} />
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold text-navy">{d.rating.toFixed(1)} ★</p>
                        <p className="text-muted-foreground">{d.phone}</p>
                      </div>
                    </div>
                  ))}
                  {!results.length ? (
                    <EmptyState
                      icon={UserRound}
                      title="Aucun dentiste trouvé"
                      message="Modifiez les critères de recherche ou actualisez les données."
                      action={
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            setFilters({ gouvernorat: "all", ville: "all", speciality: "all" })
                          }
                        >
                          <RefreshCw className="size-[18px] text-turquoise" /> Réinitialiser
                        </Button>
                      }
                    />
                  ) : null}
                </div>
              </Panel>
            </>
          ) : null}

          {section === "sources" ? (
            <Panel
              title="Sources de données"
              description="Statut des collectes, aperçu et export Excel de chaque source."
            >
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-soft/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Site</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Dernière MAJ</th>
                      <th className="px-4 py-3">Lignes</th>
                      <th className="px-4 py-3">Données</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SOURCE_FEEDS.map((s) => (
                      <tr key={s.name} className="border-t border-border hover:bg-soft/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-soft-2 text-xs font-bold text-navy">
                              {initials(s.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-navy">{s.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{s.url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={`rounded-full text-[11px] font-semibold ${
                              s.status === "Actif"
                                ? "bg-turquoise/12 text-turquoise"
                                : s.status === "En pause"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.updatedAt}</td>
                        <td className="px-4 py-3 text-navy">{s.rows.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setPreview(s)}
                            >
                              <Eye className="size-[18px] text-navy" /> Voir les données
                            </Button>
                            <IconAction
                              label="Aperçu"
                              icon={Search}
                              onClick={() => setPreview(s)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => triggerSourceExport(s.sourceId, "xlsx")}
                            >
                              <FileSpreadsheet className="size-[18px] text-turquoise" /> Excel
                            </Button>
                            <IconAction
                              label="Télécharger CSV"
                              icon={Download}
                              onClick={() => triggerSourceExport(s.sourceId, "csv")}
                            />
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                              <FileSearch className="size-[18px]" /> Accéder aux données
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          {section === "quality" ? (
            <Panel
              title="Qualité des données"
              description="Indicateurs de complétude et de fiabilité de l'annuaire."
            >
              <div className="space-y-5">
                {QUALITE.map((q) => (
                  <div key={q.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-navy">{q.label}</span>
                      <span className="text-muted-foreground">{q.value} %</span>
                    </div>
                    <Progress value={q.value} className="mt-2 h-2" />
                  </div>
                ))}
              </div>
              {!DOUBLONS.length ? (
                <EmptyState
                  icon={Copy}
                  title="Aucun doublon"
                  message="Aucune fiche similaire n'a été détectée dans les dernières collectes."
                />
              ) : null}
            </Panel>
          ) : null}

          {section === "duplicates" ? (
            <Panel
              title="Doublons détectés"
              description="Fiches similaires issues de plusieurs sources."
            >
              <div className="space-y-3">
                {DOUBLONS.map((d) => (
                  <div
                    key={d.a}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-soft/50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">
                        {d.a} <span className="text-muted-foreground">↔</span> {d.b}
                      </p>
                      <div className="mt-2">
                        <SourceBadges sources={d.sources} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-navy">{d.score} %</span>
                      <Button size="sm" variant="outline" className="rounded-full">
                        Fusionner
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {section === "localities" ? (
            <Panel title="Localités" description="Répartition par gouvernorat et villes couvertes.">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {GOUVERNORATS.map((g) => (
                  <div key={g} className="rounded-2xl border border-border bg-soft/50 p-4">
                    <p className="font-semibold text-navy">{g}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(VILLES[g] ?? []).length} localités ·{" "}
                      {DENTISTS.filter((d) => d.gouvernorat === g).length} cabinet(s)
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {section === "database" ? (
            <Panel title="Base de données" description="Vue tabulaire consolidée de l'annuaire.">
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-soft/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Cabinet</th>
                      <th className="px-4 py-3">Spécialité</th>
                      <th className="px-4 py-3">Localisation</th>
                      <th className="px-4 py-3">Téléphone</th>
                      <th className="px-4 py-3">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DENTISTS.map((d) => (
                      <tr key={d.id} className="border-t border-border hover:bg-soft/50">
                        <td className="px-4 py-3 font-semibold text-navy">{d.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.speciality}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {d.gouvernorat} · {d.ville}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{d.phone}</td>
                        <td className="px-4 py-3">
                          <SourceBadges sources={DENTIST_SOURCES[d.id] ?? []} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                variant="outline"
                className="mt-4 rounded-full border-primary/30 text-primary"
                onClick={() =>
                  downloadCsv(
                    "dalili-base-de-donnees.csv",
                    toCsv(
                      ["Nom", "Spécialité", "Gouvernorat", "Ville", "Téléphone", "Sources"],
                      DENTISTS.map((d) => [
                        d.name,
                        d.speciality,
                        d.gouvernorat,
                        d.ville,
                        d.phone,
                        (DENTIST_SOURCES[d.id] ?? []).join(", "),
                      ]),
                    ),
                  )
                }
              >
                <Download className="size-4" /> Exporter en Excel
              </Button>
            </Panel>
          ) : null}

          {section === "logs" ? (
            <Panel title="Logs" description="Historique des imports et traitements.">
              <ul className="space-y-2">
                {LOGS.map((l) => (
                  <li
                    key={l.time + l.message}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-soft/50 px-4 py-3 text-sm"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{l.time}</span>
                    <Badge
                      variant="secondary"
                      className={`rounded-full text-[11px] font-semibold ${
                        l.level === "Info"
                          ? "bg-turquoise/12 text-turquoise"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {l.level}
                    </Badge>
                    <span className="text-navy">{l.message}</span>
                  </li>
                ))}
              </ul>
              {!LOGS.length ? (
                <EmptyState
                  icon={ScrollText}
                  title="Aucun log"
                  message="Aucun traitement n'a encore été exécuté sur cette période."
                />
              ) : null}
            </Panel>
          ) : null}

          {section === "scan" ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <ScanCard />
              <Panel
                title="Lecture intelligente"
                description="Le module OCR transforme une carte visite en proposition exploitable."
              >
                <div className="space-y-3">
                  {[
                    ["01", "Image", "Importer une carte nette ou scannee."],
                    ["02", "Extraction", "Nom, telephone, adresse, cabinet et specialite."],
                    ["03", "Validation", "La fiche reste en proposition avant ajout final."],
                  ].map(([step, title, text]) => (
                    <div key={step} className="flex gap-3 rounded-2xl bg-soft/70 p-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-sm font-black text-turquoise">
                        {step}
                      </span>
                      <div>
                        <p className="font-bold text-navy">{title}</p>
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          ) : null}

          {section === "map" ? <TunisiaCoverageMap data={overviewData.coverage} /> : null}

          {section === "downloads" ? (
            <Panel title="Téléchargements" description="Exports prêts à l'emploi.">
              <div className="grid gap-3 sm:grid-cols-2">
                {TELECHARGEMENTS.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-soft/50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.format} · {t.size} · {t.updatedAt}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={() => triggerDatasetExport(t.kind, t.fileFormat)}
                    >
                      <Download className="size-4" /> Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </main>

        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-navy">Aperçu Excel — {preview?.name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-soft/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {preview?.columns.map((c) => (
                      <th key={c} className="px-3 py-2">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview?.preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-muted-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
