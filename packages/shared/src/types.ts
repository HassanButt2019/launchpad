// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types matching the LaunchPad backend schemas
// ─────────────────────────────────────────────────────────────────────────────

export enum IdeaStage {
  DRAFT = "DRAFT",
  VALIDATING = "VALIDATING",
  VALIDATED = "VALIDATED",
  BUILDING = "BUILDING",
  INCORPORATED = "INCORPORATED",
}

export enum DocumentType {
  PITCH_DECK = "PITCH_DECK",
  BUSINESS_PLAN = "BUSINESS_PLAN",
  MVP_SPEC = "MVP_SPEC",
  MARKET_RESEARCH = "MARKET_RESEARCH",
  FINANCIAL_MODEL = "FINANCIAL_MODEL",
  LEGAL_CHECKLIST = "LEGAL_CHECKLIST",
}

export enum ChecklistPhase {
  VALIDATE = "VALIDATE",
  BUILD = "BUILD",
  LAUNCH = "LAUNCH",
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
  subscription_tier: 'validate' | 'build' | 'launch';
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  stage: IdeaStage;
  market_size: string | null;
  target_audience: string;
  problem_statement: string;
  unique_value_prop: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationReport {
  id: string;
  idea_id: string;
  score: number;
  score_rationale: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  competitive_landscape: string | null;
  market_opportunity: string | null;
  sources: string[] | null;
  generated_at: string;
}

export interface ChecklistItem {
  task: string;
  completed: boolean;
  resource_url: string | null;
}

export interface Checklist {
  id: string;
  idea_id: string;
  phase: ChecklistPhase;
  items: ChecklistItem[];
}

export interface Document {
  id: string;
  idea_id: string;
  doc_type: DocumentType;
  status: string;
  version: number;
  created_at: string;
}

export interface DocumentDetail extends Document {
  content: string;
}

export interface ChecklistProgress {
  phase: ChecklistPhase;
  total: number;
  completed: number;
}

export interface Journey {
  idea: Idea;
  validation: ValidationReport | null;
  checklists: Checklist[];
  document_count: number;
  checklist_progress: ChecklistProgress[];
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface JurisdictionInfo {
  code: string;
  name: string;
  region: string;
  legal_structure: string;
  setup_cost_usd_min: number;
  setup_cost_usd_max: number;
  annual_cost_usd_min: number;
  annual_cost_usd_max: number;
  incorporation_days_min: number;
  incorporation_days_max: number;
  corporate_tax_rate: string;
  foreign_ownership: boolean;
  vc_fundable: boolean;
  remote_setup: boolean;
  best_for: string;
  key_advantage: string;
  key_risk: string;
}

export interface FormationChecklistItem {
  id: string;
  formation_id: string;
  category: string;
  title: string;
  description: string;
  is_required: boolean;
  can_ai_draft: boolean;
  official_link: string | null;
  estimated_days: number;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface FormationDocument {
  id: string;
  formation_id: string;
  doc_type: string;
  jurisdiction: string;
  content: string | null;
  status: string;
  version: number;
  generated_at: string;
}

export interface ComplianceEvent {
  id: string;
  formation_id: string;
  title: string;
  description: string;
  due_date: string;
  recurrence: string | null;
  completed: boolean;
  reminder_sent: boolean;
}

export interface FormationProfile {
  id: string;
  idea_id: string;
  user_id: string;
  jurisdiction: string;
  legal_structure: string;
  status: string;
  incorporation_date: string | null;
  created_at: string;
  updated_at: string;
  checklist_items: FormationChecklistItem[];
  documents: FormationDocument[];
  compliance_events: ComplianceEvent[];
}

export interface JurisdictionRecommendation {
  jurisdiction_code: string;
  reasoning: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  idea_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
