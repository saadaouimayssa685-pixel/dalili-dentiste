import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  Database,
  Eye,
  HeartHandshake,
  ListChecks,
  Search,
  ShieldCheck,
  Target,
} from "lucide-react";

import clinic from "@/assets/clinic.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Dalili Dentiste Tounsi" },
      {
        name: "description",
        content:
          "Qui sommes-nous, notre mission, notre vision et nos engagements pour un annuaire dentaire fiable en Tunisie.",
      },
      { property: "og:title", content: "À propos — Dalili Dentiste Tounsi" },
      {
        property: "og:description",
        content: "Notre mission : rendre l'information dentaire claire, vérifiée et accessible.",
      },
    ],
  }),
  component: AboutPage,
});

const ENGAGEMENTS = [
  {
    icon: ShieldCheck,
    title: "Vérification des informations",
    text: "Chaque fiche est recoupée avec plusieurs sources publiques avant publication et mise à jour régulièrement.",
  },
  {
    icon: Eye,
    title: "Transparence des sources",
    text: "Nous indiquons publiquement l'origine des données utilisées pour construire l'annuaire.",
  },
  {
    icon: HeartHandshake,
    title: "Respect des praticiens",
    text: "Tout dentiste peut revendiquer, corriger ou retirer sa fiche à tout moment via l'espace professionnel.",
  },
  {
    icon: Database,
    title: "Protection des données",
    text: "Aucune donnée de santé n'est collectée. Les informations affichées sont strictement professionnelles.",
  },
];

const ETAPES = [
  {
    icon: Database,
    title: "1. Collecte",
    text: "Agrégation d'informations professionnelles publiques : annuaires, registres et sites de cabinets.",
  },
  {
    icon: ListChecks,
    title: "2. Structuration",
    text: "Normalisation des noms, spécialités, gouvernorats, villes et coordonnées dans un format unique.",
  },
  {
    icon: ShieldCheck,
    title: "3. Vérification",
    text: "Recoupement multi-sources, détection des doublons et validation avant l'attribution du badge Vérifié.",
  },
  {
    icon: Search,
    title: "4. Consultation",
    text: "Recherche par gouvernorat, ville et spécialité, avec un assistant qui guide vers le bon cabinet.",
  },
];

function AboutPage() {
  return (
    <div className="bg-background">
      <section className="bg-gradient-to-b from-soft to-background">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <span className="inline-flex rounded-full bg-turquoise/12 px-3 py-1 text-xs font-semibold text-turquoise">
            À propos
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            L'annuaire dentaire tunisien, pensé pour la confiance.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Dalili Dentiste Tounsi rassemble, structure et vérifie l'information des cabinets
            dentaires de Tunisie afin que chacun trouve rapidement un praticien proche de chez lui.
            Nous sommes un service d'information : nous ne délivrons ni diagnostic ni conseil
            médical.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
        <img
          src={clinic}
          alt="Cabinet dentaire moderne et lumineux en Tunisie"
          loading="lazy"
          width={1200}
          height={900}
          className="w-full rounded-3xl object-cover shadow-[var(--shadow-lift)]"
        />
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-navy">Qui sommes-nous ?</h2>
            <p className="mt-2 text-muted-foreground">
              Une équipe tunisienne de spécialistes de la donnée et du produit, convaincue que
              trouver un dentiste ne devrait pas dépendre du hasard ou du bouche-à-oreille. Nous
              construisons une base fiable, ouverte aux corrections des praticiens.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <Target className="size-5 text-turquoise" />
              <h3 className="mt-2 font-bold text-navy">Notre mission</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Rendre l'information dentaire claire, vérifiée et accessible dans les 24
                gouvernorats.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <Compass className="size-5 text-primary" />
              <h3 className="mt-2 font-bold text-navy">Notre vision</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Devenir la référence nationale de l'orientation dentaire, utile aux patients comme
                aux cabinets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-soft-2/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-navy">Nos engagements</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ENGAGEMENTS.map((e) => (
              <div
                key={e.title}
                className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-turquoise/12 text-turquoise">
                  <e.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-bold text-navy">{e.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{e.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-navy">
          De la collecte à la consultation
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
          Un processus transparent en quatre étapes, conçu pour limiter les erreurs et garder les
          fiches à jour.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((s) => (
            <div key={s.title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-navy">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/public">Espace grand public</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-navy/20 text-navy">
            <Link to="/professional">Espace professionnel</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}