import { getOpenAI, OPENAI_MODEL } from "./client";
import type { SlideTiming } from "@/types/database";

export type ReportInput = {
  title: string;
  context: string | null;
  targetDurationMinutes: number;
  slideTexts: string[];
  transcript: string;
  slideTimings: SlideTiming[];
  totalDurationSeconds: number;
};

export type GeneratedReport = {
  coverage: {
    items: {
      slide: number;
      status: "well_covered" | "briefly_mentioned" | "skipped";
      covered_points: string[];
      missed_points: string[];
      comment: string;
    }[];
    summary: string;
  };
  timing: {
    items: {
      slide: number;
      duration_seconds: number;
      assessment: "too_short" | "balanced" | "too_long";
      comment: string;
    }[];
    total_actual_seconds: number;
    total_target_seconds: number;
    overall_assessment: string;
  };
  delivery: {
    filler_word_count: number;
    filler_examples: string[];
    pace_words_per_minute: number;
    pace_assessment: "too_slow" | "good" | "too_fast";
    repetition_notes: string;
    clarity_notes: string;
  };
  structure: {
    flow_score: number;
    main_argument_clarity: number;
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions: string[];
  };
  questions: { question: string; rationale: string }[];
  overall_summary: string;
};

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    coverage: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              slide: { type: "integer" },
              status: {
                type: "string",
                enum: ["well_covered", "briefly_mentioned", "skipped"],
              },
              covered_points: { type: "array", items: { type: "string" } },
              missed_points: { type: "array", items: { type: "string" } },
              comment: { type: "string" },
            },
            required: [
              "slide",
              "status",
              "covered_points",
              "missed_points",
              "comment",
            ],
          },
        },
        summary: { type: "string" },
      },
      required: ["items", "summary"],
    },
    timing: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              slide: { type: "integer" },
              duration_seconds: { type: "number" },
              assessment: {
                type: "string",
                enum: ["too_short", "balanced", "too_long"],
              },
              comment: { type: "string" },
            },
            required: ["slide", "duration_seconds", "assessment", "comment"],
          },
        },
        total_actual_seconds: { type: "number" },
        total_target_seconds: { type: "number" },
        overall_assessment: { type: "string" },
      },
      required: [
        "items",
        "total_actual_seconds",
        "total_target_seconds",
        "overall_assessment",
      ],
    },
    delivery: {
      type: "object",
      additionalProperties: false,
      properties: {
        filler_word_count: { type: "integer" },
        filler_examples: { type: "array", items: { type: "string" } },
        pace_words_per_minute: { type: "number" },
        pace_assessment: {
          type: "string",
          enum: ["too_slow", "good", "too_fast"],
        },
        repetition_notes: { type: "string" },
        clarity_notes: { type: "string" },
      },
      required: [
        "filler_word_count",
        "filler_examples",
        "pace_words_per_minute",
        "pace_assessment",
        "repetition_notes",
        "clarity_notes",
      ],
    },
    structure: {
      type: "object",
      additionalProperties: false,
      properties: {
        flow_score: { type: "integer", minimum: 1, maximum: 10 },
        main_argument_clarity: { type: "integer", minimum: 1, maximum: 10 },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        improvement_suggestions: { type: "array", items: { type: "string" } },
      },
      required: [
        "flow_score",
        "main_argument_clarity",
        "strengths",
        "weaknesses",
        "improvement_suggestions",
      ],
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          rationale: { type: "string" },
        },
        required: ["question", "rationale"],
      },
    },
    overall_summary: { type: "string" },
  },
  required: [
    "coverage",
    "timing",
    "delivery",
    "structure",
    "questions",
    "overall_summary",
  ],
} as const;

const SYSTEM_PROMPT = `You are an expert presentation coach. You analyze a student's or professional's presentation practice session and produce SPECIFIC, ACTIONABLE feedback.

Hard rules:
- Be concrete. Reference specific slides, specific phrases, and specific time durations. NEVER write generic advice like "improve your confidence" or "speak more clearly". Always tie feedback to evidence from the transcript or timings.
- Quote short fragments (3–8 words) from the transcript when useful.
- Compare what the slides say to what the speaker actually said. Note missing key points by name.
- For timing, compare actual vs target duration and call out specific slides that ran long or short.
- For delivery, count filler words in the transcript (um, uh, like, you know, so, basically, actually, right) and report exact counts and examples.
- For questions, generate critical, intelligent questions a professor or experienced audience member would ask — based on the actual slide content and any weak/skipped areas in the transcript.
- Use kind, encouraging language. The goal is to build confidence through useful feedback, not to demoralize.
- All durations are in seconds.`;

function buildUserPrompt(input: ReportInput): string {
  const slidesBlock = input.slideTexts
    .map((text, i) => {
      const t = (text || "").trim() || "(no extractable text on this slide)";
      return `--- Slide ${i + 1} ---\n${t}`;
    })
    .join("\n\n");

  const timingsBlock = input.slideTimings
    .map((t) => {
      const sec = (t.durationMs / 1000).toFixed(1);
      return `Slide ${t.slide}: ${sec}s`;
    })
    .join("\n");

  const targetSeconds = input.targetDurationMinutes * 60;

  return `PRESENTATION METADATA
Title: ${input.title}
Context: ${input.context || "(none provided)"}
Target duration: ${input.targetDurationMinutes} minutes (${targetSeconds} seconds)
Actual duration: ${input.totalDurationSeconds} seconds
Slide count: ${input.slideTexts.length}

SLIDE CONTENT (extracted from PDF)
${slidesBlock}

TIME SPENT PER SLIDE
${timingsBlock || "(no timings recorded)"}

FULL TRANSCRIPT
${input.transcript || "(no transcript)"}

Produce the full feedback report as a JSON object matching the provided schema. Include one coverage item per slide and one timing item per slide that the speaker actually visited. Generate 3–5 audience questions.`;
}

export async function generateReport(
  input: ReportInput,
): Promise<GeneratedReport> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "presentation_feedback_report",
        strict: true,
        schema: REPORT_SCHEMA,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty completion from OpenAI");
  return JSON.parse(content) as GeneratedReport;
}
