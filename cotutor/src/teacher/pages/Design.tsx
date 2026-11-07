// S1 수업 설계: 조건 입력 → AI 파이프라인(흐름 레일 + 단계 카드, replay는 단계마다 천천히) → 검사기 적발 배너 → 두 레인 수업 보드(■□★) → 평가 기준 · 검증 게이트 → 승인 · 인쇄
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowDown, ArrowRight, BookMarked, ChevronDown, CircleCheck, Clock, MapPin, Package, Pencil, Printer, ShieldCheck, ShieldX, SlidersHorizontal, UserRound, Volume2, Wand2 } from 'lucide-react';
import type { Lesson, LessonInput, StandardEntry, TimelineBlock } from '../../../shared/contracts';
import { PAIR_LABEL, pairType, recommend } from '../../../shared/check/standards';
import { checkLesson, errorsOf } from '../../../shared/check/timeline';
import { api, ApiError } from '../../api';
import { Badge, WORD } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { AiBadge, ApprovedStamp, CodeBadge, DraftOrApproved } from '../../ui/Marks';
import { PageHeader, Section } from '../../ui/Section';
import { LANE_COLOR, MODE_KO, MODE_MARK, NOISE_KO } from '../../ui/gradeColors';
import { replayPace } from '../../ui/present';
import { useApp } from '../App';
import { useLive } from '../live';
import { CardView } from '../components/CardView';
import { fmtMs, PIPELINE_STEPS, PipelineBoard, RepairBanner, stepsFromLesson, type StepName, type StepState } from '../components/Pipeline';
import { RuleTag, RuleText } from '../components/rules';
import { TimelineLegend } from '../components/TimelineGrid';
import { SourceTag, StdChip } from '../components/bits';

const DEMO_UNITS = { A: { code: '4사01-02', label: '더 살기' }, B: { code: '4사05-02', label: '' } };
type Result = { lesson: Lesson; standards: StandardEntry[] };

export function Design() {
  const { meta, lesson, standards, setLessonData, status } = useApp();
  const { steps } = useLive();
  const loc = useLocation();
  const nav = useNavigate();
  const [form, setForm] = useState<LessonInput>({ gradeA: 3, gradeB: 4, subject: '사회', units: { A: null, B: null }, durationMin: 40, hasAssistant: false });
  const [runId, setRunId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Result | null>(null);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const demoReq = useRef(!!(loc.state as { demo?: boolean } | null)?.demo);

  // 시작 화면에서는 데모 단원을 미리 고른다
  useEffect(() => {
    if (!meta) return;
    setForm((f) =>
      f.units.A || f.units.B
        ? f
        : {
            ...f,
            units: {
              A: meta.units.find((u) => u.grade === f.gradeA && u.subject === f.subject && u.codes.includes(DEMO_UNITS.A.code) && u.label.includes(DEMO_UNITS.A.label))?.label ?? null,
              B: meta.units.find((u) => u.grade === f.gradeB && u.subject === f.subject && u.codes.includes(DEMO_UNITS.B.code))?.label ?? null,
            },
          },
    );
  }, [meta]);

  // 한눈에의 "데모 실행"으로 들어오면 데모 조건으로 바로 만든다(AI 상태를 안 뒤에: replay면 천천히 보여 줘야 해서)
  useEffect(() => {
    if (!demoReq.current || !form.units.A || busy || !status) return;
    demoReq.current = false;
    nav('/design', { replace: true, state: null });
    void generate();
  }, [form.units.A, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [busy]);

  // ---- replay 속도 조절: 녹화 응답은 22ms에 끝나 단계가 안 보인다 → 받은 단계 이벤트를 하나씩(단계당 약 0.7초) 보여 준다.
  // live는 실제로 오래 걸리니 그대로. ?pace=0(또는 localStorage cotutor-pace=0)이면 바로(테스트용)
  const pace = status?.mode === 'replay' ? replayPace() : 0;
  const runEvents = useMemo(() => (runId ? steps.filter((x) => x.runId === runId) : []), [steps, runId]);
  const [shown, setShown] = useState(0);
  const [noEvents, setNoEvents] = useState(false);
  useEffect(() => {
    setShown(0);
    setNoEvents(false);
  }, [runId]);
  useEffect(() => {
    if (!runId) return;
    if (!pace) return setShown(runEvents.length);
    if (shown >= runEvents.length) return;
    const prev = runEvents[shown - 1];
    // 검사기가 위반을 잡은 순간은 조금 더 머문다
    const wait = shown === 0 ? 200 : prev?.status === 'error' ? pace * 1.6 : pace / 2;
    const t = window.setTimeout(() => setShown((n) => n + 1), wait);
    return () => window.clearTimeout(t);
  }, [runId, pace, shown, runEvents]);
  const visible = runEvents.slice(0, shown);
  const sawEnd = visible.some((e) => e.step === '수리' && e.status !== 'running');
  // SSE가 없으면(폴링 대체) 단계 이벤트가 오지 않는다 → 결과를 받은 뒤 1.5초면 그냥 보여 준다
  useEffect(() => {
    if (!pending || runEvents.length) return;
    const t = window.setTimeout(() => setNoEvents(true), 1500);
    return () => window.clearTimeout(t);
  }, [pending, runEvents.length]);
  useEffect(() => {
    if (!pending) return;
    if (!pace || (sawEnd && shown >= runEvents.length) || noEvents) {
      setLessonData(pending);
      setPending(null);
      setBusy(false);
      setShowForm(false);
    }
  }, [pending, pace, sawEnd, shown, runEvents.length, noEvents, setLessonData]);

  const pt = form.gradeA !== form.gradeB ? pairType(Math.min(form.gradeA, form.gradeB), Math.max(form.gradeA, form.gradeB)) : null;
  const rec = pt ? recommend(form.subject, pt) : null;
  const unitsFor = (g: number) => (meta?.units ?? []).filter((u) => u.grade === g && u.subject === form.subject);

  // 실시간 단계(SSE, 속도 조절 뒤)가 있으면 그것, 없으면 저장된 수업에서 다시 만든 단계
  const pipeline = useMemo<Record<StepName, StepState> | null>(() => {
    if (runId) {
      const s = Object.fromEntries(PIPELINE_STEPS.map((k) => [k, { status: 'wait', detail: '', ms: null } as StepState])) as Record<StepName, StepState>;
      const started: Record<string, number> = {};
      for (const e of visible) {
        const k = e.step as StepName;
        if (!s[k]) continue;
        if (e.status === 'running') started[k] = Date.parse(e.at);
        s[k] = { status: e.status, detail: e.detail, ms: e.status !== 'running' && started[k] ? Date.parse(e.at) - started[k] : null };
      }
      // 끝난 뒤에는 저장된 수업의 모델 경로를 붙인다
      if (!busy && lesson) {
        const saved = stepsFromLesson(lesson);
        for (const k of PIPELINE_STEPS) s[k] = { ...s[k], source: saved[k].source ?? null, status: s[k].status === 'wait' ? saved[k].status : s[k].status, detail: s[k].detail || saved[k].detail };
      }
      return s;
    }
    return lesson ? stepsFromLesson(lesson) : null;
  }, [visible, runId, lesson, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검사기 적발 배너: 진행 중이면 보이는 단계 이벤트로, 끝났으면 저장된 첫 검사 기록으로
  const banner = useMemo(() => {
    if (busy && runId) {
      const caught = visible.find((e) => e.step === '검사' && e.status === 'error');
      if (!caught) return null;
      const end = visible.find((e) => e.step === '수리' && e.status !== 'running');
      return { stage: end ? (end.status === 'done' ? 'fixed' : 'left') : 'caught', message: caught.detail.replace(/^위반 \d+건: /, ''), lesson: pending?.lesson ?? null, blockIds: pending?.lesson.aiMeta.firstErrors?.[0]?.blockIds ?? [] } as const;
    }
    const fe = lesson?.aiMeta.firstErrors?.[0];
    if (!lesson || !fe) return null;
    const last = lesson.aiMeta.checkLog[lesson.aiMeta.checkLog.length - 1];
    return { stage: last?.errors.length ? 'left' : 'fixed', message: fe.message, lesson, blockIds: fe.blockIds } as const;
  }, [busy, runId, visible, pending, lesson]);

  async function generate() {
    setError('');
    const id = `run-${Date.now()}`;
    setRunId(id);
    setBusy(true);
    setPending(null);
    setT0(Date.now());
    setNow(Date.now());
    try {
      setPending(await api<Result>('/api/lessons/generate', { body: { ...form, runId: id } }));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const setGrade = (k: 'gradeA' | 'gradeB', v: number) => setForm((f) => ({ ...f, [k]: v, units: { ...f.units, [k === 'gradeA' ? 'A' : 'B']: null } }));
  const elapsed = busy ? `${((now - t0) / 1000).toFixed(1)}초 지남` : lesson && lesson.aiMeta.ms >= 1000 ? `전체 ${fmtMs(lesson.aiMeta.ms)}` : '';
  const collapsed = !!runId && !busy && !!lesson && !showForm;

  const formSection = collapsed ? (
    <Card className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4 xl:col-span-2" data-testid="form-summary">
      <SlidersHorizontal size={16} aria-hidden className="text-ink-600 dark:text-board-300" />
      <span className="text-base font-bold text-ink-900 dark:text-ink-50">수업 조건</span>
      <span className="text-sm text-ink-700 dark:text-ink-200">
        {lesson!.gradeA}·{lesson!.gradeB}학년 {lesson!.subject} {lesson!.durationMin}분 · {PAIR_LABEL[lesson!.pairType]} · {lesson!.method}
      </span>
      <button className="btn-ghost btn-sm ml-auto" onClick={() => setShowForm(true)} data-testid="show-form">
        조건 바꾸기 <ChevronDown size={13} aria-hidden />
      </button>
    </Card>
  ) : (
    <Section title="수업 조건" desc="충북교육청 복식학급 운영 도움자료(2025) 부분통합 모형" className="self-start">
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-2">
          {(['gradeA', 'gradeB'] as const).map((k, i) => (
            <label key={k}>
              <span className="label flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${i === 0 ? LANE_COLOR.A.dot : LANE_COLOR.B.dot}`} /> 학년 {i + 1}
              </span>
              <select className="input font-semibold" value={form[k]} onChange={(e) => setGrade(k, Number(e.target.value))} data-testid={`select-${k}`}>
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    {g}학년
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className={`rounded-lg px-3 py-2.5 ring-1 ring-inset ${pt ? 'bg-paper-deep ring-ink-200 dark:bg-board-950/40 dark:ring-board-700' : 'bg-bad-50 ring-bad-600/20 dark:bg-bad-500/10'}`} data-testid="pair-badge">
          {pt ? <Badge tone="ink">{PAIR_LABEL[pt]}</Badge> : <Badge tone="bad">서로 다른 두 학년을 고르세요</Badge>}
          {rec && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
              추천 <b className="text-ink-900 dark:text-chalkwhite">{rec.lessonType}</b> · {rec.method}
              {rec.alternatives.length > 0 && <span className="text-ink-600 dark:text-board-300"> (대안 {rec.alternatives.join(', ')})</span>}
            </p>
          )}
        </div>
        <label className="block">
          <span className="label">교과</span>
          <select className="input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value, units: { A: null, B: null } }))}>
            {(meta?.subjects ?? ['사회']).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {(['A', 'B'] as const).map((lane) => {
          const g = lane === 'A' ? form.gradeA : form.gradeB;
          const list = unitsFor(g);
          return (
            <label key={lane} className="block">
              <span className={`label ${LANE_COLOR[lane].text}`}>{g}학년 단원</span>
              <select className="input" value={form.units[lane] ?? ''} onChange={(e) => setForm((f) => ({ ...f, units: { ...f.units, [lane]: e.target.value || null } }))} data-testid={`unit-${lane}`}>
                <option value="">(선택 안 함)</option>
                {list.map((u) => (
                  <option key={u.label} value={u.label}>
                    {u.label} ({u.codes.map((c) => `[${c}]`).join(' ')})
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        <p className="text-xs leading-relaxed text-ink-600 dark:text-board-300">단원 목록은 예시 매핑이에요. 학교 채택 교과서에 맞게 고쳐 쓰세요.</p>
        <div className="grid grid-cols-2 items-end gap-2">
          <label>
            <span className="label">수업 시간(분)</span>
            <input className="input font-mono" type="number" min={30} max={80} step={5} value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: Math.min(80, Math.max(30, Number(e.target.value) || 40)) }))} />
          </label>
          <label className="input flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-board-600" checked={form.hasAssistant} onChange={(e) => setForm((f) => ({ ...f, hasAssistant: e.target.checked }))} />
            협력강사
          </label>
        </div>
        <button className="btn-primary btn-lg w-full" disabled={!pt || busy} onClick={generate} data-testid="generate">
          <Wand2 size={16} aria-hidden /> {busy ? '만드는 중…' : '초안 만들기'}
        </button>
        {error && <p className="text-sm text-bad-700 dark:text-bad-300">{error}</p>}
      </div>
    </Section>
  );

  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="1단계 · 설계"
          scene="S1"
          title="수업 설계"
          desc="학년과 단원을 고르면 AI가 초안을 쓰고, 코드가 겹침을 잡아요. 선생님이 승인해요."
          actions={
            <Badge tone="ink" title="데모용 예시 학교예요. 실제 학교 자료가 아니에요.">
              <MapPin size={11} aria-hidden /> 예시 학교 · 강원 ○○군 소규모 초등 3·4학년 복식
            </Badge>
          }
        />
        {banner && <RepairBanner stage={banner.stage} message={banner.message} lesson={banner.lesson} blockIds={banner.blockIds} />}
      </div>
      <div className={`no-print grid grid-cols-[minmax(0,1fr)] gap-5 ${collapsed ? '' : 'xl:grid-cols-[21rem_minmax(0,1fr)]'}`}>
        {formSection}
        <Section
          className={collapsed ? 'xl:col-span-2' : ''}
          title="AI 파이프라인 · 6단계"
          desc={
            busy
              ? `${status?.mode === 'live' ? '로컬 모델은 30~60초 걸릴 수 있어요' : '녹화된 AI 응답을 재생해요. 단계마다 천천히 보여 줘요'} · 단계가 끝날 때마다 한 일을 남겨요`
              : 'AI가 쓴 것(라벤더 점선)과 코드가 판정한 것(초록 실선 자)을 나눠 보여 줘요. 검사기가 AI 초안의 위반을 잡아 고친 기록이 남아요.'
          }
          actions={
            <>
              {elapsed && (
                <Badge tone="ink" className="dev">
                  <Clock size={11} aria-hidden /> <span className="tabular-nums">{elapsed}</span>
                </Badge>
              )}
              {lesson && !busy && (
                <a className="btn-ghost btn-sm" href="#lesson-plan">
                  과정안 보기 <ArrowDown size={13} aria-hidden />
                </a>
              )}
            </>
          }
        >
          {pipeline ? <PipelineBoard steps={pipeline} source={runId ? 'run' : 'saved'} busy={busy} /> : <EmptyState title="아직 실행 기록이 없어요" body="왼쪽에서 조건을 고르고 초안 만들기를 누르세요." />}
        </Section>
      </div>

      <div className="mt-5 min-w-0 scroll-mt-20" id="lesson-plan">
        {lesson ? <LessonView lesson={lesson} standards={standards} editing={editing} setEditing={setEditing} /> : <EmptyState title="아직 수업이 없어요" body="초안 만들기를 누르면 두 레인 수업 보드가 여기에 생겨요." />}
      </div>
    </div>
  );
}

function IndirectCardBox({ blk, approved }: { blk: TimelineBlock; approved: boolean }) {
  const [open, setOpen] = useState(false);
  if (!blk.card) return null;
  return (
    // AI가 쓴 카드: 승인 전엔 AI 점선, 승인 뒤엔 실선
    <div className={`avoid-break mt-2.5 rounded-lg border p-2.5 dark:bg-board-950/40 ${approved ? 'border-solid border-ink-200 bg-paper-card dark:border-board-600' : 'border-dashed border-ai-400 bg-ai-50/40 dark:border-ai-300/60'}`}>
      <button type="button" className="flex w-full min-h-6 flex-wrap items-center gap-1.5 text-left text-xs font-bold text-ink-700 dark:text-ink-200" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {!approved && <AiBadge />}
        간접지도 카드 · 선생님 없이 하는 {blk.endMin - blk.startMin}분
        <span className="font-semibold text-ink-600 dark:text-board-300">· 단계 {blk.card.steps.length}개 · {blk.card.withWhom}</span>
        <ChevronDown size={14} aria-hidden className={`no-print ml-auto transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* 화면에서는 접고(직접지도 칸이 빈 채로 늘어나지 않게), 인쇄에서는 늘 펼친다 */}
      <div className={`mt-2 ${open ? '' : 'hidden print:block'}`}>
        <CardView card={blk.card} compact />
      </div>
    </div>
  );
}

function BlockCard({ blk, lesson, editing, lookup, onSave }: { blk: TimelineBlock; lesson: Lesson; editing: boolean; lookup: (c: string) => StandardEntry | undefined; onSave: (id: string, t: string) => void }) {
  const c = LANE_COLOR[blk.lane];
  const flagged = lesson.aiMeta.flaggedBlockIds.includes(blk.id);
  const surface = blk.mode === 'INDIRECT' ? `bg-paper-card dark:bg-board-900 ${c.border}` : `${c.soft} ${c.border}`;
  return (
    <article className={`avoid-break relative flex h-full flex-col overflow-hidden rounded-xl border py-3 pl-4 pr-3 print-nobreak-auto ${surface}`} data-testid={`plan-${blk.id}`}>
      <span className={`print-exact absolute inset-y-0 left-0 w-1.5 ${blk.mode === 'INDIRECT' ? (blk.lane === 'A' ? 'hatch-a' : 'hatch-b') : c.bar}`} aria-hidden />
      <header className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`text-sm font-extrabold ${c.text}`}>
          {MODE_MARK[blk.mode]} {MODE_KO[blk.mode]}
        </span>
        <span className="text-2xs font-semibold text-ink-600 dark:text-board-300">{blk.phase}</span>
        {blk.mode === 'INDIRECT' && (
          <Badge tone="ink">
            <Volume2 size={11} aria-hidden /> 소음 {NOISE_KO[blk.noise]}
          </Badge>
        )}
        {flagged && <Badge tone="bad">{WORD.flagged}</Badge>}
        <span className="ml-auto font-mono text-2xs font-semibold text-ink-600 dark:text-board-300">
          {blk.startMin}–{blk.endMin}′
        </span>
      </header>
      {editing ? (
        <textarea className="input no-print mb-1 min-h-[64px] text-sm" defaultValue={blk.activity} onBlur={(e) => e.target.value !== blk.activity && onSave(blk.id, e.target.value)} data-testid={`edit-${blk.id}`} aria-label={`${blk.startMin}–${blk.endMin}분 활동`} />
      ) : (
        <p className="text-base font-medium leading-relaxed text-ink-900 dark:text-ink-100">{blk.activity}</p>
      )}
      {blk.materials.length > 0 && (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-600 dark:text-board-300">
          <Package size={13} aria-hidden /> {blk.materials.join(' · ')}
        </p>
      )}
      <IndirectCardBox blk={blk} approved={lesson.status === 'approved'} />
      <div className="mt-2 flex flex-wrap gap-1">
        {blk.standardCodes.map((code) => (
          <StdChip key={code} code={code} entry={lookup(code)} lane={blk.lane} />
        ))}
      </div>
      {blk.mode === 'DIRECT' && (
        <div className={`mt-auto flex items-center gap-2 pt-4 text-sm font-bold ${c.text}`}>
          <span className={`print-exact grid h-7 w-7 place-items-center rounded-full text-white ${c.bar}`}>
            <UserRound size={15} aria-hidden />
          </span>
          선생님이 여기 · {blk.endMin - blk.startMin}분 직접 지도
        </div>
      )}
    </article>
  );
}

/** 두 레인 수업 보드: 시간 경계마다 한 행, ★는 두 열을 가로지르고 학년 블록은 행을 잇는다 */
function LessonBoard({ lesson, editing, lookup, onSave }: { lesson: Lesson; editing: boolean; lookup: (c: string) => StandardEntry | undefined; onSave: (id: string, t: string) => void }) {
  const cuts = [...new Set(lesson.blocks.flatMap((b) => [b.startMin, b.endMin]))].sort((a, b) => a - b);
  const row = (m: number) => cuts.indexOf(m) + 2;
  return (
    <div className="grid gap-x-2.5 gap-y-2.5" style={{ gridTemplateColumns: '3.25rem minmax(0,1fr) minmax(0,1fr)' }} data-testid="plan-table">
      <div />
      {(['A', 'B'] as const).map((l) => (
        <div key={l} className={`flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 ${LANE_COLOR[l].soft} ring-1 ring-inset ${l === 'A' ? 'ring-lo-200 dark:ring-lo-500/30' : 'ring-hi-200 dark:ring-hi-500/30'}`}>
          <span className={`print-exact h-2.5 w-2.5 shrink-0 rounded-full ${LANE_COLOR[l].dot}`} />
          <span className={`shrink-0 whitespace-nowrap text-sm font-extrabold ${LANE_COLOR[l].text}`}>{l === 'A' ? lesson.gradeA : lesson.gradeB}학년</span>
          <span className="min-w-0 truncate text-xs text-ink-600 dark:text-board-300">{lesson.units[l] ?? '단원 미선택'}</span>
        </div>
      ))}
      {/* 시간 축: 행 사이 틈에 끊기지 않는 한 줄 + 경계마다 눈금점 */}
      <div aria-hidden className="pointer-events-none relative" style={{ gridColumn: '1', gridRow: `2 / ${cuts.length + 2}` }}>
        <span className="absolute bottom-[0.6rem] right-0 top-[0.6rem] w-0.5 translate-x-1/2 rounded-full bg-ink-200 dark:bg-board-700" />
      </div>
      {cuts.map((m, i) => (
        <div key={m} className="relative pr-3 text-right" style={{ gridColumn: '1', gridRow: `${i + 2}` }}>
          <span className="font-mono text-xs font-semibold leading-[1.2rem] text-ink-600 dark:text-board-300">{m}′</span>
          <span aria-hidden className="print-exact absolute right-0 top-[0.6rem] h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-paper ring-2 ring-ink-300 dark:bg-board-950 dark:ring-board-500" />
        </div>
      ))}
      {lesson.blocks.map((b) => (
        <div key={b.id} style={{ gridColumn: b.lane === 'ALL' ? '2 / 4' : b.lane === 'A' ? '2' : '3', gridRow: `${row(b.startMin)} / ${row(b.endMin)}` }}>
          <BlockCard blk={b} lesson={lesson} editing={editing} lookup={lookup} onSave={onSave} />
        </div>
      ))}
    </div>
  );
}

const STEP_KO = (step: string) => (step === 'planner' ? '계획' : step === 'filler' ? '채움' : step.startsWith('filler-repair') ? `수리 ${step.split('-').pop()}회` : step === 'planner-repair' ? '계획 다시 쓰기' : step);

function LessonView({ lesson, standards, editing, setEditing }: { lesson: Lesson; standards: Map<string, StandardEntry>; editing: boolean; setEditing: (v: boolean) => void }) {
  const { setLessonData } = useApp();
  const approved = lesson.status === 'approved';
  const lookup = (c: string) => standards.get(c);
  const violations = checkLesson(lesson, { lookup });
  const errors = errorsOf(violations);
  const [msg, setMsg] = useState('');
  const [justApproved, setJustApproved] = useState(false);
  const g = (l: 'A' | 'B') => (l === 'A' ? lesson.gradeA : lesson.gradeB);
  const first = lesson.aiMeta.checkLog[0];

  async function approve() {
    setMsg('');
    try {
      setLessonData(await api(`/api/lessons/${lesson.id}/approve`, { method: 'POST' }));
      setJustApproved(true);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : String(e));
    }
  }
  async function saveTheme(text: string) {
    if (text === lesson.commonTheme) return;
    setLessonData(await api(`/api/lessons/${lesson.id}`, { method: 'PUT', body: { commonTheme: text } }));
  }
  async function saveActivity(blockId: string, text: string) {
    setLessonData(await api(`/api/lessons/${lesson.id}`, { method: 'PUT', body: { activity: { blockId, text } } }));
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden print:border-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-4 sm:p-5 dark:border-board-700">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-600 dark:text-board-300">
              {lesson.gradeA}·{lesson.gradeB}학년 {lesson.subject} {lesson.durationMin}분 과정안 · {PAIR_LABEL[lesson.pairType]} · {lesson.lessonType} · {lesson.method}
              {lesson.hasAssistant ? ' · 협력강사(보조)' : ''}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-2xs font-semibold text-ink-600 dark:text-board-300">공통 주제 ★</span>
              {editing ? (
                <input className="input no-print max-w-md" defaultValue={lesson.commonTheme} onBlur={(e) => void saveTheme(e.target.value)} aria-label="공통 주제" />
              ) : (
                <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-ink-900 dark:text-chalkwhite" data-testid="common-theme">
                  {lesson.commonTheme}
                </h2>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <DraftOrApproved approved={approved} animate={justApproved} />
              {errors.length === 0 ? <CodeBadge>검사 통과</CodeBadge> : <Badge tone="bad">고칠 곳 {errors.length}</Badge>}
            </div>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
            <button className="btn-ghost btn-sm" onClick={() => setEditing(!editing)} data-testid="toggle-edit">
              <Pencil size={13} aria-hidden /> {editing ? '편집 끝' : '고치기'}
            </button>
            <button className="btn-ghost btn-sm" onClick={() => window.print()} data-testid="print-plan">
              <Printer size={13} aria-hidden /> 인쇄
            </button>
            {approved ? (
              <span data-testid="approve-lesson">
                <ApprovedStamp size="md">교사 승인됨</ApprovedStamp>
              </span>
            ) : (
              <button className="btn-primary btn-sm" disabled={errors.length > 0} onClick={approve} data-testid="approve-lesson" title={errors.length ? `고칠 곳 ${errors.length}곳을 먼저 해결하세요(타임라인)` : ''}>
                <ShieldCheck size={13} aria-hidden /> 교사 승인
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-b border-ink-100 bg-ink-50/60 p-4 sm:p-5 lg:grid-cols-2 print:grid-cols-2 dark:border-board-700 dark:bg-board-950/30">
          {(['A', 'B'] as const).map((l) => (
            <div key={l} className="min-w-0">
              <div className={`label ${LANE_COLOR[l].text}`}>{g(l)}학년 성취기준</div>
              <div className="flex flex-wrap gap-1">
                {lesson.standards
                  .filter((s) => s.lane === l || s.lane === 'ALL')
                  .map((s) => (
                    <StdChip key={s.code} code={s.code} entry={lookup(s.code)} lane={l} />
                  ))}
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                {lesson.standards
                  .filter((s) => s.lane === l || s.lane === 'ALL')
                  .map((s) => lookup(s.code)?.statement)
                  .filter(Boolean)
                  .join(' / ')}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {msg && <p className="mb-2 text-sm text-bad-700 dark:text-bad-300">{msg}</p>}
          <div className="no-print mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <TimelineLegend path={false} />
            <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-700 dark:text-board-200">
              <UserRound size={12} aria-hidden /> 교사 이동 = ■ 블록이 바뀌는 지점
            </span>
          </div>
          <div className="overflow-x-auto print:overflow-visible">
            <div className="min-w-[36rem] print:min-w-0">
              <LessonBoard lesson={lesson} editing={editing} lookup={lookup} onSave={(id, t) => void saveActivity(id, t)} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Section title="평가 기준" desc="학년별 성취기준에 맞춘 3단계예요(◎ 잘함 · ○ 보통 · △ 도움 필요). 학생부 문장과 점수는 만들지 않아요." className="avoid-break">
          <div className="grid gap-3 md:grid-cols-2">
            {lesson.assessment.map((a, i) => (
              <div key={i} className={`overflow-hidden rounded-xl border ${LANE_COLOR[a.lane].border}`}>
                <div className={`flex flex-wrap items-center gap-1.5 px-3 py-2 ${LANE_COLOR[a.lane].soft}`}>
                  <b className={`text-sm ${LANE_COLOR[a.lane].text}`}>{g(a.lane)}학년</b>
                  <StdChip code={a.code} entry={lookup(a.code)} lane={a.lane} />
                </div>
                <ul className="divide-y divide-ink-100 text-sm dark:divide-board-700">
                  {(
                    [
                      ['◎', '잘함', a.excellent],
                      ['○', '보통', a.good],
                      ['△', '도움', a.needsSupport],
                    ] as const
                  ).map(([mark, label, text]) => (
                    <li key={mark} className="flex gap-2.5 px-3 py-2">
                      {/* 평가 단계는 상태(통과·주의)가 아니라 중립 칩 + 기호로 */}
                      <span className="inline-flex h-6 min-w-[3.25rem] shrink-0 items-center justify-center rounded-md bg-ink-100 px-1.5 text-2xs font-bold text-ink-800 dark:bg-board-800 dark:text-ink-100">
                        {mark} {label}
                      </span>
                      <span className="leading-relaxed text-ink-800 dark:text-ink-100">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-ink-100 px-3 py-1.5 text-xs text-ink-600 dark:border-board-700 dark:text-board-300">방법 · {a.method}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title={
            <span className="flex flex-wrap items-center gap-2">
              검증 게이트 <CodeBadge>코드가 판정</CodeBadge>
            </span>
          }
          desc="AI 초안을 코드 검사기가 확인하고, 위반이면 그 블록만 다시 쓰게 해요(최대 2회)."
          className="no-print self-start"
        >
          <div className="space-y-3" data-testid="repair-log">
            <ol className="divide-y divide-ink-100 rounded-xl border border-ink-200 px-3 dark:divide-board-700 dark:border-board-700">
              {lesson.aiMeta.checkLog.map((c) => (
                <li key={c.round} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                  {c.errors.length ? <ShieldX size={16} className="shrink-0 text-bad-600 dark:text-bad-400" aria-hidden /> : <CircleCheck size={16} className="shrink-0 text-ok-600 dark:text-ok-400" aria-hidden />}
                  <span className="font-semibold text-ink-800 dark:text-ink-100">{c.round === 0 ? '첫 검사' : `수리 ${c.round}회 뒤 다시 검사`}</span>
                  <span className="ml-auto flex flex-wrap gap-1">
                    {c.errors.length ? (
                      <Badge tone="bad">
                        위반 {c.errors.map((r) => <RuleTag key={r} rule={r} />)}
                      </Badge>
                    ) : (
                      <Badge tone="ok">통과</Badge>
                    )}
                    {c.warns.length > 0 && (
                      <Badge tone="warn">
                        주의 {c.warns.map((r) => <RuleTag key={r} rule={r} />)}
                      </Badge>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <div className={`rounded-xl p-3 ring-1 ${errors.length ? 'bg-bad-50 ring-bad-600/20 dark:bg-bad-500/10' : 'bg-ok-50 ring-ok-600/20 dark:bg-ok-500/10 dark:ring-ok-400/20'}`}>
              <p className={`text-base font-bold ${errors.length ? 'text-bad-900 dark:text-bad-200' : 'text-ok-900 dark:text-ok-100'}`} data-testid="repair-summary">
                {first?.errors.length ? (
                  <>
                    검사 위반 {first.errors.length}건(<RuleText text={first.errors.join(', ')} />) → 수리 {lesson.aiMeta.repairs}회 → {errors.length ? `남은 위반 ${errors.length}건` : '통과'}
                  </>
                ) : (
                  '첫 검사 통과 → 수리할 게 없어요'
                )}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-700 dark:text-ink-200">
                <SourceTag s={lesson.aiMeta.sources[lesson.aiMeta.sources.length - 1]} />
                <span className="dev">
                  {lesson.aiMeta.ms >= 1000 && <>걸린 시간 {fmtMs(lesson.aiMeta.ms)} · </>}프롬프트 <span className="font-mono">{lesson.aiMeta.promptVersion}</span>
                </span>
                {lesson.edits.length > 0 && <span>· 교사 수정 {lesson.edits.length}건 기록</span>}
              </p>
            </div>
            <div className="dev">
              <div className="mb-1.5 text-xs font-bold text-ink-700 dark:text-board-200">AI 호출 경로</div>
              <ul className="space-y-1.5">
                {lesson.aiMeta.sources.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs dark:bg-board-800/50">
                    <span className="w-24 whitespace-nowrap font-semibold text-ink-700 dark:text-ink-200" title={s.step}>
                      {STEP_KO(s.step)}
                    </span>
                    <SourceTag s={s} />
                    <span className="ml-auto font-mono text-ink-600 dark:text-board-300">{fmtMs(s.ms)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {errors.length > 0 && (
              <p className="text-sm text-bad-700 dark:text-bad-300">
                지금 고칠 곳이 {errors.length}곳 있어 승인할 수 없어요.{' '}
                <Link className="inline-flex items-center gap-0.5 font-semibold underline" to="/timeline">
                  타임라인에서 고치기 <ArrowRight size={13} aria-hidden />
                </Link>
              </p>
            )}
            <p className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-board-300">
              <BookMarked size={12} aria-hidden /> 성취기준 칩에 마우스를 올리면 원문 진술이 보여요.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
