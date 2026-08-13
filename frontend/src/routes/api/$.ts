import { createFileRoute } from "@tanstack/react-router";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const base = process.env["FASTAPI_BASE_URL"] || "http://127.0.0.1:8000";

  const incoming = new URL(request.url);
  const target = new URL(`${base.replace(/\/+$/, "")}/api/${params._splat ?? ""}`);
  target.search = incoming.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  try {
    const body =
      request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    const requestInit: RequestInit = {
      method: request.method,
      headers,
      redirect: "follow",
    };
    if (body !== undefined) requestInit.body = body;
    const res = await fetch(target.toString(), requestInit);
    const out = new Headers(res.headers);
    out.delete("content-encoding");
    out.delete("content-length");
    return new Response(res.body, { status: res.status, headers: out });
  } catch (error) {
    return Response.json(
      {
        error: "backend_unreachable",
        message: error instanceof Error ? error.message : "Service indisponible.",
      },
      { status: 502 },
    );
  }
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
      DELETE: proxy,
    },
  },
});
