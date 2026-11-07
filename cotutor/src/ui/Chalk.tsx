// 칠판과 분필 부품: 로고 마크, 손으로 그은 분필 밑줄, 분필 받침, 분필 점선
import { useId, type ReactNode } from 'react';

/** 로고: 작은 칠판 위에 겹친 분필 원 두 개(낮은 학년 파랑 · 높은 학년 주황), 겹친 곳이 "함께"(연두), 아래 분필 한 줄 */
export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <clipPath id={`lb${id}`}>
          <circle cx="19.6" cy="14.2" r="6.6" />
        </clipPath>
      </defs>
      <rect width="32" height="32" rx="8" fill="#1F3D33" />
      <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="none" stroke="#ffffff" strokeOpacity=".08" />
      <circle cx="12.4" cy="14.2" r="6.6" fill="#72AF90" clipPath={`url(#lb${id})`} />
      <circle cx="12.4" cy="14.2" r="6.6" fill="none" stroke="#92B3D7" strokeWidth="1.9" />
      <circle cx="19.6" cy="14.2" r="6.6" fill="none" stroke="#EDA483" strokeWidth="1.9" />
      <path d="M8.5 25.2c4.6-.9 10.4-.7 15.2-.2" fill="none" stroke="#F2C94C" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** 단어 밑에 분필로 그은 노란 줄. 처음 한 번 그려지는 움직임(prefers-reduced-motion이면 바로 보임) */
export function ChalkUnderline({ children, className = '' }: { children: ReactNode; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <span className={`relative inline-block whitespace-nowrap ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg className="pointer-events-none absolute -bottom-[0.18em] left-[-4%] h-[0.42em] w-[108%] overflow-visible" viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden>
        <defs>
          <filter id={`cr${id}`} x="-5%" y="-50%" width="110%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="3.2" />
          </filter>
        </defs>
        <g filter={`url(#cr${id})`} fill="none" strokeLinecap="round" className="text-chalk-400 print:text-chalk-600">
          <path d="M4 15 C 48 8, 102 17, 150 10 S 190 9, 196 8" stroke="currentColor" strokeWidth="7" pathLength={1} strokeDasharray="1" className="animate-draw motion-reduce:animate-none" />
          <path d="M14 19 C 60 14, 118 20, 186 13" stroke="currentColor" strokeOpacity=".55" strokeWidth="3" pathLength={1} strokeDasharray="1" className="animate-draw motion-reduce:animate-none" style={{ animationDelay: '.4s' }} />
        </g>
      </svg>
    </span>
  );
}

/** 칠판 아래 나무 받침 + 분필 토막 세 개(흰·노랑·파랑). 장식이라 화면 읽기에서 뺀다 */
export function ChalkTray({ className = '' }: { className?: string }) {
  return (
    <div className={`chalk-tray pointer-events-none absolute inset-x-0 bottom-0 h-2.5 ${className}`} aria-hidden>
      <span className="absolute -top-[5px] right-[12%] h-[5px] w-8 rotate-[-2deg] rounded-[2px] bg-chalkwhite/90 shadow-sm" />
      <span className="absolute -top-[5px] right-[calc(12%+2.75rem)] h-[5px] w-5 rotate-[3deg] rounded-[2px] bg-chalk-400 shadow-sm" />
      <span className="absolute -top-[5px] right-[calc(12%+4.6rem)] h-[5px] w-4 rounded-[2px] bg-lo-300 shadow-sm" />
    </div>
  );
}

/** 분필 점선 구분선 */
export function ChalkRule({ className = 'text-ink-300 dark:text-board-600' }: { className?: string }) {
  return <div className={`chalk-rule ${className}`} aria-hidden />;
}
