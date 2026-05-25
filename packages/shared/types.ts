// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types matching the LaunchPad backend schemas
// ─────────────────────────────────────────────────────────────────────────────

export type IdeaStage = "DRAFT" | "VALIDATING" | "VALIDATED" | "BUILDING";

export type DocumentType =
  | "PITCH_DECK"
  | "BUSINESS_PLAN"
  | "MVP_SPEC"
  | "MARKET_RESEARCH"
  | "FINANCIAL_MODEL"
  | "LEGAL_CHECKLIST";

export type ChecklistPhase = "VALIDATE" | "BUILD" | "LAUNCH";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string; // ISO 8601
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

// ─── Idea ─────────────────────────────────────────────────────────────────────

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  stage: IdeaStage;
  market_size: number | null;
  target_audience: string | null;
  problem_statement: string | null;
  unique_value_prop: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaCreate {
  title: string;
  description?: string;
  stage?: IdeaStage;
  market_size?: number;
  target_audience?: string;
  problem_statement?: string;
  unique_value_prop?: string;
}

export interface IdeaUpdate extends Partial<IdeaCreate> {}

// ─── Validation Report ────────────────────────────────────────────────────────

export interface ValidationReport {
  id: string;
  idea_id: string;
  score: number; // 0–100
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendations: string[] | null;
  generated_at: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  idea_id: string;
  doc_type: DocumentType;
  status: string;
  version: number;
  created_at: string;
}

export interface DocumentDetail extends Document {
  content: string | null;
}

export interface DocumentCreate {
  doc_type: DocumentType;
  content: string;
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  task: string;
  completed: boolean;
  resource_url: string;
}

export interface Checklist {
  id: string;
  idea_id: string;
  phase: ChecklistPhase;
  items: ChecklistItem[] | null;
  created_at: string;
}

// ─── Journey ──────────────────────────────────────────────────────────────────

export interface ChecklistProgress {
  phase: ChecklistPhase;
  total: number;
  completed: number;
  progress_pct: number;
}

export interface Journey {
  idea: Idea;
  validation_report: ValidationReport | null;
  documents_count: number;
  checklist_progress: ChecklistProgress[];
}
