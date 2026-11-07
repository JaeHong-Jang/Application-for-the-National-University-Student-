// 교사 앱 뼈대: 종이 사이드바(그룹 메뉴, 활성 = 칠판 초록 알약) + 상단 AI 상태·심사 모드·데모 리셋·칠판(다크) 토글.
// 공통 상태(수업·성취기준·AI 상태)는 여기서 한 번 불러 모든 화면이 나눠 쓴다.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { BookOpenCheck, CalendarClock, Cpu, History, LayoutDashboard, LayoutList, Menu, MessagesSquare, Moon, Presentation, RotateCcw, Scale, Sparkles, Sun, Wrench, X } from 'lucide-react';
import type { AiStatus, Lesson, StandardEntry } from '../../shared/contracts';
import { api } from '../api';
import { Logo } from '../ui/Chalk';
import { statusLabel } from '../ui/aiLabel';
import { PresentProvider, usePresent } from '../ui/present';
import { LiveProvider, useLive } from './live';
import { Overview } from './pages/Overview';
import { Design } from './pages/Design';
import { Timeline } from './pages/Timeline';
import { Live } from './pages/Live';
import { Next } from './pages/Next';
import { Standards } from './pages/Standards';
import { Principles } from './pages/Principles';

export interface Meta {
  subjects: string[];
  units: { grade: number; subject: string; label: string; codes: string[]; note: string }[];
  checkDefaults: Record<string, number>;
  checkDefaultsNote: string;
  publicBaseUrl: string | null;
}

interface AppState {
  status: AiStatus | null;
  meta: Meta | null;
  lesson: Lesson | null;
  standards: Map<string, StandardEntry>;
  setLessonData: (d: { lesson: Lesson; standards: StandardEntry[] } | null) => void;
  refreshLesson: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('App 밖');
  return v;
};

const NAV = [
  { group: '수업', items: [
    { to: '/', label: '한눈에', icon: LayoutDashboard },
    { to: '/design', label: '수업 설계', icon: Sparkles },
    { to: '/timeline', label: '타임라인', icon: CalendarClock },
  ] },
  { group: '교실', items: [
    { to: '/live', label: '질문함', icon: MessagesSquare },
    { to: '/next', label: '다음 차시', icon: LayoutList },
  ] },
  { group: '근거', items: [
    { to: '/standards', label: '성취기준', icon: BookOpenCheck },
    { to: '/principles', label: '데이터·원칙', icon: Scale },
  ] },
];

const THEME_KEY = 'cotutor-theme';
function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      } catch {
        /* 저장 불가 */
      }
      return next;
    });
  }, []);
  return { dark, toggle };
}

function Brand({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg">
      <Logo size={compact ? 30 : 34} />
      <div className={`leading-tight ${iconOnly ? 'sr-only' : ''}`}>
        <div className="whitespace-nowrap text-base font-extrabold tracking-tight text-ink-900 dark:text-chalkwhite">함께반</div>
        {!compact && <div className="text-2xs font-semibold text-ink-500 dark:text-board-300">복식학급 수업 코티처</div>}
      </div>
    </Link>
  );
}

function NavList({ onPick, iconOnly = false }: { onPick?: () => void; iconOnly?: boolean }) {
  const { session, responses } = useLive();
  return (
    <nav aria-label="교사 메뉴" className="space-y-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className={`mb-1.5 flex items-center gap-2 px-2.5 text-2xs font-bold tracking-wide text-ink-600 dark:text-board-300 ${iconOnly ? 'sr-only' : ''}`}>
            {g.group}
            <span className="chalk-rule h-px flex-1 text-ink-300/70 dark:text-board-700" aria-hidden />
          </div>
          <ul className="space-y-0.5">
            {g.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={onPick}
                  title={iconOnly ? label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 rounded-lg py-2 text-sm font-semibold transition ${iconOnly ? 'justify-center px-2' : 'px-2.5'} ${
                      isActive
                        ? 'bg-board-900 text-chalkwhite shadow-sm dark:bg-board-800'
                        : 'text-ink-600 hover:bg-ink-200/50 hover:text-ink-900 dark:text-board-200 dark:hover:bg-board-900 dark:hover:text-chalkwhite'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -left-1 top-2 bottom-2 w-1 rounded-full bg-board-300" aria-hidden />}
                      <Icon size={iconOnly ? 20 : 16} aria-hidden className="shrink-0" />
                      <span className={iconOnly ? 'sr-only' : 'flex-1'}>{label}</span>
                      {to === '/live' && session && !iconOnly && (
                        <span className={`inline-flex items-center gap-1 text-2xs font-semibold tabular-nums ${isActive ? 'text-board-100' : 'text-ink-600 dark:text-board-300'}`} aria-label={`진행 중 수업 ${session.code}, 질문 ${responses.length}건`}>
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok-500" />
                          {responses.length}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** 상단 AI 상태 알약: 중립 메타 칩(경로를 말할 뿐, AI 초안·코드 판정 표시와 섞지 않음). 본문 출처 칩과 같은 낱말(ui/aiLabel) */
function AiChip({ s }: { s: AiStatus | null }) {
  if (!s)
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700 dark:bg-board-800 dark:text-board-200">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-400" /> AI 확인 중
      </span>
    );
  const down = s.mode === 'live' && s.reachable === false;
  const tone = down
    ? 'bg-warn-50 text-warn-800 ring-1 ring-inset ring-warn-500/40 dark:bg-warn-500/15 dark:text-warn-200'
    : 'bg-ink-100 text-ink-800 ring-1 ring-inset ring-ink-300 dark:bg-board-800 dark:text-ink-100 dark:ring-board-600';
  const Icon = s.mode === 'live' ? Cpu : s.mode === 'replay' ? History : Wrench;
  const label = statusLabel(s);
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
      title={`AI: ${label}\n수업 모델 ${s.models.lesson} · 묶기 모델 ${s.models.cluster}${down ? '\n연결 안 됨 → 녹화 응답으로 대체' : ''}${s.lastError ? `\n${s.lastError}` : ''}`}
      data-testid="ai-chip"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${down ? 'bg-warn-500' : s.mode === 'live' ? 'animate-pulse bg-ok-500' : 'bg-ink-500 dark:bg-board-300'}`} />
      <Icon size={13} aria-hidden className="shrink-0" />
      <span className="shrink-0 sm:hidden">AI</span>
      <span className="hidden shrink-0 sm:inline">AI · {label}</span>
      {s.mode === 'live' && <span className="dev hidden min-w-0 truncate font-mono text-2xs font-normal text-ink-700 xl:inline dark:text-board-200">{s.models.lesson}</span>}
      {down && <span className="hidden min-w-0 truncate 2xl:inline">· 연결 안 됨</span>}
    </span>
  );
}

// 본문은 남은 폭의 가운데(1920에서 오른쪽만 비던 문제), 아주 넓으면 1560까지
const COL = 'mx-auto w-full max-w-[1400px] min-[1800px]:max-w-[1560px] px-4 sm:px-6 lg:px-8';

function Shell({ children }: { children: ReactNode }) {
  const { status } = useApp();
  const { dark, toggle } = useTheme();
  const { present, toggle: togglePresent } = usePresent();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  const reset = async () => {
    if (!confirm('데모를 처음 상태로 되돌릴까요? 질문과 카드가 지워져요.')) return;
    await api('/api/demo/reset', { method: 'POST' });
    location.href = '/';
  };
  return (
    <div className={`min-h-screen lg:grid print:block ${present ? 'lg:grid-cols-[4.5rem_minmax(0,1fr)]' : 'lg:grid-cols-[12.5rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]'}`}>
      {/* 사이드바: 그리드 칸이 페이지 끝까지 늘어나 배경이 끊기지 않고, 안쪽만 화면에 붙는다 */}
      <aside className="no-print hidden border-r border-ink-200 bg-paper-deep lg:block dark:border-board-800 dark:bg-board-950">
        <div className={`sticky top-0 flex h-screen flex-col py-5 ${present ? 'px-2' : 'px-3'}`}>
          <div className={present ? 'flex justify-center' : 'px-2'}>
            <Brand iconOnly={present} />
          </div>
          <div className="mt-7 flex-1 overflow-y-auto pl-1">
            <NavList iconOnly={present} />
          </div>
          {!present && (
            <div className="mx-2 hidden rounded-lg border border-ink-200 bg-paper-card/70 px-3 py-2.5 text-2xs leading-relaxed text-ink-600 xl:block dark:border-board-700 dark:bg-transparent dark:text-board-200">
              선생님이 승인하기 전엔 학생에게 아무것도 안 나가요. 학생부 문장과 점수는 만들지 않아요.
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-ink-200 bg-paper/85 backdrop-blur dark:border-board-800 dark:bg-board-950/85">
          <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" className="btn-ghost btn-icon -ml-1 shrink-0 lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? '메뉴 닫기' : '메뉴 열기'}>
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="shrink-0 lg:hidden">
              <Brand compact />
            </div>
            <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
              <AiChip s={status} />
              <button
                type="button"
                className={`btn btn-sm shrink-0 border ${present ? 'border-board-900 bg-board-900 text-chalkwhite dark:border-board-500 dark:bg-board-600' : 'border-ink-300 bg-paper-card text-ink-700 hover:bg-paper-deep dark:border-board-600 dark:bg-board-900 dark:text-ink-100'}`}
                onClick={togglePresent}
                aria-pressed={present}
                title="심사 모드: 글자를 키우고 사이드바를 접고 개발 정보를 숨겨요 (주소에 ?present=1)"
                data-testid="present-toggle"
              >
                <Presentation size={15} aria-hidden /> <span className="hidden md:inline">심사 모드</span>
              </button>
              <button type="button" className="btn-ghost btn-sm shrink-0" onClick={reset} data-testid="demo-reset" title="데모 리셋">
                <RotateCcw size={13} aria-hidden /> <span className="hidden md:inline">데모 리셋</span>
              </button>
              <button type="button" onClick={toggle} className="btn-ghost btn-icon shrink-0" aria-label={dark ? '밝은 화면으로' : '칠판 화면으로'} title={dark ? '밝은 화면' : '칠판(어두운) 화면'} data-testid="theme-toggle">
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
          {menu && (
            <div id="mobile-menu" className="max-h-[70vh] overflow-y-auto border-t border-ink-200 bg-paper-deep px-4 py-4 shadow-lg lg:hidden dark:border-board-800 dark:bg-board-950">
              <NavList onPick={() => setMenu(false)} />
            </div>
          )}
        </header>

        <main className={`${COL} flex-1 py-6 lg:py-8 print:max-w-none print:p-0`}>{children}</main>

        <footer className={`no-print dev ${COL} pb-8`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-200 pt-4 text-2xs leading-relaxed text-ink-600 dark:border-board-700 dark:text-board-200">
            <span>성취기준 원문: 교육부 고시 제2022-33호(NCIC) · 코드 인덱스 kr-curriculum-2022(MIT)</span>
            <span aria-hidden>·</span>
            <span>복식학급 모형: 충청북도교육청 「초등학교 복식학급 운영 도움자료」(2025)</span>
            <span aria-hidden>·</span>
            <Link className="btn-link" to="/principles">
              데이터 원칙
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function App() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [data, setData] = useState<{ lesson: Lesson; standards: StandardEntry[] } | null>(null);

  const refreshLesson = useCallback(async () => {
    setData(await api<{ lesson: Lesson; standards: StandardEntry[] } | null>('/api/lessons/current'));
  }, []);

  useEffect(() => {
    void api<AiStatus>('/api/ai/status').then(setStatus);
    void api<Meta>('/api/meta').then(setMeta);
    void refreshLesson();
    const t = window.setInterval(() => void api<AiStatus>('/api/ai/status').then(setStatus).catch(() => undefined), 15000);
    return () => window.clearInterval(t);
  }, [refreshLesson]);

  const value = useMemo<AppState>(
    () => ({ status, meta, lesson: data?.lesson ?? null, standards: new Map((data?.standards ?? []).map((s) => [s.code, s])), setLessonData: setData, refreshLesson }),
    [status, meta, data, refreshLesson],
  );

  return (
    <Ctx.Provider value={value}>
      <PresentProvider>
      <LiveProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/design" element={<Design />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/live" element={<Live />} />
            <Route path="/next" element={<Next />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/principles" element={<Principles />} />
          </Routes>
        </Shell>
      </LiveProvider>
      </PresentProvider>
    </Ctx.Provider>
  );
}
