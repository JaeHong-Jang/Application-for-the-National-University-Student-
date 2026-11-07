// 학년 열 하나(질문함 학년별 질문 · 다음 차시 학년별 카드 공용): 옅은 학년 바탕 + 머리(점 · 학년 · 보조)
import type { ReactNode } from 'react';
import { LANE_COLOR } from './gradeColors';

export function LanePanel({ lane, title, meta, children, className = '', testId, level = 2 }: { lane: 'A' | 'B'; title: ReactNode; meta?: ReactNode; children: ReactNode; className?: string; testId?: string; level?: 2 | 3 }) {
  const c = LANE_COLOR[lane];
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <section className={`rounded-2xl border p-3 ${c.border} ${c.soft} ${className}`} data-testid={testId}>
      <header className="mb-2.5 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} aria-hidden />
        <H className={`text-base font-extrabold ${c.text}`}>{title}</H>
        {meta && <span className="text-xs font-semibold text-ink-600 dark:text-board-300">{meta}</span>}
      </header>
      {children}
    </section>
  );
}
