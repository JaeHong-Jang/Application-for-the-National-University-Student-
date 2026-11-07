// 검사기 R1~R12: 규칙마다 통과 1개 + 위반 1개 이상, 골격 3종 × D=40·45·80, broken-draft 검출
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FillerOut, IndirectCard, Lesson, TimelineBlock } from '../shared/contracts';
import { checkLesson, countTransitions, directMinutes } from '../shared/check/timeline';
import { band, normalizeCode, pairType } from '../shared/check/standards';
import { buildSkeleton } from '../shared/skeleton';

const index = JSON.parse(readFileSync('data/standards.index.json', 'utf8')) as { code: string; band: number }[];
const byCode = new Map(index.map((s) => [s.code, s]));
const lookup = (c: string) => byCode.get(c);

const card: IndirectCard = { withWhom: '짝', steps: ['하나를 한다.', '둘을 한다.'], doneSignal: '카드를 세운다.', ifStuck: '도움 카드를 본다.', output: '학습지 1장', guideRole: '모둠 이끔이', physicalRisk: null };

/** 부분통합 40분 정상 수업 */
function base(): Lesson {
  const sk = buildSkeleton('부분통합', 40);
  const blocks = sk.blocks.map((b) => ({
    ...b,
    activity: '활동',
    card: b.mode === 'INDIRECT' ? card : null,
    standardCodes: b.lane === 'A' ? ['4사01-02'] : b.lane === 'B' ? ['4사05-02'] : ['4사01-02', '4사05-02'],
  }));
  return {
    id: 'L',
    gradeA: 3,
    gradeB: 4,
    subject: '사회',
    units: { A: null, B: null },
    pairType: 'SAME_BAND',
    lessonType: '단일교과복수활동',
    method: '부분통합',
    durationMin: 40,
    hasAssistant: false,
    commonTheme: '우리 지역',
    standards: [
      { code: '4사01-02', lane: 'A', why: '' },
      { code: '4사05-02', lane: 'B', why: '' },
    ],
    segments: sk.segments,
    blocks,
    assessment: [],
    status: 'draft',
    aiMeta: { mode: 'rules', model: null, promptVersion: 't', repairs: 0, violationsFixed: [], ms: 0, sources: [], flaggedBlockIds: [], checkLog: [] },
    edits: [],
    previousLessonId: null,
  };
}
const edit = (l: Lesson, id: string, patch: Partial<TimelineBlock>): Lesson => ({ ...l, blocks: l.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
const rules = (l: Lesson) => checkLesson(l, { lookup }).map((v) => v.rule);

describe('기본 수업은 모든 규칙 통과', () => {
  it('부분통합 40분: 위반 0', () => expect(checkLesson(base(), { lookup })).toEqual([]));
  it('전환 3번, 직접 13분씩', () => {
    expect(countTransitions(base())).toBe(3);
    expect(directMinutes(base())).toEqual({ A: 13, B: 13 });
  });
});

describe('R1 빈틈·겹침', () => {
  it('통과', () => expect(rules(base())).not.toContain('R1'));
  it('빈틈', () => {
    const l = edit(base(), 'A2', { startMin: 22 });
    const v = checkLesson(l, { lookup }).filter((x) => x.rule === 'R1');
    expect(v[0].message).toContain('20~22분에 활동이 비어');
  });
  it('겹침', () => expect(rules(edit(base(), 'A1', { endMin: 25 }))).toContain('R1'));
});

describe('R2 직접지도 동시', () => {
  it('통과', () => expect(rules(base())).not.toContain('R2'));
  it('경계 +5분 → 20~25분 겹침 메시지', () => {
    const l = edit(edit(base(), 'A1', { endMin: 25 }), 'A2', { startMin: 25 });
    const v = checkLesson(l, { lookup }).find((x) => x.rule === 'R2')!;
    expect(v.message).toBe('3학년 직접지도와 4학년 직접지도가 20~25분 겹칩니다.');
    expect(v.range).toEqual({ startMin: 20, endMin: 25 });
    expect(v.severity).toBe('error');
  });
  it('협력강사가 있어도 동일', () => {
    const l = { ...edit(base(), 'B1', { mode: 'DIRECT', card: null }), hasAssistant: true };
    expect(rules(l)).toContain('R2');
  });
});

describe('R3 통합 ⇔ ALL', () => {
  it('통과', () => expect(rules(base())).not.toContain('R3'));
  it('ALL인데 DIRECT', () => expect(rules(edit(base(), 'J1', { mode: 'DIRECT' }))).toContain('R3'));
  it('JOINT인데 한 학년', () => expect(rules(edit(base(), 'A1', { mode: 'JOINT' }))).toContain('R3'));
});

describe('R4 간접지도 카드', () => {
  it('통과', () => expect(rules(base())).not.toContain('R4'));
  it('카드 없음', () => expect(rules(edit(base(), 'B1', { card: null }))).toContain('R4'));
  it('단계 1개', () => expect(rules(edit(base(), 'B1', { card: { ...card, steps: ['하나'] } }))).toContain('R4'));
  it('단계 6개', () => expect(rules(edit(base(), 'B1', { card: { ...card, steps: ['1', '2', '3', '4', '5', '6'] } }))).toContain('R4'));
  it('끝 신호 비어 있음', () => expect(rules(edit(base(), 'B1', { card: { ...card, doneSignal: ' ' } }))).toContain('R4'));
  it('안내 역할에 학생 이름', () => expect(rules(edit(base(), 'B1', { card: { ...card, guideRole: '학생 이름' } }))).toContain('R4'));
});

describe('R5 교사 이동', () => {
  it('통과(3번)', () => expect(rules(base())).not.toContain('R5'));
  it('시간차 40분은 이동이 많다', () => {
    const sk = buildSkeleton('시간차', 40);
    const l = { ...base(), method: '시간차' as const, segments: sk.segments, blocks: sk.blocks.map((b) => ({ ...b, activity: 'x', card: b.mode === 'INDIRECT' ? card : null })) };
    expect(countTransitions(l)).toBe(3);
    const many = { ...l, config: undefined };
    expect(checkLesson(many, { config: { maxTransitions: 2 } }).map((v) => v.rule)).toContain('R5');
  });
});

describe('R6 직접지도 비율', () => {
  it('통과', () => expect(rules(base())).not.toContain('R6'));
  it('한 학년이 직접지도를 못 받음', () => expect(rules(edit(base(), 'A1', { mode: 'INDIRECT', card }))).toContain('R6'));
});

describe('R7 간접지도 길이', () => {
  it('통과', () => expect(rules(base())).not.toContain('R7'));
  it('5분 미만', () => {
    const l = edit(edit(base(), 'B1', { endMin: 10 }), 'B2', { startMin: 10, mode: 'DIRECT' });
    expect(checkLesson(l, { lookup }).some((v) => v.rule === 'R7' && v.message.includes('짧'))).toBe(true);
  });
  it('1~2학년 15분 초과', () => {
    const sk = buildSkeleton('분리', 40);
    const l = { ...base(), gradeA: 1, gradeB: 2, standards: [], segments: sk.segments, blocks: sk.blocks.map((b) => ({ ...b, activity: 'x', card: b.mode === 'INDIRECT' ? card : null })) };
    expect(checkLesson(l).some((v) => v.rule === 'R7' && v.message.includes('저학년'))).toBe(true);
  });
});

describe('R8 간접 시작 전 안내', () => {
  it('통과(부분통합은 ★ 뒤에 시작)', () => expect(rules(base())).not.toContain('R8'));
  it('분리 모형은 B가 간접으로 바로 시작', () => {
    const sk = buildSkeleton('분리', 40);
    const l = { ...base(), segments: sk.segments, blocks: sk.blocks.map((b) => ({ ...b, activity: 'x', card: b.mode === 'INDIRECT' ? card : null })) };
    expect(checkLesson(l).map((v) => v.rule)).toContain('R8');
  });
});

describe('R9 소음', () => {
  it('통과(조용한 간접)', () => expect(rules(edit(base(), 'B1', { noise: 'quiet' }))).not.toContain('R9'));
  it('시끄러운 간접이 다른 학년 직접과 겹침', () => expect(rules(edit(base(), 'B1', { noise: 'loud' }))).toContain('R9'));
});

describe('R10 성취기준 코드', () => {
  it('통과', () => expect(rules(base())).not.toContain('R10'));
  it('없는 코드', () => expect(rules(edit(base(), 'B1', { standardCodes: ['4사05-07'] }))).toContain('R10'));
  it('학년군 불일치(3학년에 6학년군 코드)', () => {
    const v = checkLesson(edit(base(), 'A1', { standardCodes: ['6사01-01'] }), { lookup }).find((x) => x.rule === 'R10')!;
    expect(v.message).toContain('3학년 학년군에 맞지 않습니다');
  });
  it('lookup이 없으면 건너뜀', () => expect(checkLesson(edit(base(), 'B1', { standardCodes: ['4사05-07'] })).map((v) => v.rule)).not.toContain('R10'));
});

describe('R11 시간 합', () => {
  it('통과', () => expect(rules(base())).not.toContain('R11'));
  it('합이 D와 다름', () => expect(rules(edit(base(), 'A2', { endMin: 35 }))).toContain('R11'));
});

describe('R12 개인정보', () => {
  it('통과', () => expect(rules(base())).not.toContain('R12'));
  it('전화번호가 들어간 활동', () => expect(rules(edit(base(), 'A1', { activity: '010-1234-5678로 연락' }))).toContain('R12'));
  it('카드에 이메일', () => expect(rules(edit(base(), 'B1', { card: { ...card, steps: ['a@b.com 에 보낸다', '끝'] } }))).toContain('R12'));
});

describe('골격 3종 × D=40·45·80은 R1·R11 통과', () => {
  for (const m of ['부분통합', '분리', '시간차'] as const)
    for (const D of [40, 45, 80, 30])
      it(`${m} ${D}분`, () => {
        const sk = buildSkeleton(m, D);
        const l = { ...base(), durationMin: D, segments: sk.segments, blocks: sk.blocks };
        const r = checkLesson(l).map((v) => v.rule);
        expect(r).not.toContain('R1');
        expect(r).not.toContain('R11');
        expect(r).not.toContain('R2');
        expect(r).not.toContain('R3');
      });
  it('부분통합 40분은 매뉴얼 시간(0–7–20–33–40)', () => {
    const sk = buildSkeleton('부분통합', 40);
    expect(sk.blocks.map((b) => `${b.id}:${b.startMin}-${b.endMin}`)).toEqual(['J1:0-7', 'A1:7-20', 'B1:7-20', 'A2:20-33', 'B2:20-33', 'J2:33-40']);
  });
});

describe('broken-draft.json: R10·R9가 정확히 잡힌다', () => {
  it('검출', () => {
    const draft = JSON.parse(readFileSync('data/seed/broken-draft.json', 'utf8')) as { fill: FillerOut };
    const l = base();
    const blocks = l.blocks.map((b) => {
      const f = draft.fill.blocks.find((x) => x.id === b.id)!;
      return { ...b, activity: f.activity, noise: f.noise, card: b.mode === 'INDIRECT' ? f.card : null, standardCodes: f.standardCodes };
    });
    const v = checkLesson({ ...l, blocks }, { lookup });
    expect(v.filter((x) => x.rule === 'R10')).toHaveLength(1);
    expect(v.filter((x) => x.rule === 'R9')).toHaveLength(1);
    expect(v.filter((x) => !['R10', 'R9'].includes(x.rule))).toEqual([]);
  });
});

describe('학년쌍·코드', () => {
  it('band', () => expect([1, 2, 3, 4, 5, 6].map(band)).toEqual([2, 2, 4, 4, 6, 6]));
  it('3·4 같은 학년군, 4·5 걸침, 3·6 격리, 2·3 걸침, 1·4 격리', () => {
    expect(pairType(3, 4)).toBe('SAME_BAND');
    expect(pairType(4, 5)).toBe('CROSS_BAND');
    expect(pairType(3, 6)).toBe('NON_ADJACENT');
    expect(pairType(2, 3)).toBe('CROSS_BAND');
    expect(pairType(1, 4)).toBe('NON_ADJACENT');
  });
  it('코드 정규화', () => {
    expect(normalizeCode('[4사01–02]')).toBe('4사01-02');
    expect(normalizeCode(' 4수01-03 ')).toBe('4수01-03');
    expect(normalizeCode('4사1-2')).toBeNull();
  });
});
