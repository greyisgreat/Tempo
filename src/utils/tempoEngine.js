/**
 * tempoEngine.js
 * Pure deterministic algorithm layer for Tempo.
 * Converts raw profile sliders into structured training parameters
 * that are passed both to the UI directly and to the Groq API prompt.
 */

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const GOAL_META = {
  strength: {
    label: 'Strength',
    rep_range: '3–6',
    intensity: '78–92% 1RM',
    rest_sec: 180,
    primary_methods: ['Progressive Overload', 'Submaximal Heavy Sets', 'Wave Loading'],
    key_lifts: ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row'],
  },
  hypertrophy: {
    label: 'Hypertrophy',
    rep_range: '8–15',
    intensity: '60–75% 1RM',
    rest_sec: 90,
    primary_methods: ['Volume Accumulation', 'Mechanical Tension', 'Metabolic Stress'],
    key_lifts: ['Squat', 'Romanian Deadlift', 'Incline Press', 'Cable Row', 'Lateral Raise'],
  },
  fat_loss: {
    label: 'Fat Loss',
    rep_range: '12–20',
    intensity: '50–65% 1RM',
    rest_sec: 45,
    primary_methods: ['Circuit Training', 'Supersets', 'HIIT Finishers'],
    key_lifts: ['Goblet Squat', 'Hip Hinge', 'Push-Up Variation', 'Pull-Up', 'Farmer Carry'],
  },
  endurance: {
    label: 'Endurance',
    rep_range: '15–25',
    intensity: '40–60% 1RM',
    rest_sec: 30,
    primary_methods: ['Zone 2 Cardio', 'Tempo Runs', 'Threshold Intervals'],
    key_lifts: ['Bodyweight Squat', 'Lunge', 'Step-Up', 'Core Circuit', 'Plank Progressions'],
  },
  general: {
    label: 'General Fitness',
    rep_range: '8–15',
    intensity: '55–70% 1RM',
    rest_sec: 60,
    primary_methods: ['Full-Body Circuits', 'Functional Movements', 'Mobility Work'],
    key_lifts: ['Squat', 'Hinge', 'Push', 'Pull', 'Carry'],
  },
};

const SPLIT_TEMPLATES = {
  2: {
    label: '2-Day Full Body',
    days: ['Full Body A', 'Full Body B'],
    description: 'Two high-efficiency full-body sessions. Maximum recovery windows between exposures.',
  },
  3: {
    label: '3-Day Push / Pull / Legs',
    days: ['Push (Chest, Shoulders, Triceps)', 'Pull (Back, Biceps)', 'Legs (Quads, Hamstrings, Glutes)'],
    description: 'Classic PPL — each muscle group trained once per week with complete isolation.',
  },
  5: {
    label: '5-Day Upper / Lower / PPL Hybrid',
    days: [
      'Upper Power',
      'Lower Power',
      'Push Hypertrophy',
      'Pull Hypertrophy',
      'Legs & Core',
    ],
    description: 'High-frequency hybrid split. Each major pattern receives two stimuli per week.',
  },
};

/* ─── Core Mapping Functions ─────────────────────────────────────────────────── */

/**
 * Map commitment slider (1–10) to training days per week.
 * 1–3  → 2 days (maintenance threshold)
 * 4–7  → 3 days (standard progressive)
 * 8–10 → 5 days (high-frequency)
 */
export function mapCommitmentToDays(commitment) {
  const c = Math.max(1, Math.min(10, commitment));
  if (c <= 3) return 2;
  if (c <= 7) return 3;
  return 5;
}

/**
 * Map laziness slider (1–10) to structural adjustments.
 * High laziness → fewer exercises per session, more compound-focused,
 *                 shorter workouts, higher rest relative to volume.
 */
export function mapLazinessToStructure(laziness) {
  const l = Math.max(1, Math.min(10, laziness));
  return {
    exercises_per_session: l <= 3 ? 7 : l <= 6 ? 5 : 3,
    compound_ratio: l <= 3 ? 0.5 : l <= 6 ? 0.7 : 0.9,
    session_minutes: l <= 3 ? 75 : l <= 6 ? 55 : 35,
    warmup_minutes: l <= 3 ? 10 : l <= 6 ? 7 : 5,
    efficiency_label: l <= 3 ? 'Full Volume' : l <= 6 ? 'Efficient' : 'Minimum Effective Dose',
  };
}

/**
 * Map age to physiological guidance modifiers.
 */
export function mapAgeToPhysiology(age) {
  const a = parseInt(age, 10);
  if (a < 16) return {
    note: 'Youth athlete protocol — emphasise movement quality and bodyweight progressions over loaded intensity.',
    deload_frequency: 4,
    intensity_modifier: 0.75,
  };
  if (a <= 25) return {
    note: 'Peak anabolic window. Prioritise skill acquisition and volume tolerance building.',
    deload_frequency: 6,
    intensity_modifier: 1.0,
  };
  if (a <= 40) return {
    note: 'Prime training years. Full program intensity applicable.',
    deload_frequency: 5,
    intensity_modifier: 0.95,
  };
  if (a <= 55) return {
    note: 'Experienced athlete protocol — enhanced recovery emphasis, joint-friendly exercise selection.',
    deload_frequency: 4,
    intensity_modifier: 0.88,
  };
  return {
    note: 'Masters athlete protocol — longevity-first training, mobility integration mandatory.',
    deload_frequency: 3,
    intensity_modifier: 0.80,
  };
}

/**
 * Build a week-by-week macrocycle phase structure.
 */
export function buildMacrocycle(timeHorizon, deloadFrequency) {
  const weeks = [];
  for (let w = 1; w <= timeHorizon; w++) {
    const isDeload = w % deloadFrequency === 0;
    const phaseBlock = Math.ceil(w / (deloadFrequency));
    const weekInBlock = ((w - 1) % deloadFrequency) + 1;

    let phase;
    const blockRatio = weekInBlock / (deloadFrequency - 1);
    if (isDeload) {
      phase = 'Deload';
    } else if (blockRatio <= 0.4) {
      phase = 'Accumulation';
    } else if (blockRatio <= 0.75) {
      phase = 'Intensification';
    } else {
      phase = 'Realisation';
    }

    weeks.push({
      week: w,
      phase,
      block: phaseBlock,
      is_deload: isDeload,
      volume_modifier: isDeload ? 0.5 : blockRatio <= 0.4 ? 0.8 : blockRatio <= 0.75 ? 1.0 : 1.1,
      intensity_modifier: isDeload ? 0.65 : blockRatio <= 0.4 ? 0.75 : blockRatio <= 0.75 ? 0.85 : 0.92,
    });
  }
  return weeks;
}

/**
 * Master function: derive the full structural training brief from profile inputs.
 * This is the data package passed to Groq for enrichment.
 */
export function deriveTrainingBrief(profile) {
  const { age, fitness_goal, commitment_level, laziness_factor, time_horizon } = profile;

  const days_per_week = mapCommitmentToDays(commitment_level);
  const structure = mapLazinessToStructure(laziness_factor);
  const physiology = mapAgeToPhysiology(age);
  const goal_meta = GOAL_META[fitness_goal] || GOAL_META.general;
  const split = SPLIT_TEMPLATES[days_per_week];
  const macrocycle = buildMacrocycle(time_horizon, physiology.deload_frequency);

  const phases = [...new Set(macrocycle.map(w => w.phase))];
  const phase_summary = phases.map(phase => {
    const weeks_in_phase = macrocycle.filter(w => w.phase === phase);
    return {
      phase,
      week_count: weeks_in_phase.length,
      avg_volume_modifier: +(weeks_in_phase.reduce((s, w) => s + w.volume_modifier, 0) / weeks_in_phase.length).toFixed(2),
    };
  });

  return {
    profile: {
      age: parseInt(age, 10),
      fitness_goal,
      commitment_level,
      laziness_factor,
      time_horizon,
    },
    days_per_week,
    split,
    structure,
    physiology,
    goal_meta,
    macrocycle,
    phase_summary,
  };
}

/**
 * Build the prompt string sent to Groq for AI enrichment.
 */
export function buildGroqPrompt(brief) {
  return `You are an elite strength and conditioning coach. Based on the following training brief, generate a detailed, personalised workout plan.

TRAINING BRIEF:
- Athlete Age: ${brief.profile.age}
- Primary Goal: ${brief.goal_meta.label}
- Training Days Per Week: ${brief.days_per_week} (${brief.split.label})
- Session Duration: ${brief.structure.session_minutes} minutes
- Exercises Per Session: ${brief.structure.exercises_per_session}
- Compound Movement Ratio: ${Math.round(brief.structure.compound_ratio * 100)}%
- Volume Approach: ${brief.structure.efficiency_label}
- Rep Range: ${brief.goal_meta.rep_range}
- Target Intensity: ${brief.goal_meta.intensity}
- Rest Periods: ${brief.goal_meta.rest_sec}s between working sets
- Training Methods: ${brief.goal_meta.primary_methods.join(', ')}
- Physiological Note: ${brief.physiology.note}
- Macrocycle Duration: ${brief.profile.time_horizon} weeks
- Deload Frequency: Every ${brief.physiology.deload_frequency} weeks

SPLIT STRUCTURE: ${brief.split.days.map((d, i) => `\nDay ${i + 1}: ${d}`).join('')}

PHASE BREAKDOWN: ${brief.phase_summary.map(p => `\n- ${p.phase}: ${p.week_count} weeks`).join('')}

Generate:
1. A complete exercise list for EACH training day with sets, reps, and rest periods. Use specific exercise names (not generic placeholders).
2. One technique cue per exercise (precise, coach-quality).
3. A brief weekly progression note for each of the 3 main phases (Accumulation, Intensification, Realisation).
4. A Deload week protocol specific to this athlete.
5. 3 personalised coaching notes based on the athlete's age, goal, and efficiency preference.

Format your response as a structured JSON object with these keys:
{
  "training_days": [
    {
      "name": "Day name",
      "focus": "Muscle groups",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": number,
          "reps": "rep scheme",
          "rest_sec": number,
          "technique_cue": "precise cue"
        }
      ]
    }
  ],
  "phase_progressions": {
    "accumulation": "progression note",
    "intensification": "progression note",
    "realisation": "progression note"
  },
  "deload_protocol": "deload instructions",
  "coaching_notes": ["note1", "note2", "note3"]
}

Return ONLY the JSON object. No preamble, no markdown fences.`;
}

export { GOAL_META, SPLIT_TEMPLATES };
