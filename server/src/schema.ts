
import { z } from 'zod';

// Calculation schema
export const calculationSchema = z.object({
  id: z.number(),
  expression: z.string(),
  result: z.number(),
  operation_type: z.enum(['basic', 'scientific']),
  created_at: z.coerce.date()
});

export type Calculation = z.infer<typeof calculationSchema>;

// Input schema for creating calculations
export const createCalculationInputSchema = z.object({
  expression: z.string().min(1, 'Expression cannot be empty'),
  result: z.number(),
  operation_type: z.enum(['basic', 'scientific'])
});

export type CreateCalculationInput = z.infer<typeof createCalculationInputSchema>;

// Input schema for evaluating mathematical expressions
export const evaluateExpressionInputSchema = z.object({
  expression: z.string().min(1, 'Expression cannot be empty')
});

export type EvaluateExpressionInput = z.infer<typeof evaluateExpressionInputSchema>;

// Response schema for expression evaluation
export const evaluationResultSchema = z.object({
  expression: z.string(),
  result: z.number(),
  operation_type: z.enum(['basic', 'scientific'])
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

// Input schema for getting calculation history with optional pagination
export const getHistoryInputSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0)
});

export type GetHistoryInput = z.infer<typeof getHistoryInputSchema>;
