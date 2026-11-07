// 수업 생성 파이프라인 6단계를 masdae-pass 에이전트 팀 화면처럼: 흐름 레일 + 단계 카드(상태 알약 · ms · AI/코드 배지).
// 실시간이면 SSE 단계 이벤트로, 아니면 저장된 수업의 aiMeta로 같은 그림을 그린다.
import { ArrowRight, Check, ShieldX, Sparkles } from 'lucide-react';
import type { AiSource, Lesson } from '../../../shared/contracts';
import { AiBadge, CodeBadge } from '../../ui/Marks';
import { PAIR_LABEL } from '../../../shared/check/standards';
import { MODE_MARK } from '../../ui/gradeColors';
import { StatusPill } from '../../ui/StatusPill';
import { SourceTag } from './bits';
import { RuleText } from './rules';

export type StepStatus = 'wait' | 'running' | 'done' | 'error';
export type StepState = { status: StepStatus; detail: string; ms: number | null; source?: AiSource | null };
export const PIPELINE_STEPS = ['맥락', '계획', '골격', '채움', '검사', '수리'] as const;
export type StepName = (typeof PIPELINE_STEPS)[number];

const META: Record<StepName, { sub: string; kind: 'ai' | 'code' | 'both' }> = {
  맥락: { sub: '학년쌍 · 후보 성취기준', kind: 'code' },
  계획: { sub: '공통 주제 · 성취기준 고르기', kind: 'ai' },
  골격: { sub: '부분통합 시간 골격', kind: 'code' },
  채움: { sub: '활동 문장 · 간접지도 카드', kind: 'ai' },
  검사: { sub: '규칙 12개 코드 검사', kind: 'code' },
  수리: { sub: '위반 블록만 다시 쓰기', kind: 'both' },
};

const NODE = {
  ai: { dot: 'bg-ai-600 outline outline-2 outline-offset-2 outline-dashed outline-ai-500 dark:bg-ai-600 dark:outline-ai-300', text: 'text-ai-700 dark:text-ai-200', ring: 'ring-ai-500' },
  code: { dot: 'bg-board-900 dark:bg-board-500', text: 'text-board-800 dark:text-board-200', ring: 'ring-board-700 dark:ring-board-300' },
  both: { dot: 'bg-board-900 dark:bg-board-500', text: 'text-board-800 dark:text-board-200', ring: 'ring-board-700 dark:ring-board-300' },
} as const;

export const fmtMs = (ms: number | null) => (ms == null ? '' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}초` : `${ms.toLocaleString()} ms`);

/** 저장된 수업에서 6단계 상태를 다시 만든다(새로고침·시드 수업용) */
export function stepsFromLesson(l: Lesson): Record<StepName, StepState> {
  const src = (p: string) => l.aiMeta.sources.filter((s) => s.step === p || s.step.startsWith(`${p}-`));
  const planner = src('planner')[0];
  const filler = l.aiMeta.sources.find((s) => s.step === 'filler');
  const repairs = l.aiMeta.sources.filter((s) => s.step.startsWith('filler-repair'));
  const first = l.aiMeta.checkLog[0];
  const last = l.aiMeta.checkLog[l.aiMeta.checkLog.length - 1];
  const cards = l.blocks.filter((b) => b.card).length;
  return {
    맥락: { status: 'done', ms: null, detail: `${l.gradeA}·${l.gradeB}학년 ${PAIR_LABEL[l.pairType]}, 추천 ${l.method}` },
    계획: { status: 'done', ms: planner?.ms ?? null, source: planner, detail: `공통 주제 “${l.commonTheme}”, ${l.standards.map((s) => `[${s.code}]`).join(' ')}` },
    골격: { status: 'done', ms: null, detail: `${l.method} ${l.durationMin}분: ${l.blocks.map((b) => `${b.lane === 'ALL' ? '★' : b.lane + MODE_MARK[b.mode]}${b.startMin}–${b.endMin}`).join(' ')}` },
    채움: { status: 'done', ms: filler?.ms ?? null, source: filler, detail: `블록 ${l.blocks.length}개, 간접지도 카드 ${cards}장` },
    검사: first?.errors.length
      ? { status: 'error', ms: null, detail: `위반 ${first.errors.length}건: ${l.aiMeta.firstErrors?.[0]?.message ?? first.errors.join(', ')} → 수리로 넘겨요` }
      : { status: 'done', ms: null, detail: `고칠 곳 0 · 살펴볼 곳 ${first?.warns.length ?? 0}곳` },
    수리: l.aiMeta.repairs
      ? { status: last?.errors.length ? 'error' : 'done', ms: repairs.reduce((n, s) => n + s.ms, 0) || null, source: repairs[repairs.length - 1], detail: `수리 ${l.aiMeta.repairs}회 → ${last?.errors.length ? `남은 위반 ${last.errors.join(', ')}` : '다시 검사 · 통과'}` }
      : { status: 'done', ms: null, detail: '위반이 없어 수리할 게 없어요' },
  };
}

function Rail({ steps }: { steps: Record<StepName, StepState> }) {
  return (
    <ol className="flex items-start" aria-label="수업 생성 흐름">
      {PIPELINE_STEPS.map((k, i) => {
        const p = steps[k].status;
        const next = i < PIPELINE_STEPS.length - 1 ? steps[PIPELINE_STEPS[i + 1]].status : 'wait';
        const n = NODE[META[k].kind];
        return (
          <li key={k} className="flex min-w-0 flex-1 items-start last:flex-none">
            <div className="flex w-14 flex-col items-center text-center sm:w-20">
              <span
                role="img"
                className={`grid h-7 w-7 place-items-center rounded-full ring-2 transition ${
                  p === 'done'
                    ? `${n.dot} text-white ring-transparent`
                    : p === 'error'
                      ? 'bg-bad-600 text-white ring-transparent'
                      : p === 'running'
                        ? `bg-paper-card ${n.ring} dark:bg-board-900 ${n.text}`
                        : 'bg-ink-100 text-ink-600 ring-ink-200 dark:bg-board-800 dark:ring-board-600 dark:text-board-300'
                }`}
                aria-label={`${k}: ${p === 'done' ? '완료' : p === 'running' ? '진행 중' : p === 'error' ? '위반 발견' : '대기'}`}
              >
                {p === 'done' ? (META[k].kind === 'ai' ? <Sparkles size={14} aria-hidden /> : <Check size={14} strokeWidth={3} aria-hidden />) : p === 'error' ? <ShieldX size={14} aria-hidden /> : <span className={`h-2 w-2 rounded-full ${p === 'running' ? 'animate-ping bg-board-600 dark:bg-board-300' : 'bg-ink-300 dark:bg-board-600'}`} />}
              </span>
              <span className={`mt-1 text-xs font-bold ${p === 'wait' ? 'text-ink-600 dark:text-board-300' : p === 'error' ? 'text-bad-700 dark:text-bad-300' : n.text}`}>{k}</span>
              <span className="hidden text-2xs text-ink-600 sm:block dark:text-board-300">{META[k].kind === 'ai' ? 'AI' : META[k].kind === 'code' ? '코드' : 'AI+코드'}</span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="mt-3.5 h-0.5 min-w-[8px] flex-1 overflow-hidden rounded bg-ink-200 dark:bg-board-800">
                <div className={`h-full transition-all duration-500 ${p === 'done' || p === 'error' ? (next === 'running' ? 'flow-dash w-full animate-flow text-board-500' : 'w-full bg-board-400 dark:bg-board-500') : 'w-0'}`} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({ k, i, s }: { k: StepName; i: number; s: StepState }) {
  const m = META[k];
  // 위반 = 빨강(게이트·타임라인과 같은 색). 호박(warn)은 진짜 '주의'에만
  const tone = s.status === 'done' ? 'ok' : s.status === 'error' ? 'bad' : s.status === 'running' ? 'run' : 'idle';
  const label = s.status === 'done' ? '완료' : s.status === 'error' ? (k === '검사' ? '위반 발견' : '남은 위반') : s.status === 'running' ? '실행 중' : '대기';
  const border = s.status === 'error' ? 'border-bad-300 dark:border-bad-500/50' : s.status === 'running' ? 'border-board-500 ring-2 ring-board-300/60 dark:border-board-400' : 'border-ink-200 dark:border-board-700';
  // 평소에는 1초 이상일 때만(녹화 재생의 '6 ms'는 소음), 심사 모드에선 늘 숨김
  const ms = s.ms != null && s.ms >= 1000 ? fmtMs(s.ms) : '';
  return (
    <li className={`relative overflow-hidden rounded-xl border bg-paper-card p-3 shadow-paper dark:bg-board-900 ${border}`} data-testid={`step-${k}`} data-status={s.status}>
      {s.status === 'running' && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <div className="h-full w-1/2 animate-shimmer bg-board-400" />
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="mt-0.5 font-mono text-2xs font-semibold text-ink-600 dark:text-board-300">{String(i + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink-900 dark:text-ink-50">{k}</div>
          <div className="text-2xs text-ink-600 dark:text-board-300">{m.sub}</div>
          <span className="mt-1 flex flex-wrap gap-1">
            {m.kind !== 'code' && <AiBadge>AI</AiBadge>}
            {m.kind !== 'ai' && <CodeBadge>코드</CodeBadge>}
          </span>
        </div>
        <StatusPill tone={tone} label={label} pulse={s.status === 'running'} />
      </div>
      <p className={`mt-2 line-clamp-3 min-h-[3.4em] text-xs leading-relaxed ${s.status === 'wait' ? 'text-ink-600 dark:text-board-300' : s.status === 'error' ? 'font-semibold text-bad-800 dark:text-bad-200' : 'text-ink-700 dark:text-ink-200'}`} title={s.detail}>
        {s.detail ? <RuleText text={s.detail} /> : s.status === 'wait' ? '앞 단계를 기다려요' : '작업 중…'}
      </p>
      {(ms || s.source) && (
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-ink-100 pt-2 text-2xs text-ink-600 dark:border-board-700 dark:text-board-300">
          {ms && <span className="dev font-mono">{ms}</span>}
          {s.source && <SourceTag s={s.source} />}
        </div>
      )}
    </li>
  );
}

export function PipelineBoard({ steps, source, busy }: { steps: Record<StepName, StepState>; source: 'run' | 'saved'; busy: boolean }) {
  return (
    <div>
      <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-2 py-3 dark:border-board-700 dark:bg-board-950/40">
        <Rail steps={steps} />
      </div>
      <ol className="mt-3 grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3" data-testid="flow-log" data-source={source} data-busy={busy}>
        {PIPELINE_STEPS.map((k, i) => (
          <StepCard key={k} k={k} i={i} s={steps[k]} />
        ))}
      </ol>
    </div>
  );
}

const CODE_RE = /\[?(\d[가-힣]+\d{2}-\d{2})\]?/;

/** 검사기가 AI 초안 오류를 잡은 순간(전폭 빨간 배너) → 수리 뒤 전/후 칩. 저장된 수업에서도 같은 요약을 보인다 */
export function RepairBanner({ stage, message, lesson, blockIds }: { stage: 'caught' | 'fixed' | 'left'; message: string; lesson: Lesson | null; blockIds: string[] }) {
  const before = message.match(CODE_RE)?.[1] ?? null;
  const blk = lesson?.blocks.find((b) => blockIds.includes(b.id));
  const after = before && blk ? (blk.standardCodes.find((c) => c !== before) ?? null) : null;
  const fixed = stage === 'fixed';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-5 animate-drop overflow-hidden rounded-2xl border-2 shadow-lift motion-reduce:animate-none ${fixed ? 'border-bad-600 bg-paper-card dark:border-bad-400 dark:bg-board-900' : 'border-bad-700 bg-bad-600 text-white dark:border-bad-400'}`}
      data-testid="repair-banner"
      data-stage={stage}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${fixed ? 'bg-bad-600 text-white' : 'bg-white text-bad-700'}`}>
          <ShieldX size={24} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xl font-extrabold leading-snug tracking-tight ${fixed ? 'text-ink-900 dark:text-chalkwhite' : ''}`}>
            AI 초안에서 오류 1건 발견 → {stage === 'caught' ? '자동 수리 중…' : stage === 'fixed' ? '자동 수리 · 통과' : '수리 뒤에도 남음'}
          </p>
          <p className={`mt-0.5 text-sm ${fixed ? 'text-ink-700 dark:text-ink-200' : 'text-white/95'}`}>
            <RuleText text={message} /> 코드 검사기가 잡았어요.
          </p>
        </div>
        {before && (
          <div className="flex items-center gap-2 font-mono text-base font-bold" aria-label={`수리 전 ${before}, 수리 뒤 ${after ?? '수리 중'}`}>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 line-through decoration-2 ${fixed ? 'bg-bad-50 text-bad-800 ring-1 ring-bad-300 dark:bg-bad-500/15 dark:text-bad-200' : 'bg-white/15 text-white ring-1 ring-white/60'}`}>
              [{before}] <span aria-hidden className="no-underline">✗</span>
            </span>
            <ArrowRight size={18} aria-hidden />
            {fixed && after ? (
              <span className="inline-flex animate-stamp items-center gap-1 rounded-lg bg-ok-50 px-2.5 py-1 text-ok-800 ring-1 ring-ok-600/40 motion-reduce:animate-none dark:bg-ok-500/15 dark:text-ok-200">
                [{after}] <span aria-hidden>✓</span>
              </span>
            ) : (
              <span className={`rounded-lg px-2.5 py-1 font-sans text-sm ${fixed ? 'bg-ink-100 text-ink-700' : 'bg-white/15 text-white'}`}>{fixed ? '통과' : '수리 중…'}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
