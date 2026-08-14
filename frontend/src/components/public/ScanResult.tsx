import { Check, Info, Loader2, Send } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitCabinetProposal, type ScanFields } from "@/lib/dalili-api";

const LABELS: { key: keyof ScanFields; label: string }[] = [
  { key: "name", label: "Nom" },
  { key: "speciality", label: "Specialite" },
  { key: "phone", label: "Telephone" },
  { key: "localite", label: "Localite" },
  { key: "address", label: "Adresse" },
];

export function ScanResult({
  fields,
  onChange,
  onSearch,
  onSaved,
  searchIcon,
}: {
  fields: ScanFields;
  onChange: (fields: ScanFields) => void;
  onSearch: () => void;
  onSaved?: () => void;
  searchIcon: ReactNode;
}) {
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const result = await submitCabinetProposal(fields);
      if (result.status === "already_exists") {
        setMessage("Ce dentiste existe deja dans la base. La proposition est gardee en raw data.");
      } else {
        setMessage("Ajoute a la base. Merci, l'equipe Dalili vous contactera bientot.");
      }
      setSaved(true);
      window.setTimeout(() => onSaved?.(), 1300);
    } catch {
      setError("Ajout impossible pour le moment. Reessayez plus tard.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-soft/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-navy">Informations extraites</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Verifiez et corrigez les champs avant de rechercher ou d'ajouter la fiche.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
            fields.exists
              ? "bg-primary/10 text-primary"
              : "bg-turquoise/12 text-turquoise"
          }`}
        >
          <Info className="size-3.5" aria-hidden="true" />
          {fields.exists ? "Existe deja" : "Nouveau probable"}
        </span>
      </div>

      {fields.exists ? (
        <p className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs font-medium text-navy">
          Correspondance trouvee : {fields.existingDentistName ?? "dentiste existant"}.
        </p>
      ) : null}

      <div className="mt-3 space-y-2.5">
        {LABELS.map(({ key, label }) => (
          <label key={key} className="block space-y-1">
            <span className="text-[11px] font-semibold text-navy">{label}</span>
            <Input
              value={String(fields[key] ?? "")}
              onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
              placeholder="Non detecte"
              className="h-10 rounded-xl bg-card"
            />
          </label>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-xl bg-turquoise/12 p-3 text-xs font-semibold text-turquoise">
          {message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="rounded-full" onClick={onSearch}>
          {searchIcon} Rechercher ce cabinet
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={sending || saved}
          onClick={() => void submit()}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : saved ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {saved ? "Ajoute a la base" : "Ajouter a la base"}
        </Button>
      </div>
    </div>
  );
}
