import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { GOAL_META } from '../utils/tempoEngine.js';

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function PhaseTag({ phase }) {
  const colorMap = {
    Accumulation: '#3A6B8A',
    Intensification: '#5A7A4A',
    Realisation: '#7A6A3A',
    Deload: '#4A4A5A',
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      fontSize: '0.65rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${colorMap[phase] || 'var(--color-border)'}`,
      color: colorMap[phase] || 'var(--color-text-secondary)',
      background: `${colorMap[phase]}18` || 'transparent',
    }}>
      {phase}
    </span>
  );
}

function StatCell({ label, value, mono }) {
  return (
    <div style={styles.statCell}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Macrocycle Calendar ─────────────────────────────────────────────────────── */

function MacrocycleCalendar({ weeks }) {
  const [hoveredWeek, setHoveredWeek] = useState(null);

  const phaseColors = {
    Accumulation: '#3A6B8A',
    Intensification: '#5A7A4A',
    Realisation: '#7A6A3A',
    Deload: '#4A4A5A',
  };

  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Macrocycle</h3>
        <span style={styles.cardMeta}>{weeks.length} weeks</span>
      </div>

      <div style={styles.calendarGrid}>
        {weeks.map((w) => {
          const color = phaseColors[w.phase] || '#444';
          const isHovered = hoveredWeek === w.week;
          return (
            <div
              key={w.week}
              style={{
                ...styles.weekCell,
                background: isHovered ? `${color}44` : `${color}22`,
                borderColor: isHovered ? color : `${color}66`,
              }}
              onMouseEnter={() => setHoveredWeek(w.week)}
              onMouseLeave={() => setHoveredWeek(null)}
              title={`Week ${w.week} — ${w.phase} | Vol: ${Math.round(w.volume_modifier * 100)}% | Int: ${Math.round(w.intensity_modifier * 100)}%`}
            >
              <span style={styles.weekNum}>{w.week}</span>
              {w.is_deload && <span style={styles.deloadMark} title="Deload week" />}
            </div>
          );
        })}
      </div>

      {hoveredWeek && (() => {
        const w = weeks.find(x => x.week === hoveredWeek);
        if (!w) return null;
        return (
          <div style={styles.weekTooltip}>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Week {w.week}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Block {w.block}</span>
            <PhaseTag phase={w.phase} />
            <span style={styles.tooltipStat}>Vol <strong>{Math.round(w.volume_modifier * 100)}%</strong></span>
            <span style={styles.tooltipStat}>Int <strong>{Math.round(w.intensity_modifier * 100)}%</strong></span>
          </div>
        );
      })()}

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(phaseColors).map(([phase, color]) => (
          <div key={phase} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: color }} />
            <span style={styles.legendLabel}>{phase}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Training Day Card ───────────────────────────────────────────────────────── */

function TrainingDayCard({ day, index }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div style={styles.dayCard}>
      <button
        style={styles.dayHeader}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div style={styles.dayHeaderLeft}>
          <span style={styles.dayIndex}>Day {index + 1}</span>
          <div>
            <span style={styles.dayName}>{day.name}</span>
            {day.focus && <span style={styles.dayFocus}>{day.focus}</span>}
          </div>
        </div>
        <div style={styles.dayHeaderRight}>
          {day.exercises && (
            <span style={styles.exerciseCount}>{day.exercises.length} exercises</span>
          )}
          <span style={{ ...styles.chevron, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
        </div>
      </button>

      {expanded && day.exercises && (
        <div style={styles.exerciseList}>
          <div style={styles.exerciseTableHeader}>
            <span style={styles.exerciseColName}>Exercise</span>
            <span style={styles.exerciseColStat}>Sets</span>
            <span style={styles.exerciseColStat}>Reps</span>
            <span style={styles.exerciseColStat}>Rest</span>
          </div>
          {day.exercises.map((ex, i) => (
            <div key={i} style={{ ...styles.exerciseRow, borderTop: i === 0 ? 'none' : '1px solid var(--color-border-subtle)' }}>
              <div style={styles.exerciseColName}>
                <span style={styles.exerciseName}>{ex.name}</span>
                {ex.technique_cue && (
                  <span style={styles.techniqueCue}>{ex.technique_cue}</span>
                )}
              </div>
              <span style={styles.exerciseStatVal}>{ex.sets}</span>
              <span style={styles.exerciseStatVal}>{ex.reps}</span>
              <span style={styles.exerciseStatVal}>{ex.rest_sec ? `${ex.rest_sec}s` : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Phase Progressions ──────────────────────────────────────────────────────── */

function PhaseProgressions({ progressions }) {
  if (!progressions) return null;
  const phases = [
    { key: 'accumulation', label: 'Accumulation' },
    { key: 'intensification', label: 'Intensification' },
    { key: 'realisation', label: 'Realisation' },
  ];

  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Phase Progressions</h3>
      </div>
      <div style={styles.progressionList}>
        {phases.map(({ key, label }) => progressions[key] && (
          <div key={key} style={styles.progressionItem}>
            <PhaseTag phase={label} />
            <p style={styles.progressionText}>{progressions[key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Coaching Notes ─────────────────────────────────────────────────────────── */

function CoachingNotes({ notes, deload }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Coaching Notes</h3>
      </div>
      <div style={styles.notesList}>
        {notes?.map((note, i) => (
          <div key={i} style={styles.noteItem}>
            <span style={styles.noteIndex}>{String(i + 1).padStart(2, '0')}</span>
            <p style={styles.noteText}>{note}</p>
          </div>
        ))}
      </div>
      {deload && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />
          <h4 style={{ marginBottom: 10 }}>Deload Protocol</h4>
          <p style={styles.deloadText}>{deload}</p>
        </>
      )}
    </section>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { state } = useApp();
  const { plan } = state;

  if (!plan) return null;

  const { brief, ai } = plan;
  const goalMeta = GOAL_META[brief.profile.fitness_goal] || GOAL_META.general;

  return (
    <div style={styles.container} className="fade-in">

      {/* Hero stats strip */}
      <section style={styles.statsStrip}>
        <StatCell label="Goal" value={goalMeta.label} />
        <div style={styles.statDivider} />
        <StatCell label="Frequency" value={`${brief.days_per_week} days / week`} mono />
        <div style={styles.statDivider} />
        <StatCell label="Duration" value={`${brief.profile.time_horizon} weeks`} mono />
        <div style={styles.statDivider} />
        <StatCell label="Rep Range" value={goalMeta.rep_range} mono />
        <div style={styles.statDivider} />
        <StatCell label="Intensity" value={goalMeta.intensity} mono />
        <div style={styles.statDivider} />
        <StatCell label="Session" value={`${brief.structure.session_minutes} min`} mono />
      </section>

      {/* Physiology note */}
      <div style={styles.physiologyBanner}>
        <span style={styles.physiologyDot} />
        <span style={styles.physiologyText}>{brief.physiology.note}</span>
      </div>

      {/* Split identity */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>{brief.split.label}</h3>
          <span style={styles.cardMeta}>{brief.structure.efficiency_label}</span>
        </div>
        <p style={styles.splitDescription}>{brief.split.description}</p>
        <div style={styles.splitDayList}>
          {brief.split.days.map((d, i) => (
            <div key={i} style={styles.splitDayItem}>
              <span style={styles.splitDayNum}>D{i + 1}</span>
              <span style={styles.splitDayName}>{d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Macrocycle calendar */}
      <MacrocycleCalendar weeks={brief.macrocycle} />

      {/* Training days */}
      {ai?.training_days && ai.training_days.length > 0 && (
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Weekly Programme</h3>
            <span style={styles.cardMeta}>{ai.training_days.length} training days</span>
          </div>
          <div style={styles.dayList}>
            {ai.training_days.map((day, i) => (
              <TrainingDayCard key={i} day={day} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Phase progressions */}
      {ai?.phase_progressions && (
        <PhaseProgressions progressions={ai.phase_progressions} />
      )}

      {/* Coaching notes */}
      {(ai?.coaching_notes || ai?.deload_protocol) && (
        <CoachingNotes notes={ai.coaching_notes} deload={ai.deload_protocol} />
      )}

      {/* Generation timestamp */}
      <p style={styles.generatedAt}>
        Plan generated {new Date(plan.generated_at).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </p>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 24px 80px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  statsStrip: {
    display: 'flex',
    alignItems: 'stretch',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  statCell: {
    flex: '1 1 100px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '16px 18px',
  },
  statLabel: {
    fontSize: '0.66rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    fontWeight: 500,
  },
  statValue: {
    fontSize: '0.88rem',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
  },
  statDivider: {
    width: 1,
    background: 'var(--color-border)',
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  physiologyBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 16px',
    background: 'var(--color-accent-glow)',
    border: '1px solid var(--color-accent-dim)',
    borderRadius: 'var(--radius-md)',
  },
  physiologyDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--color-accent)',
    flexShrink: 0,
    marginTop: 5,
  },
  physiologyText: {
    fontSize: '0.8rem',
    color: 'var(--color-accent)',
    lineHeight: 1.6,
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: 'var(--color-text-primary)',
  },
  cardMeta: {
    fontSize: '0.7rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-mono)',
  },
  splitDescription: {
    padding: '14px 20px',
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.65,
    borderBottom: '1px solid var(--color-border)',
  },
  splitDayList: {
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  splitDayItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  splitDayNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-accent)',
    fontWeight: 500,
    minWidth: 22,
  },
  splitDayName: {
    fontSize: '0.82rem',
    color: 'var(--color-text-primary)',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
    gap: 4,
    padding: '16px 20px',
  },
  weekCell: {
    position: 'relative',
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    cursor: 'default',
    transition: 'all var(--transition-fast)',
  },
  weekNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
  },
  deloadMark: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--color-text-dim)',
  },
  weekTooltip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    padding: '8px 20px',
    borderTop: '1px solid var(--color-border)',
    fontSize: '0.75rem',
  },
  tooltipStat: {
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
  },
  legend: {
    display: 'flex',
    gap: 16,
    padding: '12px 20px',
    borderTop: '1px solid var(--color-border)',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  dayList: {
    display: 'flex',
    flexDirection: 'column',
  },
  dayCard: {
    borderBottom: '1px solid var(--color-border)',
  },
  dayHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background var(--transition-fast)',
  },
  dayHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  dayHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dayIndex: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--color-accent)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    minWidth: 38,
  },
  dayName: {
    display: 'block',
    fontSize: '0.88rem',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  dayFocus: {
    display: 'block',
    fontSize: '0.72rem',
    color: 'var(--color-text-secondary)',
    marginTop: 1,
  },
  exerciseCount: {
    fontSize: '0.7rem',
    color: 'var(--color-text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  chevron: {
    fontSize: '1.1rem',
    color: 'var(--color-text-dim)',
    transition: 'transform var(--transition-fast)',
    display: 'inline-block',
  },
  exerciseList: {
    borderTop: '1px solid var(--color-border)',
  },
  exerciseTableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 60px 80px 60px',
    padding: '7px 20px',
    background: 'var(--color-canvas)',
  },
  exerciseColName: {
    fontSize: '0.65rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  exerciseColStat: {
    fontSize: '0.65rem',
    color: 'var(--color-text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    textAlign: 'center',
  },
  exerciseRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 60px 80px 60px',
    padding: '10px 20px',
    alignItems: 'start',
  },
  exerciseName: {
    display: 'block',
    fontSize: '0.83rem',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
    marginBottom: 3,
  },
  techniqueCue: {
    display: 'block',
    fontSize: '0.72rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  exerciseStatVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--color-accent)',
    textAlign: 'center',
    paddingTop: 2,
  },
  progressionList: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  progressionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  progressionText: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.65,
    flex: 1,
  },
  notesList: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  noteItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  noteIndex: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-dim)',
    fontWeight: 500,
    flexShrink: 0,
    paddingTop: 2,
  },
  noteText: {
    fontSize: '0.82rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.65,
    flex: 1,
  },
  deloadText: {
    fontSize: '0.82rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.65,
    padding: '0 20px 20px',
  },
  generatedAt: {
    textAlign: 'center',
    fontSize: '0.68rem',
    color: 'var(--color-text-dim)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.05em',
    marginTop: 12,
  },
};
