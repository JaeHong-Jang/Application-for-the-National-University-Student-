// 군집(AI로 묶기, 라벨 수정, 질문 옮기기)과 다음 차시 카드(생성·편집·승인·반려)
import { Router } from 'express';
import { z } from 'zod';
import { IndirectCard } from '../../shared/contracts.js';
import { findPII } from '../../shared/check/pii.js';
import { clusterResponses } from '../ai/pipeline/cluster.js';
import { generateNextCards } from '../ai/pipeline/nextCards.js';
import * as db from '../store/db.js';
import { bad, teacherOnly } from './common.js';

export const clusters = Router();
clusters.use(['/api/clusters', '/api/cards', '/api/responses'], teacherOnly);

clusters.get('/api/sessions/:code/clusters', teacherOnly, (req, res) => {
  const d = db.get();
  const code = String(req.params.code);
  res.json({ clusters: d.clusters.filter((c) => c.sessionCode === code), run: d.clusterRuns.find((r) => r.sessionCode === code) ?? null });
});

clusters.post('/api/sessions/:code/cluster', teacherOnly, async (req, res) => {
  const code = String(req.params.code);
  const s = db.session(code);
  const d = db.get();
  const lesson = s ? d.lessons.find((l) => l.id === s.lessonId) : undefined;
  if (!s || !lesson) return bad(res, '수업이 없어요', 404);
  const responses = db.responsesOf(code);
  if (!responses.length) return bad(res, '아직 질문이 없어요');
  const { clusters: cs, run } = await clusterResponses(code, lesson, responses);
  d.clusters = [...d.clusters.filter((c) => c.sessionCode !== code), ...cs];
  d.clusterRuns = [...d.clusterRuns.filter((r) => r.sessionCode !== code), run];
  db.save();
  res.json({ clusters: cs, run });
});

clusters.put('/api/clusters/:id', (req, res) => {
  const c = db.get().clusters.find((x) => x.id === req.params.id);
  const label = String(req.body?.label ?? '').trim().slice(0, 120);
  if (!c || !label) return bad(res, '묶음이나 주제가 없어요');
  c.label = label;
  c.teacherEdited = true;
  db.save();
  res.json(c);
});

/** 질문을 다른 군집으로(null이면 미분류로) 옮긴다 */
clusters.post('/api/responses/:id/move', (req, res) => {
  const d = db.get();
  const r = d.responses.find((x) => x.id === req.params.id);
  if (!r) return bad(res, '질문이 없어요', 404);
  const target = req.body?.clusterId ? d.clusters.find((c) => c.id === req.body.clusterId) : null;
  for (const c of d.clusters.filter((x) => x.sessionCode === r.sessionCode)) {
    if (c.questionIds.includes(r.id)) {
      c.questionIds = c.questionIds.filter((x) => x !== r.id);
      if (c.representativeId === r.id) c.representativeId = c.questionIds[0] ?? '';
      c.teacherEdited = true;
    }
  }
  const run = d.clusterRuns.find((x) => x.sessionCode === r.sessionCode);
  if (run) run.unclustered = run.unclustered.filter((x) => x !== r.id);
  if (target) {
    target.questionIds.push(r.id);
    if (!target.representativeId) target.representativeId = r.id;
    target.teacherEdited = true;
  } else run?.unclustered.push(r.id);
  d.clusters = d.clusters.filter((c) => c.questionIds.length);
  db.save();
  res.json({ ok: true });
});

// ---------- 다음 차시 카드 ----------
clusters.get('/api/cards', (_req, res) => {
  const d = db.get();
  const lesson = db.currentLesson();
  res.json({ cards: d.cards.filter((c) => c.lessonId === lesson?.id), run: d.cardRuns.find((r) => r.lessonId === lesson?.id) ?? null });
});

clusters.post('/api/cards/generate', async (req, res) => {
  const d = db.get();
  const code = String(req.body?.sessionCode ?? d.currentSessionCode ?? '');
  const s = db.session(code);
  const lesson = s ? d.lessons.find((l) => l.id === s.lessonId) : undefined;
  if (!s || !lesson) return bad(res, '수업이 없어요', 404);
  const cs = d.clusters.filter((c) => c.sessionCode === code);
  if (!cs.length) return bad(res, '먼저 질문함에서 AI로 묶기를 하세요');
  const out = await generateNextCards(lesson, cs, db.responsesOf(code));
  d.cards = [...d.cards.filter((c) => c.lessonId !== lesson.id), ...out.cards];
  d.cardRuns = [...d.cardRuns.filter((r) => r.lessonId !== lesson.id), { lessonId: lesson.id, sessionCode: code, source: out.source, at: new Date().toISOString(), removed: out.removed, mode: out.source.mode }];
  d.currentLessonId = lesson.id;
  db.save();
  res.json({ cards: out.cards, run: d.cardRuns.find((r) => r.lessonId === lesson.id) });
});

const CardPatch = z.object({ title: z.string().max(100).optional(), teacherNote: z.string().max(500).optional(), card: IndirectCard.optional(), minutes: z.number().int().min(3).max(20).optional() });

clusters.put('/api/cards/:id', (req, res) => {
  const c = db.get().cards.find((x) => x.id === req.params.id);
  const p = CardPatch.safeParse(req.body);
  if (!c || !p.success) return bad(res, '카드 편집 내용을 확인해 주세요');
  const next = { ...c, ...p.data, status: 'draft' as const };
  const text = [next.title, ...next.card.steps, next.card.doneSignal, next.card.ifStuck, next.card.output, next.card.guideRole].join(' ');
  if (findPII(text).length) return bad(res, '카드에 개인정보로 보이는 내용이 있어요(R12)');
  Object.assign(c, next);
  db.save();
  res.json(c);
});

clusters.post('/api/cards/:id/:action', (req, res) => {
  const c = db.get().cards.find((x) => x.id === req.params.id);
  const action = String(req.params.action);
  if (!c || !['approve', 'reject'].includes(action)) return bad(res, '카드가 없어요', 404);
  if (action === 'approve' && (c.card.steps.length < 2 || c.card.steps.length > 5)) return bad(res, '단계는 2~5개여야 승인할 수 있어요(R4)');
  c.status = action === 'approve' ? 'approved' : 'rejected';
  db.save();
  res.json(c);
});

