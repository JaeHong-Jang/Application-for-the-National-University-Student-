// 성취기준 인덱스 만들기 (일회성 데이터 작업)
// 사용: npm run data:build -- <kr-curriculum-2022 클론 폴더> [NCIC 사회 텍스트] [NCIC 수학 텍스트]
// 1) data/초/*.jsonl (611건) → data/standards.index.json  (textVerified:false)
// 2) NCIC PDF에서 뽑은 텍스트가 있으면 데모 코드(4사01-*, 4사05-*, 4수01-*)를 공백 무시로 대조해 data/standards.demo.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [repo, ncicSocial, ncicMath] = process.argv.slice(2);
if (!repo) throw new Error('kr-curriculum-2022 클론 폴더 경로가 필요합니다');

const SOURCE = '교육부 고시 제2022-33호, 한국교육과정평가원(NCIC) / kr-curriculum-2022';
const dir = join(repo, 'data', '초');
const out: Record<string, unknown>[] = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.jsonl')).sort()) {
  for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const d = JSON.parse(line);
    const code = String(d.code).replace(/[[\]\s]/g, '').replace(/[–—]/g, '-');
    out.push({
      code,
      band: Number(code[0]),
      subject: d.subject,
      course: d.course ?? d.subject,
      domainNo: Number(code.match(/(\d{2})-\d{2}$/)?.[1] ?? 0),
      statement: d.statement,
      levels: d.levels ?? null,
      needsReview: Boolean(d.needs_review),
      textVerified: false,
      source: SOURCE,
    });
  }
}
const codes = new Set(out.map((x) => x.code));
if (codes.size !== out.length) throw new Error(`코드 중복 ${out.length - codes.size}건`);
writeFileSync('data/standards.index.json', JSON.stringify(out, null, 1));
console.log(`standards.index.json: ${out.length}건, 중복 0`);

// ---- NCIC 대조 ----
const squash = (s: string) => s.replace(/\s+/g, '').replace(/[–—]/g, '-');
function ncicStatement(text: string, code: string): string | null {
  // "[4사01–02] 문장... \n이어지는 줄" 형태. 다음 '[' 또는 '(' 머리줄이나 빈 줄 전까지 잇는다
  const lines = text.split('\n');
  const re = new RegExp(`^\\[${code.replace('-', '[-–]')}\\]\\s*(.*)$`);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) continue;
    let s = m[1];
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (!l.trim() || /^\s*[[(•]/.test(l) || /^\d+$/.test(l.trim())) break;
      s += l;
      if (/다\s*\.?\s*$/.test(s.trim())) break;
    }
    // 같은 줄 옆 여백 글자(단원 표시 등)가 붙어 나오므로 첫 '다.'에서 자른다
    const end = s.search(/다\s*\./);
    return (end >= 0 ? s.slice(0, s.indexOf('.', end) + 1) : s).trim();
  }
  return null;
}
if (ncicSocial && ncicMath) {
  const texts = { 사회: readFileSync(ncicSocial, 'utf8'), 수학: readFileSync(ncicMath, 'utf8') } as const;
  const demo = out
    .filter((x) => /^4사0[15]-|^4수01-/.test(String(x.code)))
    .map((x) => {
      const t = texts[x.subject as '사회' | '수학'];
      const ncic = ncicStatement(t, String(x.code));
      const same = ncic !== null && squash(ncic).replace(/\.$/, '') === squash(String(x.statement)).replace(/\.$/, '');
      // 알려진 추출 흔적: 4사01-02 '탐 색'(NCIC 원문은 줄바꿈으로 나뉜 '탐색'). 이것만 바로잡고 기록한다
      const fixed = String(x.statement).replace('탐 색한다', '탐색한다');
      return {
        ...x,
        statement: fixed,
        extractionFix: fixed !== x.statement ? `'탐 색' → '탐색' (NCIC PDF 줄바꿈 흔적)` : null,
        // 추출 흔적(예: '탐 색')은 NCIC 쪽 띄어쓰기로 바로잡지 않는다: 공백만 다르면 같은 문장으로 본다
        textVerified: same,
        verifyNote: same
          ? 'NCIC PDF 텍스트와 공백 제외 자동 대조 일치(사람 최종 대조 전)'
          : `NCIC 대조 불일치 또는 미발견: ${ncic ?? '(없음)'}`,
      };
    });
  writeFileSync('data/standards.demo.json', JSON.stringify(demo, null, 1));
  console.log(`standards.demo.json: ${demo.length}건, 일치 ${demo.filter((d) => d.textVerified).length}건`);
  demo.filter((d) => !d.textVerified).forEach((d) => console.log('  불일치', (d as Record<string, unknown>).code, d.verifyNote));
}
