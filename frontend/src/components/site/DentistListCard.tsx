import { BadgeCheck, Heart, MapPin, Phone, Star, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Dentist } from "@/lib/dalili-data";

export function DentistListCard({ dentist }: { dentist: Dentist }) {
  const [fav, setFav] = useState(false);

  return (
    <article className="group rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)] lg:grid-cols-[132px_minmax(0,1fr)_auto]">
        <div className="relative overflow-hidden rounded-2xl bg-soft">
          <img
            src={dentist.photo}
            alt={`Portrait de ${dentist.name}`}
            loading="lazy"
            width={264}
            height={264}
            className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-full"
          />
          {dentist.verified ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-turquoise shadow-sm">
              <BadgeCheck className="size-3" /> Vérifié
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="flex min-w-0 items-center gap-1.5 text-base font-bold text-navy">
              <span className="truncate">{dentist.name}</span>
              {dentist.verified ? (
                <BadgeCheck className="size-4 shrink-0 text-primary" />
              ) : null}
            </h3>
            <button
              type="button"
              aria-label="Ajouter aux favoris"
              aria-pressed={fav}
              onClick={() => setFav((v) => !v)}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-soft hover:text-primary lg:hidden"
            >
              <Heart className={`size-4 ${fav ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${i < Math.round(dentist.rating) ? "fill-chart-4 text-chart-4" : "text-border"}`}
                />
              ))}
            </span>
            <span className="font-semibold text-navy">{dentist.rating.toFixed(1)}</span>
            <span>({dentist.reviews} avis)</span>
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-soft-2 px-2.5 py-1 text-[11px] font-semibold text-turquoise">
              {dentist.speciality}
            </span>
            <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
              {dentist.gouvernorat}
            </span>
          </div>

          <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {dentist.address} · {dentist.ville}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="size-4 shrink-0 text-primary" />
            <span className="truncate">{dentist.phone}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:w-52">
          <div className="hidden justify-end lg:flex">
            <button
              type="button"
              aria-label="Ajouter aux favoris"
              aria-pressed={fav}
              onClick={() => setFav((v) => !v)}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-soft hover:text-primary"
            >
              <Heart className={`size-4 ${fav ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>
          <Button
            asChild
            variant="secondary"
            className="w-full rounded-xl bg-soft text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <a href={`tel:${dentist.phone.replace(/\s/g, "")}`}>
              <Phone className="size-4" /> Appeler
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <User className="size-4" /> Voir le profil
          </Button>
        </div>
      </div>
    </article>
  );
}
