
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, History, Calculator } from 'lucide-react';
import type { Calculation } from '../../server/src/schema';

function App() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<Calculation[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const result = await trpc.getHistory.query({ limit: 50, offset: 0 });
      setHistory(result);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  // Scientific functions
  const scientificOperation = async (func: string) => {
    let expression = '';

    switch (func) {
      case 'sin':
        expression = `sin(${display})`;
        break;
      case 'cos':
        expression = `cos(${display})`;
        break;
      case 'tan':
        expression = `tan(${display})`;
        break;
      case 'log':
        expression = `log(${display})`;
        break;
      case 'ln':
        expression = `ln(${display})`;
        break;
      case 'exp':
        expression = `exp(${display})`;
        break;
      case 'sqrt':
        expression = `sqrt(${display})`;
        break;
      case 'factorial':
        expression = `factorial(${display})`;
        break;
      case 'pi':
        expression = 'pi';
        setDisplay('3.14159265359');
        return;
      case 'e':
        expression = 'e';
        setDisplay('2.71828182846');
        return;
      case 'x²':
        expression = `${display}^2`;
        break;
      case '1/x':
        expression = `1/${display}`;
        break;
      default:
        return;
    }

    await evaluateExpression(expression);
  };

  const performOperation = (nextOperation: string) => {
    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operation) {
      // Store for later evaluation
      setPreviousValue(display);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = async () => {
    if (operation && previousValue !== null) {
      const expression = `${previousValue} ${operation} ${display}`;
      await evaluateExpression(expression);
      
      setOperation(null);
      setPreviousValue(null);
      setWaitingForOperand(true);
    }
  };

  const evaluateExpression = async (expression: string) => {
    setIsEvaluating(true);
    try {
      // First evaluate the expression
      const evaluation = await trpc.evaluate.mutate({ expression });
      
      // Then save it to history
      await trpc.saveCalculation.mutate({
        expression: evaluation.expression,
        result: evaluation.result,
        operation_type: evaluation.operation_type
      });

      setDisplay(evaluation.result.toString());
      
      // Refresh history
      await loadHistory();
    } catch (error) {
      console.error('Calculation error:', error);
      setDisplay('Error');
    } finally {
      setIsEvaluating(false);
    }
  };

  const clearHistory = async () => {
    setIsClearing(true);
    try {
      await trpc.clearHistory.mutate();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const CalculatorButton = ({ 
    onClick, 
    children, 
    className = "", 
    variant = "outline",
    disabled = false 
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    disabled?: boolean;
  }) => (
    <Button
      onClick={onClick}
      variant={variant}
      className={`h-12 text-lg font-semibold transition-all hover:scale-105 ${className}`}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Calculator className="text-blue-600" />
            Scientific Calculator
          </h1>
          <p className="text-gray-600">Advanced mathematical calculations with history tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {/* Display */}
                <div className="mb-6 p-6 bg-gray-900 rounded-lg text-right">
                  <div className="text-4xl font-mono text-white break-all">
                    {display}
                  </div>
                  {operation && previousValue && (
                    <div className="text-sm text-gray-400 mt-2">
                      {previousValue} {operation}
                    </div>
                  )}
                </div>

                {/* Button Grid */}
                <div className="grid grid-cols-5 gap-3">
                  {/* First Row - Scientific Functions */}
                  <CalculatorButton onClick={() => scientificOperation('sin')} variant="secondary">
                    sin
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('cos')} variant="secondary">
                    cos
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('tan')} variant="secondary">
                    tan
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('log')} variant="secondary">
                    log
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('ln')} variant="secondary">
                    ln
                  </CalculatorButton>

                  {/* Second Row - More Scientific Functions */}
                  <CalculatorButton onClick={() => scientificOperation('exp')} variant="secondary">
                    exp
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('sqrt')} variant="secondary">
                    √
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('x²')} variant="secondary">
                    x²
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('1/x')} variant="secondary">
                    1/x
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('factorial')} variant="secondary">
                    n!
                  </CalculatorButton>

                  {/* Third Row - Constants and Clear */}
                  <CalculatorButton onClick={() => scientificOperation('pi')} variant="secondary">
                    π
                  </CalculatorButton>
                  <CalculatorButton onClick={() => scientificOperation('e')} variant="secondary">
                    e
                  </CalculatorButton>
                  <CalculatorButton onClick={clear} variant="destructive" className="col-span-2">
                    Clear
                  </CalculatorButton>
                  <CalculatorButton onClick={() => performOperation('/')} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    ÷
                  </CalculatorButton>

                  {/* Fourth Row - Numbers and Operations */}
                  <CalculatorButton onClick={() => inputNumber('7')}>7</CalculatorButton>
                  <CalculatorButton onClick={() => inputNumber('8')}>8</CalculatorButton>
                  <CalculatorButton onClick={() => inputNumber('9')}>9</CalculatorButton>
                  <CalculatorButton onClick={() => performOperation('*')} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    ×
                  </CalculatorButton>
                  <CalculatorButton onClick={() => performOperation('-')} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    −
                  </CalculatorButton>

                  {/* Fifth Row */}
                  <CalculatorButton onClick={() => inputNumber('4')}>4</CalculatorButton>
                  <CalculatorButton onClick={() => inputNumber('5')}>5</CalculatorButton>
                  <CalculatorButton onClick={() => inputNumber('6')}>6</CalculatorButton>
                  <CalculatorButton onClick={() => performOperation('+')} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white row-span-2">
                    +
                  </CalculatorButton>
                  <CalculatorButton 
                    onClick={calculate} 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700 text-white row-span-2"
                    disabled={isEvaluating}
                  >
                    {isEvaluating ? '...' : '='}
                  </CalculatorButton>

                  {/* Sixth Row */}
                  <CalculatorButton onClick={() => inputNumber('1')}>1</CalculatorButton>
                  <CalculatorButton onClick={() => inputNumber('2')}>2</CalculatorButton>
                  <CalculatorButton onClick={() => inputNumber('3')}>3</CalculatorButton>

                  {/* Seventh Row */}
                  <CalculatorButton onClick={() => inputNumber('0')} className="col-span-2">
                    0
                  </CalculatorButton>
                  <CalculatorButton onClick={inputDot}>.</CalculatorButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Panel */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Calculation History
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={history.length === 0 || isClearing}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear History</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all calculation history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={clearHistory}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isClearing}
                        >
                          {isClearing ? 'Clearing...' : 'Clear History'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[600px] pr-4">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No calculations yet</p>
                      <p className="text-sm">Start calculating to see history</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((calc: Calculation) => (
                        <div 
                          key={calc.id} 
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                          onClick={() => setDisplay(calc.result.toString())}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm text-gray-700 break-all">
                                {calc.expression}
                              </div>
                              <div className="font-mono text-lg font-semibold text-gray-900">
                                = {calc.result}
                              </div>
                            </div>
                            <Badge 
                              variant={calc.operation_type === 'scientific' ? 'default' : 'secondary'}
                              className="shrink-0 text-xs"
                            >
                              {calc.operation_type === 'scientific' ? '🧮' : '🔢'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {calc.created_at.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            🧮 Advanced scientific calculator with trigonometry, logarithms, and more
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
