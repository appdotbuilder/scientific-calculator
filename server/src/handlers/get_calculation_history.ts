
import { db } from '../db';
import { calculationsTable } from '../db/schema';
import { type GetHistoryInput, type Calculation } from '../schema';
import { desc } from 'drizzle-orm';

export async function getCalculationHistory(input: GetHistoryInput): Promise<Calculation[]> {
  try {
    // Build query with pagination and ordering
    let query = db.select()
      .from(calculationsTable)
      .orderBy(desc(calculationsTable.created_at)) // Most recent first
      .limit(input.limit)
      .offset(input.offset);

    const results = await query.execute();

    // Convert real column back to number (PostgreSQL real is returned as number, so no conversion needed)
    return results.map(calculation => ({
      ...calculation,
      result: calculation.result // real columns are already numbers
    }));
  } catch (error) {
    console.error('Failed to get calculation history:', error);
    throw error;
  }
}
