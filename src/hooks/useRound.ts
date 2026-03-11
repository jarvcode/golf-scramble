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
import type { Round, Hole, HoleScore } from '../types';
import { buildInitialHoles, roundToDoc, getDeviceId } from '../lib/utils';

/**
 * Firestore converts arrays to maps when you update individual elements via
 * dot-notation field paths (e.g. holes.0.scores.team0.shotguns). This normalizes
 * the data back to an array every time we read from Firestore.
 */
function normalizeRound(data: Record<string, unknown>): Round {
  const round = data as unknown as Round;
  if (round.holes && !Array.isArray(round.holes)) {
    round.holes = Object.values(round.holes as Record<string, Hole>)
      .sort((a, b) => a.number - b.number);
  }
  return round;
}

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
          setRound(normalizeRound(snap.data()));
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
      setRounds(snap.docs.map((d) => normalizeRound(d.data())));
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

  /**
   * Update a single hole's score for one team.
   * Accepts the full current holes array to avoid Firestore's array→map
   * conversion that happens with dot-notation field path updates.
   */
  const updateHoleScore = useCallback(
    async (
      roundId: string,
      currentHoles: Hole[],
      holeIndex: number,
      teamId: string,
      score: Partial<HoleScore>,
    ) => {
      const updatedHoles = currentHoles.map((h, i) => {
        if (i !== holeIndex) return h;
        return {
          ...h,
          scores: {
            ...h.scores,
            [teamId]: { ...h.scores[teamId], ...score },
          },
        };
      });
      const roundRef = doc(db, 'rounds', roundId);
      await withTimeout(updateDoc(roundRef, { holes: updatedHoles }));
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
