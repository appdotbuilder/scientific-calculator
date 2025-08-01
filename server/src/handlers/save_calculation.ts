
import { db } from '../db';
import { calculationsTable } from '../db/schema';
import { type CreateCalculationInput, type Calculation } from '../schema';

export const saveCalculation = async (input: CreateCalculationInput): Promise<Calculation> => {
  try {
    // Insert calculation record
    const result = await db.insert(calculationsTable)
      .values({
        expression: input.expression,
        result: input.result,
        operation_type: input.operation_type
      })
      .returning()
      .execute();

    const calculation = result[0];
    return {
      ...calculation,
      result: calculation.result // real column already returns as number
    };
  } catch (error) {
    console.error('Calculation save failed:', error);
    throw error;
  }
};
