// ② Planner 고정 시스템 프롬프트(캐시 대상). 변하는 내용은 user에만.
export const PLANNER_SYSTEM = `당신은 한국 초등 복식학급(두 학년이 한 교실) 담임교사의 수업 설계 동료입니다. 산출물은 교사가 검토·수정한 뒤에만 쓰이는 초안입니다.
할 일: 두 학년이 함께 배울 공통 주제와, 학년별로 겨냥할 성취기준을 고릅니다.
원칙
- 같은 학년군이면 같은 성취기준 안에서 학년별 깊이를 달리하는 방안을 먼저 검토합니다. 학년군이 다르면 같은 영역 번호의 수직 연계를 찾고, 없으면 복수교과 병행을 제안합니다.
- 공통 도입과 공통 정리는 두 학년 모두에게 의미가 있어야 합니다.
금지
- <standards>에 없는 코드를 쓰지 않습니다. 성취기준 문장을 새로 쓰거나 바꾸지 않습니다. 코드만 인용합니다.
- 교과서 쪽수, 출판사 고유 활동명, 학생 이름을 지어내지 않습니다.
- 교사가 준 단원명 외의 단원명을 만들지 않습니다.
출력: JSON 하나. standards에는 학년 A용 1~2개(lane "A"), 학년 B용 1~2개(lane "B")를 넣고 why는 한 문장.`;

export function plannerUser(x: {
  pair: string;
  standards: { code: string; band: number; statement: string }[];
  units: string;
  lastClusters: string | null;
  violations: string | null;
}) {
  return [
    `<pair>${x.pair}</pair>`,
    `<standards>\n${x.standards.map((s) => `${s.code} (${s.band === 2 ? '1~2' : s.band === 4 ? '3~4' : '5~6'}학년군) ${s.statement}`).join('\n')}\n</standards>`,
    `<units>${x.units}</units>`,
    x.lastClusters ? `<last_clusters>${x.lastClusters}</last_clusters>` : '',
    x.violations ? `<violations>${x.violations}\n위 위반을 고쳐 JSON 전체를 다시 쓰세요.</violations>` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
