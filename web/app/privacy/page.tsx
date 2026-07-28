import type { Metadata } from "next";
import { LegalPageShell } from "../components/LegalPageShell";
import styles from "../components/LegalPageShell.module.css";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | hyu-pf",
  description: "hyu-pf 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="PRIVACY"
      title="개인정보 처리방침"
      description="hyu-pf는 서비스 이용자의 개인정보를 필요한 최소 범위에서 처리합니다."
    >
      <p className={styles.notice}>
        한양대학교 구성원 인증 목적의 이메일 주소 및 도메인 정보를 제외하고는
        데이터를 수집하지 않습니다.
      </p>

      <section className={styles.section}>
        <h2>1. 처리하는 개인정보</h2>
        <ul>
          <li>이메일 주소</li>
          <li>Google Workspace 소속 도메인 정보</li>
        </ul>
        <p>
          서비스는 이름, 프로필 사진, 학번, 연락처 등의 정보를 요청하거나
          별도의 회원 데이터베이스에 저장하지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. 개인정보의 처리 목적</h2>
        <p>
          이메일 주소와 도메인 정보는 이용자가 한양대학교 구성원인지 확인하고
          서비스 데이터에 대한 접근 권한을 부여하는 용도로만 사용합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. 처리 및 보유 기간</h2>
        <p>
          로그인 상태 유지를 위해 이메일 주소와 도메인 정보가 포함된 암호화된
          세션 쿠키를 브라우저에 최대 90일간 저장합니다. 로그아웃하거나 쿠키를
          삭제하면 해당 세션 정보는 즉시 제거됩니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. 제3자 제공</h2>
        <p>
          서비스는 처리한 개인정보를 제3자에게 판매하거나 제공하지 않습니다.
          Google 로그인 과정에서의 정보 처리는 Google의 개인정보처리방침에
          따릅니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. 쿠키 사용</h2>
        <p>
          서비스는 인증에 필요한 세션 쿠키만 사용하며 광고 및 이용자 추적을
          위한 쿠키를 사용하지 않습니다. 브라우저에서 쿠키를 차단할 수 있으나,
          이 경우 로그인이 필요한 기능을 이용할 수 없습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. 이용자의 권리와 문의</h2>
        <p>
          이용자는 언제든지 로그아웃하거나 브라우저 쿠키를 삭제하여 세션
          정보를 제거할 수 있습니다. 개인정보 관련 문의는{" "}
          <a
            href="https://forif.org/"
            target="_blank"
            rel="noreferrer"
          >
            FORIF 홈페이지
          </a>
          를 통해 문의해 주세요.
        </p>
      </section>

      <p className={styles.date}>시행일: 2026년 7월 28일</p>
    </LegalPageShell>
  );
}
