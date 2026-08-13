import { Link } from "@tanstack/react-router";
import { Home, Menu, Plus, Globe, X, Search, Sparkles, Mail } from "lucide-react";
import { useState } from "react";

import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { setAssistantOpen } from "@/lib/assistant-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV = [
  { label: "Accueil", to: "/", icon: Home },
  { label: "À propos", to: "/about", icon: Sparkles },
  { label: "Recherche", to: "/public/recherche", icon: Search },
  { label: "Assistant", to: "/public", icon: Sparkles },
  { label: "Contact", to: "/contact", icon: Mail },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  function openAssistant() {
    setAssistantOpen(true);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:flex lg:justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            item.label === "Assistant" ? (
              <button
                key={item.label}
                type="button"
                onClick={openAssistant}
                className="group inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-soft hover:text-navy"
              >
                <item.icon className="size-4 text-turquoise transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="group inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-soft hover:text-navy data-[status=active]:bg-soft data-[status=active]:text-navy"
              >
                <item.icon className="size-4 text-turquoise transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Select defaultValue="fr">
            <SelectTrigger className="h-9 w-[132px] rounded-full border-border bg-soft text-sm">
              <Globe className="size-4 text-turquoise" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild className="rounded-full shadow-[var(--shadow-card)]">
            <Link to="/professional/ajouter-cabinet">
              Ajouter mon cabinet <Plus className="size-4" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-navy lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              item.label === "Assistant" ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={openAssistant}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-soft"
                >
                  <item.icon className="size-4 text-turquoise" aria-hidden="true" />
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-soft"
                >
                  <item.icon className="size-4 text-turquoise" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            ))}
          </nav>
          <Button asChild className="mt-3 w-full rounded-full">
            <Link to="/professional/ajouter-cabinet" onClick={() => setOpen(false)}>
              Ajouter mon cabinet <Plus className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}
