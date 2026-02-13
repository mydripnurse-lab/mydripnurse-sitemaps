import { NextResponse } from "next/server";

export const runtime = "nodejs";

function s(v: unknown) {
  return String(v ?? "").trim();
}

function toUrlMaybe(v: string) {
  const d = s(v);
  if (!d) return "";
  if (d.startsWith("http://") || d.startsWith("https://")) return d;
  return `https://${d}`;
}

function toOriginUrlMaybe(v: string) {
  const full = toUrlMaybe(v);
  if (!full) return "";
  try {
    const u = new URL(full);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return "";
  }
}

function resolveKeyLocation(origin: string, host: string, key: string) {
  const raw = s(process.env.INDEXNOW_KEY_LOCATION || process.env.BING_INDEXNOW_KEY_LOCATION);
  if (!raw) return `${origin}${key}.txt`;
  if (raw.includes("{host}")) return raw.replaceAll("{host}", host);
  return raw;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const domainUrl = toOriginUrlMaybe(s(body?.domainUrl));
    if (!domainUrl) {
      return NextResponse.json({ ok: false, error: "Missing domainUrl" }, { status: 400 });
    }

    const key = s(
      process.env.INDEXNOW_KEY ||
        process.env.BING_INDEXNOW_KEY ||
        process.env.BING_WEBMASTER_API_KEY,
    );
    if (!key) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing INDEXNOW_KEY (or BING_INDEXNOW_KEY / BING_WEBMASTER_API_KEY).",
        },
        { status: 400 },
      );
    }

    const endpoint = s(process.env.INDEXNOW_ENDPOINT) || "https://api.indexnow.org/indexnow";
    const host = new URL(domainUrl).host.toLowerCase();
    const keyLocation = resolveKeyLocation(domainUrl, host, key);

    const bodyUrlList = Array.isArray(body?.urlList)
      ? body.urlList.map((u: unknown) => s(u)).filter(Boolean)
      : [];
    const urlList = bodyUrlList.length ? bodyUrlList : [domainUrl];

    const payload = {
      host,
      key,
      keyLocation,
      urlList,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text().catch(() => "");
    const ok = res.ok;
    return NextResponse.json(
      {
        ok,
        target: "bing",
        mode: "indexnow",
        status: res.status,
        endpoint,
        host,
        domainUrl,
        keyLocation,
        submittedUrls: urlList.length,
        responsePreview: text.slice(0, 500) || undefined,
        error: ok ? undefined : `IndexNow submit failed (HTTP ${res.status})`,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e ?? "");
    return NextResponse.json(
      {
        ok: false,
        target: "bing",
        error: s(message) || "IndexNow request failed.",
      },
      { status: 500 },
    );
  }
}
