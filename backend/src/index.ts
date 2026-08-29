import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { subjectsRouter } from './routes/subjects.js';
import { modulesRouter } from './routes/modules.js';
import { progressRouter } from './routes/progress.js';
import { authRouter } from './routes/auth.js';
import { reportsRouter } from './routes/reports.js';
import { uploadsRouter } from './routes/uploads.js';
import { UPLOADS_DIR } from './lib/upload.js';
import { plansRouter } from './routes/plans.js';
import { subscriptionRouter } from './routes/subscription.js';
import { webhooksRouter } from './routes/webhooks.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Uploaded PDFs/images are served directly as static files — <img>, <a>,
// and <iframe> tags can load these cross-origin without any CORS setup
// (CORS only applies to script-driven fetch()/XHR requests).
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/plans', plansRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/webhooks', webhooksRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// Centralized error handler — every route's async work is wrapped in
// try/catch + next(err), so all failures funnel through here.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origins: ${CORS_ORIGIN.join(', ')}`);
});
