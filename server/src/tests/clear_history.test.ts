
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculationsTable } from '../db/schema';
import { clearHistory } from '../handlers/clear_history';

describe('clearHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should clear all calculation history', async () => {
    // Create some test calculation records
    await db.insert(calculationsTable).values([
      {
        expression: '2 + 2',
        result: 4,
        operation_type: 'basic'
      },
      {
        expression: 'sin(0)',
        result: 0,
        operation_type: 'scientific'
      },
      {
        expression: '10 * 5',
        result: 50,
        operation_type: 'basic'
      }
    ]).execute();

    // Verify records exist before clearing
    const beforeClear = await db.select().from(calculationsTable).execute();
    expect(beforeClear).toHaveLength(3);

    // Clear the history
    const result = await clearHistory();

    // Verify the response
    expect(result.success).toBe(true);
    expect(result.message).toBe('Calculation history cleared successfully');

    // Verify all records are deleted
    const afterClear = await db.select().from(calculationsTable).execute();
    expect(afterClear).toHaveLength(0);
  });

  it('should return success even when no records exist', async () => {
    // Verify no records exist initially
    const beforeClear = await db.select().from(calculationsTable).execute();
    expect(beforeClear).toHaveLength(0);

    // Clear the history (should succeed even with empty table)
    const result = await clearHistory();

    // Verify the response
    expect(result.success).toBe(true);
    expect(result.message).toBe('Calculation history cleared successfully');

    // Verify table is still empty
    const afterClear = await db.select().from(calculationsTable).execute();
    expect(afterClear).toHaveLength(0);
  });

  it('should clear only calculation records', async () => {
    // Create test calculation records
    await db.insert(calculationsTable).values([
      {
        expression: '1 + 1',
        result: 2,
        operation_type: 'basic'
      },
      {
        expression: 'cos(0)',
        result: 1,
        operation_type: 'scientific'
      }
    ]).execute();

    // Verify records exist
    const beforeClear = await db.select().from(calculationsTable).execute();
    expect(beforeClear).toHaveLength(2);

    // Clear the history
    await clearHistory();

    // Verify all calculation records are deleted
    const afterClear = await db.select().from(calculationsTable).execute();
    expect(afterClear).toHaveLength(0);
  });
});
