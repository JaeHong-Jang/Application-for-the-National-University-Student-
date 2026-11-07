// rules 모드: 결정적 대체 출력. 모든 출력은 LLM 출력 스키마와 같은 모양이다.
import type { ClusterOut, ClusterType, FillerOut, NextCardsOut, PlannerOut, StandardEntry, TimelineBlock } from '../../../shared/contracts.js';

// ---------- 한국어 2-gram 자카드 ----------
export const bigrams = (s: string) => {
  const t = s.replace(/[^가-힣a-zA-Z0-9]/g, '');
  const out = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
};
export function jaccard(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  return inter / (A.size + B.size - inter);
}

const STOP = new Set(['우리', '그리고', '어떻게', '무엇', '뭐에요', '뭐예요', '머예요', '왜', '있어요', '없어요', '되요', '돼요', '해요', '하나요', '이거', '그거', '진짜', '선생님', '전화번호']);
const JOSA = /(은|는|이|가|을|를|에|에서|의|도|로|으로|랑|하고|이에요|예요|에요|인가요|나요|까요|요)$/;
function nouns(s: string): string[] {
  return s
    .replace(/[^가-힣\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(JOSA, ''))
    .filter((w) => w.length >= 2 && !STOP.has(w));
}

// ---------- 수업 ----------
export function plannerRules(x: { gradeA: number; gradeB: number; subject: string; unitA: string | null; unitB: string | null; unitCodesA: string[]; unitCodesB: string[]; candidates: StandardEntry[]; lessonType: PlannerOut['lessonType']; method: PlannerOut['method'] }): PlannerOut {
  const pick = (codes: string[], band: number) => (codes.length ? codes.slice(0, 1) : x.candidates.filter((s) => s.band === band).slice(0, 1).map((s) => s.code));
  const bandOf = (g: number) => (g <= 2 ? 2 : g <= 4 ? 4 : 6);
  const a = pick(x.unitCodesA, bandOf(x.gradeA));
  const b = pick(x.unitCodesB, bandOf(x.gradeB));
  const theme = x.unitA && x.unitB ? `${x.unitA.split(' - ')[0]}와 ${x.unitB.split(' - ')[0]}를 잇는 우리 고장 살펴보기` : `${x.subject} 함께 배우기`;
  return {
    commonTheme: theme,
    lessonType: x.lessonType,
    method: x.method,
    standards: [...a.map((code) => ({ code, lane: 'A' as const, why: '선택한 단원의 대표 성취기준' })), ...b.map((code) => ({ code, lane: 'B' as const, why: '선택한 단원의 대표 성취기준' }))],
    integrationPoints: ['공통 도입에서 같은 사진·지도 자료로 질문 만들기', '공통 정리에서 학년별 산출물 나누기'],
    splitPoints: { A: x.unitA ?? `${x.gradeA}학년 활동`, B: x.unitB ?? `${x.gradeB}학년 활동` },
  };
}

export function templateCard(grade: number, topic: string): NonNullable<FillerOut['blocks'][number]['card']> {
  return {
    withWhom: grade <= 2 ? '짝' : '모둠',
    steps: [`활동 카드의 질문을 소리 내어 읽는다.`, `${topic}에 대해 아는 것을 학습지에 쓴다.`, `짝과 쓴 것을 바꾸어 읽고 한 가지를 더한다.`],
    doneSignal: '학습지를 다 쓰면 초록 카드를 책상 위에 세운다.',
    ifStuck: '교실 뒤 도움 카드를 보거나 짝에게 먼저 묻는다.',
    output: '학습지 1장',
    guideRole: '모둠 이끔이가 순서와 시간을 챙긴다.',
    physicalRisk: null,
  };
}

export function fillerRules(skeleton: TimelineBlock[], x: { gradeA: number; gradeB: number; unitA: string | null; unitB: string | null; codesA: string[]; codesB: string[]; commonTheme: string; statements: Record<string, string> }): FillerOut {
  const topic = (lane: 'A' | 'B' | 'ALL') => (lane === 'A' ? x.unitA : lane === 'B' ? x.unitB : x.commonTheme)?.split(' - ').pop() ?? '오늘 주제';
  const codes = (lane: 'A' | 'B' | 'ALL') => (lane === 'A' ? x.codesA : lane === 'B' ? x.codesB : [...x.codesA, ...x.codesB]);
  const blocks = skeleton.map((b) => {
    const g = b.lane === 'A' ? x.gradeA : b.lane === 'B' ? x.gradeB : 0;
    const t = topic(b.lane);
    const activity =
      b.mode === 'JOINT'
        ? b.startMin === 0
          ? `함께 시작: ${x.commonTheme} 자료를 보고 질문 만들기, 학년별 과제 안내`
          : '함께 정리: 학년별 산출물 나누고 서로 질문하기'
        : b.mode === 'DIRECT'
          ? `${g}학년 직접지도: ${t} 핵심 개념 설명과 확인 질문`
          : `${g}학년 간접지도: ${t} 활동 카드 수행`;
    return {
      id: b.id,
      phase: b.phase,
      activity,
      materials: b.mode === 'INDIRECT' ? ['활동 카드', '학습지'] : ['교사 자료'],
      noise: (b.mode === 'INDIRECT' ? 'quiet' : 'normal') as 'quiet' | 'normal',
      card: b.mode === 'INDIRECT' ? templateCard(g, t) : null,
      standardCodes: codes(b.lane).slice(0, 1),
    };
  });
  const assessment = (['A', 'B'] as const).flatMap((lane) =>
    codes(lane)
      .slice(0, 1)
      .map((code) => ({
        lane,
        code,
        excellent: `${x.statements[code] ?? code}의 내용을 자기 말로 설명하고 예를 든다.`,
        good: '핵심 내용을 바르게 말한다.',
        needsSupport: '도움 자료를 보고 핵심 낱말을 찾는다.',
        method: '산출물 관찰',
      })),
  );
  return { blocks, assessment };
}

// ---------- 군집 ----------
function guessType(texts: string[]): ClusterType {
  const all = texts.join(' ');
  if (/뭐에|뭐예|머예|무슨 뜻|뭔가요|뜻이/.test(all)) return '어휘';
  if (/왜|항상|진짜/.test(all)) return '오개념';
  if (/만들어도|해도 돼|어떻게 하면|더 /.test(all)) return '호기심·확장';
  if (/어떻게|순서|방법/.test(all)) return '절차 실수';
  return '기타';
}

export function clusterRules(qs: { id: string; lane: 'A' | 'B'; text: string }[], lessonCodes: { A: string[]; B: string[] }, threshold = 0.12): ClusterOut {
  const clusters: ClusterOut['clusters'] = [];
  for (const lane of ['A', 'B'] as const) {
    const groups: { ids: string[]; texts: string[] }[] = [];
    for (const q of qs.filter((x) => x.lane === lane)) {
      let best = -1;
      let bestSim = threshold;
      groups.forEach((g, i) => {
        const sim = Math.max(...g.texts.map((t) => jaccard(t, q.text)));
        if (sim >= bestSim) (best = i), (bestSim = sim);
      });
      if (best >= 0) groups[best].ids.push(q.id), groups[best].texts.push(q.text);
      else groups.push({ ids: [q.id], texts: [q.text] });
    }
    // 한 개짜리 군집은 학년 '기타'로 모은다
    const singles = groups.filter((g) => g.ids.length === 1);
    const merged = groups.filter((g) => g.ids.length > 1);
    if (singles.length) merged.push({ ids: singles.flatMap((g) => g.ids), texts: singles.flatMap((g) => g.texts) });
    for (const g of merged) {
      const freq = new Map<string, number>();
      g.texts.flatMap(nouns).forEach((n) => freq.set(n, (freq.get(n) ?? 0) + 1));
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '질문';
      const type = guessType(g.texts);
      clusters.push({
        label: `'${top}' 관련 질문이 모임(규칙 묶음, 교사 확인 필요)`,
        criteria: `'${top}'과 비슷한 낱말을 쓴 질문`,
        lane,
        linkedCode: lessonCodes[lane][0] ?? null,
        type,
        questionIds: g.ids,
        representativeId: g.ids[0],
      });
    }
  }
  return { clusters, flags: [], unclustered: [] };
}

// ---------- 다음 차시 ----------
export function nextCardsRules(
  clusters: { id: string; lane: 'A' | 'B'; type: ClusterType; size: number; label: string }[],
  std: { A: StandardEntry | undefined; B: StandardEntry | undefined },
  grades: { A: number; B: number },
): NextCardsOut {
  const cards: NextCardsOut['cards'] = [];
  for (const lane of ['A', 'B'] as const) {
    const mine = clusters.filter((c) => c.lane === lane).sort((a, b) => b.size - a.size);
    const weak = mine.find((c) => c.type === '오개념' || c.type === '어휘') ?? mine[0];
    const curious = mine.find((c) => c.type === '호기심·확장') ?? mine.find((c) => c !== weak);
    const s = std[lane];
    if (!s) continue;
    const lv = s.levels ?? {};
    cards.push({
      lane,
      kind: '보충',
      title: `${s.statement.split(',')[0].slice(0, 24)} 다시 해 보기`,
      targetCode: s.code,
      targetLevel: 'B',
      basedOnClusterIds: weak ? [weak.id] : [],
      minutes: 10,
      card: { ...templateCard(grades[lane], weak?.label.slice(0, 20) ?? '지난 시간 내용'), withWhom: '짝' },
      teacherNote: `목표 수준 B: ${lv.B ?? '(DB 진술 없음)'} / 현재 C 진술: ${lv.C ?? '(없음)'}`,
    });
    cards.push({
      lane,
      kind: '심화',
      title: `${s.statement.split(',')[0].slice(0, 24)} 더 깊이 생각하기`,
      targetCode: s.code,
      targetLevel: 'A',
      basedOnClusterIds: curious ? [curious.id] : [],
      minutes: 10,
      card: templateCard(grades[lane], '더 알고 싶은 점'),
      teacherNote: `목표 수준 A: ${lv.A ?? '(DB 진술 없음)'}`,
    });
  }
  return { cards };
}
