import { createFileRoute } from "@tanstack/react-router";

function LegalNoticePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-turquoise">Dalili Dentiste</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">
        Mentions legales
      </h1>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-muted-foreground shadow-[var(--shadow-card)]">
        <p>
          Dalili Dentiste Tounsi est un projet open source de collecte, consolidation, OCR et
          visualisation de donnees publiques liees aux dentistes en Tunisie.
        </p>
        <p className="mt-4">
          Les sources restent citees dans la base et les donnees doivent etre verifiees avant usage
          commercial ou operationnel.
        </p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/mentions-legales")({
  component: LegalNoticePage,
});
