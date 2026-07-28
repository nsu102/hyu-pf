import type { ReactNode } from "react";
import Link from "next/link";
import { LegalFooter } from "./LegalFooter";
import styles from "./LegalPageShell.module.css";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            hyu-pf
          </Link>
          <Link className={styles.back} href="/">
            서비스로 돌아가기
          </Link>
        </div>
      </header>
      <main className={styles.main}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.content}>{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}
