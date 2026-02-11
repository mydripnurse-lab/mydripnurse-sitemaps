import { NextResponse } from "next/server";
import OpenAI from "openai";
import { appendAiEvent } from "@/lib/aiMemory";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ResponseOutputText = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type InsightMeta = {
  scorecard?: {
    health?: string;
  };
  quick_summary?: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY in environment." },
        { status: 500 },
      );
    }

    const payload = await req.json();

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        quick_summary: { type: "string" },
        scorecard: {
          type: "object",
          additionalProperties: false,
          properties: {
            health: { type: "string", enum: ["good", "mixed", "bad"] },
            setup_difficulty: { type: "string", enum: ["easy", "medium", "advanced"] },
            expected_impact: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["health", "setup_difficulty", "expected_impact"],
        },
        setup_steps: {
          type: "array",
          minItems: 6,
          maxItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              step: { type: "integer" },
              title: { type: "string" },
              action: { type: "string" },
              expected_output: { type: "string" },
              common_mistake: { type: "string" },
            },
            required: ["step", "title", "action", "expected_output", "common_mistake"],
          },
        },
        creative_pack: {
          type: "object",
          additionalProperties: false,
          properties: {
            primary_text: { type: "string" },
            headline: { type: "string" },
            cta: { type: "string" },
            landing_message: { type: "string" },
          },
          required: ["primary_text", "headline", "cta", "landing_message"],
        },
        launch_checklist: {
          type: "array",
          minItems: 5,
          maxItems: 10,
          items: { type: "string" },
        },
      },
      required: ["quick_summary", "scorecard", "setup_steps", "creative_pack", "launch_checklist"],
    };

    const resp = await client.responses.create({
      model: "gpt-5.2",
      reasoning: { effort: "none" },
      input: [
        {
          role: "system",
          content:
            "You are a senior paid-ads operator and trainer for a multi-geo business architecture (state/county/city landing structure). " +
            "Create a short, precise setup guide for a beginner with almost no ads knowledge. " +
            "Use plain language, practical steps, and avoid jargon overload. " +
            "Use the business context provided in payload and never mention internal project names in public ad copy. " +
            "Output only structured JSON matching schema.",
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "campaign_factory_setup_guide",
          schema,
        },
      },
      temperature: 0.25,
    });

    const out = resp as ResponseOutputText;
    let outText = out.output_text;
    if (!outText) {
      outText =
        out.output
          ?.flatMap((o) => o.content || [])
          ?.find((c) => c.type === "output_text")?.text || "";
    }

    if (!outText) {
      return NextResponse.json(
        { ok: false, error: "Empty model output." },
        { status: 502 },
      );
    }

    let insights: unknown = null;
    try {
      insights = JSON.parse(outText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Model did not return valid JSON.",
          raw: outText.slice(0, 800),
        },
        { status: 502 },
      );
    }

    const parsed = insights as InsightMeta;
    await appendAiEvent({
      agent: "overview",
      kind: "insight_run",
      summary: `Campaign setup guide generated (${String(parsed?.scorecard?.health || "mixed")})`,
      metadata: {
        health: parsed?.scorecard?.health || null,
        summary: parsed?.quick_summary || null,
      },
    });

    return NextResponse.json({ ok: true, insights });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to generate campaign guide" },
      { status: 500 },
    );
  }
}
