import type { ReactNode } from 'react';
import { Card } from './Card';
import { ChalkRule } from './Chalk';

// 글자 단계: 쪽 h1 28 → 섹션 h2 20 → 카드 제목 17–19 → 본문 15–17 → 메타 13 → 배지 12
export function Section({ title, desc, actions, children, className = '', id }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <Card className={`p-4 sm:p-5 ${className}`} id={id}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-snug tracking-tight text-ink-900 dark:text-ink-50">{title}</h2>
          {desc && <p className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-board-200">{desc}</p>}
        </div>
        {/* shrink-0이면 390px에서 페이지 전체가 가로로 넘친다 → 줄어들고 줄바꿈되게 */}
        {actions && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

/** 쪽 머리: 손글씨 꼬리표(데모 단계) → 제목 → 설명, 아래 분필 점선. 넓은 화면에서 버튼은 오른쪽 아래에 고정 */
export function PageHeader({ eyebrow, title, desc, actions, scene }: { eyebrow?: string; title: ReactNode; desc?: ReactNode; actions?: ReactNode; scene?: string }) {
  return (
    <header className="mb-6" data-scene={scene}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="eyebrow mb-1.5">
              <span className="eyebrow-bar" aria-hidden />
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[1.75rem] dark:text-chalkwhite">{title}</h1>
          {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-board-200">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div>}
      </div>
      <ChalkRule className="no-print mt-5 text-ink-200 dark:text-board-700" />
    </header>
  );
}
