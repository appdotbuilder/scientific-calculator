
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculationsTable } from '../db/schema';
import { type GetHistoryInput } from '../schema';
import { getCalculationHistory } from '../handlers/get_calculation_history';

// Test input with defaults applied
const testInput: GetHistoryInput = {
  limit: 50,
  offset: 0
};

describe('getCalculationHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no calculations exist', async () => {
    const result = await getCalculationHistory(testInput);
    expect(result).toEqual([]);
  });

  it('should return calculations ordered by most recent first', async () => {
    // Create test calculations with slight time delays
    const calc1 = await db.insert(calculationsTable)
      .values({
        expression: '2 + 2',
        result: 4,
        operation_type: 'basic'
      })
      .returning()
      .execute();

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const calc2 = await db.insert(calculationsTable)
      .values({
        expression: 'sin(1.57)',
        result: 1,
        operation_type: 'scientific'
      })
      .returning()
      .execute();

    const result = await getCalculationHistory(testInput);

    expect(result).toHaveLength(2);
    // Most recent should come first (calc2)
    expect(result[0].expression).toEqual('sin(1.57)');
    expect(result[0].operation_type).toEqual('scientific');
    expect(result[1].expression).toEqual('2 + 2');
    expect(result[1].operation_type).toEqual('basic');

    // Verify all fields are present and correct types
    result.forEach(calculation => {
      expect(calculation.id).toBeDefined();
      expect(typeof calculation.expression).toBe('string');
      expect(typeof calculation.result).toBe('number');
      expect(['basic', 'scientific']).toContain(calculation.operation_type);
      expect(calculation.created_at).toBeInstanceOf(Date);
    });
  });

  it('should respect limit parameter', async () => {
    // Create 3 test calculations
    await db.insert(calculationsTable)
      .values([
        { expression: '1 + 1', result: 2, operation_type: 'basic' },
        { expression: '2 + 2', result: 4, operation_type: 'basic' },
        { expression: '3 + 3', result: 6, operation_type: 'basic' }
      ])
      .execute();

    const limitedInput: GetHistoryInput = {
      limit: 2,
      offset: 0
    };

    const result = await getCalculationHistory(limitedInput);
    expect(result).toHaveLength(2);
  });

  it('should respect offset parameter', async () => {
    // Create 3 test calculations
    await db.insert(calculationsTable)
      .values([
        { expression: '1 + 1', result: 2, operation_type: 'basic' },
        { expression: '2 + 2', result: 4, operation_type: 'basic' },
        { expression: '3 + 3', result: 6, operation_type: 'basic' }
      ])
      .execute();

    const offsetInput: GetHistoryInput = {
      limit: 50,
      offset: 1
    };

    const result = await getCalculationHistory(offsetInput);
    expect(result).toHaveLength(2); // Should skip the first (most recent) record
  });

  it('should handle pagination correctly', async () => {
    // Create 5 test calculations
    const expressions = ['1+1', '2+2', '3+3', '4+4', '5+5'];
    for (let i = 0; i < expressions.length; i++) {
      await db.insert(calculationsTable)
        .values({
          expression: expressions[i],
          result: (i + 1) * 2,
          operation_type: 'basic'
        })
        .execute();
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Get first page (2 items)
    const page1 = await getCalculationHistory({ limit: 2, offset: 0 });
    expect(page1).toHaveLength(2);
    expect(page1[0].expression).toEqual('5+5'); // Most recent

    // Get second page (2 items)
    const page2 = await getCalculationHistory({ limit: 2, offset: 2 });
    expect(page2).toHaveLength(2);
    expect(page2[0].expression).toEqual('3+3');

    // Get third page (1 item remaining)
    const page3 = await getCalculationHistory({ limit: 2, offset: 4 });
    expect(page3).toHaveLength(1);
    expect(page3[0].expression).toEqual('1+1'); // Oldest
  });
});
