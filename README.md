# Hanyang Course Grade Ratio Scraper

한양대 포털의 `교과목포트폴리오`에서 `대학(학부/서울)` 학과별 과목 리포트 PDF를 내려받고, PDF 안의 `교과목 성적 비율`을 CSV로 정리하는 Playwright 자동화입니다.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

`.env`에 포털 ID와 비밀번호를 넣습니다. 시스템에 설치된 Chrome을 쓰려면 `.env`에 `PLAYWRIGHT_CHANNEL=chrome`을 넣고 `npx playwright install chromium` 단계는 생략할 수 있습니다.

PDF 텍스트 추출에는 `pdftotext`가 필요합니다.

## Run

전체 학과:

```bash
npm run scrape
```

테스트로 한 학과/일부 과목만:

```bash
npm run scrape -- --dept H0002867 --limit 3 --headed
```

주요 옵션:

```text
--campus H0002256             조직 코드. 기본값: 대학(학부/서울)
--dept H0002867               특정 학과 코드만 수집
--limit 10                    과목 처리 개수 제한
--output outputs/grades.csv   CSV 저장 위치
--pdf-dir outputs/pdfs        PDF 저장 폴더
--headed                      브라우저 화면 표시
--fresh                       기존 CSV가 있어도 스킵하지 않고 재처리
--include-root-dept           "서울 대학" 같은 상위 조직 옵션도 포함
```

CSV에는 학과, 과목, PDF 경로, 파싱 상태, `A+`, `A`, `B+`, `B`, `C+`, `C`, `D+`, `D`, `F`, `P`, `S`, `U` 컬럼이 들어갑니다. 파싱이 실패해도 PDF는 저장하고 `parse_status`/`error`에 이유를 남깁니다.
