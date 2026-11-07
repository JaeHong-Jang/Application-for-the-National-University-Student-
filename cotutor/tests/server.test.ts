// 세션 코드·제출 검증·SSE 중복 없는 재생·군집 코드 검사·학생판 인쇄
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { NextLessonCard } from '../shared/contracts';
import { buildStudentSheet, leaksTeacherNote } from '../shared/worksheet';

let submitResponse: typeof import('../server/routes/sessions').submitResponse;
let db: typeof import('../server/store/db');
let common: typeof import('../server/routes/common');
let bus: typeof import('../server/live/bus').bus;
let cluster: typeof import('../server/ai/pipeline/cluster');

beforeAll(async () => {
  process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'cotutor-test-'));
  process.env.AI_MODE = 'rules';
  ({ submitResponse } = await import('../server/routes/sessions'));
  db = await import('../server/store/db');
  common = await import('../server/routes/common');
  ({ bus } = await import('../server/live/bus'));
  cluster = await import('../server/ai/pipeline/cluster');
  db.resetFromSeed();
});

function openSession(code = 'ABCD') {
  const d = db.get();
  const l = db.currentLesson()!;
  d.sessions.push({ code, lessonId: l.id, gradeA: l.gradeA, gradeB: l.gradeB, prompt: null, createdAt: new Date().toISOString(), active: true });
  return d.sessions[d.sessions.length - 1];
}

describe('세션 코드', () => {
  it('4자리 대문자, I·O 없음', () => {
    for (let i = 0; i < 200; i++) expect(common.newSessionCode(() => false)).toMatch(common.SESSION_CODE_RE);
  });
  it('겹치면 다시 뽑는다', () => {
    const seq = [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5];
    let i = 0;
    const code = common.newSessionCode((c) => c === 'AAAA', () => seq[i++ % seq.length]);
    expect(code).not.toBe('AAAA');
  });
});

describe('학생 제출', () => {
  it('마스킹하고 원문은 따로', () => {
    const s = openSession('ABCD');
    const r = submitResponse(s.code, { grade: s.gradeA, text: '번호 010-1234-5678', clientId: 'c1' });
    if ('error' in r) throw new Error(r.error);
    expect(r.text).toBe('번호 [전화번호]');
    expect(r.rawText).toBe('번호 010-1234-5678');
    expect(r.piiFlags).toEqual(['PHONE']);
  });
  it('세션 학년이 아니면 거절', () => {
    const r = submitResponse('ABCD', { grade: 6, text: '질문', clientId: 'c1' });
    expect('error' in r && r.error).toContain('학년');
  });
  it('없는 세션 거절', () => expect('error' in submitResponse('ZZZZ', { grade: 3, text: 'x', clientId: 'c' })).toBe(true));
  it('같은 sid 재전송은 한 건만', () => {
    const before = db.responsesOf('ABCD').length;
    submitResponse('ABCD', { grade: 3, text: '다시', clientId: 'c2', sid: 'same-1' });
    submitResponse('ABCD', { grade: 3, text: '다시', clientId: 'c2', sid: 'same-1' });
    expect(db.responsesOf('ABCD').length).toBe(before + 1);
  });
  it('위기 신호는 safety 플래그 + 알림 이벤트', () => {
    const got: string[] = [];
    const off = bus.subscribe((e) => got.push(e.type));
    const r = submitResponse('ABCD', { grade: 4, text: '친구가 자꾸 괴롭혀요', clientId: 'c3' });
    off();
    expect('safety' in r && r.safety).toBe(true);
    expect(got).toContain('safety');
  });
  it('버스 재생은 세션별로 거른다', () => {
    openSession('WXYZ');
    submitResponse('WXYZ', { grade: 3, text: '다른 반', clientId: 'c9' });
    const replay = bus.replay('ABCD');
    expect(replay.every((e) => e.type !== 'response' || e.response.sessionCode === 'ABCD')).toBe(true);
  });
});

describe('군집 코드 검사', () => {
  const qs = [
    { qid: 'q1', id: 'R1', lane: 'A' as const, text: '장소감이 뭐에요' },
    { qid: 'q2', id: 'R2', lane: 'A' as const, text: '심상지도는 뭐에요' },
    { qid: 'q3', id: 'R3', lane: 'B' as const, text: '축척이 머예요' },
    { qid: 'q4', id: 'R4', lane: 'B' as const, text: '방위표가 뭐에요' },
  ];
  const codes = { A: ['4사01-02'], B: ['4사05-02'] };
  it('없는 ID·중복 소속·다른 학년·밖 코드·SAFETY를 걸러 미분류로', () => {
    const v = cluster.validateClusters(
      {
        clusters: [
          { label: 'a', criteria: 'c', lane: 'A', linkedCode: '4사05-02', type: '어휘', questionIds: ['q1', 'q9', 'q3'], representativeId: 'q9' },
          { label: 'b', criteria: 'c', lane: 'B', linkedCode: '4사05-02', type: '어휘', questionIds: ['q4', 'q1'], representativeId: 'q4' },
        ],
        flags: [{ questionId: 'q2', kind: 'SAFETY' }],
        unclustered: [],
      },
      qs,
      codes,
    );
    expect(v.clusters[0].questionIds).toEqual(['q1']);
    expect(v.clusters[0].representativeId).toBe('q1');
    expect(v.clusters[0].linkedCode).toBeNull();
    expect(v.clusters[1].questionIds).toEqual(['q4']);
    expect(v.unclustered).toEqual(['q3']);
    expect(v.unclustered).not.toContain('q2');
    expect(v.removed.join(' ')).toContain('없는 질문 id q9');
    expect(v.removed.join(' ')).toContain('중복 소속');
  });
  it('fixture 재매핑: 같은 텍스트 → 지금 id, 새 질문 → 비슷한 군집', () => {
    const out = cluster.adaptClusterFixture(
      {
        route: 'cluster',
        hash: 'x',
        promptVersion: 'x',
        origin: 'ollama-live',
        originNote: null,
        recordedWith: { provider: 'ollama', model: 'm', at: '', promptVersion: 'x' },
        extra: { qTexts: { q1: 'B|축척이 머예요', q2: 'B|방위표가 뭐에요' } },
        output: { clusters: [{ label: 'l', criteria: 'c', lane: 'B', linkedCode: null, type: '어휘', questionIds: ['q1', 'q2'], representativeId: 'q1' }], flags: [], unclustered: [] },
      },
      [...qs, { qid: 'q5', id: 'R5', lane: 'B', text: '축척이 뭐에요?' }],
    )!;
    expect(out.clusters[0].questionIds).toEqual(['q3', 'q4', 'q5']);
    expect(out.unclustered).toEqual(['q1', 'q2']);
  });
});

describe('학생판 인쇄: 교사 메모 2중 방어', () => {
  const c: NextLessonCard = {
    id: 'N1',
    lessonId: 'L',
    lane: 'A',
    kind: '보충',
    title: '장소감 다시 보기',
    targetCode: '4사01-02',
    targetLevel: 'B',
    basedOnClusterIds: [],
    minutes: 10,
    card: { withWhom: '짝', steps: ['정답은 놀이터입니다', '둘'], doneSignal: '카드', ifStuck: '도움', output: '학습지', guideRole: '이끔이', physicalRisk: null },
    teacherNote: '정답은 놀이터입니다',
    status: 'approved',
  };
  it('1차: 교사 메모 필드가 없다', () => expect(Object.keys(buildStudentSheet(c, 3))).not.toContain('teacherNote'));
  it('2차: 메모와 같은 문장이 단계에 섞여도 지운다', () => {
    const s = buildStudentSheet(c, 3);
    expect(JSON.stringify(s)).not.toContain(c.teacherNote);
    expect(s.steps).toEqual(['둘']);
  });
  it('렌더된 HTML 문자열 검사', () => {
    expect(leaksTeacherNote('<p>정답은 놀이터입니다</p>', [c.teacherNote])).toBe(true);
    expect(leaksTeacherNote('<p>둘</p>', [c.teacherNote])).toBe(false);
  });
});
