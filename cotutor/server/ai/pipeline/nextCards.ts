// ⑩ 다음 차시 학년별 보충·심화 카드 + 코드 검사(R4, R10, R12, 근거 군집 부분집합)
import { randomUUID } from 'node:crypto';
import { IndirectCard, NextCardsOut, type AiSource, type Cluster, type Lesson, type NextLessonCard, type StudentResponse } from '../../../shared/contracts.js';
import { findPII } from '../../../shared/check/pii.js';
import { getStandard } from '../../standards.js';
import { runAI } from '../llm.js';
import { NEXT_SYSTEM, nextUser } from '../prompts/nextCards.js';
import { nextCardsRules, templateCard } from '../rules/index.js';
import { laneCodes } from './cluster.js';

export const RETEACH_THRESHOLD = Number(process.env.RETEACH_THRESHOLD ?? 0.4); // 설정값: 오개념·어휘 질문 비율

export async function generateNextCards(lesson: Lesson, clusters: Cluster[], responses: StudentResponse[]): Promise<{ cards: NextLessonCard[]; source: AiSource; removed: string[] }> {
  const local = clusters.map((c, i) => ({ cid: `c${i + 1}`, c }));
  const codes = laneCodes(lesson);
  const grades = { A: lesson.gradeA, B: lesson.gradeB };
  const count = { A: responses.filter((r) => r.grade === lesson.gradeA).length, B: responses.filter((r) => r.grade === lesson.gradeB).length };
  const hints = (['A', 'B'] as const).map((l) => {
    const weak = local.filter((x) => x.c.lane === l && (x.c.type === '오개념' || x.c.type === '어휘')).reduce((s, x) => s + x.c.questionIds.length, 0);
    const ratio = count[l] ? weak / count[l] : 0;
    return `${l}(${grades[l]}학년): 오개념·어휘 질문 비율 ${Math.round(ratio * 100)}% → 보충은 ${ratio >= RETEACH_THRESHOLD ? '재지도형(10분, 다른 방식으로 다시)' : '복습형(5분 워밍업)'}`;
  });
  const repText = (c: Cluster) => responses.find((r) => r.id === c.representativeId)?.text ?? '';
  const stdText = (['A', 'B'] as const)
    .flatMap((l) =>
      codes[l].map((code) => {
        const s = getStandard(code);
        const lv = s?.levels ?? {};
        return `lane ${l} (${grades[l]}학년) | 코드 ${code} | ${s?.statement ?? ''}\n  A수준: ${lv.A ?? '-'}\n  B수준: ${lv.B ?? '-'}\n  C수준: ${lv.C ?? '-'}`;
      }),
    )
    .join('\n');
  const user = nextUser({
    clusters: local.map((x) => `${x.cid} | lane ${x.c.lane} (${grades[x.c.lane as 'A' | 'B']}학년) | ${x.c.type} | ${x.c.questionIds.length}명 | ${x.c.label} | 대표: "${repText(x.c)}"`).join('\n'),
    standards: stdText,
    counts: `A ${count.A}건, B ${count.B}건`,
    hints: hints.join(' / '),
  });
  const rulesOut = () =>
    nextCardsRules(
      local.map((x) => ({ id: x.cid, lane: x.c.lane as 'A' | 'B', type: x.c.type, size: x.c.questionIds.length, label: x.c.label })),
      { A: getStandard(codes.A[0]), B: getStandard(codes.B[0]) },
      grades,
    );
  const res = await runAI({ route: 'nextCards', role: 'lesson', system: NEXT_SYSTEM, user, schema: NextCardsOut, hashInput: { user }, rules: rulesOut });

  // ---- 코드 검사 ----
  const removed: string[] = [];
  const fallback = rulesOut().cards;
  const out: NextLessonCard[] = [];
  for (const lane of ['A', 'B'] as const) {
    for (const kind of ['보충', '심화'] as const) {
      let c = res.out.cards.find((x) => x.lane === lane && x.kind === kind);
      if (!c) {
        removed.push(`${grades[lane]}학년 ${kind} 카드 없음 → 규칙 카드`);
        c = fallback.find((x) => x.lane === lane && x.kind === kind);
        if (!c) continue;
      }
      let targetCode = c.targetCode.match(/[246][가-힣]\d{2}-\d{2}/)?.[0] ?? c.targetCode;
      if (!codes[lane].includes(targetCode)) {
        removed.push(`${grades[lane]}학년 ${kind}: 이번 차시 밖 코드 [${c.targetCode}] → [${codes[lane][0]}]`);
        targetCode = codes[lane][0];
      }
      const ids = c.basedOnClusterIds.filter((id) => local.some((x) => x.cid === id && x.c.lane === lane));
      if (ids.length !== c.basedOnClusterIds.length) removed.push(`${grades[lane]}학년 ${kind}: 없는(또는 다른 학년) 근거 군집 id 제거`);
      let card = { ...c.card, steps: c.card.steps.map((s) => s.trim()).filter(Boolean).slice(0, 5) };
      const text = [c.title, ...card.steps, card.doneSignal, card.ifStuck, card.output, card.guideRole].join(' ');
      if (/이름|실명/.test(card.guideRole)) {
        removed.push(`${grades[lane]}학년 ${kind}: 안내 역할에 이름 → 역할로 바꿈`);
        card = { ...card, guideRole: '짝 중 한 명이 단계를 소리 내어 읽어 준다.' };
      }
      const bad = card.steps.length < 2 || !card.doneSignal.trim() || !card.ifStuck.trim() || !card.output.trim() || !card.guideRole.trim() || findPII(text).length > 0;
      if (bad) {
        removed.push(`${grades[lane]}학년 ${kind}: 카드 필수 요소 부족 또는 개인정보 → 규칙 카드(R4/R12)`);
        card = templateCard(grades[lane], c.title);
      }
      out.push({
        id: `N-${randomUUID().slice(0, 6)}`,
        lessonId: lesson.id,
        lane,
        kind,
        title: c.title,
        targetCode,
        targetLevel: c.targetLevel,
        basedOnClusterIds: ids.map((id) => local.find((x) => x.cid === id)!.c.id),
        minutes: Math.min(15, Math.max(5, c.minutes || 10)),
        card: IndirectCard.parse(card),
        teacherNote: c.teacherNote,
        status: 'draft',
      });
    }
  }
  return { cards: out, source: res.source, removed };
}
