// 숫자 타일 하나(한눈에 KPI·질문함 카운터·성취기준·검증 게이트 공용): 라벨 → 큰 숫자 + 단위 → 짧은 근거
import type { ReactNode } from 'react';
import { Card } from './Card';

const TONE = {
  neutral: { value: 'text-ink-900 dark:text-chalkwhite', bar: '' },
  lo: { value: 'text-lo-800 dark:text-lo-200', bar: 'bg-lo-500' },
  hi: { value: 'text-hi-800 dark:text-hi-200', bar: 'bg-hi-500' },
  bad: { value: 'text-bad-800 dark:text-bad-200', bar: 'bg-bad-600' },
  ok: { value: 'text-ok-800 dark:text-ok-200', bar: 'bg-ok-500' },
} as const;

export function StatTile({ label, value, unit, note, icon, tone = 'neutral', size = 'md', bar = false, flag, title, className = '' }: {
  label: ReactNode; value: ReactNode; unit?: string; note?: ReactNode; icon?: ReactNode; tone?: keyof typeof TONE; size?: 'sm' | 'md' | 'lg'; bar?: boolean; flag?: ReactNode; title?: string; className?: string;
}) {
  const t = TONE[tone];
  const big = size === 'lg' ? 'text-[2.25rem]' : size === 'md' ? 'text-[2rem]' : 'text-[1.375rem]';
  return (
    <Card className={`relative flex flex-col overflow-hidden p-4 sm:p-5 ${className}`} title={title}>
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-ink-600 dark:text-board-200">
        {icon}
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`${big} font-extrabold leading-none tracking-tight tabular-nums ${t.value}`}>{value}</span>
        {unit && <span className="text-sm font-semibold text-ink-600 dark:text-board-200">{unit}</span>}
      </div>
      {(note || flag) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-relaxed text-ink-600 dark:text-board-200">
          {note && <span className="min-w-0">{note}</span>}
          {flag}
        </div>
      )}
      {bar && t.bar && <div className={`absolute inset-x-0 bottom-0 h-1 ${t.bar}`} aria-hidden />}
    </Card>
  );
}
