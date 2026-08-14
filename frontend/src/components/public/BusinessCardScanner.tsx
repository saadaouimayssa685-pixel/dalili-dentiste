import { Camera, Info, Loader2, ScanLine, Search, Send, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ScanResult } from "@/components/public/ScanResult";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  checkCabinetProposal,
  fetchScanStatus,
  scanCard,
  type ScanFields,
  type ScanStatus,
} from "@/lib/dalili-api";

const ACCEPT = "image/jpeg,image/jpg,image/png";

export function BusinessCardScanner({
  onSearchFields,
}: {
  onSearchFields: (fields: ScanFields) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<ScanFields | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    let active = true;
    fetchScanStatus()
      .then((s) => active && setStatus(s))
      .catch(() => active && setStatusError(true));
    setHasCamera(
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    );
    return () => {
      active = false;
    };
  }, []);

  const ocrReady = status?.available === true;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ocrReady) return;
    setError(null);
    setLoading(true);
    try {
      const scanned = await scanCard(file);
      try {
        setFields(await checkCabinetProposal(scanned));
      } catch {
        setFields(scanned);
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Le scan a échoué. Réessayez avec une photo plus nette.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="scan-title"
      className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-turquoise/15 text-turquoise">
          <ScanLine className="size-5" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-soft px-3 py-1 text-[11px] font-bold text-navy">
          Français + العربية
        </span>
      </div>
      <h3 id="scan-title" className="mt-4 text-lg font-bold text-navy">
        Scanner une carte
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Importez la carte de visite d'un cabinet et Dalili extrait automatiquement les informations
        disponibles.
      </p>

      {status === null && !statusError ? (
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-soft-2" aria-hidden="true" />
      ) : ocrReady ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`mt-5 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-turquoise bg-turquoise/10" : "border-turquoise/40 bg-soft-2/50"
          }`}
        >
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-6 text-sm font-semibold text-navy">
              <Loader2 className="size-4 animate-spin text-turquoise" aria-hidden="true" />
              Analyse de la carte en cours…
            </p>
          ) : (
            <>
              <Upload className="mx-auto size-7 text-turquoise" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-navy">
                Déposez une carte de visite ici
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Formats : JPG, JPEG, PNG</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button className="rounded-full" onClick={() => inputRef.current?.click()}>
                  <Upload className="size-4" aria-hidden="true" /> Importer une carte
                </Button>
                {hasCamera ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera className="size-4" aria-hidden="true" /> Utiliser la caméra
                  </Button>
                ) : null}
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label="Importer une carte de visite"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept={ACCEPT}
            capture="environment"
            className="sr-only"
            aria-label="Photographier une carte de visite"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-soft/60 p-5 text-sm">
          <p className="flex items-start gap-2 font-semibold text-navy">
            <Info className="mt-0.5 size-4 shrink-0 text-turquoise" aria-hidden="true" />
            Le scan automatique n'est pas activé.
          </p>
          <p className="mt-1.5 text-muted-foreground">
            Vous pouvez saisir les informations manuellement.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            onClick={() =>
              setFields({ name: "", speciality: "", phone: "", address: "", localite: "" })
            }
          >
            <Send className="size-4" aria-hidden="true" /> Saisir manuellement
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {fields ? (
        <ScanResult
          fields={fields}
          onChange={setFields}
          onSearch={() => onSearchFields(fields)}
          onSaved={() => {
            setFields(null);
            setError(null);
            if (inputRef.current) inputRef.current.value = "";
            if (cameraRef.current) cameraRef.current.value = "";
          }}
          searchIcon={<Search className="size-4" aria-hidden="true" />}
        />
      ) : null}
    </section>
  );
}
