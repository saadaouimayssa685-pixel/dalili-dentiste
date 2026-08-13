import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Bot,
  Handshake,
  Users,
  Briefcase,
  Lock,
  MapPinned,
  ShieldCheck,
  Sparkle,
} from "lucide-react";

import clinic from "@/assets/clinic.jpg";
import hero from "@/assets/hero-tooth.jpg";
import { DentistCard } from "@/components/site/DentistCard";
import { Button } from "@/components/ui/button";
import { DENTISTS } from "@/lib/dalili-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dalili Dentiste Tounsi — Trouver un dentiste en Tunisie" },
      {
        name: "description",
        content:
          "Annuaire dentaire tunisien : profils vérifiés, couverture des 24 gouvernorats et assistant intelligent pour trouver un dentiste proche de vous.",
      },
      { property: "og:title", content: "Dalili Dentiste Tounsi" },
      {
        property: "og:description",
        content: "Le guide intelligent pour trouver un dentiste de confiance partout en Tunisie.",
      },
    ],
  }),
  component: Index,
});

const VALEURS = [
  { icon: ShieldCheck, title: "Fiabilité", text: "Des informations recoupées et vérifiées." },
  { icon: MapPinned, title: "Proximité", text: "Un cabinet près de chez vous, partout." },
  { icon: Award, title: "Excellence", text: "Des profils clairs et de qualité." },
  { icon: Handshake, title: "Engagement", text: "Un service au service des patients." },
];

const AVANTAGES = [
  {
    icon: ShieldCheck,
    title: "Profils vérifiés",
    text: "Chaque fiche est recoupée avec plusieurs sources avant publication.",
  },
  {
    icon: MapPinned,
    title: "Couverture nationale",
    text: "Les 24 gouvernorats tunisiens couverts, du nord au sud.",
  },
  {
    icon: Bot,
    title: "Assistant intelligent",
    text: "Un assistant qui vous oriente vers la bonne spécialité et la bonne ville.",
  },
  {
    icon: Lock,
    title: "Données sécurisées",
    text: "Aucune donnée de santé collectée, informations strictement professionnelles.",
  },
];

function Index() {
  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="bg-gradient-to-b from-soft via-background to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-turquoise/12 px-3 py-1 text-xs font-semibold text-turquoise">
              <Sparkle className="size-3.5" /> Annuaire dentaire de Tunisie
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl">
              Tlawwej 3la <span className="text-turquoise">dentiste</span> ? Dalili m3ak.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Le guide intelligent pour trouver un dentiste de confiance, proche de vous, partout en
              Tunisie.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                to="/public"
                className="group rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-turquoise/40 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-turquoise/12 text-turquoise">
                  <Users className="size-5" />
                </span>
                <h2 className="mt-4 font-bold text-navy">Espace grand public</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rechercher un dentiste par gouvernorat, ville et spécialité.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-turquoise">
                  Découvrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              <Link
                to="/professional"
                className="group rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Briefcase className="size-5" />
                </span>
                <h2 className="mt-4 font-bold text-navy">Espace professionnel</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gérer votre cabinet, vos statistiques et vos informations.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Accéder <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 rounded-full bg-turquoise/10 blur-3xl" aria-hidden />
            <img
              src={hero}
              alt="Dent blanche 3D posée sur la carte de la Tunisie avec un repère de localisation"
              width={1200}
              height={1200}
              className="relative w-full rounded-[2rem] object-cover shadow-[var(--shadow-lift)]"
            />
          </div>
        </div>
      </section>

      {/* À PROPOS */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <img
          src={clinic}
          alt="Intérieur d'un cabinet dentaire moderne"
          loading="lazy"
          width={1200}
          height={900}
          className="w-full rounded-3xl object-cover shadow-[var(--shadow-lift)]"
        />
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-turquoise">
            À propos
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
            Notre mission, votre sourire.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dalili Dentiste Tounsi rassemble et vérifie les informations des cabinets dentaires de
            toute la Tunisie. Notre objectif est simple : vous permettre d'identifier rapidement un
            praticien adapté à votre besoin et proche de chez vous, avec des données claires et à
            jour.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {VALEURS.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <v.icon className="size-5 text-turquoise" />
                <h3 className="mt-2 font-bold text-navy">{v.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-6 rounded-full border-navy/20 text-navy">
            <Link to="/about">
              En savoir plus <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* DENTISTES RECOMMANDÉS */}
      <section className="bg-soft/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold tracking-tight text-navy">
                Dentistes recommandés
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Une sélection de praticiens vérifiés dans plusieurs gouvernorats.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 rounded-full border-primary/30 text-primary">
              <Link to="/public/recherche">Voir tous les dentistes</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DENTISTS.slice(0, 4).map((d) => (
              <DentistCard key={d.id} dentist={d} />
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI DALILI */}
      <section className="bg-soft-2/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy">
            Pourquoi choisir Dalili ?
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AVANTAGES.map((a) => (
              <div
                key={a.title}
                className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-turquoise/12 text-turquoise">
                  <a.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-bold text-navy">{a.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
