import { createFileRoute } from "@tanstack/react-router";

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-turquoise">Dalili Dentiste</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">
        Politique de confidentialite
      </h1>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-muted-foreground shadow-[var(--shadow-card)]">
        <p>
          Le projet conserve les donnees utiles a la qualite de l'annuaire. Les numeros de telephone
          peuvent etre proteges dans les exports selon la configuration du backend.
        </p>
        <p className="mt-4">
          Les propositions envoyees depuis le scan OCR ou le formulaire sont gardees pour controle et
          validation avant publication.
        </p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/confidentialite")({
  component: PrivacyPage,
});
