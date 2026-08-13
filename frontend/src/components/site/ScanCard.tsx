import { ScanLine, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ScanCard() {
  return (
    <div className="rounded-3xl border border-dashed border-turquoise/40 bg-soft-2/60 p-6 shadow-[var(--shadow-card)]">
      <span className="grid size-11 place-items-center rounded-2xl bg-turquoise/15 text-turquoise">
        <ScanLine className="size-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-navy">Scanner une carte</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Importez la photo d'une carte de visite d'un cabinet : nous extrayons le nom, la spécialité
        et les coordonnées pour compléter l'annuaire.
      </p>
      <Button variant="outline" className="mt-4 rounded-full border-turquoise/40 text-turquoise hover:bg-turquoise hover:text-turquoise-foreground">
        <Upload className="size-4" /> Importer une carte
      </Button>
    </div>
  );
}