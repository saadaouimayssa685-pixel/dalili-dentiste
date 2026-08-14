import { ExternalLink, MapPin, Phone, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { initials, type ApiDentist } from "@/lib/dalili-api";
import { dentistMapsUrl } from "@/lib/maps";

export function DentistCard({
  dentist,
  onOpen,
}: {
  dentist: ApiDentist;
  onOpen: (d: ApiDentist) => void;
}) {
  const location = [dentist.gouvernorat, dentist.localite].filter(Boolean).join(" - ");

  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-5">
      <div className="flex min-w-0 gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-soft-2 text-base font-extrabold text-turquoise"
          aria-hidden="true"
        >
          {initials(dentist.name)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-navy">{dentist.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {dentist.speciality ? (
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="size-3.5 text-primary" aria-hidden="true" />
                {dentist.speciality}
              </span>
            ) : null}
            {location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-turquoise" aria-hidden="true" />
                {location}
              </span>
            ) : null}
          </div>

          {dentist.address ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{dentist.address}</p>
          ) : null}

          {dentist.phone ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
              <Phone className="size-3.5 text-primary" aria-hidden="true" />
              {dentist.phone}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Telephone non disponible</p>
          )}

          {dentist.sources.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Sources :</span>
              {dentist.sources.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-semibold text-navy"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {dentist.phone ? (
              <Button asChild size="sm" className="shrink-0 rounded-full px-4">
                <a href={`tel:${dentist.phone.replace(/\s/g, "")}`} aria-label={`Appeler ${dentist.name}`}>
                  <Phone className="size-4" aria-hidden="true" />
                  <span className="whitespace-nowrap">Appeler</span>
                </a>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full px-4"
              onClick={() => onOpen(dentist)}
            >
              <span className="whitespace-nowrap">Voir le profil</span>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full border-turquoise/40 px-4 text-turquoise hover:bg-turquoise/10"
            >
              <a href={dentistMapsUrl(dentist)} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="whitespace-nowrap">Voir emplacement</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
