// 간접지도 카드(교사 화면): 번호 단계 + 끝 신호·막힐 때·산출물·안내 역할. 설계·타임라인·다음 차시가 같이 쓴다
import { Flag, HelpCircle, PackageCheck, ShieldAlert, UserRound, Users } from 'lucide-react';
import type { IndirectCard } from '../../../shared/contracts';
import { StepNo } from '../../ui/StepNo';

export const CARD_ROWS = [
  { icon: Flag, k: '끝 신호', f: 'doneSignal' },
  { icon: HelpCircle, k: '막힐 때', f: 'ifStuck' },
  { icon: PackageCheck, k: '산출물', f: 'output' },
  { icon: UserRound, k: '안내 역할', f: 'guideRole' },
] as const;

/** compact: 설계 보드 안(작게) · stacked: 라벨을 위에 두는 2열(다음 차시) · 기본: 라벨 옆 */
export function CardView({ card, compact = false, layout = 'inline', hideSteps = false, stepTone }: { card: IndirectCard; compact?: boolean; layout?: 'inline' | 'stacked'; hideSteps?: boolean; stepTone?: string }) {
  const t = compact ? 'text-sm' : 'text-base';
  const icon = compact ? 13 : 15;
  return (
    <div className={`space-y-2.5 ${t} text-ink-800 dark:text-ink-100`}>
      {!hideSteps && (
        <>
          <div className="flex items-center gap-1.5 text-sm text-ink-700 dark:text-ink-200">
            <Users size={icon} aria-hidden className="shrink-0 text-ink-600 dark:text-board-300" />
            <span className="font-semibold">누구와</span> {card.withWhom}
          </div>
          <ol className="space-y-1.5">
            {card.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <StepNo n={i + 1} size={compact ? 'sm' : 'md'} tone={stepTone ? 'lane' : 'board'} className={stepTone ?? ''} />
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      <dl className={`grid gap-x-3 gap-y-2 text-sm ${layout === 'stacked' ? 'rounded-lg border border-ink-200 p-2.5 sm:grid-cols-2 dark:border-board-700' : compact ? '' : 'sm:grid-cols-2'}`}>
        {CARD_ROWS.map(({ icon: Icon, k, f }) => (
          <div key={k} className={layout === 'stacked' ? '' : 'flex gap-1.5'}>
            <dt className={`flex shrink-0 items-center gap-1 font-semibold text-ink-600 dark:text-board-300 ${layout === 'stacked' ? 'text-2xs' : ''}`}>
              <Icon size={icon - 1} aria-hidden className="shrink-0" />
              {k}
            </dt>
            <dd className="min-w-0 leading-relaxed text-ink-800 dark:text-ink-100">{card[f]}</dd>
          </div>
        ))}
      </dl>
      {card.physicalRisk && (
        <div className="flex gap-1.5 text-sm text-bad-700 dark:text-bad-300">
          <ShieldAlert size={icon} aria-hidden className="mt-0.5 shrink-0" />
          <span className="font-semibold">안전</span> {card.physicalRisk}
        </div>
      )}
    </div>
  );
}
