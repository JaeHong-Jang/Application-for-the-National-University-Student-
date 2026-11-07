// 다음 차시 미리보기와 학생판 학습지. worksheet-grab(MIT)의 '학생판 정답 제거 2중 방어' 패턴을 다시 구현.
import type { IndirectCard, Lesson, NextLessonCard, TimelineBlock } from './contracts.js';
import { buildSkeleton } from './skeleton.js';

/** 승인된 카드를 다음 차시 부분통합 골격의 분리 구간 간접지도 블록에 넣는다(학년별 보충 우선) */
export function nextLessonPreview(lesson: Lesson, cards: NextLessonCard[]): Pick<Lesson, 'gradeA' | 'gradeB' | 'durationMin' | 'segments' | 'blocks'> {
  const sk = buildSkeleton('부분통합', lesson.durationMin);
  const approved = cards.filter((c) => c.status === 'approved');
  const pick = (lane: 'A' | 'B') => approved.find((c) => c.lane === lane && c.kind === '보충') ?? approved.find((c) => c.lane === lane);
  const blocks: TimelineBlock[] = sk.blocks.map((b) => {
    if (b.mode !== 'INDIRECT' || b.lane === 'ALL') return { ...b, activity: b.mode === 'JOINT' ? '함께 시작·정리' : '직접지도' };
    const c = pick(b.lane);
    return c ? { ...b, activity: c.title, card: c.card, standardCodes: [c.targetCode], noise: 'quiet' } : { ...b, activity: '(승인된 카드 없음)' };
  });
  return { gradeA: lesson.gradeA, gradeB: lesson.gradeB, durationMin: lesson.durationMin, segments: sk.segments, blocks };
}

export interface StudentSheet {
  grade: number;
  title: string;
  minutes: number;
  withWhom: IndirectCard['withWhom'];
  steps: string[];
  doneSignal: string;
  ifStuck: string;
  output: string;
  guideRole: string;
}

/** 1차 방어: 화이트리스트 필드만 복사. 2차 방어: 교사 메모 문자열이 남아 있으면 그 칸을 비운다 */
export function buildStudentSheet(card: NextLessonCard, grade: number): StudentSheet {
  const sheet: StudentSheet = {
    grade,
    title: card.title,
    minutes: card.minutes,
    withWhom: card.card.withWhom,
    steps: [...card.card.steps],
    doneSignal: card.card.doneSignal,
    ifStuck: card.card.ifStuck,
    output: card.card.output,
    guideRole: card.card.guideRole,
  };
  return scrubTeacherText(sheet, card.teacherNote);
}

export function scrubTeacherText(sheet: StudentSheet, teacherNote: string): StudentSheet {
  const note = teacherNote.trim();
  if (note.length < 4) return sheet;
  const clean = (s: string) => (s.includes(note) ? '' : s);
  return {
    ...sheet,
    title: clean(sheet.title),
    steps: sheet.steps.map(clean).filter(Boolean),
    doneSignal: clean(sheet.doneSignal),
    ifStuck: clean(sheet.ifStuck),
    output: clean(sheet.output),
    guideRole: clean(sheet.guideRole),
  };
}

/** 렌더된 학생판 HTML에 교사 메모가 들어 있는지(인쇄 직전 검사) */
export const leaksTeacherNote = (html: string, notes: string[]) => notes.some((n) => n.trim().length >= 4 && html.includes(n.trim()));
