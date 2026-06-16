import React, { createContext, useContext, useReducer, useCallback } from 'react';

/* ─── Initial State ─────────────────────────────────────────────────────────── */
const INITIAL_PROFILE = {
  age: '',
  fitness_goal: '',       // 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'general'
  commitment_level: 5,    // 1–10
  laziness_factor: 3,     // 1–10 (low = motivated, high = minimal sessions preferred)
  time_horizon: 12,       // weeks
};

const INITIAL_STATE = {
  step: 0,                // 0 = onboarding, 1 = generating, 2 = dashboard
  profile: INITIAL_PROFILE,
  plan: null,             // Generated plan object
  error: null,
  generating: false,
};

/* ─── Reducer ───────────────────────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'SET_STEP':
      return { ...state, step: action.payload };

    case 'SET_GENERATING':
      return { ...state, generating: action.payload, error: null };

    case 'SET_PLAN':
      return { ...state, plan: action.payload, step: 2, generating: false };

    case 'SET_ERROR':
      return { ...state, error: action.payload, generating: false };

    case 'RESET':
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}

/* ─── Context ───────────────────────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const updateProfile = useCallback((fields) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: fields });
  }, []);

  const setStep = useCallback((step) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setPlan = useCallback((plan) => {
    dispatch({ type: 'SET_PLAN', payload: plan });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setGenerating = useCallback((val) => {
    dispatch({ type: 'SET_GENERATING', payload: val });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      updateProfile,
      setStep,
      setPlan,
      setError,
      setGenerating,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
