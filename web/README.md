# Hanyang Course Portfolio Web

CSV 기반으로 한양대 교과목 성적 비율 데이터를 조회하는 Next.js 앱입니다.

## Data Pipeline

원본 크롤링 결과:

```bash
/Users/yunsu/Documents/hyu-pf/outputs/grade_ratios_full_by_year.csv
```

앱/검증용 CSV 생성:

```bash
npm run data:prepare
npm run data:verify
```

생성되는 파일:

- `public/data/grade_ratios.csv`: 과목별 최신 학기 wide CSV, 총원과 등급별 인원/비율 포함
- `public/data/grade_ratios_by_year.csv`: 과목/년도/학기/등급별 long CSV
- `public/data/grade_ratios_by_term.csv`: 과목/년도/학기별 wide CSV, 총원과 등급별 인원/비율 포함
- `public/data/courses.csv`: 학수번호 기준 과목 카탈로그
- `public/data/departments.csv`: 학과 카탈로그
- `public/data/department_courses.csv`: 관측된 학과-과목 연결
- `public/data/coverage_report.csv`: 과목별 수집 상태와 PDF/성적 데이터 커버리지
- `public/data/verification_issues.csv`: 검증 경고/오류 목록
- `public/data/metadata.json`: 생성 요약

`verification_issues.csv`에서 `severity=error`가 있으면 데이터 구조 문제가 있는 것이고,
`severity=warning`은 포털 리포트에 성적 표가 없거나 비율 합계가 100 근처가 아닌 등 확인용 항목입니다.

## Getting Started

Google Cloud Console에서 OAuth 2.0 웹 클라이언트를 만든 뒤 승인된 리디렉션 URI를 등록합니다.

```text
http://localhost:3000/api/auth/callback/google
https://your-domain.example/api/auth/callback/google
```

환경 변수 예시를 복사하고 값을 채웁니다.

```bash
cp .env.example .env.local
openssl rand -base64 32
```

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

인증은 NextAuth의 JWT 세션을 사용하므로 별도의 데이터베이스나 어댑터가 필요하지 않습니다.
Google OAuth 응답의 검증된 `hd`, `email_verified`, 이메일 도메인을 모두 확인해
`@hanyang.ac.kr` 계정만 허용합니다. 로그인 세션은 최대 90일간 유지됩니다.
Google 계정 정보는 인증 확인에만 사용하며 별도의 사용자 데이터를 수집하거나
데이터베이스에 저장하지 않습니다. 인증 전에는 `/data/*` 응답도 차단합니다.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
