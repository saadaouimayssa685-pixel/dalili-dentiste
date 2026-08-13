import { MessagesSquare } from "lucide-react";

import { AssistantThread } from "@/components/public/AssistantThread";

export function DaliliAssistant() {
  return (
    <section
      id="assistant-dalili"
      aria-labelledby="assistant-title"
      className="flex h-full min-h-[26rem] flex-col rounded-3xl border border-border/70 bg-gradient-to-b from-card to-soft/40 p-6 shadow-[var(--shadow-card)] sm:p-7"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-turquoise/12 text-turquoise ring-1 ring-turquoise/20">
          <MessagesSquare className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 id="assistant-title" className="text-lg font-bold text-navy">
            Assistant Dalili
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Décrivez simplement ce que vous recherchez. Dalili vous aide à trouver les dentistes
            correspondant à votre besoin.
          </p>
          <span className="mt-2.5 inline-flex items-center rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-navy">
            Français · Tunisien · Arabizi
          </span>
        </div>
      </div>
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <AssistantThread />
      </div>
    </section>
  );
}