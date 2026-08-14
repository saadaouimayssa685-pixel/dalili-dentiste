import { createFileRoute } from "@tanstack/react-router";

function LegalPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-turquoise">Dalili Dentiste</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">
        Conditions d'utilisation
      </h1>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-muted-foreground shadow-[var(--shadow-card)]">
        <p>
          Dalili Dentiste Tounsi est un annuaire informatif. Les donnees affichees servent a aider
          les utilisateurs, delegues et prospecteurs a retrouver des cabinets dentaires publics.
        </p>
        <p className="mt-4">
          Les informations peuvent etre corrigees, signalees ou completees. Aucune information ne
          remplace un avis medical ou une verification officielle.
        </p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/conditions")({
  component: LegalPage,
});
