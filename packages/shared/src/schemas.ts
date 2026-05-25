import { z } from "zod";
import { IdeaStage, DocumentType } from "./types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  full_name: z.string().min(2).max(100),
});

export const ideaSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  stage: z.nativeEnum(IdeaStage).default(IdeaStage.DRAFT),
  market_size: z.string().optional(),
  target_audience: z.string().min(5).max(500),
  problem_statement: z.string().min(10).max(1000),
  unique_value_prop: z.string().min(10).max(1000),
});

export const documentSchema = z.object({
  doc_type: z.nativeEnum(DocumentType),
  content: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type IdeaInput = z.infer<typeof ideaSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
