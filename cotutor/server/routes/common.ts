// 라우트 공용: 교사 키 확인, 공개 POST 속도 제한, 세션 코드
import type { NextFunction, Request, Response } from 'express';

const TEACHER_KEY = process.env.TEACHER_KEY ?? '';

/** TEACHER_KEY가 있으면 헤더(x-teacher-key) 또는 ?k= 가 맞아야 한다. 없으면(로컬 개발) 열어 둔다 */
export function teacherOnly(req: Request, res: Response, next: NextFunction) {
  if (!TEACHER_KEY) return next();
  const k = req.header('x-teacher-key') ?? (typeof req.query.k === 'string' ? req.query.k : '');
  if (k === TEACHER_KEY) return next();
  res.status(401).json({ error: '교사 키가 필요해요' });
}

const hits = new Map<string, number[]>();
/** IP당 분당 limit회 */
export function rateLimit(limit = 20) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    if (list.length >= limit) return void res.status(429).json({ error: '잠시 뒤에 다시 보내 주세요' });
    list.push(now);
    hits.set(ip, list);
    next();
  };
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // I, O 제외
export function newSessionCode(taken: (c: string) => boolean, rand = Math.random): string {
  for (let i = 0; i < 1000; i++) {
    const c = Array.from({ length: 4 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('');
    if (!taken(c)) return c;
  }
  throw new Error('수업 코드를 만들 수 없어요');
}
export const SESSION_CODE_RE = /^[A-HJ-NP-Z]{4}$/;

export const bad = (res: Response, msg: string, code = 400) => res.status(code).json({ error: msg });
