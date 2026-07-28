import type { Metadata } from "next";
import { LegalPageShell } from "../components/LegalPageShell";
import styles from "../components/LegalPageShell.module.css";

export const metadata: Metadata = {
  title: "이용약관 | hyu-pf",
  description: "hyu-pf 서비스 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="TERMS"
      title="이용약관"
      description="hyu-pf를 이용하기 전에 아래 내용을 확인해 주세요."
    >
      <section className={styles.section}>
        <h2>1. 목적</h2>
        <p>
          본 약관은 hyu-pf가 제공하는 교과목 성적비율 조회 서비스의 이용
          조건과 운영자 및 이용자의 권리·의무를 정하는 것을 목적으로 합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. 이용 자격</h2>
        <p>
          서비스는 유효한 @hanyang.ac.kr Google Workspace 계정으로 인증된
          한양대학교 구성원에게 제공됩니다. 이용자는 본인의 계정만 사용해야
          합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. 서비스 이용</h2>
        <p>
          서비스는 수강 탐색을 돕기 위한 참고 정보를 제공합니다. 제공되는
          정보는 원자료의 정정, 갱신 시점 또는 처리 과정에 따라 실제 정보와
          차이가 있을 수 있으며, 중요한 의사결정 전에는 공식 정보를 함께
          확인해야 합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. 금지 행위</h2>
        <ul>
          <li>타인의 계정 또는 인증 정보를 사용하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>데이터를 무단으로 대량 수집하거나 재배포하는 행위</li>
          <li>관련 법령 또는 타인의 권리를 침해하는 행위</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. 서비스의 변경 및 중단</h2>
        <p>
          운영상 또는 기술상 필요한 경우 서비스의 일부 또는 전부가 변경되거나
          일시 중단될 수 있습니다. 가능한 경우 서비스 화면을 통해 관련 내용을
          안내합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. 개인정보 보호</h2>
        <p>
          개인정보의 처리에 관한 사항은{" "}
          <a href="/privacy">개인정보 처리방침</a>을 따릅니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. 문의</h2>
        <p>
          서비스 이용 관련 문의는{" "}
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
