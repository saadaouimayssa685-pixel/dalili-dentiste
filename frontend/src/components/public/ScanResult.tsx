import { Check, Loader2, Send } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitCabinetProposal, type ScanFields } from "@/lib/dalili-api";

const LABELS: { key: keyof ScanFields; label: string }[] = [
  { key: "name", label: "Nom" },
  { key: "speciality", label: "Spécialité" },
  { key: "phone", label: "Téléphone" },
  { key: "localite", label: "Localité" },
  { key: "address", label: "Adresse" },
];

export function ScanResult({
  fields,
  onChange,
  onSearch,
  searchIcon,
}: {
  fields: ScanFields;
  onChange: (fields: ScanFields) => void;
  onSearch: () => void;
  searchIcon: ReactNode;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      await submitCabinetProposal(fields);
      setSent(true);
    } catch {
      setError("Envoi impossible pour le moment. Réessayez plus tard.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-soft/50 p-4">
      <p className="text-sm font-bold text-navy">Informations extraites</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Vérifiez et corrigez les champs avant de rechercher ou de proposer la fiche.
      </p>
      <div className="mt-3 space-y-2.5">
        {LABELS.map(({ key, label }) => (
          <label key={key} className="block space-y-1">
            <span className="text-[11px] font-semibold text-navy">{label}</span>
            <Input
              value={fields[key]}
              onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
              placeholder="Non détecté"
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

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="rounded-full" onClick={onSearch}>
          {searchIcon} Rechercher ce cabinet
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={sending || sent}
          onClick={() => void submit()}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : sent ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {sent ? "Proposition envoyée" : "Proposer cette fiche"}
        </Button>
      </div>
    </div>
  );
}