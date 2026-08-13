import { MapPin, Sparkles } from "lucide-react";

export function PublicHero() {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-turquoise/20 bg-turquoise/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-turquoise">
        <Sparkles className="size-3.5" aria-hidden="true" /> Espace grand public
      </span>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]">
        Trouvez le bon <span className="text-turquoise">dentiste</span> près de chez vous
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
        Recherchez parmi les dentistes référencés partout en Tunisie selon votre gouvernorat, votre
        localité ou votre besoin.
      </p>
      <p className="mx-auto mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy/70">
        <MapPin className="size-3.5 text-turquoise" aria-hidden="true" />
        24 gouvernorats, une recherche simple et des coordonnées utiles
      </p>
    </div>
  );
}
