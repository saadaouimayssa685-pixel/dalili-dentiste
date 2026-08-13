import { Loader2, MapPin, Phone, Send, Sparkles, Stethoscope } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  applyAssistantFilters,
  openAssistantDentist,
  sendAssistantMessage,
  useAssistant,
  type AssistantFilters,
} from "@/lib/assistant-store";
import { initials, type ApiDentist } from "@/lib/dalili-api";

const SUGGESTIONS = [
  "Dentiste à Tunis",
  "Orthodontiste à Sousse",
  "Dentiste pour enfant",
  "Implantologie à Sfax",
];

function filterLabel(f: AssistantFilters) {
  return [f.speciality, f.localite, f.gouvernorat].filter(Boolean).join(" · ");
}

function DentistMiniCard({ d }: { d: ApiDentist }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-soft text-xs font-bold text-navy">
          {initials(d.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy">{d.name}</p>
          {d.speciality ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-turquoise">
              <Stethoscope className="size-3 shrink-0" aria-hidden="true" />
              {d.speciality}
            </p>
          ) : null}
          {d.gouvernorat || d.localite ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {[d.localite, d.gouvernorat].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.phone ? (
              <a
                href={`tel:${d.phone}`}
                className="inline-flex items-center gap-1 rounded-full bg-turquoise px-2.5 py-1 text-[11px] font-semibold text-turquoise-foreground transition-opacity hover:opacity-90"
              >
                <Phone className="size-3" aria-hidden="true" /> Appeler
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => openAssistantDentist(d)}
              className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-navy transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Voir le profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssistantThread({ compact = false }: { compact?: boolean }) {
  const { messages, loading } = useAssistant();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 1 || loading;

  useEffect(() => {
    if (!started) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, started]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void sendAssistantMessage(text);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {started ? (
      <div
        className={`min-h-0 max-h-[22rem] flex-1 space-y-3 overflow-y-auto ${compact ? "bg-soft/40 p-4" : "rounded-2xl bg-soft/40 p-4"}`}
        aria-live="polite"
      >
        {messages.map((m) => (
          <div key={m.id} className={m.from === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.from === "user"
                  ? "w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                  : `w-fit max-w-[92%] rounded-2xl rounded-bl-sm border border-border/60 px-3.5 py-2 text-sm shadow-[var(--shadow-card)] ${
                      m.error ? "bg-destructive/10 text-destructive" : "bg-card text-foreground"
                    }`
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.dentists?.length ? (
                <div className="mt-2 space-y-2">
                  {m.dentists.map((d) => (
                    <DentistMiniCard key={d.id} d={d} />
                  ))}
                </div>
              ) : null}
              {m.filters ? (
                <button
                  type="button"
                  onClick={() => applyAssistantFilters(m.filters!)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-turquoise px-3 py-1 text-[11px] font-bold text-turquoise-foreground transition-opacity hover:opacity-90"
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  Appliquer : {filterLabel(m.filters)}
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {loading ? (
          <p className="flex animate-pulse items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Dalili recherche…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>
      ) : null}

      <form onSubmit={submit} className={`flex items-center gap-2 ${started ? "mt-3" : ""}`}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. : Je cherche un orthodontiste à Sousse"
          aria-label="Message pour l'assistant Dalili"
          className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-turquoise/40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-turquoise px-4 py-2.5 text-sm font-semibold text-turquoise-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
          <span className={compact ? "sr-only" : ""}>Envoyer</span>
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void sendAssistantMessage(s)}
            className="rounded-full bg-soft px-3 py-1.5 text-[11px] font-medium text-navy transition-colors hover:bg-turquoise/15 hover:text-turquoise"
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Dalili est un service d'orientation et de recherche. Il ne fournit pas de diagnostic ni de
        conseil médical.
      </p>
    </div>
  );
}