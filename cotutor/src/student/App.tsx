// 학생 페이지(/s/?c=ABCD): 학년 버튼 2개, 지금 질문, 200자 입력, 보내기, 완료, 다시 보내기.
// 이름·로그인 없음(localStorage 랜덤 ID만). 전송 실패는 폰에 보관했다가 다시 보낸다. AI 출력은 표시하지 않는다.
import { useCallback, useEffect, useState } from 'react';
import type { PublicSession } from '../../shared/contracts';
import { ChalkTray, ChalkUnderline, Logo } from '../ui/Chalk';
import { StepNo } from '../ui/StepNo';

const ID_KEY = 'cotutor.clientId';
const OUTBOX = 'cotutor.outbox';
type Pending = { code: string; grade: number; text: string; sid: string; promptId: string | null };

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
function clientId() {
  let id = localStorage.getItem(ID_KEY);
  if (!id) localStorage.setItem(ID_KEY, (id = `c-${rid()}`));
  return id;
}
const readOutbox = (): Pending[] => {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) ?? '[]');
  } catch {
    return [];
  }
};
const writeOutbox = (x: Pending[]) => localStorage.setItem(OUTBOX, JSON.stringify(x));

async function post(p: Pending) {
  const res = await fetch(`/api/sessions/${p.code}/responses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grade: p.grade, text: p.text, clientId: clientId(), sid: p.sid, promptId: p.promptId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    const err = new Error(body?.error ?? '보내지 못했어요') as Error & { status: number };
    err.status = res.status;
    throw err;
  }
}

export function StudentApp() {
  const code = (new URLSearchParams(location.search).get('c') ?? '').toUpperCase();
  const [session, setSession] = useState<PublicSession | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [state, setState] = useState<'edit' | 'sending' | 'done' | 'queued'>('edit');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(readOutbox().length);

  useEffect(() => {
    if (!code) return setLoadErr('수업 코드가 없어요. 선생님 화면의 QR을 다시 찍어 주세요.');
    const load = () =>
      fetch(`/api/sessions/${code}`)
        .then(async (r) => (r.ok ? setSession(await r.json()) : setLoadErr('수업을 찾지 못했어요. 코드를 확인해 주세요.')))
        .catch(() => setLoadErr('연결이 잠시 끊겼어요. 잠시 뒤 다시 열어 주세요.'));
    void load();
    const t = window.setInterval(load, 10000); // 지금 질문이 바뀌면 보이도록
    return () => window.clearInterval(t);
  }, [code]);

  // 보관함 다시 보내기
  const flush = useCallback(async () => {
    const box = readOutbox();
    const left: Pending[] = [];
    for (const p of box) {
      try {
        await post(p);
      } catch (e) {
        if ((e as { status?: number }).status === undefined || (e as { status: number }).status >= 500 || (e as { status: number }).status === 429) left.push(p);
      }
    }
    writeOutbox(left);
    setPending(left.length);
    if (!left.length && box.length) setState((s) => (s === 'queued' ? 'done' : s));
  }, []);
  useEffect(() => {
    void flush();
    const t = window.setInterval(() => void flush(), 5000);
    window.addEventListener('online', flush);
    return () => (window.clearInterval(t), window.removeEventListener('online', flush));
  }, [flush]);

  async function send() {
    if (!grade || !text.trim()) return;
    const p: Pending = { code, grade, text: text.trim().slice(0, 200), sid: rid(), promptId: session?.prompt?.id ?? null };
    setState('sending');
    setErr('');
    try {
      await post(p);
      setState('done');
      setText('');
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status && status < 500 && status !== 429) {
        setErr((e as Error).message);
        setState('edit');
        return;
      }
      writeOutbox([...readOutbox(), p]);
      setPending(readOutbox().length);
      setState('queued');
      setText('');
    }
  }

  const gradeTone = (i: number, on: boolean) =>
    i === 0
      ? on
        ? 'border-lo-700 bg-lo-600 text-white shadow-lg shadow-lo-600/30'
        : 'border-lo-200 bg-lo-50 text-lo-800 hover:border-lo-400'
      : on
        ? 'border-hi-700 bg-hi-600 text-white shadow-lg shadow-hi-600/30'
        : 'border-hi-200 bg-hi-50 text-hi-800 hover:border-hi-400';

  return (
    <div className="min-h-screen bg-paper text-base text-ink-900">
      <header className="chalkboard relative overflow-hidden px-4 pb-10 pt-5">
        <div className="relative mx-auto flex w-full max-w-md items-center gap-2.5">
          <Logo size={38} className="rounded-lg ring-1 ring-white/15" />
          <div className="leading-tight">
            <div className="text-base font-extrabold text-chalkwhite">함께반</div>
            <div className="text-xs font-semibold text-board-200">질문 보내기</div>
          </div>
          {code && <span className="ml-auto rounded-lg border-2 border-chalkwhite/30 px-3 py-1 font-mono text-sm font-semibold tracking-widest text-chalkwhite">{code}</span>}
        </div>
        <h1 className="relative mx-auto mt-6 w-full max-w-md text-[1.6875rem] font-extrabold leading-snug tracking-tight text-chalkwhite">
          궁금한 것을
          <br />
          <ChalkUnderline className="font-hand text-[1.3em] leading-none text-chalk-300">선생님께</ChalkUnderline> 보내요
        </h1>
        <ChalkTray />
      </header>
      <main className="relative mx-auto -mt-5 w-full max-w-md px-4 pb-8">
        {loadErr && (
          <p className="rounded-2xl border border-bad-300 bg-bad-50 p-4 text-bad-800 shadow-paper" role="alert">
            {loadErr}
          </p>
        )}
        {session && !session.active && <p className="rounded-2xl border border-warn-300 bg-warn-50 p-4 text-warn-900 shadow-paper">이 수업은 끝났어요.</p>}
        {session && session.active && (
          <>
            {session.prompt && (
              <section className="mb-4 rounded-2xl border border-ink-200 bg-paper-card p-4 shadow-lift" data-testid="student-prompt">
                <div className="flex items-center gap-2 text-sm font-bold text-board-700">
                  <span className="eyebrow-bar" aria-hidden />
                  선생님 질문
                </div>
                <p className="mt-2 text-xl font-extrabold leading-snug">{session.prompt.text}</p>
              </section>
            )}
            {state === 'done' || state === 'queued' ? (
              <section key="done" className="rounded-2xl border border-ink-200 bg-paper-card p-6 text-center shadow-paper" data-testid="student-done">
                <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${state === 'done' ? 'bg-board-900 text-chalk-300' : 'bg-warn-100 text-warn-700'}`} aria-hidden>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                </div>
                <p className="mt-3 font-hand text-[2.125rem] leading-tight">{state === 'done' ? '보냈어요!' : '휴대폰에 보관했어요'}</p>
                <p className="mt-1 text-ink-700">{state === 'done' ? '선생님이 읽어 볼게요.' : '인터넷이 다시 되면 자동으로 보내요.'}</p>
                <button className="btn-primary btn-lg mt-6 min-h-14 w-full rounded-xl text-lg" onClick={() => setState('edit')} data-testid="student-again">
                  하나 더 보내기
                </button>
              </section>
            ) : (
              <section key="edit" className="space-y-5 rounded-2xl border border-ink-200 bg-paper-card p-4 shadow-paper">
                <div>
                  <div className="mb-2.5 flex items-center gap-2 font-bold">
                    <StepNo n={1} size="lg" className="!h-7 !w-7 !text-sm" />몇 학년인가요?
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {session.grades.map((g, i) => (
                      <button
                        key={g}
                        className={`min-h-[64px] rounded-xl border-2 text-xl font-extrabold transition active:scale-[.98] ${gradeTone(i, grade === g)}`}
                        onClick={() => setGrade(g)}
                        aria-pressed={grade === g}
                        data-testid={`grade-${g}`}
                      >
                        {g}학년
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2.5 flex items-center gap-2 font-bold">
                    <StepNo n={2} size="lg" className="!h-7 !w-7 !text-sm" />궁금한 것이나 헷갈리는 것
                  </span>
                  <textarea
                    className="ruled block min-h-[120px] [--ruled-offset:14px] w-full scroll-mb-28 rounded-xl border-2 border-ink-500 bg-paper p-3.5 text-base leading-7 focus:border-board-700 focus:bg-paper-card focus:outline-none"
                    maxLength={200}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="예: 축척이 뭐예요?"
                    // 휴대폰 키보드가 올라와도 입력칸과 보내기 버튼이 보이게
                    onFocus={(e) => {
                      const el = e.currentTarget;
                      window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
                    }}
                    data-testid="student-text"
                  />
                  <span className="mt-1.5 flex justify-between text-sm text-ink-700">
                    <span className="font-semibold">이름은 쓰지 마세요.</span>
                    <span className="tabular-nums">{text.length}/200</span>
                  </span>
                </label>
                {err && (
                  <p className="text-bad-700" role="alert">
                    {err}
                  </p>
                )}
                {/* 보내기는 화면 아래에 붙어 있어 키보드 위로 늘 보인다 */}
                <div className="sticky bottom-0 z-10 -mx-4 -mb-4 rounded-b-2xl bg-paper-card/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
                  <button className="btn-primary btn-lg min-h-14 w-full rounded-xl text-lg" disabled={!grade || !text.trim() || state === 'sending'} onClick={send} data-testid="student-send">
                    {state === 'sending' ? '보내는 중…' : '보내기'}
                  </button>
                  {!grade && <p className="mt-1.5 text-center text-sm text-ink-700">먼저 학년을 고르세요.</p>}
                </div>
              </section>
            )}
            {pending > 0 && <p className="mt-4 text-center text-sm text-warn-800">보내지 못한 글 {pending}개를 다시 보내고 있어요.</p>}
          </>
        )}
        <footer className="mt-6 flex items-start gap-2 rounded-xl border border-ink-200 bg-paper-card p-3 text-base leading-relaxed text-ink-700">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1 shrink-0 text-board-700" aria-hidden>
            <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />
          </svg>
          이름이나 전화번호는 쓰지 마세요. 선생님만 읽어요.
        </footer>
      </main>
    </div>
  );
}
