import type { ReactNode } from 'react';

// 뜻 색은 하나에 하나: ok=통과, warn=주의(진짜 주의만), bad=위반, lo/hi/tg=학년(낮은/높은/함께), board=코드 판정, ink=중립(경로·시간·학년쌍·유형).
// AI 초안·코드 판정·교사 승인 표시는 ui/Marks.tsx(AiBadge·CodeBadge·ApprovedStamp)만 쓴다. 점선은 AI 초안 전용.
const TONES = {
  ink: 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-300/70 dark:bg-board-800 dark:text-ink-200 dark:ring-board-600',
  board: 'bg-board-50 text-board-800 ring-1 ring-inset ring-board-600/25 dark:bg-board-500/20 dark:text-board-200 dark:ring-board-400/30',
  ok: 'bg-ok-50 text-ok-800 ring-1 ring-inset ring-ok-600/25 dark:bg-ok-500/15 dark:text-ok-200 dark:ring-ok-400/30',
  warn: 'bg-warn-50 text-warn-800 ring-1 ring-inset ring-warn-600/30 dark:bg-warn-500/15 dark:text-warn-200 dark:ring-warn-400/30',
  bad: 'bg-bad-50 text-bad-800 ring-1 ring-inset ring-bad-600/25 dark:bg-bad-500/15 dark:text-bad-200 dark:ring-bad-400/30',
  // 블록·띠 위처럼 바탕이 진할 때: 진한 잉크 바탕 + 흰 글자(13:1)
  badSolid: 'bg-ink-900 text-white ring-1 ring-inset ring-white/30 dark:bg-ink-950',
  lo: 'bg-lo-50 text-lo-800 ring-1 ring-inset ring-lo-600/25 dark:bg-lo-500/15 dark:text-lo-200 dark:ring-lo-400/30',
  hi: 'bg-hi-50 text-hi-800 ring-1 ring-inset ring-hi-600/25 dark:bg-hi-500/15 dark:text-hi-200 dark:ring-hi-400/30',
  tg: 'bg-tg-50 text-tg-800 ring-1 ring-inset ring-tg-600/25 dark:bg-tg-500/15 dark:text-tg-200 dark:ring-tg-400/30',
} as const;
export type BadgeTone = keyof typeof TONES;

export function Badge({ tone = 'ink', className = '', children, title }: { tone?: BadgeTone; className?: string; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-2xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** 상태 낱말 사전(같은 상태를 화면마다 다르게 부르지 않게) */
export const WORD = {
  verified: '원문 확인됨',
  pending: '원문 확인 필요',
  flagged: '교사 확인 필요',
} as const;
