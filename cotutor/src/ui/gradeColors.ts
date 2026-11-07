// 학년 레인 색: A=낮은 학년(분필 파랑 lo), B=높은 학년(분필 주황 hi), 함께=연두(tg). 이 세 색은 학년 말고 다른 뜻으로 쓰지 않는다.
// ■ 직접 = 진한 단색(흰 글자 4.5:1 이상), □ 간접 = 같은 색 빗금, ★ 함께 = 두 레인을 가로지르는 tg.
// Tailwind JIT가 찾도록 클래스 문자열을 통째로 적는다.
export const LANE_COLOR = {
  A: {
    solid: 'bg-lo-600 text-white border-lo-700 dark:bg-lo-600 dark:border-lo-400/60',
    hatch: 'hatch-a text-lo-900 border-lo-300 dark:text-lo-50 dark:border-lo-400/50',
    text: 'text-lo-700 dark:text-lo-300',
    soft: 'bg-lo-50/80 dark:bg-lo-500/10',
    border: 'border-lo-200 dark:border-lo-400/30',
    bar: 'bg-lo-600 dark:bg-lo-400',
    dot: 'bg-lo-500 dark:bg-lo-300',
  },
  B: {
    solid: 'bg-hi-600 text-white border-hi-700 dark:bg-hi-600 dark:border-hi-400/60',
    hatch: 'hatch-b text-hi-900 border-hi-300 dark:text-hi-50 dark:border-hi-400/50',
    text: 'text-hi-700 dark:text-hi-300',
    soft: 'bg-hi-50/80 dark:bg-hi-500/10',
    border: 'border-hi-200 dark:border-hi-400/30',
    bar: 'bg-hi-500 dark:bg-hi-400',
    dot: 'bg-hi-500 dark:bg-hi-300',
  },
  ALL: {
    solid: 'bg-tg-600 text-white border-tg-700 dark:bg-tg-600 dark:border-tg-400/60',
    hatch: 'bg-tg-50 text-tg-900 border-tg-300 dark:bg-tg-500/10 dark:text-tg-100 dark:border-tg-400/40',
    text: 'text-tg-700 dark:text-tg-300',
    soft: 'bg-tg-50/80 dark:bg-tg-500/10',
    border: 'border-tg-200 dark:border-tg-400/30',
    bar: 'bg-tg-500 dark:bg-tg-400',
    dot: 'bg-tg-500 dark:bg-tg-300',
  },
} as const;

export const MODE_MARK = { JOINT: '★', DIRECT: '■', INDIRECT: '□' } as const;
export const MODE_KO = { JOINT: '통합', DIRECT: '직접지도', INDIRECT: '간접지도' } as const;
export const NOISE_KO = { quiet: '조용', normal: '보통', loud: '시끄러움' } as const;
