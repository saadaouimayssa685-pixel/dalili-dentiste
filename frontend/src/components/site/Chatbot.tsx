import { MessagesSquare, ScanLine, X } from "lucide-react";

import { AssistantThread } from "@/components/public/AssistantThread";
import { setAssistantOpen, useAssistant } from "@/lib/assistant-store";

export function Chatbot() {
  const { open } = useAssistant();
  const setOpen = setAssistantOpen;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex h-[26rem] w-[min(21rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between bg-navy px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-foreground">Assistant Dalili</p>
              <p className="text-[11px] text-turquoise">En ligne</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="rounded-lg p-1 text-navy-foreground/80 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-3">
            <AssistantThread compact />
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="group relative flex items-center">
          <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-navy-foreground opacity-0 shadow-[var(--shadow-card)] transition-opacity group-hover:opacity-100">
            Scanner une carte
          </span>
          <a
            href="/professional#scan"
            aria-label="Scanner une carte"
            title="Scanner une carte"
            className="grid size-12 place-items-center rounded-full bg-white text-turquoise shadow-[var(--shadow-lift)] ring-4 ring-turquoise/10 transition-transform hover:scale-105"
          >
            <ScanLine className="size-5" />
          </a>
        </div>
        <div className="group relative flex items-center">
        <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-navy-foreground opacity-0 shadow-[var(--shadow-card)] transition-opacity group-hover:opacity-100">
          Assistant Dalili
        </span>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Assistant Dalili"
          title="Assistant Dalili"
          className="grid size-14 animate-[pulse_2.5s_ease-in-out_2] place-items-center rounded-full bg-turquoise text-turquoise-foreground shadow-[var(--shadow-lift)] ring-4 ring-turquoise/15 transition-transform hover:scale-105"
        >
          {open ? <X className="size-6" /> : <MessagesSquare className="size-6" />}
        </button>
        </div>
      </div>
    </div>
  );
}
