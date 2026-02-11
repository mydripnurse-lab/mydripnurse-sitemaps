"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AiAgentChatPanel from "@/components/AiAgentChatPanel";

type RangePreset = "1d" | "7d" | "28d" | "1m" | "3m" | "6m" | "1y" | "custom";

type OverviewResponse = {
  ok: boolean;
  error?: string;
  range?: {
    start: string;
    end: string;
    preset: string;
    adsRange: string;
  };
  prevRange?: {
    start: string;
    end: string;
  };
  executive?: {
    leadsNow: number;
    leadsBefore: number;
    leadsDeltaPct: number | null;
    callsNow: number;
    callsBefore: number;
    callsDeltaPct: number | null;
    conversationsNow: number;
    conversationsBefore: number;
    conversationsDeltaPct: number | null;
    transactionsNow: number;
    transactionsBefore: number;
    transactionsDeltaPct: number | null;
    transactionsRevenueNow: number;
    transactionsRevenueBefore: number;
    transactionsRevenueDeltaPct: number | null;
    transactionsAvgLtvNow: number;
    appointmentsNow: number;
    appointmentsBefore: number;
    appointmentsDeltaPct: number | null;
    appointmentsLostNow: number;
    appointmentsLostBefore: number;
    appointmentsLostDeltaPct: number | null;
    appointmentsLostValueNow: number;
    appointmentsLostValueBefore: number;
    appointmentsLostValueDeltaPct: number | null;
    leadToCall: number | null;
    leadToCallDeltaPct: number | null;
    gscClicks: number;
    gscImpressions: number;
    gaSessions: number;
    gaUsers: number;
    gaConversions: number;
    adsCost: number;
    adsConversions: number;
    adsConversionValue: number;
  };
  businessScore?: {
    current: number;
    previous: number;
    deltaPct: number | null;
    grade: "A" | "B" | "C" | "D" | "F";
    granularity: "day" | "week" | "month";
    components: {
      volume: number;
      revenue: number;
      appointmentQuality: number;
      coverage: number;
      lossHealth: number;
    };
    trend: Array<{
      key: string;
      label: string;
      score: number;
      leads: number;
      calls: number;
      conversations: number;
      appointments: number;
      successfulRevenue: number;
      lostCount: number;
      lostValue: number;
    }>;
  };
  northStar?: {
    score: number;
    previous: number;
    deltaPct: number | null;
    grade: "A" | "B" | "C" | "D" | "F";
    status: "strong" | "mixed" | "critical";
    components: {
      volume: number;
      revenue: number;
      appointmentQuality: number;
      coverage: number;
      lossHealth: number;
    };
  };
  funnel?: {
    stages: Array<{
      key: string;
      label: string;
      valueNow: number;
      valuePrev: number;
      deltaPct: number | null;
    }>;
    conversionRates: {
      ctr: { now: number | null; prev: number | null };
      clickToLead: { now: number | null; prev: number | null };
      leadToConversation: { now: number | null; prev: number | null };
      conversationToAppointment: { now: number | null; prev: number | null };
      appointmentToTransaction: { now: number | null; prev: number | null };
    };
  };
  alerts?: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    rows: Array<{
      id: string;
      severity: "critical" | "warning" | "info";
      title: string;
      message: string;
      metric: string;
      value: number;
      threshold: number;
      action: string;
    }>;
  };
  forecast?: {
    rangeDays: number;
    currentPeriod: { leads: number; appointments: number; revenue: number };
    dailyPace: { leads: number; appointments: number; revenue: number };
    forecast30: { leads: number; appointments: number; revenue: number };
    targetMonthly: { leads: number; appointments: number; revenue: number };
    targetForRange: { leads: number; appointments: number; revenue: number };
    forecastVsTarget: { leadsGap: number; appointmentsGap: number; revenueGap: number };
  };
  geoBusinessScore?: {
    states: Array<{
      state: string;
      score: number;
      opportunitiesLost: number;
      lostValue: number;
      successfulRevenue: number;
      leads: number;
      calls: number;
      conversations: number;
      appointments: number;
      uniqueContacts: number;
      components: { volume: number; revenue: number; appointmentQuality: number; coverage: number; lossHealth: number };
    }>;
    laggingStates: Array<{
      state: string;
      score: number;
      opportunitiesLost: number;
      lostValue: number;
      successfulRevenue: number;
      leads: number;
      calls: number;
      conversations: number;
      appointments: number;
      uniqueContacts: number;
      components: { volume: number; revenue: number; appointmentQuality: number; coverage: number; lossHealth: number };
    }>;
  };
  pipelineSla?: {
    leadResponse: {
      trackedLeads: number;
      withTouch: number;
      noTouchYet: number;
      within15m: number;
      within60m: number;
      breached60m: number;
      medianMinutes: number;
      p90Minutes: number;
      sla15Rate: number;
      sla60Rate: number;
    };
    lostOpenAging: {
      totalOpen: number;
      avgDays: number;
      p90Days: number;
      over7d: number;
      over14d: number;
    };
  };
  dataQuality?: {
    score: number;
    unknownMapping: {
      contactsStateUnknown: number;
      conversationsStateUnknown: number;
      appointmentsStateUnknown: number;
      transactionsStateUnknown: number;
      lostCountyUnknown: number;
      lostCityUnknown: number;
    };
    missingCritical: {
      contactsMissingPhone: number;
      contactsMissingEmail: number;
      contactsMissingSource: number;
      conversationsUnknownChannel: number;
    };
    totals: {
      contacts: number;
      conversations: number;
      appointments: number;
      transactions: number;
      lostBookings: number;
    };
  };
  topOpportunitiesGeo?: {
    states: Array<{ name: string; opportunities: number; value: number; uniqueContacts: number }>;
    counties: Array<{ name: string; opportunities: number; value: number; uniqueContacts: number }>;
    cities: Array<{ name: string; opportunities: number; value: number; uniqueContacts: number }>;
  };
  cohorts?: {
    activeContacts: number;
    repeatContacts: number;
    repeatBuyers: number;
    rebookingRate30d: number;
    rebookingRate60d: number;
    rebookingRate90d: number;
    rows: Array<{
      cohort: string;
      contacts: number;
      buyers: number;
      buyerRate: number;
      revenue: number;
      ltv: number;
    }>;
  };
  attribution?: {
    topSources: Array<{
      source: string;
      leads: number;
      calls: number;
      conversations: number;
      appointments: number;
      revenue: number;
      leadToAppointmentRate: number;
      leadToRevenue: number;
    }>;
  };
  actionCenter?: {
    total: number;
    p1: number;
    p2: number;
    p3: number;
    expectedImpactUsd: number;
    playbooks: Array<{
      id: string;
      priority: "P1" | "P2" | "P3";
      owner: string;
      module: "appointments" | "transactions" | "conversations" | "leads" | "calls" | "gsc" | "ga" | "ads" | "overview";
      title: string;
      why: string;
      expectedImpactUsd: number;
      triggerMetric: string;
      ctaDashboard: string;
      steps: string[];
      status: "ready";
    }>;
  };
  modules?: {
    calls?: {
      ok: boolean;
      total: number;
      prevTotal: number;
      deltaPct: number | null;
      error: string | null;
    };
    contacts?: {
      ok: boolean;
      total: number;
      prevTotal: number;
      deltaPct: number | null;
      contactableRate: number;
      emailRate: number;
      inferredFromOpportunity: number;
      error: string | null;
    };
    conversations?: {
      ok: boolean;
      total: number;
      prevTotal: number;
      deltaPct: number | null;
      mappedStateRate: number;
      topChannel: string;
      error: string | null;
    };
    transactions?: {
      ok: boolean;
      total: number;
      prevTotal: number;
      deltaPct: number | null;
      grossAmount: number;
      prevGrossAmount: number;
      revenueDeltaPct: number | null;
      avgLifetimeOrderValue: number;
      mappedStateRate: number;
      error: string | null;
    };
    appointments?: {
      ok: boolean;
      total: number;
      prevTotal: number;
      deltaPct: number | null;
      showRate: number;
      noShowRate: number;
      cancellationRate: number;
      mappedStateRate: number;
      lostQualified: number;
      lostQualifiedPrev: number;
      lostQualifiedDeltaPct: number | null;
      potentialLostValue: number;
      potentialLostValuePrev: number;
      potentialLostValueDeltaPct: number | null;
      error: string | null;
    };
    gsc?: {
      ok: boolean;
      totals?: Record<string, unknown>;
      deltas?: Record<string, unknown>;
      error: string | null;
    };
    ga?: {
      ok: boolean;
      summaryOverall?: Record<string, unknown>;
      compare?: Record<string, unknown>;
      error: string | null;
    };
    ads?: {
      ok: boolean;
      summary?: Record<string, unknown>;
      error: string | null;
    };
  };
};

type CeoInsights = {
  ceo_summary: string;
  board_meeting_narrative?: string;
  board_scorecard?: {
    health?: "good" | "mixed" | "bad";
    biggest_risk?: string;
    biggest_opportunity?: string;
  };
  swarm_coordination?: Array<{
    owner_agent: string;
    mission: string;
    expected_business_impact: "low" | "medium" | "high";
    dependencies: string[];
  }>;
  decisions_next_7_days?: string[];
  decisions_next_30_days?: string[];
  execute_plan?: Array<{
    priority: "P1" | "P2" | "P3";
    action: string;
    dashboard: "calls" | "leads" | "conversations" | "transactions" | "appointments" | "gsc" | "ga" | "ads" | "facebook_ads";
    rationale: string;
    trigger_metric: string;
  }>;
};

type ChannelName =
  | "Google Ads"
  | "Facebook Ads"
  | "YouTube Ads"
  | "TikTok Ads"
  | "Bing Ads";

type CampaignBlueprint = {
  channel: ChannelName;
  region: string;
  geoTier: "state" | "county" | "city";
  objective: "Leads" | "Bookings" | "Recovery";
  intentCluster: string;
  serviceLine: string;
  priorityScore: number;
  potentialRevenueUsd: number;
  budgetDailyUsd: number;
  audience: string;
  campaignName: string;
  adSetOrAdGroup: string;
  serviceId: string;
  landingUrl: string;
  formUrl: string;
  bookingUrl: string;
  dataSignals: string;
  copyPrimary: string;
  copyHeadline: string;
  cta: string;
  funnel: string;
  kpiTarget: string;
  roasFloor: number;
  roasTarget: number;
  roasStretch: number;
  paybackWindowDays: number;
  targetConfidence: "low" | "medium" | "high";
};

type CampaignGuideStep = {
  step: number;
  title: string;
  action: string;
  expected_output: string;
  common_mistake: string;
};

type CampaignGuide = {
  quick_summary: string;
  scorecard: {
    health: "good" | "mixed" | "bad";
    setup_difficulty: "easy" | "medium" | "advanced";
    expected_impact: "low" | "medium" | "high";
  };
  setup_steps: CampaignGuideStep[];
  creative_pack: {
    primary_text: string;
    headline: string;
    cta: string;
    landing_message: string;
  };
  launch_checklist: string[];
};

type CampaignFactoryContext = {
  business: {
    businessName: string;
    brandVoice: string;
    industry: string;
    primaryOffer: string;
    targetAudience: string;
    serviceArea: string;
    primaryGoal: string;
    complianceNotes: string;
    internalProjectName?: string;
    excludeInternalProjectNameFromAds?: boolean;
  };
  landingMap: {
    file: string;
    services: Array<{
      id: string;
      name: string;
      landingPath: string;
      formPath?: string;
      bookingPath?: string;
    }>;
  };
  domains: {
    spreadsheetEnabled: boolean;
    states: Record<string, { state: string; domain: string }>;
    counties: Record<string, { state: string; county: string; accountName: string; domain: string; locationId: string }>;
    cities: Record<string, { state: string; county: string; city: string; domain: string; locationId: string }>;
    stats: {
      activeStates: number;
      activeCounties: number;
      activeCities: number;
    };
  };
  gscTopQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
  }>;
  defaultBaseUrl: string;
};

function safeToIso(d: Date) {
  const t = d.getTime();
  if (!Number.isFinite(t)) return "";
  return d.toISOString();
}

function isoStartOfDay(d: Date) {
  const x = new Date(d);
  if (!Number.isFinite(x.getTime())) return "";
  x.setHours(0, 0, 0, 0);
  return safeToIso(x);
}

function isoEndOfDay(d: Date) {
  const x = new Date(d);
  if (!Number.isFinite(x.getTime())) return "";
  x.setHours(23, 59, 59, 999);
  return safeToIso(x);
}

function fmtInt(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString();
}

function fmtMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtPct(v: number | null, isFraction = false) {
  if (v === null || !Number.isFinite(v)) return "-";
  const val = isFraction ? v * 100 : v;
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

function deltaClass(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "";
  return v < 0 ? "deltaDown" : "deltaUp";
}

function severityColor(v: "critical" | "warning" | "info") {
  if (v === "critical") return "var(--danger)";
  if (v === "warning") return "var(--warn)";
  return "var(--info)";
}

function geoName(v: string | undefined | null) {
  const raw = String(v || "").trim();
  if (!raw || raw === "__unknown") return "Unknown";
  return raw;
}

function priorityColor(p: "P1" | "P2" | "P3") {
  if (p === "P1") return "var(--danger)";
  if (p === "P2") return "var(--warn)";
  return "var(--info)";
}

function adsRangeFromPreset(preset: RangePreset) {
  if (preset === "7d") return "last_7_days";
  if (preset === "28d") return "last_28_days";
  if (preset === "1m") return "last_month";
  if (preset === "3m") return "last_quarter";
  if (preset === "6m") return "last_6_months";
  if (preset === "1y") return "last_year";
  if (preset === "custom") return "last_28_days";
  return "last_7_days";
}

function csvCell(v: unknown) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function normToken(v: unknown) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escHtml(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openPrintWindowFromHtml(html: string, fallbackName: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");

  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fallbackName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return;
  }

  const triggerPrint = () => {
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    }, 600);
  };

  win.addEventListener("load", triggerPrint, { once: true });
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [preset, setPreset] = useState<RangePreset>("28d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [data, setData] = useState<OverviewResponse | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [aiInsights, setAiInsights] = useState<CeoInsights | null>(null);
  const [boardMeetingMode, setBoardMeetingMode] = useState(false);
  const [hardRefreshing, setHardRefreshing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideErr, setGuideErr] = useState("");
  const [guideCampaign, setGuideCampaign] = useState<CampaignBlueprint | null>(null);
  const [guideData, setGuideData] = useState<CampaignGuide | null>(null);
  const [guideCache, setGuideCache] = useState<Record<string, CampaignGuide>>({});
  const [campaignCtx, setCampaignCtx] = useState<CampaignFactoryContext | null>(null);

  const computedRange = useMemo(() => {
    const now = new Date();
    const end = isoEndOfDay(now);

    const startFromDays = (days: number) => {
      const startD = new Date(now);
      startD.setDate(startD.getDate() - days);
      return { start: isoStartOfDay(startD), end };
    };

    if (preset === "1d") return startFromDays(1);
    if (preset === "7d") return startFromDays(7);
    if (preset === "28d") return startFromDays(28);

    if (preset === "1m") {
      const startD = new Date(now);
      startD.setMonth(startD.getMonth() - 1);
      return { start: isoStartOfDay(startD), end };
    }
    if (preset === "3m") {
      const startD = new Date(now);
      startD.setMonth(startD.getMonth() - 3);
      return { start: isoStartOfDay(startD), end };
    }
    if (preset === "6m") {
      const startD = new Date(now);
      startD.setMonth(startD.getMonth() - 6);
      return { start: isoStartOfDay(startD), end };
    }
    if (preset === "1y") {
      const startD = new Date(now);
      startD.setFullYear(startD.getFullYear() - 1);
      return { start: isoStartOfDay(startD), end };
    }

    if (preset === "custom") {
      const startD = customStart ? new Date(`${customStart}T00:00:00`) : null;
      const endD = customEnd ? new Date(`${customEnd}T00:00:00`) : null;
      const start = startD ? isoStartOfDay(startD) : "";
      const end2 = endD ? isoEndOfDay(endD) : "";
      return { start, end: end2 };
    }

    return { start: "", end: "" };
  }, [preset, customStart, customEnd]);

  async function load(force = false) {
    setErr("");
    setLoading(true);
    setHardRefreshing(force);
    setAiInsights(null);
    setAiErr("");

    try {
      if (!computedRange.start || !computedRange.end) {
        throw new Error("Missing start/end range");
      }

      const qs = new URLSearchParams();
      qs.set("start", computedRange.start);
      qs.set("end", computedRange.end);
      qs.set("preset", preset);
      qs.set("adsRange", adsRangeFromPreset(preset));
      if (force) qs.set("force", "1");

      const res = await fetch(`/api/dashboard/overview?${qs.toString()}`, {
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Overview API non-JSON: ${txt.slice(0, 120)}`);
      }

      const json = (await res.json()) as OverviewResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setData(json);
      await loadCampaignContext(force);
    } catch (e: unknown) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Failed to load Executive Dashboard");
    } finally {
      setLoading(false);
      setHardRefreshing(false);
    }
  }

  async function loadCampaignContext(force = false) {
    try {
      const qs = new URLSearchParams();
      if (computedRange.start) qs.set("start", computedRange.start);
      if (computedRange.end) qs.set("end", computedRange.end);
      if (force) qs.set("force", "1");
      qs.set("keywordLimit", "40");
      const res = await fetch(`/api/dashboard/campaign-factory/context?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; context?: CampaignFactoryContext };
      if (res.ok && json?.ok && json.context) setCampaignCtx(json.context);
    } catch {
      // Keep campaign factory running with internal fallback logic.
    }
  }

  useEffect(() => {
    if (preset !== "custom") load(false);
    else if (customStart && customEnd) load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customStart, customEnd]);

  async function runCeoInsights() {
    setAiErr("");
    setAiLoading(true);
    setAiInsights(null);

    try {
      if (!data?.executive) {
        throw new Error("No executive data available.");
      }

      const payload = {
        range: data.range,
        prevRange: data.prevRange,
        executive: data.executive,
        modules: data.modules,
        swarm_agents: [
          "calls_strategist",
          "leads_strategist",
          "conversations_strategist",
          "transactions_strategist",
          "appointments_strategist",
          "gsc_strategist",
          "ga_strategist",
          "ads_strategist",
        ],
        objective:
          "Maximize growth efficiency with clear CEO-level decisions and cross-agent orchestration.",
        readiness: {
          gsc: {
            status: "test_mode_pending_approval",
            note: "GSC is pending approval to move out of test mode.",
          },
          facebook_ads: {
            status: "not_configured",
            note: "Facebook Ads setup is pending.",
          },
          keyword_planner: {
            status: "planned",
            note: "Google Ads Keyword Planner integration is planned for campaign recommendation automation.",
          },
        },
      };

      const res = await fetch("/api/dashboard/overview/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Insights API non-JSON: ${txt.slice(0, 120)}`);
      }

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        insights?: CeoInsights;
      };

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to generate CEO insights");
      }

      setAiInsights(json.insights || null);
      setBoardMeetingMode(true);
    } catch (e: unknown) {
      setAiErr(e instanceof Error ? e.message : "Failed to generate CEO insights");
    } finally {
      setAiLoading(false);
    }
  }

  const ex = data?.executive;
  const m = data?.modules;
  const bs = data?.businessScore;
  const funnel = data?.funnel;
  const alerts = data?.alerts;
  const forecast = data?.forecast;
  const geoScore = data?.geoBusinessScore;
  const pipelineSla = data?.pipelineSla;
  const dataQuality = data?.dataQuality;
  const topGeo = data?.topOpportunitiesGeo;
  const cohorts = data?.cohorts;
  const attribution = data?.attribution;
  const actionCenter = data?.actionCenter;

  function campaignKey(c: CampaignBlueprint) {
    return `${c.channel}|${c.region}|${c.geoTier}|${c.objective}|${c.intentCluster}`;
  }

  function roasModel(channel: ChannelName, objective: CampaignBlueprint["objective"]) {
    let floor = 1.8;
    if (channel === "Google Ads" || channel === "Bing Ads") floor = 2.2;
    if (objective === "Recovery") floor += 1.0;
    if (objective === "Bookings") floor += 0.6;
    const target = floor + (objective === "Bookings" ? 1.2 : 0.9);
    const stretch = target + (channel === "Google Ads" || channel === "Bing Ads" ? 1.6 : 1.2);
    const paybackWindowDays = objective === "Recovery" ? 10 : objective === "Bookings" ? 14 : 21;
    return { floor, target, stretch, paybackWindowDays };
  }

  const phase1Campaigns = useMemo<CampaignBlueprint[]>(() => {
    const businessName = campaignCtx?.business?.businessName || "My Drip Nurse";
    const defaultBaseUrl = campaignCtx?.defaultBaseUrl || "https://mydripnurse.com";
    const landingServices = campaignCtx?.landingMap?.services || [];
    const gscQueryHints = (campaignCtx?.gscTopQueries || [])
      .slice(0, 6)
      .map((q) => q.query)
      .filter(Boolean);

    const pickServiceByIntent = (serviceLine: string) => {
      const t = normToken(serviceLine);
      if (t.includes("immunity")) return "immunity_coldflu";
      if (t.includes("recovery")) return "recovery_performance";
      if (t.includes("brain")) return "brain_storm";
      if (t.includes("alleviate")) return "alleviate";
      if (t.includes("myers")) return "myers_cocktail";
      if (t.includes("hangover")) return "hangover_jetlag";
      if (t.includes("nad")) return "nad_plus";
      return "hydration";
    };

    const serviceById = new Map(landingServices.map((s) => [s.id, s]));

    const domainByGeo = (
      geoTier: "state" | "county" | "city",
      region: string,
    ) => {
      const key = normToken(region);
      if (!campaignCtx?.domains) return defaultBaseUrl;
      if (geoTier === "state") {
        return campaignCtx.domains.states[key]?.domain || defaultBaseUrl;
      }
      if (geoTier === "county") {
        const hit = Object.values(campaignCtx.domains.counties).find((x) => normToken(x.county) === key);
        return hit?.domain || defaultBaseUrl;
      }
      const hit = Object.values(campaignCtx.domains.cities).find((x) => normToken(x.city) === key);
      return hit?.domain || defaultBaseUrl;
    };

    const states = (topGeo?.states || [])
      .filter((s) => s.name && s.name !== "__unknown")
      .slice(0, 3)
      .map((s) => ({
        region: geoName(s.name),
        geoTier: "state" as const,
        value: Number(s.value || 0),
        opps: Number(s.opportunities || 0),
      }));

    const counties = (topGeo?.counties || [])
      .filter((c) => c.name && c.name !== "__unknown")
      .slice(0, 3)
      .map((c) => ({
        region: geoName(c.name),
        geoTier: "county" as const,
        value: Number(c.value || 0),
        opps: Number(c.opportunities || 0),
      }));

    const cities = (topGeo?.cities || [])
      .filter((c) => c.name && c.name !== "__unknown")
      .slice(0, 3)
      .map((c) => ({
        region: geoName(c.name),
        geoTier: "city" as const,
        value: Number(c.value || 0),
        opps: Number(c.opportunities || 0),
      }));

    const selectedRegions = [...states, ...counties, ...cities];
    const fallbackGeo = [{ region: "Florida", geoTier: "state" as const, value: 0, opps: 1 }];
    const geos = selectedRegions.length ? selectedRegions : fallbackGeo;

    const sourceHint = attribution?.topSources?.[0]?.source || "Organic + CRM";
    const lostValueNow = Number(ex?.appointmentsLostValueNow || 0);
    const revenueNow = Number(ex?.transactionsRevenueNow || 0);
    const leadsNow = Number(ex?.leadsNow || 0);
    const callsNow = Number(ex?.callsNow || 0);
    const baseline = Math.max(30, Math.round((lostValueNow > 0 ? lostValueNow : revenueNow * 0.08 || 900) / 30));

    const channels: Array<{ channel: ChannelName; mult: number; cta: string }> = [
      { channel: "Google Ads", mult: 1.2, cta: "Book Now" },
      { channel: "Facebook Ads", mult: 1.0, cta: "Get Offer" },
      { channel: "YouTube Ads", mult: 0.85, cta: "Learn More" },
      { channel: "TikTok Ads", mult: 0.8, cta: "Start Quiz" },
      { channel: "Bing Ads", mult: 0.7, cta: "Book Now" },
    ];

    const intentClusters = [
      { intent: "High Intent Book Now", service: "Hydration IV Therapy" },
      { intent: "Symptom Relief Intent", service: "Immunity Defense / Cold & Flu" },
      { intent: "Performance & Recovery Intent", service: "Recovery & Performance" },
    ];

    const blueprints: CampaignBlueprint[] = [];
    for (const g of geos) {
      const valueSignal = Math.max(1, g.value / 250);
      const oppSignal = Math.max(1, g.opps / 2);
      const geoMultiplier = g.geoTier === "city" ? 0.9 : g.geoTier === "county" ? 1.05 : 1.2;
      const priorityScore = Number((Math.min(100, valueSignal * 6 + oppSignal * 10 + geoMultiplier * 15)).toFixed(1));
      const objective: CampaignBlueprint["objective"] =
        g.value > 300 ? "Bookings" : g.opps >= 6 ? "Leads" : "Recovery";
      const serviceLineDefault =
        objective === "Bookings"
          ? "Hydration IV Therapy"
          : objective === "Leads"
            ? "Immunity Defense / Cold & Flu"
            : "Recovery & Performance";
      const dataSignals = `Revenue signal: ${fmtMoney(g.value)} | Opp signal: ${fmtInt(g.opps)} | Lost value window: ${fmtMoney(lostValueNow)}`;

      for (let i = 0; i < channels.length; i += 1) {
        const ch = channels[i];
        const intent = {
          ...intentClusters[i % intentClusters.length],
          service: intentClusters[i % intentClusters.length]?.service || serviceLineDefault,
        };
        const serviceId = pickServiceByIntent(intent.service);
        const svc = serviceById.get(serviceId) || landingServices[0];
        const baseDomain = domainByGeo(g.geoTier, g.region);
        const landingUrl = `${baseDomain.replace(/\/+$/, "")}${svc?.landingPath || "/"}`;
        const formUrl = svc?.formPath ? `${baseDomain.replace(/\/+$/, "")}${svc.formPath}` : "";
        const bookingUrl = svc?.bookingPath ? `${baseDomain.replace(/\/+$/, "")}${svc.bookingPath}` : "";
        const budgetDailyUsd = Math.max(25, Math.round(baseline * ch.mult * valueSignal * geoMultiplier));
        const campaignName = `${ch.channel} | ${g.geoTier.toUpperCase()} | ${g.region} | ${intent.intent}`;
        const adSetOrAdGroup = `${g.region} - ${intent.service}`;
        const copyHeadline = `${intent.service} in ${g.region}`;
        const copyPrimary =
          `${businessName} in ${g.region}: ${intent.service} with same-day nurse response. Focus this campaign on high-intent leads based on current opportunity and revenue signals (${fmtMoney(g.value)} potential, ${fmtInt(g.opps)} opportunities).`;
        const audience =
          ch.channel === "Google Ads" || ch.channel === "Bing Ads"
            ? `Intent search around ${g.region}: mobile IV, ${intent.service.toLowerCase()}, at-home IV nurse, urgent hydration.${gscQueryHints.length ? ` Add top search terms: ${gscQueryHints.slice(0, 3).join(", ")}.` : ""}`
            : `Geo ${g.region} + wellness interests + CRM retargeting + lookalike from high-value appointments.`;
        const funnel =
          `Ad -> landing page (${landingUrl}) -> short form${formUrl ? ` (${formUrl})` : ""} -> booking${bookingUrl ? ` (${bookingUrl})` : ""} -> SLA follow-up <15m.`;
        const kpiTarget =
          objective === "Bookings"
            ? "Book rate + show rate + revenue/appointment"
            : objective === "Leads"
              ? "Qualified lead rate + contactability + booked appointments"
              : "Reactivation conversion + cost per recovered lead";
        const roas = roasModel(ch.channel, objective);
        const targetConfidence: CampaignBlueprint["targetConfidence"] =
          priorityScore >= 70 ? "high" : priorityScore >= 45 ? "medium" : "low";

        blueprints.push({
          channel: ch.channel,
          region: g.region,
          geoTier: g.geoTier,
          objective,
          intentCluster: intent.intent,
          serviceLine: intent.service,
          priorityScore,
          potentialRevenueUsd: g.value,
          budgetDailyUsd,
          audience,
          campaignName,
          adSetOrAdGroup,
          serviceId,
          landingUrl,
          formUrl,
          bookingUrl,
          dataSignals: `${dataSignals} | Leads: ${fmtInt(leadsNow)} | Calls: ${fmtInt(callsNow)} | Source: ${sourceHint}`,
          copyPrimary,
          copyHeadline,
          cta: ch.cta,
          funnel,
          kpiTarget,
          roasFloor: Number(roas.floor.toFixed(1)),
          roasTarget: Number(roas.target.toFixed(1)),
          roasStretch: Number(roas.stretch.toFixed(1)),
          paybackWindowDays: roas.paybackWindowDays,
          targetConfidence,
        });
      }
    }
    return blueprints.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 30);
  }, [
    topGeo,
    attribution?.topSources,
    ex?.appointmentsLostValueNow,
    ex?.transactionsRevenueNow,
    ex?.leadsNow,
    ex?.callsNow,
    campaignCtx,
  ]);

  function exportPhase1CampaignsCsv() {
    const headers = [
      "channel",
      "region",
      "geo_tier",
      "objective",
      "intent_cluster",
      "service_line",
      "priority_score",
      "potential_revenue_usd",
      "budget_daily_usd",
      "campaign_name",
      "adset_or_adgroup",
      "service_id",
      "landing_url",
      "form_url",
      "booking_url",
      "data_signals",
      "audience",
      "copy_headline",
      "copy_primary",
      "cta",
      "funnel",
      "kpi_target",
      "roas_floor",
      "roas_target",
      "roas_stretch",
      "payback_window_days",
      "target_confidence",
    ];
    const rows = phase1Campaigns.map((r) => [
      r.channel,
      r.region,
      r.geoTier,
      r.objective,
      r.intentCluster,
      r.serviceLine,
      r.priorityScore,
      r.potentialRevenueUsd,
      r.budgetDailyUsd,
      r.campaignName,
      r.adSetOrAdGroup,
      r.serviceId,
      r.landingUrl,
      r.formUrl,
      r.bookingUrl,
      r.dataSignals,
      r.audience,
      r.copyHeadline,
      r.copyPrimary,
      r.cta,
      r.funnel,
      r.kpiTarget,
      r.roasFloor,
      r.roasTarget,
      r.roasStretch,
      r.paybackWindowDays,
      r.targetConfidence,
    ]);
    const lines = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phase1-campaign-factory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportExecutivePdf() {
    const now = new Date().toLocaleString();
    const rangeTxt = data?.range
      ? `${new Date(data.range.start).toLocaleDateString()} - ${new Date(data.range.end).toLocaleDateString()}`
      : "N/A";
    const topRows = phase1Campaigns.slice(0, 12);

    const cards = topRows
      .map(
        (c, idx) => `
        <section class="card">
          <h3>${idx + 1}. ${escHtml(c.channel)} - ${escHtml(c.region)} (${escHtml(c.geoTier)})</h3>
          <p><b>Objective:</b> ${escHtml(c.objective)} | <b>Intent:</b> ${escHtml(c.intentCluster)}</p>
          <p><b>Service:</b> ${escHtml(c.serviceLine)} | <b>Priority Score:</b> ${escHtml(c.priorityScore)}</p>
          <p><b>Budget/day:</b> ${escHtml(fmtMoney(c.budgetDailyUsd))} | <b>Potential Revenue:</b> ${escHtml(
            fmtMoney(c.potentialRevenueUsd),
          )}</p>
          <p><b>ROAS:</b> Floor ${escHtml(c.roasFloor.toFixed(1))}x | Target ${escHtml(
            c.roasTarget.toFixed(1),
          )}x | Stretch ${escHtml(c.roasStretch.toFixed(1))}x</p>
          <p><b>Payback:</b> ${escHtml(c.paybackWindowDays)} days | <b>Confidence:</b> ${escHtml(c.targetConfidence)}</p>
          <p><b>Campaign:</b> ${escHtml(c.campaignName)}</p>
          <p><b>Ad Group / Set:</b> ${escHtml(c.adSetOrAdGroup)}</p>
          <p><b>Audience:</b> ${escHtml(c.audience)}</p>
          <p><b>Headline:</b> ${escHtml(c.copyHeadline)}</p>
          <p><b>Primary Copy:</b> ${escHtml(c.copyPrimary)}</p>
          <p><b>CTA:</b> ${escHtml(c.cta)}</p>
          <p><b>Funnel:</b> ${escHtml(c.funnel)}</p>
          <p><b>Landing URL:</b> ${escHtml(c.landingUrl)}</p>
          <p><b>Form URL:</b> ${escHtml(c.formUrl || "-")}</p>
          <p><b>Booking URL:</b> ${escHtml(c.bookingUrl || "-")}</p>
          <p><b>Data Signals:</b> ${escHtml(c.dataSignals)}</p>
          <p><b>KPI Target:</b> ${escHtml(c.kpiTarget)}</p>
        </section>`,
      )
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Executive Campaign Playbook</title>
    <style>
      @page { size: A4; margin: 16mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color:#101827; line-height:1.35; }
      h1 { font-size: 22px; margin: 0 0 8px; }
      h2 { font-size: 16px; margin: 18px 0 10px; }
      h3 { font-size: 14px; margin: 0 0 8px; }
      .meta { font-size: 12px; color:#475467; margin-bottom: 12px; }
      .kpis { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:10px; margin: 10px 0 16px; }
      .kpi { border:1px solid #d0d5dd; border-radius:10px; padding:10px; }
      .kpi .label { font-size:12px; color:#475467; }
      .kpi .val { font-size:20px; font-weight:700; margin-top:4px; }
      .card { border:1px solid #d0d5dd; border-radius:12px; padding:12px; margin:0 0 12px; break-inside: avoid; }
      p { margin: 4px 0; font-size: 12.5px; }
      .footer { margin-top: 18px; font-size:11px; color:#667085; }
    </style>
  </head>
  <body>
    <h1>Executive Campaign Playbook</h1>
    <div class="meta">Generated: ${escHtml(now)} | Range: ${escHtml(rangeTxt)} | Preset: ${escHtml(preset)}</div>
    <div class="kpis">
      <div class="kpi"><div class="label">Leads</div><div class="val">${escHtml(fmtInt(ex?.leadsNow))}</div></div>
      <div class="kpi"><div class="label">Appointments</div><div class="val">${escHtml(fmtInt(ex?.appointmentsNow))}</div></div>
      <div class="kpi"><div class="label">Revenue</div><div class="val">${escHtml(fmtMoney(ex?.transactionsRevenueNow))}</div></div>
      <div class="kpi"><div class="label">Lost Bookings</div><div class="val">${escHtml(fmtInt(ex?.appointmentsLostNow))}</div></div>
      <div class="kpi"><div class="label">Lost Value</div><div class="val">${escHtml(fmtMoney(ex?.appointmentsLostValueNow))}</div></div>
      <div class="kpi"><div class="label">Campaign Blueprints</div><div class="val">${escHtml(fmtInt(phase1Campaigns.length))}</div></div>
    </div>
    <h2>Top Campaign Blueprints (Phase 1)</h2>
    ${cards}
    <div class="footer">Board Meeting Edition - Multi-channel playbook based on live dashboards (state/county/city).</div>
  </body>
</html>`;

    openPrintWindowFromHtml(html, "executive-campaign-playbook");
  }

  function exportBoardMeetingDeck() {
    const now = new Date().toLocaleString();
    const rangeTxt = data?.range
      ? `${new Date(data.range.start).toLocaleDateString()} - ${new Date(data.range.end).toLocaleDateString()}`
      : "N/A";

    const grouped = phase1Campaigns.reduce<Record<ChannelName, CampaignBlueprint[]>>(
      (acc, row) => {
        if (!acc[row.channel]) acc[row.channel] = [];
        acc[row.channel].push(row);
        return acc;
      },
      {
        "Google Ads": [],
        "Facebook Ads": [],
        "YouTube Ads": [],
        "TikTok Ads": [],
        "Bing Ads": [],
      },
    );

    const channelSections = (Object.keys(grouped) as ChannelName[])
      .map((channel) => {
        const rows = grouped[channel].slice(0, 6);
        if (!rows.length) return "";
        const cards = rows
          .map(
            (c, idx) => `
              <div class="deck-card">
                <h4>${idx + 1}. ${escHtml(c.region)} (${escHtml(c.geoTier)})</h4>
                <p><b>Objective:</b> ${escHtml(c.objective)} | <b>Intent:</b> ${escHtml(c.intentCluster)} | <b>Service:</b> ${escHtml(c.serviceLine)}</p>
                <p><b>Budget/day:</b> ${escHtml(fmtMoney(c.budgetDailyUsd))} | <b>ROAS Target:</b> ${escHtml(c.roasTarget.toFixed(1))}x</p>
                <p><b>Headline:</b> ${escHtml(c.copyHeadline)}</p>
                <p><b>Primary Copy:</b> ${escHtml(c.copyPrimary)}</p>
                <p><b>Audience:</b> ${escHtml(c.audience)}</p>
                <p><b>Funnel:</b> ${escHtml(c.funnel)}</p>
                <p><b>Landing:</b> ${escHtml(c.landingUrl)}</p>
              </div>`,
          )
          .join("");

        return `
          <section class="slide page-break">
            <h2>${escHtml(channel)} Strategy</h2>
            <p class="muted">Targeting by state/county/city with revenue-first prioritization.</p>
            <div class="deck-grid">${cards}</div>
          </section>
        `;
      })
      .join("");

    const priorities = phase1Campaigns
      .slice(0, 8)
      .map(
        (c, idx) => `<li>#${idx + 1} ${escHtml(c.channel)} | ${escHtml(c.region)} | Score ${escHtml(
          c.priorityScore,
        )} | ROAS target ${escHtml(c.roasTarget.toFixed(1))}x</li>`,
      )
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Board Meeting Campaign Deck</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color:#0b1220; margin:0; }
      .slide { min-height: calc(100vh - 24mm); padding: 6mm; box-sizing:border-box; }
      .page-break { page-break-before: always; }
      h1 { font-size: 34px; margin: 0 0 10px; }
      h2 { font-size: 24px; margin: 0 0 8px; }
      h3 { font-size: 18px; margin: 0 0 8px; }
      h4 { font-size: 14px; margin: 0 0 6px; }
      p, li { font-size: 12px; line-height: 1.35; margin: 4px 0; }
      .muted { color:#475467; }
      .title-wrap { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #d0d5dd; padding-bottom:10px; margin-bottom:14px; }
      .kpi-grid { display:grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap:10px; margin-top:12px; }
      .kpi { border:1px solid #d0d5dd; border-radius:10px; padding:10px; }
      .kpi .label { color:#475467; font-size:11px; }
      .kpi .val { font-size:20px; font-weight:700; margin-top:4px; }
      .deck-grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
      .deck-card { border:1px solid #d0d5dd; border-radius:10px; padding:10px; break-inside: avoid; }
      .agenda { display:grid; grid-template-columns: 1.2fr 1fr; gap:14px; margin-top:12px; }
      .box { border:1px solid #d0d5dd; border-radius:10px; padding:10px; }
      ul { margin: 8px 0 0 16px; padding: 0; }
    </style>
  </head>
  <body>
    <section class="slide">
      <div class="title-wrap">
        <div>
          <h1>Board Meeting Campaign Deck</h1>
          <p class="muted">Executive Campaign Planning - Multi-Channel Growth</p>
        </div>
        <div class="muted">Generated: ${escHtml(now)}<br/>Range: ${escHtml(rangeTxt)}<br/>Preset: ${escHtml(preset)}</div>
      </div>
      <div class="kpi-grid">
        <div class="kpi"><div class="label">Leads</div><div class="val">${escHtml(fmtInt(ex?.leadsNow))}</div></div>
        <div class="kpi"><div class="label">Calls</div><div class="val">${escHtml(fmtInt(ex?.callsNow))}</div></div>
        <div class="kpi"><div class="label">Conversations</div><div class="val">${escHtml(fmtInt(ex?.conversationsNow))}</div></div>
        <div class="kpi"><div class="label">Appointments</div><div class="val">${escHtml(fmtInt(ex?.appointmentsNow))}</div></div>
        <div class="kpi"><div class="label">Revenue</div><div class="val">${escHtml(fmtMoney(ex?.transactionsRevenueNow))}</div></div>
        <div class="kpi"><div class="label">Lost Value</div><div class="val">${escHtml(fmtMoney(ex?.appointmentsLostValueNow))}</div></div>
      </div>
      <div class="agenda">
        <div class="box">
          <h3>Meeting Agenda</h3>
          <ul>
            <li>Business performance snapshot</li>
            <li>Top geo opportunities (state/county/city)</li>
            <li>Channel-by-channel campaign recommendations</li>
            <li>ROAS targets and budget allocation</li>
            <li>Launch checklist and next 30-day plan</li>
          </ul>
        </div>
        <div class="box">
          <h3>Priority Queue</h3>
          <ul>${priorities}</ul>
        </div>
      </div>
    </section>
    ${channelSections}
    <section class="slide page-break">
      <h2>Execution Notes</h2>
      <div class="box">
        <p><b>Geo Routing Rule:</b> Always send traffic to the matching geo landing path (state/county/city) for relevance and conversion lift.</p>
        <p><b>ROAS Governance:</b> Use floor/target/stretch. Pause under floor after validation window, scale when above target with stable CPL/booking rate.</p>
        <p><b>Ops SLA:</b> Follow-up in &lt;15 minutes for new leads and &lt;10 minutes for retargeted high-intent prospects.</p>
        <p><b>Next Upgrade:</b> Integrate Google Keyword Planner + platform APIs for automated bid/keyword tuning and real conversion-value optimization.</p>
      </div>
    </section>
  </body>
</html>`;

    openPrintWindowFromHtml(html, "board-meeting-campaign-deck");
  }

  async function openCampaignGuide(campaign: CampaignBlueprint) {
    setGuideCampaign(campaign);
    setGuideOpen(true);
    setGuideErr("");
    const key = campaignKey(campaign);
    if (guideCache[key]) {
      setGuideData(guideCache[key]);
      return;
    }

    setGuideLoading(true);
    setGuideData(null);
    try {
      const payload = {
        campaign,
        range: data?.range,
        executive: data?.executive,
        context: {
          business: campaignCtx?.business || null,
          landingMap: campaignCtx?.landingMap || null,
          domains: campaignCtx?.domains || null,
          gscTopQueries: campaignCtx?.gscTopQueries || [],
          topGeo,
          attribution,
        },
      };
      const res = await fetch("/api/dashboard/campaign-factory/guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to generate setup guide");
      }
      const insights = json.insights as CampaignGuide;
      setGuideData(insights);
      setGuideCache((prev) => ({ ...prev, [key]: insights }));
    } catch (e: unknown) {
      setGuideErr(e instanceof Error ? e.message : "Failed to generate setup guide");
    } finally {
      setGuideLoading(false);
    }
  }

  function dashboardHref(dashboard: string) {
    if (dashboard === "calls") return "/dashboard/calls#ai-playbook";
    if (dashboard === "leads") return "/dashboard/contacts#ai-playbook";
    if (dashboard === "conversations") return "/dashboard/conversations#ai-playbook";
    if (dashboard === "transactions") return "/dashboard/transactions#ai-playbook";
    if (dashboard === "appointments") return "/dashboard/appointments#ai-playbook";
    if (dashboard === "gsc") return "/dashboard/gsc#ai-playbook";
    if (dashboard === "ga") return "/dashboard/ga#ai-playbook";
    if (dashboard === "ads") return "/dashboard/ads#ai-playbook";
    if (dashboard === "facebook_ads") return "/dashboard/facebook-ads#ai-playbook";
    return "";
  }

  return (
    <div className="shell callsDash ceoDash">
      {loading ? (
        <div className="dashLoadingOverlay" aria-live="polite" aria-busy="true">
          <div className="dashLoadingCard">
            <div className="dashSpinner" />
            <div className="dashLoadingText">Updating Executive Dashboard...</div>
            <div className="mini" style={{ marginTop: 6 }}>
              Syncing all module KPIs and comparisons.
            </div>
          </div>
        </div>
      ) : null}

      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1>My Drip Nurse — Dashboard</h1>
          </div>
        </div>

        <div className="pills">
          <div className="pill">
            <span className="dot" />
            <span>Live</span>
          </div>
          <div className="pill">
            <span style={{ color: "var(--muted)" }}>Created by</span>
            <span style={{ opacity: 0.55 }}>•</span>
            <span>Axel Castro</span>
            <span style={{ opacity: 0.55 }}>•</span>
            <span>Devasks</span>
          </div>
        </div>
      </header>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Executive Filters</h2>
            <div className="cardSubtitle">
              Rango global para comparar negocio entre dashboards y período previo.
            </div>
          </div>
          <Link className="smallBtn" href="/">
            Back to Control Tower
          </Link>
        </div>

        <div className="cardBody">
          <div className="filtersBar">
            <div className="filtersGroup">
              <div className="filtersLabel">Range</div>
              <div className="rangePills">
                {([
                  ["1d", "1 day"],
                  ["7d", "7 days"],
                  ["28d", "28 days"],
                  ["1m", "Last month"],
                  ["3m", "Last quarter"],
                  ["6m", "Last 6 months"],
                  ["1y", "Last year"],
                  ["custom", "Custom"],
                ] as Array<[RangePreset, string]>).map(([p, label]) => (
                  <button
                    key={p}
                    className={`smallBtn ${preset === p ? "smallBtnOn" : ""}`}
                    onClick={() => setPreset(p)}
                    type="button"
                    disabled={loading}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filtersGroup dateGroup">
              <div className="filtersLabel">Custom dates</div>
              <div className="dateInputs">
                <div className="dateField">
                  <label className="mini" style={{ marginBottom: 6, display: "block" }}>
                    Start
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    disabled={preset !== "custom" || loading}
                  />
                </div>
                <div className="dateField">
                  <label className="mini" style={{ marginBottom: 6, display: "block" }}>
                    End
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    disabled={preset !== "custom" || loading}
                  />
                </div>
                <button
                  className="btn btnPrimary applyBtn"
                  onClick={() => load(false)}
                  disabled={loading || (preset === "custom" && (!customStart || !customEnd))}
                  type="button"
                >
                  {loading && !hardRefreshing ? "Applying..." : "Refresh"}
                </button>
                <button
                  className="smallBtn"
                  onClick={() => load(true)}
                  disabled={loading || (preset === "custom" && (!customStart || !customEnd))}
                  type="button"
                  title="Force refresh all module dashboards and bypass snapshot cache"
                >
                  {loading && hardRefreshing ? "Hard Refreshing..." : "Hard Refresh All"}
                </button>
              </div>
            </div>
          </div>

          {err ? (
            <div className="mini" style={{ color: "var(--danger)", marginTop: 10 }}>
              X {err}
            </div>
          ) : null}
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">CEO KPI Board</h2>
            <div className="cardSubtitle">
              Vista consolidada del negocio para decisiones ejecutivas.
            </div>
          </div>
          <div className="badge">{loading ? "loading..." : "ready"}</div>
        </div>

        <div className="cardBody">
          <div className="kpiRow kpiRowWide">
            <div className="kpi">
              <p className="n">{fmtInt(ex?.leadsNow)}</p>
              <p className="l">Total Leads</p>
              <div className={`mini ${deltaClass(ex?.leadsDeltaPct ?? null)}`}>
                {fmtPct(ex?.leadsDeltaPct ?? null)} vs prev period
              </div>
            </div>

            <div className="kpi">
              <p className="n">{fmtInt(ex?.callsNow)}</p>
              <p className="l">Total Calls</p>
              <div className={`mini ${deltaClass(ex?.callsDeltaPct ?? null)}`}>
                {fmtPct(ex?.callsDeltaPct ?? null)} vs prev period
              </div>
            </div>

            <div className="kpi">
              <p className="n">{fmtInt(ex?.conversationsNow)}</p>
              <p className="l">Conversations</p>
              <div className={`mini ${deltaClass(ex?.conversationsDeltaPct ?? null)}`}>
                {fmtPct(ex?.conversationsDeltaPct ?? null)} vs prev period
              </div>
            </div>

            <div className="kpi">
              <p className="n">{fmtMoney(ex?.transactionsRevenueNow)}</p>
              <p className="l">Transactions Revenue</p>
              <div className={`mini ${deltaClass(ex?.transactionsRevenueDeltaPct ?? null)}`}>
                {fmtPct(ex?.transactionsRevenueDeltaPct ?? null)} vs prev period
              </div>
            </div>

            <div className="kpi">
              <p className="n">{fmtMoney(ex?.transactionsAvgLtvNow)}</p>
              <p className="l">Avg Lifetime Order Value</p>
              <div className="mini">Average by transacting customer</div>
            </div>

            <div className="kpi">
              <p className="n">{fmtInt(ex?.appointmentsNow)}</p>
              <p className="l">Appointments</p>
              <div className={`mini ${deltaClass(ex?.appointmentsDeltaPct ?? null)}`}>
                {fmtPct(ex?.appointmentsDeltaPct ?? null)} vs prev period
              </div>
            </div>

            <div className="kpi">
              <p className="n">{fmtInt(ex?.appointmentsLostNow)}</p>
              <p className="l">Lost Qualified Bookings</p>
              <div className={`mini ${deltaClass(ex?.appointmentsLostDeltaPct ?? null)}`}>
                {fmtPct(ex?.appointmentsLostDeltaPct ?? null)} vs prev period
              </div>
            </div>

            <div className="kpi">
              <p className="n">{ex?.leadToCall == null ? "-" : ex.leadToCall.toFixed(2)}</p>
              <p className="l">Leads per Call</p>
              <div className={`mini ${deltaClass(ex?.leadToCallDeltaPct ?? null)}`}>
                {fmtPct(ex?.leadToCallDeltaPct ?? null)} efficiency
              </div>
            </div>

            <div className="kpi">
              <p className="n">{fmtInt(ex?.gaSessions)}</p>
              <p className="l">GA Sessions</p>
              <div className="mini">Users: {fmtInt(ex?.gaUsers)}</div>
            </div>

            <div className="kpi">
              <p className="n">{fmtInt(ex?.gscClicks)}</p>
              <p className="l">GSC Clicks</p>
              <div className="mini">Impr: {fmtInt(ex?.gscImpressions)}</div>
            </div>

            <div className="kpi">
              <p className="n">{fmtMoney(ex?.adsCost)}</p>
              <p className="l">Ads Spend</p>
              <div className="mini">Conv: {fmtInt(ex?.adsConversions)}</div>
            </div>
          </div>
        </div>
      </section>



      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Forecast & Targets</h2>
            <div className="cardSubtitle">
              Proyección a 30 días basada en ritmo actual vs metas mensuales.
            </div>
          </div>
          <div className="badge">{fmtInt(forecast?.rangeDays)} days selected</div>
        </div>
        <div className="cardBody">
          <div className="kpiRow kpiRowWide">
            <div className="kpi">
              <p className="n">{fmtInt(forecast?.forecast30?.leads)}</p>
              <p className="l">Leads forecast (30d)</p>
              <div className={`mini ${deltaClass(forecast?.forecastVsTarget?.leadsGap ?? null)}`}>
                Gap vs target: {fmtInt(forecast?.forecastVsTarget?.leadsGap)}
              </div>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(forecast?.forecast30?.appointments)}</p>
              <p className="l">Appointments forecast (30d)</p>
              <div className={`mini ${deltaClass(forecast?.forecastVsTarget?.appointmentsGap ?? null)}`}>
                Gap vs target: {fmtInt(forecast?.forecastVsTarget?.appointmentsGap)}
              </div>
            </div>
            <div className="kpi">
              <p className="n">{fmtMoney(forecast?.forecast30?.revenue)}</p>
              <p className="l">Revenue forecast (30d)</p>
              <div className={`mini ${deltaClass(forecast?.forecastVsTarget?.revenueGap ?? null)}`}>
                Gap vs target: {fmtMoney(forecast?.forecastVsTarget?.revenueGap)}
              </div>
            </div>
            <div className="kpi">
              <p className="n">{Number(forecast?.dailyPace?.leads || 0).toFixed(1)}</p>
              <p className="l">Daily leads pace</p>
            </div>
            <div className="kpi">
              <p className="n">{Number(forecast?.dailyPace?.appointments || 0).toFixed(1)}</p>
              <p className="l">Daily appointments pace</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtMoney(forecast?.dailyPace?.revenue)}</p>
              <p className="l">Daily revenue pace</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Geo Business Score</h2>
            <div className="cardSubtitle">
              Score de salud del negocio por estado para priorizar inversión y ejecución.
            </div>
          </div>
          <div className="badge">{fmtInt((geoScore?.states || []).length)} states scored</div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            <div className="moduleCard">
              <div className="moduleTop"><p className="l moduleTitle">Top states</p></div>
              {(geoScore?.states || []).slice(0, 6).map((s, idx) => (
                <div key={`geo-top-${s.state}-${idx}`} className="moduleStat" style={{ marginTop: 8 }}>
                  <div className="mini moduleStatLabel">#{idx + 1} {s.state}</div>
                  <div className="moduleStatValue">{fmtInt(s.score)}</div>
                  <div className="mini">Rev {fmtMoney(s.successfulRevenue)} · Lost {fmtMoney(s.lostValue)}</div>
                </div>
              ))}
            </div>
            <div className="moduleCard">
              <div className="moduleTop"><p className="l moduleTitle">Lagging states</p></div>
              {(geoScore?.laggingStates || []).slice(0, 5).map((s, idx) => (
                <div key={`geo-low-${s.state}-${idx}`} className="moduleStat" style={{ marginTop: 8 }}>
                  <div className="mini moduleStatLabel">#{idx + 1} {s.state}</div>
                  <div className="moduleStatValue">{fmtInt(s.score)}</div>
                  <div className="mini">Lost opps {fmtInt(s.opportunitiesLost)} · Lost value {fmtMoney(s.lostValue)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Pipeline SLA</h2>
            <div className="cardSubtitle">
              Tiempo de primera respuesta y envejecimiento de oportunidades abiertas.
            </div>
          </div>
          <div className="badge">SLA 15m/60m</div>
        </div>
        <div className="cardBody">
          <div className="kpiRow kpiRowWide">
            <div className="kpi">
              <p className="n">{fmtInt(pipelineSla?.leadResponse?.sla15Rate)}%</p>
              <p className="l">SLA 15m hit rate</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(pipelineSla?.leadResponse?.sla60Rate)}%</p>
              <p className="l">SLA 60m hit rate</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(pipelineSla?.leadResponse?.medianMinutes)}</p>
              <p className="l">Median first response (min)</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(pipelineSla?.leadResponse?.noTouchYet)}</p>
              <p className="l">No touch yet</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(pipelineSla?.lostOpenAging?.totalOpen)}</p>
              <p className="l">Open lost opportunities</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(pipelineSla?.lostOpenAging?.over14d)}</p>
              <p className="l">Aging over 14d</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Data Quality Center</h2>
            <div className="cardSubtitle">
              Cobertura de datos críticos para decisiones confiables.
            </div>
          </div>
          <div className="badge">Quality Score {fmtInt(dataQuality?.score)}</div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            <div className="moduleCard">
              <p className="l moduleTitle">Unknown mapping</p>
              <p className="mini moduleLine">Contacts state unknown: {fmtInt(dataQuality?.unknownMapping?.contactsStateUnknown)}</p>
              <p className="mini moduleLine">Conversations state unknown: {fmtInt(dataQuality?.unknownMapping?.conversationsStateUnknown)}</p>
              <p className="mini moduleLine">Appointments state unknown: {fmtInt(dataQuality?.unknownMapping?.appointmentsStateUnknown)}</p>
              <p className="mini moduleLine">Transactions state unknown: {fmtInt(dataQuality?.unknownMapping?.transactionsStateUnknown)}</p>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Missing critical fields</p>
              <p className="mini moduleLine">Missing phone: {fmtInt(dataQuality?.missingCritical?.contactsMissingPhone)}</p>
              <p className="mini moduleLine">Missing email: {fmtInt(dataQuality?.missingCritical?.contactsMissingEmail)}</p>
              <p className="mini moduleLine">Missing source: {fmtInt(dataQuality?.missingCritical?.contactsMissingSource)}</p>
              <p className="mini moduleLine">Unknown channel: {fmtInt(dataQuality?.missingCritical?.conversationsUnknownChannel)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Top Oportunidades Por Geografía</h2>
            <div className="cardSubtitle">
              Ranking por valor potencial y volumen (lost qualified bookings).
            </div>
          </div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            {([
              ["Estados", topGeo?.states || []],
              ["Counties", topGeo?.counties || []],
              ["Ciudades", topGeo?.cities || []],
            ] as Array<[string, Array<{ name: string; opportunities: number; value: number; uniqueContacts: number }>]>).map(
              ([label, rows]) => (
                <div className="moduleCard" key={label}>
                  <div className="moduleTop">
                    <p className="l moduleTitle">{label}</p>
                    <span className="mini moduleDelta">{fmtInt(rows.length)} items</span>
                  </div>
                  {rows.slice(0, 6).map((r, idx) => (
                    <div key={`${label}-${r.name}-${idx}`} className="moduleStat" style={{ marginTop: 8 }}>
                      <div className="mini moduleStatLabel">#{idx + 1} {geoName(r.name)}</div>
                      <div className="moduleStatValue">{fmtMoney(r.value)}</div>
                      <div className="mini">{fmtInt(r.opportunities)} opps · {fmtInt(r.uniqueContacts)} contacts</div>
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Executive Funnel</h2>
            <div className="cardSubtitle">
              Impressions → Clicks → Leads → Conversations → Appointments → Revenue.
            </div>
          </div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            {(funnel?.stages || []).map((s) => (
              <div className="moduleCard" key={s.key}>
                <div className="moduleTop">
                  <p className="l moduleTitle">{s.label}</p>
                  <span className={`mini moduleDelta ${deltaClass(s.deltaPct ?? null)}`}>{fmtPct(s.deltaPct ?? null)}</span>
                </div>
                <div className="moduleStats">
                  <div className="moduleStat">
                    <div className="mini moduleStatLabel">Current</div>
                    <div className="moduleStatValue">{s.key === "revenue" ? fmtMoney(s.valueNow) : fmtInt(s.valueNow)}</div>
                  </div>
                  <div className="moduleStat">
                    <div className="mini moduleStatLabel">Previous</div>
                    <div className="moduleStatValue">{s.key === "revenue" ? fmtMoney(s.valuePrev) : fmtInt(s.valuePrev)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Executive Alerts</h2>
            <div className="cardSubtitle">Riesgos detectados automáticamente y acción sugerida.</div>
          </div>
          <div className="badge">C:{fmtInt(alerts?.critical)} · W:{fmtInt(alerts?.warning)} · I:{fmtInt(alerts?.info)}</div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            {(alerts?.rows || []).slice(0, 8).map((a) => (
              <div className="moduleCard" key={a.id}>
                <div className="moduleTop">
                  <p className="l moduleTitle">{a.title}</p>
                  <span className="badge" style={{ borderColor: severityColor(a.severity), color: severityColor(a.severity) }}>
                    {a.severity.toUpperCase()}
                  </span>
                </div>
                <p className="mini moduleLine">{a.message}</p>
                <p className="mini moduleLine"><b>Action:</b> {a.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Action Center</h2>
            <div className="cardSubtitle">
              Playbooks accionables para ejecutar decisiones CEO con impacto estimado.
            </div>
          </div>
          <div className="badge">
            P1:{fmtInt(actionCenter?.p1)} · P2:{fmtInt(actionCenter?.p2)} · P3:{fmtInt(actionCenter?.p3)}
          </div>
        </div>
        <div className="cardBody">
          <div className="kpiRow kpiRowWide">
            <div className="kpi">
              <p className="n">{fmtInt(actionCenter?.total)}</p>
              <p className="l">Playbooks ready</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtMoney(actionCenter?.expectedImpactUsd)}</p>
              <p className="l">Expected impact (est.)</p>
            </div>
          </div>
          <div className="moduleGrid" style={{ marginTop: 12 }}>
            {(actionCenter?.playbooks || []).map((pb) => (
              <div className="moduleCard" key={pb.id}>
                <div className="moduleTop">
                  <p className="l moduleTitle">{pb.title}</p>
                  <span className="badge" style={{ borderColor: priorityColor(pb.priority), color: priorityColor(pb.priority) }}>
                    {pb.priority}
                  </span>
                </div>
                <p className="mini moduleLine">{pb.why}</p>
                <p className="mini moduleLine"><b>Owner:</b> {pb.owner} · <b>Module:</b> {pb.module}</p>
                <p className="mini moduleLine"><b>Trigger:</b> {pb.triggerMetric}</p>
                <p className="mini moduleLine"><b>Impact:</b> {fmtMoney(pb.expectedImpactUsd)}</p>
                <ul className="aiList">
                  {pb.steps.slice(0, 3).map((st, i) => <li key={i}>{st}</li>)}
                </ul>
                <div className="moduleActions" style={{ marginTop: 10 }}>
                  <Link className="btn btnPrimary moduleBtn" href={pb.ctaDashboard || "/dashboard"}>
                    Execute Playbook
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Cohorts & Retention</h2>
            <div className="cardSubtitle">
              Retención operativa 30/60/90 y performance de cohortes por mes.
            </div>
          </div>
          <div className="badge">{fmtInt(cohorts?.rows?.length || 0)} cohorts</div>
        </div>
        <div className="cardBody">
          <div className="kpiRow kpiRowWide">
            <div className="kpi"><p className="n">{fmtInt(cohorts?.activeContacts)}</p><p className="l">Active contacts</p></div>
            <div className="kpi"><p className="n">{fmtInt(cohorts?.repeatContacts)}</p><p className="l">Repeat contacts</p></div>
            <div className="kpi"><p className="n">{fmtInt(cohorts?.repeatBuyers)}</p><p className="l">Repeat buyers</p></div>
            <div className="kpi"><p className="n">{fmtInt(cohorts?.rebookingRate30d)}%</p><p className="l">Rebooking 30d</p></div>
            <div className="kpi"><p className="n">{fmtInt(cohorts?.rebookingRate60d)}%</p><p className="l">Rebooking 60d</p></div>
            <div className="kpi"><p className="n">{fmtInt(cohorts?.rebookingRate90d)}%</p><p className="l">Rebooking 90d</p></div>
          </div>
          <div className="moduleGrid" style={{ marginTop: 12 }}>
            {(cohorts?.rows || []).map((r) => (
              <div className="moduleCard" key={r.cohort}>
                <div className="moduleTop">
                  <p className="l moduleTitle">{r.cohort}</p>
                  <span className="mini moduleDelta">{fmtInt(r.buyerRate)}% buyer rate</span>
                </div>
                <p className="mini moduleLine">Contacts: {fmtInt(r.contacts)} · Buyers: {fmtInt(r.buyers)}</p>
                <p className="mini moduleLine">Revenue: {fmtMoney(r.revenue)} · LTV: {fmtMoney(r.ltv)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Unified Attribution</h2>
            <div className="cardSubtitle">
              Source unificado con embudo y revenue para decidir inversión por canal/fuente.
            </div>
          </div>
          <div className="badge">{fmtInt(attribution?.topSources?.length || 0)} sources</div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            {(attribution?.topSources || []).slice(0, 10).map((src, idx) => (
              <div className="moduleCard" key={`${src.source}-${idx}`}>
                <div className="moduleTop">
                  <p className="l moduleTitle">{src.source || "unknown"}</p>
                  <span className="mini moduleDelta">{fmtMoney(src.revenue)}</span>
                </div>
                <p className="mini moduleLine">
                  Leads {fmtInt(src.leads)} · Calls {fmtInt(src.calls)} · Conv {fmtInt(src.conversations)}
                </p>
                <p className="mini moduleLine">
                  Appointments {fmtInt(src.appointments)} · L→A {fmtInt(src.leadToAppointmentRate)}%
                </p>
                <p className="mini moduleLine">Revenue/Lead {fmtMoney(src.leadToRevenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Open Dashboards</h2>
            <div className="cardSubtitle">
              Acceso rápido a los módulos más importantes.
            </div>
          </div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            <div className="moduleCard">
              <p className="l moduleTitle">Calls</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/calls#ai-playbook">Open Calls Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Contacts / Leads</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/contacts#ai-playbook">Open Leads Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Conversations / CRM</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/conversations#ai-playbook">Open Conversations Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Appointments</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/appointments">Open Appointments Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Transactions</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/transactions#ai-playbook">Open Transactions Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Google Search Console</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/gsc">Open GSC Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Google Analytics</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/ga">Open GA Dashboard</Link>
              </div>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Google Ads</p>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/ads">Open Ads Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Business Health Score</h2>
            <div className="cardSubtitle">
              Score compuesto (0-100) y tendencia por {bs?.granularity || "period"}.
            </div>
          </div>
          <div className="badge">{bs?.grade ? `Grade ${bs.grade}` : "-"}</div>
        </div>
        <div className="cardBody">
          <div className="kpiRow kpiRowWide">
            <div className="kpi">
              <p className="n">{fmtInt(bs?.current)}</p>
              <p className="l">Current score</p>
              <div className={`mini ${deltaClass(bs?.deltaPct ?? null)}`}>
                {fmtPct(bs?.deltaPct ?? null)} vs prev period
              </div>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(bs?.components?.volume)}</p>
              <p className="l">Volume</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(bs?.components?.revenue)}</p>
              <p className="l">Revenue strength</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(bs?.components?.appointmentQuality)}</p>
              <p className="l">Appointment quality</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(bs?.components?.coverage)}</p>
              <p className="l">Lead coverage</p>
            </div>
            <div className="kpi">
              <p className="n">{fmtInt(bs?.components?.lossHealth)}</p>
              <p className="l">Loss control</p>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="mini" style={{ marginBottom: 8 }}>
              Trend ({bs?.trend?.length || 0} points)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(1, bs?.trend?.length || 1)}, minmax(0, 1fr))`,
                gap: 6,
                alignItems: "end",
                minHeight: 130,
              }}
            >
              {(bs?.trend || []).map((p) => {
                const h = Math.max(6, Math.min(100, Number(p.score || 0)));
                return (
                  <div key={p.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div className="mini" style={{ opacity: 0.9 }}>{fmtInt(p.score)}</div>
                    <div
                      title={`${p.label} | score ${p.score} | leads ${p.leads} | revenue ${fmtMoney(p.successfulRevenue)} | lost ${fmtMoney(p.lostValue)}`}
                      style={{
                        width: "100%",
                        maxWidth: 34,
                        height: `${h}%`,
                        minHeight: 8,
                        borderRadius: 8,
                        background: "linear-gradient(180deg, rgba(86,225,170,.95), rgba(62,130,246,.9))",
                        boxShadow: "0 0 0 1px rgba(255,255,255,.08) inset",
                      }}
                    />
                    <div className="mini" style={{ textAlign: "center", lineHeight: 1.1 }}>{p.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Module Dashboards</h2>
            <div className="cardSubtitle">
              KPIs críticos por módulo con acceso directo a cada dashboard.
            </div>
          </div>
          <div className="cardHeaderActions">
            <button
              className={`smallBtn ${boardMeetingMode ? "smallBtnOn" : ""}`}
              onClick={() => setBoardMeetingMode((x) => !x)}
              type="button"
            >
              {boardMeetingMode ? "Board Meeting: ON" : "Board Meeting: OFF"}
            </button>
          </div>
        </div>

        <div className="cardBody">
          <div className="moduleGrid">
            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Calls</p>
                <span className={`mini moduleDelta ${deltaClass(m?.calls?.deltaPct ?? null)}`}>
                  {fmtPct(m?.calls?.deltaPct ?? null)}
                </span>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Total calls</div>
                  <div className="moduleStatValue">{fmtInt(m?.calls?.total)}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/calls#ai-playbook">Open Calls Dashboard</Link>
              </div>
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Contacts / Leads</p>
                <span className={`mini moduleDelta ${deltaClass(m?.contacts?.deltaPct ?? null)}`}>
                  {fmtPct(m?.contacts?.deltaPct ?? null)}
                </span>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Total leads</div>
                  <div className="moduleStatValue">{fmtInt(m?.contacts?.total)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Inferred from opportunity</div>
                  <div className="moduleStatValue">{fmtInt(m?.contacts?.inferredFromOpportunity)}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/contacts#ai-playbook">Open Leads Dashboard</Link>
              </div>
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Conversations / CRM</p>
                <span className={`mini moduleDelta ${deltaClass(m?.conversations?.deltaPct ?? null)}`}>
                  {fmtPct(m?.conversations?.deltaPct ?? null)}
                </span>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Total conversations</div>
                  <div className="moduleStatValue">{fmtInt(m?.conversations?.total)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">State mapping rate</div>
                  <div className="moduleStatValue">{fmtInt(m?.conversations?.mappedStateRate)}%</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Top channel</div>
                  <div className="moduleStatValue">{String(m?.conversations?.topChannel || "unknown")}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/conversations#ai-playbook">Open Conversations Dashboard</Link>
              </div>
              {m?.conversations?.error ? (
                <div className="mini" style={{ color: "var(--danger)", marginTop: 8 }}>
                  X {m.conversations.error}
                </div>
              ) : null}
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Transactions / Revenue</p>
                <span className={`mini moduleDelta ${deltaClass(m?.transactions?.deltaPct ?? null)}`}>
                  {fmtPct(m?.transactions?.deltaPct ?? null)}
                </span>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Transactions</div>
                  <div className="moduleStatValue">{fmtInt(m?.transactions?.total)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Revenue (succeeded)</div>
                  <div className="moduleStatValue">{fmtMoney(m?.transactions?.grossAmount)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Avg Lifetime Order Value</div>
                  <div className="moduleStatValue">{fmtMoney(m?.transactions?.avgLifetimeOrderValue)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">State mapping rate</div>
                  <div className="moduleStatValue">{fmtInt(m?.transactions?.mappedStateRate)}%</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/transactions#ai-playbook">Open Transactions Dashboard</Link>
              </div>
              {m?.transactions?.error ? (
                <div className="mini" style={{ color: "var(--danger)", marginTop: 8 }}>
                  X {m.transactions.error}
                </div>
              ) : null}
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Appointments</p>
                <span className={`mini moduleDelta ${deltaClass(m?.appointments?.deltaPct ?? null)}`}>
                  {fmtPct(m?.appointments?.deltaPct ?? null)}
                </span>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Total appointments</div>
                  <div className="moduleStatValue">{fmtInt(m?.appointments?.total)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Show rate</div>
                  <div className="moduleStatValue">{fmtInt(m?.appointments?.showRate)}%</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Cancel rate</div>
                  <div className="moduleStatValue">{fmtInt(m?.appointments?.cancellationRate)}%</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">No-show rate</div>
                  <div className="moduleStatValue">{fmtInt(m?.appointments?.noShowRate)}%</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Lost qualified bookings</div>
                  <div className="moduleStatValue">{fmtInt(m?.appointments?.lostQualified)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Potential lost value</div>
                  <div className="moduleStatValue">{fmtMoney(m?.appointments?.potentialLostValue)}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/appointments#ai-playbook">Open Appointments Dashboard</Link>
              </div>
              {m?.appointments?.error ? (
                <div className="mini" style={{ color: "var(--danger)", marginTop: 8 }}>
                  X {m.appointments.error}
                </div>
              ) : null}
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Google Search Console</p>
                <span className={`mini moduleDelta ${deltaClass((m?.gsc?.deltas?.clicksPct as number) || null)}`}>
                  {fmtPct((m?.gsc?.deltas?.clicksPct as number) || null)}
                </span>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Clicks</div>
                  <div className="moduleStatValue">{fmtInt((m?.gsc?.totals?.clicks as number) || 0)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Impressions</div>
                  <div className="moduleStatValue">{fmtInt((m?.gsc?.totals?.impressions as number) || 0)}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/gsc#ai-playbook">Open GSC Dashboard</Link>
              </div>
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Google Analytics</p>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Sessions</div>
                  <div className="moduleStatValue">{fmtInt((m?.ga?.summaryOverall?.sessions as number) || 0)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Conversions</div>
                  <div className="moduleStatValue">{fmtInt((m?.ga?.summaryOverall?.conversions as number) || 0)}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/ga#ai-playbook">Open GA Dashboard</Link>
              </div>
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Google Ads</p>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Cost</div>
                  <div className="moduleStatValue">{fmtMoney((m?.ads?.summary?.cost as number) || 0)}</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Conversions</div>
                  <div className="moduleStatValue">{fmtInt((m?.ads?.summary?.conversions as number) || 0)}</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/ads#ai-playbook">Open Ads Dashboard</Link>
              </div>
            </div>

            <div className="moduleCard">
              <div className="moduleTop">
                <p className="l moduleTitle">Facebook Ads</p>
              </div>
              <div className="moduleStats">
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Status</div>
                  <div className="moduleStatValue">Planner Live</div>
                </div>
                <div className="moduleStat">
                  <div className="mini moduleStatLabel">Source</div>
                  <div className="moduleStatValue">Overview + Geo</div>
                </div>
              </div>
              <div className="moduleActions">
                <Link className="btn btnPrimary moduleBtn" href="/dashboard/facebook-ads#ai-playbook">Open Facebook Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Growth Ops Readiness</h2>
            <div className="cardSubtitle">
              Estado operativo para escalar a Facebook Ads + recomendaciones automáticas con Keyword Planner.
            </div>
          </div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            <div className="moduleCard">
              <p className="l moduleTitle">Google Search Console Access</p>
              <p className="mini moduleLine">Current: waiting approval to leave test mode.</p>
              <p className="mini moduleLine">Impact: limits production-scale insights automation.</p>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Facebook Ads Integration</p>
              <p className="mini moduleLine">Current: strategy dashboard is live.</p>
              <p className="mini moduleLine">Next: connect API, accounts, pixel, and conversion events.</p>
            </div>
            <div className="moduleCard">
              <p className="l moduleTitle">Google Ads Keyword Planner</p>
              <p className="mini moduleLine">Current: planned integration.</p>
              <p className="mini moduleLine">Next: automate geo-intent demand diagnosis by state/county/city.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Phase 1 Campaign Factory</h2>
            <div className="cardSubtitle">
              Playbook multi-canal basado en ingresos + oportunidades por state/county/city (Google, Facebook, YouTube, TikTok, Bing).
            </div>
          </div>
          <div className="cardHeaderActions">
            <button
              className="smallBtn"
              type="button"
              onClick={exportBoardMeetingDeck}
              disabled={!phase1Campaigns.length}
            >
              Export Board Deck PDF
            </button>
            <button
              className="smallBtn"
              type="button"
              onClick={exportExecutivePdf}
              disabled={!phase1Campaigns.length}
            >
              Export Executive PDF
            </button>
            <button
              className="smallBtn"
              type="button"
              onClick={exportPhase1CampaignsCsv}
              disabled={!phase1Campaigns.length}
            >
              Export CSV
            </button>
            <div className="badge">{fmtInt(phase1Campaigns.length)} campaigns</div>
          </div>
        </div>
        <div className="cardBody">
          <div className="moduleGrid">
            {phase1Campaigns.map((c, idx) => (
              <div className="moduleCard" key={`${c.channel}-${c.region}-${idx}`}>
                <div className="moduleTop">
                  <p className="l moduleTitle">{c.channel}</p>
                  <span className="mini moduleDelta">
                    {c.objective} · P{Math.max(1, Math.min(3, Math.ceil((100 - c.priorityScore) / 34)))}
                  </span>
                </div>
                <p className="mini moduleLine"><b>Region:</b> {c.region} ({c.geoTier})</p>
                <p className="mini moduleLine"><b>Priority score:</b> {c.priorityScore}</p>
                <p className="mini moduleLine"><b>Intent:</b> {c.intentCluster}</p>
                <p className="mini moduleLine"><b>Service:</b> {c.serviceLine}</p>
                <p className="mini moduleLine"><b>Revenue signal:</b> {fmtMoney(c.potentialRevenueUsd)}</p>
                <p className="mini moduleLine"><b>Budget/day:</b> {fmtMoney(c.budgetDailyUsd)}</p>
                <p className="mini moduleLine"><b>Campaign:</b> {c.campaignName}</p>
                <p className="mini moduleLine"><b>AdSet/AdGroup:</b> {c.adSetOrAdGroup}</p>
                <p className="mini moduleLine"><b>Landing URL:</b> {c.landingUrl}</p>
                <p className="mini moduleLine"><b>Form URL:</b> {c.formUrl || "-"}</p>
                <p className="mini moduleLine"><b>Booking URL:</b> {c.bookingUrl || "-"}</p>
                <p className="mini moduleLine"><b>Audience:</b> {c.audience}</p>
                <p className="mini moduleLine"><b>Headline:</b> {c.copyHeadline}</p>
                <p className="mini moduleLine"><b>Primary copy:</b> {c.copyPrimary}</p>
                <p className="mini moduleLine"><b>CTA:</b> {c.cta}</p>
                <p className="mini moduleLine"><b>Funnel:</b> {c.funnel}</p>
                <p className="mini moduleLine"><b>Data signals:</b> {c.dataSignals}</p>
                <p className="mini moduleLine"><b>KPI target:</b> {c.kpiTarget}</p>
                <p className="mini moduleLine">
                  <b>ROAS:</b> Floor {c.roasFloor.toFixed(1)}x · Target {c.roasTarget.toFixed(1)}x · Stretch {c.roasStretch.toFixed(1)}x
                </p>
                <p className="mini moduleLine">
                  <b>Payback:</b> {c.paybackWindowDays}d · <b>Confidence:</b> {c.targetConfidence}
                </p>
                <div className="moduleActions" style={{ marginTop: 10 }}>
                  <button className="btn btnPrimary moduleBtn" type="button" onClick={() => openCampaignGuide(c)}>
                    Setup Guide (AI)
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mini" style={{ marginTop: 10, opacity: 0.8 }}>
            Siguiente fase: conectar Keyword Planner + plataformas Ads para automatizar bids, keywords y optimización por conversion value real.
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">AI CEO Swarm</h2>
            <div className="cardSubtitle">
              Agente ejecutivo que coordina Calls, Leads, Conversations, Transactions, Appointments, GSC, GA y Ads para priorizar decisiones de negocio.
            </div>
          </div>
          <div className="cardHeaderActions">
            <button
              className="smallBtn"
              onClick={runCeoInsights}
              disabled={aiLoading || loading || !data?.executive}
              type="button"
            >
              {aiLoading ? "Generating..." : "Run CEO Analysis"}
            </button>
            <button
              className="smallBtn btnPrimary"
              onClick={runCeoInsights}
              disabled={aiLoading || loading || !data?.executive}
              type="button"
            >
              Execute Plan
            </button>
          </div>
        </div>

        <div className="cardBody">
          {aiErr ? (
            <div className="mini" style={{ color: "var(--danger)" }}>X {aiErr}</div>
          ) : null}

          {aiInsights ? (
            <div className="aiBody">
              <div className="aiSummary">
                <div className="aiSummaryTitle">CEO Summary</div>
                <div className="aiText">{aiInsights.ceo_summary}</div>
              </div>

              {aiInsights.board_meeting_narrative ? (
                <div className="aiBlock">
                  <div className="aiBlockTitle">Board Meeting Mode</div>
                  <div className="aiText">{aiInsights.board_meeting_narrative}</div>
                </div>
              ) : null}

              <div className="aiScore">
                <span className={`aiBadge ${aiInsights.board_scorecard?.health || "mixed"}`}>
                  {String(aiInsights.board_scorecard?.health || "mixed").toUpperCase()}
                </span>
                <div className="mini" style={{ marginTop: 8 }}>
                  <b>Biggest risk:</b> {aiInsights.board_scorecard?.biggest_risk}
                </div>
                <div className="mini" style={{ marginTop: 6 }}>
                  <b>Biggest opportunity:</b> {aiInsights.board_scorecard?.biggest_opportunity}
                </div>
              </div>

              {!!aiInsights.swarm_coordination?.length && (
                <div className="aiBlock">
                  <div className="aiBlockTitle">Swarm Coordination Plan</div>
                  <div className="aiOps">
                    {aiInsights.swarm_coordination.slice(0, 4).map((x, idx) => (
                      <div className="aiOp" key={idx}>
                        <div className="aiOpHead">
                          <div className="aiOpTitle">{x.owner_agent}</div>
                          <span className={`aiImpact ${x.expected_business_impact}`}>
                            {x.expected_business_impact.toUpperCase()}
                          </span>
                        </div>
                        <div className="mini" style={{ marginTop: 6 }}>
                          <b>Mission:</b> {x.mission}
                        </div>
                        {!!x.dependencies?.length && (
                          <ul className="aiList">
                            {x.dependencies.slice(0, 4).map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!aiInsights.execute_plan?.length && (
                <div className="aiBlock">
                  <div className="aiBlockTitle">Execute Plan</div>
                  <div className="aiOps">
                    {aiInsights.execute_plan.map((p, idx) => {
                      const href = dashboardHref(p.dashboard);
                      return (
                        <div className="aiOp" key={idx}>
                          <div className="aiOpHead">
                            <div className="aiOpTitle">
                              {p.priority} - {p.action}
                            </div>
                            <span className={`aiImpact ${p.priority === "P1" ? "high" : p.priority === "P2" ? "medium" : "low"}`}>
                              {p.dashboard}
                            </span>
                          </div>
                          <div className="mini" style={{ marginTop: 6 }}>
                            <b>Rationale:</b> {p.rationale}
                          </div>
                          <div className="mini" style={{ marginTop: 6 }}>
                            <b>Trigger:</b> {p.trigger_metric}
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {href ? (
                              <Link className="btn btnPrimary moduleBtn" href={href}>
                                Execute in Dashboard
                              </Link>
                            ) : (
                              <button className="btn moduleBtn" disabled>
                                Pending setup
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="aiPlaceholder mini">
              Ejecuta el análisis CEO para orquestar decisiones entre todos los dashboards.
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <AiAgentChatPanel
              agent="overview"
              title="CEO Agent Chat"
              context={{
                board_meeting_mode: boardMeetingMode,
                range: data?.range || null,
                executive: data?.executive || null,
                modules: data?.modules || null,
              }}
            />
          </div>
        </div>
      </section>

      {guideOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Campaign setup guide"
          onClick={() => setGuideOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7, 12, 22, 0.72)",
            backdropFilter: "blur(6px)",
            zIndex: 1200,
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1080px, 96vw)",
              maxHeight: "88vh",
              overflow: "auto",
              borderRadius: 16,
              border: "1px solid rgba(120,165,255,.35)",
              boxShadow: "0 30px 60px rgba(0,0,0,.4)",
            }}
          >
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">AI Setup Guide</h2>
                <div className="cardSubtitle">
                  {guideCampaign ? `${guideCampaign.channel} · ${guideCampaign.region} (${guideCampaign.geoTier})` : "Campaign guide"}
                </div>
              </div>
              <div className="cardHeaderActions">
                <button className="smallBtn" type="button" onClick={() => setGuideOpen(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="cardBody">
              {guideLoading ? <div className="mini">Generating AI setup guide...</div> : null}
              {guideErr ? <div className="mini" style={{ color: "var(--danger)" }}>X {guideErr}</div> : null}
              {!guideLoading && !guideErr && guideData ? (
                <div className="moduleGrid">
                  <div className="moduleCard">
                    <p className="l moduleTitle">Quick Summary</p>
                    <p className="mini moduleLine">{guideData.quick_summary}</p>
                    <p className="mini moduleLine">
                      <b>Difficulty:</b> {guideData.scorecard.setup_difficulty} · <b>Impact:</b> {guideData.scorecard.expected_impact}
                    </p>
                  </div>
                  <div className="moduleCard">
                    <p className="l moduleTitle">Creative Pack</p>
                    <p className="mini moduleLine"><b>Primary:</b> {guideData.creative_pack.primary_text}</p>
                    <p className="mini moduleLine"><b>Headline:</b> {guideData.creative_pack.headline}</p>
                    <p className="mini moduleLine"><b>CTA:</b> {guideData.creative_pack.cta}</p>
                    <p className="mini moduleLine"><b>Landing message:</b> {guideData.creative_pack.landing_message}</p>
                  </div>
                </div>
              ) : null}
              {!guideLoading && !guideErr && guideData?.setup_steps?.length ? (
                <div className="moduleCard" style={{ marginTop: 12 }}>
                  <p className="l moduleTitle">Step by Step (Beginner Friendly)</p>
                  {guideData.setup_steps.map((st) => (
                    <div key={`${st.step}-${st.title}`} className="moduleStat" style={{ marginTop: 10 }}>
                      <div className="mini moduleStatLabel">Step {st.step}: {st.title}</div>
                      <div className="mini moduleLine"><b>Action:</b> {st.action}</div>
                      <div className="mini moduleLine"><b>Expected output:</b> {st.expected_output}</div>
                      <div className="mini moduleLine"><b>Common mistake:</b> {st.common_mistake}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {!guideLoading && !guideErr && guideData?.launch_checklist?.length ? (
                <div className="moduleCard" style={{ marginTop: 12 }}>
                  <p className="l moduleTitle">Launch Checklist</p>
                  <ul className="aiList">
                    {guideData.launch_checklist.map((x, idx) => (
                      <li key={`${x}-${idx}`}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
