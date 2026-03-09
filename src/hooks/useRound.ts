import { useState, useEffect, useCallback } from 'react';
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  withTimeout,
} from '../lib/firebase';
import type { Round, HoleScore } from '../types';
import { buildInitialHoles, roundToDoc, getDeviceId } from '../lib/utils';

// ─── Single round subscription ────────────────────────────────────────────────

export function useRound(roundId: string | undefined) {
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roundId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const roundRef = doc(db, 'rounds', roundId);
    const unsub = onSnapshot(
      roundRef,
      (snap) => {
        if (snap.exists()) {
          setRound(snap.data() as Round);
        } else {
          setRound(null);
          setError('Round not found.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Round listener error:', err);
        setError('Connection error. Retrying…');
        setLoading(false);
      },
    );

    return () => unsub();
  }, [roundId]);

  return { round, loading, error };
}

// ─── Round history (all completed + active rounds) ───────────────────────────

export function useRoundHistory() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rounds'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRounds(snap.docs.map((d) => d.data() as Round));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { rounds, loading };
}

// ─── Round CRUD actions ───────────────────────────────────────────────────────

export function useRoundActions() {
  const deviceId = getDeviceId();

  /** Create a new round document. Returns the roundId. */
  const createRound = useCallback(
    async (round: Round): Promise<string> => {
      const roundRef = doc(db, 'rounds', round.id);
      await withTimeout(setDoc(roundRef, roundToDoc(round)));
      return round.id;
    },
    [],
  );

  /** Update top-level fields on a round */
  const updateRound = useCallback(async (roundId: string, data: Partial<Round>) => {
    const roundRef = doc(db, 'rounds', roundId);
    await withTimeout(updateDoc(roundRef, data as Record<string, unknown>));
  }, []);

  /** Join a round as a scorer for a specific team */
  const joinRound = useCallback(
    async (roundId: string, teamId: string) => {
      const roundRef = doc(db, 'rounds', roundId);
      await withTimeout(updateDoc(roundRef, {
        [`scorers.${teamId}`]: deviceId,
        status: 'lobby',
      }));
      // Store team assignment locally
      const key = 'golf_team_assignments';
      const assignments = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>;
      assignments[roundId] = teamId;
      localStorage.setItem(key, JSON.stringify(assignments));
    },
    [deviceId],
  );

  /** Update a single hole's score for one team */
  const updateHoleScore = useCallback(
    async (roundId: string, holeIndex: number, teamId: string, score: Partial<HoleScore>) => {
      const roundRef = doc(db, 'rounds', roundId);
      const updates: Record<string, unknown> = {};
      if (score.score !== undefined) {
        updates[`holes.${holeIndex}.scores.${teamId}.score`] = score.score;
      }
      if (score.shotguns !== undefined) {
        updates[`holes.${holeIndex}.scores.${teamId}.shotguns`] = score.shotguns;
      }
      await withTimeout(updateDoc(roundRef, updates));
    },
    [],
  );

  /** Update all pars at once (called from course setup) */
  const updatePars = useCallback(async (roundId: string, pars: number[]) => {
    const roundRef = doc(db, 'rounds', roundId);
    // Rebuild holes array with new pars, preserving existing scores
    const snap = await withTimeout(getDoc(roundRef));
    if (!snap.exists()) return;
    const existing = snap.data() as Round;
    const holes = buildInitialHoles(pars).map((newHole, i) => ({
      ...newHole,
      scores: existing.holes[i]?.scores ?? newHole.scores,
    }));
    await withTimeout(updateDoc(roundRef, { holes }));
  }, []);

  /** Mark round as active (start play) */
  const startRound = useCallback(async (roundId: string) => {
    await withTimeout(updateDoc(doc(db, 'rounds', roundId), { status: 'active' }));
  }, []);

  /** Mark round as completed */
  const completeRound = useCallback(async (roundId: string) => {
    await withTimeout(updateDoc(doc(db, 'rounds', roundId), { status: 'completed' }));
  }, []);

  /** Delete a round */
  const deleteRound = useCallback(async (roundId: string) => {
    await withTimeout(deleteDoc(doc(db, 'rounds', roundId)));
  }, []);

  return {
    createRound,
    updateRound,
    joinRound,
    updateHoleScore,
    updatePars,
    startRound,
    completeRound,
    deleteRound,
    deviceId,
  };
}

/** Get this device's team assignment for a round (from localStorage) */
export function getLocalTeamId(roundId: string): string | null {
  try {
    const key = 'golf_team_assignments';
    const assignments = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>;
    return assignments[roundId] ?? null;
  } catch {
    return null;
  }
}
