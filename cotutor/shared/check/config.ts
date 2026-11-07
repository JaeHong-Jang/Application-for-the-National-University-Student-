// 검사 기본값. R5·R6·R7 값은 현직 교사 확인 전 가정값이다(화면에 "기본값(교사 검토 필요)"으로 표시).
export const CHECK_DEFAULTS = {
  maxTransitions: 3, // R5
  minDirectShare: 0.3, // R6: 분리 구간 길이 대비 학년별 직접지도 비율
  minIndirectMin: 5, // R7
  maxIndirectMinLowGrade: 15, // R7: 1~2학년
};
export type CheckConfig = typeof CHECK_DEFAULTS;
export const CHECK_DEFAULTS_NOTE = '기본값(교사 검토 필요)';
