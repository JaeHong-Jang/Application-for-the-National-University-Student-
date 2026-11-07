// 세션(4자리 코드)·학생 제출·SSE 스트림
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { PublicSession, Session, StudentResponse } from '../../shared/contracts.js';
import { hasSafetySignal, maskPII } from '../../shared/check/pii.js';
import { bus, matches } from '../live/bus.js';
import * as db from '../store/db.js';
import { sendFakeStudents } from '../demo/fakeStudents.js';
import { bad, newSessionCode, rateLimit, SESSION_CODE_RE, teacherOnly } from './common.js';

export const sessions = Router();

const toPublic = (s: Session): PublicSession => ({ code: s.code, grades: [s.gradeA, s.gradeB], prompt: s.prompt, active: s.active });

// ---------- 공개 ----------
sessions.get('/api/sessions/:code', (req, res) => {
  const s = db.session(String(req.params.code).toUpperCase());
  if (!s) return bad(res, '수업 코드를 찾지 못했어요', 404);
  res.json(toPublic(s));
});

const Submit = z.object({
  grade: z.number().int(),
  text: z.string().trim().min(1).max(200),
  clientId: z.string().min(1).max(64),
  sid: z.string().min(1).max(64).optional(), // 재전송 중복 방지용 제출 id
  kind: z.enum(['question', 'answer']).optional(),
  promptId: z.string().max(64).nullable().optional(),
});

export function submitResponse(code: string, body: z.infer<typeof Submit>): StudentResponse | { error: string } {
  const s = db.session(code);
  if (!s || !s.active) return { error: '진행 중인 수업이 아니에요' };
  if (![s.gradeA, s.gradeB].includes(body.grade)) return { error: '이 수업의 학년이 아니에요' };
  const d = db.get();
  const id = body.sid ? `R-${body.sid.replace(/[^\w-]/g, '').slice(0, 40)}` : `R-${randomUUID().slice(0, 8)}`;
  const dup = d.responses.find((r) => r.id === id);
  if (dup) return dup;
  const masked = maskPII(body.text);
  const r: StudentResponse = {
    id,
    sessionCode: code,
    grade: body.grade,
    kind: body.kind ?? 'question',
    promptId: body.promptId ?? s.prompt?.id ?? null,
    text: masked.text,
    rawText: body.text,
    piiFlags: masked.flags,
    safety: hasSafetySignal(body.text),
    clientId: body.clientId,
    createdAt: new Date().toISOString(),
  };
  d.responses.push(r);
  db.save();
  bus.emit({ type: 'response', response: r });
  if (r.safety) bus.emit({ type: 'safety', responseId: r.id, sessionCode: code, grade: r.grade, at: r.createdAt });
  return r;
}

sessions.post('/api/sessions/:code/responses', rateLimit(20), (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const p = Submit.safeParse(req.body);
  if (!p.success) return bad(res, '글은 1~200자로 써 주세요');
  const r = submitResponse(code, p.data);
  if ('error' in r) return bad(res, r.error, 404);
  // 학생에게는 저장 확인만 돌려준다(AI 출력·마스킹 결과 없음)
  res.json({ ok: true, id: r.id });
});

// ---------- 교사 ----------
sessions.post('/api/sessions', teacherOnly, (_req, res) => {
  const d = db.get();
  const lesson = db.currentLesson();
  if (!lesson) return bad(res, '수업이 없어요');
  d.sessions.forEach((s) => (s.active = false));
  const s: Session = {
    code: newSessionCode((c) => d.sessions.some((x) => x.code === c)),
    lessonId: lesson.id,
    gradeA: lesson.gradeA,
    gradeB: lesson.gradeB,
    prompt: null,
    createdAt: new Date().toISOString(),
    active: true,
  };
  d.sessions.push(s);
  d.currentSessionCode = s.code;
  db.save();
  bus.emit({ type: 'session', session: s });
  res.json(s);
});

sessions.get('/api/sessions-current', teacherOnly, (_req, res) => {
  const d = db.get();
  const s = d.currentSessionCode ? db.session(d.currentSessionCode) : undefined;
  res.json(s ?? null);
});

sessions.post('/api/sessions/:code/prompt', teacherOnly, (req, res) => {
  const s = db.session(String(req.params.code));
  const text = String(req.body?.text ?? '').trim().slice(0, 120);
  if (!s) return bad(res, '수업이 없어요', 404);
  s.prompt = text ? { id: `P-${randomUUID().slice(0, 6)}`, text } : null;
  db.save();
  bus.emit({ type: 'session', session: s });
  res.json(s);
});

sessions.get('/api/sessions/:code/responses', teacherOnly, (req, res) => {
  res.json(db.responsesOf(String(req.params.code)));
});

sessions.post('/api/sessions/:code/fake-students', teacherOnly, (req, res) => {
  const code = String(req.params.code);
  const s = db.session(code);
  if (!s) return bad(res, '수업이 없어요', 404);
  const fast = req.query.fast === '1';
  const started = sendFakeStudents(
    code,
    (q, clientId) => void submitResponse(code, { grade: q.lane === 'A' ? s.gradeA : s.gradeB, text: q.text, clientId, sid: `${clientId}-${Date.now()}` }),
    fast ? { minMs: 50, maxMs: 120 } : {},
  );
  res.json({ started });
});

// ---------- SSE ----------
sessions.get('/api/stream', teacherOnly, (req, res) => {
  const session = typeof req.query.session === 'string' && SESSION_CODE_RE.test(req.query.session) ? req.query.session : undefined;
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  // 보낼 기록이 없어도 바로 한 줄 보낸다(프록시가 첫 ping까지 붙잡지 않게)
  res.write(': connected\n\n');
  const send = (e: unknown) => res.write(`data: ${JSON.stringify(e)}\n\n`);
  bus.replay(session).forEach(send);
  const off = bus.subscribe((e) => matches(e, session) && send(e));
  const ping = setInterval(() => res.write('event: ping\ndata: \n\n'), 5000);
  req.on('close', () => {
    off();
    clearInterval(ping);
  });
});
