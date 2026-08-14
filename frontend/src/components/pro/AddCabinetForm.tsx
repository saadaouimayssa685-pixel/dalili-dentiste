import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CircleCheckBig,
  Eye,
  Globe,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import clinicPortrait from "@/assets/professional/dentist-registration-clinic.webp";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOUVERNORATS, SPECIALITES, VILLES } from "@/lib/dalili-data";
import { checkCabinetProposal, submitCabinetProposal } from "@/lib/dalili-api";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  cabinet: string;
  speciality: string;
  gouvernorat: string;
  ville: string;
  adresse: string;
  professionalId: string;
  website: string;
};

const EMPTY: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  cabinet: "",
  speciality: "",
  gouvernorat: "",
  ville: "",
  adresse: "",
  professionalId: "",
  website: "",
};

const ADVANTAGES = [
  { icon: Eye, label: "Plus de visibilité" },
  { icon: ShieldCheck, label: "Informations vérifiées" },
  { icon: Search, label: "Présence dans la recherche nationale" },
];

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
      <TriangleAlert className="size-[18px] shrink-0" />
      {message}
    </p>
  );
}

export function AddCabinetForm() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [consent, setConsent] = useState(false);
  type ErrorKey = keyof FormValues | "consent";
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [sent, setSent] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(
    "Votre demande a ete envoyee pour verification.",
  );
  const [submitting, setSubmitting] = useState(false);

  const villes = useMemo(
    () => (values.gouvernorat ? (VILLES[values.gouvernorat] ?? []) : []),
    [values.gouvernorat],
  );

  const set = (key: keyof FormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function validate() {
    const e: Partial<Record<ErrorKey, string>> = {};
    if (!values.fullName.trim()) e.fullName = "Le nom et prénom sont obligatoires.";
    if (!values.email.trim()) e.email = "L'adresse e-mail est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
      e.email = "Veuillez saisir une adresse e-mail valide.";
    if (!values.phone.trim()) e.phone = "Le numéro de téléphone est obligatoire.";
    else if (values.phone.replace(/\D/g, "").length < 8)
      e.phone = "Veuillez saisir un numéro de téléphone valide.";
    if (!values.cabinet.trim()) e.cabinet = "Le nom du cabinet est obligatoire.";
    if (!values.speciality) e.speciality = "Veuillez sélectionner une spécialité.";
    if (!values.gouvernorat) e.gouvernorat = "Veuillez sélectionner un gouvernorat.";
    if (!values.ville.trim()) e.ville = "La ville ou localité est obligatoire.";
    if (!values.adresse.trim()) e.adresse = "L'adresse complète est obligatoire.";
    if (!consent) e.consent = "Vous devez confirmer l'exactitude des informations.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-turquoise/12 text-turquoise">
            <CircleCheckBig className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy">
            Votre demande a été envoyée
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {submitMessage}
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">
              <ArrowLeft className="size-[18px]" /> Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        Ajouter mon cabinet
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Complétez vos informations afin de proposer l'ajout ou la mise à jour de votre cabinet sur
        Dalili Dentiste Tounsi.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!validate()) return;
            setSubmitting(true);
            const fields = {
              name: values.fullName,
              speciality: values.speciality,
              phone: values.phone,
              address: values.adresse,
              localite: values.ville,
              gouvernorat: values.gouvernorat,
            };
            void checkCabinetProposal(fields)
              .then((checked) => submitCabinetProposal(checked))
              .then((result) => {
                setSubmitMessage(
                  result.status === "already_exists"
                    ? "Ce cabinet existe deja dans la base. Votre demande est gardee pour verification et mise a jour."
                    : "Cabinet ajoute a la base. Notre equipe vous contactera bientot pour validation.",
                );
                setValues(EMPTY);
                setConsent(false);
                setSent(true);
              })
              .catch(() => {
                setErrors((current) => ({
                  ...current,
                  consent: "Ajout impossible pour le moment. Verifiez que le backend est lance.",
                }));
              })
              .finally(() => setSubmitting(false));
          }}
          className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <UserRound className="size-[18px] text-navy" /> Nom et prénom
              </span>
              <Input
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Dr. Amira Ben Salah"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.fullName} />
            </label>

            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <Mail className="size-[18px] text-navy" /> Adresse e-mail
              </span>
              <Input
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@cabinet.tn"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.email} />
            </label>

            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <Phone className="size-[18px] text-navy" /> Numéro de téléphone
              </span>
              <Input
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+216 71 234 567"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.phone} />
            </label>

            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <Building2 className="size-[18px] text-navy" /> Nom du cabinet
              </span>
              <Input
                value={values.cabinet}
                onChange={(e) => set("cabinet", e.target.value)}
                placeholder="Cabinet Dentaire El Menzah"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.cabinet} />
            </label>

            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <Stethoscope className="size-[18px] text-navy" /> Spécialité
              </span>
              <Select value={values.speciality} onValueChange={(v) => set("speciality", v)}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {SPECIALITES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.speciality} />
            </div>

            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <MapPin className="size-[18px] text-navy" /> Gouvernorat
              </span>
              <Select
                value={values.gouvernorat}
                onValueChange={(v) => {
                  set("gouvernorat", v);
                  set("ville", "");
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {GOUVERNORATS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.gouvernorat} />
            </div>

            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <MapPin className="size-[18px] text-navy" /> Ville ou localité
              </span>
              {villes.length ? (
                <Select value={values.ville} onValueChange={(v) => set("ville", v)}>
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {villes.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={values.ville}
                  onChange={(e) => set("ville", e.target.value)}
                  placeholder="Ville ou localité"
                  className="h-11 rounded-xl"
                />
              )}
              <FieldError message={errors.ville} />
            </div>

            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <IdCard className="size-[18px] text-navy" /> Identifiant professionnel
              </span>
              <Input
                value={values.professionalId}
                onChange={(e) => set("professionalId", e.target.value)}
                placeholder="Reference cabinet ou matricule"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.professionalId} />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <MapPin className="size-[18px] text-navy" /> Adresse complète
              </span>
              <Input
                value={values.adresse}
                onChange={(e) => set("adresse", e.target.value)}
                placeholder="12 rue de la Liberté, El Menzah 5"
                className="h-11 rounded-xl"
              />
              <FieldError message={errors.adresse} />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                <Globe className="size-[18px] text-navy" /> Site web (facultatif)
              </span>
              <Input
                value={values.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://www.moncabinet.tn"
                className="h-11 rounded-xl"
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-soft/50 p-4">
            <label className="flex items-start gap-3 text-sm text-navy">
              <Checkbox
                checked={consent}
                onCheckedChange={(c) => setConsent(c === true)}
                className="mt-0.5"
              />
              <span>
                Je confirme que les informations fournies sont exactes et j'accepte qu'elles soient
                vérifiées avant leur publication.
              </span>
            </label>
            <div className="mt-2">
              <FieldError message={errors.consent} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" className="rounded-full" disabled={submitting}>
              <Send className="size-[18px]" /> {submitting ? "Envoi..." : "Envoyer la demande"}
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">
                <ArrowLeft className="size-[18px]" /> Retour au site
              </Link>
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[20px] border border-border shadow-[var(--shadow-card)]">
            <img
              src={clinicPortrait}
              alt="Dentiste souriante dans un cabinet dentaire moderne et lumineux"
              width={800}
              height={978}
              loading="lazy"
              className="h-48 w-full object-cover lg:h-80"
            />
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-navy">Rejoignez Dalili Dentiste Tounsi</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Rendez votre cabinet plus visible et permettez aux patients de trouver facilement vos
              informations professionnelles.
            </p>
            <ul className="mt-4 space-y-2.5">
              {ADVANTAGES.map((a) => (
                <li
                  key={a.label}
                  className="flex items-center gap-2.5 text-sm font-medium text-navy"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-turquoise/12 text-turquoise">
                    <a.icon className="size-[18px]" />
                  </span>
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

