// 데모 리셋, AI 상태, health
import { Router } from 'express';
import { bus } from '../live/bus.js';
import * as db from '../store/db.js';
import { status } from '../ai/llm.js';
import { fixtureOrigins } from '../ai/fixtures.js';
import { teacherOnly } from './common.js';

export const demo = Router();

demo.get('/health', (_req, res) => res.json({ ok: true, at: new Date().toISOString() }));

demo.get('/api/ai/status', (_req, res) => res.json({ ...status, fixtureOrigins: fixtureOrigins() }));

demo.post('/api/demo/reset', teacherOnly, (_req, res) => {
  db.resetFromSeed();
  bus.clear();
  bus.emit({ type: 'reset', at: new Date().toISOString() });
  res.json({ ok: true });
});
