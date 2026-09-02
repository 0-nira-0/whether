import type { ReactNode } from 'react';
import styles from './Notice.module.css';

type NoticeProps = {
  tone: 'note' | 'failure';
  label: string;
  headline: string;
  copy: string;
  children?: ReactNode;
};

export function Notice({ tone, label, headline, copy, children }: NoticeProps) {
  return (
    <div className={styles.block}>
      <p className={tone === 'failure' ? styles.pill : styles.eyebrow}>{label}</p>
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.copy}>{copy}</p>
      {children}
    </div>
  );
}
