import { ExternalLink, MapPin, Phone, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials, type ApiDentist } from "@/lib/dalili-api";
import { dentistMapsUrl } from "@/lib/maps";

export function DentistProfileDialog({
  dentist,
  onOpenChange,
}: {
  dentist: ApiDentist | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!dentist} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        {dentist ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl bg-soft-2 font-extrabold text-turquoise"
                  aria-hidden="true"
                >
                  {initials(dentist.name)}
                </span>
                <div className="min-w-0 text-left">
                  <DialogTitle className="truncate text-navy">{dentist.name}</DialogTitle>
                  <DialogDescription>
                    {dentist.speciality ?? "Specialite non communiquee"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <dl className="space-y-3 text-sm">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted-foreground">Localisation</dt>
                <dd className="min-w-0 font-medium text-navy">
                  {[dentist.gouvernorat, dentist.localite].filter(Boolean).join(" - ") ||
                    "Non communiquee"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted-foreground">Adresse</dt>
                <dd className="min-w-0 font-medium text-navy">
                  {dentist.address ?? "Non communiquee"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted-foreground">Telephone</dt>
                <dd className="min-w-0 font-medium text-navy">
                  {dentist.phone ?? "Non disponible"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted-foreground">Sources</dt>
                <dd className="flex min-w-0 flex-wrap gap-1.5">
                  {dentist.sources.length ? (
                    dentist.sources.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-semibold text-navy"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Non communiquees</span>
                  )}
                </dd>
              </div>
            </dl>

            <p className="flex items-start gap-2 rounded-2xl bg-soft/70 p-3 text-[11px] text-muted-foreground">
              <Stethoscope className="mt-0.5 size-3.5 shrink-0 text-turquoise" aria-hidden="true" />
              Informations consolidees depuis plusieurs sources publiques. Dalili affiche les donnees disponibles et garde le lien direct vers la localisation du cabinet.
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {dentist.phone ? (
                <Button asChild className="rounded-xl">
                  <a href={`tel:${dentist.phone.replace(/\s/g, "")}`}>
                    <Phone className="size-4" aria-hidden="true" /> Appeler le cabinet
                  </a>
                </Button>
              ) : (
                <Button disabled className="rounded-xl">
                  <Phone className="size-4" aria-hidden="true" /> Numero indisponible
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-xl border-turquoise/40 text-turquoise hover:bg-turquoise/10">
                <a href={dentistMapsUrl(dentist)} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden="true" /> Voir sur Google Maps
                </a>
              </Button>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              Le lien ouvre Google Maps dans un nouvel onglet.
            </p>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
