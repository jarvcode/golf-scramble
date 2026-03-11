import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useRound, useRoundActions, getLocalTeamId } from '../hooks/useRound';
import { getTeamColor, computeLeaderboard, formatToPar, totalPar } from '../lib/utils';
import type { Round as RoundType } from '../types';

type Tab = 'score' | 'leaderboard';

export function Round() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { round, loading, error } = useRound(roundId);
  const { updateHoleScore, completeRound } = useRoundActions();

  const [currentHole, setCurrentHole] = useState(1); // 1-indexed
  const [tab, setTab] = useState<Tab>('score');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myTeamId = roundId ? getLocalTeamId(roundId) : null;

  // On load, jump to the first hole with an incomplete score for my team
  useEffect(() => {
    if (!round || !myTeamId) return;
    const firstIncomplete = round.holes.findIndex(
      (h) => h.scores[myTeamId]?.score == null,
    );
    if (firstIncomplete !== -1) setCurrentHole(firstIncomplete + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!round]);

  const holeIndex = currentHole - 1;
  const hole = round?.holes[holeIndex];

  // Debounced score save — pass full holes array to avoid Firestore array→map bug
  const saveScore = useCallback(
    (holeIdx: number, teamId: string, field: 'score' | 'shotguns', value: number | null) => {
      if (!roundId || !round) return;
      const currentHoles = round.holes;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        setSaving(true);
        try {
          await updateHoleScore(roundId, currentHoles, holeIdx, teamId, { [field]: value });
        } catch (e) {
          console.error('Save error:', e);
        } finally {
          setSaving(false);
        }
      }, 400);
    },
    [roundId, round, updateHoleScore],
  );

  const handleScoreChange = (teamId: string, rawValue: string) => {
    const n = parseInt(rawValue, 10);
    const value = isNaN(n) ? null : Math.max(1, Math.min(20, n));
    saveScore(holeIndex, teamId, 'score', value);
  };

  const handleShotgunChange = (teamId: string, value: 0 | 1 | 2) => {
    saveScore(holeIndex, teamId, 'shotguns', value);
  };

  const handleComplete = async () => {
    if (!roundId || !window.confirm('Mark this round as complete?')) return;
    setCompleting(true);
    try {
      await completeRound(roundId);
      navigate(`/round/${roundId}/summary`);
    } catch (e) {
      console.error(e);
      alert('Failed to complete round.');
    } finally {
      setCompleting(false);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-fairway-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error || !round) {
    return (
      <PageLayout back="/" title="Error">
        <p className="text-slate-600">{error ?? 'Round not found.'}</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </PageLayout>
    );
  }

  if (!myTeamId) {
    return (
      <PageLayout title={round.name} back="/">
        <div className="card p-5 text-center">
          <p className="text-slate-600 mb-4">You haven't joined this round as a scorer.</p>
          <Button onClick={() => navigate(`/join/${roundId}`)}>Join Round</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout noPadding title={round.name} subtitle={round.courseName || undefined}>
      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 flex">
        {(['score', 'leaderboard'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? 'text-fairway-700 border-b-2 border-fairway-600'
                : 'text-slate-500'
            }`}
          >
            {t === 'score' ? 'Score Entry' : 'Leaderboard'}
          </button>
        ))}
      </div>

      {tab === 'score' ? (
        <ScoreTab
          round={round}
          hole={hole!}
          currentHole={currentHole}
          myTeamId={myTeamId}
          saving={saving}
          completing={completing}
          onHoleChange={setCurrentHole}
          onScoreChange={handleScoreChange}
          onShotgunChange={handleShotgunChange}
          onComplete={handleComplete}
        />
      ) : (
        <LeaderboardTab round={round} />
      )}
    </PageLayout>
  );
}

// ── Score Entry Tab ───────────────────────────────────────────────────────────

interface ScoreTabProps {
  round: RoundType;
  hole: RoundType['holes'][number];
  currentHole: number;
  myTeamId: string;
  saving: boolean;
  completing: boolean;
  onHoleChange: (h: number) => void;
  onScoreChange: (teamId: string, value: string) => void;
  onShotgunChange: (teamId: string, value: 0 | 1 | 2) => void;
  onComplete: () => void;
}

function ScoreTab({
  round, hole, currentHole, myTeamId, saving, completing,
  onHoleChange, onScoreChange, onShotgunChange, onComplete,
}: ScoreTabProps) {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto pb-6">
      {/* Hole navigation */}
      <HoleNav
        currentHole={currentHole}
        holes={round.holes}
        myTeamId={myTeamId}
        onChange={onHoleChange}
      />

      {/* Current hole info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-2xl font-bold text-slate-900">Hole {currentHole}</span>
          <span className="ml-3 text-base text-slate-500">Par {hole.par}</span>
        </div>
        {saving && (
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-slate-300 border-t-fairway-500 rounded-full animate-spin" />
            Saving…
          </span>
        )}
      </div>

      {/* Score cards */}
      {round.teams.map((team) => {
        const color = getTeamColor(team.color);
        const isMyTeam = team.id === myTeamId;
        const ts = hole.scores[team.id];
        const score = ts?.score;
        const shotguns = ts?.shotguns ?? 0;
        const toPar = score != null ? score - hole.par : null;

        return (
          <div
            key={team.id}
            className={`card overflow-hidden ${isMyTeam ? `ring-2 ring-fairway-500` : ''}`}
          >
            {/* Team header */}
            <div className={`px-4 py-3 flex items-center gap-2 border-b border-slate-100 ${isMyTeam ? color.bg : ''}`}>
              <div className={`w-3 h-3 rounded-full ${color.dot}`} />
              <span className={`font-semibold text-sm flex-1 ${isMyTeam ? color.text : 'text-slate-700'}`}>
                {team.name}
              </span>
              {isMyTeam && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}>
                  Your Team
                </span>
              )}
              {!isMyTeam && score != null && (
                <span className={`text-sm font-semibold ${
                  toPar! < 0 ? 'text-fairway-600' : toPar! > 0 ? 'text-red-500' : 'text-slate-600'
                }`}>
                  {formatToPar(toPar!)}
                </span>
              )}
            </div>

            {/* Score inputs */}
            <div className="p-4">
              {isMyTeam ? (
                <div className="flex items-end gap-4">
                  {/* Score */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Score</label>
                    <ScoreInputWidget
                      value={score}
                      par={hole.par}
                      onChange={(v) => onScoreChange(team.id, v.toString())}
                    />
                  </div>

                  {/* To Par indicator */}
                  {toPar != null && (
                    <div className="pb-2">
                      <span className={`text-xl font-bold ${
                        toPar < 0 ? 'text-fairway-600' : toPar > 0 ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {formatToPar(toPar)}
                      </span>
                    </div>
                  )}

                  {/* Shotguns */}
                  <div className="flex flex-col gap-1.5 ml-auto">
                    <label className="text-xs font-medium text-slate-500">Shotguns</label>
                    <ShotgunPicker
                      value={shotguns}
                      onChange={(v) => onShotgunChange(team.id, v)}
                    />
                  </div>
                </div>
              ) : (
                // Read-only view for other teams
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 mb-0.5">Score</span>
                    <span className="text-2xl font-bold text-slate-700">
                      {score ?? '—'}
                    </span>
                  </div>
                  {toPar != null && (
                    <span className={`text-base font-semibold mt-auto mb-0.5 ${
                      toPar < 0 ? 'text-fairway-600' : toPar > 0 ? 'text-red-500' : 'text-slate-500'
                    }`}>
                      {formatToPar(toPar)}
                    </span>
                  )}
                  {shotguns > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-amber-600">
                      <span className="text-base">💥</span>
                      <span className="text-sm font-semibold">{shotguns}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Hole quick scroll */}
      <div className="card p-3">
        <p className="text-xs font-medium text-slate-400 mb-2.5">Jump to hole</p>
        <div className="grid grid-cols-9 gap-1.5">
          {round.holes.map((h, i) => {
            const myScore = h.scores[myTeamId];
            const done = myScore?.score != null;
            const isCurrent = i + 1 === currentHole;

            return (
              <button
                key={i}
                onClick={() => onHoleChange(i + 1)}
                className={`h-8 rounded-lg text-xs font-semibold transition-all active:scale-90 ${
                  isCurrent
                    ? 'bg-fairway-600 text-white'
                    : done
                    ? 'bg-fairway-100 text-fairway-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Complete round button */}
      {round.holes.every((h) => h.scores[myTeamId]?.score != null) && (
        <Button
          variant="secondary"
          size="lg"
          onClick={onComplete}
          loading={completing}
        >
          Complete Round
        </Button>
      )}
    </div>
  );
}

// ── Hole navigation component ─────────────────────────────────────────────────

function HoleNav({
  currentHole,
  holes,
  myTeamId,
  onChange,
}: {
  currentHole: number;
  holes: RoundType['holes'];
  myTeamId: string;
  onChange: (h: number) => void;
}) {
  const prev = () => onChange(Math.max(1, currentHole - 1));
  const next = () => onChange(Math.min(18, currentHole + 1));

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-slate-100">
      <button
        onClick={prev}
        disabled={currentHole === 1}
        className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center
                   active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 text-center">
        <p className="text-xs text-slate-400 mb-0.5">
          {currentHole <= 9 ? 'Front 9' : 'Back 9'}
        </p>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-0.5 flex-wrap max-w-[180px] mx-auto">
          {holes.map((h, i) => {
            const done = h.scores[myTeamId]?.score != null;
            const isCurrent = i + 1 === currentHole;
            return (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  isCurrent ? 'w-4 h-2.5 bg-fairway-600' : done ? 'w-2 h-2 bg-fairway-300' : 'w-2 h-2 bg-slate-200'
                }`}
              />
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {holes.filter((h) => h.scores[myTeamId]?.score != null).length}/18 scored
        </p>
      </div>

      <button
        onClick={next}
        disabled={currentHole === 18}
        className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center
                   active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ── Score input widget with +/- buttons ───────────────────────────────────────

function ScoreInputWidget({
  value,
  par,
  onChange,
}: {
  value: number | null;
  par: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(1, (value ?? par) - 1));
  const inc = () => onChange(Math.min(20, (value ?? par) + 1));

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={dec}
        className="w-10 h-14 rounded-lg bg-slate-100 active:bg-slate-200 active:scale-95 transition-all
                   flex items-center justify-center text-xl text-slate-600 font-light"
      >
        −
      </button>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(Math.max(1, Math.min(20, n)));
        }}
        placeholder={String(par)}
        min={1}
        max={20}
        className="w-14 h-14 rounded-xl border-2 border-slate-200 text-center text-2xl font-bold
                   text-slate-900 bg-white focus:outline-none focus:border-fairway-500
                   transition-colors"
      />
      <button
        onClick={inc}
        className="w-10 h-14 rounded-lg bg-slate-100 active:bg-slate-200 active:scale-95 transition-all
                   flex items-center justify-center text-xl text-slate-600"
      >
        +
      </button>
    </div>
  );
}

// ── Shotgun picker ────────────────────────────────────────────────────────────

function ShotgunPicker({
  value,
  onChange,
}: {
  value: 0 | 1 | 2;
  onChange: (v: 0 | 1 | 2) => void;
}) {
  return (
    <div className="flex gap-1">
      {([0, 1, 2] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`w-10 h-14 rounded-xl text-sm font-bold transition-all active:scale-95 border-2 ${
            value === v
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          {v === 0 ? '—' : `💥${v}`}
        </button>
      ))}
    </div>
  );
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────────

function LeaderboardTab({ round }: { round: RoundType }) {
  const rows = computeLeaderboard(round);
  const tp = totalPar(round.holes);

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto pb-6">
      {/* Live badge */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-fairway-500 rounded-full animate-pulse" />
        <span className="text-xs text-fairway-600 font-medium">Live</span>
        <span className="text-xs text-slate-400">· Updates automatically</span>
      </div>

      {/* Leaderboard table */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 w-5 text-center">#</span>
          <span className="text-xs font-semibold text-slate-400">Team</span>
          <span className="text-xs font-semibold text-slate-400 text-right">Score</span>
          <span className="text-xs font-semibold text-slate-400 text-right w-10">To Par</span>
          <span className="text-xs font-semibold text-slate-400 text-right w-8">💥</span>
        </div>

        {rows.map((row, i) => {
          const color = getTeamColor(row.team.color);
          const isLeader = i === 0 && row.holesPlayed > 0;

          return (
            <div
              key={row.team.id}
              className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 px-4 py-4 border-b border-slate-50 last:border-0 items-center ${
                isLeader ? 'bg-fairway-50' : ''
              }`}
            >
              <span className={`text-sm font-bold w-5 text-center ${isLeader ? 'text-fairway-700' : 'text-slate-400'}`}>
                {row.holesPlayed > 0 ? i + 1 : '—'}
              </span>
              <div className="min-w-0 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{row.team.name}</p>
                  <p className="text-xs text-slate-400">{row.holesPlayed}/18 holes</p>
                </div>
              </div>
              <span className="text-base font-bold text-slate-900 text-right">
                {row.holesPlayed > 0 ? row.totalScore : '—'}
              </span>
              <span className={`text-sm font-semibold text-right w-10 ${
                row.holesPlayed === 0 ? 'text-slate-300' :
                row.toPar < 0 ? 'text-fairway-600' :
                row.toPar > 0 ? 'text-red-500' :
                'text-slate-500'
              }`}>
                {row.holesPlayed > 0 ? formatToPar(row.toPar) : '—'}
              </span>
              <span className="text-sm text-slate-600 text-right w-8 font-medium">
                {row.totalShotguns > 0 ? row.totalShotguns : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Running totals by nine */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          9-Hole Splits
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Team</th>
                <th className="text-right pb-2 font-medium">Front 9</th>
                <th className="text-right pb-2 font-medium">Back 9</th>
                <th className="text-right pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={row.team.id}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${getTeamColor(row.team.color).dot}`} />
                      <span className="font-medium text-slate-800">{row.team.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-2.5 text-slate-700 font-medium">{row.front9 || '—'}</td>
                  <td className="text-right py-2.5 text-slate-700 font-medium">{row.back9 || '—'}</td>
                  <td className="text-right py-2.5 font-bold text-slate-900">{row.totalScore || '—'}</td>
                </tr>
              ))}
              <tr className="text-xs text-slate-400">
                <td className="pt-2">Par</td>
                <td className="text-right pt-2">{round.holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}</td>
                <td className="text-right pt-2">{round.holes.slice(9).reduce((s, h) => s + h.par, 0)}</td>
                <td className="text-right pt-2 font-medium">{tp}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
