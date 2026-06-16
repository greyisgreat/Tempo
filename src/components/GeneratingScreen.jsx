import React, { useEffect, useState } from 'react';

const MESSAGES = [
  'Parsing physiological parameters',
  'Mapping commitment to frequency',
  'Computing periodisation phases',
  'Building macrocycle structure',
  'Requesting AI enrichment via Groq',
  'Synthesising exercise selection',
  'Applying technique cue layer',
  'Finalising training plan',
];

export default function GeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 1400);
    const dotTimer = setInterval(() => {
      setDots(d => (d + 1) % 4);
    }, 400);
    return () => {
      clearInterval(msgTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div style={styles.container} className="fade-in" role="status" aria-live="polite">
      <div style={styles.spinnerWrap}>
        <div style={styles.spinner} aria-hidden="true" />
        <div style={styles.spinnerInner} aria-hidden="true" />
      </div>

      <div style={styles.textBlock}>
        <p style={styles.message}>
          {MESSAGES[msgIndex]}
          <span style={styles.dots} aria-hidden="true">{'.'.repeat(dots)}</span>
        </p>
        <p style={styles.sub}>This typically takes 5 – 15 seconds.</p>
      </div>

      <div style={styles.progressBar} role="progressbar" aria-label="Generating plan">
        <div style={styles.progressIndeterminate} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - var(--header-height))',
    padding: '40px 24px',
    gap: 32,
  },
  spinnerWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  spinner: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    animation: 'spin 0.9s linear infinite',
  },
  spinnerInner: {
    position: 'absolute',
    inset: 12,
    borderRadius: '50%',
    border: '1px solid var(--color-border)',
    borderBottomColor: 'var(--color-accent-dim)',
    animation: 'spin 1.4s linear infinite reverse',
  },
  textBlock: {
    textAlign: 'center',
  },
  message: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.04em',
    marginBottom: 8,
    minWidth: '30ch',
  },
  dots: {
    display: 'inline-block',
    width: '1.4ch',
    textAlign: 'left',
  },
  sub: {
    fontSize: '0.72rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  progressBar: {
    width: 240,
    height: 2,
    background: 'var(--color-border)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressIndeterminate: {
    height: '100%',
    width: '40%',
    background: 'var(--color-accent)',
    borderRadius: 1,
    animation: 'shimmer 1.6s ease-in-out infinite',
    backgroundImage: 'linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
  },
};
