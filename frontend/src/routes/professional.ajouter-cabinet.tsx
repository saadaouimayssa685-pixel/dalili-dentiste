import { createFileRoute } from "@tanstack/react-router";

import { AddCabinetForm } from "@/components/pro/AddCabinetForm";

export const Route = createFileRoute("/professional/ajouter-cabinet")({
  head: () => ({
    meta: [
      { title: "Ajouter mon cabinet — Dalili Dentiste Tounsi" },
      {
        name: "description",
        content:
          "Dentistes en Tunisie : proposez l'ajout ou la mise à jour de votre cabinet sur l'annuaire Dalili Dentiste Tounsi.",
      },
      { property: "og:title", content: "Ajouter mon cabinet — Dalili Dentiste Tounsi" },
      {
        property: "og:description",
        content: "Rendez votre cabinet dentaire plus visible auprès des patients tunisiens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddCabinetForm,
});
