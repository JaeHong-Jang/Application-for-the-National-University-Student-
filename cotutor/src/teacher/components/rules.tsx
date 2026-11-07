// 검사 규칙 이름(R1~R12). 화면에는 쉬운 말을 먼저 쓰고 R 번호는 툴팁·작은 글자로만(심사 모드에선 숨김)
import type { RuleId } from '../../../shared/contracts';
import { usePresent } from '../../ui/present';

export const RULE_NAME: Record<RuleId, string> = {
  R1: '학년별 0~D분 빈틈·겹침 없음',
  R2: '같은 시각 직접지도 1개',
  R3: '통합(★)은 두 학년 공통',
  R4: '간접지도 카드 필수 요소',
  R5: '교사 이동 횟수',
  R6: '학년별 직접지도 비율',
  R7: '간접지도 길이',
  R8: '간접 시작 전 과제 안내',
  R9: '시끄러운 간접 ↔ 직접 겹침',
  R10: '성취기준 코드·학년군',
  R11: '학년별 시간 합 = 수업 시간',
  R12: '개인정보 없음',
};

/** 짧은 이름(꼬리표·칩용) */
export const RULE_SHORT: Record<RuleId, string> = {
  R1: '시간 빈틈',
  R2: '직접지도 겹침',
  R3: '통합 공통',
  R4: '카드 요소',
  R5: '교사 이동',
  R6: '직접지도 비율',
  R7: '간접 길이',
  R8: '과제 안내',
  R9: '소음 겹침',
  R10: '성취기준 코드',
  R11: '시간 합',
  R12: '개인정보',
};

export const RULES = Object.keys(RULE_NAME) as RuleId[];
const isRule = (x: string): x is RuleId => x in RULE_NAME;

/** 규칙 꼬리표: 보통 모드 "R2 직접지도 겹침", 심사 모드 "직접지도 겹침"(R 번호는 툴팁) */
export function RuleTag({ rule, className = '' }: { rule: string; className?: string }) {
  if (!isRule(rule)) return <span className={className}>{rule}</span>;
  return (
    <span className={`whitespace-nowrap ${className}`} title={`${rule} · ${RULE_NAME[rule]}`}>
      <span className="dev mr-1 font-mono">{rule}</span>
      {RULE_SHORT[rule]}
    </span>
  );
}

/** 문장 안의 R 번호를 심사 모드에서는 쉬운 말로 바꾼다 */
export function RuleText({ text }: { text: string }) {
  const { present } = usePresent();
  if (!present) return <>{text}</>;
  return <>{text.split(/\b(R1[0-2]|R[1-9])\b/).map((part, i) => (isRule(part) ? <abbr key={i} title={`${part} · ${RULE_NAME[part]}`} className="no-underline">{RULE_SHORT[part]}</abbr> : part))}</>;
}
