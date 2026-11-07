// 번호 원 하나(간접지도 카드 단계·HowTo·학생 페이지·인쇄). tone="lane"이면 className으로 학년 단색을 넘긴다
const SIZE = { sm: 'h-5 w-5 text-2xs', md: 'h-6 w-6 text-xs', lg: 'h-8 w-8 text-base' } as const;
const TONE = {
  board: 'bg-board-900 text-chalkwhite dark:bg-board-700',
  lane: 'text-white',
  print: 'border-2 border-ink-800 text-ink-900',
} as const;

export function StepNo({ n, size = 'md', tone = 'board', className = '' }: { n: number; size?: keyof typeof SIZE; tone?: keyof typeof TONE; className?: string }) {
  return <span className={`grid shrink-0 place-items-center rounded-full font-extrabold leading-none tabular-nums ${SIZE[size]} ${TONE[tone]} ${className}`}>{n}</span>;
}
