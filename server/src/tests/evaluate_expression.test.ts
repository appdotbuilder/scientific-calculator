
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type EvaluateExpressionInput } from '../schema';
import { evaluateExpression } from '../handlers/evaluate_expression';

describe('evaluateExpression', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should evaluate basic arithmetic expressions', async () => {
    const input: EvaluateExpressionInput = {
      expression: '2 + 3 * 4'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('2 + 3 * 4');
    expect(result.result).toEqual(14);
    expect(result.operation_type).toEqual('basic');
  });

  it('should handle parentheses correctly', async () => {
    const input: EvaluateExpressionInput = {
      expression: '(2 + 3) * 4'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('(2 + 3) * 4');
    expect(result.result).toEqual(20);
    expect(result.operation_type).toEqual('basic');
  });

  it('should evaluate decimal numbers', async () => {
    const input: EvaluateExpressionInput = {
      expression: '3.14 * 2'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('3.14 * 2');
    expect(result.result).toEqual(6.28);
    expect(result.operation_type).toEqual('basic');
  });

  it('should evaluate scientific functions', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'sin(0)'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('sin(0)');
    expect(result.result).toEqual(0);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should handle pi constant', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'pi * 2'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('pi * 2');
    expect(result.result).toBeCloseTo(Math.PI * 2, 10);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should handle e constant', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'e * 2'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('e * 2');
    expect(result.result).toBeCloseTo(Math.E * 2, 10);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should evaluate sqrt function', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'sqrt(16)'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('sqrt(16)');
    expect(result.result).toEqual(4);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should evaluate factorial function', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'factorial(5)'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('factorial(5)');
    expect(result.result).toEqual(120);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should handle logarithmic functions', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'ln(1)'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('ln(1)');
    expect(result.result).toEqual(0);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should handle complex scientific expressions', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'sin(pi/2) + cos(0)'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('sin(pi/2) + cos(0)');
    expect(result.result).toBeCloseTo(2, 10);
    expect(result.operation_type).toEqual('scientific');
  });

  it('should trim whitespace from expression', async () => {
    const input: EvaluateExpressionInput = {
      expression: '  2 + 3  '
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('2 + 3');
    expect(result.result).toEqual(5);
    expect(result.operation_type).toEqual('basic');
  });

  it('should throw error for empty expression', async () => {
    const input: EvaluateExpressionInput = {
      expression: '   '
    };

    await expect(evaluateExpression(input)).rejects.toThrow(/expression cannot be empty/i);
  });

  it('should throw error for invalid characters', async () => {
    const input: EvaluateExpressionInput = {
      expression: '2 + alert("test")'
    };

    await expect(evaluateExpression(input)).rejects.toThrow(/invalid characters/i);
  });

  it('should handle division by zero as infinity', async () => {
    const input: EvaluateExpressionInput = {
      expression: '5 / 0'
    };

    const result = await evaluateExpression(input);

    expect(result.expression).toEqual('5 / 0');
    expect(result.result).toEqual(Infinity);
    expect(result.operation_type).toEqual('basic');
  });

  it('should throw error for factorial of negative number', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'factorial(-1)'
    };

    await expect(evaluateExpression(input)).rejects.toThrow(/factorial only supported/i);
  });

  it('should throw error for factorial of large number', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'factorial(200)'
    };

    await expect(evaluateExpression(input)).rejects.toThrow(/factorial only supported/i);
  });

  it('should throw error for invalid mathematical operations', async () => {
    const input: EvaluateExpressionInput = {
      expression: 'sqrt(-1)'
    };

    await expect(evaluateExpression(input)).rejects.toThrow(/mathematical evaluation failed/i);
  });
});
