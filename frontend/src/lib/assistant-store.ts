import { useSyncExternalStore } from "react";

import { sendChat, type ApiDentist, type ChatReply } from "@/lib/dalili-api";

export type AssistantMessage = {
  id: string;
  from: "bot" | "user";
  text: string;
  filters?: ChatReply["filters"];
  dentists?: ApiDentist[];
  error?: boolean;
};

export type AssistantFilters = NonNullable<ChatReply["filters"]>;

type State = {
  sessionId: string;
  messages: AssistantMessage[];
  loading: boolean;
  open: boolean;
};

const WELCOME: AssistantMessage = {
  id: "welcome",
  from: "bot",
  text: "Ahla ! Décrivez votre besoin (français, arabe ou arabizi) et je cherche dans la base Dalili.",
};

let state: State = {
  sessionId: "",
  messages: [WELCOME],
  loading: false,
  open: false,
};

const listeners = new Set<() => void>();
const applyListeners = new Set<(filters: AssistantFilters) => void>();
const profileListeners = new Set<(dentist: ApiDentist) => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function ensureSession(): string {
  if (state.sessionId) return state.sessionId;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state = { ...state, sessionId: id };
  return id;
}

export function useAssistant() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function setAssistantOpen(open: boolean) {
  set({ open });
}

export function onApplyAssistantFilters(cb: (filters: AssistantFilters) => void) {
  applyListeners.add(cb);
  return () => applyListeners.delete(cb);
}

export function applyAssistantFilters(filters: AssistantFilters) {
  applyListeners.forEach((cb) => cb(filters));
}

export function onOpenAssistantDentist(cb: (dentist: ApiDentist) => void) {
  profileListeners.add(cb);
  return () => profileListeners.delete(cb);
}

export function openAssistantDentist(dentist: ApiDentist) {
  profileListeners.forEach((cb) => cb(dentist));
}

export async function sendAssistantMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed || state.loading) return;
  const sessionId = ensureSession();
  set({
    loading: true,
    messages: [
      ...state.messages,
      { id: `u-${Date.now()}`, from: "user", text: trimmed },
    ],
  });

  try {
    const reply = await sendChat(trimmed, sessionId);
    state = { ...state, sessionId: reply.sessionId };
    set({
      loading: false,
      messages: [
        ...state.messages,
        {
          id: `b-${Date.now()}`,
          from: "bot",
          text: reply.message,
          ...(reply.dentists?.length ? { dentists: reply.dentists } : {}),
          ...(reply.filters ? { filters: reply.filters } : {}),
        },
      ],
    });
  } catch (error) {
    set({
      loading: false,
      messages: [
        ...state.messages,
        {
          id: `e-${Date.now()}`,
          from: "bot",
          error: true,
          text:
            error instanceof Error && error.message
              ? `L'assistant est indisponible : ${error.message}`
              : "L'assistant est temporairement indisponible.",
        },
      ],
    });
  }
}