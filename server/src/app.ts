import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { summaryRouter } from './routes/summary.js';
import { tasksRouter } from './routes/tasks.js';
import { appointmentsRouter } from './routes/appointments.js';
import { caregiversRouter } from './routes/caregivers.js';
import { activityRouter } from './routes/activity.js';
import { assistantRouter } from './routes/assistant.js';
import { proactiveRouter } from './routes/proactive.js';
import { mcpRouter } from './mcp/server.js';
import { errorHandler } from './middleware/error-handler.js';
import { initializeDatabase } from './db/connection.js';
import { seedDatabaseIfEmpty } from './db/seed.js';

// Initialize database and baseline seed if brand-new persistent disk
initializeDatabase();
seedDatabaseIfEmpty();

const app = express();

// Parse and normalize allowed origins
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrl
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// CORS configuration supporting production domains, preview branches and local development
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, health checks)
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/+$/, '');
    if (
      allowedOrigins.includes(normalized) ||
      normalized.endsWith('.vercel.app') ||
      normalized.includes('localhost') ||
      normalized.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());

// Routes — dual mounting /health and /api/health for flexible cloud health checkers
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/caregivers', caregiversRouter);
app.use('/api/activity', activityRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/proactive', proactiveRouter);
app.use('/mcp', mcpRouter);

// Global error handler
app.use(errorHandler);

export { app };
