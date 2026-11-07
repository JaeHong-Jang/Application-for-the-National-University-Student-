# B2. 돌봄 인력 대상 AI/VR 대화 롤플레이 교육: 해외 경쟁사와 유사 사례 (작성 기준일 2026-11-06)

> 검증 표기 규칙
> - **[검증]**: 원문 페이지를 직접 열어(WebFetch) 내용을 확인함
> - **[스니펫]**: 검색 결과 요약이나 스니펫으로만 확인함. 원문 미확인이므로 발표 자료에 쓰기 전에 원문을 다시 확인해야 함
> - 조사 범위: 웹검색 약 15회, 원문 확인 2건. 요청 목록 가운데 일부 제품(SimX, Kognito, Sana, Relias, Ankota, Ensign, Care.coach, Honor, UK Skills for Care)은 이번 조사에서 확인하지 못했다. 이 제품들은 각 섹션의 Gaps에 적었다.

---

## Q1. 해외 AI/VR 돌봄·의료 커뮤니케이션 시뮬레이션 제품 현황

### Takeaway
"치매 당사자 아바타와 대화 연습"이라는 카테고리는 해외에 이미 있다. 대표 사례는 호주 Dementia Australia의 Talk with Ted(2021)와 미국 Embodied Labs의 VR 공감 체험이다. 다만 이 제품들은 대본형·공감 체험형이 중심이고, LLM이 자유 발화로 응답하면서 루브릭 채점과 다국어 피드백까지 주는 형태는 연구 프로토타입(2024~2026) 단계에 머물러 있다. 범용 의료 소프트스킬 시뮬레이션(Virti, Mursion, Oxford Medical Simulation)은 성숙한 시장이지만, 요양보호사나 재가 돌봄 인력에 특화되어 있지는 않다.

### Cited Findings
**치매·돌봄 특화**
- **Talk with Ted (호주, Dementia Australia + Deakin Univ. A²I²)** [검증]: 2021-05-13 발표. 치매가 있는 AI 아바타 'Ted'가 감정 표현과 음성 응답을 하고, 돌봄 종사자가 대화 전체를 진행하며 공감적·존중적 접근으로 조정해 가는 온라인 시뮬레이션이다. 돌봄 종사자와 함께 설계했고, Rosemary Norman Foundation이 3년간 개발비를 지원했다. 개인과 호주 내 노인돌봄 제공기관이 Centre for Dementia Learning을 통해 구매할 수 있다. 페이지에는 가격, 채점·피드백 기능, 성과 데이터가 기재되어 있지 않다 — [Dementia Australia](https://www.dementia.org.au/news/world-first-ai-avatar-dementia-education-set-improve-care)
- Talk with Ted는 2022 Future of Ageing Awards Dementia Care 부문을 수상했다 [스니펫] — [Dementia Australia media release](https://www.dementia.org.au/media-centre/media-releases/dementia-australias-technology-wins-big-praise-2022-future-ageing)
- **Embodied Labs (미국)** [스니펫]: VR로 노인의 시각과 인지 저하를 1인칭으로 체험하게 해 돌봄 인력의 공감을 키우는 플랫폼이다. 창업자 Carrie Shaw가 어머니를 돌본 경험에서 출발했다. 헤드셋 VR(대면 교육)과 헤드셋 없는 온라인 자기주도 과정을 함께 제공한다(캘리포니아 CalGrows 프로그램과 제휴) — [MobiHealthNews](https://www.mobihealthnews.com/news/vr-powered-caregiver-training-tool-embodied-labs-raises-32m-seed-round), [Embodied Labs CalGrows](https://embodiedlabs.com/calgrows)
- 검색 결과에서는 Embodied Labs 제품에 AI(LLM) 대화 기능이 있다는 언급을 찾지 못했다 [스니펫, 부재 확인 수준] — [Dealroom](https://app.dealroom.co/companies/embodied_labs)
- **Angels on Call Homecare (미국 뉴욕, 재가돌봄 기관)** [스니펫, 회사 보도자료]: 행동심리증상 같은 고위험 상황에 대비해 VR과 AI 기반 롤플레이 시뮬레이션으로 케어 인력을 교육하고 있으며, 이 교육으로 2026년 수상했다고 주장한다. 자체 자료에도 "AI 활용을 계속 탐색 중"이라고 적혀 있다 — [HomeCare Magazine](https://www.homecaremag.com/news/angels-call-wins-best-employee-training-program), [보도자료](https://pr.theoutlookonline.com/article/The-Homecare-Agency-Training-Caregivers-With-AI-and-Virtual-Reality-Just-Won-Two-Awards-and-Its-Redefining-What-Dementia-and-Parkinsons-Care-at-Home-Looks-Like/69f9def1f625e38428138bad)
- **CareAcademy (미국 재가돌봄 LMS)** [스니펫]: 2025년 2월에 "AI 보조 학습(교육 콘텐츠 기반 인플랫폼 챗봇)"을 2025년 우선과제로 발표했다. 인수자 Activated Insights는 AI 에이전트 Iris와 Alice를 관리자·케어기버 페이지에 24/7 챗으로 제공한다. 이는 Q&A형 도우미이며 롤플레이형은 아니다. 2025-07에는 이직 시 교육이력을 옮길 수 있는 Shared Training History를 출시했다 — [CareAcademy 2025 계획](https://careacademy.com/?p=4627), [Activated Insights](https://new.activatedinsights.com/?p=428), [Business Wire 2025-05](https://www.businesswire.com/news/home/20250515400749/en)

**연구 프로토타입 (LLM 기반 치매 환자 시뮬레이터)**
- **An Interactive LLM-Based Simulator for Dementia-Related ADL** (arXiv 2603.29856, 2026-03) [검증]: gpt-5-mini로 치매 환자의 다회차 발화와 괄호 안 행동 단서를 생성한다. 사용자는 중증도, 돌봄 환경, 일상생활활동(ADL) 과업을 설정한다. 케어기버 응답은 자유 입력이나 4가지 전략(Recognition, Negotiation, Facilitation, Validation) 제안 중 선택해서 한다. 치매 전문가 14명이 18세션, 112턴을 평가했고 "중등도~높은 개연성"으로 판정했다. 전문가가 직접 응답을 쓴 비율은 54.5%였다. ADL 맥락 유지와 돌봄 환경 일관성에서 반복적인 실패가 나타나 6개 범주의 실패유형 분류를 도출했다 — [arXiv](https://arxiv.org/abs/2603.29856)
- **VICTORI (미국 UT Arlington, 2024 AAAI Symposium)** [스니펫]: 직접돌봄 인력이 AI가 생성한 치매 환자와 VR 세션 6회를 진행하고 실시간 피드백을 받는 구조다. 사용성과 예비 효과를 평가하겠다는 제안 단계이며 완성품은 아니다 — [AAAI-SS](https://ojs.aaai.org/index.php/AAAI-SS/article/view/31788)

**범용 의료·소프트스킬 시뮬레이션 (돌봄 특화 아님)**
- **Virti** [스니펫]: 고객 자료로 AI 롤플레이를 빠르게 생성하고 "실제 대화를 하는" 가상 인간을 제공한다고 자사 Mursion 비교 페이지에서 주장한다 — [Virti](https://virti.com/mursion-alternative)
- **Mursion** [스니펫]: 사람 운영자(simulation specialist)가 개입하는 구조여서 완전 AI형 도구보다 학습자당 비용이 높다는 제3자 평가가 있다 — [FitGap](https://us.fitgap.com/products/mursion)
- **Oxford Medical Simulation** [스니펫]: VR 및 스크린 기반 임상 시뮬레이션. 가격은 문의형(pay per use, 라이브러리, 티어, 기관 단위) — [Unbound Medicine](https://www.unboundmedicine.com/oadn/view/Virtual%20Simulation%20Reviews/2455046/all/Oxford_Medical_Simulation)
- **Hippocratic AI** [스니펫]: 환자 대상 음성 AI 에이전트이며 교육용이 아니다. 2025-11에 Series C 1.26억 달러를 유치했다(리드 Avenir, 기업가치 35억 달러, 누적 4.04억 달러). 10개월 전 Series B(1.41억 달러, 16.4억 달러 가치)를 받은 지 얼마 안 되어 가치가 두 배 넘게 올랐다 — [Fierce Healthcare](https://www.fiercehealthcare.com/ai-and-machine-learning/hippocratic-ai-lands-126m-series-c-expand-patient-facing-ai-agents-fuel-ma), [SiliconANGLE](https://siliconangle.com/2025/11/03/hippocratic-ais-valuation-soars-3-5b-raising-126m-new-funding/)

**인접 분야: 일반 서비스업 AI 롤플레이 (일본)**
- NTT 도코모는 2025-10부터 전국 도코모숍 2,048개 매장에 자체 개발한 'AI 롤플레잉 시스템'을 도입했다. AI가 고객 역할을 맡고 응대를 자동 채점해 피드백하며, 시나리오는 7종이다 [스니펫] — [docomo 보도자료 PDF](https://www.docomo.ne.jp/binary/pdf/info/news_release/topics_251006_x2.pdf)
- 엑사위저즈 'exaBase 롤플레이'는 AI 아바타 롤플레이와 정량 평가를 제공하며 콜센터와 신용금고 신입 연수에 도입됐다 [스니펫] — [exawizards](https://exawizards.com/archives/30010/), [zaikei](https://zaikei.co.jp/releases/3545061/)

### Inferences
- "AI 아바타와 치매 대화 연습"의 효용은 호주 공공·비영리 주체가 2021년에 이미 제품화하고 수상까지 하면서 입증됐다. 따라서 심사위원에게 "해외에서 검증된 카테고리"라고 말할 수 있다.
- 다만 Talk with Ted는 LLM 이전 세대 기술로 보이고, 공개 자료에 채점·피드백 기능 설명이 없다. Embodied Labs는 체험(공감) 중심이다. "LLM 자유대화 + 루브릭 채점 + 기관 대시보드"를 결합한 상용 돌봄 특화 제품은 이번 조사에서 찾지 못했다.
- 반면 일반 서비스업(통신 매장, 콜센터, 금융)에서는 "AI 고객 역할 + 자동 채점" 롤플레이가 이미 대규모로 상용화됐다(도코모 2,048개 매장). 기술 실현 가능성은 입증됐고, 돌봄 도메인 이식이 비어 있다는 논리를 세울 수 있다.
- Hippocratic AI가 받은 높은 기업가치는 의료 음성 페르소나 기술에 대한 투자자 수요를 보여준다. 하지만 교육 시장과는 직접 비교할 수 없으므로 "인접 시장 신호" 정도로만 인용하는 것이 안전하다.

### Gaps
- SimX, Kognito, Sana, Relias, Ankota, Ensign, Care.coach, Honor, UK Skills for Care 디지털 도구: 이번 조사에서 검색하지 못했다(툴 호출 한도).
- Talk with Ted의 현재(2025~2026) LLM 업그레이드 여부와 가격: 공식 페이지에 없음.
- Embodied Labs의 최근 AI 기능 추가 여부: 검색 결과에서 확인되지 않음.

---

## Q2. 가격 모델, 투자 유치, 고객 수

### Takeaway
공개 가격표는 거의 없다. 대부분 기관 단위 견적형이며, 확인된 수치는 Virti "Teams" 월 399달러(학습자 25명, 가상인간 3개, 제3자 출처)뿐이다. 돌봄 특화 기업의 투자 규모는 작고(Embodied Labs 시드 320만 달러, CareAcademy 시리즈 A 950만 달러), 대형 자금은 환자 대상 AI(Hippocratic AI)로 몰리고 있다.

### Cited Findings
- **Embodied Labs**: 시드 320만 달러. 리드는 Ziegler LinkAge Longevity Fund, 공동투자자는 The Venture Reality Fund, SustainVC 등. 시점은 출처에 따라 2019-06과 2020-01로 엇갈린다 [스니펫]. 이후 라운드는 검색되지 않았다 — [MobiHealthNews](https://www.mobihealthnews.com/news/vr-powered-caregiver-training-tool-embodied-labs-raises-32m-seed-round), [Embodied Labs 2020 보도](https://embodiedlabs.com/2020/01/embodied-labs-raises-3-2-million-in-seed-funding-with-diverse-investors-across-aging-tech-and-impact-funds)
- **Embodied Labs 수익 모델**: 기관에 교육 모듈 라이브러리 접근권을 제공한다(VR 헤드셋 또는 웹). Dealroom의 AI 요약이라 신뢰도는 중간 [스니펫] — [Dealroom](https://app.dealroom.co/companies/embodied_labs)
- **CareAcademy**: 시리즈 A 950만 달러 [스니펫, 연도 미확인] — [Signalbase](https://www.trysignalbase.com/news/funding/careacademy-secures-95m-series-a-funding-to-revolutionize-caregiver-training-and-healthcare-outcomes). 이후 Activated Insights에 인수됨 [스니펫] — [Activated Insights](https://new.activatedinsights.com/?p=428)
- **Hippocratic AI**: Series C 1.26억 달러, 기업가치 35억 달러, 누적 4.04억 달러(2025-11). 매출 7,800만 달러라는 제3자 추정치도 있다(회사 공시 아님) [스니펫] — [Fierce Healthcare](https://www.fiercehealthcare.com/ai-and-machine-learning/hippocratic-ai-lands-126m-series-c-expand-patient-facing-ai-agents-fuel-ma), [Multiples.vc](https://multiples.vc/private-comps/hippocratic-ai)
- **Virti**: G2 기준 "Teams" 플랜 월 399달러(학습자 25명, 가상인간 3개)로, 학습자당 월 약 16달러에 해당한다. Virti 자체 사이트에서는 확인하지 못했다 [스니펫, 신뢰도 낮음: 검색 요약이 G2 OMS/Virti 비교 결과에서 인용한 수치이며 정확한 원 페이지를 특정하지 못했음] — [G2 (검색 결과 페이지)](https://www.g2.com/products/oxford-medical-simulation/pricing), [SourceForge Virti](https://www.sourceforge.net/software/product/Virti)
- **Mursion / Oxford Medical Simulation**: 공개 가격이 없고 문의형이다 [스니펫] — [G2 Mursion](https://www.g2.com/products/mursion/pricing), [FitGap OMS](https://us.fitgap.com/products/048266/oxford-medical-simulation)
- **Talk with Ted**: 개인과 기관이 구매 가능하지만 가격은 비공개 [검증] — [Dementia Australia](https://www.dementia.org.au/news/world-first-ai-avatar-dementia-education-set-improve-care)
- **シルバーウッド「VR認知症」(일본)**: 2016년에 개발했고 누적 체험자가 11만 명을 넘었다(2023년 논문 기준, 도입 기업 수는 아님) [스니펫] — [医学書院 論文抄録](https://webview.isho.jp/journal/detail/abs/10.11477/mf.7010200835)
- **NTT 도코모 AI 롤플레이**: 2,048개 매장 도입(사내용) [스니펫] — [docomo](https://www.docomo.ne.jp/binary/pdf/info/news_release/topics_251006_x2.pdf)

### Inferences
- 시장 관행은 기관 단위 구독(학습자 묶음)이다. 우리 서비스도 "기관당 월정액 + 학습자 수 티어"가 자연스럽다. Virti의 학습자당 월 약 16달러는 상한 참고치로 쓸 수 있다(미검증).
- 돌봄 교육 특화 스타트업의 투자 규모가 작다는 사실은 두 가지로 읽힌다. 기회(경쟁이 약함)이기도 하고, 위험(시장 지불의사가 낮음)이기도 하다. 한국에서는 공공 재원(지자체, 장기요양 교육 예산)을 연계하는 모델이 필요하다는 근거로 쓸 수 있다. Embodied Labs가 캘리포니아 주 프로그램 CalGrows와 제휴한 것이 해외 선례다.

### Gaps
- Embodied Labs, Mursion, Kognito, Relias의 고객 수와 학습자당 가격: 공식 출처를 찾지 못했다.
- CareAcademy 시리즈 A의 정확한 연도와 리드 투자자: 확인하지 못했다.
- Virti 399달러 플랜은 공식 가격 페이지에서 직접 확인하지 못했다.

---

## Q3. 효과성 근거 (VR/AI 시뮬레이션 → 치매 소통 역량, 이직률)

### Takeaway
VR 치매 교육이 공감, 지식, 태도를 개선한다는 체계적 문헌고찰이 있다. 다만 효과가 일관되지 않고 근거 대부분이 학생이나 비공식 돌봄자 대상이다. 요양시설 직원 대상 근거는 아직 스코핑·프로토콜 단계다. AI 아바타 대화 훈련의 근거는 소규모 파일럿(n=23)과 미발표 RCT 수준이고, 이직률 감소를 직접 입증한 연구는 찾지 못했다.

### Cited Findings
- **체계적 문헌고찰(Li et al., PMC)**: VR 교육이 돌봄자와 학생의 치매 관련 공감, 지식, 태도를 개선했다. 단, 모든 실험연구에서 통계적으로 유의한 변화가 나타난 것은 아니다 [스니펫] — [PMC11086507](https://pmc.ncbi.nlm.nih.gov/articles/PMC11086507)
- **Frontiers in Virtual Reality 스코핑 리뷰(2025-03)**: 장기요양시설 직원 대상 완전몰입형 VR 치매 교육의 장벽, 촉진요인, 효과를 정리했다 [스니펫] — [Frontiers](https://frontiersin.org/articles/10.3389/frvir.2025.1552370/full)
- **BMJ Open 프로토콜(2024)**: 공식 돌봄 인력은 비공식 돌봄자나 학생과 다르므로 직원 대상 근거가 별도로 필요하다고 지적했다 [스니펫] — [BMJ Open 14(5):e083724](https://bmjopen-bmj-com.ezproxy.u-pec.fr/content/14/5/e083724)
- **Health Education Research(2026) 스코핑 리뷰**: VR이 돌봄자의 공감, 치매 지식, 돌봄 역량을 향상한다고 보고했다 [스니펫] — [OUP](https://academic.oup.com/her/article/41/2/cyag003/8471774)
- **Talk with Ted 파일럿**: 2019년 말 8주간 전문 돌봄자 23명을 대상으로 아바타군과 온라인교육 비교군을 나눠 진행했다. 치매 행동에 대한 이해가 개선됐고, 대다수가 모의환자나 온라인 강좌보다 아바타를 선호했다고 한다. 개발 주체가 보고한 결과다 [스니펫] — [Deakin A²I²](https://a2i2.deakin.edu.au/2021/05/meet-ted-the-ai-avatar-set-to-transform-care-for-people-living-with-dementia/)
- **Talk with Ted RCT 등록(ACTRN12623001297617)**: AI 아바타를 이용한 치매 소통 인력역량 RCT가 등록되어 있으나 결과는 미확인 [스니펫] — [ANZCTR](https://anzctr.org.au/ACTRN12623001297617.aspx)
- **LLM 치매 시뮬레이터(2026)**: 전문가 14명이 "중등도~높은 개연성"으로 평가했지만, 학습효과는 측정하지 않았다 [검증] — [arXiv 2603.29856](https://arxiv.org/abs/2603.29856)
- **일본 긴키대(近畿大) 연구**: 기능실습생이 개호 현장 용어를 포함한 회화를 자기주도로 연습하는 시스템을 개발해 자학자습이 가능함을 확인했다. 발화 억양 판정 정확도는 과제로 남았다 [스니펫] — [IPSJ](https://ipsj.ixsq.nii.ac.jp/record/215548/files/IPSJ-Z83-1ZC-05.pdf)

### Inferences
- 심사위원 앞에서는 "VR/시뮬레이션이 공감과 지식을 높인다는 메타 수준 근거는 있다. 그러나 현장 직원, 외국인 인력, 이직률 같은 결과변수에 대한 근거는 비어 있다"고 정직하게 제시하는 편이 낫다. 그 빈칸을 강원도 파일럿에서 측정할 KPI(사전·사후 루브릭 점수, 3개월 근속률)로 제안하면 차별점이 된다.
- 세 가지 사례(arXiv 실패유형 분석, BFH 학생 피드백, Talk with Ted 파일럿)를 보면, 아바타가 실제 환자보다 일관성이 떨어지고 대화를 끝낼 시점이 애매하다는 문제가 반복된다. 시나리오 목표와 종료 조건을 명시한 루브릭 설계가 품질의 핵심이다.

### Gaps
- 시뮬레이션 교육 → 돌봄 인력 이직률 감소를 직접 측정한 연구: 찾지 못했다.
- Talk with Ted RCT 결과 논문: 미발견.
- Li et al. 리뷰의 게재연도와 포함 연구 수: 원문 미확인.

---

## Q4. 일본: 가장 가까운 아날로그 (고령화, 외국인 개호인력, 방언)

### Takeaway
일본은 외국인 개호인력이 빠르게 늘고 있다(특정기능 개호 2026-03 기준 74,745명, 속보치). 후생노동성 사업으로 무료 다국어 개호 일본어 학습 사이트 「にほんごをまなぼう」(12개 언어, N3 수준과 기초 개호 기술)가 운영된다. 그러나 이 사이트는 자기학습형 콘텐츠이며, 생성AI가 고령 이용자 역할을 맡아 방언이나 치매 발화로 응대하고 채점까지 하는 개호 특화 서비스는 이번 조사에서 확인되지 않았다. 가장 가까운 것은 외국인 개호인력용 AI 학습앱(医療介護ネットワーク), 범용 외국인 AI 일본어 롤플레이 교재(プロシーズ, 2025-11), 그리고 시설 자체의 생성AI 클레임 대응 연습(愛生会) 정도다.

### Cited Findings
**정부·공공 인프라**
- **특정기능(介護) 재류자 수**: 2024-08 말 약 3.9만 명(과거 최다)이었다. 출입국재류관리청 속보치로는 2026-03 말 74,745명이고, 같은 시점 수용 예상 인원은 126,900명이다. 2023-01 말에는 17,066명이었다 [스니펫] — [MHLW 자료](https://www.mhlw.go.jp/content/12000000/001240343.pdf), [出入国在留管理庁](https://www.moj.go.jp/isa/content/001465883.pdf)
- 개호일본어평가시험 합격자는 46,717명(2019-04~2023-01) [스니펫] — [MHLW](https://www.mhlw.go.jp/content/12000000/001090473.pdf)
- **「にほんごをまなぼう」**: 후생노동성 사업으로 공개되어 公益社団法人日本介護福祉士会가 운영한다. N3 정도의 일본어와 기초 개호 기술 습득, 특정기능 평가시험 대비, 개호복지사 국가시험 대비, 이용자 교류 기능을 제공한다. 12개 언어, PC와 스마트폰을 지원하며 관리자와 학습자 모두 무료다. URL은 aft.kaigo-nihongo.jp. 앱이 아닌 웹사이트다 [스니펫] — [宮城県](https://www.pref.miyagi.jp/site/gaikokujin/manabou.html), [秋田県 フライヤー](https://www.pref.akita.lg.jp/uploads/public/archive_0000074184_00/完成版：R5フライヤー（ベージュ：管理者用）.pdf), [三重県](https://www.pref.mie.lg.jp/CHOJUS/HP/000228960.htm), [日本介護福祉士会 案内](https://www.city.naha.okinawa.jp/fukusi/koureisyafukusi/jigyousya/kaigohoken/keikaireberu-unyouka.files/02_nihonnkaigofukushishikaiyori.pdf)
- 나라시 진정서에 따르면 외국인 개호복지사 국가시험 합격률이 30%대에 머물러 다국어 학습앱에 공적 보조를 요구하고 있다(시험 대비이며 회화 연습은 아님) [스니펫] — [奈良市](https://www.city.nara.lg.jp/uploaded/attachment/216396.pdf)

**민간 서비스·사례**
- **医療介護ネットワーク**: 개호 특정기능 외국인을 위해 AI 지원 앱으로 전문용어 학습, 일본어 학습, 번역, 회화 연습, 업무·생활 상담을 통합 제공하는 프로그램을 도입했다 [스니펫] — [@Press](https://www.atpress.ne.jp/news/5094933)
- **プロシーズ「AI 日本語会話ロールプレイ教材」**: 외국인 인재 플랫폼에 탑재해 2025-11부터 제공한다. 개호 특화 여부는 미확인 [스니펫] — [プロシーズ](https://www.pro-seeds.com/news/8451/)
- **愛生会(개호시설) 사례**: 생성AI 롤플레이로 이용자 클레임 대응을 연습하고, 일본어와 미얀마어 동시통역을 활용한다 [스니펫] — [muratomi.jp](https://muratomi.jp/generative-ai2/)
- **NTT 도코모 실증**: 일본어 발음과 표현을 판정하는 AI로 음식·숙박·개호 등 업무 특화 회화 트레이닝 앱을 제공하는 실증실험을 보도 [스니펫] — [PC Watch](https://pc.watch.impress.co.jp/docs/release/atpress/2025472.html)
- **方言 AI**: 야마가타현 니시카와마치 건강앱이 방언 음성 3,500문장을 학습해 방언을 이해하고 음성으로 응답한다. 외국인용이 아닌 주민용 [스니펫] — [newswitch](https://newswitch.jp/p/17357)
- **シルバーウッド「VR認知症」**: 2016년에 개발한 1인칭 치매 체험 VR로, 기업·학교·지자체용이다. 누적 체험자 11만 명 이상(2023) [스니펫] — [日本総研](https://www.jri.co.jp/page.jsp?id=33519), [医学書院](https://webview.isho.jp/journal/detail/abs/10.11477/mf.7010200835)
- **近畿大 개호 회화 자학 시스템**: 기능실습생 대상 연구 시스템이며 억양 판정이 과제 [스니펫] — [IPSJ](https://ipsj.ixsq.nii.ac.jp/record/215548/files/IPSJ-Z83-1ZC-05.pdf)
- 한편 "생성AI 치매 대응 롤플레이 연수"로 검색하면 영업·접객용(도코모, 엑사위저즈, ClipLine ABILI)만 나오고, 개호 특화 상용 제품은 나오지 않았다 [스니펫, 부재 확인] — [docomo](https://www.docomo.ne.jp/binary/pdf/info/news_release/topics_251006_x2.pdf), [ClipLine ABILI](https://webtan.impress.co.jp/r/prtimes/items/000000225.000011390)

### Inferences
- 일본 공공 모델(후생노동성 예산 → 직능단체 운영 → 무료 다국어 제공)은 한국 보건복지부, 강원도, 요양보호사협회 연계 모델의 선례가 된다. 다만 일본의 공공 도구는 "읽고 푸는" 정적 학습이고, 대화 연습과 채점이 없다는 점이 우리의 차별 포인트다.
- 일본은 외국인 개호인력이 3년 남짓 만에 1.7만 명에서 7.5만 명으로 약 4배 늘었다(속보치 포함). 따라서 "방언·치매 발화 이해 + 현장 회화" 수요가 크다. 그럼에도 전용 생성AI 롤플레이가 아직 없다는 점은 한국 모델이 성공하면 일본으로 확장할 수 있다는 논거로 쓸 수 있다(추정).
- 방언 대응은 일본에서도 지자체 단위 실험(니시카와마치)에 그친다. 강원 방언을 쓰는 고령자 페르소나는 한·일 어디에서도 상용 선례가 없는 기능으로 보인다.

### Gaps
- 「かいごの日本語」 등 다른 개호 일본어 앱의 구체 정보: 이번 조사에서 확인하지 못했다.
- 후생노동성의 외국인 개호인력 일본어 학습지원 예산 규모(최신 연도): 미확인.
- 医療介護ネットワーク 앱의 가격, 도입 시설 수, AI 회화의 형태(LLM 여부): 원문 미확인.
- 일본 개호 분야 스타트업의 생성AI 롤플레이 출시 여부: PR TIMES를 직접 검색하지 못했다. 이번 결과에서는 미발견이며, 존재 가능성은 남아 있다.

---

## Q5. 기타 지역 (독일·스위스, 호주, 영국)

### Takeaway
독일어권에서는 대학이 KI-아바타 대화훈련(스위스 BFH, 사회복지)을 도입하고 있지만, 독일 요양(Pflege)과 치매에 특화된 상용 AI 시뮬레이션은 이번 조사에서 찾지 못했다. 호주는 Talk with Ted가 대표 사례다. 영국 Skills for Care 관련 정보는 확인하지 못했다.

### Cited Findings
- **BFH(베른응용과학대) 2026**: VR 대화훈련에 KI 아바타를 도입했다. 정해진 시퀀스가 아니라 실시간 생성으로 응답하고, 자동 생성된 대화록을 기반으로 KI 피드백을 1차 제공한다. 학생들은 대화를 얼마나 길게 끌고 언제 마무리할지 판단하기 어렵다고 보고했다 [스니펫] — [BFH](https://www.bfh.ch/de/aktuell/storys/2026/gespraechsfuehrung-mit-ki-avataren/)
- **미국 간호교육 웹세미나**: ChatGPT 등 생성AI와 프롬프트 템플릿으로 음성 기반 완화의료 대화 시뮬레이션을 만드는 방법을 다룬다 [스니펫] — [HealthySimulation](https://www.healthysimulation.com/de/webinars/prepare-graduate-np-difficult-conversations-ai-enhanced-palliative-care-simulation/)
- **호주**: Q1의 Talk with Ted 참조 [검증] — [Dementia Australia](https://www.dementia.org.au/news/world-first-ai-avatar-dementia-education-set-improve-care)

### Inferences
- 교육기관이 직접 LLM 아바타를 만드는 흐름(BFH, 간호교육)은 진입장벽이 낮다는 뜻이기도 하다. 우리의 해자는 기술 자체보다 "현장 시나리오 라이브러리 + 검증된 루브릭 + 기관 운영 데이터"에 있어야 한다.

### Gaps
- 독일·네덜란드 Pflege AI 시뮬레이션 상용 제품: 미발견.
- 호주의 Royal Commission 이후 노인돌봄 교육 AI 정책과 제품: 검색하지 못했다.
- 영국 Skills for Care 디지털 도구: 검색하지 못했다.

---

## Q6. 기능 매트릭스: 우리 아이디어와 비교

### Takeaway
확인된 해외·일본 사례 가운데 5개 기능 (1) LLM 고령자 페르소나 롤플레이, (2) 치매·방언 발화, (3) 루브릭 채점, (4) 다국어(모국어) 피드백, (5) 기관 대시보드를 모두 갖춘 제품은 없다. 특히 (2) 방언과 (4) 외국인 모국어 피드백의 조합은 공백이다.

### Cited Findings (매트릭스)
표기: O = 출처로 확인, △ = 부분적·간접 확인, X = 출처상 없음으로 확인, ? = 확인 불가

| 제품/사례 | (1) LLM 고령자 페르소나 | (2) 치매/방언 발화 | (3) 루브릭 채점 | (4) 다국어 피드백 | (5) 기관 대시보드 | 출처 |
|---|---|---|---|---|---|---|
| Talk with Ted (AU) | △ AI 아바타, LLM 여부 미기재 | △ 치매 O / 방언 X | ? 기재 없음 | ? | ? | [Dementia Australia](https://www.dementia.org.au/news/world-first-ai-avatar-dementia-education-set-improve-care) [검증] |
| Embodied Labs (US) | X VR 체험형, AI 언급 없음 | △ 치매 체험 | ? | ? | ? | [Dealroom](https://app.dealroom.co/companies/embodied_labs), [CalGrows](https://embodiedlabs.com/calgrows) [스니펫] |
| arXiv LLM 치매 시뮬레이터 (2026, 연구) | O gpt-5-mini | △ 치매 O / 방언 X | △ 전략 4종 제안, 채점은 없음 | X | X | [arXiv](https://arxiv.org/abs/2603.29856) [검증] |
| VICTORI (US, 연구 제안) | O AI 생성 환자(VR) | △ 치매 | △ 실시간 피드백 | ? | ? | [AAAI-SS](https://ojs.aaai.org/index.php/AAAI-SS/article/view/31788) [스니펫] |
| Virti (범용) | O 가상인간 대화 | X 돌봄 특화 아님 | ? | ? | ? | [Virti](https://virti.com/mursion-alternative) [스니펫] |
| Mursion (범용) | △ 사람 운영자 개입형 | X | ? | ? | ? | [FitGap](https://us.fitgap.com/products/mursion) [스니펫] |
| CareAcademy / Activated Insights | X Q&A 챗봇 | X | X | ? | △ LMS 교육이력 | [Activated Insights](https://new.activatedinsights.com/?p=428) [스니펫] |
| にほんごをまなぼう (JP, MHLW) | X 정적 학습 | X | △ 시험 대비 | O 12개 언어 | △ 관리자용 무료 | [秋田県](https://www.pref.akita.lg.jp/uploads/public/archive_0000074184_00/完成版：R5フライヤー（ベージュ：管理者用）.pdf) [스니펫] |
| 医療介護ネットワーク AI 앱 (JP) | △ 회화 연습(LLM 여부 미확인) | ? | ? | △ 번역 | ? | [@Press](https://www.atpress.ne.jp/news/5094933) [스니펫] |
| NTT docomo AI 롤플레이 (JP, 매장용) | O AI 고객 역할 | X | O 자동 채점 | X | ? | [docomo](https://www.docomo.ne.jp/binary/pdf/info/news_release/topics_251006_x2.pdf) [스니펫] |
| **우리 아이디어** | O | O 치매 + 강원 방언 + 거부·낙상 시나리오 | O LLM 평가자 | O 모국어 피드백 | O | (기획안) |

### Inferences
- 차별화 메시지 후보: "Talk with Ted(치매 아바타)와 도코모(AI 고객 + 자동채점)와 にほんごをまなぼう(다국어 공공교육)가 따로 증명한 세 가지를 한 제품에 결합하고, 여기에 방언 페르소나를 더했다."
- 심사위원 예상 질문에 대비해야 할 위험: (a) LLM 페르소나의 일관성 실패(arXiv 실패유형 6범주), (b) 효과 근거 부족(직원 대상 RCT 부재), (c) 지불 주체 불명확(해외도 문의형 가격과 공공 연계). 이 세 가지를 파일럿 설계로 미리 답할 필요가 있다.

### Gaps
- 매트릭스의 '?' 셀은 각 제품의 상세 기능 문서를 열람하지 못해 채우지 못했다. 발표 전에 각 사 데모나 제품 페이지로 재확인해야 한다.
- 이번 조사가 포괄적이지는 않다. 한국어, 일본어, 독일어 상용 제품 중 미발견 경쟁자가 있을 수 있다. 특히 2026년 출시분은 검색 노출이 적을 수 있다.
