
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  evaluateExpressionInputSchema, 
  createCalculationInputSchema,
  getHistoryInputSchema
} from './schema';

// Import handlers
import { evaluateExpression } from './handlers/evaluate_expression';
import { saveCalculation } from './handlers/save_calculation';
import { getCalculationHistory } from './handlers/get_calculation_history';
import { clearHistory } from './handlers/clear_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Evaluate mathematical expression
  evaluate: publicProcedure
    .input(evaluateExpressionInputSchema)
    .mutation(({ input }) => evaluateExpression(input)),
  
  // Save calculation to history
  saveCalculation: publicProcedure
    .input(createCalculationInputSchema)
    .mutation(({ input }) => saveCalculation(input)),
  
  // Get calculation history with pagination
  getHistory: publicProcedure
    .input(getHistoryInputSchema)
    .query(({ input }) => getCalculationHistory(input)),
  
  // Clear all calculation history
  clearHistory: publicProcedure
    .mutation(() => clearHistory()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Scientific Calculator TRPC server listening at port: ${port}`);
}

start();
