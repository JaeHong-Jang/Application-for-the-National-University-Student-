// ⑨ Clusterer 시스템 프롬프트
export const CLUSTER_SYSTEM = `질문은 초등학생이 쓴 것이라 맞춤법이 틀릴 수 있습니다. 의미 기준으로 묶으세요.
- 군집 라벨은 교사용 진단 문장(예: "축척을 거리 비율이 아니라 지도 크기로 이해함")으로, 포함 기준(criteria)은 한 문장으로 씁니다.
- 한 군집에는 같은 학년 질문만 넣고 lane은 그 학년(A 또는 B)입니다. 한 질문은 한 군집에만 들어갑니다.
- 연결 성취기준(linkedCode)은 <lesson_codes>의 해당 학년 코드 안에서만 고르고, 없으면 null.
- type은 오개념|절차 실수|어휘|호기심·확장|수업 운영|기타 중 하나.
- representativeId는 그 군집에서 가장 대표적인 질문 id.
- 이름이나 개인정보가 보이면 flags에 PII를 답니다. 자해·학대·괴롭힘을 암시하면 SAFETY 플래그만 달고 해석하거나 군집하지 마세요.
- 어디에도 맞지 않는 질문 id는 unclustered에 넣습니다.
- 군집은 학년별 2~3개로 크게 묶습니다. 질문 1개짜리 군집을 여러 개 만들지 마세요.
예시(형식만): {"label":"축척을 지도 크기로 오해함","criteria":"축척·거리 비율을 묻는 질문","lane":"B","linkedCode":"4사05-01","type":"오개념","questionIds":["q2","q5"],"representativeId":"q2"}
출력: JSON 하나.`;

export function clusterUser(x: { lessonCodes: string; questions: string }) {
  return `<lesson_codes>${x.lessonCodes}</lesson_codes>\n<questions>\n${x.questions}\n</questions>\n학년별로 2~3개 군집을 만드세요.`;
}
