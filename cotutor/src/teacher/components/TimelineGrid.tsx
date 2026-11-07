// 학년 2레인 × D분 CSS grid. ■ 직접=진한 학년색, □ 간접=학년색 빗금, ★ 통합=두 레인을 가로지르는 연두(tg) 블록.
// 위반은 블록에서 2px 떨어진 빨간 점선 외곽선(4학년 주황과 붙지 않게) + 진한 잉크 꼬리표. 점선은 AI 초안 전용인데, 위반 구간만 예외다.
// 위에 선생님 동선(분필 노랑 선)을 겹쳐 그린다: 직접지도 블록을 따라 레인을 건너가고, 두 레인이 동시에 직접이면 빨간 점선 두 갈래.
import { ShieldX, UserRound } from 'lucide-react';
import type { TimelineBlock, Violation } from '../../../shared/contracts';
import { countTransitions, teacherFocus } from '../../../shared/check/timeline';
import { Badge, WORD } from '../../ui/Badge';
import { LANE_COLOR, MODE_KO, MODE_MARK } from '../../ui/gradeColors';
import { RuleTag } from './rules';

interface Props {
  gradeA: number;
  gradeB: number;
  durationMin: number;
  blocks: TimelineBlock[];
  violations: Violation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
  flagged?: string[];
  highlightIds?: string[];
  /** 선생님 동선 덮개(기본 켬) */
  path?: boolean;
}

type Focus = 'ALL' | 'A' | 'B' | 'BOTH' | null;
// 레인 안 세로 위치(레인 높이 = 1): 글자와 겹치지 않게 레인 아래쪽, 통합은 두 레인 사이
const Y = { A: 0.84, B: 1.84, ALL: 1 } as const;

function focusByMinute(blocks: TimelineBlock[], D: number): Focus[] {
  return Array.from({ length: D }, (_, m) => {
    const here = blocks.filter((b) => b.startMin <= m && m < b.endMin);
    if (here.some((b) => b.mode === 'JOINT')) return 'ALL';
    const a = here.some((b) => b.lane === 'A' && b.mode === 'DIRECT');
    const bb = here.some((b) => b.lane === 'B' && b.mode === 'DIRECT');
    return a && bb ? 'BOTH' : a ? 'A' : bb ? 'B' : null;
  });
}

function runsOf(f: Focus[]) {
  const out: { s: number; e: number; f: Focus }[] = [];
  f.forEach((x, m) => (out.length && out[out.length - 1].f === x ? (out[out.length - 1].e = m + 1) : out.push({ s: m, e: m + 1, f: x })));
  return out;
}

const FOCUS_KO = (f: Focus, gA: number, gB: number) => (f === 'ALL' ? '두 학년 함께' : f === 'A' ? `${gA}학년` : f === 'B' ? `${gB}학년` : f === 'BOTH' ? '두 학년 동시(불가능)' : '순회');

/** 선생님 동선: 분필 노랑 선 + 이동 번호. 그리드의 블록 칸(2열~, 2~3행)에 겹친다 */
function TeacherPath({ blocks, D, gA, gB }: { blocks: TimelineBlock[]; D: number; gA: number; gB: number }) {
  const runs = runsOf(focusByMinute(blocks, D));
  const seg: { d: string; bad: boolean }[] = [];
  runs.forEach((r, i) => {
    if (r.f === 'BOTH') seg.push({ d: `M${r.s} ${Y.A} H${r.e}`, bad: true }, { d: `M${r.s} ${Y.B} H${r.e}`, bad: true });
    else if (r.f) seg.push({ d: `M${r.s} ${Y[r.f]} H${r.e}`, bad: false });
    const p = runs[i - 1];
    // 두 갈래(BOTH)가 끝날 때는 남는 레인 선이 이미 이어져 있으니 세로 연결선을 긋지 않는다(블록 글자를 가로지르지 않게)
    if (!p || p.f === 'BOTH') return;
    const ys = (f: Focus) => (f === 'BOTH' ? [Y.A, Y.B] : f ? [Y[f]] : []);
    const a = ys(p.f);
    const b = ys(r.f);
    if (a.length && b.length) seg.push({ d: `M${r.s} ${Math.min(...a, ...b)} V${Math.max(...a, ...b)}`, bad: r.f === 'BOTH' });
  });
  // 이동 번호는 검사기(countTransitions)와 같은 기준(teacherFocus)으로 센다 → 아래 "교사 이동 N번"과 늘 같다
  const tf = runsOf(teacherFocus({ blocks, gradeA: gA, gradeB: gB, durationMin: D, segments: [] }) as Focus[]);
  const marks: { x: number; y: number; n: number }[] = [];
  tf.forEach((r, i) => {
    const p = tf[i - 1];
    if (!p) return;
    // 번호는 도착 레인의 동선 높이(블록 아래쪽)에 둔다 → 레인 중간의 활동 글자를 가리지 않는다
    const at = (f: Focus) => (f === 'A' || f === 'B' || f === 'ALL' ? Y[f] : null);
    marks.push({ x: r.s, y: at(r.f) ?? at(p.f) ?? 1, n: i });
  });
  const n = marks.length;
  const label = `선생님 동선: ${runs.map((r) => `${r.s}–${r.e}분 ${FOCUS_KO(r.f, gA, gB)}`).join(', ')}. 이동 ${n}번`;
  return (
    <div className="pointer-events-none relative z-30" style={{ gridColumn: `2 / span ${D}`, gridRow: '2 / span 2' }} data-testid="teacher-path" data-moves={n}>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${D} 2`} preserveAspectRatio="none" role="img" aria-label={label}>
        {seg.map((x, i) => (
          <path key={`u${i}`} d={x.d} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={x.bad ? 'stroke-white/90' : 'stroke-ink-950/55 dark:stroke-board-950/80'} strokeWidth={7} />
        ))}
        {seg.map((x, i) => (
          <path key={`p${i}`} d={x.d} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={x.bad ? 'stroke-bad-600' : 'stroke-chalk-400'} strokeWidth={3.5} strokeDasharray={x.bad ? '7 5' : undefined} />
        ))}
      </svg>
      {marks.map((m) => (
        <span
          key={m.n}
          aria-hidden
          className="absolute grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-chalk-400 text-2xs font-extrabold leading-none text-board-950 ring-2 ring-ink-950/70 print-exact"
          style={{ left: `${(m.x / D) * 100}%`, top: `${(m.y / 2) * 100}%` }}
        >
          {m.n}
        </span>
      ))}
    </div>
  );
}

/** 그리드 아래 동선 범례 한 줄 */
export function TeacherPathLegend({ blocks, gradeA, gradeB, durationMin }: { blocks: TimelineBlock[]; gradeA: number; gradeB: number; durationMin: number }) {
  const n = countTransitions({ blocks, gradeA, gradeB, durationMin, segments: [] });
  const both = focusByMinute(blocks, durationMin).some((f) => f === 'BOTH');
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-ink-800 dark:text-ink-100" data-testid="teacher-path-label">
      <span className="inline-flex items-center gap-2">
        <span className="relative inline-block h-1.5 w-8 rounded-full bg-chalk-400 ring-2 ring-ink-950/50" aria-hidden />
        <span>
          선생님 동선 · 교사 이동 <b className="tabular-nums">{n}번</b>
        </span>
      </span>
      {both && (
        <span className="inline-flex items-center gap-1.5 text-bad-700 dark:text-bad-300">
          <span className="inline-block h-0 w-8 border-t-[3px] border-dashed border-bad-600" aria-hidden />
          <span>선생님은 한 명이라 두 레인에 동시에 있을 수 없어요</span>
        </span>
      )}
    </p>
  );
}

export function TimelineGrid({ gradeA, gradeB, durationMin: D, blocks, violations, selectedId, onSelect, compact = false, flagged = [], highlightIds = [], path = true }: Props) {
  const errIds = new Set(violations.filter((v) => v.severity === 'error').flatMap((v) => v.blockIds));
  const warnIds = new Set(violations.filter((v) => v.severity === 'warn').flatMap((v) => v.blockIds));
  const rowH = compact ? '3.75rem' : '6.5rem';
  const col = (m: number) => Math.min(Math.max(m, 0), D) + 2;
  const ticks = Array.from({ length: Math.floor(D / 5) + 1 }, (_, i) => i * 5);
  const overlays = violations.filter((v) => v.range && (v.rule === 'R2' || v.rule === 'R1' || v.rule === 'R9'));

  return (
    <div className="overflow-x-auto">
      <div
        className={`relative grid ${compact ? 'min-w-[26.25rem]' : 'min-w-[35rem]'} rounded-xl border border-ink-200/70 bg-paper p-2 dark:border-board-700 dark:bg-board-950/40`}
        style={{ gridTemplateColumns: `${compact ? '3.75rem' : '4.5rem'} repeat(${D}, minmax(0, 1fr))`, gridTemplateRows: `1.375rem ${rowH} ${rowH}${overlays.length ? ' 2.25rem' : ''}` }}
        data-testid="timeline-grid"
      >
        {/* 눈금 */}
        {ticks.map((t) => (
          <div key={t} className="relative font-mono text-2xs text-ink-600 dark:text-board-300" style={{ gridColumn: `${t === D ? D + 1 : col(t)} / span 1`, gridRow: '1' }}>
            <span className={`absolute whitespace-nowrap ${t === D ? 'right-0' : '-left-1'}`}>{t}</span>
          </div>
        ))}
        {ticks.map((t) => (
          <div key={`l${t}`} className={`pointer-events-none border-ink-200 dark:border-board-700 ${t === D ? 'border-r' : 'border-l'}`} style={{ gridColumn: `${t === D ? D + 1 : col(t)} / span 1`, gridRow: '2 / span 2' }} />
        ))}
        {/* 레인 이름 */}
        {(['A', 'B'] as const).map((l, i) => (
          <div key={l} className="flex items-center pr-1.5" style={{ gridColumn: '1', gridRow: `${i + 2}` }}>
            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 text-xs font-extrabold ${compact ? 'px-1.5' : 'px-2'} ${LANE_COLOR[l].soft} ${LANE_COLOR[l].text}`}>
              <span className={`h-2 w-2 rounded-full ${LANE_COLOR[l].dot}`} />
              {l === 'A' ? gradeA : gradeB}학년
            </span>
          </div>
        ))}
        {/* 블록 */}
        {blocks.map((b) => {
          const c = LANE_COLOR[b.lane];
          const style = b.mode === 'INDIRECT' ? c.hatch : c.solid;
          const rows = b.lane === 'ALL' ? '2 / span 2' : b.lane === 'A' ? '2' : '3';
          const mark = errIds.has(b.id)
            ? 'z-10 outline outline-[3px] outline-dashed outline-offset-2 outline-bad-700 dark:outline-bad-300'
            : warnIds.has(b.id)
              ? 'z-[5] outline outline-2 outline-dashed outline-offset-2 outline-warn-700 dark:outline-warn-300'
              : '';
          const sel = selectedId === b.id ? 'ring-[3px] ring-ink-900 ring-offset-1 ring-offset-paper dark:ring-chalk-300 dark:ring-offset-board-950' : '';
          const hl = highlightIds.includes(b.id) ? 'animate-arrive motion-reduce:animate-none' : '';
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect?.(b.id)}
              className={`relative m-[3px] flex flex-col items-start overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-paper transition hover:-translate-y-0.5 hover:shadow-lift ${style} ${mark} ${sel} ${hl}`}
              style={{ gridColumn: `${col(b.startMin)} / ${col(b.endMin)}`, gridRow: rows }}
              data-testid={`block-${b.id}`}
              title={`${MODE_KO[b.mode]} ${b.startMin}~${b.endMin}분\n${b.activity}`}
            >
              <span className="flex w-full items-center gap-1 text-2xs font-bold leading-tight">
                {b.mode === 'DIRECT' ? <UserRound size="1.15em" strokeWidth={2.5} aria-label="교사가 곁에" className="shrink-0" /> : null}
                <span className="truncate">
                  {MODE_MARK[b.mode]} {MODE_KO[b.mode]}
                </span>
                <span className="ml-auto shrink-0 font-mono font-semibold">
                  {b.startMin}–{b.endMin}
                </span>
              </span>
              {flagged.includes(b.id) && (
                <Badge tone="badSolid" className="mt-0.5">
                  {WORD.flagged}
                </Badge>
              )}
              {!compact && <span className="mt-1 line-clamp-3 text-xs font-medium leading-snug">{b.activity || '(활동 비어 있음)'}</span>}
            </button>
          );
        })}
        {/* 위반 구간 하이라이트(점선 예외: 위반 구간) */}
        {overlays.map((v, i) => {
          const err = v.severity === 'error';
          const cols = `${col(v.range!.startMin)} / ${col(v.range!.endMin)}`;
          // 블록 위에 상자를 덮으면 테두리가 활동 글자를 가른다 → 그리드 아래 전용 줄에 구간 괄호 + 꼬리표만 둔다.
          // 레인 안에서는 블록 빨간 외곽선과 선생님 동선 빨간 점선 두 갈래가 같은 구간을 가리킨다.
          return (
            <div key={i} className="pointer-events-none relative z-20 flex flex-col items-center" style={{ gridColumn: cols, gridRow: '4' }} data-testid={`overlap-${v.rule}`}>
              <div aria-hidden className={`h-2 w-full rounded-b-md border-2 border-t-0 ${err ? 'border-bad-700 bg-bad-500/20 dark:border-bad-300' : 'border-warn-700 bg-warn-300/30 dark:border-warn-300'}`} />
              <span className={`mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-2xs font-bold text-white shadow-lift ring-1 ring-white/40 ${err ? 'bg-ink-900' : 'bg-warn-700'}`}>
                {err && <ShieldX size="1.1em" aria-hidden />}
                <RuleTag rule={v.rule} />
                <span className="font-mono">
                  {v.range!.startMin}–{v.range!.endMin}
                </span>
              </span>
            </div>
          );
        })}
        {path && <TeacherPath blocks={blocks} D={D} gA={gradeA} gB={gradeB} />}
      </div>
    </div>
  );
}

export function TimelineLegend({ path = true }: { path?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs font-semibold text-ink-700 dark:text-board-200">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded bg-lo-600" />
        <span className="-ml-1 h-3 w-5 rounded bg-hi-600" /> ■ 직접지도(교사가 곁에)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="hatch-a h-3 w-5 rounded ring-1 ring-lo-300" />
        <span className="hatch-b -ml-1 h-3 w-5 rounded ring-1 ring-hi-300" /> □ 간접지도(카드로 혼자·짝)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded bg-tg-600" /> ★ 두 학년 함께
      </span>
      {path && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-chalk-400 ring-2 ring-ink-950/50" /> 선생님 동선
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-5 rounded-b border-2 border-t-0 border-bad-700 bg-bad-500/20" /> 위반 구간
      </span>
    </div>
  );
}
