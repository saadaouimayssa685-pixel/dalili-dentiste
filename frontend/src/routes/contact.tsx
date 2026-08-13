import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Mail, MapPin, MessageSquareText, Phone, Send, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Dalili Dentiste Tounsi" },
      {
        name: "description",
        content:
          "Contactez l'equipe Dalili Dentiste Tounsi, laissez un avis ou proposez une amelioration.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="bg-background">
      <section className="border-b border-border bg-gradient-to-b from-soft to-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-turquoise/10 px-4 py-2 text-sm font-bold text-turquoise">
              <MessageSquareText className="size-4" aria-hidden="true" />
              Contact & avis
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
              Une remarque, une correction ou un avis ?
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Dalili Dentiste avance avec les retours des patients, dentistes, delegues et
              collecteurs. Partagez une correction, une experience ou une idee pour ameliorer la
              qualite de la base.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex items-start gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Star className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-navy">Laisser un avis</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre message reste une proposition de qualite. Il ne modifie pas la base sans
                validation.
              </p>
            </div>
          </div>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
              event.currentTarget.reset();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Nom
                <Input required placeholder="Votre nom" className="rounded-xl" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Email ou telephone
                <Input required placeholder="contact@exemple.com" className="rounded-xl" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Sujet
              <Input placeholder="Correction, avis, suggestion..." className="rounded-xl" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Message
              <Textarea
                required
                placeholder="Ecrivez votre avis ou la correction a verifier..."
                className="min-h-36 rounded-xl"
              />
            </label>
            <Button type="submit" className="w-fit rounded-full px-6">
              <Send className="size-4" aria-hidden="true" />
              Envoyer l'avis
            </Button>
            {sent ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-turquoise/20 bg-turquoise/10 p-4 text-sm text-turquoise"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-extrabold">Message envoye avec succes.</p>
                  <p className="mt-1 text-turquoise/90">
                    Merci pour votre retour. L'equipe Dalili le consultera avant toute mise a jour
                    de la base.
                  </p>
                </div>
              </div>
            ) : null}
          </form>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="text-2xl font-extrabold text-navy">Nos contacts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pour les propositions de cabinets, corrections de fiches ou partenariats data.
            </p>
            <div className="mt-6 space-y-4">
              <ContactLine icon={Mail} label="Email" value="contact@dalili-dentiste.tn" />
              <ContactLine icon={Phone} label="Telephone" value="+216 00 000 000" />
              <ContactLine icon={MapPin} label="Zone" value="Tunisie - couverture nationale" />
            </div>
          </div>

          <div className="rounded-3xl border border-turquoise/20 bg-[linear-gradient(135deg,rgba(8,151,157,0.12),rgba(18,103,216,0.08))] p-6">
            <h3 className="text-lg font-extrabold text-navy">Ce que vous pouvez envoyer</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Correction d'adresse, telephone ou localite.</li>
              <li>Signalement d'une fiche fermee ou obsolete.</li>
              <li>Ajout d'un cabinet dentaire public.</li>
              <li>Retour sur l'experience de recherche.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-soft/70 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-turquoise">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-semibold text-navy">{value}</p>
      </div>
    </div>
  );
}
