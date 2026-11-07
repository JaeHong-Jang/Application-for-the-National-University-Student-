// Express 서버: API + 빌드된 프론트를 같은 오리진에서 정적 서빙
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR } from './paths.js';
import { healthCheck, status } from './ai/llm.js';
import { clusters } from './routes/clusters.js';
import { demo } from './routes/demo.js';
import { lessons } from './routes/lessons.js';
import { sessions } from './routes/sessions.js';
import * as db from './store/db.js';

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '200kb' }));
app.use(demo, lessons, sessions, clusters);

app.use('/api', (_req, res) => res.status(404).json({ error: '없는 API입니다' }));

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: 'index.html' }));
  app.get('/s', (_req, res) => res.redirect('/s/'));
  // 교사 앱 경로(/, /design, /timeline, /live, /next, /standards, /principles)는 index.html
  app.get(['/design', '/timeline', '/live', '/next', '/standards', '/principles'], (_req, res) => res.sendFile(join(DIST_DIR, 'index.html')));
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server]', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = Number(process.env.PORT ?? 8787);
db.get();
app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}  AI_MODE=${status.mode} provider=${status.provider} lesson=${status.models.lesson} cluster=${status.models.cluster}`);
  void healthCheck().then(() => console.log(`[server] AI health: reachable=${status.reachable} ${status.lastError ?? ''}`));
});
