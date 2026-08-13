import type { ApiDentist } from "@/lib/dalili-api";

export function dentistMapsUrl(dentist: ApiDentist): string {
  if (dentist.googleMapsUrl) return dentist.googleMapsUrl;
  if (dentist.latitude !== null && dentist.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${dentist.latitude},${dentist.longitude}`;
  }
  const query = [
    dentist.name,
    dentist.address,
    dentist.localite,
    dentist.gouvernorat,
    "Tunisie",
  ]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
