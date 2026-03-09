import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { TEAM_COLORS, DEFAULT_PARS, generateId, generateJoinCode, buildInitialHoles, defaultTeams } from '../lib/utils';
import { useRoundActions } from '../hooks/useRound';
import type { Round, Team, TeamColor } from '../types';

type Step = 'info' | 'teams' | 'course';

export function CreateRound() {
  const navigate = useNavigate();
  const { createRound, deviceId } = useRoundActions();

  const [step, setStep] = useState<Step>('info');
  const [saving, setSaving] = useState(false);

  // Step 1: Round info
  const [roundName, setRoundName] = useState('');
  const [courseName, setCourseName] = useState('');

  // Step 2: Teams
  const [teams, setTeams] = useState<Team[]>(defaultTeams);

  // Step 3: Course pars
  const [pars, setPars] = useState<number[]>([...DEFAULT_PARS]);

  const updateTeam = (i: number, field: keyof Team, value: unknown) => {
    setTeams((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const updatePlayer = (teamIdx: number, playerIdx: number, name: string) => {
    setTeams((prev) =>
      prev.map((t, i) =>
        i === teamIdx
          ? { ...t, players: t.players.map((p, j) => (j === playerIdx ? name : p)) }
          : t,
      ),
    );
  };

  const handleNext = () => {
    if (step === 'info') setStep('teams');
    else if (step === 'teams') setStep('course');
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const roundId = generateId();
      const joinCode = generateJoinCode();
      const teamId = 'team0'; // creator is scorer for team 0

      const round: Round = {
        id: roundId,
        name: roundName.trim() || 'Golf Scramble',
        courseName: courseName.trim(),
        joinCode,
        status: 'lobby',
        createdAt: Date.now(),
        teams,
        holes: buildInitialHoles(pars),
        scorers: { [teamId]: deviceId },
      };

      await createRound(round);

      // Store team assignment
      const key = 'golf_team_assignments';
      const assignments = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>;
      assignments[roundId] = teamId;
      localStorage.setItem(key, JSON.stringify(assignments));

      navigate(`/lobby/${roundId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create round. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const canNextInfo = roundName.trim().length > 0;
  const canNextTeams = teams.every((t) => t.name.trim().length > 0);
  const front9Par = pars.slice(0, 9).reduce((a, b) => a + b, 0);
  const back9Par = pars.slice(9).reduce((a, b) => a + b, 0);

  return (
    <PageLayout
      title={step === 'info' ? 'New Round' : step === 'teams' ? 'Set Up Teams' : 'Course Setup'}
      subtitle={`Step ${step === 'info' ? 1 : step === 'teams' ? 2 : 3} of 3`}
      back={step === 'info' ? '/' : () => setStep(step === 'course' ? 'teams' : 'info')}
    >
      {/* ── Step 1: Round Info ──────────────────────────────── */}
      {step === 'info' && (
        <div className="flex flex-col gap-4">
          <div className="card p-4 flex flex-col gap-4">
            <Input
              label="Round Name"
              placeholder="e.g. Memorial Day Scramble"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              autoFocus
            />
            <Input
              label="Course Name (optional)"
              placeholder="e.g. Pebble Beach"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          </div>

          <div className="bg-fairway-50 border border-fairway-200 rounded-xl p-4 text-sm text-fairway-700">
            <p className="font-medium mb-1">About this app</p>
            <p className="text-fairway-600">
              3 teams &bull; 4 players each &bull; scramble format &bull; real-time scoring
            </p>
          </div>

          <Button size="lg" onClick={handleNext} disabled={!canNextInfo}>
            Next: Set Up Teams
          </Button>
        </div>
      )}

      {/* ── Step 2: Teams ──────────────────────────────────── */}
      {step === 'teams' && (
        <div className="flex flex-col gap-4">
          {teams.map((team, ti) => {
            const colorInfo = TEAM_COLORS.find((c) => c.value === team.color) ?? TEAM_COLORS[0];
            return (
              <div key={team.id} className="card overflow-visible">
                {/* Team header */}
                <div className={`px-4 py-3 flex items-center gap-3 border-b border-slate-100`}>
                  <div className={`w-3 h-3 rounded-full ${colorInfo.dot}`} />
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => updateTeam(ti, 'name', e.target.value)}
                    placeholder={`Team ${ti + 1} name`}
                    className="flex-1 text-base font-semibold text-slate-900 bg-transparent
                               focus:outline-none placeholder-slate-400"
                  />
                  {/* Color picker */}
                  <div className="flex gap-1.5">
                    {TEAM_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateTeam(ti, 'color', c.value as TeamColor)}
                        className={`w-6 h-6 rounded-full ${c.dot} transition-transform active:scale-90 ${
                          team.color === c.value ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                        }`}
                        aria-label={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Players */}
                <div className="p-4 flex flex-col gap-2.5">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Players
                  </p>
                  {team.players.map((player, pi) => (
                    <input
                      key={pi}
                      type="text"
                      value={player}
                      onChange={(e) => updatePlayer(ti, pi, e.target.value)}
                      placeholder={`Player ${pi + 1}`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5
                                 text-sm text-slate-900 placeholder-slate-400 focus:outline-none
                                 focus:border-fairway-400 focus:bg-white transition-colors"
                    />
                  ))}
                </div>

                {ti === 0 && (
                  <div className="px-4 pb-3 -mt-1">
                    <p className="text-xs text-fairway-600 bg-fairway-50 rounded-lg px-3 py-2">
                      You are the scorer for this team
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <Button size="lg" onClick={handleNext} disabled={!canNextTeams}>
            Next: Course Setup
          </Button>
        </div>
      )}

      {/* ── Step 3: Course / Pars ──────────────────────────── */}
      {step === 'course' && (
        <div className="flex flex-col gap-4">
          {/* Par summary */}
          <div className="card p-4">
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Front 9</div>
                <div className="text-lg font-bold text-slate-900">{front9Par}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Back 9</div>
                <div className="text-lg font-bold text-slate-900">{back9Par}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Total Par</div>
                <div className="text-xl font-bold text-fairway-700">{front9Par + back9Par}</div>
              </div>
            </div>
          </div>

          {/* Hole grid */}
          {['Front 9', 'Back 9'].map((nine, nineIdx) => (
            <div key={nine} className="card">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">{nine}</p>
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {pars.slice(nineIdx * 9, nineIdx * 9 + 9).map((par, j) => {
                  const holeIdx = nineIdx * 9 + j;
                  return (
                    <div key={holeIdx} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-slate-400">Hole {holeIdx + 1}</span>
                      <div className="flex gap-1">
                        {[3, 4, 5].map((p) => (
                          <button
                            key={p}
                            onClick={() => setPars((prev) => prev.map((v, i) => (i === holeIdx ? p : v)))}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                              par === p
                                ? 'bg-fairway-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <Button size="lg" onClick={handleCreate} loading={saving}>
            Create Round
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
