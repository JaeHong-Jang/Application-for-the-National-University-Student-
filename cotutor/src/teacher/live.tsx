// 실시간: SSE(/api/stream)로 학생 제출·파이프라인 단계를 받는다(윤슬 shared/api/live.tsx 패턴).
// CLOSED면 다시 연결, 중복 제거(id 기준). SSE가 3번 연달아 실패하면 2초 폴링으로 바꾼다.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, StreamEvent, StudentResponse } from '../../shared/contracts';
import { api, teacherKey } from '../api';

type StepEvent = Extract<StreamEvent, { type: 'pipeline.step' }>;

interface Live {
  session: Session | null;
  setSession: (s: Session | null) => void;
  responses: StudentResponse[];
  safety: { responseId: string; grade: number; at: string }[];
  steps: StepEvent[];
  connected: boolean;
  transport: 'sse' | 'poll';
  resetSignal: number;
}

const Ctx = createContext<Live | null>(null);
export const useLive = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('LiveProvider 밖');
  return v;
};

function mergeById(prev: StudentResponse[], add: StudentResponse[]) {
  const m = new Map(prev.map((r) => [r.id, r]));
  add.forEach((r) => m.set(r.id, r));
  return [...m.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [safety, setSafety] = useState<Live['safety']>([]);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<'sse' | 'poll'>('sse');
  const [resetSignal, setResetSignal] = useState(0);
  const code = session?.code;
  const codeRef = useRef(code);
  codeRef.current = code;

  const setSession = useCallback((s: Session | null) => {
    setSessionState(s);
    if (s?.code !== codeRef.current) {
      setResponses([]);
      setSafety([]);
    }
  }, []);

  useEffect(() => {
    void api<Session | null>('/api/sessions-current').then((s) => s && setSessionState(s)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let lastSeen = Date.now();
    let retry = 0;
    let failures = 0;
    let pollTimer = 0;
    let closed = false;
    const k = encodeURIComponent(teacherKey());

    const load = async () => {
      if (!code) return;
      try {
        const list = await api<StudentResponse[]>(`/api/sessions/${code}/responses`);
        setResponses((p) => mergeById(p, list));
        setSafety((p) => {
          const known = new Set(p.map((x) => x.responseId));
          return [...p, ...list.filter((r) => r.safety && !known.has(r.id)).map((r) => ({ responseId: r.id, grade: r.grade, at: r.createdAt }))];
        });
      } catch {
        /* 다음 차례에 */
      }
    };

    const onMessage = (msg: MessageEvent<string>) => {
      lastSeen = Date.now();
      failures = 0;
      setConnected(true);
      const e = JSON.parse(msg.data) as StreamEvent;
      if (e.type === 'response') setResponses((p) => mergeById(p, [e.response]));
      if (e.type === 'safety') setSafety((p) => (p.some((x) => x.responseId === e.responseId) ? p : [...p, { responseId: e.responseId, grade: e.grade, at: e.at }]));
      if (e.type === 'session' && e.session.code === codeRef.current) setSessionState(e.session);
      if (e.type === 'pipeline.step') setSteps((p) => [...p.slice(-60), e]);
      if (e.type === 'reset') {
        setSessionState(null);
        setResponses([]);
        setSafety([]);
        setResetSignal((n) => n + 1);
      }
    };

    const startPolling = () => {
      setTransport('poll');
      setConnected(true);
      window.clearInterval(pollTimer);
      pollTimer = window.setInterval(() => void load(), 2000);
    };

    const connect = () => {
      if (closed) return;
      es = new EventSource(`/api/stream?${code ? `session=${code}&` : ''}k=${k}`);
      lastSeen = Date.now();
      es.onopen = () => {
        lastSeen = Date.now();
        setConnected(true);
        setTransport('sse');
      };
      es.onerror = () => {
        setConnected(false);
        if (es?.readyState === EventSource.CLOSED) reconnect();
      };
      es.addEventListener('ping', () => (lastSeen = Date.now()));
      es.onmessage = onMessage;
    };
    const reconnect = () => {
      es?.close();
      setConnected(false);
      failures++;
      if (failures >= 3) return startPolling();
      window.clearTimeout(retry);
      retry = window.setTimeout(() => {
        connect();
        void load(); // 끊긴 사이에 온 제출을 채운다(id로 중복 제거)
      }, 2000);
    };

    void load();
    connect();
    // 서버 ping(5초)이 15초 넘게 없으면 죽은 연결로 보고 다시 연다
    const watch = window.setInterval(() => {
      if (transport === 'sse' && Date.now() - lastSeen > 15000) reconnect();
    }, 3000);
    return () => {
      closed = true;
      window.clearInterval(watch);
      window.clearInterval(pollTimer);
      window.clearTimeout(retry);
      es?.close();
    };
    // transport는 시작값만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const value = useMemo(() => ({ session, setSession, responses, safety, steps, connected, transport, resetSignal }), [session, setSession, responses, safety, steps, connected, transport, resetSignal]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
