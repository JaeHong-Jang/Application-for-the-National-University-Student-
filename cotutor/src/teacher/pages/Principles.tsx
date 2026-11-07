// 근거 · 데이터·원칙: 개인정보·윤리 원칙(명세 §13), AI 경로, 출처와 라이선스
import { Bot, EyeOff, FileWarning, History, Lock, ShieldCheck, UserX } from 'lucide-react';
import { AI_MODE_KO, INJECT_NOTE } from '../../ui/aiLabel';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { PageHeader, Section } from '../../ui/Section';
import { useApp } from '../App';

const PRINCIPLES = [
  { icon: ShieldCheck, title: '선생님이 승인하기 전엔 아무것도 안 나가요', body: '학생 페이지에는 AI 출력이 없어요. 과정안과 카드는 선생님이 승인한 뒤에만 인쇄돼요.' },
  { icon: UserX, title: '학생 계정·이름·사진을 받지 않아요', body: '수업 코드와 학년만 써요. 학생 기기에는 무작위 ID만 남아요.' },
  { icon: EyeOff, title: '보내자마자 개인정보를 가려요', body: 'AI에는 가린 글만 보내요. 원문은 선생님만 보고, 보관 기간(기본 7일)이 지나면 지워요.' },
  { icon: FileWarning, title: '위기 신호는 AI가 해석하지 않아요', body: '묶기에서 빼고 선생님께 알림만 띄워요. 학생과 직접 이야기하도록 안내해요.' },
  { icon: Lock, title: '학생부 문장과 평가 점수는 만들지 않아요', body: '모든 제안에 성취기준 코드와 근거 질문을 붙여요.' },
  { icon: History, title: 'AI 초안 표시와 선생님 수정 기록을 남겨요', body: '외부 AI 서버는 국외일 수 있어 개인정보를 보내지 않아요. 기본 경로(Ollama)는 학교 PC 안에서 돌아요.' },
];

const SOURCES = [
  { name: '성취기준 원문', who: '교육부 고시 제2022-33호 · 한국교육과정평가원 NCIC', lic: '공공누리' },
  { name: '성취기준 코드 인덱스', who: 'kr-curriculum-2022 (bobthecodebuilder88)', lic: 'MIT(코드) · 공공누리(데이터)' },
  { name: '복식학급 모형', who: '충청북도교육청 「초등학교 복식학급 운영 도움자료」(2025) 부분통합 모형', lic: '공공 자료 인용' },
  { name: 'UI 부품', who: 'masdae-pass(셸·한눈에·에이전트 팀 화면 구조) · masdae-market · 윤슬 · TTA-Service — 본인 작업에서 옮김. 시각 디자인은 v3 칠판과 분필(docs/design/DESIGN_CONCEPT.md)', lic: 'THIRD_PARTY_NOTICES.md' },
  { name: '글꼴', who: 'Pretendard(본문) · Yeon Sung(손글씨 강조) · JetBrains Mono(코드) — 모두 로컬 번들', lic: 'SIL OFL 1.1' },
];

export function Principles() {
  const { status } = useApp();
  const hand = status?.fixtureOrigins.includes('hand-authored');
  const handEdit = status?.fixtureOrigins.includes('ollama-live+hand-edit');
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="근거 · 데이터와 원칙" title="데이터·원칙" desc="함께반이 학생 글과 AI를 다루는 방식이에요. 모두 기능으로 들어가 있고, 데모에서도 그대로 돌아가요." />
      <ul className="grid gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3" data-testid="principles">
        {PRINCIPLES.map((p) => (
          <li key={p.title}>
            <Card className="h-full p-4 sm:p-5">
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-board-900 text-chalk-300 dark:bg-board-800">
                <p.icon size={18} aria-hidden />
              </span>
              <div className="text-base font-bold text-ink-900 dark:text-chalkwhite">{p.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-board-200">{p.body}</p>
            </Card>
          </li>
        ))}
      </ul>
      {/* 2단은 xl부터(1024에서 라이선스 칸이 한 글자 폭으로 무너지던 문제) */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <Section
          title={
            <span className="flex items-center gap-2">
              <Bot size={16} aria-hidden /> AI 경로
            </span>
          }
          desc="실시간 AI가 실패하거나 늦거나 형식이 틀리면 → 녹화된 응답 → 규칙 템플릿 순서로 내려가요. 화면의 모든 AI 결과에 경로를 붙여요."
        >
          {status ? (
            <dl className="divide-y divide-ink-100 text-sm dark:divide-board-700">
              {[
                ['모드', <Badge key="m" tone="ink">{AI_MODE_KO[status.mode]}</Badge>],
                ['공급자', status.provider],
                ['수업 모델', <span key="l" className="font-mono text-xs">{status.models.lesson}</span>],
                ['군집 모델', <span key="c" className="font-mono text-xs">{status.models.cluster}</span>],
                ['연결', status.reachable == null ? '확인 전' : status.reachable ? '됨' : '안 됨 → 녹화 응답으로 대체'],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-600 dark:text-board-300">{k}</dt>
                  <dd className="text-right font-semibold text-ink-800 dark:text-ink-100">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-ink-600 dark:text-board-300">확인 중…</p>
          )}
          {(hand || handEdit) && (
            <p className="mt-3 rounded-lg bg-paper-deep px-3 py-2 text-sm leading-relaxed text-ink-800 ring-1 ring-ink-200 dark:bg-board-950/40 dark:text-ink-100 dark:ring-board-700" data-testid="inject-disclosure">
              <b>*</b> {hand && '일부 녹화 응답은 수작업 예시예요(실제 API 녹화 아님). '}
              {handEdit && `녹화된 수업 초안(Ollama 로컬 모델): ${INJECT_NOTE.replace('(데이터·원칙 참고)', '')}`}
            </p>
          )}
        </Section>
        <Section title="출처와 라이선스" desc="옮긴 코드와 데이터의 출처예요. 자세한 내용은 THIRD_PARTY_NOTICES.md와 LICENSES/에 있어요.">
          <ul className="divide-y divide-ink-100 dark:divide-board-700">
            {SOURCES.map((s) => (
              <li key={s.name} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="w-32 shrink-0 font-bold text-ink-800 dark:text-ink-100">{s.name}</span>
                <span className="min-w-[12rem] flex-1 basis-48 text-ink-700 dark:text-ink-200">{s.who}</span>
                <Badge tone="ink" className="shrink-0">{s.lic}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
