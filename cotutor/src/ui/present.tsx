// 심사 모드(프로젝터 발표): html.present 클래스 하나로 글자 확대·사이드바 접기·개발 정보 숨김을 켠다.
// 켜는 법: 상단 토글, URL ?present=1(끄기 ?present=0). localStorage에 남는다. 기본은 꺼짐.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export const PRESENT_KEY = 'cotutor-present';
const Ctx = createContext<{ present: boolean; toggle: () => void }>({ present: false, toggle: () => undefined });
export const usePresent = () => useContext(Ctx);

function initial() {
  const q = new URLSearchParams(location.search).get('present');
  if (q === '1' || q === '0') {
    try {
      localStorage.setItem(PRESENT_KEY, q);
    } catch {
      /* 저장 불가 */
    }
    return q === '1';
  }
  try {
    return localStorage.getItem(PRESENT_KEY) === '1';
  } catch {
    return false;
  }
}

export function PresentProvider({ children }: { children: ReactNode }) {
  const [present, setPresent] = useState(initial);
  useEffect(() => {
    document.documentElement.classList.toggle('present', present);
    try {
      localStorage.setItem(PRESENT_KEY, present ? '1' : '0');
    } catch {
      /* 저장 불가 */
    }
  }, [present]);
  const toggle = useCallback(() => setPresent((p) => !p), []);
  return <Ctx.Provider value={{ present, toggle }}>{children}</Ctx.Provider>;
}

/** replay 단계 속도(ms). ?pace=0 또는 localStorage cotutor-pace로 바꾼다(e2e는 0으로 빠르게, 시연은 기본 700) */
export function replayPace(): number {
  const q = new URLSearchParams(location.search).get('pace');
  if (q != null && !Number.isNaN(Number(q))) {
    try {
      localStorage.setItem('cotutor-pace', q);
    } catch {
      /* 저장 불가 */
    }
    return Math.max(0, Number(q));
  }
  try {
    const v = localStorage.getItem('cotutor-pace');
    if (v != null && !Number.isNaN(Number(v))) return Math.max(0, Number(v));
  } catch {
    /* 저장 불가 */
  }
  return 700;
}
