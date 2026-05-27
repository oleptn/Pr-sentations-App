export type SlideTiming = {
  slide: number;
  startMs: number;
  endMs: number;
  durationMs: number;
};

export type Presentation = {
  id: string;
  user_id: string;
  title: string;
  context: string | null;
  target_duration_minutes: number;
  pdf_path: string;
  slide_count: number;
  slide_texts: string[];
  created_at: string;
};

export type PracticeSessionStatus =
  | "in_progress"
  | "processing"
  | "completed"
  | "failed";

export type PracticeSession = {
  id: string;
  presentation_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  total_duration_seconds: number | null;
  transcript: string | null;
  slide_timings: SlideTiming[];
  audio_path: string | null;
  status: PracticeSessionStatus;
  created_at: string;
};

export type CoverageItem = {
  slide: number;
  status: "well_covered" | "briefly_mentioned" | "skipped";
  covered_points: string[];
  missed_points: string[];
  comment: string;
};

export type TimingItem = {
  slide: number;
  duration_seconds: number;
  assessment: "too_short" | "balanced" | "too_long";
  comment: string;
};

export type DeliveryAnalysis = {
  filler_word_count: number;
  filler_examples: string[];
  pace_words_per_minute: number;
  pace_assessment: "too_slow" | "good" | "too_fast";
  repetition_notes: string;
  clarity_notes: string;
};

export type StructureAnalysis = {
  flow_score: number;
  main_argument_clarity: number;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
};

export type AIReport = {
  id: string;
  session_id: string;
  user_id: string;
  coverage: { items: CoverageItem[]; summary: string } | null;
  timing: {
    items: TimingItem[];
    total_actual_seconds: number;
    total_target_seconds: number;
    overall_assessment: string;
  } | null;
  delivery: DeliveryAnalysis | null;
  structure: StructureAnalysis | null;
  questions: { question: string; rationale: string }[] | null;
  overall_summary: string | null;
  created_at: string;
};
