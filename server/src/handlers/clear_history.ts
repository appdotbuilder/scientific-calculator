
import { db } from '../db';
import { calculationsTable } from '../db/schema';

export async function clearHistory(): Promise<{ success: boolean; message: string }> {
  try {
    // Delete all calculation records from the database
    await db.delete(calculationsTable).execute();

    return {
      success: true,
      message: 'Calculation history cleared successfully'
    };
  } catch (error) {
    console.error('Failed to clear calculation history:', error);
    throw error;
  }
}
