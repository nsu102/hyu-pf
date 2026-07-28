import { Fragment } from "react";
import Link from "next/link";
import styles from "./LegalFooter.module.css";

const LEGAL_LINKS = [
  { href: "/privacy", label: "개인정보 처리방침" },
  { href: "/terms", label: "이용약관" },
] as const;

export function LegalFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="서비스 정책">
          {LEGAL_LINKS.map((link, index) => (
            <Fragment key={link.href}>
              {index > 0 ? (
                <span className={styles.divider} aria-hidden="true">
                  ·
                </span>
              ) : null}
              <Link className={styles.link} href={link.href}>
                {link.label}
              </Link>
            </Fragment>
          ))}
        </nav>
        <div className={styles.meta}>
          <span>

            <a className={styles.link} href="mailto:contact@forif.org">
              이메일: contact@forif.org
            </a>
          </span>
          <span className={styles.divider} aria-hidden="true">
            ·
          </span>
          <span>Copyright © 2026 FORIF All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
