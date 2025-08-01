
import { serial, text, pgTable, timestamp, real, pgEnum } from 'drizzle-orm/pg-core';

// Define enum for operation types
export const operationTypeEnum = pgEnum('operation_type', ['basic', 'scientific']);

export const calculationsTable = pgTable('calculations', {
  id: serial('id').primaryKey(),
  expression: text('expression').notNull(),
  result: real('result').notNull(), // Use real for floating-point numbers
  operation_type: operationTypeEnum('operation_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Calculation = typeof calculationsTable.$inferSelect; // For SELECT operations
export type NewCalculation = typeof calculationsTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { calculations: calculationsTable };
