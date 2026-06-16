import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import OnboardingForm from './components/OnboardingForm.jsx';
import GeneratingScreen from './components/GeneratingScreen.jsx';
import Dashboard from './components/Dashboard.jsx';

function AppShell() {
  const { state } = useApp();

  return (
    <div style={styles.root}>
      <Header />
      <main style={styles.main}>
        {state.step === 0 && <OnboardingForm />}
        {state.step === 1 && <GeneratingScreen />}
        {state.step === 2 && <Dashboard />}
      </main>

      {/* Wordmark footer rule */}
      <footer style={styles.footer}>
        <span style={styles.footerBrand}>TEMPO</span>
        <span style={styles.footerNote}>Precision Training Engine — Powered by Groq + Llama 3.3</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
  },
  footer: {
    borderTop: '1px solid var(--color-border)',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  footerBrand: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    color: 'var(--color-accent)',
    fontWeight: 500,
  },
  footerNote: {
    fontSize: '0.68rem',
    color: 'var(--color-text-dim)',
    letterSpacing: '0.04em',
  },
};
