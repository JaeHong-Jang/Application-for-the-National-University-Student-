/** @type {import('tailwindcss').Config} */
// v3 "칠판과 분필" 토큰(docs/design/DESIGN_CONCEPT.md). 값은 src/ui/tokens.js 한 곳에만 있다.
// 뜻 색은 하나에 하나: board=주색(칠판), chalk=강조(분필 노랑), lo/hi/tg=낮은 학년/높은 학년/함께,
// ok=통과, warn=주의, bad=위반, ai=AI 초안, ink=종이 위 글자·선.
// 다크 변형은 화면에서만 켠다 → 인쇄는 늘 밝은 화면.
import { tokens } from './src/ui/tokens.js';

export default {
  darkMode: ['variant', '@media screen { &:is(.dark *) }'],
  content: ['./index.html', './s/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ...tokens, chalkwhite: '#F4F1E8', wood: { 400: '#9A7752', 500: '#7E5F40', 600: '#634A33' } },
      // KRDS 기준에 가깝게: 본문 17px(base)·줄간 150% 이상. 촘촘한 교사 화면이라 보조 글은 13·15px, 최소 12px(2xs).
      // 글자 단계는 여기 한 곳만 쓴다(임의 px 금지). 모두 rem이라 심사 모드(html.present)에서 함께 커진다.
      // 2xs 12 배지·눈금·출처 · xs 13 메타 · sm 15 보조·설명 · base 17 주 읽기 글 · lg 19 카드 제목 · xl 20 섹션 제목 · 28 쪽 제목
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.125rem' }],
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.5rem' }],
        base: ['1.0625rem', { lineHeight: '1.65rem' }],
        lg: ['1.1875rem', { lineHeight: '1.75rem' }],
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'sans-serif'],
        hand: ['Yeon Sung', 'Pretendard Variable', 'Pretendard', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 0 rgb(43 42 38 / 0.04), 0 1px 3px rgb(73 58 30 / 0.07)',
        lift: '0 2px 4px rgb(73 58 30 / 0.06), 0 8px 24px -8px rgb(73 58 30 / 0.16)',
        board: 'inset 0 0 0 1px rgb(255 255 255 / 0.05), inset 0 0 80px rgb(0 0 0 / 0.28), 0 10px 30px -12px rgb(21 43 35 / 0.45)',
      },
      keyframes: {
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        flow: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '24px 0' } },
        rise: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        draw: { '0%': { strokeDashoffset: '1' }, '100%': { strokeDashoffset: '0' } },
        // 새로 들어온 질문·승인된 칸: 분필 노랑 테두리가 잠깐 빛났다가 사라진다
        arrive: { '0%': { boxShadow: '0 0 0 3px rgb(242 201 76 / .95)' }, '70%': { boxShadow: '0 0 0 3px rgb(242 201 76 / .7)' }, '100%': { boxShadow: '0 0 0 3px rgb(242 201 76 / 0)' } },
        // 교사 승인 도장: 살짝 크게 찍혔다가 자리를 잡는다
        stamp: { '0%': { transform: 'scale(1.6) rotate(-8deg)', opacity: '0' }, '60%': { transform: 'scale(.94) rotate(-2deg)', opacity: '1' }, '100%': { transform: 'none', opacity: '1' } },
        // 검사 통과로 바뀐 순간 게이트 카드가 한 번 번쩍
        pass: { '0%': { boxShadow: '0 0 0 0 rgb(111 154 58 / .55)' }, '100%': { boxShadow: '0 0 0 14px rgb(111 154 58 / 0)' } },
        // 검사기 적발 배너가 위에서 내려온다
        drop: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        flow: 'flow .8s linear infinite',
        rise: 'rise .35s ease-out both',
        draw: 'draw .7s cubic-bezier(.6,.05,.3,1) .15s both',
        arrive: 'arrive 1.8s ease-out both',
        stamp: 'stamp .45s cubic-bezier(.2,.9,.3,1.2) both',
        pass: 'pass .9s ease-out 2',
        drop: 'drop .35s ease-out both',
      },
    },
  },
  plugins: [],
};
