// 90초 데모 전 과정을 프로덕션 서버(같은 오리진)에서 돌리고 장면별 스크린샷을 남긴다.
// 사용: (서버를 AI_MODE=replay로 띄운 뒤) npm run e2e   · BASE_URL로 주소를 바꿀 수 있다
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:8787';
const OUT = process.env.SHOT_DIR ?? 'screenshots';
const top = (p) => p.evaluate(() => window.scrollTo(0, 0));
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
try {
  const api = await (await browser.newContext()).request;
  await api.post(`${BASE}/api/demo/reset`);
  const status = await (await api.get(`${BASE}/api/ai/status`)).json();
  check('AI 모드 replay', status.mode === 'replay', `mode=${status.mode}`);

  const teacherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // replay 단계 속도 조절(시연용 0.7초/단계)은 끄고 원래 속도를 잰다. 속도 조절 경로는 'S1 천천히 재생' 검사에서 따로 본다
  await teacherCtx.addInitScript(() => {
    try {
      if (!sessionStorage.getItem('e2e-init')) {
        localStorage.setItem('cotutor-pace', '0');
        localStorage.setItem('cotutor-present', '0');
        sessionStorage.setItem('e2e-init', '1');
      }
    } catch {}
  });
  const t = await teacherCtx.newPage();
  t.on('dialog', (d) => d.accept());
  const consoleErrors = [];
  t.on('pageerror', (e) => consoleErrors.push(e.message));

  // ---------- 한눈에 → S1 ----------
  await t.goto(`${BASE}/`);
  await t.getByTestId('hero-demo').waitFor();
  check('한눈에 히어로·데모 버튼', true);
  // 헤드라인 숫자는 지어낸 값이 아니라 오늘 수업의 간접지도 분과 같아야 한다
  await t.getByTestId('hero-minutes-note').waitFor();
  const heroTitle = await t.getByTestId('hero-title').innerText();
  const heroNote = await t.getByTestId('hero-minutes-note').innerText();
  const noteMins = [...heroNote.matchAll(/간접지도 (\d+)분/g)].map((m) => Number(m[1]));
  const titleMin = Number((heroTitle.match(/(\d+)분/) ?? [])[1]);
  check('한눈에 헤드라인 숫자 = 오늘 수업 간접지도 분', noteMins.length === 2 && noteMins.includes(titleMin) && !heroTitle.includes('20분'), `${heroTitle.replace(/\s+/g, ' ')} / ${heroNote}`);
  check('한눈에 예시 학교(강원) 표시', (await t.getByTestId('demo-school').innerText()).includes('예시 학교'));
  check('한눈에 미니 타임라인 선생님 동선', (await t.getByTestId('teacher-path').count()) >= 1 && (await t.getByTestId('teacher-path-label').first().innerText()).includes('교사 이동'));
  await t.getByRole('link', { name: '수업 설계', exact: true }).click();
  await t.getByTestId('pair-badge').getByText('같은 학년군').waitFor();
  check('S1 학년쌍 배지', true, '같은 학년군');
  await t.selectOption('[data-testid=select-gradeA]', '4');
  await t.selectOption('[data-testid=select-gradeB]', '5');
  const cross = await t.getByTestId('pair-badge').innerText();
  check('S1 4·5 → 학년군 걸침', cross.includes('학년군 걸침'), cross);
  await t.selectOption('[data-testid=select-gradeA]', '3');
  await t.selectOption('[data-testid=select-gradeB]', '6');
  check('S1 3·6 → 격리 학년', (await t.getByTestId('pair-badge').innerText()).includes('격리 학년'));
  await t.selectOption('[data-testid=select-gradeB]', '4');
  await t.selectOption('[data-testid=unit-A]', '우리가 사는 곳 - 더 살기 좋은 곳 만들기');
  await t.selectOption('[data-testid=unit-B]', '지도로 만나는 우리 지역 - 지도에서 우리 지역 찾기');
  const t0 = Date.now();
  await t.getByTestId('generate').click();
  await t.getByTestId('repair-summary').getByText('통과').waitFor({ timeout: 10000 });
  await t.locator('[data-testid="flow-log"][data-source="run"][data-busy="false"] [data-testid="step-수리"][data-status="done"]').waitFor({ timeout: 10000 });
  const genMs = Date.now() - t0;
  check('S1 replay 3초 안에 결과', genMs < 3000, `${genMs}ms`);
  const summary = await t.getByTestId('repair-summary').innerText();
  check('S1 검사 위반 → 수리 → 통과 기록', /위반.*수리 1회.*통과/.test(summary), summary);
  const flowLog = await t.getByTestId('flow-log').innerText();
  const stepStates = await t.locator('[data-testid^="step-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-status')));
  check('S1 파이프라인 6단계 모두 기록(대기 없음)', ['맥락', '계획', '골격', '채움', '검사', '수리'].every((s) => flowLog.includes(s)) && stepStates.length === 6 && !stepStates.includes('wait'), stepStates.join(','));
  check('S1 성취기준 칩·원문 확인됨', (await t.getByTestId('std-chip').first().innerText()).includes('원문 확인됨'));
  // 검사기 적발 배너: 전폭, 전/후 칩
  const rb = t.getByTestId('repair-banner');
  await rb.waitFor();
  const rbText = await rb.innerText();
  check('S1 검사기 적발 배너(전/후 칩)', (await rb.getAttribute('data-stage')) === 'fixed' && rbText.includes('AI 초안에서 오류 1건 발견') && rbText.includes('[4사05-07]') && /\[4사0\d-\d\d\]\s*✓/.test(rbText), rbText.replace(/\s+/g, ' '));
  const bannerBox = await rb.boundingBox();
  const mainBox = await t.locator('main').boundingBox();
  check('S1 적발 배너가 본문 전폭', !!bannerBox && !!mainBox && bannerBox.width > mainBox.width * 0.85, `${Math.round(bannerBox?.width ?? 0)} / ${Math.round(mainBox?.width ?? 0)}`);
  // 정직한 AI 표시: 상단 알약과 본문 출처 칩이 같은 말
  const chipText = await t.getByTestId('ai-chip').innerText();
  const flowText = await t.getByTestId('flow-log').innerText();
  check('AI 표시 일치(상단 = 본문, 녹화된 AI 응답 재생)', chipText.includes('녹화된 AI 응답 재생') && flowText.includes('녹화된 AI 응답 재생') && !flowText.includes('replay·'), chipText);
  await top(t);
  await t.screenshot({ path: `${OUT}/01-S1-design.png`, fullPage: true });

  // ---------- S1 천천히 재생(시연 경로: 한눈에 '데모 실행' → 단계당 약 0.7초) ----------
  await t.evaluate(() => localStorage.setItem('cotutor-pace', '700'));
  await t.goto(`${BASE}/`);
  const p0 = Date.now();
  await t.getByTestId('hero-demo').click();
  await t.locator('[data-testid="repair-banner"][data-stage="caught"]').waitFor({ timeout: 15000 });
  const caughtAt = Date.now() - p0;
  const midSteps = await t.locator('[data-testid^="step-"]').evaluateAll((els) => Object.fromEntries(els.map((e) => [e.getAttribute('data-testid'), e.getAttribute('data-status')])));
  check('S1 천천히 재생: 검사기가 잡은 순간이 보임(수리 전)', midSteps['step-검사'] === 'error' && midSteps['step-수리'] !== 'done', JSON.stringify(midSteps));
  await top(t);
  await t.screenshot({ path: `${OUT}/12-S1-violation-banner-mid.png` });
  await t.locator('[data-testid="repair-banner"][data-stage="fixed"]').waitFor({ timeout: 15000 });
  await t.locator('[data-testid="flow-log"][data-busy="false"] [data-testid="step-수리"][data-status="done"]').waitFor({ timeout: 15000 });
  const pacedMs = Date.now() - p0;
  check('S1 천천히 재생: 단계당 약 0.6~0.8초(총 3~10초)', pacedMs > 3000 && pacedMs < 10000 && caughtAt > 1500, `적발 ${caughtAt}ms · 끝 ${pacedMs}ms`);
  await t.evaluate(() => localStorage.setItem('cotutor-pace', '0'));
  // 교사 승인 → 배지 변경
  await t.getByTestId('approve-lesson').click();
  await t.getByText('교사 승인', { exact: true }).first().waitFor();
  check('S1 승인 후 배지 교사 승인', true);
  // 인쇄(A4)
  await t.emulateMedia({ media: 'print' });
  await top(t);
  await t.screenshot({ path: `${OUT}/02-S1-print.png`, fullPage: true });
  await t.pdf({ path: `${OUT}/S1-lesson-plan.pdf`, format: 'A4', printBackground: true });
  await t.emulateMedia({ media: 'screen' });

  // ---------- S2 ----------
  await t.getByRole('link', { name: '타임라인', exact: true }).click();
  await t.getByTestId('timeline-grid').waitFor();
  check('S2 시작 고칠 곳 0', (await t.getByTestId('error-count').getAttribute('data-errors')) === '0' && (await t.getByTestId('error-count').innerText()).includes('고칠 곳 0'));
  check('S2 선생님 동선 덮개 · 이동 3번', (await t.getByTestId('teacher-path').getAttribute('data-moves')) === '3' && (await t.getByTestId('teacher-path-label').innerText()).includes('교사 이동 3번'));
  await t.getByTestId('block-A1').click();
  await t.getByTestId('end-plus').click();
  await t.getByTestId('error-banner').waitFor();
  const banner = await t.getByTestId('error-banner').innerText();
  check('S2 경계 +5분 → R2 한국어 경고', banner.includes('3학년 직접지도와 4학년 직접지도가 20~25분 겹칩니다'), banner);
  check('S2 error 있으면 승인 비활성', await t.getByTestId('approve-timeline').isDisabled());
  check('S2 충돌 때 동선이 두 레인에 동시(빨간 점선) 표시', (await t.getByTestId('teacher-path-label').innerText()).includes('두 레인에 동시에'));
  check('S2 위반 꼬리표는 진한 잉크(4학년 주황과 구분)', await t.getByTestId('overlap-R2').locator('span').first().evaluate((e) => getComputedStyle(e).backgroundColor === 'rgb(43, 42, 38)'));
  await top(t);
  await t.screenshot({ path: `${OUT}/03-S2-timeline-conflict.png`, fullPage: true });
  await t.getByTestId('undo').click();
  await t.getByTestId('error-count').getByText('고칠 곳 0').waitFor();
  check('S2 충돌 해결 순간 표시', await t.getByTestId('solved-flash').waitFor({ timeout: 2000 }).then(() => true, () => false));
  check('S2 되돌리면 경고 사라짐', (await t.getByTestId('error-banner').count()) === 0);
  // R4: 직접 → 간접으로 바꾸면 카드가 없어 R4 → 카드 만들기로 해결
  await t.getByTestId('block-A1').click();
  await t.getByTestId('toggle-mode').click();
  const r4 = await t.getByTestId('violation-list').innerText();
  check('S2 간접 전환 → R4 카드 없음', r4.includes('R4'), r4.split('\n').slice(0, 3).join(' / '));
  await t.getByTestId('make-card').click();
  await t.getByTestId('block-detail').getByText('간접지도 카드').waitFor();
  check('S2 카드 만들기 후 R4 해소', !(await t.getByTestId('violation-list').innerText().catch(() => '')).includes('R4 '));
  await top(t);
  await t.screenshot({ path: `${OUT}/04-S2-timeline-card.png`, fullPage: true });
  await t.getByTestId('undo').click();
  await t.getByTestId('undo').click();
  await t.getByTestId('error-count').getByText('고칠 곳 0').waitFor();
  await t.getByTestId('approve-timeline').click();
  await t.getByTestId('approve-timeline').getByText('승인됨').waitFor();
  check('S2 error 0 → 승인', true);

  // ---------- S3 + 학생 ----------
  await t.getByRole('link', { name: '질문함', exact: true }).click();
  await t.getByTestId('start-session').click();
  const code = (await t.getByTestId('session-code').innerText()).trim();
  check('S3 4자리 세션 코드', /^[A-Z]{4}$/.test(code), code);
  check('S3 localhost QR 경고', (await t.getByTestId('localhost-warning').count()) === 1);
  await t.getByTestId('set-prompt').click();

  const studentCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const s = await studentCtx.newPage();
  await s.goto(`${BASE}/s/?c=${code}`);
  await s.getByTestId('student-prompt').waitFor();
  const overflow = await s.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check('학생 390px 가로 스크롤 없음', !overflow);
  const tap = await s.evaluate(() => Math.min(...[...document.querySelectorAll('button')].map((b) => b.getBoundingClientRect().height)));
  check('학생 터치 영역 48px 이상', tap >= 48, `${tap}px`);
  const font = await s.evaluate(() => parseFloat(getComputedStyle(document.querySelector('textarea')).fontSize));
  check('학생 본문 16px 이상', font >= 16, `${font}px`);
  check('학생 이름 입력칸 없음', (await s.locator('input').count()) === 0);
  check('학생 "이름은 쓰지 마세요" 안내', (await s.getByText('이름은 쓰지 마세요').count()) > 0);
  await top(s);
  await s.waitForTimeout(1300); // 분필 밑줄 애니메이션이 끝난 뒤 찍는다
  await s.screenshot({ path: `${OUT}/05-student-390.png`, fullPage: true });
  await s.getByTestId('grade-3').click();
  await s.getByTestId('student-text').fill('지도에 우리 학교는 어디에 있어요? 엄마 번호 010-9876-5432');
  const sentAt = Date.now();
  await s.getByTestId('student-send').click();
  await t.getByTestId('col-A').getByText('지도에 우리 학교는 어디에 있어요?').waitFor({ timeout: 5000 });
  const latency = Date.now() - sentAt;
  check('학생 제출 → 교사 화면 1초 안', latency < 1000, `${latency}ms`);
  const shown = await t.getByTestId('col-A').innerText();
  check('전화번호 마스킹되어 표시', shown.includes('[전화번호]') && !shown.includes('010-9876-5432'));
  check('새 질문이 학년 열 맨 위', (await t.getByTestId('col-A').getByTestId('response-card').first().innerText()).includes('지도에 우리 학교는 어디에 있어요?'));
  await s.getByTestId('student-done').waitFor();
  await top(s);
  await s.screenshot({ path: `${OUT}/06-student-done-390.png`, fullPage: true });
  check('학생 페이지에 AI 출력 없음', !(await s.content()).includes('AI 초안'));

  await t.getByTestId('fake-students').click();
  await t.waitForFunction(() => document.querySelectorAll('[data-testid=response-card]').length >= 13, null, { timeout: 30000 });
  check('가상 학생 12개 도착', true);
  const dupCheck = await t.evaluate(() => document.querySelectorAll('[data-testid=response-card]').length);
  check('중복 카드 없음', dupCheck === 13, `${dupCheck}장`);
  await top(t);
  await t.screenshot({ path: `${OUT}/07-S3-live.png`, fullPage: true });
  await t.getByTestId('cluster').click();
  await t.getByTestId('cluster-card').first().waitFor({ timeout: 15000 });
  const nClusters = await t.getByTestId('cluster-card').count();
  check('S3 AI로 묶기 군집 카드', nClusters >= 2, `${nClusters}개`);
  await t.waitForTimeout(900);
  const cTop = await t.getByTestId('clusters-section').evaluate((e) => e.getBoundingClientRect().top);
  check('S3 묶기 뒤 묶음으로 자동 스크롤', cTop >= -10 && cTop < 300, `top=${Math.round(cTop)}`);
  check('S3 묶음 카드 = AI 초안 점선 틀', await t.getByTestId('cluster-card').first().evaluate((e) => getComputedStyle(e).borderTopStyle === 'dashed'));
  await t.screenshot({ path: `${OUT}/13-S3-clusters-fold.png` });
  await top(t);
  await t.screenshot({ path: `${OUT}/08-S3-clusters.png`, fullPage: true });

  // ---------- S4 ----------
  await t.getByTestId('go-next').click();
  await t.getByTestId('gen-cards').click();
  await t.getByTestId('card-A-보충').waitFor({ timeout: 15000 });
  check('S4 학년별 보충·심화 4장', (await t.locator('[data-testid^=card-A-], [data-testid^=card-B-]').count()) === 4);
  check('S4 승인 전 인쇄 비활성', await t.getByTestId('print-student-A').isDisabled());
  check('S4 카드 ↔ 학생 질문 연결(건수 + 원문)', (await t.getByTestId('card-A-보충').getByTestId('card-source').innerText()).includes('건에서 나왔어요'));
  const title = t.getByTestId('card-A-보충').getByTestId('card-title');
  await title.fill((await title.inputValue()) + ' 해 보기');
  let lit = false;
  for (const id of ['card-A-보충', 'card-A-심화', 'card-B-보충', 'card-B-심화']) {
    await t.getByTestId(id).getByTestId('approve-card').click();
    await t.getByTestId(id).getByText('교사 승인').waitFor();
    if (id === 'card-A-보충') lit = await t.locator('[data-testid^="block-"].animate-arrive').first().waitFor({ timeout: 1500 }).then(() => true, () => false);
  }
  check('S4 승인 4장', true);
  check('S4 승인하면 다음 차시 칸이 빛남', lit);
  check('S4 미리보기 검사 통과', (await t.getByTestId('preview-check').innerText()).includes('검사 통과'));
  await top(t);
  await t.screenshot({ path: `${OUT}/09-S4-next.png`, fullPage: true });
  const notes = await t.locator('[data-testid=teacher-note]').evaluateAll((els) => els.map((e) => e.value));
  await t.getByTestId('print-student-A').click();
  await t.getByTestId('student-sheet').waitFor();
  const html = await t.content();
  const leaked = notes.filter((n) => n.trim().length >= 4 && html.includes(n.trim()));
  check('학생판 DOM에 교사 메모 0회', leaked.length === 0, `메모 ${notes.length}개 검사`);
  await t.emulateMedia({ media: 'print' });
  await top(t);
  await t.screenshot({ path: `${OUT}/10-S4-print-student-3.png`, fullPage: true });
  await t.pdf({ path: `${OUT}/S4-student-grade3.pdf`, format: 'A4', printBackground: true });
  await t.emulateMedia({ media: 'screen' });
  await t.getByTestId('close-print').click();
  await t.getByTestId('print-teacher').click();
  await t.getByTestId('teacher-sheet').waitFor();
  await t.emulateMedia({ media: 'print' });
  await top(t);
  await t.screenshot({ path: `${OUT}/11-S4-print-teacher.png`, fullPage: true });
  await t.emulateMedia({ media: 'screen' });
  await t.getByTestId('close-print').click();

  // ---------- 심사 모드 ----------
  await t.goto(`${BASE}/timeline`);
  await t.getByTestId('present-toggle').click();
  const pres = await t.evaluate(() => ({ cls: document.documentElement.classList.contains('present'), saved: localStorage.getItem('cotutor-present'), footer: getComputedStyle(document.querySelector('footer')).display }));
  check('심사 모드 켜기(클래스·저장·개발 정보 숨김)', pres.cls && pres.saved === '1' && pres.footer === 'none', JSON.stringify(pres));
  await t.getByTestId('present-toggle').click();
  check('심사 모드 끄기', !(await t.evaluate(() => document.documentElement.classList.contains('present'))));
  check('브라우저 오류 없음', consoleErrors.length === 0, consoleErrors.join(' | '));

  // ---------- 넓은 화면·프로젝터·모바일 배치 ----------
  const shot = async (w, h, path, opts = {}) => {
    const c = await browser.newContext({ viewport: { width: w, height: h } });
    await c.addInitScript(([dark, present]) => { try { localStorage.setItem('cotutor-theme', dark ? 'dark' : 'light'); localStorage.setItem('cotutor-pace', '0'); } catch {} }, [!!opts.dark, !!opts.present]);
    const p = await c.newPage();
    await p.goto(`${BASE}${path}${opts.present ? (path.includes('?') ? '&' : '?') + 'present=1' : ''}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1300);
    return [c, p];
  };
  {
    const [c, p] = await shot(1920, 1080, '/', { present: true });
    const fs = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    const side = await p.evaluate(() => document.querySelector('aside')?.getBoundingClientRect().width ?? 0);
    check('심사 모드 ?present=1: 1920에서 글자 125% 이상·사이드바 아이콘만', fs >= 20 && side < 120, `root ${fs}px · 사이드바 ${Math.round(side)}px`);
    await p.screenshot({ path: `${OUT}/20-overview-1920-present.png` });
    await p.goto(`${BASE}/timeline`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/21-timeline-1920-present.png` });
    await p.goto(`${BASE}/design`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/22-design-1920-present.png` });
    await c.close();
  }
  for (const [w, h] of [[1920, 1080], [1280, 720]]) {
    const [c, p] = await shot(w, h, '/');
    await p.screenshot({ path: `${OUT}/23-overview-${w}.png` });
    await c.close();
  }
  {
    const [c, p] = await shot(1280, 720, '/', { present: true });
    await p.screenshot({ path: `${OUT}/24-overview-1280-present.png` });
    await c.close();
  }
  {
    const [c, p] = await shot(1280, 720, '/timeline');
    const clip = await p.getByTestId('timeline-grid').evaluate((g) => ({ sw: g.parentElement.scrollWidth, cw: g.parentElement.clientWidth }));
    check('타임라인 1280에서 잘리지 않음(40분 끝까지)', clip.sw <= clip.cw + 1, `${clip.sw}/${clip.cw}`);
    await p.screenshot({ path: `${OUT}/25-timeline-1280.png` });
    await c.close();
  }
  {
    const [c, p] = await shot(1440, 900, '/', { dark: true });
    await p.screenshot({ path: `${OUT}/26-overview-dark.png` });
    await c.close();
  }
  {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await c.newPage();
    const over = [];
    for (const r of ['/', '/design', '/timeline', '/live', '/next', '/standards', '/principles']) {
      await p.goto(`${BASE}${r}`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
      const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (o > 1) over.push(`${r}(+${o}px)`);
    }
    check('교사 화면 7개 390px 가로 스크롤 없음', over.length === 0, over.join(' ') || '모두 0');
    await c.close();
  }
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
