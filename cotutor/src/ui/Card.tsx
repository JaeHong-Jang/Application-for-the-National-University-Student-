import type { HTMLAttributes } from 'react';

// 종이 카드: 따뜻한 흰 종이 + 1px 따뜻한 선 + 옅은 그림자. 어두운 화면에서는 칠판 면(#1F3D33)
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`print-plain rounded-xl border border-ink-200 bg-paper-card shadow-paper dark:border-board-700 dark:bg-board-900 dark:shadow-none ${className}`} {...rest} />;
}
