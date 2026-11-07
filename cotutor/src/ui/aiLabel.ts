// AI 경로를 말하는 낱말 사전 하나. 상단 알약과 본문 출처 칩이 같은 말을 쓴다(서로 어긋나 보이지 않게).
import type { AiSource, AiStatus } from '../../shared/contracts';

export const AI_MODE_KO = {
  live: '로컬 AI 실시간',
  replay: '녹화된 AI 응답 재생',
  rules: 'AI 없이 규칙 템플릿',
} as const;

export function statusLabel(s: AiStatus) {
  if (s.mode === 'live') return s.provider === 'anthropic' ? 'Claude 실시간' : AI_MODE_KO.live;
  return AI_MODE_KO[s.mode];
}

/** 이 녹화본에 수리 장면용 위반을 손으로 넣었는지(정직 표시는 한 곳: 출처 칩의 각주 + 데이터·원칙) */
export const isInjected = (s: AiSource | null | undefined) => !!s && /위반 주입|hand-edit/.test(`${s.origin} ${s.note ?? ''}`);

export function sourceLabel(s: AiSource) {
  if (s.mode === 'live') return s.provider === 'anthropic' ? 'Claude 실시간' : AI_MODE_KO.live;
  if (s.mode === 'replay') return s.origin.includes('수작업') ? '수작업 예시 응답' : AI_MODE_KO.replay;
  return AI_MODE_KO.rules;
}

export const INJECT_NOTE = '수리 장면을 보이려고 이 녹화본의 첫 초안에 위반 1건을 손으로 넣었어요. 수리 응답은 실제 모델 응답이에요(데이터·원칙 참고).';
