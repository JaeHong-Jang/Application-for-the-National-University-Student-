// R10(성취기준 코드), 학년쌍 판정, 코드 정규화, 수업유형 추천. 순수 함수.
import type { LessonType, Method, PairType, Violation } from '../contracts.js';
import { STD_CODE_RE } from '../contracts.js';

export const band = (g: number) => (g <= 2 ? 2 : g <= 4 ? 4 : 6);

export function pairType(a: number, b: number): PairType {
  if (band(a) === band(b)) return 'SAME_BAND';
  if (Math.abs(a - b) === 1) return 'CROSS_BAND';
  return 'NON_ADJACENT';
}

export const PAIR_LABEL: Record<PairType, string> = {
  SAME_BAND: '같은 학년군',
  CROSS_BAND: '학년군 걸침',
  NON_ADJACENT: '격리 학년',
};

/** '[4사01–02]', ' 4사01-02 ' → '4사01-02'. 형식이 아니면 null */
export function normalizeCode(s: string): string | null {
  const c = s.replace(/[[\]\s]/g, '').replace(/[–—‐]/g, '-');
  return STD_CODE_RE.test(c) ? c : null;
}

export const showCode = (c: string) => `[${c}]`;
export const codeBand = (c: string) => Number(c[0]);

const CORE = ['국어', '수학', '사회', '과학', '영어'];

/** 충북 매뉴얼 요약(W3 §3.1) 기반 추천표 */
export function recommend(subject: string, pt: PairType): { lessonType: LessonType; method: Method; alternatives: LessonType[] } {
  if (!CORE.includes(subject)) return { lessonType: '단일교과단일활동통합', method: '부분통합', alternatives: [] };
  if (pt === 'SAME_BAND') return { lessonType: '단일교과복수활동', method: '부분통합', alternatives: ['단일교과단일활동수준별'] };
  return { lessonType: '단일교과복수활동', method: '부분통합', alternatives: ['복수교과병행'] };
}

export type CodeLookup = (code: string) => { band: number } | undefined;

/** R10: 인용 코드가 인덱스에 있고, 그 레인 학년의 학년군과 맞는지 */
export function checkCodes(
  refs: { code: string; lane: 'A' | 'B' | 'ALL'; blockId?: string; where: string }[],
  gradeA: number,
  gradeB: number,
  lookup: CodeLookup,
): Violation[] {
  const out: Violation[] = [];
  const gradeOf = (lane: 'A' | 'B') => (lane === 'A' ? gradeA : gradeB);
  for (const r of refs) {
    const norm = normalizeCode(r.code);
    const entry = norm ? lookup(norm) : undefined;
    const ids = r.blockId ? [r.blockId] : [];
    if (!norm || !entry) {
      out.push({ rule: 'R10', severity: 'error', blockIds: ids, range: null, message: `${r.where}의 성취기준 ${showCode(r.code)}은 교육과정에 없는 코드입니다.` });
      continue;
    }
    const lanes: ('A' | 'B')[] = r.lane === 'ALL' ? ['A', 'B'] : [r.lane];
    const ok = lanes.some((l) => band(gradeOf(l)) === entry.band);
    if (!ok) {
      const g = lanes.map(gradeOf).join('·');
      out.push({ rule: 'R10', severity: 'error', blockIds: ids, range: null, message: `${r.where}의 ${showCode(norm)}은 ${g}학년 학년군에 맞지 않습니다.` });
    }
  }
  return out;
}
