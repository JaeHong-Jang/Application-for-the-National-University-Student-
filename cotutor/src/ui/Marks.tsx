// "누가 무엇을 했나" 표시 세 가지. 화면 어디서나(히어로 소개 포함) 이 부품만 쓴다.
//  AI 초안   = 라벤더 + 점선 + ✦      (점선은 AI 초안에만 쓴다. 예외: 타임라인 위반 구간 덮개)
//  코드 판정 = 칠판 초록 + 실선 + 자
//  교사 승인 = 분필 노랑 도장 + 방패 체크(ShieldCheck는 이 뜻에만)
import { Ruler, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'paper' | 'board' | 'onSolid';
const BASE = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 font-semibold leading-tight';
const SIZE = { sm: 'text-2xs', md: 'text-xs', lg: 'text-sm px-2 py-1' } as const;
type Size = keyof typeof SIZE;
const ICON = { sm: 11, md: 13, lg: 15 } as const;

const AI_TONE: Record<Variant, string> = {
  paper: 'border border-dashed border-ai-500 bg-ai-50 text-ai-800 dark:border-ai-300 dark:bg-ai-500/15 dark:text-ai-100',
  board: 'border border-dashed border-ai-300 bg-ai-500/20 text-ai-100',
  onSolid: 'border border-dashed border-ai-600 bg-white text-ai-800',
};
const CODE_TONE: Record<Variant, string> = {
  paper: 'border border-solid border-board-600 bg-board-50 text-board-800 dark:border-board-300 dark:bg-board-800 dark:text-board-100',
  board: 'border border-solid border-chalkwhite/60 bg-white/5 text-chalkwhite',
  onSolid: 'border border-solid border-board-700 bg-white text-board-800',
};
const STAMP = 'bg-chalk-400 text-board-950 shadow-sm print-exact print:border print:border-ink-800 print:bg-white';

export function AiBadge({ variant = 'paper', size = 'sm', children = 'AI 초안', title }: { variant?: Variant; size?: Size; children?: ReactNode; title?: string }) {
  return (
    <span className={`${BASE} ${SIZE[size]} ${AI_TONE[variant]}`} title={title} data-mark="ai">
      <Sparkles size={ICON[size]} aria-hidden /> {children}
    </span>
  );
}

export function CodeBadge({ variant = 'paper', size = 'sm', children = '코드 검사', title }: { variant?: Variant; size?: Size; children?: ReactNode; title?: string }) {
  return (
    <span className={`${BASE} ${SIZE[size]} ${CODE_TONE[variant]}`} title={title ?? 'AI가 아니라 코드가 판정해요'} data-mark="code">
      <Ruler size={ICON[size]} aria-hidden /> {children}
    </span>
  );
}

export function ApprovedStamp({ size = 'sm', children = '교사 승인', animate = false }: { size?: Size; children?: ReactNode; animate?: boolean }) {
  return (
    <span className={`${BASE} ${SIZE[size]} ${STAMP} font-bold ${animate ? 'animate-stamp motion-reduce:animate-none' : ''}`} data-mark="approved">
      <ShieldCheck size={ICON[size]} aria-hidden /> {children}
    </span>
  );
}

/** 반려: 위반(빨강)과 섞이지 않게 중립 회색 */
export function RejectedTag({ size = 'sm' }: { size?: Size }) {
  return (
    <span className={`${BASE} ${SIZE[size]} bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-300 dark:bg-board-800 dark:text-ink-200 dark:ring-board-600`}>
      <X size={ICON[size]} aria-hidden /> 반려
    </span>
  );
}

/** 결과물 상태 하나: 승인 전 = AI 초안, 승인 뒤 = 교사 승인 도장 */
export function DraftOrApproved({ approved, variant = 'paper', size = 'sm', animate }: { approved: boolean; variant?: Variant; size?: Size; animate?: boolean }) {
  return approved ? <ApprovedStamp size={size} animate={animate} /> : <AiBadge variant={variant} size={size} />;
}
