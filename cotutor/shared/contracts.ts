// 데이터 계약. 도메인 스키마(앱 내부 검증)와 LLM 출력 스키마(구조화 출력)를 나눈다.
// LLM 출력 스키마에는 .min/.max/.length, 재귀, optional을 쓰지 않는다. 범위는 검사기가 본다.
import { z } from 'zod';

export const Grade = z.number().int(); // 1~6, 범위는 코드로 검사
export const Lane = z.enum(['A', 'B', 'ALL']); // A=낮은 학년, B=높은 학년
export const Mode = z.enum(['JOINT', 'DIRECT', 'INDIRECT']);
export const PairType = z.enum(['SAME_BAND', 'CROSS_BAND', 'NON_ADJACENT']);
export const LessonType = z.enum(['복수교과병행', '단일교과복수활동', '단일교과단일활동수준별', '단일교과단일활동통합']);
export const Method = z.enum(['분리', '부분통합', '시간차']);
// 코드는 괄호 없이 저장('4사01-02'), 화면에는 '[4사01-02]'로 표시
export const STD_CODE_RE = /^[246](국|수|사|과|영|도|실|미|음|체|바|슬|즐)\d{2}-\d{2}$/;
export const StdCode = z.string().regex(STD_CODE_RE);

export const StandardRef = z.object({ code: StdCode, lane: Lane, why: z.string() });

export const IndirectCard = z.object({
  withWhom: z.enum(['혼자', '짝', '모둠']),
  steps: z.array(z.string()), // 2~5개 (개수는 R4가 검사)
  doneSignal: z.string(),
  ifStuck: z.string(),
  output: z.string(),
  guideRole: z.string(),
  physicalRisk: z.string().nullable(),
});

export const Segment = z.object({
  id: z.string(),
  kind: z.enum(['JOINT_INTRO', 'SPLIT', 'JOINT_WRAP']),
  startMin: z.number().int(),
  endMin: z.number().int(),
});

export const Noise = z.enum(['quiet', 'normal', 'loud']);
export const Phase = z.enum(['도입', '전개', '정리']);

export const TimelineBlock = z.object({
  id: z.string(),
  segmentId: z.string(),
  lane: Lane,
  startMin: z.number().int(),
  endMin: z.number().int(),
  mode: Mode,
  phase: Phase,
  activity: z.string(),
  materials: z.array(z.string()),
  noise: Noise,
  card: IndirectCard.nullable(),
  standardCodes: z.array(StdCode),
});

export const Assessment = z.object({
  lane: z.enum(['A', 'B']),
  code: StdCode,
  excellent: z.string(), // ◎
  good: z.string(), // ○
  needsSupport: z.string(), // △
  method: z.string(),
});

export const AiSource = z.object({
  step: z.string(),
  mode: z.enum(['live', 'replay', 'rules']),
  provider: z.enum(['ollama', 'anthropic', 'fixture', 'rules']),
  model: z.string().nullable(),
  origin: z.string(), // 'live·ollama' | 'replay·ollama 녹화' | 'replay·수작업 예시' | 'rules'
  ms: z.number(),
  note: z.string().nullable(),
});

export const Lesson = z.object({
  id: z.string(),
  gradeA: Grade,
  gradeB: Grade,
  subject: z.string(),
  units: z.object({ A: z.string().nullable(), B: z.string().nullable() }),
  pairType: PairType,
  lessonType: LessonType,
  method: Method,
  durationMin: z.number().int(),
  hasAssistant: z.boolean(),
  commonTheme: z.string(),
  standards: z.array(StandardRef),
  segments: z.array(Segment),
  blocks: z.array(TimelineBlock),
  assessment: z.array(Assessment),
  status: z.enum(['draft', 'approved']),
  aiMeta: z.object({
    mode: z.enum(['live', 'replay', 'rules']),
    model: z.string().nullable(),
    promptVersion: z.string(),
    repairs: z.number().int(),
    violationsFixed: z.array(z.string()),
    ms: z.number(),
    // 아래는 원 스키마에 더한 것(BUILD_NOTES 참고): 단계별 출처, 수리 후에도 남아 규칙으로 채운 블록
    sources: z.array(AiSource),
    flaggedBlockIds: z.array(z.string()),
    checkLog: z.array(z.object({ round: z.number().int(), errors: z.array(z.string()), warns: z.array(z.string()) })),
    // 첫 검사에서 잡은 error 원문(화면의 "검사기가 AI 초안 오류를 잡음" 배너 전/후 표시용). 예전 저장본에는 없다
    firstErrors: z.array(z.object({ rule: z.string(), message: z.string(), blockIds: z.array(z.string()) })).optional(),
  }),
  edits: z.array(z.object({ path: z.string(), before: z.unknown(), after: z.unknown(), at: z.string() })),
  previousLessonId: z.string().nullable(),
});

export const PiiFlag = z.enum(['PHONE', 'EMAIL', 'RRN', 'NAME_LIKE', 'ADDRESS_LIKE']);
export const StudentResponse = z.object({
  id: z.string(),
  sessionCode: z.string(),
  grade: Grade,
  kind: z.enum(['question', 'answer']),
  promptId: z.string().nullable(),
  text: z.string(), // 마스킹된 본문 (LLM에는 이것만)
  rawText: z.string(), // 교사만, 보관기간 후 삭제
  piiFlags: z.array(PiiFlag),
  safety: z.boolean(),
  clientId: z.string(),
  createdAt: z.string(),
});

export const ClusterType = z.enum(['오개념', '절차 실수', '어휘', '호기심·확장', '수업 운영', '기타']);
export const Cluster = z.object({
  id: z.string(),
  sessionCode: z.string(),
  label: z.string(),
  criteria: z.string(),
  lane: Lane,
  linkedCode: StdCode.nullable(),
  type: ClusterType,
  questionIds: z.array(z.string()),
  representativeId: z.string(),
  teacherEdited: z.boolean(),
});

export const NextLessonCard = z.object({
  id: z.string(),
  lessonId: z.string(),
  lane: z.enum(['A', 'B']),
  kind: z.enum(['보충', '심화']),
  title: z.string(),
  targetCode: StdCode,
  targetLevel: z.enum(['A', 'B', 'C']),
  basedOnClusterIds: z.array(z.string()),
  minutes: z.number().int(),
  card: IndirectCard,
  teacherNote: z.string(), // 학생판 인쇄에서 제거
  status: z.enum(['draft', 'approved', 'rejected']),
});

export const RuleId = z.enum(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12']);
export const Violation = z.object({
  rule: RuleId,
  severity: z.enum(['error', 'warn']),
  blockIds: z.array(z.string()),
  range: z.object({ startMin: z.number(), endMin: z.number() }).nullable(),
  message: z.string(),
});

export type Lane = z.infer<typeof Lane>;
export type Mode = z.infer<typeof Mode>;
export type PairType = z.infer<typeof PairType>;
export type LessonType = z.infer<typeof LessonType>;
export type Method = z.infer<typeof Method>;
export type StandardRef = z.infer<typeof StandardRef>;
export type IndirectCard = z.infer<typeof IndirectCard>;
export type Segment = z.infer<typeof Segment>;
export type TimelineBlock = z.infer<typeof TimelineBlock>;
export type Assessment = z.infer<typeof Assessment>;
export type AiSource = z.infer<typeof AiSource>;
export type Lesson = z.infer<typeof Lesson>;
export type PiiFlag = z.infer<typeof PiiFlag>;
export type StudentResponse = z.infer<typeof StudentResponse>;
export type ClusterType = z.infer<typeof ClusterType>;
export type Cluster = z.infer<typeof Cluster>;
export type NextLessonCard = z.infer<typeof NextLessonCard>;
export type RuleId = z.infer<typeof RuleId>;
export type Violation = z.infer<typeof Violation>;

// ---------- LLM 출력 스키마 (라우트마다 1개 고정) ----------
// StdCode 정규식 알터네이션은 로컬 모델 grammar·구조화 출력에서 거부될 수 있어 z.string()으로 받고 R10으로 검사한다
const LlmCard = z.object({
  withWhom: z.enum(['혼자', '짝', '모둠']),
  steps: z.array(z.string()),
  doneSignal: z.string(),
  ifStuck: z.string(),
  output: z.string(),
  guideRole: z.string(),
  physicalRisk: z.string().nullable(),
});

export const PlannerOut = z.object({
  commonTheme: z.string(),
  lessonType: LessonType,
  method: Method,
  standards: z.array(z.object({ code: z.string(), lane: Lane, why: z.string() })),
  integrationPoints: z.array(z.string()),
  splitPoints: z.object({ A: z.string(), B: z.string() }),
});

export const FillerOut = z.object({
  blocks: z.array(
    z.object({
      id: z.string(),
      phase: Phase,
      activity: z.string(),
      materials: z.array(z.string()),
      noise: Noise,
      card: LlmCard.nullable(),
      standardCodes: z.array(z.string()),
    }),
  ),
  assessment: z.array(
    z.object({ lane: z.enum(['A', 'B']), code: z.string(), excellent: z.string(), good: z.string(), needsSupport: z.string(), method: z.string() }),
  ),
});

export const ClusterOut = z.object({
  clusters: z.array(
    z.object({
      label: z.string(),
      criteria: z.string(),
      lane: Lane,
      linkedCode: z.string().nullable(),
      type: ClusterType,
      questionIds: z.array(z.string()),
      representativeId: z.string(),
    }),
  ),
  flags: z.array(z.object({ questionId: z.string(), kind: z.enum(['SAFETY', 'PII']) })),
  unclustered: z.array(z.string()),
});

export const NextCardsOut = z.object({
  cards: z.array(
    z.object({
      lane: z.enum(['A', 'B']),
      kind: z.enum(['보충', '심화']),
      title: z.string(),
      targetCode: z.string(),
      targetLevel: z.enum(['A', 'B', 'C']),
      basedOnClusterIds: z.array(z.string()),
      minutes: z.number().int(),
      card: LlmCard,
      teacherNote: z.string(),
    }),
  ),
});

export const CriticOut = z.object({
  scores: z.array(z.object({ id: z.enum(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']), score: z.number(), evidenceBlockIds: z.array(z.string()) })),
  suggestion: z.string(),
});

export type PlannerOut = z.infer<typeof PlannerOut>;
export type FillerOut = z.infer<typeof FillerOut>;
export type ClusterOut = z.infer<typeof ClusterOut>;
export type NextCardsOut = z.infer<typeof NextCardsOut>;

// ---------- 성취기준 ----------
export interface StandardEntry {
  code: string;
  band: number;
  subject: string;
  course: string;
  domainNo: number;
  statement: string;
  levels: Partial<Record<'A' | 'B' | 'C', string>> | null;
  needsReview: boolean;
  textVerified: boolean;
  source: string;
  verifyNote?: string;
}

// ---------- API ----------
export interface LessonInput {
  gradeA: number;
  gradeB: number;
  subject: string;
  units: { A: string | null; B: string | null };
  durationMin: number;
  hasAssistant: boolean;
}

export interface Session {
  code: string;
  lessonId: string;
  gradeA: number;
  gradeB: number;
  prompt: { id: string; text: string } | null;
  createdAt: string;
  active: boolean;
}

export interface ClusterRun {
  sessionCode: string;
  flags: { questionId: string; kind: 'SAFETY' | 'PII' }[];
  unclustered: string[];
  source: AiSource;
  at: string;
  removed: string[]; // 코드 검사에서 빠진 항목 설명
}

export interface PublicSession {
  code: string;
  grades: [number, number];
  prompt: { id: string; text: string } | null;
  active: boolean;
}

export interface AiStatus {
  mode: 'live' | 'replay' | 'rules';
  provider: 'ollama' | 'anthropic';
  models: { lesson: string; cluster: string; judge: string };
  baseUrl: string | null;
  reachable: boolean | null;
  lastError: string | null;
  fixtureOrigins: string[];
}

export type StreamEvent =
  | { type: 'response'; response: StudentResponse }
  | { type: 'safety'; responseId: string; sessionCode: string; grade: number; at: string }
  | { type: 'session'; session: Session }
  | { type: 'pipeline.step'; runId: string; step: string; status: 'running' | 'done' | 'error'; detail: string; at: string }
  | { type: 'reset'; at: string };
