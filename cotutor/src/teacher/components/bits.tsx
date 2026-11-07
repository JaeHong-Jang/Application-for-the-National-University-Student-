// 작은 표시 조각: 성취기준 칩, AI 출처 칩(중립 메타). AI 초안·코드 판정·교사 승인 표시는 ui/Marks.tsx
import { Cpu, History, Wrench } from 'lucide-react';
import type { AiSource, StandardEntry } from '../../../shared/contracts';
import { Badge, WORD } from '../../ui/Badge';
import { INJECT_NOTE, isInjected, sourceLabel } from '../../ui/aiLabel';

const CHIP = {
  A: 'bg-lo-50 text-lo-900 ring-lo-600/30 dark:bg-lo-500/10 dark:text-lo-200 dark:ring-lo-400/30',
  B: 'bg-hi-50 text-hi-900 ring-hi-600/30 dark:bg-hi-500/10 dark:text-hi-200 dark:ring-hi-400/30',
  ALL: 'bg-paper-card text-ink-800 ring-ink-400/40 dark:bg-board-800 dark:text-ink-200 dark:ring-board-500/50',
} as const;

export function StdChip({ code, entry, lane }: { code: string; entry?: StandardEntry; lane?: 'A' | 'B' | 'ALL' }) {
  const tip = entry ? `${entry.statement}\n\n${entry.source}${entry.textVerified ? `\n${WORD.verified}: NCIC PDF와 대조` : `\n${WORD.pending}`}` : '교육과정 인덱스에 없는 코드';
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md py-0.5 pl-1.5 pr-1 font-mono text-xs font-semibold ring-1 ring-inset ${CHIP[lane ?? 'ALL']}`} title={tip} data-testid="std-chip">
      [{code}]
      {entry ? (
        <span className={`rounded-sm px-1 font-sans text-2xs font-semibold ${entry.textVerified ? 'bg-ok-100 text-ok-800 dark:bg-ok-500/20 dark:text-ok-200' : 'bg-warn-100 text-warn-800 dark:bg-warn-500/20 dark:text-warn-200'}`}>
          {entry.textVerified ? WORD.verified : WORD.pending}
        </span>
      ) : (
        <span className="rounded-sm bg-bad-100 px-1 font-sans text-2xs font-semibold text-bad-800 dark:bg-bad-500/20 dark:text-bad-200">없는 코드</span>
      )}
    </span>
  );
}

/** AI 출처 칩: 경로를 말하는 중립 칩(ink + 아이콘). 상단 알약과 같은 낱말. 위반 주입 녹화본은 각주(*) 하나로만 밝힌다 */
export function SourceTag({ s }: { s: AiSource | null | undefined; short?: boolean }) {
  if (!s) return null;
  const Icon = s.mode === 'live' ? Cpu : s.mode === 'replay' ? History : Wrench;
  const injected = isInjected(s);
  const tip = [sourceLabel(s), s.model ? `모델 ${s.model}` : null, `경로 ${s.origin}`, injected ? INJECT_NOTE : s.note].filter(Boolean).join('\n');
  return (
    <Badge tone="ink" title={tip} className="max-w-full">
      <Icon size={11} aria-hidden className="shrink-0" />
      <span className="truncate">{sourceLabel(s)}</span>
      {injected && (
        <>
          <sup className="font-bold text-ink-900 dark:text-chalkwhite" aria-hidden>
            *
          </sup>
          <span className="sr-only">(수리 장면용 위반 1건 주입)</span>
        </>
      )}
    </Badge>
  );
}
