// 파이프라인: replay(녹화 fixture)와 rules 모드 모두 같은 스키마를 통과하고 데모 입력은 검사 error 0
import { describe, expect, it } from 'vitest';
import { Lesson as LessonSchema, type LessonInput } from '../shared/contracts';
import { checkLesson, errorsOf } from '../shared/check/timeline';

const DEMO: LessonInput = { gradeA: 3, gradeB: 4, subject: '사회', units: { A: '우리가 사는 곳 - 더 살기 좋은 곳 만들기', B: '지도로 만나는 우리 지역 - 지도에서 우리 지역 찾기' }, durationMin: 40, hasAssistant: false };

async function run(mode: 'replay' | 'rules', input: LessonInput = DEMO) {
  process.env.AI_MODE = mode;
  const { vi } = await import('vitest');
  vi.resetModules();
  const { generateLesson } = await import('../server/ai/pipeline/lesson');
  const { lookup } = await import('../server/standards');
  const steps: string[] = [];
  const t0 = Date.now();
  const lesson = await generateLesson(input, (s, st) => steps.push(`${s}:${st}`));
  return { lesson, steps, ms: Date.now() - t0, errors: errorsOf(checkLesson(lesson, { lookup })) };
}

describe('수업 파이프라인', () => {
  it('replay: 데모 입력 → 위반 1건 → 수리 1회 → error 0, 3초 안', async () => {
    const { lesson, steps, errors, ms } = await run('replay');
    expect(ms).toBeLessThan(3000);
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
    expect(errors).toEqual([]);
    expect(lesson.aiMeta.checkLog[0].errors).toContain('R10');
    expect(lesson.aiMeta.repairs).toBe(1);
    expect(lesson.aiMeta.sources.every((s) => s.mode === 'replay')).toBe(true);
    for (const s of ['맥락', '계획', '골격', '채움', '검사', '수리']) expect(steps.some((x) => x.startsWith(s) && !x.endsWith('running'))).toBe(true);
  });
  it('rules: 같은 스키마, error 0', async () => {
    const { lesson, errors } = await run('rules');
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
    expect(errors).toEqual([]);
    expect(lesson.aiMeta.sources.every((s) => s.mode === 'rules')).toBe(true);
  });
  it('rules: 다른 학년쌍(5·6 과학 45분)도 error 0', async () => {
    const { lesson, errors } = await run('rules', { gradeA: 5, gradeB: 6, subject: '과학', units: { A: '온도와 열 - 온도 재기', B: null }, durationMin: 45, hasAssistant: true });
    expect(errors).toEqual([]);
    expect(lesson.pairType).toBe('SAME_BAND');
  });
  it('replay: fixture가 없는 입력은 기본 fixture 또는 rules로 내려가고 error 0', async () => {
    const { errors, lesson } = await run('replay', { ...DEMO, subject: '수학', units: { A: '덧셈과 뺄셈 - 세 자리 수의 덧셈', B: '큰 수 - 다섯 자리 수' } });
    expect(errors).toEqual([]);
    expect(lesson.standards.every((s) => s.code.includes('수'))).toBe(true);
  });
});
