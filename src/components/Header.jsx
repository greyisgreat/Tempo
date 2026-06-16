import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Header() {
  const { state, reset } = useApp();
  const [confirming, setConfirming] = useState(false);

  const handleResetClick = () => {
    if (confirming) {
      reset();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  const stepLabel = state.step === 0
    ? 'Profile Configuration'
    : state.step === 1
      ? 'Generating Plan'
      : 'Training Plan';

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        {/* Wordmark */}
        <div style={styles.brand}>
          <span style={styles.wordmark}>TEMPO</span>
          <span style={styles.tagline}>Precision Training Engine</span>
        </div>

        {/* Breadcrumb */}
        <nav style={styles.breadcrumb} aria-label="Application state">
          <span style={styles.stepDot(state.step >= 0)} aria-hidden="true" />
          <span style={styles.stepConnector} aria-hidden="true" />
          <span style={styles.stepDot(state.step >= 2)} aria-hidden="true" />
          <span style={styles.stepLabel}>{stepLabel}</span>
        </nav>

        {/* Reset control — only visible after onboarding begins */}
        {(state.step > 0 || Object.values(state.profile).some(v => v !== '' && v !== 5 && v !== 3 && v !== 12)) && (
          <button
            style={styles.resetBtn(confirming)}
            onClick={handleResetClick}
            title={confirming ? 'Click again to confirm reset' : 'Reset profile and return to start'}
          >
            {confirming ? 'Confirm Reset' : 'Reset Profile'}
          </button>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: 'var(--header-height)',
    background: 'rgba(11, 12, 16, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    flexShrink: 0,
  },
  wordmark: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.95rem',
    fontWeight: 500,
    letterSpacing: '0.22em',
    color: 'var(--color-accent)',
  },
  tagline: {
    fontSize: '0.7rem',
    color: 'var(--color-text-dim)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 400,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  stepDot: (active) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: active ? 'var(--color-accent)' : 'var(--color-border)',
    transition: 'background var(--transition-med)',
    flexShrink: 0,
  }),
  stepConnector: {
    width: 20,
    height: 1,
    background: 'var(--color-border)',
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: '0.72rem',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  resetBtn: (confirming) => ({
    padding: '5px 12px',
    fontSize: '0.72rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 500,
    color: confirming ? 'var(--color-danger-text)' : 'var(--color-text-secondary)',
    background: 'transparent',
    border: `1px solid ${confirming ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
    animation: confirming ? 'pulse-border 1s ease infinite' : 'none',
  }),
};
