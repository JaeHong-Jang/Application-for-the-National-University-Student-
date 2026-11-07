// 수업: 생성(파이프라인), 편집(diff 저장), 승인(error 0일 때만), 단일 블록 카드
import { Router } from 'express';
import { z } from 'zod';
import { Lesson, TimelineBlock, type LessonInput } from '../../shared/contracts.js';
import { checkLesson, errorsOf } from '../../shared/check/timeline.js';
import { fillOneCard, generateLesson } from '../ai/pipeline/lesson.js';
import { bus } from '../live/bus.js';
import * as db from '../store/db.js';
import { lookup, standardsFor, getStandard, SUBJECTS } from '../standards.js';
import { units, unitLabel } from '../units.js';
import { bad, teacherOnly } from './common.js';
import { CHECK_DEFAULTS, CHECK_DEFAULTS_NOTE } from '../../shared/check/config.js';

export const lessons = Router();
lessons.use('/api/lessons', teacherOnly);

lessons.get('/api/meta', teacherOnly, (_req, res) => {
  res.json({
    subjects: SUBJECTS,
    units: units.map((u) => ({ grade: u.grade, subject: u.subject, label: unitLabel(u), codes: u.codes, note: u.note })),
    checkDefaults: CHECK_DEFAULTS,
    checkDefaultsNote: CHECK_DEFAULTS_NOTE,
    publicBaseUrl: process.env.PUBLIC_BASE_URL || null,
  });
});

/** 수업과 함께, 화면의 R10 검사·툴팁에 쓸 성취기준(교과 × 학년군) */
function withStandards(l: Lesson) {
  const codes = new Set([...l.standards.map((s) => s.code), ...l.blocks.flatMap((b) => b.standardCodes), ...l.assessment.map((a) => a.code)]);
  const pool = standardsFor(l.subject, l.gradeA, l.gradeB);
  const extra = [...codes].map((c) => getStandard(c)).filter((s) => s && !pool.includes(s));
  return { lesson: l, standards: [...pool, ...extra] };
}

lessons.get('/api/lessons/current', (_req, res) => {
  const l = db.currentLesson();
  res.json(l ? withStandards(l) : null);
});

const Input = z.object({
  gradeA: z.number().int().min(1).max(6),
  gradeB: z.number().int().min(1).max(6),
  subject: z.string().min(1),
  units: z.object({ A: z.string().nullable(), B: z.string().nullable() }),
  durationMin: z.number().int().min(30).max(80),
  hasAssistant: z.boolean(),
  runId: z.string().max(64).optional(),
});

lessons.post('/api/lessons/generate', async (req, res) => {
  const p = Input.safeParse(req.body);
  if (!p.success) return bad(res, '입력을 확인해 주세요');
  if (p.data.gradeA === p.data.gradeB) return bad(res, '서로 다른 두 학년을 고르세요');
  const runId = p.data.runId ?? 'run';
  const emit = (step: string, status: 'running' | 'done' | 'error', detail: string) => bus.emit({ type: 'pipeline.step', runId, step, status, detail, at: new Date().toISOString() });
  const input: LessonInput = p.data;
  const prev = db.currentLesson();
  const lesson = await generateLesson(input, emit);
  lesson.previousLessonId = prev?.id ?? null;
  const d = db.get();
  d.lessons.push(lesson);
  d.currentLessonId = lesson.id;
  db.save();
  res.json(withStandards(lesson));
});

const Patch = z.object({
  commonTheme: z.string().max(200).optional(),
  blocks: z.array(TimelineBlock).optional(),
  activity: z.object({ blockId: z.string(), text: z.string().max(300) }).optional(),
});

const FIELDS = ['startMin', 'endMin', 'mode', 'activity', 'noise', 'card', 'materials', 'standardCodes'] as const;

lessons.put('/api/lessons/:id', (req, res) => {
  const l = db.get().lessons.find((x) => x.id === req.params.id);
  if (!l) return bad(res, '수업이 없어요', 404);
  const p = Patch.safeParse(req.body);
  if (!p.success) return bad(res, '편집 내용을 확인해 주세요');
  const at = new Date().toISOString();
  const before = JSON.stringify(l);
  if (p.data.commonTheme !== undefined && p.data.commonTheme !== l.commonTheme) {
    l.edits.push({ path: 'commonTheme', before: l.commonTheme, after: p.data.commonTheme, at });
    l.commonTheme = p.data.commonTheme;
  }
  if (p.data.activity) {
    const b = l.blocks.find((x) => x.id === p.data.activity!.blockId);
    if (b && b.activity !== p.data.activity.text) {
      l.edits.push({ path: `blocks.${b.id}.activity`, before: b.activity, after: p.data.activity.text, at });
      b.activity = p.data.activity.text;
    }
  }
  if (p.data.blocks) {
    for (const nb of p.data.blocks) {
      const ob = l.blocks.find((x) => x.id === nb.id);
      if (!ob) continue;
      for (const f of FIELDS) if (JSON.stringify(ob[f]) !== JSON.stringify(nb[f])) l.edits.push({ path: `blocks.${nb.id}.${f}`, before: ob[f], after: nb[f], at });
    }
    l.blocks = p.data.blocks;
  }
  // 승인 뒤에 고치면 다시 초안
  if (JSON.stringify(l) !== before) l.status = 'draft';
  db.save();
  res.json(withStandards(l));
});

lessons.post('/api/lessons/:id/approve', (req, res) => {
  const l = db.get().lessons.find((x) => x.id === req.params.id);
  if (!l) return bad(res, '수업이 없어요', 404);
  const errs = errorsOf(checkLesson(l, { lookup }));
  if (errs.length) return res.status(409).json({ error: `고칠 곳 ${errs.length}곳이 남아 승인할 수 없어요`, violations: errs });
  l.status = 'approved';
  l.edits.push({ path: 'status', before: 'draft', after: 'approved', at: new Date().toISOString() });
  db.save();
  res.json(withStandards(l));
});

lessons.post('/api/lessons/:id/blocks/:blockId/card', async (req, res) => {
  const l = db.get().lessons.find((x) => x.id === req.params.id);
  if (!l) return bad(res, '수업이 없어요', 404);
  const r = await fillOneCard(l, String(req.params.blockId));
  res.json({ card: r.out.card, source: r.source });
});
