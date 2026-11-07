// 한눈에: 칠판 히어로(문제 한 문장 + 분필 밑줄 = 오늘 수업에서 계산한 간접지도 분) → KPI(출처) → 이렇게 써요 → 오늘 수업(동선) · 현장 근거 → 최근 AI 실행
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpenCheck, CalendarClock, ChevronRight, ExternalLink, LayoutList, ListChecks, MessagesSquare, Play, School, Sparkles, Users, type LucideIcon,
} from 'lucide-react';
import type { AiSource, Lesson, NextLessonCard } from '../../../shared/contracts';
import { PAIR_LABEL } from '../../../shared/check/standards';
import { checkLesson, countTransitions, directMinutes, errorsOf } from '../../../shared/check/timeline';
import { api } from '../../api';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { ChalkTray, ChalkUnderline } from '../../ui/Chalk';
import { AiBadge, ApprovedStamp, CodeBadge, DraftOrApproved } from '../../ui/Marks';
import { Section } from '../../ui/Section';
import { StatTile } from '../../ui/StatTile';
import { StepNo } from '../../ui/StepNo';
import { useApp } from '../App';
import { useLive } from '../live';
import { TeacherPathLegend, TimelineGrid } from '../components/TimelineGrid';
import { SourceTag } from '../components/bits';
import { fmtMs } from '../components/Pipeline';

/** 학년별 간접지도(선생님 없이 보내는) 분. 헤드라인 숫자는 이 값만 쓴다(지어낸 숫자 금지) */
export function indirectMinutes(l: Pick<Lesson, 'blocks'>) {
  const r = { A: 0, B: 0 };
  for (const b of l.blocks) if (b.mode === 'INDIRECT' && b.lane !== 'ALL') r[b.lane] += b.endMin - b.startMin;
  return r;
}

// ---------- 히어로 오른쪽: 칠판에 분필로 그린 한 차시 루프 ----------
function LaneBars() {
  return (
    <div className="mt-2.5 space-y-1" aria-hidden>
      <div className="flex gap-0.5">
        <span className="h-2 w-3 rounded-sm bg-tg-300" />
        <span className="h-2 flex-1 rounded-sm bg-lo-300" />
        <span className="hatch-a h-2 flex-1 rounded-sm" />
        <span className="h-2 w-3 rounded-sm bg-tg-300" />
      </div>
      <div className="flex gap-0.5">
        <span className="h-2 w-3 rounded-sm bg-tg-300" />
        <span className="hatch-b h-2 flex-1 rounded-sm" />
        <span className="h-2 flex-1 rounded-sm bg-hi-300" />
        <span className="h-2 w-3 rounded-sm bg-tg-300" />
      </div>
    </div>
  );
}

const LOOP: { n: number; title: string; sub: string; extra: 'lanes' | 'rules' | 'qr' | 'cards' }[] = [
  { n: 1, title: '설계', sub: '★ → ■□ 학년별 → ★', extra: 'lanes' },
  { n: 2, title: '타임라인 검사', sub: '규칙 12개 코드 검사', extra: 'rules' },
  { n: 4, title: '다음 차시', sub: '학년별 보충·심화 카드', extra: 'cards' },
  { n: 3, title: '질문 모으기', sub: 'QR · 계정 없음', extra: 'qr' },
];

function LoopTile({ t }: { t: (typeof LOOP)[number] }) {
  return (
    <div className="rounded-xl border border-chalkwhite/20 bg-white/[.04] p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-chalk-300/80 text-xs font-extrabold leading-none text-chalk-200">{t.n}</span>
        <span className="text-base font-bold leading-tight text-chalkwhite">{t.title}</span>
      </div>
      <div className="mt-1 text-sm leading-snug text-board-100">{t.sub}</div>
      {t.extra === 'lanes' && <LaneBars />}
      {t.extra === 'rules' && (
        <div className="mt-2.5 flex flex-wrap items-center gap-[3px]" aria-hidden>
          {/* 위반은 색만이 아니라 모양(속 빈 링)으로도 구분 */}
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === 9 ? 'bg-transparent ring-2 ring-bad-300' : 'bg-ok-300'}`} />
          ))}
        </div>
      )}
      {t.extra === 'qr' && (
        <div className="mt-2.5 flex gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i % 2 ? 'bg-hi-300' : 'bg-lo-300'}`} />
          ))}
        </div>
      )}
      {t.extra === 'cards' && (
        <div className="mt-2.5 flex gap-1" aria-hidden>
          <span className="h-3 w-4 rounded-sm bg-lo-300/90" />
          <span className="hatch-a h-3 w-4 rounded-sm" />
          <span className="h-3 w-4 rounded-sm bg-hi-300/90" />
          <span className="hatch-b h-3 w-4 rounded-sm" />
        </div>
      )}
    </div>
  );
}

/** 누가 무엇을 하는지 세 표시: 실제 화면과 같은 부품(ui/Marks)으로 소개한다. 숫자는 오늘 수업 기록에서 */
function MarkerChain() {
  const { lesson } = useApp();
  const first = lesson?.aiMeta.checkLog[0]?.errors.length ?? 0;
  const last = lesson ? (lesson.aiMeta.checkLog[lesson.aiMeta.checkLog.length - 1]?.errors.length ?? 0) : 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" data-testid="marker-chain">
      <AiBadge variant="board" size="md" />
      <ArrowRight size={14} className="text-chalkwhite/60" aria-hidden />
      <CodeBadge variant="board" size="md">{lesson && first ? `코드 검사 · 위반 ${first}→${last}` : '코드 검사'}</CodeBadge>
      <ArrowRight size={14} className="text-chalkwhite/60" aria-hidden />
      <ApprovedStamp size="md" />
    </div>
  );
}

function LoopGlyph() {
  const arrow = 'mx-auto text-chalkwhite/60';
  return (
    <div className="relative mx-auto w-full max-w-[24rem] select-none" role="group" aria-label="함께반 한 차시 루프: 설계, 타임라인 검사, 질문 모으기, 다음 차시. AI 초안을 코드가 검사하고 선생님이 승인해요.">
      <MarkerChain />
      <div className="chalk-rule-v mx-auto my-2 h-4 text-chalkwhite/30" aria-hidden />
      <div className="grid items-stretch gap-y-1.5" style={{ gridTemplateColumns: '1fr 28px 1fr' }} aria-hidden>
        <LoopTile t={LOOP[0]} />
        <ArrowRight size={16} className={`${arrow} self-center`} />
        <LoopTile t={LOOP[1]} />
        <ArrowUp size={16} className={`${arrow} self-center`} />
        <span />
        <ArrowDown size={16} className={`${arrow} self-center`} />
        <LoopTile t={LOOP[2]} />
        <ArrowLeft size={16} className={`${arrow} self-center`} />
        <LoopTile t={LOOP[3]} />
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-board-100">그 시간에 나온 질문이 다음 차시로 돌아와요</p>
    </div>
  );
}

// ---------- 이렇게 써요 ----------
const STEPS: { to: string; icon: LucideIcon; title: string; body: string }[] = [
  { to: '/design', icon: Sparkles, title: '수업 설계', body: '두 학년과 단원만 고르면 ★■□ 과정안 초안이 나와요' },
  { to: '/timeline', icon: CalendarClock, title: '타임라인 검사', body: '직접지도 겹침과 카드 빠짐을 코드가 잡아요' },
  { to: '/live', icon: MessagesSquare, title: '질문함', body: 'QR로 모은 질문을 AI가 진단 문장으로 묶어요' },
  { to: '/next', icon: LayoutList, title: '다음 차시', body: '학년별 보충·심화 카드, 승인하면 인쇄돼요' },
];

function HowTo() {
  return (
    <Card className="p-4 sm:p-5">
      <section aria-labelledby="howto-title">
        <h2 id="howto-title" className="mb-3 text-xl font-bold text-ink-900 dark:text-ink-50">
          이렇게 써요
        </h2>
        <ol className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.to}>
              <Link to={s.to} className="group flex h-full items-center gap-3 rounded-xl border border-ink-200 bg-paper p-3 transition hover:-translate-y-0.5 hover:border-board-300 hover:shadow-lift dark:border-board-700 dark:bg-board-950/50 dark:hover:border-board-500">
                <StepNo n={i + 1} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-base font-bold text-ink-900 dark:text-ink-50">
                    <s.icon size={15} aria-hidden className="shrink-0 text-board-600 dark:text-board-300" />
                    {s.title}
                  </span>
                  <span className="mt-0.5 hidden text-sm leading-relaxed text-ink-600 sm:block dark:text-board-200">{s.body}</span>
                </span>
                <ChevronRight size={16} aria-hidden className="shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-board-700 dark:text-board-500 dark:group-hover:text-chalk-300" />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </Card>
  );
}

// ---------- KPI — 숫자는 reports/·BUILD_NOTES에 출처가 있는 것만. 긴 출처는 툴팁 ----------
const KPIS: { icon: LucideIcon; label: string; value: string; unit: string; note: string; src: string; flag?: string }[] = [
  { icon: School, label: '강원 소규모 초등', value: '202', unit: '교', note: '355교 중 56.9% · 재적 60명 이하', src: '강원교육청, 2026.3 · 1,100학급' },
  { icon: Users, label: '강원 2개 학년 복식학급', value: '96', unit: '학급', note: '72개교 · 347명', src: '강원교육청 2025학년도 학급편성', flag: '원문 확인 필요' },
  { icon: BookOpenCheck, label: '성취기준 인덱스', value: '611', unit: '건', note: '2022 개정 초등 전체', src: '데모 코드 20건은 NCIC PDF와 대조' },
  { icon: ListChecks, label: '코드 검사 규칙', value: '12', unit: '개', note: 'AI가 아니라 코드가 판정', src: 'R1–R12 · 고칠 곳이 0이어야 승인' },
];

function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {KPIS.map((k) => (
        <StatTile
          key={k.label}
          size="lg"
          icon={<k.icon size={14} aria-hidden className="shrink-0 text-board-600 dark:text-board-300" />}
          label={k.label}
          value={k.value}
          unit={k.unit}
          note={k.note}
          title={`출처: ${k.src}`}
          flag={k.flag ? <Badge tone="warn">{k.flag}</Badge> : undefined}
        />
      ))}
    </div>
  );
}

// ---------- 현장 근거 (masdae-pass NewsList) ----------
const EVIDENCE: { title: string; fact: string; outlet: string; date: string; url: string; trust: '원문 확인됨' | '원문 확인 필요' | '언론 보도' }[] = [
  {
    title: '충북교육청 「초등학교 복식학급 운영 도움자료」',
    fact: '직접·간접지도 정의와 부분통합 모형(공통 도입 → 학년별 분리 → 공통 정리), “학습 누락 확인 및 보완 지도 설계”. 함께반 골격과 검사 규칙의 근거예요.',
    outlet: '충청북도교육청 PDF',
    date: '2025-12',
    url: 'https://www.cbe.go.kr/upload/dept-19/na/bbs_1437/2025/12/8C1546FC-20FB-DC29-5EFF-A95F54B433E9.pdf',
    trust: '원문 확인됨',
  },
  {
    title: '강원 초등 355교 중 202교(56.9%)가 재적 60명 이하',
    fact: '2026년 3월 기준 1,100학급. 소규모화를 보여 주는 가장 확실한 숫자예요.',
    outlet: '강원특별자치도교육청',
    date: '2026-03',
    url: 'https://www.gwe.go.kr/main/content.do?key=bTIzMDcyMTA2OTE4Mjg%3D',
    trust: '원문 확인됨',
  },
  {
    title: '강원 2개 학년 복식학급 72개교·96학급·347명',
    fact: '2025학년도 학급편성 확정 자료. 3개 학년 이상 복식이 빠졌을 수 있어 정의를 원문에서 확인해야 해요.',
    outlet: '강원특별자치도교육청',
    date: '2025학년도',
    url: 'https://www.gwe.go.kr/promotion/bbs/view.do?bbsSn=37355&key=m2411225294640',
    trust: '원문 확인 필요',
  },
  {
    title: '복식 담임 “온전한 40분 수업 불가 → 학습 결손”',
    fact: '복식학급 담임의 어려움: 많은 업무, 부족한 시간. 한 학년을 가르치는 동안 다른 학년이 혼자 보내는 시간이 문제예요.',
    outlet: 'KCI · 정형수(2024)',
    date: '2024',
    url: 'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003153785',
    trust: '원문 확인됨',
  },
  {
    title: 'KEDI, 농어촌형 취약지역에 AI 맞춤형 교육정책 권고',
    fact: '한국교육개발원이 농어촌 소규모 지역에 AI 맞춤형 교육정책을 직접 권고했어요.',
    outlet: '머니투데이',
    date: '2026-05-28',
    url: 'https://www.mt.co.kr/policy/2026/05/28/2026052813383247808',
    trust: '언론 보도',
  },
  {
    title: '전국 복식 702학급, 강원 116학급(전국 2위)',
    fact: '2021년 기준. 강원은 123(2017) → 116(2021) → 96(2025)으로 줄지만 60명 이하 학교는 늘어요.',
    outlet: '경북일보',
    date: '2021',
    url: 'https://www.kyongbuk.co.kr/news/articleView.html?idxno=2106865',
    trust: '원문 확인됨',
  },
];

function EvidenceList() {
  const [all, setAll] = useState(false);
  return (
    <>
      <ol className="divide-y divide-ink-100 dark:divide-board-700">
        {(all ? EVIDENCE : EVIDENCE.slice(0, 4)).map((n) => (
          <li key={n.url} className="py-3 first:pt-0 last:pb-0">
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block rounded">
              <div className="flex items-start gap-1.5 text-base font-semibold leading-snug text-ink-900 group-hover:text-board-700 dark:text-ink-100 dark:group-hover:text-board-300">
                <span className="min-w-0 flex-1">{n.title}</span>
                <ExternalLink size={13} aria-hidden className="mt-1 shrink-0 text-ink-500 group-hover:text-board-700 dark:text-board-300" />
              </div>
              <div className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-board-200">{n.fact}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-2xs text-ink-600 dark:text-board-300">
                {n.outlet} · {n.date}
                <Badge tone={n.trust === '원문 확인됨' ? 'ok' : n.trust === '원문 확인 필요' ? 'warn' : 'ink'}>{n.trust}</Badge>
              </div>
            </a>
          </li>
        ))}
      </ol>
      <button type="button" className="btn-ghost btn-sm mt-3 w-full" onClick={() => setAll((a) => !a)} aria-expanded={all}>
        {all ? '4건만 보기' : `근거 ${EVIDENCE.length}건 모두 보기`}
      </button>
    </>
  );
}

// ---------- 오늘 수업 ----------
function TodayLesson() {
  const { lesson, standards } = useApp();
  if (!lesson)
    return (
      <Section title="오늘 수업" desc="아직 만든 수업이 없어요.">
        <Link className="btn-primary" to="/design">
          수업 설계하기 <ArrowRight size={15} aria-hidden />
        </Link>
      </Section>
    );
  const v = checkLesson(lesson, { lookup: (c) => standards.get(c) });
  const errors = errorsOf(v);
  const d = directMinutes(lesson);
  return (
    <Section
      title={
        <span className="flex flex-wrap items-center gap-2">
          오늘 수업 <DraftOrApproved approved={lesson.status === 'approved'} />
        </span>
      }
      desc={`${lesson.gradeA}·${lesson.gradeB}학년 ${lesson.subject} ${lesson.durationMin}분 · ${PAIR_LABEL[lesson.pairType]} · ${lesson.method}`}
      actions={
        <Link className="btn-ghost btn-sm" to="/timeline">
          타임라인 열기 <ArrowRight size={13} aria-hidden />
        </Link>
      }
    >
      <p className="mb-3 text-lg font-extrabold tracking-tight text-ink-900 dark:text-chalkwhite">“{lesson.commonTheme}”</p>
      <TimelineGrid gradeA={lesson.gradeA} gradeB={lesson.gradeB} durationMin={lesson.durationMin} blocks={lesson.blocks} violations={v} compact />
      <TeacherPathLegend blocks={lesson.blocks} gradeA={lesson.gradeA} gradeB={lesson.gradeB} durationMin={lesson.durationMin} />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: '검사', v: errors.length ? `고칠 곳 ${errors.length}` : '통과', tone: errors.length ? 'text-bad-700 dark:text-bad-300' : 'text-ok-700 dark:text-ok-300' },
          { k: '교사 이동', v: `${countTransitions(lesson)}번`, tone: 'text-ink-900 dark:text-chalkwhite' },
          { k: `${lesson.gradeA}학년 직접`, v: `${d.A}분`, tone: 'text-lo-700 dark:text-lo-300' },
          { k: `${lesson.gradeB}학년 직접`, v: `${d.B}분`, tone: 'text-hi-700 dark:text-hi-300' },
        ].map((x) => (
          <div key={x.k} className="rounded-lg border border-ink-200 bg-paper px-3 py-2 dark:border-board-700 dark:bg-board-950/50">
            <div className="text-2xs font-semibold text-ink-600 dark:text-board-300">{x.k}</div>
            <div className={`text-lg font-extrabold tabular-nums ${x.tone}`}>{x.v}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------- 최근 AI 실행(개발 정보: 심사 모드에서는 숨김) ----------
function RecentRuns() {
  const { lesson } = useApp();
  const { session, responses } = useLive();
  const [cards, setCards] = useState<{ cards: NextLessonCard[]; run: { source: AiSource } | null } | null>(null);
  useEffect(() => {
    void api<{ cards: NextLessonCard[]; run: { source: AiSource } | null }>('/api/cards').then(setCards).catch(() => undefined);
  }, [lesson?.id]);
  const NAME: Record<string, string> = { planner: '계획 · 공통 주제와 성취기준', filler: '채움 · 활동 문장과 카드' };
  const rows: { key: string; what: string; to: string; s: AiSource }[] = [
    ...(lesson?.aiMeta.sources ?? []).map((s, i) => ({ key: `l${i}`, what: NAME[s.step] ?? (s.step.startsWith('filler-repair') ? `수리 · 위반 블록 다시 쓰기(${s.step.split('-').pop()}회)` : s.step.startsWith('planner-repair') ? '계획 다시 쓰기' : s.step), to: '/design', s })),
    ...(cards?.run ? [{ key: 'cards', what: `다음 차시 카드 ${cards.cards.length}장`, to: '/next', s: cards.run.source }] : []),
  ];
  return (
    <Section
      className="dev"
      title="최근 AI 실행"
      desc="AI 결과마다 경로(로컬 AI 실시간 · 녹화된 AI 응답 재생 · 규칙 템플릿)를 남겨요."
      actions={session ? <Badge tone="ink">질문함 {session.code} · 질문 {responses.length}건</Badge> : undefined}
    >
      {rows.length ? (
        <ul className="divide-y divide-ink-100 dark:divide-board-700">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <Link className="btn-ghost btn-sm" to={r.to}>
                열기
              </Link>
              <span className="font-semibold text-ink-800 dark:text-ink-100">{r.what}</span>
              <SourceTag s={r.s} />
              <span className="ml-auto font-mono text-xs text-ink-600 dark:text-board-300">{fmtMs(r.s.ms)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-600 dark:text-board-300">아직 실행 기록이 없어요.</p>
      )}
    </Section>
  );
}

export function Overview() {
  const nav = useNavigate();
  const { lesson } = useApp();
  const ind = lesson ? indirectMinutes(lesson) : null;
  const minutes = ind ? (ind.A === ind.B ? `${ind.A}분` : `${ind.A}·${ind.B}분`) : null;
  return (
    <div className="space-y-5">
      <section className="chalkboard relative overflow-hidden rounded-2xl shadow-board ring-1 ring-board-950/40 dark:ring-chalkwhite/15" aria-labelledby="hero-title">
        <div className="relative grid items-center gap-6 px-6 pb-8 pt-6 sm:px-9 sm:pb-9 sm:pt-7 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="mb-3 text-xs font-semibold text-board-200">
              함께반 <span className="text-board-300" aria-hidden>·</span> 복식학급 수업 코티처 <span className="text-board-300" aria-hidden>·</span> 2022 개정 성취기준
            </div>
            <h1 id="hero-title" className="text-[1.625rem] font-extrabold leading-[1.3] tracking-tight text-chalkwhite sm:text-[1.75rem] min-[1400px]:text-[2.125rem]" data-testid="hero-title">
              두 학년을 혼자 맡은 선생님이
              <br className="hidden sm:block" /> 다른 학년에 가 있는{' '}
              {minutes ? (
                <ChalkUnderline className="mx-0.5 font-hand text-[1.35em] leading-none text-chalk-300">{minutes}</ChalkUnderline>
              ) : (
                <ChalkUnderline className="mx-0.5 font-hand text-[1.35em] leading-none text-chalk-300">시간</ChalkUnderline>
              )}
              까지 설계해요
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-board-100">
              한 학년을 직접 가르치는 동안 다른 학년이 혼자 보내는 시간의 <b className="text-chalkwhite">활동 카드와 교사 동선</b>을 짜고, 겹침은 <b className="text-chalkwhite">코드 검사기</b>가 잡아요. 그 시간에 나온 질문은 다음 차시 학년별 보충·심화 카드로 돌아와요.
              {ind && (
                <span className="mt-1 block text-sm text-board-200" data-testid="hero-minutes-note">
                  숫자는 오늘 수업에서 계산했어요: {lesson!.gradeA}학년 간접지도 {ind.A}분 · {lesson!.gradeB}학년 간접지도 {ind.B}분
                </span>
              )}
            </p>
            <p className="mt-3 text-[1.0625rem] font-semibold leading-snug text-chalk-200">수업안은 ChatGPT가, 선생님 동선은 함께반이 짜요.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" onClick={() => nav('/design', { state: { demo: true } })} className="btn-chalk btn-lg shadow-lg shadow-black/25" data-testid="hero-demo" title="데모: 3학년 사회 [4사01-02] + 4학년 사회 [4사05-02] · 40분 · 같은 학년군 부분통합(충북 2025 모형 예시와 같은 조합)">
                <Play size={16} aria-hidden /> 데모 실행
              </button>
              <Link to="/design" className="btn-on-board btn-lg">
                직접 설계하기 <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-board-200" data-testid="demo-school">
              데모 장면: <b className="font-semibold text-board-100">강원 ○○군 소규모 초등 3·4학년 복식학급</b>(예시 학교) · 사회 40분
            </p>
          </div>
          <div className="hidden lg:block">
            <LoopGlyph />
          </div>
        </div>
        <ChalkTray />
      </section>

      <KpiCards />

      <HowTo />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0 space-y-5">
          <TodayLesson />
          <RecentRuns />
        </div>
        <Section className="self-start" title="현장 근거" desc="문제가 실제로 있다는 자료예요. 숫자마다 원문 확인 여부를 적었어요.">
          <EvidenceList />
        </Section>
      </div>
    </div>
  );
}
