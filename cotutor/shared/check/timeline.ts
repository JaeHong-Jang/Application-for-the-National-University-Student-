// 타임라인 검사 R1~R12. 클라이언트·서버가 같이 쓰는 순수 함수. 메시지는 한국어 한 문장.
import type { Lesson, TimelineBlock, Violation } from '../contracts.js';
import { CHECK_DEFAULTS, type CheckConfig } from './config.js';
import { checkCodes, type CodeLookup } from './standards.js';
import { findPII } from './pii.js';

export type CheckInput = Pick<Lesson, 'gradeA' | 'gradeB' | 'durationMin' | 'blocks' | 'segments'> &
  Partial<Pick<Lesson, 'standards' | 'assessment' | 'commonTheme'>>;

export interface CheckOptions {
  lookup?: CodeLookup; // 없으면 R10을 건너뛴다
  config?: Partial<CheckConfig>;
}

type L = 'A' | 'B';
const LANES: L[] = ['A', 'B'];
const covers = (b: TimelineBlock, l: L) => b.lane === l || b.lane === 'ALL';
const len = (b: TimelineBlock) => b.endMin - b.startMin;
const MODE_KO = { JOINT: '통합', DIRECT: '직접지도', INDIRECT: '간접지도' } as const;

/** 분 단위 불리언 배열에서 연속 구간 [start, end) 목록 */
function runs(flags: boolean[]): [number, number][] {
  const out: [number, number][] = [];
  let s = -1;
  flags.forEach((f, i) => {
    if (f && s < 0) s = i;
    if (!f && s >= 0) (out.push([s, i]), (s = -1));
  });
  if (s >= 0) out.push([s, flags.length]);
  return out;
}

/** 매 분 교사 초점: 'ALL' | 'A' | 'B' | null(둘 다 간접) */
export function teacherFocus(input: CheckInput): ('ALL' | L | null)[] {
  const D = input.durationMin;
  const focus: ('ALL' | L | null)[] = Array(D).fill(null);
  for (let m = 0; m < D; m++) {
    const here = input.blocks.filter((b) => b.startMin <= m && m < b.endMin);
    if (here.some((b) => b.mode === 'JOINT')) focus[m] = 'ALL';
    else {
      const d = here.find((b) => b.mode === 'DIRECT' && b.lane !== 'ALL');
      focus[m] = d ? (d.lane as L) : null;
    }
  }
  return focus;
}

export function countTransitions(input: CheckInput): number {
  const f = teacherFocus(input);
  let n = 0;
  for (let i = 1; i < f.length; i++) if (f[i] !== f[i - 1]) n++;
  return n;
}

export function directMinutes(input: CheckInput): Record<L, number> {
  const r = { A: 0, B: 0 };
  for (const b of input.blocks) if (b.mode === 'DIRECT' && b.lane !== 'ALL') r[b.lane as L] += len(b);
  return r;
}

export function checkLesson(input: CheckInput, opts: CheckOptions = {}): Violation[] {
  const cfg = { ...CHECK_DEFAULTS, ...opts.config };
  const D = input.durationMin;
  const g = { A: input.gradeA, B: input.gradeB };
  const gname = (l: L) => `${g[l]}학년`;
  const v: Violation[] = [];
  const blocks = [...input.blocks].sort((a, b) => a.startMin - b.startMin);

  // R1: 각 학년 0~D분이 빈틈·겹침 없이 한 번씩
  for (const l of LANES) {
    const cnt = Array(D).fill(0);
    const mine = blocks.filter((b) => covers(b, l));
    for (const b of mine) for (let m = Math.max(0, b.startMin); m < Math.min(D, b.endMin); m++) cnt[m]++;
    for (const [s, e] of runs(cnt.map((c) => c === 0)))
      v.push({ rule: 'R1', severity: 'error', blockIds: [], range: { startMin: s, endMin: e }, message: `${gname(l)} ${s}~${e}분에 활동이 비어 있습니다.` });
    for (const [s, e] of runs(cnt.map((c) => c > 1))) {
      const ids = mine.filter((b) => b.startMin < e && b.endMin > s).map((b) => b.id);
      v.push({ rule: 'R1', severity: 'error', blockIds: ids, range: { startMin: s, endMin: e }, message: `${gname(l)} 블록이 ${s}~${e}분에 서로 겹칩니다.` });
    }
    const outside = mine.filter((b) => b.startMin < 0 || b.endMin > D || b.endMin <= b.startMin);
    for (const b of outside)
      v.push({ rule: 'R1', severity: 'error', blockIds: [b.id], range: null, message: `${gname(l)} 블록 ${b.startMin}~${b.endMin}분이 수업 시간(0~${D}분)을 벗어납니다.` });
  }

  // R2: 같은 분에 DIRECT 최대 1개
  {
    const directs = blocks.filter((b) => b.mode === 'DIRECT');
    const over = Array.from({ length: D }, (_, m) => directs.filter((b) => b.startMin <= m && m < b.endMin).length > 1);
    for (const [s, e] of runs(over)) {
      const ids = directs.filter((b) => b.startMin < e && b.endMin > s);
      const who = [...new Set(ids.map((b) => (b.lane === 'ALL' ? '전체' : gname(b.lane as L))))];
      const msg = who.length === 2 ? `${who[0]} 직접지도와 ${who[1]} 직접지도가 ${s}~${e}분 겹칩니다.` : `직접지도 블록이 ${s}~${e}분 겹칩니다.`;
      v.push({ rule: 'R2', severity: 'error', blockIds: ids.map((b) => b.id), range: { startMin: s, endMin: e }, message: msg });
    }
  }

  // R3: JOINT ⇔ lane ALL
  for (const b of blocks) {
    if (b.mode === 'JOINT' && b.lane !== 'ALL')
      v.push({ rule: 'R3', severity: 'error', blockIds: [b.id], range: null, message: `통합 블록(${b.startMin}~${b.endMin}분)은 두 학년을 함께 덮어야 합니다.` });
    if (b.lane === 'ALL' && b.mode !== 'JOINT')
      v.push({ rule: 'R3', severity: 'error', blockIds: [b.id], range: null, message: `두 학년 공통 블록(${b.startMin}~${b.endMin}분)은 통합(★)이어야 합니다.` });
  }

  // R4: INDIRECT 카드 필수 요소
  for (const b of blocks.filter((x) => x.mode === 'INDIRECT')) {
    const who = b.lane === 'ALL' ? '공통' : gname(b.lane as L);
    const c = b.card;
    if (!c) {
      v.push({ rule: 'R4', severity: 'error', blockIds: [b.id], range: null, message: `${who} 간접지도(${b.startMin}~${b.endMin}분)에 활동 카드가 없습니다.` });
      continue;
    }
    const missing: string[] = [];
    if (c.steps.length < 2 || c.steps.length > 5) missing.push(`단계 2~5개(지금 ${c.steps.length}개)`);
    if (c.steps.some((s) => !s.trim())) missing.push('빈 단계');
    if (!c.doneSignal.trim()) missing.push('끝 신호');
    if (!c.ifStuck.trim()) missing.push('막힐 때');
    if (!c.output.trim()) missing.push('산출물');
    if (!c.guideRole.trim()) missing.push('안내 역할');
    else if (/이름|실명/.test(c.guideRole)) missing.push('안내 역할(학생 이름 대신 역할)');
    if (missing.length)
      v.push({ rule: 'R4', severity: 'error', blockIds: [b.id], range: null, message: `${who} 간접지도 카드에 ${missing.join(', ')}이(가) 부족합니다.` });
  }

  // R5: 교사 전환 횟수
  {
    const n = countTransitions(input);
    if (n > cfg.maxTransitions)
      v.push({ rule: 'R5', severity: 'warn', blockIds: [], range: null, message: `교사 이동이 ${n}번으로 기준 ${cfg.maxTransitions}번보다 많습니다.` });
  }

  // R6: 분리 구간 학년별 직접지도 비율
  for (const seg of input.segments.filter((s) => s.kind === 'SPLIT')) {
    const segLen = seg.endMin - seg.startMin;
    for (const l of LANES) {
      const d = blocks
        .filter((b) => b.lane === l && b.mode === 'DIRECT')
        .reduce((sum, b) => sum + Math.max(0, Math.min(b.endMin, seg.endMin) - Math.max(b.startMin, seg.startMin)), 0);
      if (segLen > 0 && d < segLen * cfg.minDirectShare)
        v.push({
          rule: 'R6',
          severity: 'warn',
          blockIds: [],
          range: { startMin: seg.startMin, endMin: seg.endMin },
          message: `${gname(l)} 직접지도가 분리 구간 ${segLen}분 중 ${d}분으로 ${Math.round(cfg.minDirectShare * 100)}%보다 적습니다.`,
        });
    }
  }

  // R7: 간접지도 길이
  for (const b of blocks.filter((x) => x.mode === 'INDIRECT' && x.lane !== 'ALL')) {
    const l = b.lane as L;
    if (len(b) < cfg.minIndirectMin)
      v.push({ rule: 'R7', severity: 'warn', blockIds: [b.id], range: { startMin: b.startMin, endMin: b.endMin }, message: `${gname(l)} 간접지도가 ${len(b)}분으로 너무 짧습니다(${cfg.minIndirectMin}분 이상).` });
    if (g[l] <= 2 && len(b) > cfg.maxIndirectMinLowGrade)
      v.push({ rule: 'R7', severity: 'warn', blockIds: [b.id], range: { startMin: b.startMin, endMin: b.endMin }, message: `${gname(l)} 간접지도가 ${len(b)}분으로 저학년 기준 ${cfg.maxIndirectMinLowGrade}분보다 깁니다.` });
  }

  // R8: 분리 구간을 간접으로 시작하면 직전에 통합(과제 안내)이 있어야 한다
  for (const seg of input.segments.filter((s) => s.kind === 'SPLIT')) {
    for (const l of LANES) {
      const first = blocks.find((b) => b.lane === l && b.startMin >= seg.startMin && b.startMin < seg.endMin);
      if (!first || first.mode !== 'INDIRECT') continue;
      const before = blocks.some((b) => b.mode === 'JOINT' && b.endMin === first.startMin);
      if (!before)
        v.push({ rule: 'R8', severity: 'warn', blockIds: [first.id], range: { startMin: first.startMin, endMin: first.endMin }, message: `${gname(l)}이 간접지도로 시작하는데 직전에 함께 과제를 안내하는 시간이 없습니다.` });
    }
  }

  // R9: 시끄러운 간접지도가 다른 학년 직접지도와 겹침
  for (const b of blocks.filter((x) => x.mode === 'INDIRECT' && x.noise === 'loud' && x.lane !== 'ALL')) {
    const other: L = b.lane === 'A' ? 'B' : 'A';
    for (const d of blocks.filter((x) => x.lane === other && x.mode === 'DIRECT')) {
      const s = Math.max(b.startMin, d.startMin);
      const e = Math.min(b.endMin, d.endMin);
      if (s < e)
        v.push({ rule: 'R9', severity: 'warn', blockIds: [b.id, d.id], range: { startMin: s, endMin: e }, message: `${gname(b.lane as L)}의 시끄러운 간접지도가 ${gname(other)} 직접지도와 ${s}~${e}분 겹칩니다.` });
    }
  }

  // R10: 성취기준 코드
  if (opts.lookup) {
    const refs: Parameters<typeof checkCodes>[0] = [];
    for (const s of input.standards ?? []) refs.push({ code: s.code, lane: s.lane, where: '수업 성취기준' });
    for (const b of blocks)
      for (const c of b.standardCodes) refs.push({ code: c, lane: b.lane, blockId: b.id, where: `${b.startMin}~${b.endMin}분 블록` });
    for (const a of input.assessment ?? []) refs.push({ code: a.code, lane: a.lane, where: '평가 기준' });
    v.push(...checkCodes(refs, input.gradeA, input.gradeB, opts.lookup));
  }

  // R11: 학년별 블록 길이 합 = D
  for (const l of LANES) {
    const sum = blocks.filter((b) => covers(b, l)).reduce((s, b) => s + len(b), 0);
    if (sum !== D) v.push({ rule: 'R11', severity: 'error', blockIds: [], range: null, message: `${gname(l)} 블록 시간 합이 ${sum}분으로 수업 시간 ${D}분과 다릅니다.` });
  }

  // R12: PII
  const texts: { id: string | null; t: string }[] = [{ id: null, t: input.commonTheme ?? '' }];
  for (const b of blocks) {
    texts.push({ id: b.id, t: b.activity });
    if (b.card) texts.push({ id: b.id, t: [...b.card.steps, b.card.doneSignal, b.card.ifStuck, b.card.output, b.card.guideRole].join(' ') });
  }
  for (const x of texts) {
    const f = findPII(x.t);
    if (f.length) v.push({ rule: 'R12', severity: 'error', blockIds: x.id ? [x.id] : [], range: null, message: `개인정보로 보이는 내용(${f.join(', ')})이 들어 있습니다.` });
  }

  return v;
}

export const errorsOf = (v: Violation[]) => v.filter((x) => x.severity === 'error');
export const warnsOf = (v: Violation[]) => v.filter((x) => x.severity === 'warn');
export { MODE_KO };
