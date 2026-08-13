import { BadgeCheck, MapPin, Phone, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dentist } from "@/lib/dalili-data";

export function DentistCard({ dentist }: { dentist: Dentist }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-soft">
        <img
          src={dentist.photo}
          alt={`Portrait de ${dentist.name}`}
          loading="lazy"
          width={512}
          height={512}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {dentist.verified ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-turquoise px-2.5 py-1 text-[11px] font-semibold text-turquoise-foreground shadow-sm">
            <BadgeCheck className="size-3.5" /> Vérifié
          </span>
        ) : null}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-navy">
          <Star className="size-3.5 fill-chart-4 text-chart-4" /> {dentist.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="truncate text-base font-bold text-navy">{dentist.name}</h3>
        <p className="text-sm font-medium text-turquoise">{dentist.speciality}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {dentist.gouvernorat} · {dentist.ville}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="size-4 shrink-0 text-primary" />
          <span className="truncate">{dentist.phone}</span>
        </p>
        <p className="text-xs text-muted-foreground">{dentist.reviews} avis patients</p>
        <Button variant="outline" className="mt-3 w-full rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
          Voir le profil
        </Button>
      </div>
    </article>
  );
}