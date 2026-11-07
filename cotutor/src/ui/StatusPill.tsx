// 상태 알약(진행·연결 상태 전용, rounded-full): 점 + 글. ok=연두, run=칠판 초록(진행 중), warn=호박, bad=위반 빨강
const TONE = {
  ok: { pill: 'bg-ok-50 text-ok-800 ring-ok-600/25 dark:bg-ok-500/15 dark:text-ok-200 dark:ring-ok-400/30', dot: 'bg-ok-500' },
  run: { pill: 'bg-board-50 text-board-800 ring-board-500/30 dark:bg-board-500/20 dark:text-board-100 dark:ring-board-300/30', dot: 'bg-board-600 dark:bg-board-300' },
  warn: { pill: 'bg-warn-50 text-warn-800 ring-warn-600/30 dark:bg-warn-500/15 dark:text-warn-200 dark:ring-warn-400/30', dot: 'bg-warn-500' },
  bad: { pill: 'bg-bad-50 text-bad-800 ring-bad-600/25 dark:bg-bad-500/15 dark:text-bad-200 dark:ring-bad-400/30', dot: 'bg-bad-500' },
  idle: { pill: 'bg-ink-100 text-ink-600 ring-ink-400/30 dark:bg-board-800 dark:text-board-300 dark:ring-board-600', dot: 'bg-ink-300 dark:bg-board-500' },
} as const;
export type PillTone = keyof typeof TONE;

export function StatusPill({ tone, label, pulse = false }: { tone: PillTone; label: string; pulse?: boolean }) {
  const m = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${m.pill}`}>
      <span className={`relative h-1.5 w-1.5 rounded-full ${m.dot}`}>{pulse && <span className={`absolute inset-0 animate-ping rounded-full ${m.dot}`} />}</span>
      {label}
    </span>
  );
}
