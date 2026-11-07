// 아이디어 소개서(.docx) 생성 — HWP 양식(표지 · 아이디어 분야 · 1. 요약 표 → 상세) 구성을 따른다
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, WidthType,
  BorderStyle, ShadingType, VerticalAlign, PageBreak, Footer, PageNumber, TableLayoutType,
} = require('docx');
const { imageSize } = (() => {
  // PNG 크기만 읽는다(외부 의존 없이)
  return { imageSize: (buf) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }) };
})();

const ROOT = '/mnt/c/Users/User/Desktop/대학교/3학년/2026 AI 활용 전략 해커톤/소개서';
const A = (f) => path.join(ROOT, 'assets', f);
const OUT = path.join(ROOT, '함께반_아이디어 소개서.docx');

const FONT = '맑은 고딕';
const C = { board: '1F3D33', boardSoft: 'E8EFEB', ink: '2B2A26', sub: '5C5A52', line: 'BFBAAE', paper: 'FAF7F0', chalk: 'F2C94C', chalkSoft: 'FDF4D3', blue: '3A6A9C', orange: 'A84E28', bad: 'B0362B', head: 'EFEBE1' };
const PAGE_W = 11906, MARGIN = 794; // A4, 여백 14mm
const W = PAGE_W - MARGIN * 2; // 본문 폭(DXA)
const CM = 567; // 1cm = 567 DXA
const EMU_PER_DXA = 635;

// ── 글자 조각 ──────────────────────────────────────────
// 문자열 안의 **굵게**를 TextRun으로 나눈다
function runs(text, o = {}) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p) => {
    const bold = p.startsWith('**');
    return new TextRun({ text: bold ? p.slice(2, -2) : p, bold: bold || o.bold, color: o.color ?? (bold && o.accent ? o.accent : C.ink), size: o.size ?? 18, font: FONT, italics: o.italics });
  });
}
const P = (text, o = {}) =>
  new Paragraph({ children: runs(text, o), alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 50, line: o.line ?? 264 }, indent: o.indent, keepNext: o.keepNext, keepLines: true });
// 개조식 항목: 들여쓰기 + 기호
const B = (text, o = {}) =>
  new Paragraph({
    children: [new TextRun({ text: (o.mark ?? '·') + ' ', font: FONT, size: o.size ?? 18, color: o.markColor ?? C.board, bold: true }), ...runs(text, o)],
    spacing: { before: 0, after: o.after ?? 30, line: o.line ?? 264 },
    indent: { left: o.left ?? 200, hanging: 160 },
    keepLines: true,
  });

// ── 제목 ──────────────────────────────────────────────
const H1 = (num, text) =>
  new Paragraph({
    children: [
      new TextRun({ text: `${num}. `, font: FONT, size: 24, bold: true, color: C.chalk }),
      new TextRun({ text, font: FONT, size: 24, bold: true, color: 'FFFFFF' }),
    ],
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.board },
    spacing: { before: 120, after: 100 },
    indent: { left: 60 },
    keepNext: true,
  });
const H2 = (text) =>
  new Paragraph({
    children: [new TextRun({ text: '■ ', font: FONT, size: 20, color: C.board, bold: true }), new TextRun({ text, font: FONT, size: 20, bold: true, color: C.board })],
    spacing: { before: 100, after: 50 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 2 } },
    keepNext: true,
  });
const CAP = (text) => new Paragraph({ children: runs(text, { size: 15, color: C.sub }), alignment: AlignmentType.CENTER, spacing: { before: 30, after: 60 } });

// ── 표 ────────────────────────────────────────────────
const border = (color = C.line, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const allBorders = (color, size) => ({ top: border(color, size), bottom: border(color, size), left: border(color, size), right: border(color, size) });
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };

function cell(content, width, o = {}) {
  const children = (Array.isArray(content) ? content : [content]).map((c) => (typeof c === 'string' ? P(c, { size: o.size ?? 16, bold: o.bold, color: o.color, align: o.align, after: 20, line: 252 }) : c));
  return new TableCell({
    children,
    width: { size: width, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    verticalAlign: o.valign ?? VerticalAlign.CENTER,
    margins: { top: o.pad ?? 32, bottom: o.pad ?? 32, left: 90, right: 90 },
    borders: o.borders ?? allBorders(),
    columnSpan: o.span,
  });
}
// rows: 2차원 배열(문자열/Paragraph 배열), 첫 행은 머리
function table(widths, rows, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    rows: rows.map((r, i) =>
      new TableRow({
        cantSplit: true,
        tableHeader: i === 0 && o.header !== false,
        children: r.map((c, j) =>
          cell(c, widths[j], {
            fill: i === 0 && o.header !== false ? o.headFill ?? C.board : o.firstColFill && j === 0 ? o.firstColFill : o.rowFill?.(i, j),
            color: i === 0 && o.header !== false ? 'FFFFFF' : undefined,
            bold: (i === 0 && o.header !== false) || (o.boldFirstCol && j === 0),
            align: i === 0 && o.header !== false ? AlignmentType.CENTER : o.align?.(i, j),
            size: o.size,
            valign: o.valign,
          }),
        ),
      }),
    ),
  });
}

// ── 그림 ──────────────────────────────────────────────
function img(file, widthCm) {
  const buf = fs.readFileSync(A(file));
  const { width, height } = imageSize(buf);
  const wpx = widthCm * 37.8; // 96dpi 기준 px
  return new ImageRun({ type: 'png', data: buf, transformation: { width: Math.round(wpx), height: Math.round((wpx * height) / width) } });
}
const FIG = (file, widthCm, caption) => [new Paragraph({ children: [img(file, widthCm)], alignment: AlignmentType.CENTER, spacing: { before: 40, after: 0 }, keepNext: true }), CAP(caption)];
// 그림 여러 장을 테두리 없는 표로 나란히
function figRow(items) {
  const n = items.length;
  const widths = items.map((it) => Math.round((W * it.share) / items.reduce((a, b) => a + b.share, 0)));
  widths[n - 1] = W - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        cantSplit: true,
        children: items.map((it, j) =>
          new TableCell({
            width: { size: widths[j], type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 60, right: 60 },
            children: [new Paragraph({ children: [img(it.file, it.cm)], alignment: AlignmentType.CENTER, spacing: { after: 0 } }), CAP(it.caption)],
          }),
        ),
      }),
    ],
  });
}
const SP = (after = 60) => new Paragraph({ children: [], spacing: { before: 0, after } });

// 강조 상자(한 줄 메시지)
function callout(text, o = {}) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: W, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: o.fill ?? C.chalkSoft },
            borders: { top: border(o.line ?? C.chalk, 6), bottom: border(o.line ?? C.chalk, 6), left: { style: BorderStyle.SINGLE, size: 36, color: o.bar ?? C.chalk }, right: border(o.line ?? C.chalk, 6) },
            margins: { top: 80, bottom: 80, left: 160, right: 120 },
            children: (Array.isArray(text) ? text : [text]).map((t) => P(t, { size: o.size ?? 19, after: 20, accent: o.accent ?? C.board })),
          }),
        ],
      }),
    ],
  });
}

// ════════════════════════════════════════════════════
// 1쪽: 표지 · 아이디어 분야 · 1. 요약
// ════════════════════════════════════════════════════
const cover = [
  P('2026 AI 활용 전국 대학생 창업 해커톤 대회', { size: 20, color: C.sub, align: AlignmentType.CENTER, after: 20 }),
  P('**아이디어 소개서**', { size: 36, align: AlignmentType.CENTER, after: 120 }),
  table(
    [2600, W - 2600],
    [
      ['아이디어명', P('**함께반** — 두 학년을 한 교실에서 가르치는 선생님을 위한 AI 수업 코티처', { size: 18, after: 0 })],
      ['팀        명', P('(팀명 기재)', { size: 18, color: C.sub, after: 0 })],
      ['신청인(대표자)', P('(성명 기재)                                                                   (인)', { size: 18, color: C.sub, after: 0 })],
    ],
    { header: false, firstColFill: C.head, boldFirstCol: true, align: (i, j) => (j === 0 ? AlignmentType.CENTER : undefined) },
  ),
  SP(80),
  table(
    [2600, W - 2600],
    [
      [
        '아이디어 분야(택 1)',
        [
          P('**☑ 1) 지역 간 교육격차, 학습지원, 교육 접근성 개선(AI 활용)**', { size: 17, after: 10, accent: C.board }),
          P('☐ 2) 대중 교통 접근성, 이동, 교통약자 지원', { size: 16, color: C.sub, after: 10 }),
          P('☐ 3) 고령인구 증가, 돌봄 인력 부족, 의료·복지 접근성', { size: 16, color: C.sub, after: 10 }),
          P('☐ 4) 고객확보, 매출증대, 홍보·마케팅, 수요예측', { size: 16, color: C.sub, after: 10 }),
          P('☐ 5) 산불·폭우·폭설, 산악사고, 재난 예방 및 대응', { size: 16, color: C.sub, after: 0 }),
        ],
      ],
    ],
    { header: false, firstColFill: C.head, boldFirstCol: true, align: (i, j) => (j === 0 ? AlignmentType.CENTER : undefined) },
  ),
  SP(100),
  callout(['**“수업안은 ChatGPT가, 선생님 동선은 함께반이 짜요.”**', '교사 1명이 두 학년을 동시에 가르치는 복식·소인수 학급을 위해, 두 학년 수업을 한 번에 설계하고 → 코드로 시간표 충돌을 검사하고 → 수업 중 학생 질문을 모아 → 다음 차시 학년별 보충·심화 활동지로 돌려주는 AI 웹서비스']),
  SP(80),
  new Paragraph({ children: [new TextRun({ text: '1. 요약', font: FONT, size: 24, bold: true, color: C.board })], spacing: { before: 60, after: 80 } }),
];

const sumRow = (title, lines) => [title, lines.map((t) => B(t, { size: 16, after: 20, line: 250 }))];
const summary = table(
  [2000, W - 2000],
  [
    ['구분', '내용'],
    sumRow('지역문제 정의', [
      '강원 초등학교 **355교 중 202교(56.9%)가 재적 60명 이하**, 1,100학급의 학급당 평균 학생은 5.9명(강원교육청, 2026.3.1)',
      '학생 수가 적어 **교사 1명이 두 학년을 한 교실에서 동시에** 가르치는 복식학급이 생기고, 한 학년을 직접 가르치는 동안 다른 학년은 사실상 자습 → 학년마다 “온전한 40분”을 받지 못해 학습 결손이 쌓임',
    ]),
    sumRow('문제 해결 목표', [
      '두 학년 수업 설계 시간을 줄이고, 선생님이 다른 학년에 가 있는 **간접지도 시간을 ‘계획된 학습’으로** 바꿈',
      '수업 중 학생 질문이 **다음 차시 학년별 보충·심화**로 이어지는 순환을 만들어 작은 학교의 수업 질을 높임',
    ]),
    sumRow('AI 적용 아이디어', [
      '**생성형 AI**(한국어 LLM)가 공통 주제·활동·간접지도 카드 초안을 쓰고, **코드 검사기(규칙 12개)**가 직접지도 겹침·성취기준 코드 오류를 잡아 AI에게 다시 쓰게 함',
      '학생 질문은 **LLM이 학년별 오개념 묶음**으로 정리 → 2022 개정 성취수준(A/B/C)에 맞춘 다음 차시 카드 생성 → 교사 승인 후 인쇄',
    ]),
    sumRow('실행 구상', [
      '**웹서비스**: 교사용 화면 + 학생용 QR 웹(앱 설치·계정·이름 없음). 2022 개정 성취기준 611개 데이터, 충북교육청 복식학급 운영 모형',
      '**결과물**: 작동하는 프로토타입(구현 완료), A4 과정안·학년별 활동지 인쇄, 당일 라이브 시연',
    ]),
    sumRow('멘토링 요청 사항', [
      '복식 담임 교사의 실제 수업 준비 흐름 검증, 강원아이로·교원지원비서와의 연계 방식',
      '학교·교육청 구매 경로(학교장터·실증사업)와 학생 개인정보·보안인증 요건',
    ]),
  ],
  { boldFirstCol: true, firstColFill: C.boardSoft, size: 16, align: (i, j) => (j === 0 ? AlignmentType.CENTER : undefined) },
);

// ════════════════════════════════════════════════════
// 2. 지역문제 정의
// ════════════════════════════════════════════════════
const sec2 = [
  H1('2', '지역문제 정의 — 강원 작은 학교의 “나눠 가르치는 40분”'),
  H2('우리가 주목한 문제'),
  P('강원은 학생 수 감소가 가장 빠른 지역 중 하나로, 초등학교 절반 이상이 ‘작은 학교’입니다. 작은 학교에서는 한 학년이 몇 명뿐이라 **두 학년을 한 학급으로 묶는 복식학급**이 생기고, 그렇지 않더라도 학급당 5~6명 안에서 수준 차가 큰 **소인수 학급**이 됩니다. 이 교실의 선생님은 한 학년을 직접 가르치는 동안 다른 학년이 혼자 공부할 거리를 동시에 설계해야 합니다.', { after: 80 }),
  figRow([
    { file: 'news/clip-kwnews.png', cm: 8.6, share: 1, caption: '[그림 1] 강원일보(2025.3.17) — 60명 이하 작은 학교, 강원 초등 절반 넘어' },
    { file: 'news/clip-yonhap.png', cm: 8.6, share: 1, caption: '[그림 2] 연합뉴스(2017.6.8, 복지로 게재) — 교사 혼자 두 학년 수업' },
  ]),
  SP(40),
  table(
    [2350, 5000, W - 7350],
    [
      ['지표', '현황', '출처'],
      ['강원 초 재적 60명 이하', '355교 중 **202교(56.9%)** · 1,100학급 · 학생 6,500명 → 학급당 **5.9명**', '강원교육청 소규모 학교현황(2026.3.1)'],
      ['증가 추세', '2024년 180교(49.8%) → 2025년 192교(54.2%) → 2026년 202교(56.9%)', '강원일보(2025.3.17), 강원교육청'],
      ['학령인구 전망', '강원 초등학생 58,433명(2026) → 45,661명(2031), **−21.9%**', '오마이뉴스(2026.9.29)'],
      ['복식학급(과거 규모)', '강원 77개교 123개 복식학급(2017.3), 경북·강원이 전국 최다권(2016~17). 이후 편성 기준은 완화됐지만 60명 이하 학교는 계속 늘어남', '연합뉴스(2017.6.8)'],
      ['현장 교사의 어려움', '“각 학년 학생에게 **온전한 40분의 수업을 하지 못해 생기는 학습 결손**”, “많은 업무와 부족한 업무 수행 시간”', '정형수(2024), 복식학급 담임교사 질적연구, KCI'],
    ],
    { size: 15, boldFirstCol: true, firstColFill: C.boardSoft },
  ),
  CAP('[표 1] 강원 작은 학교·복식학급 현황'),
  H2('문제의 원인'),
  B('**구조: 선생님은 한 명, 학년은 둘.** 충북교육청 「초등학교 복식학급 운영 도움자료」(2025)는 부분 통합 모형(도입 통합 → 학년별 분리, 직접·간접지도 교차 → 정리 통합) 등을 제시하고, 간접지도를 “교사의 의도적이고 계획적인 학습활동”으로 정의합니다. 선생님은 한 차시에 **두 학년 성취기준 + 직접지도 동선 + 간접지도 과제**를 함께 설계해야 해서 준비 부담이 두 배가 됩니다.'),
  B('**도구 공백: AI는 ‘학년 하나’ 기준입니다.** 공개 자료로 확인한 범위에서 ChatGPT, 아이쌤지피티, MagicSchool 같은 수업안 생성 도구는 학년 하나를 기준으로 설계하며, 두 학년의 직접지도 시간이 겹치는지나 선생님이 언제 어느 학년 곁에 있는지는 검사하지 않는 것으로 보입니다.'),
  B('**피드백 단절: 자습 중 막힌 질문이 사라집니다.** 간접지도 시간에 생긴 질문은 선생님에게 닿지 않아 다음 차시에 반영되지 않습니다. 교육청의 대응은 협력강사(시급 2.3~2.7만 원, 월 59시간 이하, 충북)지만, 강사가 없는 나머지 시간은 여전히 교사 혼자 두 학년을 맡습니다.'),
];

// ════════════════════════════════════════════════════
// 3. 문제 해결 목표
// ════════════════════════════════════════════════════
const sec3 = [
  H1('3', '문제 해결 목표'),
  P('함께반의 목표는 선생님을 대신하는 것이 아니라, **선생님이 다른 학년 곁에 가 있는 시간까지 수업으로 만드는 것**입니다. 실증 1학기(강원 작은 학교 3~5곳) 기준 목표는 다음과 같습니다.', { after: 60 }),
  table(
    [2500, 4300, W - 6800],
    [
      ['목표', '측정 지표', '목표값(실증 1학기, 가정)'],
      ['설계 부담 감소', '두 학년 1차시 설계·활동지 준비 시간(교사 기록)', '사용 전 대비 **30% 이상 단축** (참고: 영국 EEF 무작위 실험에서 AI 사용 시 준비 시간 약 24% 감소)'],
      ['간접지도의 질', '간접지도 카드 중 단계·끝 신호·막힐 때·산출물·도우미가 모두 있는 비율', '**100%** (코드 검사 R4 통과 시에만 승인 가능)'],
      ['동선 충돌 제거', '두 학년 직접지도 겹침·성취기준 코드 오류 등 규칙 위반', '승인된 수업안 **위반 0건**'],
      ['질문 → 다음 차시', '수업 중 질문 묶음이 다음 차시 카드에 반영된 비율', '묶음당 **보충 1·심화 1 카드**, 교사 승인률 측정'],
      ['안전', '교사 승인 없이 학생에게 나간 AI 출력 · 저장된 학생 실명·연락처', '**0건 / 0건** 목표'],
    ],
    { size: 15, boldFirstCol: true, firstColFill: C.boardSoft },
  ),
  CAP('[표 2] 해결 목표와 측정 지표'),
  H2('기대 효과'),
  B('**학생**: 자기 학년 성취기준에 맞춘 간접지도 과제와 질문 기반 보충·심화로, 복식·소인수 학급의 학습 결손을 줄임'),
  B('**교사**: 두 학년 설계를 한 화면에서 끝내고, 수업 후 “학습 누락 확인 및 보완 지도 설계”(충북 도움자료가 정한 교사 역할)를 자동 초안으로 받음'),
  B('**지역**: 작은 학교 수업의 질을 데이터로 보여 주어 “작은 학교를 지키는 근거”가 되고, 강원아이로에 얹는 모듈로 도내 202개 작은 초등학교에 확산 가능'),
];

// ════════════════════════════════════════════════════
// 4. AI 적용 아이디어
// ════════════════════════════════════════════════════
const ROLE = { AI: '생성형 AI', CODE: '코드(규칙)', MIX: 'AI + 코드', T: '교사' };
const sec4 = [
  H1('4', 'AI 적용 아이디어 — “AI는 초안, 판정은 코드, 결정은 교사”'),
  P('생성형 AI는 그럴듯한 수업안을 잘 쓰지만, **존재하지 않는 성취기준 코드를 지어내거나 두 학년 직접지도 시간을 겹치게** 만들 수 있습니다. 함께반은 AI가 쓴 초안을 코드 검사기가 판정하고, 위반이 있으면 해당 블록만 AI에게 다시 쓰게 합니다. 최종 결정은 언제나 교사의 승인입니다.', { after: 60 }),
  table(
    [1350, 4700, 1550, W - 7600],
    [
      ['단계', '하는 일', '담당', '사용 기술'],
      ['① 맥락', '학년·단원 → 두 학년의 2022 개정 성취기준 후보 추출', ROLE.CODE, '초등 성취기준 611개 데이터'],
      ['② 계획', '두 학년을 잇는 **공통 주제**와 학년별 성취기준 선택', ROLE.AI, '한국어 LLM + JSON 스키마 출력'],
      ['③ 골격', '충북 모형대로 ★통합 → ■직접/□간접 교차 → ★통합 시간 골격', ROLE.CODE, '수업 모형 템플릿'],
      ['④ 채움', '활동 문장 + **간접지도 카드**(단계·끝 신호·막힐 때·도우미 역할)', ROLE.AI, '한국어 LLM'],
      ['⑤ 검사', '**규칙 12개**: 직접지도 겹침, 교사 이동 횟수, 학년별 시간 합, 성취기준 코드-학년군 일치, 개인정보 등', ROLE.CODE, '결정적 검사기(단위 테스트 87개)'],
      ['⑥ 수리', '위반 블록만 다시 생성(최대 2회), 기록을 화면에 남김', ROLE.MIX, '검사 결과를 프롬프트로 환류'],
      ['수업 중', '학생 QR 질문 → 학년별 **오개념 묶음** + 전화번호·이메일 등 흔한 개인정보 패턴 가림', ROLE.MIX, '소형 LLM + 정규식'],
      ['다음 차시', '묶음별 학년 **보충·심화 카드**(성취수준 A/B/C 연계) → 승인 후 A4 인쇄', `${ROLE.AI} → ${ROLE.T}`, 'LLM + 인쇄용 레이아웃'],
    ],
    { size: 15, boldFirstCol: true, firstColFill: C.boardSoft, align: (i, j) => (j === 2 ? AlignmentType.CENTER : undefined) },
  ),
  CAP('[표 3] AI 파이프라인과 역할 분담'),
  ...FIG('fig_1b_banner_steps.png', 15.5, '[그림 3] 프로토타입 — 검사기가 없는 성취기준 코드 [4사05-07]을 잡아 [4사05-02]로 수리하는 장면(로컬 LLM 녹화본에 위반 1건을 넣은 시연용 재현)'),
  B('**모델**: 로컬에서 도는 한국어 LLM(Ollama 기반 A.X 4.0 Light 7B·Qwen3 4B)으로 구현해 **학생 질문이 학교 밖으로 나가지 않는** 구성이 가능하며, 클라우드 LLM(Claude 등)으로 교체할 수 있는 구조. 실제 실행에서는 첫 초안이 검사를 통과하는 경우가 많아, 시연에서는 녹화본에 위반을 넣어 수리 과정을 보여 줌'),
  B('**근거 데이터**: 교육부 고시 2022 개정 교육과정 성취기준(공개 데이터셋 변환, 원문 대조 진행 중), 충북교육청 복식학급 운영 도움자료(2025)의 수업 모형과 직접·간접지도 정의'),
];

// ════════════════════════════════════════════════════
// 5. 실행 구상
// ════════════════════════════════════════════════════
const sec5 = [
  H1('5', '실행 구상'),
  H2('실행 방식 — 웹서비스, 수업 한 차시를 네 장면으로'),
  P('교사는 노트북 화면 하나, 학생은 QR로 여는 웹 한 장이면 됩니다(앱 설치·학생 계정·실명 없음). 아래는 **이미 구현해 동작하는 프로토타입** 화면입니다(3학년 사회 [4사01-02] + 4학년 사회 [4사05-02], 40분, 시연은 녹화된 AI 응답 재생).', { after: 60 }),
  table(
    [1500, 1500, 3900, W - 6900],
    [
      ['장면', '언제', '선생님', '함께반'],
      ['① 설계', '수업 전 5분', '학년·단원 선택, 초안 확인·고치기', '공통 주제·두 학년 활동·간접지도 카드 초안 생성'],
      ['② 검사', '수업 전', '블록을 5분 단위로 옮기거나 직접↔간접 전환, 승인', '규칙 12개 즉시 재검사, 선생님 동선·겹침 표시'],
      ['③ 수업', '간접지도 중', '수업 코드(QR)를 칠판에 띄움', '학년별 질문 수신·묶기, 전화번호 등 개인정보 패턴 가림'],
      ['④ 다음 차시', '수업 후', '카드 승인·반려, 한 단어 고치기, 인쇄', '묶음별 학년 보충·심화 카드, 다음 차시 간접지도 칸에 배치'],
    ],
    { size: 15, boldFirstCol: true, firstColFill: C.boardSoft, align: (i, j) => (j < 2 ? AlignmentType.CENTER : undefined) },
  ),
  CAP('[표 4] 수업 한 차시의 네 장면'),
  figRow([
    { file: 'fig_2_board.png', cm: 6.6, share: 0.85, caption: '[그림 4] ①설계 — 두 학년 수업 보드(★통합·■직접·□간접)' },
    { file: 'fig_3_timeline.png', cm: 10.2, share: 1.15, caption: '[그림 5] ②검사 — 선생님 동선(노란 선)과 20~25분 직접지도 겹침 경고' },
  ]),
  figRow([
    { file: 'fig_4_student.png', cm: 4.9, share: 0.62, caption: '[그림 6] ③학생 — QR 질문(계정·이름 없음)' },
    { file: 'fig_5_clusters.png', cm: 10.6, share: 1.38, caption: '[그림 7] ③질문함 — 질문 13개를 AI가 학년별 오개념 3묶음으로 정리(녹화된 시연 데이터)' },
  ]),
  figRow([
    { file: 'fig_6_next.png', cm: 8.6, share: 1.3, caption: '[그림 8] ④다음 차시 — 질문에서 나온 학년별 보충·심화 카드, 교사 승인' },
    { file: 'fig_7_print.png', cm: 5.4, share: 0.7, caption: '[그림 9] ④인쇄 — 학생용 A4 활동지(교사 메모 제외)' },
  ]),
  H2('필요 자원'),
  table(
    [2000, W - 2000],
    [
      ['구분', '내용'],
      ['데이터', '교육부 고시 제2022-33호(NCIC) 성취기준을 공개 데이터셋(kr-curriculum-2022, MIT)으로 변환한 초등 611건(원문 대조 진행 중), 성취수준 A/B/C(원문 있는 항목), 충북교육청 복식학급 운영 도움자료(2025)'],
      ['플랫폼', '웹(Vite·React·TypeScript / Express), 실시간 질문 수신(SSE), 인쇄용 A4 레이아웃'],
      ['AI·API', '한국어 LLM(Ollama 로컬 실행: A.X 4.0 Light 7B, Qwen3 4B), 클라우드 LLM API(선택), 구조화 출력(JSON 스키마) 검증'],
      ['현장', '강원 복식·소인수 학급 담임 교사 인터뷰·실증, 강원아이로·교원지원비서 연계 협의'],
    ],
    { size: 15, boldFirstCol: true, firstColFill: C.boardSoft, align: (i, j) => (j === 0 ? AlignmentType.CENTER : undefined) },
  ),
  CAP('[표 5] 필요 자원'),
  H2('결과물의 형태와 차별성'),
  B('**작동 프로토타입(구현 완료)**: 수업 설계 → 타임라인 검사 → QR 질문 → 다음 차시 카드 → 인쇄 전 과정. 검사 규칙 12개, 단위 테스트 87개·시연 자동 점검 58개 통과, 심사장 프로젝터용 ‘심사 모드’'),
  B('**당일 시연**: 심사위원이 QR로 보낸 질문이 학년별 묶음 → 다음 차시 활동지로 바뀌는 90초'),
  SP(30),
  table(
    [2700, 1900, 1900, 1900, W - 8400],
    [
      ['서비스', '두 학년 동시 설계', '직접·간접 시간 검사', '수업 중 질문 수집', '다음 차시 보충·심화'],
      ['ChatGPT 등 범용 LLM', '△ 프롬프트로 초안', '△ 검증 없음', '✕', '✕'],
      ['강원아이로(강원교육청)', '✕', '✕', '△ 평가 결과', '△ 학생 개인 진단'],
      ['아이쌤지피티(아이스크림)', '✕ 단일 학년', '✕', '△ 학생챗(예정)', '✕'],
      ['교풀AI', '✕', '✕', '△ AI 활동 기록', '✕'],
      ['MagicSchool(미국)', '△ 수준별 변형', '✕', '?', '?'],
      ['교육청 매뉴얼 + 협력강사', '△ 사람이 수작업', '△ 사람이 수작업', '△ 사람이 관찰', '△ 사람이 설계'],
      ['**함께반**', '**● 자동**', '**● 코드 검사**', '**● QR·익명**', '**● 자동 + 교사 승인**'],
    ],
    { size: 15, boldFirstCol: true, align: (i, j) => (j > 0 ? AlignmentType.CENTER : undefined), rowFill: (i) => (i === 7 ? C.chalkSoft : undefined) },
  ),
  CAP('[표 6] 경쟁 서비스 비교(공개 자료 기준, ● 제공 △ 부분 ✕ 없음 ? 확인 불가)'),
  table(
    [1500, 3600, 2700, W - 7800],
    [
      ['단계', '대상', '규모', '방식'],
      ['① 실증', '강원 작은 학교 3~5곳 복식·소인수 학급', '1학기', '무료 실증, 에듀테크 소프트랩 연계'],
      ['② 강원 확산', '강원 재적 60명 이하 초·중 269교·1,315학급', '연 약 0.3~1.35억 원(추정)', '학교 연 50만 원(학교장터) / 교육청 일괄'],
      ['③ 전국', '전국 소규모 초등 약 1,500교(중학교 포함 시 약 2,000교)', '연 7.5억 원(초등) ~ 약 10억 원(중학교 포함)', '교육청 실증·일괄 계약'],
      ['④ 인접', '지역아동센터 4,206곳 등 혼합연령 집단', '—', '기관 구독'],
    ],
    { size: 15, boldFirstCol: true, firstColFill: C.boardSoft, align: (i, j) => (j === 0 ? AlignmentType.CENTER : undefined) },
  ),
  CAP('[표 7] 확산 경로(학교당 연 50만 원 가정의 추정치. ② 하한은 20% 도입, ③ 학교 수는 전국 초 6,192교 × 약 25%)'),
];

// ════════════════════════════════════════════════════
// 6. 멘토링 요청 사항
// ════════════════════════════════════════════════════
const sec6 = [
  H1('6', '멘토링 요청 사항'),
  table(
    [2300, W - 2300],
    [
      ['구분', '내용'],
      [
        '우리가 아직 부족한 부분',
        [
          B('**현장 검증**: 복식·소인수 학급 담임의 실제 수업 준비 흐름과 간접지도 운영 방식을 충분히 확인하지 못함', { size: 16 }),
          B('**공공 도입 경로**: 학교장터 소액계약, 교육청 실증사업, 클라우드 보안인증(CSAP) 등 판로·요건 이해 부족', { size: 16 }),
          B('**학생 데이터**: 익명 질문이라도 학교 현장에서 요구하는 개인정보 처리 기준을 어디까지 갖춰야 하는지', { size: 16 }),
        ],
      ],
      [
        '멘토에게 꼭 묻고 싶은 질문',
        [
          B('강원아이로나 교원지원비서에 **복식 수업 설계 모듈로 얹는 방식**이 현실적인가요, 아니면 독립 서비스가 나은가요?', { size: 16, mark: 'Q' }),
          B('선생님이 AI 초안을 **믿고 쓰게 만드는 장치**(코드 검사, 승인 절차) 외에 현장에서 꼭 필요한 것은 무엇인가요?', { size: 16, mark: 'Q' }),
          B('작은 학교 대상 서비스의 **지불 주체와 가격**(학교 예산 vs 교육청 일괄)은 어떻게 잡는 것이 좋을까요?', { size: 16, mark: 'Q' }),
        ],
      ],
    ],
    { size: 16, boldFirstCol: true, firstColFill: C.boardSoft, align: (i, j) => (j === 0 ? AlignmentType.CENTER : undefined) },
  ),
];

const doc = new Document({
  creator: '함께반 팀',
  title: '함께반 아이디어 소개서',
  styles: { default: { document: { run: { font: FONT, size: 18 } } } },
  sections: [
    {
      properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 794, bottom: 737, left: MARGIN, right: MARGIN, footer: 340 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['- ', PageNumber.CURRENT, ' -'], font: FONT, size: 16, color: C.sub })] })],
        }),
      },
      children: [...cover, summary, ...sec2, ...sec3, ...sec4, ...sec5, ...sec6],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('wrote', OUT, buf.length);
});
