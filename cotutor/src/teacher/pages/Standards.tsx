// 근거 · 성취기준: 이번 수업이 인용한 성취기준 원문과 성취수준, 단원 ↔ 성취기준 예시 매핑. 모두 기존 API(/api/lessons/current, /api/meta)에서 읽는다.
import { BookOpenCheck, ExternalLink } from 'lucide-react';
import type { StandardEntry } from '../../../shared/contracts';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { StatTile } from '../../ui/StatTile';
import { PageHeader, Section } from '../../ui/Section';
import { LANE_COLOR } from '../../ui/gradeColors';
import { useApp } from '../App';
import { StdChip } from '../components/bits';

function StandardCard({ s, lane }: { s: StandardEntry; lane: 'A' | 'B' | 'ALL' }) {
  return (
    <Card className="relative overflow-hidden p-4 pl-5">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${LANE_COLOR[lane].bar}`} aria-hidden />
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <StdChip code={s.code} entry={s} lane={lane} />
        <Badge tone="ink">
          {s.subject} · {s.band - 1}~{s.band}학년군
        </Badge>
        {s.needsReview && <Badge tone="warn">사람 대조 필요</Badge>}
      </div>
      <p className="text-base font-semibold leading-relaxed text-ink-900 dark:text-ink-50">{s.statement}</p>
      {s.levels && (
        <ul className="mt-3 space-y-1.5">
          {(['A', 'B', 'C'] as const)
            .filter((k) => s.levels?.[k])
            .map((k) => (
              <li key={k} className="flex gap-2 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink-100 font-mono text-2xs font-semibold text-ink-700 dark:bg-board-800 dark:text-ink-200">{k}</span>
                <span className="leading-relaxed text-ink-700 dark:text-ink-200">{s.levels![k]}</span>
              </li>
            ))}
        </ul>
      )}
      <p className="mt-3 border-t border-ink-100 pt-2 text-2xs text-ink-600 dark:border-board-700 dark:text-board-300">
        {s.source}
        {s.verifyNote && ` · ${s.verifyNote}`}
      </p>
    </Card>
  );
}

export function Standards() {
  const { lesson, standards, meta } = useApp();
  if (!lesson) return <EmptyState icon={<BookOpenCheck size={20} aria-hidden />} title="수업이 없어요" body="수업 설계에서 초안을 만들면 인용한 성취기준이 여기에 모여요." />;
  const used = lesson.standards.map((x) => ({ lane: x.lane, s: standards.get(x.code) })).filter((x): x is { lane: 'A' | 'B' | 'ALL'; s: StandardEntry } => !!x.s);
  const pool = [...standards.values()];
  const verified = pool.filter((s) => s.textVerified).length;
  const units = (meta?.units ?? []).filter((u) => u.subject === lesson.subject && (u.grade === lesson.gradeA || u.grade === lesson.gradeB));
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="근거 · 성취기준"
        title="성취기준"
        desc="성취기준 문장은 AI가 쓰지 않아요. 교육부 고시 원문을 그대로 가져오고, 코드가 있는지·학년군과 교과가 맞는지는 코드 검사기가 봐요."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {[
          { k: '초등 인덱스', v: '611', u: '건', n: 'kr-curriculum-2022 · 10개 교과 + 통합교과' },
          { k: `이번 수업 후보(${lesson.subject})`, v: String(pool.length), u: '건', n: `${lesson.gradeA}·${lesson.gradeB}학년 학년군 풀` },
          { k: '원문 확인됨', v: String(verified), u: '건', n: 'NCIC PDF 자동 대조 · 사람 최종 확인 전' },
          { k: '이번 수업 인용', v: String(lesson.standards.length), u: '건', n: '모든 블록·평가에 코드 칩으로 표시' },
        ].map((x) => (
          <StatTile key={x.k} label={x.k} value={x.v} unit={x.u} note={x.n} />
        ))}
      </div>
      <Section title="이번 수업이 인용한 성취기준" desc="원문 진술과 성취수준(A·B·C)이에요. 다음 차시 카드의 목표 수준도 이 진술을 인용해요.">
        <div className="grid gap-3 lg:grid-cols-2">
          {used.map((x) => (
            <StandardCard key={x.s.code} s={x.s} lane={x.lane} />
          ))}
        </div>
      </Section>
      <Section
        title="단원 ↔ 성취기준 예시 매핑"
        desc="단원명은 출판사마다 달라 예시예요. 학교 채택 교과서에 맞게 선생님이 고쳐 써요(data/units.demo.csv)."
        actions={
          <a className="btn-ghost btn-sm" href="https://ncic.re.kr" target="_blank" rel="noopener noreferrer">
            NCIC 원문 <ExternalLink size={12} aria-hidden />
          </a>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs text-ink-600 dark:border-board-700 dark:text-board-300">
                <th className="px-2 py-2 font-semibold">학년</th>
                <th className="px-2 py-2 font-semibold">단원(예시)</th>
                <th className="px-2 py-2 font-semibold">성취기준</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-board-700">
              {units.map((u) => {
                const lane = u.grade === lesson.gradeA ? 'A' : 'B';
                return (
                  <tr key={u.label + u.grade}>
                    <td className={`px-2 py-2 font-bold ${LANE_COLOR[lane].text}`}>{u.grade}학년</td>
                    <td className="px-2 py-2 text-ink-700 dark:text-ink-200">{u.label}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.codes.map((c) => (
                          <StdChip key={c} code={c} entry={standards.get(c)} lane={lane} />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
