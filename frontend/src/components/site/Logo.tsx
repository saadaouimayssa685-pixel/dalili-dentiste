import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-turquoise/10 ring-1 ring-turquoise/25">
        <svg viewBox="0 0 24 24" className="size-6 text-turquoise" fill="currentColor">
          <path d="M12 3.2c-1.2 0-1.9.6-3.3.6C6.4 3.8 4 5.6 4 9c0 4 1.6 7.3 2.6 9.6.5 1.1 1 1.9 1.9 1.9 1.1 0 1.3-1.3 1.7-3.2.3-1.4.7-2.5 1.8-2.5s1.5 1.1 1.8 2.5c.4 1.9.6 3.2 1.7 3.2.9 0 1.4-.8 1.9-1.9C18.4 16.3 20 13 20 9c0-3.4-2.4-5.2-4.7-5.2-1.4 0-2.1-.6-3.3-.6Z" />
        </svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={`block truncate text-[15px] font-extrabold tracking-tight ${light ? "text-navy-foreground" : "text-navy"}`}
        >
          Dalili Dentiste
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-turquoise">
          Tounsi
        </span>
      </span>
    </Link>
  );
}