import { createFileRoute } from "@tanstack/react-router";

function ReportPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-turquoise">Dalili Dentiste</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">
        Signaler une information
      </h1>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-muted-foreground shadow-[var(--shadow-card)]">
        <p>
          Pour signaler une erreur, utilisez la page contact ou le formulaire d'ajout de cabinet en
          precisant le nom du dentiste, la source et la correction proposee.
        </p>
        <p className="mt-4">
          Les signalements alimentent la file de qualite et ne modifient pas automatiquement la base.
        </p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/signaler")({
  component: ReportPage,
});
