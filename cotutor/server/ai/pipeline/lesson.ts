// 수업 생성 파이프라인: ① 맥락(코드) → ② 계획(LLM) → ③ 골격(코드) → ④ 채움(LLM) → ⑤ 검사(코드) → 수리(LLM, 최대 2회)
// 수리 루프 구조는 TTA-Service agent/loop.ts 참고.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { FillerOut, IndirectCard, PlannerOut, type AiSource, type Lesson, type LessonInput, type StandardEntry, type TimelineBlock, type Violation } from '../../../shared/contracts.js';
import { checkCodes, normalizeCode, PAIR_LABEL, pairType, recommend } from '../../../shared/check/standards.js';
import { checkLesson, errorsOf, warnsOf } from '../../../shared/check/timeline.js';
import { buildSkeleton } from '../../../shared/skeleton.js';
import { getStandard, lookup, standardsFor } from '../../standards.js';
import { findUnit } from '../../units.js';
import { runAI, PROMPT_VERSION } from '../llm.js';
import { FILLER_SYSTEM, fillerUser } from '../prompts/filler.js';
import { PLANNER_SYSTEM, plannerUser } from '../prompts/planner.js';
import { fillerRules, plannerRules, templateCard } from '../rules/index.js';

export type StepEmit = (step: string, status: 'running' | 'done' | 'error', detail: string) => void;
export interface LessonHooks {
  /** 녹화 스크립트 전용: 첫 채움 결과를 바꿔 수리 장면을 만든다 */
  afterFirstFill?: (out: FillerOut, hashInput: unknown) => FillerOut;
}

const MAX_REPAIRS = 2;
const fmtRange = (b: { startMin: number; endMin: number }) => `${b.startMin}–${b.endMin}`;
const MODE_MARK = { JOINT: '★', DIRECT: '■', INDIRECT: '□' } as const;

export function skeletonText(blocks: TimelineBlock[], gA: number, gB: number) {
  return blocks
    .map((b) => `${b.id} | ${b.lane === 'ALL' ? `${gA}·${gB}학년 함께` : `${b.lane === 'A' ? gA : gB}학년(lane ${b.lane})`} | ${b.mode} | ${fmtRange(b)}분`)
    .join('\n');
}

function stdLines(entries: StandardEntry[]) {
  return entries.map((s) => `${s.code} ${s.statement}`).join('\n');
}

/** 채움 결과를 골격에 합친다. 시간·id·레인·모드는 골격 값을 지킨다 */
export function mergeFill(skeleton: TimelineBlock[], out: FillerOut): { blocks: TimelineBlock[]; missing: string[] } {
  const missing: string[] = [];
  const blocks = skeleton.map((b) => {
    const f = out.blocks.find((x) => x.id === b.id);
    if (!f) {
      missing.push(b.id);
      return { ...b };
    }
    const card = b.mode === 'INDIRECT' && f.card ? IndirectCard.parse({ ...f.card, steps: f.card.steps.map((s) => s.trim()).filter(Boolean) }) : null;
    return {
      ...b,
      phase: f.phase,
      activity: f.activity.trim(),
      materials: f.materials,
      noise: f.noise,
      card,
      standardCodes: f.standardCodes.map((c) => normalizeCode(c) ?? c),
    } as TimelineBlock;
  });
  return { blocks, missing };
}

export async function generateLesson(input: LessonInput, emit: StepEmit, hooks: LessonHooks = {}): Promise<Lesson> {
  const t0 = Date.now();
  const sources: AiSource[] = [];
  // ---------- ① 맥락 ----------
  emit('맥락', 'running', '학년쌍과 성취기준 후보를 정리해요');
  const [gA, gB] = input.gradeA <= input.gradeB ? [input.gradeA, input.gradeB] : [input.gradeB, input.gradeA];
  const units = input.gradeA <= input.gradeB ? input.units : { A: input.units.B, B: input.units.A };
  const pt = pairType(gA, gB);
  const rec = recommend(input.subject, pt);
  const uA = findUnit(gA, input.subject, units.A);
  const uB = findUnit(gB, input.subject, units.B);
  const unitCodes = [...(uA?.codes ?? []), ...(uB?.codes ?? [])];
  const all = standardsFor(input.subject, gA, gB);
  // 7B 로컬 모델용으로 성취기준 블록은 단원 코드 + 같은 영역 코드만 (최대 10개)
  const domains = new Set(unitCodes.map((c) => c.slice(0, 4)));
  const relevant = [...all.filter((s) => unitCodes.includes(s.code)), ...all.filter((s) => !unitCodes.includes(s.code) && domains.has(s.code.slice(0, 4)))];
  const candidates = (relevant.length ? relevant : all).slice(0, 10);
  const pairText = `${gA}학년(A)·${gB}학년(B), ${PAIR_LABEL[pt]}, 교과 ${input.subject}, ${input.durationMin}분, 협력강사 ${input.hasAssistant ? '있음(보조만)' : '없음'}, 추천 수업유형 ${rec.lessonType}(대안: ${rec.alternatives.join(', ') || '없음'}), 추천 지도방법 ${rec.method}`;
  const unitsText = `A: ${units.A ?? '(선택 안 함)'} / B: ${units.B ?? '(선택 안 함)'}`;
  emit('맥락', 'done', `${gA}·${gB}학년 ${PAIR_LABEL[pt]}, 후보 성취기준 ${candidates.length}개(단원 코드 ${unitCodes.length}개 먼저), 추천 ${rec.method}`);

  // ---------- ② 계획 ----------
  emit('계획', 'running', '공통 주제와 학년별 성취기준을 골라요');
  const planRules = () =>
    plannerRules({ gradeA: gA, gradeB: gB, subject: input.subject, unitA: units.A, unitB: units.B, unitCodesA: uA?.codes ?? [], unitCodesB: uB?.codes ?? [], candidates, lessonType: rec.lessonType, method: rec.method });
  const planUser = (violations: string | null) => plannerUser({ pair: pairText, standards: candidates, units: unitsText, lastClusters: null, violations });
  let u = planUser(null);
  let planRes = await runAI({ route: 'planner', role: 'lesson', system: PLANNER_SYSTEM, user: u, schema: PlannerOut, hashInput: { user: u }, rules: planRules, exactOnly: true });
  sources.push(planRes.source);
  let plan = planRes.out;
  const planViolations = (p: PlannerOut) => checkCodes(p.standards.map((s) => ({ code: s.code, lane: s.lane, where: '계획' })), gA, gB, lookup);
  let pv = planViolations(plan);
  if (pv.length && planRes.source.mode !== 'rules') {
    u = planUser(JSON.stringify(pv.map((v) => v.message)));
    planRes = await runAI({ route: 'planner', role: 'lesson', system: PLANNER_SYSTEM, user: u, schema: PlannerOut, hashInput: { user: u }, rules: planRules, exactOnly: true });
    sources.push({ ...planRes.source, step: 'planner-repair' });
    plan = planRes.out;
    pv = planViolations(plan);
  }
  // 그래도 틀린 코드는 버리고, 비는 학년은 단원 코드로 채운다
  const okStd = plan.standards
    .map((s) => ({ ...s, code: normalizeCode(s.code) ?? s.code }))
    .filter((s) => all.some((x) => x.code === s.code) && checkCodes([{ code: s.code, lane: s.lane, where: '' }], gA, gB, lookup).length === 0);
  const fallbackStd = planRules().standards;
  for (const lane of ['A', 'B'] as const) if (!okStd.some((s) => s.lane === lane)) okStd.push(...fallbackStd.filter((s) => s.lane === lane));
  plan = { ...plan, standards: okStd };
  const method = plan.method;
  emit('계획', 'done', `공통 주제 "${plan.commonTheme}", ${plan.standards.map((s) => `[${s.code}]`).join(' ')}`);

  // ---------- ③ 골격 ----------
  emit('골격', 'running', `${method} 시간 골격을 만들어요`);
  const sk = buildSkeleton(method, input.durationMin);
  emit('골격', 'done', `${method} ${input.durationMin}분: ${sk.blocks.map((b) => `${b.lane === 'ALL' ? '★' : b.lane + MODE_MARK[b.mode]}${fmtRange(b)}`).join(' ')}`);

  // ---------- ④ 채움 ----------
  emit('채움', 'running', '블록별 활동과 간접지도 카드를 써요');
  const codesA = plan.standards.filter((s) => s.lane === 'A' || s.lane === 'ALL').map((s) => s.code);
  const codesB = plan.standards.filter((s) => s.lane === 'B' || s.lane === 'ALL').map((s) => s.code);
  const usedStd = [...new Set([...codesA, ...codesB])].map((c) => getStandard(c)!).filter(Boolean);
  const statements = Object.fromEntries(usedStd.map((s) => [s.code, s.statement]));
  const fillRules = () => fillerRules(sk.blocks, { gradeA: gA, gradeB: gB, unitA: units.A, unitB: units.B, codesA, codesB, commonTheme: plan.commonTheme, statements });
  const planText = JSON.stringify({ commonTheme: plan.commonTheme, standards: plan.standards, integrationPoints: plan.integrationPoints, splitPoints: plan.splitPoints });
  const fillUser = (violations: string | null) =>
    fillerUser({ pair: pairText, plan: planText, standards: `A(${gA}학년): ${codesA.join(', ')} / B(${gB}학년): ${codesB.join(', ')}\n${stdLines(usedStd)}`, units: unitsText, skeleton: skeletonText(sk.blocks, gA, gB), violations });
  u = fillUser(null);
  const fillRes = await runAI({ route: 'filler', role: 'lesson', system: FILLER_SYSTEM, user: u, schema: FillerOut, hashInput: { user: u }, rules: fillRules, exactOnly: true });
  sources.push(fillRes.source);
  let fill = hooks.afterFirstFill ? hooks.afterFirstFill(fillRes.out, { user: u }) : fillRes.out;
  let merged = mergeFill(sk.blocks, fill);
  emit('채움', 'done', `블록 ${sk.blocks.length - merged.missing.length}/${sk.blocks.length}개, 간접지도 카드 ${merged.blocks.filter((b) => b.card).length}장`);

  const lessonOf = (blocks: TimelineBlock[], assessment: FillerOut['assessment']): Lesson => ({
    id: `L-${randomUUID().slice(0, 8)}`,
    gradeA: gA,
    gradeB: gB,
    subject: input.subject,
    units,
    pairType: pt,
    lessonType: plan.lessonType,
    method,
    durationMin: input.durationMin,
    hasAssistant: input.hasAssistant,
    commonTheme: plan.commonTheme,
    standards: plan.standards,
    segments: sk.segments,
    blocks,
    assessment: assessment.map((a) => ({ ...a, code: normalizeCode(a.code) ?? a.code })) as Lesson['assessment'],
    status: 'draft',
    aiMeta: { mode: fillRes.source.mode, model: fillRes.source.model, promptVersion: PROMPT_VERSION, repairs: 0, violationsFixed: [], ms: 0, sources, flaggedBlockIds: [], checkLog: [] },
    edits: [],
    previousLessonId: null,
  });

  // ---------- ⑤ 검사 ----------
  emit('검사', 'running', '규칙 12개로 검사해요');
  let lesson = lessonOf(merged.blocks, fill.assessment);
  // 채움이 빠뜨린 블록은 검사 전에 규칙으로 채운다(R4가 매번 같은 이유로 터지지 않게)
  if (merged.missing.length) {
    const r = fillRules();
    lesson.blocks = lesson.blocks.map((b) => (merged.missing.includes(b.id) ? mergeFill([b], { blocks: r.blocks.filter((x) => x.id === b.id), assessment: [] }).blocks[0] : b));
    lesson.aiMeta.flaggedBlockIds.push(...merged.missing);
  }
  let v = checkLesson(lesson, { lookup });
  const log = (round: number, vs: Violation[]) => lesson.aiMeta.checkLog.push({ round, errors: errorsOf(vs).map((x) => x.rule), warns: warnsOf(vs).map((x) => x.rule) });
  log(0, v);
  const firstErrors = errorsOf(v);
  lesson.aiMeta.firstErrors = firstErrors.map((x) => ({ rule: x.rule, message: x.message, blockIds: x.blockIds }));
  emit('검사', firstErrors.length ? 'error' : 'done', firstErrors.length ? `위반 ${firstErrors.length}건: ${firstErrors[0].message}` : `고칠 곳 0 · 살펴볼 곳 ${warnsOf(v).length}곳`);

  // ---------- 수리 ----------
  emit('수리', 'running', firstErrors.length ? '위반 목록을 넣어 그 블록만 다시 써요' : '위반이 없어 수리할 게 없어요');
  let repairs = 0;
  const fixedRules: string[] = [];
  while (errorsOf(v).length && repairs < MAX_REPAIRS && fillRes.source.mode !== 'rules') {
    repairs++;
    const errs = errorsOf(v);
    u = fillUser(JSON.stringify(errs.map((x) => ({ rule: x.rule, blockIds: x.blockIds, message: x.message }))));
    const rr = await runAI({ route: 'filler', role: 'lesson', system: FILLER_SYSTEM, user: u, schema: FillerOut, hashInput: { user: u }, rules: fillRules, exactOnly: true });
    sources.push({ ...rr.source, step: `filler-repair-${repairs}` });
    fill = rr.out;
    merged = mergeFill(sk.blocks, fill);
    const prevRules = new Set(errs.map((x) => x.rule));
    // 수리 결과는 위반이 난 블록에만 반영한다(작은 모델이 멀쩡한 블록을 다시 쓰다 새 위반을 만드는 것을 막는다)
    const bad = new Set(errs.flatMap((x) => x.blockIds));
    const touchAll = errs.some((x) => !x.blockIds.length && x.rule !== 'R10');
    const blocks = touchAll ? merged.blocks : lesson.blocks.map((b) => (bad.has(b.id) && !merged.missing.includes(b.id) ? merged.blocks.find((m) => m.id === b.id)! : b));
    const assessmentFix = errs.some((x) => x.rule === 'R10' && !x.blockIds.length);
    const next = lessonOf(blocks, assessmentFix || touchAll ? fill.assessment : lesson.assessment);
    next.id = lesson.id;
    next.aiMeta = lesson.aiMeta;
    lesson = next;
    v = checkLesson(lesson, { lookup });
    log(repairs, v);
    const nowRules = new Set(errorsOf(v).map((x) => x.rule));
    prevRules.forEach((r) => !nowRules.has(r) && fixedRules.push(r));
  }
  // 그래도 남은 error: 해당 블록에 '교사 확인 필요'를 붙이고 rules 템플릿으로 그 필드만 채운다
  const remaining = errorsOf(v);
  if (remaining.length) {
    const r = fillRules();
    const flagged = new Set<string>();
    for (const e of remaining) {
      for (const id of e.blockIds) {
        const b = lesson.blocks.find((x) => x.id === id);
        const rb = r.blocks.find((x) => x.id === id);
        if (!b || !rb) continue;
        flagged.add(id);
        if (e.rule === 'R4') b.card = b.mode === 'INDIRECT' ? IndirectCard.parse(rb.card ?? templateCard(b.lane === 'A' ? gA : gB, '오늘 주제')) : null;
        if (e.rule === 'R10') b.standardCodes = rb.standardCodes;
        if (e.rule === 'R12') (b.activity = rb.activity), (b.card = b.mode === 'INDIRECT' ? IndirectCard.parse(rb.card) : null);
      }
      if (e.rule === 'R10' && !e.blockIds.length) lesson.assessment = r.assessment as Lesson['assessment'];
    }
    lesson.aiMeta.flaggedBlockIds.push(...flagged);
    v = checkLesson(lesson, { lookup });
    log(repairs + 1, v);
  }
  lesson.aiMeta.repairs = repairs;
  lesson.aiMeta.violationsFixed = [...new Set(fixedRules)];
  lesson.aiMeta.ms = Date.now() - t0;
  const endErrors = errorsOf(v).length;
  const summary = firstErrors.length
    ? `검사 위반 ${firstErrors.length}건 → 수리 ${repairs}회 → ${endErrors ? `남은 위반 ${endErrors}건` : '통과'}${lesson.aiMeta.flaggedBlockIds.length ? `, 교사 확인 필요 블록 ${lesson.aiMeta.flaggedBlockIds.length}개` : ''}`
    : '위반이 없어 수리할 게 없어요';
  emit('수리', endErrors ? 'error' : 'done', summary);
  return lesson;
}

// ---------- S2 "카드 만들기": 단일 블록 채움 ----------
const BlockCardOut = z.object({ card: IndirectCard });

export async function fillOneCard(lesson: Lesson, blockId: string) {
  const b = lesson.blocks.find((x) => x.id === blockId);
  if (!b || b.lane === 'ALL') throw new Error('간접지도로 바꿀 수 있는 학년 블록이 아닙니다');
  const g = b.lane === 'A' ? lesson.gradeA : lesson.gradeB;
  const unit = lesson.units[b.lane];
  const codes = lesson.standards.filter((s) => s.lane === b.lane).map((s) => `${s.code} ${getStandard(s.code)?.statement ?? ''}`);
  const user = `<block>${g}학년 간접지도 ${b.startMin}–${b.endMin}분, 단원 ${unit ?? '(없음)'}, 활동 "${b.activity}"</block>\n<standards>${codes.join('\n')}</standards>\n이 블록 하나의 간접지도 카드만 JSON {"card": {...}}로 쓰세요. steps는 2~5개.`;
  const res = await runAI({
    route: 'blockCard',
    role: 'lesson',
    system: FILLER_SYSTEM,
    user,
    schema: BlockCardOut,
    hashInput: { user },
    rules: () => ({ card: templateCard(g, unit?.split(' - ').pop() ?? '오늘 주제') }),
    exactOnly: true,
  });
  return res;
}
