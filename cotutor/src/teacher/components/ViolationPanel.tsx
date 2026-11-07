// 검증 게이트(규칙 12개, 코드가 판정) + 숫자 타일(교사 이동·학년별 직접지도 분)
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CircleCheck, ShieldAlert, ShieldX, XCircle } from 'lucide-react';
import type { Violation } from '../../../shared/contracts';
import { Badge } from '../../ui/Badge';
import { CodeBadge } from '../../ui/Marks';
import { StatTile } from '../../ui/StatTile';
import { RULE_NAME, RULES, RuleTag, RuleText } from './rules';

export { RULE_NAME };

export function ViolationPanel({ violations, transitions, direct, grades, defaultsNote }: { violations: Violation[]; transitions: number; direct: { A: number; B: number }; grades: [number, number]; defaultsNote?: string }) {
  const errors = violations.filter((v) => v.severity === 'error');
  const warns = violations.filter((v) => v.severity === 'warn');
  // 고칠 곳이 1 이상 → 0이 되는 순간을 보이게(충돌 해결)
  const prev = useRef(errors.length);
  const [solved, setSolved] = useState(false);
  useEffect(() => {
    if (prev.current > 0 && errors.length === 0) {
      setSolved(true);
      const t = window.setTimeout(() => setSolved(false), 2600);
      prev.current = 0;
      return () => window.clearTimeout(t);
    }
    prev.current = errors.length;
  }, [errors.length]);
  return (
    <div className="space-y-4" data-testid="violation-panel">
      <div className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${errors.length ? 'bg-bad-50 ring-bad-600/25 dark:bg-bad-500/10' : 'bg-ok-50 ring-ok-600/25 dark:bg-ok-500/10'} ${solved ? 'animate-pass motion-reduce:animate-none' : ''}`}>
        {errors.length ? <ShieldX size={28} className="shrink-0 text-bad-600 dark:text-bad-400" aria-hidden /> : <CircleCheck size={28} className="shrink-0 text-ok-600 dark:text-ok-400" aria-hidden />}
        <div className="min-w-0" aria-live="polite">
          <div className={`text-base font-extrabold ${errors.length ? 'text-bad-900 dark:text-bad-200' : 'text-ok-900 dark:text-ok-200'}`} data-testid="error-count" data-errors={errors.length}>
            고칠 곳 {errors.length} · 살펴볼 곳 {warns.length}
          </div>
          <div className="text-sm text-ink-700 dark:text-ink-200" data-testid={solved ? 'solved-flash' : undefined}>
            {errors.length ? '위반을 모두 고쳐야 승인할 수 있어요' : solved ? '충돌 해결 · 이제 승인할 수 있어요' : '승인할 수 있어요'}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatTile className="!p-3 shadow-none" size="sm" label="교사 이동" value={transitions} unit="번" />
        <StatTile className="!p-3 shadow-none" size="sm" tone="lo" label={`${grades[0]}학년 직접`} value={direct.A} unit="분" />
        <StatTile className="!p-3 shadow-none" size="sm" tone="hi" label={`${grades[1]}학년 직접`} value={direct.B} unit="분" />
      </div>
      {violations.length > 0 && (
        <ul className="space-y-1.5" data-testid="violation-list">
          {violations.map((v, i) => (
            <li key={i} className={`flex gap-2 rounded-lg border px-2.5 py-2 text-sm ${v.severity === 'error' ? 'border-bad-200 bg-bad-50 text-bad-900 dark:border-bad-500/30 dark:bg-bad-500/10 dark:text-bad-100' : 'border-warn-200 bg-warn-50 text-warn-900 dark:border-warn-500/30 dark:bg-warn-500/10 dark:text-warn-100'}`}>
              {v.severity === 'error' ? <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />}
              <span>
                <RuleTag rule={v.rule} className="mr-1.5 font-bold" />
                <span className="sr-only">{v.rule} </span>
                <RuleText text={v.message} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-ink-700 dark:text-board-200">
          <span>규칙 {RULES.length}개</span>
          <CodeBadge>코드가 판정 · AI 아님</CodeBadge>
        </div>
        <ul className="divide-y divide-ink-100 dark:divide-board-700">
          {RULES.map((r) => {
            const e = errors.some((v) => v.rule === r);
            const w = warns.some((v) => v.rule === r);
            return (
              <li key={r} className="flex items-center gap-2 py-1.5 text-sm" title={`${r} · ${RULE_NAME[r]}`}>
                {e ? <ShieldX size={15} className="shrink-0 text-bad-600 dark:text-bad-400" aria-hidden /> : w ? <ShieldAlert size={15} className="shrink-0 text-warn-700 dark:text-warn-300" aria-hidden /> : <CircleCheck size={15} className="shrink-0 text-ok-600 dark:text-ok-400" aria-hidden />}
                <span className="dev w-8 shrink-0 font-mono text-2xs font-semibold text-ink-600 dark:text-board-300">{r}</span>
                <span className={`min-w-0 flex-1 ${e || w ? 'font-semibold text-ink-900 dark:text-ink-50' : 'text-ink-700 dark:text-ink-200'}`}>{RULE_NAME[r]}</span>
                {/* 통과 행은 칩 없이(초록이 화면을 덮지 않게), 위반·주의 행만 칩 */}
                {e ? <Badge tone="bad">위반</Badge> : w ? <Badge tone="warn">주의</Badge> : <span className="text-2xs font-semibold text-ok-700 dark:text-ok-300">통과</span>}
              </li>
            );
          })}
        </ul>
      </div>
      {defaultsNote && <p className="dev text-2xs leading-relaxed text-ink-600 dark:text-board-300">교사 이동·직접지도 비율·간접 길이 기준값은 {defaultsNote}.</p>}
    </div>
  );
}
