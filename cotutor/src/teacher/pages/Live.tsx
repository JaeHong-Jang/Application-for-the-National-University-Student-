// S3 질문함: 수업 시작(QR) → 지금 질문 → 학생 제출 실시간(SSE, 최신이 위) → AI로 묶기(끝나면 묶음으로 스크롤) → 주제 고치기·질문 옮기기
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AlertOctagon, ArrowRight, BookA, ChevronRight, CircleAlert, Compass, Eye, EyeOff, Layers, Lightbulb, MessageSquareText, MessagesSquare, Pencil, Play, QrCode as QrIcon, Send, Shuffle, Sparkles, Users, type LucideIcon } from 'lucide-react';
import type { Cluster, ClusterRun, Session, StudentResponse } from '../../../shared/contracts';
import { api } from '../../api';
import { Badge } from '../../ui/Badge';
import { CopyButton } from '../../ui/CopyButton';
import { EmptyState } from '../../ui/EmptyState';
import { LanePanel } from '../../ui/LanePanel';
import { AiBadge } from '../../ui/Marks';
import { QrCode } from '../../ui/QrCode';
import { PageHeader, Section } from '../../ui/Section';
import { StatTile } from '../../ui/StatTile';
import { StatusPill } from '../../ui/StatusPill';
import { LANE_COLOR } from '../../ui/gradeColors';
import { useApp } from '../App';
import { useLive } from '../live';
import { SourceTag, StdChip } from '../components/bits';

const PII_KO: Record<string, string> = { PHONE: '전화번호', EMAIL: '이메일', RRN: '주민번호', NAME_LIKE: '이름', ADDRESS_LIKE: '주소' };
// 질문 유형은 상태(위반·주의)가 아니라 분류 → 중립 칩 + 유형 아이콘
const TYPE_ICON: Record<string, LucideIcon> = { 오개념: CircleAlert, '절차 실수': Shuffle, 어휘: BookA, '호기심·확장': Lightbulb, '수업 운영': Compass, 기타: MessagesSquare };

/** QR이 휴대폰에서 열리지 않는 주소인지(localhost·사설 IP) */
export function isLocalHost(host: string) {
  return /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/.test(host);
}

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 45) return '방금';
  if (s < 3600) return `${Math.round(s / 60)}분 전`;
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
}

export function Live() {
  const { lesson, meta, standards } = useApp();
  const { session, setSession, responses, safety, connected, transport, resetSignal } = useLive();
  const [promptText, setPromptText] = useState('지도에서 헷갈리는 것을 적어 보세요');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [run, setRun] = useState<ClusterRun | null>(null);
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const clustersRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!session) return setClusters([]), setRun(null);
    void api<{ clusters: Cluster[]; run: ClusterRun | null }>(`/api/sessions/${session.code}/clusters`).then((d) => (setClusters(d.clusters), setRun(d.run)));
  }, [session?.code, resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const base = meta?.publicBaseUrl || location.origin;
  const url = session ? `${base}/s/?c=${session.code}` : '';
  const host = (() => {
    try {
      return new URL(base).hostname;
    } catch {
      return '';
    }
  })();
  const byId = useMemo(() => new Map(responses.map((r) => [r.id, r])), [responses]);

  async function start() {
    setBusy('start');
    try {
      setSession(await api<Session>('/api/sessions', { method: 'POST' }));
    } finally {
      setBusy('');
    }
  }
  async function setPrompt() {
    if (!session) return;
    setSession(await api<Session>(`/api/sessions/${session.code}/prompt`, { body: { text: promptText } }));
  }
  async function fake() {
    if (!session) return;
    await api(`/api/sessions/${session.code}/fake-students`, { method: 'POST' });
  }
  async function cluster() {
    if (!session) return;
    setBusy('cluster');
    try {
      const d = await api<{ clusters: Cluster[]; run: ClusterRun }>(`/api/sessions/${session.code}/cluster`, { method: 'POST' });
      setClusters(d.clusters);
      setRun(d.run);
      // 묶음은 질문 목록 위에 생긴다 → 그 자리로 옮겨 보여 준다
      window.requestAnimationFrame(() => clustersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } finally {
      setBusy('');
    }
  }
  async function reload() {
    if (!session) return;
    const d = await api<{ clusters: Cluster[]; run: ClusterRun | null }>(`/api/sessions/${session.code}/clusters`);
    setClusters(d.clusters);
    setRun(d.run);
  }
  async function rename(c: Cluster, label: string) {
    if (label.trim() && label !== c.label) await api(`/api/clusters/${c.id}`, { method: 'PUT', body: { label } }), await reload();
  }
  async function move(responseId: string, clusterId: string) {
    await api(`/api/responses/${responseId}/move`, { body: { clusterId: clusterId || null } });
    await reload();
  }

  if (!lesson) return <EmptyState title="수업이 없어요" body="수업 설계에서 초안을 먼저 만드세요." />;
  const grades = [lesson.gradeA, lesson.gradeB];
  const safetyIds = new Set([...safety.map((s) => s.responseId), ...(run?.flags.filter((f) => f.kind === 'SAFETY').map((f) => f.questionId) ?? [])]);
  const masked = responses.filter((r) => r.piiFlags.length).length;
  const hasClusters = clusters.length > 0 || !!run;

  const clusterSection = hasClusters && (
    <div ref={clustersRef} className="scroll-mt-20" data-testid="clusters-section">
      <Section
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Sparkles size={18} aria-hidden className="text-ai-600 dark:text-ai-300" /> 질문 {clusters.reduce((n, c) => n + c.questionIds.length, 0)}개 → {clusters.length}개 묶음
          </span>
        }
        desc="AI가 선생님용 진단 문장으로 묶은 초안이에요. 주제를 고치고, 질문을 다른 묶음으로 옮길 수 있어요."
        actions={
          <>
            <SourceTag s={run?.source} />
            <Link className="btn-primary btn-sm" to="/next" data-testid="go-next">
              다음 차시 카드로 <ArrowRight size={13} aria-hidden />
            </Link>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 [&>*:last-child:nth-child(odd)]:md:col-span-2" data-testid="clusters">
          {clusters.map((c) => {
            const TypeIcon = TYPE_ICON[c.type] ?? MessagesSquare;
            return (
              // AI 초안 묶음 = 라벤더 점선 틀(다음 차시 카드와 같은 규칙), 선생님이 고치면 실선
              <article key={c.id} className={`relative flex flex-col overflow-hidden rounded-xl border-2 bg-paper-card py-3 pl-4 pr-3 shadow-paper dark:bg-board-900 ${c.teacherEdited ? `border-solid ${LANE_COLOR[c.lane].border}` : 'border-dashed border-ai-400 dark:border-ai-300/60'}`} data-testid="cluster-card">
                <span className={`absolute inset-y-0 left-0 w-1.5 ${LANE_COLOR[c.lane].bar}`} aria-hidden />
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={c.lane === 'A' ? 'lo' : 'hi'}>{c.lane === 'A' ? lesson.gradeA : lesson.gradeB}학년</Badge>
                  <Badge tone="ink">
                    <TypeIcon size={11} aria-hidden /> {c.type}
                  </Badge>
                  {c.teacherEdited ? (
                    <Badge tone="ink">
                      <Pencil size={11} aria-hidden /> 선생님이 고침
                    </Badge>
                  ) : (
                    <AiBadge />
                  )}
                </div>
                <div className="mt-2 flex items-start gap-3">
                  <input className="input-inline min-w-0 flex-1 text-lg font-bold text-ink-900 dark:text-ink-50" defaultValue={c.label} onBlur={(e) => void rename(c, e.target.value)} aria-label="묶음 주제(고칠 수 있음)" />
                  <span className="shrink-0 pt-0.5 text-right leading-none">
                    <b className="text-[1.625rem] font-extrabold tabular-nums text-ink-900 dark:text-chalkwhite">{c.questionIds.length}</b>
                    <span className="ml-0.5 text-sm font-semibold text-ink-600 dark:text-board-300">건</span>
                  </span>
                </div>
                {byId.get(c.representativeId) && (
                  <blockquote className={`mt-2 rounded-r-lg border-l-4 bg-paper py-1.5 pl-3 pr-2 text-base leading-relaxed text-ink-800 dark:bg-board-800/50 dark:text-ink-100 ${c.lane === 'A' ? 'border-lo-400' : 'border-hi-400'}`}>
                    “{byId.get(c.representativeId)!.text}”
                  </blockquote>
                )}
                <details className="group mt-2 border-t border-ink-200 pt-2 dark:border-board-700">
                  <summary className="btn-link cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    포함 기준 · 질문 {c.questionIds.length}건 보기
                    <ChevronRight size={14} aria-hidden className="transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                    <b className="text-ink-600 dark:text-board-300">포함 기준</b> {c.criteria}
                  </p>
                  <div className="mt-2">{c.linkedCode ? <StdChip code={c.linkedCode} entry={standards.get(c.linkedCode)} lane={c.lane} /> : <span className="text-xs text-ink-600 dark:text-board-300">연결 성취기준 없음</span>}</div>
                  <ul className="mt-2 space-y-1">
                    {c.questionIds.map((id) => (
                      <li key={id} className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                        <span className="min-w-0 flex-1 truncate">{byId.get(id)?.text ?? id}</span>
                        <MoveSelect clusters={clusters} current={c.id} lane={c.lane} onMove={(cid) => void move(id, cid)} />
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            );
          })}
        </div>
        {run && run.unclustered.length > 0 && (
          <div className="mt-4 rounded-xl border border-ink-200 p-3 dark:border-board-700">
            <div className="mb-1.5 text-sm font-bold text-ink-700 dark:text-ink-200">미분류 {run.unclustered.length}건</div>
            <ul className="space-y-1">
              {run.unclustered.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <span className="min-w-0 flex-1 truncate">{byId.get(id)?.text ?? id}</span>
                  <MoveSelect clusters={clusters} current="" lane={byId.get(id)?.grade === lesson.gradeA ? 'A' : 'B'} onMove={(cid) => void move(id, cid)} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {run && run.removed.length > 0 && <p className="mt-2 text-xs text-ink-600 dark:text-board-300">코드 검사로 고친 것: {run.removed.join(' · ')}</p>}
      </Section>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="3단계 · 질문 모으기"
        scene="S3"
        title="질문함"
        desc="학생이 QR로 보낸 질문을 학년별로 모으고, AI가 비슷한 것끼리 묶어요. 계정과 이름은 받지 않아요."
        actions={
          <>
            <StatusPill tone={connected ? 'ok' : 'warn'} label={connected ? (transport === 'sse' ? '실시간 연결' : '2초마다 확인') : '다시 연결하는 중'} pulse={connected} />
            {!session && (
              <button className="btn-primary" onClick={start} disabled={busy === 'start'} data-testid="start-session">
                <Play size={15} aria-hidden /> 수업 시작
              </button>
            )}
          </>
        }
      />
      {safetyIds.size > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border-2 border-bad-600 bg-bad-50 px-4 py-3 text-base text-bad-900 dark:border-bad-400 dark:bg-bad-500/10 dark:text-bad-100" role="alert" data-testid="safety-alert">
          <AlertOctagon size={20} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <b>교사 확인 필요: 위기 신호가 있는 글 {safetyIds.size}건.</b> 이 글은 AI 묶기에서 빠지고 AI가 해석하지 않아요. 해당 학생과 직접 이야기해 주세요.
          </div>
        </div>
      )}
      {!session ? (
        <section className="chalkboard relative overflow-hidden rounded-2xl shadow-board ring-1 ring-board-950/40 dark:ring-chalkwhite/15">
          <div className="relative flex flex-col items-start gap-4 p-6 pb-9 sm:flex-row sm:items-center sm:p-8 sm:pb-10">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-chalkwhite/30">
              <QrIcon size={28} aria-hidden className="text-chalk-300" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold tracking-tight">진행 중인 수업이 없어요</h2>
              <p className="mt-1 text-base text-board-100">수업 시작을 누르면 4자리 코드와 QR이 생겨요. 학생은 휴대폰 카메라로 찍기만 하면 돼요.</p>
            </div>
            <button className="btn-chalk btn-lg shadow-lg shadow-black/25" onClick={start} data-testid="start-session-2">
              <Play size={16} aria-hidden /> 수업 시작
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            <StatTile label="들어온 질문" value={responses.length} unit="건" icon={<MessageSquareText size={14} aria-hidden />} />
            <StatTile label={`${grades[0]}학년`} value={responses.filter((r) => r.grade === grades[0]).length} unit="건" tone="lo" bar icon={<span className={`h-2 w-2 rounded-full ${LANE_COLOR.A.dot}`} />} />
            <StatTile label={`${grades[1]}학년`} value={responses.filter((r) => r.grade === grades[1]).length} unit="건" tone="hi" bar icon={<span className={`h-2 w-2 rounded-full ${LANE_COLOR.B.dot}`} />} />
            <StatTile label="개인정보 가림" value={masked} unit="건" icon={<EyeOff size={14} aria-hidden />} />
          </div>

          <div className="grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]">
            {/* 왼쪽 칸: 넓은 화면에서는 붙어 있어 묶음을 볼 때도 QR이 늘 보인다(높이가 넘치면 칸 안에서 스크롤) */}
            <div className="min-w-0 space-y-5 xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100vh-5.5rem)] xl:self-start xl:overflow-y-auto xl:pb-1">
              <section className="chalkboard relative overflow-hidden rounded-2xl shadow-board ring-1 ring-board-950/40 dark:ring-chalkwhite/15">
                <div className="relative flex flex-col items-center p-5 pb-8 text-center">
                  <div className="mb-3 text-sm font-bold text-board-100">학생 접속 · 휴대폰 카메라로 찍기</div>
                  <div className="rounded-xl bg-white p-2 shadow-xl shadow-black/30 ring-4 ring-wood-500/70">
                    <QrCode value={url} size={hasClusters ? 150 : 210} />
                  </div>
                  <div className="mt-4 text-2xs font-semibold tracking-[0.2em] text-board-200">수업 코드</div>
                  <div className="font-mono text-5xl font-semibold tracking-[0.25em] text-chalkwhite" data-testid="session-code">
                    {session.code}
                  </div>
                  <div className="dev mt-2 break-all font-mono text-2xs text-board-200">{url}</div>
                  <div className="mt-3">
                    <CopyButton text={url} label="주소 복사" />
                  </div>
                  {isLocalHost(host) && (
                    <p className="mt-3 rounded-lg border border-bad-300/70 bg-bad-500/20 px-3 py-2 text-left text-xs font-semibold text-bad-50" data-testid="localhost-warning">
                      이 주소({host})는 학생 휴대폰에서 열리지 않아요. PUBLIC_BASE_URL에 공개 주소(배포 URL 또는 cloudflared)를 넣으세요.
                    </p>
                  )}
                </div>
              </section>
              <Section title="지금 질문" desc="학생 화면 맨 위에 크게 보여요">
                <div className="flex gap-2">
                  <input className="input" value={promptText} maxLength={120} onChange={(e) => setPromptText(e.target.value)} data-testid="prompt-input" aria-label="학생 화면에 보일 질문" />
                  <button className="btn-ghost" onClick={setPrompt} data-testid="set-prompt">
                    <Send size={15} aria-hidden /> 보내기
                  </button>
                </div>
                {session.prompt && (
                  <p className="mt-3 rounded-lg bg-paper-deep px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-ink-200 dark:bg-board-950/40 dark:text-ink-100 dark:ring-board-700">
                    학생 화면: “{session.prompt.text}”
                  </p>
                )}
              </Section>
              <Section title="데모 도구" desc="심사 시연용이에요. 실제 수업에서는 쓰지 않아요.">
                <button className="btn-ghost w-full" onClick={fake} data-testid="fake-students">
                  <Users size={15} aria-hidden /> 가상 학생 보내기 (질문 12개)
                </button>
              </Section>
            </div>

            <div className="min-w-0 space-y-5">
              {/* 묶음이 생기면 데모의 핵심(AI 묶음)을 질문 목록 위로 */}
              {clusterSection}
              <Section
                title={`들어온 질문 ${responses.length}건`}
                desc="개인정보는 가려서 보여요. 원문은 눈 모양을 눌러 선생님만 봐요. 새 질문이 맨 위에 와요."
                actions={
                  <button className="btn-primary" onClick={cluster} disabled={!responses.length || busy === 'cluster'} data-testid="cluster">
                    <Layers size={15} aria-hidden /> {busy === 'cluster' ? '묶는 중…' : hasClusters ? 'AI로 다시 묶기' : 'AI로 묶기'}
                  </button>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {grades.map((g, i) => {
                    const lane = i === 0 ? 'A' : 'B';
                    // 새 질문이 열 맨 위에(맨 아래면 화면 밖에서 도착한다)
                    const list = responses.filter((r) => r.grade === g).slice().reverse();
                    return (
                      <LanePanel key={g} lane={lane} level={3} title={`${g}학년`} meta={`${list.length}건`} testId={`col-${lane}`}>
                        <ul className="space-y-2">
                          {list.map((r) => (
                            <ResponseCard
                              key={r.id}
                              r={r}
                              now={now}
                              fresh={Date.parse(r.createdAt) > mountedAt.current - 1000}
                              open={open.has(r.id)}
                              safety={safetyIds.has(r.id)}
                              toggle={() => setOpen((s) => (s.has(r.id) ? (s.delete(r.id), new Set(s)) : new Set(s).add(r.id)))}
                            />
                          ))}
                          {!list.length && (
                            <li>
                              <EmptyState size="sm" title="아직 없어요" />
                            </li>
                          )}
                        </ul>
                      </LanePanel>
                    );
                  })}
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MoveSelect({ clusters, current, lane, onMove }: { clusters: Cluster[]; current: string; lane: string; onMove: (id: string) => void }) {
  return (
    <select className="input-sm max-w-[9rem]" value={current} onChange={(e) => onMove(e.target.value)} aria-label="다른 묶음으로 옮기기">
      <option value="">미분류</option>
      {clusters
        .filter((c) => c.lane === lane)
        .map((c) => (
          <option key={c.id} value={c.id}>
            {c.label.slice(0, 18)}
          </option>
        ))}
    </select>
  );
}

function ResponseCard({ r, now, fresh, open, toggle, safety }: { r: StudentResponse; now: number; fresh: boolean; open: boolean; toggle: () => void; safety: boolean }) {
  return (
    <li className={`rounded-lg border px-3 py-2.5 text-base shadow-paper motion-reduce:animate-none ${fresh ? 'animate-arrive' : 'animate-rise'} ${safety ? 'border-bad-300 bg-bad-50 dark:border-bad-500/40 dark:bg-bad-500/10' : 'border-ink-200 bg-paper-card dark:border-board-600 dark:bg-board-900'}`} data-testid="response-card">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 leading-relaxed text-ink-900 dark:text-ink-100">{r.text}</p>
        {r.piiFlags.length > 0 && (
          <button className="grid h-7 w-7 shrink-0 place-items-center rounded text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-board-300 dark:hover:bg-board-800" onClick={toggle} aria-label={open ? '원문 숨기기' : '원문 보기(선생님만)'} title="원문 보기(선생님만)">
            {open ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          </button>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {r.piiFlags.map((f) => (
          <Badge key={f} tone="ink">
            <EyeOff size={11} aria-hidden /> {PII_KO[f]} 가림
          </Badge>
        ))}
        {safety && <Badge tone="bad">위기 신호 · 묶기 제외</Badge>}
        <span className="ml-auto text-2xs text-ink-600 dark:text-board-300" title={new Date(r.createdAt).toLocaleString('ko-KR')}>
          {ago(r.createdAt, now)}
        </span>
      </div>
      {open && <p className="mt-1.5 rounded bg-ink-100 px-2 py-1 text-sm text-ink-800 dark:bg-board-800 dark:text-ink-200">원문(선생님만): {r.rawText || '(보관 기간이 지나 지웠어요)'}</p>}
    </li>
  );
}

