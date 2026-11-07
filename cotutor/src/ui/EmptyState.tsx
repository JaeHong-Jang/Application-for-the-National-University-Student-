import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

// 빈 상태는 실선(점선은 AI 초안 전용)
export function EmptyState({ title, body, action, icon, size = 'md' }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode; size?: 'sm' | 'md' }) {
  if (size === 'sm')
    return <div className="rounded-lg border border-ink-200 bg-paper-card/60 px-3 py-6 text-center text-xs text-ink-600 dark:border-board-700 dark:bg-board-900/40 dark:text-board-200">{title}</div>;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-paper-card/60 px-6 py-12 text-center dark:border-board-700 dark:bg-board-900/40">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-board-900 text-chalkwhite dark:bg-board-800">{icon ?? <Inbox size={20} aria-hidden />}</div>
      <p className="text-base font-bold text-ink-800 dark:text-ink-100">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-600 dark:text-board-200">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
