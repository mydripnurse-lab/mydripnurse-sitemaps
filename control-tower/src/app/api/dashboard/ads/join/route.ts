import { NextResponse } from "next/server";
import { readCache } from "@/lib/ads/adsCache";
import { joinAds } from "@/lib/ads/adsJoin";

export const runtime = "nodejs";

function pickResults(raw: unknown) {
    const src = raw as { results?: unknown[] } | null;
    return Array.isArray(src?.results) ? src.results : [];
}
function num(v: unknown) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
function microsToMoney(m: unknown) {
    return num(m) / 1_000_000;
}
function pct(curr: number, prev: number) {
    if (!Number.isFinite(curr) || !Number.isFinite(prev)) return null;
    if (prev <= 0) return curr === 0 ? 0 : null;
    return ((curr - prev) / prev) * 100;
}

type AdsMetricPayload = {
    metrics?: {
        impressions?: unknown;
        clicks?: unknown;
        ctr?: unknown;
        averageCpc?: unknown;
        costMicros?: unknown;
        conversions?: unknown;
        conversionsValue?: unknown;
    };
    segments?: { date?: unknown };
    campaign?: {
        id?: unknown;
        name?: unknown;
        status?: unknown;
        advertisingChannelType?: unknown;
    };
};

function asPayload(r: unknown): AdsMetricPayload {
    return (r || {}) as AdsMetricPayload;
}

function s(v: unknown) {
    return String(v ?? "").trim();
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const range = s(url.searchParams.get("range")) || "last_28_days";
        const key = `ads_${range}`;

        const cached = await readCache(key);
        if (!cached) {
            return NextResponse.json(
                { ok: false, error: `No cache for ${key}. Run /api/dashboard/ads/sync first.` },
                { status: 404 },
            );
        }

        const meta = cached.meta || null;

        const summary = joinAds(cached.kpis, meta);
        const summaryPrev = joinAds(cached.prevKpis, cached.prevMeta || null);

        const trendRows = pickResults(cached.trend).map((r: unknown) => {
            const row = asPayload(r);
            const d = row.segments?.date || "";
            const m = row.metrics || {};
            return {
                date: d,
                impressions: num(m.impressions),
                clicks: num(m.clicks),
                ctr: num(m.ctr),
                avgCpc: microsToMoney(m.averageCpc),
                cost: microsToMoney(m.costMicros),
                conversions: num(m.conversions),
                conversionValue: num(m.conversionsValue),
            };
        });

        const campaignRows = pickResults(cached.campaigns).map((r: unknown) => {
            const row = asPayload(r);
            const c = row.campaign || {};
            const m = row.metrics || {};
            return {
                id: String(c.id || ""),
                name: String(c.name || ""),
                status: String(c.status || ""),
                channel: String(c.advertisingChannelType || ""),
                impressions: num(m.impressions),
                clicks: num(m.clicks),
                ctr: num(m.ctr),
                avgCpc: microsToMoney(m.averageCpc),
                cost: microsToMoney(m.costMicros),
                conversions: num(m.conversions),
                conversionValue: num(m.conversionsValue),
            };
        });

        return NextResponse.json({
            ok: true,
            meta,
            prevMeta: cached.prevMeta || null,
            summary: summary.summary,
            summaryOverall: summary.summary,
            summaryPrev: summaryPrev.summary,
            compare: {
                prevImpressions: num(summaryPrev.summary.impressions),
                prevClicks: num(summaryPrev.summary.clicks),
                prevCost: num(summaryPrev.summary.cost),
                prevConversions: num(summaryPrev.summary.conversions),
                prevConversionValue: num(summaryPrev.summary.conversionValue),
                impressionsDeltaPct: pct(num(summary.summary.impressions), num(summaryPrev.summary.impressions)),
                clicksDeltaPct: pct(num(summary.summary.clicks), num(summaryPrev.summary.clicks)),
                costDeltaPct: pct(num(summary.summary.cost), num(summaryPrev.summary.cost)),
                conversionsDeltaPct: pct(num(summary.summary.conversions), num(summaryPrev.summary.conversions)),
                conversionValueDeltaPct: pct(num(summary.summary.conversionValue), num(summaryPrev.summary.conversionValue)),
            },
            trend: trendRows,
            campaigns: campaignRows,
            generatedAt: cached.generatedAt || meta?.generatedAt || null,
        });
    } catch (e: unknown) {
        return NextResponse.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
        );
    }
}
