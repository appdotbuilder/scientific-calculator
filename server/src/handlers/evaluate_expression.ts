
import { type EvaluateExpressionInput, type EvaluationResult } from '../schema';

// Safe mathematical expression evaluator
class MathEvaluator {
  private static readonly SCIENTIFIC_FUNCTIONS = ['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sqrt', 'factorial', 'pi', 'e'];
  
  static evaluate(expression: string): { result: number; isScientific: boolean } {
    // Clean and validate expression
    const cleanExpression = expression.trim().toLowerCase();
    
    // Check for scientific functions
    const isScientific = this.SCIENTIFIC_FUNCTIONS.some(func => 
      cleanExpression.includes(func)
    );
    
    // Validate characters - only allow safe mathematical characters
    const allowedPattern = /^[0-9+\-*/().\s,sincotagexpqrtfactopialne!]+$/i;
    if (!allowedPattern.test(cleanExpression)) {
      throw new Error('Invalid characters in expression');
    }
    
    // Handle factorial function first (before other replacements)
    let processedExpression = this.handleFactorial(cleanExpression);
    
    // Replace constants first
    processedExpression = processedExpression
      .replace(/\bpi\b/g, Math.PI.toString())
      .replace(/\be\b/g, Math.E.toString());
    
    // Use placeholders to avoid conflicts
    processedExpression = processedExpression
      .replace(/\bln\s*\(/g, '__LN__(')
      .replace(/\blog\s*\(/g, '__LOG10__(')
      .replace(/\bsin\s*\(/g, '__SIN__(')
      .replace(/\bcos\s*\(/g, '__COS__(')
      .replace(/\btan\s*\(/g, '__TAN__(')
      .replace(/\bexp\s*\(/g, '__EXP__(')
      .replace(/\bsqrt\s*\(/g, '__SQRT__(');
    
    // Now replace placeholders with Math functions
    processedExpression = processedExpression
      .replace(/__LN__/g, 'Math.log')
      .replace(/__LOG10__/g, 'Math.log10')
      .replace(/__SIN__/g, 'Math.sin')
      .replace(/__COS__/g, 'Math.cos')
      .replace(/__TAN__/g, 'Math.tan')
      .replace(/__EXP__/g, 'Math.exp')
      .replace(/__SQRT__/g, 'Math.sqrt');
    
    try {
      // Use Function constructor for safe evaluation
      const result = new Function('Math', `"use strict"; return (${processedExpression})`)(Math);
      
      if (typeof result !== 'number') {
        throw new Error('Invalid mathematical result');
      }
      
      // Allow Infinity but not NaN
      if (isNaN(result)) {
        throw new Error('Invalid mathematical result');
      }
      
      return { result, isScientific };
    } catch (error) {
      throw new Error(`Mathematical evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private static handleFactorial(expression: string): string {
    let result = expression;
    
    // Handle factorial(n) syntax
    result = result.replace(/factorial\(([^)]+)\)/g, (match, num) => {
      const n = parseFloat(num.trim());
      if (isNaN(n) || n < 0 || !Number.isInteger(n) || n > 170) {
        throw new Error('Factorial only supported for non-negative integers up to 170');
      }
      return this.factorial(n).toString();
    });
    
    // Handle n! syntax for simple numbers
    result = result.replace(/(\d+)!/g, (match, num) => {
      const n = parseFloat(num);
      if (n < 0 || !Number.isInteger(n) || n > 170) {
        throw new Error('Factorial only supported for non-negative integers up to 170');
      }
      return this.factorial(n).toString();
    });
    
    return result;
  }
  
  private static factorial(n: number): number {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
}

export async function evaluateExpression(input: EvaluateExpressionInput): Promise<EvaluationResult> {
  const { expression } = input;
  
  try {
    // Validate expression is not empty or just whitespace
    if (!expression.trim()) {
      throw new Error('Expression cannot be empty');
    }
    
    // Evaluate the expression
    const { result, isScientific } = MathEvaluator.evaluate(expression);
    
    return {
      expression: expression.trim(),
      result,
      operation_type: isScientific ? 'scientific' : 'basic'
    };
  } catch (error) {
    console.error('Expression evaluation failed:', error);
    throw error;
  }
}
