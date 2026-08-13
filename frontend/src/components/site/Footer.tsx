import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Minus,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { SOURCES_PRINCIPALES, SOURCES_SECONDAIRES } from "@/lib/dalili-data";

export function Footer() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <section className="bg-soft-2">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-6 sm:px-6 lg:flex lg:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-navy">Vous êtes dentiste ?</h2>
            <p className="text-sm text-muted-foreground">
              Rejoignez l'annuaire de référence des cabinets dentaires en Tunisie.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="rounded-full border-navy/20 text-navy">
              <Link to="/professional">Espace professionnel</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/professional/ajouter-cabinet">
                Ajouter mon cabinet <Plus className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3">
            <Logo light />
            <p className="text-sm text-navy-foreground/70">
              L'annuaire dentaire intelligent de la Tunisie : des profils vérifiés, partout, pour
              tous.
            </p>
            <ul className="space-y-1.5 text-sm text-navy-foreground/80">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-turquoise" /> contact@dalili-dentiste.tn
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-turquoise" /> +216 71 000 000
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-turquoise" /> Tunis, Tunisie
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-turquoise">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm text-navy-foreground/80">
              {[
                { label: "Accueil", to: "/" },
                { label: "À propos", to: "/about" },
                { label: "Espace grand public", to: "/public" },
                { label: "Espace professionnel", to: "/professional" },
                { label: "Recherche", to: "/public/recherche" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="transition-colors hover:text-turquoise">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-turquoise">
              Liens utiles
            </h3>
            <ul className="space-y-2 text-sm text-navy-foreground/80">
              <li className="cursor-pointer transition-colors hover:text-turquoise">
                Conditions d'utilisation
              </li>
              <li className="cursor-pointer transition-colors hover:text-turquoise">
                Politique de confidentialité
              </li>
              <li className="cursor-pointer transition-colors hover:text-turquoise">
                Signaler une information
              </li>
              <li className="cursor-pointer transition-colors hover:text-turquoise">
                Mentions légales
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-turquoise">
              Sources de données
            </h3>
            <ul className="space-y-2 text-sm text-navy-foreground/80">
              {SOURCES_PRINCIPALES.map((s) => (
                <li key={s}>{s}</li>
              ))}
              {showMore ? SOURCES_SECONDAIRES.map((s) => <li key={s}>{s}</li>) : null}
            </ul>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-turquoise/40 px-3 py-1.5 text-xs font-semibold text-turquoise transition-colors hover:bg-turquoise hover:text-turquoise-foreground"
            >
              {showMore ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
              {showMore ? "Moins de sources" : "Plus de sources"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-turquoise">
                Réseaux sociaux
              </h3>
              <div className="flex gap-2">
                {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <span
                    key={i}
                    className="grid size-9 cursor-pointer place-items-center rounded-xl bg-white/10 transition-colors hover:bg-turquoise"
                  >
                    <Icon className="size-4" />
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-turquoise">
                Application
              </h3>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-navy-foreground/80">
                <Smartphone className="size-4 text-turquoise" /> Bientôt sur iOS &amp; Android
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-navy-foreground/60 sm:px-6">
            © {new Date().getFullYear()} Dalili Dentiste Tounsi — Annuaire informatif, sans conseil
            médical.
          </p>
        </div>
      </footer>
    </>
  );
}