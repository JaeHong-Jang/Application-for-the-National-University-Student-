// S2 타임라인: 블록 클릭 → 상세, 모드 전환(직접↔간접), 같은 학년 인접 블록과 경계 ±5분, 편집마다 검사기 즉시 실행
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MousePointerClick, Package, Repeat, ShieldCheck, ShieldX, Undo2, Volume2, Wand2 } from 'lucide-react';
import type { AiSource, IndirectCard, Lesson, StandardEntry, TimelineBlock } from '../../../shared/contracts';
import { checkLesson, countTransitions, directMinutes, errorsOf } from '../../../shared/check/timeline';
import { api, ApiError } from '../../api';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { AiBadge, ApprovedStamp, CodeBadge, DraftOrApproved } from '../../ui/Marks';
import { PageHeader, Section } from '../../ui/Section';
import { LANE_COLOR, MODE_KO, MODE_MARK, NOISE_KO } from '../../ui/gradeColors';
import { useApp } from '../App';
import { CardView } from '../components/CardView';
import { TeacherPathLegend, TimelineGrid, TimelineLegend } from '../components/TimelineGrid';
import { ViolationPanel } from '../components/ViolationPanel';
import { RuleTag, RuleText } from '../components/rules';
import { SourceTag, StdChip } from '../components/bits';

export function Timeline() {
  const { lesson, standards, setLessonData, meta } = useApp();
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [history, setHistory] = useState<TimelineBlock[][]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [cardSrc, setCardSrc] = useState<AiSource | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lesson) setBlocks(lesson.blocks);
  }, [lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson) return <EmptyState title="수업이 없어요" body="수업 설계에서 초안을 먼저 만드세요." />;
  const work: Lesson = { ...lesson, blocks: blocks.length ? blocks : lesson.blocks };
  const lookup = (c: string) => standards.get(c);
  const violations = checkLesson(work, { lookup });
  const errors = errorsOf(violations);
  const b = blocks.find((x) => x.id === sel) ?? null;
  const g = (l: 'A' | 'B' | 'ALL') => (l === 'A' ? `${lesson.gradeA}학년` : l === 'B' ? `${lesson.gradeB}학년` : `${lesson.gradeA}·${lesson.gradeB}학년 함께`);

  async function commit(next: TimelineBlock[]) {
    setHistory((h) => [...h, blocks]);
    setBlocks(next);
    setMsg('');
    try {
      const d = await api<{ lesson: Lesson; standards: StandardEntry[] }>(`/api/lessons/${lesson!.id}`, { method: 'PUT', body: { blocks: next } });
      setLessonData(d);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  function undo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setBlocks(prev);
    void api<{ lesson: Lesson; standards: StandardEntry[] }>(`/api/lessons/${lesson!.id}`, { method: 'PUT', body: { blocks: prev } }).then(setLessonData);
  }

  // 같은 학년 인접 블록(통합 블록 제외)
  const neighbor = (blk: TimelineBlock, side: 'prev' | 'next') =>
    blocks.find((x) => x.lane === blk.lane && x.lane !== 'ALL' && (side === 'next' ? x.startMin === blk.endMin : x.endMin === blk.startMin));

  function moveEdge(side: 'start' | 'end', delta: number) {
    if (!b) return;
    const n = neighbor(b, side === 'end' ? 'next' : 'prev');
    if (!n) return;
    const next = blocks.map((x) => {
      if (x.id === b.id) return side === 'end' ? { ...x, endMin: x.endMin + delta } : { ...x, startMin: x.startMin + delta };
      if (x.id === n.id) return side === 'end' ? { ...x, startMin: x.startMin + delta } : { ...x, endMin: x.endMin + delta };
      return x;
    });
    const bad = next.some((x) => x.endMin - x.startMin < 1);
    if (bad) return setMsg('블록 길이가 0분이 되어 옮길 수 없어요.');
    void commit(next);
  }
  function toggleMode() {
    if (!b || b.lane === 'ALL') return;
    void commit(blocks.map((x) => (x.id === b.id ? { ...x, mode: x.mode === 'DIRECT' ? 'INDIRECT' : 'DIRECT', card: x.mode === 'DIRECT' ? x.card : null } : x)));
  }
  async function makeCard() {
    if (!b) return;
    setBusy(true);
    try {
      const r = await api<{ card: IndirectCard; source: AiSource }>(`/api/lessons/${lesson!.id}/blocks/${b.id}/card`, { method: 'POST' });
      setCardSrc(r.source);
      await commit(blocks.map((x) => (x.id === b.id ? { ...x, card: r.card } : x)));
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    try {
      setLessonData(await api(`/api/lessons/${lesson!.id}/approve`, { method: 'POST' }));
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : String(e));
    }
  }

  // 편집 직후 서버 응답 전에도 위반이 있으면 '승인됨'으로 보이지 않게(승인 도장은 고칠 곳 0일 때만)
  const approvedNow = lesson.status === 'approved' && errors.length === 0;
  const blockErrors = b ? violations.filter((v) => v.blockIds.includes(b.id)) : [];
  const c = b ? LANE_COLOR[b.lane] : null;

  return (
    <div>
      <PageHeader
        eyebrow="2단계 · 검사"
        scene="S2"
        title="직접 / 간접지도 타임라인"
        desc="블록을 눌러 모드를 바꾸거나 옆 블록과의 경계를 5분씩 옮겨 보세요. 바꿀 때마다 코드 검사기가 다시 봐요."
        actions={
          <>
            {!approvedNow && <DraftOrApproved approved={false} />}
            <button className="btn-ghost" onClick={undo} disabled={!history.length} data-testid="undo">
              <Undo2 size={15} aria-hidden /> 되돌리기
            </button>
            {approvedNow ? (
              <span data-testid="approve-timeline">
                <ApprovedStamp size="lg">교사 승인됨</ApprovedStamp>
              </span>
            ) : (
              <button className="btn-primary" onClick={approve} disabled={errors.length > 0} data-testid="approve-timeline">
                <ShieldCheck size={15} aria-hidden /> 교사 승인
              </button>
            )}
          </>
        }
      />
      {msg && <p className="mb-3 text-sm text-bad-700 dark:text-bad-300">{msg}</p>}
      {/* 게이트 칸은 1360 이상에서만 옆에(1280 프로젝터에서 40분 끝이 잘리지 않게) */}
      <div className="grid gap-5 min-[1360px]:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Section
            title={`${lesson.gradeA}·${lesson.gradeB}학년 ${lesson.subject} ${lesson.durationMin}분`}
            desc={`공통 주제 “${lesson.commonTheme}” · 선생님은 ■ 블록에만 있고, □ 블록은 카드로 혼자·짝이 해요.`}
            actions={<TimelineLegend />}
          >
            <TimelineGrid gradeA={lesson.gradeA} gradeB={lesson.gradeB} durationMin={lesson.durationMin} blocks={work.blocks} violations={violations} selectedId={sel} onSelect={setSel} flagged={lesson.aiMeta.flaggedBlockIds} />
            <TeacherPathLegend blocks={work.blocks} gradeA={lesson.gradeA} gradeB={lesson.gradeB} durationMin={lesson.durationMin} />
            {errors.length > 0 && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border-2 border-bad-600 bg-bad-50 px-3.5 py-3 text-base font-semibold text-bad-900 dark:border-bad-400 dark:bg-bad-500/10 dark:text-bad-100" role="alert" data-testid="error-banner">
                <ShieldX size={20} aria-hidden className="mt-0.5 shrink-0 text-bad-700 dark:text-bad-300" />
                <span>
                  <span className="mr-1.5 inline-flex rounded bg-ink-900 px-1.5 py-0.5 text-2xs text-white">
                    <RuleTag rule={errors[0].rule} />
                  </span>
                  <RuleText text={errors[0].message} />
                  {errors.length > 1 && ` 외 ${errors.length - 1}건`}
                </span>
              </div>
            )}
          </Section>

          <Card className={`relative overflow-hidden ${c ? c.border : ''}`}>
            {c && <div className={`h-1 ${b?.mode === 'INDIRECT' ? (b.lane === 'A' ? 'hatch-a' : b.lane === 'B' ? 'hatch-b' : c.bar) : c.bar}`} />}
            <div className="p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-ink-50">블록 상세</h2>
                  <p className="mt-1 text-sm text-ink-600 dark:text-board-200">
                    {b ? (
                      <>
                        <span className={`font-bold ${c!.text}`}>{g(b.lane)}</span> · {MODE_MARK[b.mode]} {MODE_KO[b.mode]} · <span className="font-mono">{b.startMin}–{b.endMin}분</span>
                      </>
                    ) : (
                      '타임라인에서 블록을 눌러 보세요'
                    )}
                  </p>
                </div>
              </div>
              {b ? (
                <div className="space-y-3 text-sm" data-testid="block-detail">
                  <p className="text-base font-medium leading-relaxed text-ink-900 dark:text-ink-100">{b.activity}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-700 dark:text-ink-200">
                    <Badge tone="ink">
                      <Package size={11} aria-hidden /> {b.materials.join(', ') || '자료 없음'}
                    </Badge>
                    <Badge tone="ink">
                      <Volume2 size={11} aria-hidden /> 소음 {NOISE_KO[b.noise]}
                    </Badge>
                    {b.standardCodes.map((code) => (
                      <StdChip key={code} code={code} entry={lookup(code)} lane={b.lane} />
                    ))}
                  </div>
                  {b.lane !== 'ALL' && (
                    <div className="flex flex-wrap gap-2 rounded-xl bg-ink-50 p-2.5 dark:bg-board-800/50">
                      <button className="btn-ghost btn-sm" onClick={toggleMode} data-testid="toggle-mode">
                        <Repeat size={13} aria-hidden /> {b.mode === 'DIRECT' ? '간접지도로 바꾸기' : '직접지도로 바꾸기'}
                      </button>
                      <span className="mx-1 hidden w-px bg-ink-200 sm:block dark:bg-board-700" aria-hidden />
                      <button className="btn-ghost btn-sm" onClick={() => moveEdge('start', -5)} disabled={!neighbor(b, 'prev')}>
                        <ArrowLeft size={13} aria-hidden /> 시작 −5분
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => moveEdge('start', 5)} disabled={!neighbor(b, 'prev')}>
                        시작 +5분 <ArrowRight size={13} aria-hidden />
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => moveEdge('end', -5)} disabled={!neighbor(b, 'next')} data-testid="end-minus">
                        <ArrowLeft size={13} aria-hidden /> 끝 −5분
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => moveEdge('end', 5)} disabled={!neighbor(b, 'next')} data-testid="end-plus">
                        끝 +5분 <ArrowRight size={13} aria-hidden />
                      </button>
                    </div>
                  )}
                  {b.mode === 'INDIRECT' &&
                    (b.card ? (
                      <div className={`rounded-xl border p-3 ${approvedNow ? 'border-ink-200 dark:border-board-600' : 'border-dashed border-ai-400 dark:border-ai-300/60'}`}>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-ink-700 dark:text-ink-200">
                          {!approvedNow && <AiBadge />} 간접지도 카드 {cardSrc && <SourceTag s={cardSrc} />}
                        </div>
                        <CardView card={b.card} />
                      </div>
                    ) : (
                      <button className="btn-primary btn-sm" onClick={makeCard} disabled={busy} data-testid="make-card">
                        <Wand2 size={13} aria-hidden /> {busy ? '만드는 중…' : '카드 만들기'}
                      </button>
                    ))}
                  {blockErrors.length > 0 && (
                    <ul className="space-y-1 text-sm">
                      {blockErrors.map((v, i) => (
                        <li key={i} className={v.severity === 'error' ? 'text-bad-700 dark:text-bad-300' : 'text-warn-800 dark:text-warn-200'}>
                          <RuleTag rule={v.rule} className="mr-1 font-bold" /> <RuleText text={v.message} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-paper px-4 py-6 text-sm text-ink-700 dark:border-board-700 dark:bg-board-950/40 dark:text-board-200">
                  <MousePointerClick size={20} aria-hidden className="shrink-0 text-board-600 dark:text-board-300" />
                  선택한 블록이 없어요. 위 타임라인에서 블록을 눌러 모드와 경계를 바꿔 보세요.
                </div>
              )}
            </div>
          </Card>
        </div>
        <Section
          title={
            <span className="flex flex-wrap items-center gap-2">
              검증 게이트 <CodeBadge>코드가 판정</CodeBadge>
            </span>
          }
          desc="고칠 곳이 0일 때만 승인할 수 있어요."
          className="self-start"
        >
          <ViolationPanel violations={violations} transitions={countTransitions(work)} direct={directMinutes(work)} grades={[lesson.gradeA, lesson.gradeB]} defaultsNote={meta?.checkDefaultsNote} />
        </Section>
      </div>
    </div>
  );
}
