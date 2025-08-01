
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculationsTable } from '../db/schema';
import { type CreateCalculationInput } from '../schema';
import { saveCalculation } from '../handlers/save_calculation';
import { eq } from 'drizzle-orm';

// Test inputs for different operation types
const basicInput: CreateCalculationInput = {
  expression: '2 + 3',
  result: 5,
  operation_type: 'basic'
};

const scientificInput: CreateCalculationInput = {
  expression: 'sin(π/2)',
  result: 1,
  operation_type: 'scientific'
};

describe('saveCalculation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a basic calculation', async () => {
    const result = await saveCalculation(basicInput);

    // Basic field validation
    expect(result.expression).toEqual('2 + 3');
    expect(result.result).toEqual(5);
    expect(result.operation_type).toEqual('basic');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save a scientific calculation', async () => {
    const result = await saveCalculation(scientificInput);

    expect(result.expression).toEqual('sin(π/2)');
    expect(result.result).toEqual(1);
    expect(result.operation_type).toEqual('scientific');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist calculation to database', async () => {
    const result = await saveCalculation(basicInput);

    // Query using proper drizzle syntax
    const calculations = await db.select()
      .from(calculationsTable)
      .where(eq(calculationsTable.id, result.id))
      .execute();

    expect(calculations).toHaveLength(1);
    expect(calculations[0].expression).toEqual('2 + 3');
    expect(calculations[0].result).toEqual(5);
    expect(calculations[0].operation_type).toEqual('basic');
    expect(calculations[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle floating point results correctly', async () => {
    const floatInput: CreateCalculationInput = {
      expression: '22 / 7',
      result: 3.142857, // Use value with precision that real type can handle
      operation_type: 'basic'
    };

    const result = await saveCalculation(floatInput);

    // Check that result is close to expected value (within real precision)
    expect(Math.abs(result.result - 3.142857)).toBeLessThan(0.000001);
    expect(typeof result.result).toEqual('number');

    // Verify in database
    const calculations = await db.select()
      .from(calculationsTable)
      .where(eq(calculationsTable.id, result.id))
      .execute();

    expect(Math.abs(calculations[0].result - 3.142857)).toBeLessThan(0.000001);
    expect(typeof calculations[0].result).toEqual('number');
  });

  it('should auto-generate timestamps', async () => {
    const beforeSave = new Date();
    const result = await saveCalculation(basicInput);
    const afterSave = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeSave).toBe(true);
    expect(result.created_at <= afterSave).toBe(true);
  });
});
