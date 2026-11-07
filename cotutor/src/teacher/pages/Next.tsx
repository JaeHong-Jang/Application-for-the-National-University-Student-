// S4 다음 차시: 다음 차시 미리보기(승인하면 그 칸이 빛남) → 학년별 보충 1·심화 1 카드(편집·승인·반려, 근거 질문) → 학년별 학습지 인쇄
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Check, CircleCheck, Layers, Lock, MessageSquareQuote, Pencil, Printer, ShieldX, Users, Wand2, X } from 'lucide-react';
import type { AiSource, Cluster, ClusterRun, NextLessonCard, StandardEntry } from '../../../shared/contracts';
import { checkLesson, errorsOf } from '../../../shared/check/timeline';
import { buildStudentSheet, leaksTeacherNote, nextLessonPreview } from '../../../shared/worksheet';
import { api } from '../../api';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { LanePanel } from '../../ui/LanePanel';
import { AiBadge, ApprovedStamp, RejectedTag } from '../../ui/Marks';
import { PageHeader, Section } from '../../ui/Section';
import { StatusPill } from '../../ui/StatusPill';
import { StepNo } from '../../ui/StepNo';
import { LANE_COLOR } from '../../ui/gradeColors';
import { useApp } from '../App';
import { useLive } from '../live';
import { CardView } from '../components/CardView';
import { TeacherPathLegend, TimelineGrid, TimelineLegend } from '../components/TimelineGrid';
import { RuleText } from '../components/rules';
import { SourceTag, StdChip } from '../components/bits';

type Run = { source: AiSource; removed: string[] } | null;
type PrintMode = { kind: 'student'; lane: 'A' | 'B' } | { kind: 'teacher' } | null;
const KIND_ORDER = { 보충: 0, 심화: 1 } as const;

export function Next() {
  const { lesson, standards } = useApp();
  const { session, responses } = useLive();
  const [cards, setCards] = useState<NextLessonCard[]>([]);
  const [run, setRun] = useState<Run>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [print, setPrint] = useState<PrintMode>(null);
  const [hl, setHl] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const d = await api<{ cards: NextLessonCard[]; run: Run }>('/api/cards');
    setCards(d.cards);
    setRun(d.run);
  };
  useEffect(() => {
    void load();
  }, [lesson?.id]);
  useEffect(() => {
    if (session) void api<{ clusters: Cluster[]; run: ClusterRun | null }>(`/api/sessions/${session.code}/clusters`).then((d) => setClusters(d.clusters));
  }, [session?.code, cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson) return <EmptyState title="수업이 없어요" />;
  if (print) return <PrintView mode={print} cards={cards} gradeA={lesson.gradeA} gradeB={lesson.gradeB} subject={lesson.subject} onClose={() => setPrint(null)} />;

  async function generate() {
    setBusy(true);
    setErr('');
    try {
      const d = await api<{ cards: NextLessonCard[]; run: Run }>('/api/cards/generate', { body: { sessionCode: session?.code } });
      setCards(d.cards);
      setRun(d.run);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const preview = nextLessonPreview(lesson, cards);
  const replace = (c: NextLessonCard) => {
    setCards((cs) => cs.map((x) => (x.id === c.id ? c : x)));
    if (c.status === 'approved') {
      // 승인한 카드가 들어갈 다음 차시 □ 칸을 보여 주고 잠깐 빛낸다
      setHl(preview.blocks.filter((b) => b.lane === c.lane && b.mode === 'INDIRECT').map((b) => b.id));
      window.requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      window.setTimeout(() => setHl([]), 2200);
    }
  };

  const lookup = (c: string) => standards.get(c);
  const pv = checkLesson(preview, { lookup });
  const pvErrors = errorsOf(pv);
  const approvedLane = (l: 'A' | 'B') => cards.some((c) => c.lane === l && c.status === 'approved');
  const g = (l: 'A' | 'B') => (l === 'A' ? lesson.gradeA : lesson.gradeB);
  const nApproved = cards.filter((c) => c.status === 'approved').length;

  return (
    <div>
      <PageHeader
        eyebrow="4단계 · 다음 차시"
        scene="S4"
        title="다음 차시 카드"
        desc="질문 묶음으로 다음 차시 간접지도 시간(10분 안팎)에 선생님 없이 할 학년별 보충·심화 카드를 만들어요. 승인한 카드만 인쇄돼요."
        actions={
          <>
            {run && <SourceTag s={run.source} />}
            {cards.length > 0 &&
              (nApproved === cards.length ? (
                <ApprovedStamp>
                  승인 <span className="tabular-nums">{nApproved}/{cards.length}</span>
                </ApprovedStamp>
              ) : (
                <Badge tone="ink">
                  승인 <span className="tabular-nums">{nApproved}/{cards.length}</span>
                </Badge>
              ))}
            <button className="btn-primary" onClick={generate} disabled={busy} data-testid="gen-cards">
              <Wand2 size={15} aria-hidden /> {busy ? '만드는 중…' : cards.length ? '다시 만들기' : '카드 만들기'}
            </button>
          </>
        }
      />
      {err && (
        <p className="mb-3 text-sm text-bad-700 dark:text-bad-300">
          {err} {err.includes('묶기') && <Link className="underline" to="/live">질문함으로</Link>}
        </p>
      )}
      {!cards.length ? (
        <EmptyState icon={<Layers size={20} aria-hidden />} title="아직 카드가 없어요" body="질문함에서 AI로 묶기를 한 뒤 카드 만들기를 누르세요. 학년마다 보충 1장·심화 1장이 나와요." />
      ) : (
        <div className="space-y-5">
          <div ref={previewRef} className="scroll-mt-20">
            <Section title="다음 차시 미리보기" desc="승인한 카드가 다음 차시 간접지도(□) 칸에 들어가요. 이 미리보기도 검사기를 통과해야 해요." actions={<TimelineLegend />}>
              <TimelineGrid gradeA={lesson.gradeA} gradeB={lesson.gradeB} durationMin={lesson.durationMin} blocks={preview.blocks} violations={pv} compact highlightIds={hl} />
              <TeacherPathLegend blocks={preview.blocks} gradeA={lesson.gradeA} gradeB={lesson.gradeB} durationMin={lesson.durationMin} />
              <p className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold ring-1 ${pvErrors.length ? 'bg-bad-50 text-bad-800 ring-bad-600/20 dark:bg-bad-500/10 dark:text-bad-200' : 'bg-ok-50 text-ok-800 ring-ok-600/20 dark:bg-ok-500/10 dark:text-ok-200'}`} data-testid="preview-check">
                {pvErrors.length ? <ShieldX size={15} aria-hidden /> : <CircleCheck size={15} aria-hidden />}
                {pvErrors.length ? (
                  <>
                    고칠 곳 {pvErrors.length}: <RuleText text={pvErrors[0].message} />
                  </>
                ) : (
                  `검사 통과 (고칠 곳 0 · 살펴볼 곳 ${pv.length})`
                )}
              </p>
            </Section>
          </div>
          {/* 보충끼리·심화끼리 같은 줄에 오게 두 학년 열을 subgrid로 맞춘다 */}
          <div className="grid gap-5 xl:grid-cols-2 xl:grid-rows-[auto_auto_auto]">
            {(['A', 'B'] as const).map((l) => (
              <LanePanel key={l} lane={l} title={`${g(l)}학년`} meta="보충 1 · 심화 1" className="space-y-3 xl:row-span-3 xl:grid xl:grid-rows-subgrid xl:gap-3 xl:space-y-0">
                {cards
                  .filter((c) => c.lane === l)
                  .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
                  .map((c) => (
                    <CardEditor key={c.id} c={c} grade={g(l)} clusters={clusters} responses={responses} onChange={replace} std={lookup(c.targetCode)} />
                  ))}
              </LanePanel>
            ))}
          </div>
          {run && run.removed.length > 0 && <p className="text-xs text-ink-600 dark:text-board-300">코드 검사로 고친 것: {run.removed.join(' · ')}</p>}
          <Section title="인쇄" desc="학생판에는 교사 메모와 정답 힌트가 없어요. 승인한 카드만 인쇄돼요." className="no-print">
            <div className="flex flex-wrap gap-2">
              {(['A', 'B'] as const).map((l) => (
                <button key={l} className="btn-ghost" disabled={!approvedLane(l)} onClick={() => setPrint({ kind: 'student', lane: l })} data-testid={`print-student-${l}`} title={approvedLane(l) ? '' : '승인한 카드가 없어요'}>
                  {approvedLane(l) ? <Printer size={15} aria-hidden /> : <Lock size={15} aria-hidden />} {g(l)}학년 학생판
                </button>
              ))}
              <button className="btn-ghost" disabled={!cards.some((c) => c.status === 'approved')} onClick={() => setPrint({ kind: 'teacher' })} data-testid="print-teacher">
                <Printer size={15} aria-hidden /> 교사판
              </button>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function CardEditor({ c, grade, clusters, responses, onChange, std }: { c: NextLessonCard; grade: number; clusters: Cluster[]; responses: { id: string; text: string }[]; onChange: (c: NextLessonCard) => void; std?: StandardEntry }) {
  const [title, setTitle] = useState(c.title);
  const [steps, setSteps] = useState(c.card.steps.join('\n'));
  const [note, setNote] = useState(c.teacherNote);
  const [editSteps, setEditSteps] = useState(false);
  const [msg, setMsg] = useState('');
  const [justApproved, setJustApproved] = useState(false);
  useEffect(() => {
    setTitle(c.title);
    setSteps(c.card.steps.join('\n'));
    setNote(c.teacherNote);
  }, [c.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = title !== c.title || steps !== c.card.steps.join('\n') || note !== c.teacherNote;

  async function save() {
    setMsg('');
    try {
      const next = await api<NextLessonCard>(`/api/cards/${c.id}`, { method: 'PUT', body: { title, teacherNote: note, card: { ...c.card, steps: steps.split('\n').map((s) => s.trim()).filter(Boolean) } } });
      onChange(next);
      return next;
    } catch (e) {
      setMsg((e as Error).message);
      return null;
    }
  }
  async function act(action: 'approve' | 'reject') {
    if (dirty && !(await save())) return;
    try {
      onChange(await api<NextLessonCard>(`/api/cards/${c.id}/${action}`, { method: 'POST' }));
      setJustApproved(action === 'approve');
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  const level = std?.levels?.[c.targetLevel];
  const approved = c.status === 'approved';
  const rejected = c.status === 'rejected';
  const lc = LANE_COLOR[c.lane];
  // 틀: AI 초안 = 라벤더 점선, 승인 = 칠판 초록 실선(노랑은 도장 하나만), 반려 = 회색 실선(흐리게 하지 않아 글은 그대로 읽힘)
  const frame = approved ? 'border-solid border-board-700 dark:border-board-400' : rejected ? 'border-solid border-ink-300 bg-paper-deep dark:border-board-600' : 'border-dashed border-ai-400 dark:border-ai-300/70';
  const stepList = steps.split('\n').map((s) => s.trim()).filter(Boolean);
  // 근거 질문: 묶음 → 학생 원문 1~2개 + 건수
  const src = c.basedOnClusterIds.map((id) => clusters.find((x) => x.id === id)).filter((x): x is Cluster => !!x);
  const qIds = src.flatMap((x) => x.questionIds);
  const quotes = src
    .map((x) => x.representativeId)
    .concat(qIds)
    .filter((id, i, a) => a.indexOf(id) === i)
    .map((id) => responses.find((r) => r.id === id)?.text)
    .filter((t): t is string => !!t)
    .slice(0, 2);

  return (
    <article className={`relative flex flex-col overflow-hidden rounded-xl border-2 bg-paper-card shadow-paper dark:bg-board-900 ${frame}`} data-testid={`card-${c.lane}-${c.kind}`}>
      <header className={`relative flex flex-wrap items-center gap-2 py-2.5 pl-5 pr-4 ${rejected ? 'bg-ink-100 dark:bg-board-800' : lc.soft}`}>
        <span className={`absolute inset-y-0 left-0 w-1 ${rejected ? 'bg-ink-400' : lc.bar}`} aria-hidden />
        <span className={`rounded-md bg-paper-card px-2 py-0.5 text-xs font-extrabold ring-1 ring-inset dark:bg-board-900 ${rejected ? 'text-ink-700 ring-ink-300' : `${lc.text} ${c.lane === 'A' ? 'ring-lo-300' : 'ring-hi-300'}`}`}>{c.kind}</span>
        <span className={`text-sm font-bold ${rejected ? 'text-ink-700 dark:text-ink-200' : lc.text}`}>
          {grade}학년 · 혼자 해 보는 {c.minutes}분
        </span>
        <span className="ml-auto">{approved ? <ApprovedStamp animate={justApproved} /> : rejected ? <RejectedTag /> : <AiBadge>AI 초안 · 승인 대기</AiBadge>}</span>
      </header>

      <div className="flex-1 space-y-3 p-4">
        <input className={`input-inline text-xl font-extrabold tracking-tight text-ink-900 dark:text-chalkwhite ${rejected ? 'line-through decoration-ink-400' : ''}`} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="카드 제목" data-testid="card-title" />
        <div className="flex flex-wrap items-center gap-1.5">
          <StdChip code={c.targetCode} entry={std} lane={c.lane} />
          <Badge tone="ink">목표 성취수준 {c.targetLevel}</Badge>
          <Badge tone="ink">
            <Users size={11} aria-hidden /> {c.card.withWhom}
          </Badge>
        </div>

        {/* 이 카드가 어디서 나왔나: 학생 질문 건수 + 원문 */}
        <div className="rounded-lg border border-ink-200 bg-paper px-3 py-2.5 dark:border-board-700 dark:bg-board-950/40" data-testid="card-source">
          {src.length ? (
            <>
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-800 dark:text-ink-100">
                <MessageSquareQuote size={15} aria-hidden className="shrink-0 text-ink-600 dark:text-board-300" />
                <span>
                  이 카드는 {grade}학년 질문 <b className="tabular-nums">{qIds.length}건</b>에서 나왔어요
                </span>
              </p>
              {quotes.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {quotes.map((q) => (
                    <li key={q} className={`border-l-[3px] pl-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200 ${c.lane === 'A' ? 'border-lo-400' : 'border-hi-400'}`}>
                      “{q}”
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1.5 text-xs text-ink-600 dark:text-board-300">묶음: {src.map((x) => x.label).join(' / ')}</p>
            </>
          ) : (
            <p className="text-sm text-ink-700 dark:text-ink-200">질문 묶음 없이 성취기준 다음 단계로 만들었어요.</p>
          )}
        </div>

        {level && (
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm leading-relaxed text-ink-700 dark:bg-board-800/50 dark:text-ink-200">
            <b className="text-ink-600 dark:text-board-300">성취수준 {c.targetLevel}</b> (원문 진술) “{level}”
          </p>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-ink-700 dark:text-board-200">이렇게 해요</span>
            <button className="btn-link" onClick={() => setEditSteps((v) => !v)}>
              <Pencil size={11} aria-hidden /> {editSteps ? '고치기 끝' : '단계 고치기'}
            </button>
          </div>
          {editSteps ? (
            <textarea className="input text-sm" rows={Math.max(4, stepList.length + 1)} value={steps} onChange={(e) => setSteps(e.target.value)} aria-label="단계(한 줄에 하나, 2~5개)" />
          ) : (
            <ol className="space-y-1.5">
              {stepList.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-base leading-relaxed text-ink-800 dark:text-ink-100">
                  <StepNo n={i + 1} tone="lane" className={`mt-0.5 ${rejected ? 'bg-ink-500' : lc.solid}`} />
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <CardView card={c.card} layout="stacked" hideSteps />

        <label className="block rounded-lg bg-paper-deep p-2.5 ring-1 ring-ink-200 dark:bg-board-950/40 dark:ring-board-700">
          <span className="mb-1 flex items-center gap-1 text-2xs font-bold text-ink-800 dark:text-ink-100">
            <Lock size={11} aria-hidden /> 교사 메모 · 학생판에 안 나가요
          </span>
          <textarea className="input min-h-[48px] text-sm" value={note} onChange={(e) => setNote(e.target.value)} data-testid="teacher-note" />
        </label>
        {msg && <p className="text-sm text-bad-700 dark:text-bad-300">{msg}</p>}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-ink-100 bg-ink-50/60 px-4 py-2.5 dark:border-board-700 dark:bg-board-950/30">
        {dirty && (
          <button className="btn-ghost btn-sm" onClick={() => void save()}>
            저장
          </button>
        )}
        <StatusPill tone={approved ? 'ok' : 'idle'} label={approved ? '인쇄할 수 있어요' : rejected ? '인쇄에서 빠져요' : '승인하면 인쇄돼요'} />
        <div className="ml-auto flex gap-2">
          {!rejected && (
            <button className="btn-ghost btn-sm" onClick={() => void act('reject')}>
              <X size={13} aria-hidden /> 반려
            </button>
          )}
          {(!approved || dirty) && (
            <button className="btn-primary btn-sm" onClick={() => void act('approve')} data-testid="approve-card">
              <Check size={13} aria-hidden /> {approved ? '다시 승인' : '승인'}
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

/** 인쇄 화면: 이 화면이 뜨는 동안 편집 화면(교사 메모 포함)은 DOM에서 빠진다 */
function PrintView({ mode, cards, gradeA, gradeB, subject, onClose }: { mode: NonNullable<PrintMode>; cards: NextLessonCard[]; gradeA: number; gradeB: number; subject: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);
  const approved = cards.filter((c) => c.status === 'approved');
  const list = mode.kind === 'student' ? approved.filter((c) => c.lane === mode.lane) : approved;
  // 2차 방어: 렌더된 학생판에 교사 메모 문자열이 있으면 막는다
  useLayoutEffect(() => {
    if (mode.kind === 'student' && ref.current && leaksTeacherNote(ref.current.innerHTML, cards.map((c) => c.teacherNote))) setBlocked(true);
  }, [mode, cards]);
  const g = (l: 'A' | 'B') => (l === 'A' ? gradeA : gradeB);
  const today = new Date().toLocaleDateString('ko-KR');
  return (
    <div className="mx-auto max-w-[820px]">
      <Card className="no-print mb-5 flex flex-wrap items-center gap-2 p-3">
        <button className="btn-ghost btn-sm" onClick={onClose} data-testid="close-print">
          <ArrowLeft size={13} aria-hidden /> 돌아가기
        </button>
        <b className="text-sm text-ink-900 dark:text-chalkwhite">{mode.kind === 'student' ? `${g(mode.lane)}학년 학생판` : '교사판'} 인쇄 미리보기</b>
        <Badge tone="ink">A4</Badge>
        {mode.kind === 'student' && <Badge tone="ok">교사 메모 없음 확인</Badge>}
        <button className="btn-primary btn-sm ml-auto" onClick={() => window.print()} disabled={blocked} data-testid="do-print">
          <Printer size={13} aria-hidden /> 인쇄
        </button>
        {mode.kind === 'student' && <p className="w-full text-xs text-ink-600 dark:text-board-300">단계 문장은 AI 초안 그대로예요(선생님이 고친 곳 제외). 아이 말투로 바꾸려면 카드에서 &lsquo;단계 고치기&rsquo;를 쓰세요.</p>}
      </Card>
      {blocked ? (
        <p className="text-bad-700 dark:text-bad-300">학생판에 교사 메모가 섞여 인쇄를 막았어요.</p>
      ) : (
        <div ref={ref} data-testid={mode.kind === 'student' ? 'student-sheet' : 'teacher-sheet'}>
          {mode.kind === 'teacher' && (
            <header className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b-2 border-ink-800 pb-2 text-ink-900 dark:border-ink-300 dark:text-ink-100">
              <b className="text-lg">
                {gradeA}·{gradeB}학년 {subject} · 다음 차시 카드 · 교사용
              </b>
              <span className="text-sm">{today}</span>
            </header>
          )}
          {list.map((c, i) => {
            if (mode.kind === 'student') {
              const s = buildStudentSheet(c, g(c.lane));
              return (
                <article key={c.id} className={`avoid-break mb-6 overflow-hidden rounded-2xl border-2 border-ink-800 bg-white text-ink-900 print:mb-0 print:flex print:min-h-[262mm] print:flex-col ${i > 0 ? 'print-break' : ''}`}>
                  <div className="flex items-center gap-3 border-b-2 border-ink-800 px-6 py-3">
                    {/* 학년 번호 상자: 배경 그래픽을 꺼도 색이 나오게(print-exact), 흑백이면 숫자로 구분 */}
                    <span className={`print-exact grid h-9 w-9 place-items-center rounded-lg text-lg font-extrabold text-white ${LANE_COLOR[c.lane].solid}`}>{s.grade}</span>
                    <div className="text-sm font-semibold text-ink-700">
                      {s.grade}학년 · 혼자 해 보는 시간 <b className="text-ink-900">{s.minutes}분</b> · {s.withWhom}
                    </div>
                    <div className="ml-auto text-xs font-bold text-ink-600">함께반</div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="mb-5 text-[1.625rem] font-extrabold leading-tight tracking-tight">{s.title}</h2>
                    <ol className="mb-5 space-y-3">
                      {s.steps.map((x, j) => (
                        <li key={j} className="flex gap-3 text-lg leading-relaxed">
                          <StepNo n={j + 1} size="lg" tone="print" />
                          <span className="pt-0.5">{x}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mb-5 grid grid-cols-2 gap-2 text-base">
                      {[
                        ['다 했으면', s.doneSignal],
                        ['막히면', s.ifStuck],
                        ['만들 것', s.output],
                        ['도우미', s.guideRole],
                      ].map(([k, v]) => (
                        // 배경이 안 나와도 칸이 보이게 테두리
                        <p key={k} className="rounded-lg border border-ink-300 bg-ink-100 px-3 py-2">
                          <b>{k}</b> {v}
                        </p>
                      ))}
                    </div>
                    <div className="min-h-48 rounded-xl border-2 border-ink-400 p-3 text-sm text-ink-600 print:min-h-[100mm] print:flex-1">여기에 써 보세요</div>
                    <div className="mt-3 text-xs text-ink-700">이름은 쓰지 않아요.</div>
                  </div>
                </article>
              );
            }
            return (
              <article key={c.id} className="avoid-break mb-4 rounded-xl border border-ink-300 bg-white p-4 text-sm text-ink-900">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <b className="text-base">
                    {g(c.lane)}학년 {c.kind} · {c.title}
                  </b>
                  <span className="font-mono text-xs text-ink-700">
                    [{c.targetCode}] 목표 {c.targetLevel} · {c.minutes}분
                  </span>
                </div>
                <ol className="mb-2 list-decimal space-y-0.5 pl-5">
                  {c.card.steps.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ol>
                <p className="text-ink-800">
                  끝 신호: {c.card.doneSignal} / 막힐 때: {c.card.ifStuck} / 산출물: {c.card.output} / 안내 역할: {c.card.guideRole}
                </p>
                <p className="mt-2 rounded border border-ink-300 bg-paper-deep px-2 py-1">교사 메모: {c.teacherNote}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
