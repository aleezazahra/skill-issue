import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(39)
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/, "Invalid GitHub username");

export const createAnalysisSchema = z.object({
  username: usernameSchema,
});

export const createBlueprintSchema = z.object({
  issueId: z.string().trim().min(1),
});

export const skillProfileModelSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        assessment: z.enum(["observed", "demonstrated", "inferred"]),
        confidence: z.number().min(0).max(1),
        evidence_ids: z.array(z.string()).max(12),
        explanation: z.string().trim().min(1).max(600),
      }),
    )
    .min(1)
    .max(20),
});

export const blueprintModelSchema = z.object({
  summary: z.string().trim().min(1).max(2000),
  why_this_matches: z.array(z.string().trim().min(1).max(500)).max(8),
  unknowns: z.array(z.string().trim().min(1).max(500)).max(10),
  investigation_steps: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().min(1).max(1200),
        verified_paths: z.array(z.string().trim().min(1).max(300)).max(10),
      }),
    )
    .max(10),
  implementation_steps: z.array(z.string().trim().min(1).max(600)).max(15),
  validation_steps: z.array(z.string().trim().min(1).max(600)).max(15),
  maintainer_questions: z.array(z.string().trim().min(1).max(600)).max(10),
  pull_request_checklist: z.array(z.string().trim().min(1).max(600)).max(15),
});

export const issueRelevanceModelSchema = z.object({
  reasons: z.array(z.string().trim().min(1).max(400)).max(6),
  unknowns: z.array(z.string().trim().min(1).max(400)).max(6),
});

export type SkillProfileModelOutput = z.infer<typeof skillProfileModelSchema>;
export type BlueprintModelOutput = z.infer<typeof blueprintModelSchema>;
export type IssueRelevanceModelOutput = z.infer<typeof issueRelevanceModelSchema>;
