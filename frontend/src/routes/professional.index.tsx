import { createFileRoute } from "@tanstack/react-router";

import { ProDashboard } from "@/components/pro/ProDashboard";

export const Route = createFileRoute("/professional/")({
  head: () => ({
    meta: [
      { title: "Espace professionnel — Dalili Dentiste Tounsi" },
      {
        name: "description",
        content:
          "Tableau de bord professionnel : indicateurs, sources de données, propositions, qualité, doublons, localités et exports.",
      },
      { property: "og:title", content: "Espace professionnel — Dalili Dentiste Tounsi" },
      {
        property: "og:description",
        content: "Pilotez l'annuaire dentaire tunisien depuis le tableau de bord Dalili.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProDashboard,
});
