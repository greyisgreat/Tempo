import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { deriveTrainingBrief, buildGroqPrompt } from '../utils/tempoEngine.js';

const GOALS = [
  { id: 'strength',    label: 'Strength',        description: 'Maximal force output. Low rep, high load progressions.' },
  { id: 'hypertrophy', label: 'Hypertrophy',      description: 'Muscle volume accumulation. Moderate load, high TUT.' },
  { id: 'fat_loss',    label: 'Fat Loss',         description: 'Caloric output and metabolic conditioning priority.' },
  { id: 'endurance',   label: 'Endurance',        description: 'Cardiovascular capacity and sustained output.' },
  { id: 'general',     label: 'General Fitness',  description: 'Balanced development across all physical qualities.' },
];

const HORIZONS = [4, 8, 12, 16, 20, 24];

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function Label({ children, htmlFor, sub }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label htmlFor={htmlFor} style={styles.label}>{children}</label>
      {sub && <p style={styles.labelSub}>{sub}</p>}
    </div>
  );
}

function SliderField({ id, label, sub, min, max, value, onChange, leftTick, rightTick }) {
  return (
    <div style={styles.fieldGroup}>
      <Label htmlFor={id} sub={sub}>{label}</Label>
      <div style={styles.sliderWrap}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.sliderMeta}>
          <span style={styles.sliderTick}>{leftTick}</span>
          <span style={styles.sliderValue}>{value}<span style={styles.sliderUnit}> / {max}</span></span>
          <span style={styles.sliderTick}>{rightTick}</span>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p style={styles.fieldError}>{message}</p>;
}

/* ─── Step Components ─────────────────────────────────────────────────────────── */

function StepAge({ profile, updateProfile }) {
  const [touched, setTouched] = useState(false);
  const age = profile.age;
  const invalid = touched && (age === '' || parseInt(age, 10) < 10);

  return (
    <div style={styles.stepBody}>
      <div style={styles.stepHeader}>
        <span style={styles.stepIndex}>01</span>
        <div>
          <h2 style={styles.stepTitle}>Athlete Age</h2>
          <p style={styles.stepDescription}>
            Age governs physiological modifiers — deload frequency, intensity scaling, and joint loading protocols.
          </p>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <Label htmlFor="age-input" sub="Minimum age: 10. No upper limit enforced.">Age (years)</Label>
        <div style={styles.numberInputWrap}>
          <input
            id="age-input"
            type="number"
            min={10}
            value={age}
            onChange={(e) => {
              setTouched(true);
              updateProfile({ age: e.target.value });
            }}
            onBlur={() => setTouched(true)}
            placeholder="—"
            style={{ ...styles.numberInput, ...(invalid ? styles.inputError : {}) }}
            aria-describedby={invalid ? 'age-error' : undefined}
            aria-invalid={invalid}
          />
          <span style={styles.numberInputUnit}>yrs</span>
        </div>
        {invalid && <FieldError message="Enter a valid age (10 or older)." />}
      </div>

      {age && parseInt(age, 10) >= 10 && (
        <div style={styles.ageHint}>
          <AgeProtocolHint age={parseInt(age, 10)} />
        </div>
      )}
    </div>
  );
}

function AgeProtocolHint({ age }) {
  let protocol;
  if (age < 16) protocol = 'Youth Protocol — movement quality emphasis, reduced loading.';
  else if (age <= 25) protocol = 'Development Phase — peak volume tolerance, skill acquisition.';
  else if (age <= 40) protocol = 'Prime Phase — full intensity applicable, optimal adaptation rates.';
  else if (age <= 55) protocol = 'Masters I — enhanced recovery windows, joint-informed selection.';
  else protocol = 'Masters II — longevity-first, mobility mandatory, reduced intensity ceiling.';

  return (
    <div style={styles.protocolBadge}>
      <span style={styles.protocolDot} />
      <span style={styles.protocolText}>{protocol}</span>
    </div>
  );
}

function StepGoal({ profile, updateProfile }) {
  return (
    <div style={styles.stepBody}>
      <div style={styles.stepHeader}>
        <span style={styles.stepIndex}>02</span>
        <div>
          <h2 style={styles.stepTitle}>Primary Goal</h2>
          <p style={styles.stepDescription}>
            Defines rep ranges, intensity zones, rest periods, and training method selection across the macrocycle.
          </p>
        </div>
      </div>

      <div style={styles.goalGrid}>
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => updateProfile({ fitness_goal: g.id })}
            style={{
              ...styles.goalCard,
              ...(profile.fitness_goal === g.id ? styles.goalCardActive : {}),
            }}
            aria-pressed={profile.fitness_goal === g.id}
          >
            <span style={styles.goalLabel}>{g.label}</span>
            <span style={styles.goalDesc}>{g.description}</span>
            {profile.fitness_goal === g.id && (
              <span style={styles.goalCheck} aria-hidden="true">Selected</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSliders({ profile, updateProfile }) {
  const commitmentDays = profile.commitment_level <= 3 ? 2 : profile.commitment_level <= 7 ? 3 : 5;
  const lazyLabel = profile.laziness_factor <= 3
    ? 'Full Volume'
    : profile.laziness_factor <= 6
      ? 'Efficient'
      : 'Minimum Effective Dose';

  return (
    <div style={styles.stepBody}>
      <div style={styles.stepHeader}>
        <span style={styles.stepIndex}>03</span>
        <div>
          <h2 style={styles.stepTitle}>Capacity Parameters</h2>
          <p style={styles.stepDescription}>
            These sliders directly feed the algorithmic engine. Commitment maps to training frequency. Effort tolerance shapes session density.
          </p>
        </div>
      </div>

      <SliderField
        id="commitment"
        label="Commitment Level"
        sub="How consistently can you train each week?"
        min={1}
        max={10}
        value={profile.commitment_level}
        onChange={(v) => updateProfile({ commitment_level: v })}
        leftTick="Sporadic"
        rightTick="Dedicated"
      />
      <div style={styles.derivedTag}>
        <span style={styles.derivedLabel}>Derived frequency</span>
        <span style={styles.derivedValue}>{commitmentDays} days / week</span>
      </div>

      <div style={{ marginTop: 28 }}>
        <SliderField
          id="laziness"
          label="Effort Tolerance"
          sub="Preferred session density — inversely scales exercise count and volume."
          min={1}
          max={10}
          value={profile.laziness_factor}
          onChange={(v) => updateProfile({ laziness_factor: v })}
          leftTick="High Effort"
          rightTick="Minimal"
        />
        <div style={styles.derivedTag}>
          <span style={styles.derivedLabel}>Session structure</span>
          <span style={styles.derivedValue}>{lazyLabel}</span>
        </div>
      </div>
    </div>
  );
}

function StepHorizon({ profile, updateProfile }) {
  return (
    <div style={styles.stepBody}>
      <div style={styles.stepHeader}>
        <span style={styles.stepIndex}>04</span>
        <div>
          <h2 style={styles.stepTitle}>Training Horizon</h2>
          <p style={styles.stepDescription}>
            Determines macrocycle length and the number of training phases and deload blocks generated.
          </p>
        </div>
      </div>

      <div style={styles.horizonGrid}>
        {HORIZONS.map((h) => (
          <button
            key={h}
            onClick={() => updateProfile({ time_horizon: h })}
            style={{
              ...styles.horizonCard,
              ...(profile.time_horizon === h ? styles.horizonCardActive : {}),
            }}
            aria-pressed={profile.time_horizon === h}
          >
            <span style={styles.horizonNumber}>{h}</span>
            <span style={styles.horizonUnit}>weeks</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={styles.horizonNote}>
          A {profile.time_horizon}-week horizon generates approximately{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            {Math.ceil(profile.time_horizon / 5)} deload blocks
          </strong>{' '}
          and{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            {3} periodisation phases
          </strong>.
        </p>
      </div>
    </div>
  );
}

/* ─── Review Panel ─────────────────────────────────────────────────────────── */

function ReviewPanel({ profile }) {
  const days = profile.commitment_level <= 3 ? 2 : profile.commitment_level <= 7 ? 3 : 5;
  const density = profile.laziness_factor <= 3 ? 'Full Volume' : profile.laziness_factor <= 6 ? 'Efficient' : 'Minimum Effective Dose';
  const goal = GOALS.find(g => g.id === profile.fitness_goal);

  return (
    <div style={styles.reviewPanel}>
      <h4 style={{ marginBottom: 16 }}>Configuration Summary</h4>
      <table style={styles.reviewTable}>
        <tbody>
          {[
            ['Age', `${profile.age} yrs`],
            ['Goal', goal?.label || '—'],
            ['Training Days', `${days} / week`],
            ['Session Density', density],
            ['Time Horizon', `${profile.time_horizon} weeks`],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={styles.reviewKey}>{k}</td>
              <td style={styles.reviewVal}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */

const STEPS = ['age', 'goal', 'sliders', 'horizon'];

export default function OnboardingForm() {
  const { state, updateProfile, setGenerating, setPlan, setError, setStep } = useApp();
  const { profile } = state;
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  const canAdvance = () => {
    if (currentStep === 0) return profile.age !== '' && parseInt(profile.age, 10) >= 10;
    if (currentStep === 1) return profile.fitness_goal !== '';
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleGenerate = async () => {
    setSubmitError(null);
    setGenerating(true);
    setStep(1);

    try {
      const brief = deriveTrainingBrief(profile);
      const prompt = buildGroqPrompt(brief);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, brief }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const plan = await res.json();
      setPlan(plan);
    } catch (err) {
      const message = err.message || 'Unknown error during generation.';
      setError(message);
      setSubmitError(message);
      setStep(0);
      setGenerating(false);
    }
  };

  const isLast = currentStep === STEPS.length - 1;
  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  return (
    <div style={styles.container} className="fade-in">
      {/* Progress bar */}
      <div style={styles.progressTrack} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemax={STEPS.length}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Step render */}
      <div key={currentStep} style={{ animation: 'fadeIn 0.3s ease both' }}>
        {currentStep === 0 && <StepAge profile={profile} updateProfile={updateProfile} />}
        {currentStep === 1 && <StepGoal profile={profile} updateProfile={updateProfile} />}
        {currentStep === 2 && <StepSliders profile={profile} updateProfile={updateProfile} />}
        {currentStep === 3 && (
          <>
            <StepHorizon profile={profile} updateProfile={updateProfile} />
            <ReviewPanel profile={profile} />
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={styles.navRow}>
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          style={{ ...styles.btnSecondary, opacity: currentStep === 0 ? 0.3 : 1 }}
        >
          Back
        </button>

        <span style={styles.stepCounter}>
          {currentStep + 1} of {STEPS.length}
        </span>

        {isLast ? (
          <button
            onClick={handleGenerate}
            style={styles.btnPrimary}
            disabled={!canAdvance()}
          >
            Generate Plan
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{ ...styles.btnPrimary, opacity: canAdvance() ? 1 : 0.4 }}
          >
            Continue
          </button>
        )}
      </div>

      {submitError && (
        <div style={styles.errorBox} role="alert">
          <strong>Error:</strong> {submitError}
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */

const styles = {
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '40px 24px 60px',
  },
  progressTrack: {
    height: 2,
    background: 'var(--color-border)',
    borderRadius: 1,
    marginBottom: 48,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 1,
    transition: 'width 0.4s ease',
  },
  stepBody: {
    marginBottom: 40,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 32,
  },
  stepIndex: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.8rem',
    fontWeight: 300,
    color: 'var(--color-text-dim)',
    lineHeight: 1,
    flexShrink: 0,
    paddingTop: 2,
    letterSpacing: '0.04em',
  },
  stepTitle: {
    fontSize: '1.35rem',
    marginBottom: 6,
    fontWeight: 500,
  },
  stepDescription: {
    fontSize: '0.82rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.65,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 4,
  },
  labelSub: {
    fontSize: '0.74rem',
    color: 'var(--color-text-dim)',
  },
  numberInputWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: 8,
  },
  numberInput: {
    width: 120,
    padding: '10px 40px 10px 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '1.35rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 400,
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    appearance: 'textfield',
    MozAppearance: 'textfield',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
  },
  numberInputUnit: {
    position: 'absolute',
    right: 12,
    fontSize: '0.74rem',
    color: 'var(--color-text-dim)',
    pointerEvents: 'none',
  },
  fieldError: {
    marginTop: 6,
    fontSize: '0.74rem',
    color: 'var(--color-danger-text)',
  },
  ageHint: {
    marginTop: 16,
  },
  protocolBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'var(--color-accent-glow)',
    border: '1px solid var(--color-accent-dim)',
    borderRadius: 'var(--radius-md)',
  },
  protocolDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--color-accent)',
    flexShrink: 0,
  },
  protocolText: {
    fontSize: '0.78rem',
    color: 'var(--color-accent)',
    lineHeight: 1.4,
  },
  goalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
  },
  goalCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    padding: '14px 16px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textAlign: 'left',
    position: 'relative',
  },
  goalCardActive: {
    borderColor: 'var(--color-accent)',
    background: 'var(--color-accent-glow)',
  },
  goalLabel: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  goalDesc: {
    fontSize: '0.76rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  },
  goalCheck: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontSize: '0.65rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-accent)',
    fontWeight: 600,
  },
  sliderWrap: {
    marginTop: 10,
  },
  slider: {
    width: '100%',
    appearance: 'none',
    WebkitAppearance: 'none',
    height: 2,
    background: 'var(--color-border)',
    borderRadius: 1,
    outline: 'none',
    cursor: 'pointer',
    accentColor: 'var(--color-accent)',
  },
  sliderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sliderTick: {
    fontSize: '0.68rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sliderValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.1rem',
    color: 'var(--color-accent)',
    fontWeight: 500,
  },
  sliderUnit: {
    fontSize: '0.7rem',
    color: 'var(--color-text-dim)',
  },
  derivedTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    padding: '7px 12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
  },
  derivedLabel: {
    fontSize: '0.72rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  derivedValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--color-accent)',
    marginLeft: 'auto',
  },
  horizonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginTop: 8,
  },
  horizonCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 8px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    gap: 2,
  },
  horizonCardActive: {
    borderColor: 'var(--color-accent)',
    background: 'var(--color-accent-glow)',
  },
  horizonNumber: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.6rem',
    fontWeight: 300,
    color: 'var(--color-text-primary)',
    lineHeight: 1,
  },
  horizonUnit: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  horizonNote: {
    fontSize: '0.78rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
  },
  reviewPanel: {
    padding: '18px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 8,
  },
  reviewTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  reviewKey: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    padding: '5px 0',
    width: '40%',
    verticalAlign: 'top',
  },
  reviewVal: {
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
    padding: '5px 0',
    fontFamily: 'var(--font-mono)',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
  },
  stepCounter: {
    flex: 1,
    textAlign: 'center',
    fontSize: '0.72rem',
    color: 'var(--color-text-dim)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.08em',
  },
  btnPrimary: {
    padding: '10px 22px',
    background: 'var(--color-accent)',
    color: '#0B0C10',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
  },
  btnSecondary: {
    padding: '10px 22px',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
  },
  errorBox: {
    marginTop: 20,
    padding: '12px 16px',
    background: 'rgba(122, 62, 62, 0.15)',
    border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8rem',
    color: 'var(--color-danger-text)',
    lineHeight: 1.5,
  },
};
