import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useRound, useRoundActions, getLocalTeamId } from '../hooks/useRound';
import { getTeamColor } from '../lib/utils';

export function JoinRound() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { round, loading, error } = useRound(roundId);
  const { joinRound, deviceId } = useRoundActions();

  const [joining, setJoining] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // If already joined this round, skip to it
  useEffect(() => {
    if (!round || !roundId) return;
    const existingTeam = getLocalTeamId(roundId);
    if (existingTeam) {
      if (round.status === 'completed') navigate(`/round/${roundId}/summary`);
      else if (round.status === 'active') navigate(`/round/${roundId}`);
      else navigate(`/lobby/${roundId}`);
    }
  }, [round, roundId, navigate]);

  const handleJoin = async () => {
    if (!selectedTeam || !roundId) return;
    setJoining(true);
    try {
      await joinRound(roundId, selectedTeam);
      if (round?.status === 'active') navigate(`/round/${roundId}`);
      else navigate(`/lobby/${roundId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to join. Check your connection.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <PageLayout back="/">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-[3px] border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-cream/40 text-sm">Loading round…</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !round) {
    return (
      <PageLayout back="/" title="Round Not Found">
        <div className="card p-6 text-center">
          <p className="text-cream/60 mb-4">
            {error ?? 'This round does not exist or may have been deleted.'}
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      back="/"
      title={round.name}
      subtitle={round.courseName || 'Golf Scramble'}
    >
      <div className="flex flex-col gap-4">
        <div className="card p-4">
          <p className="text-sm text-cream/50 mb-1">Join Code</p>
          <p className="font-display text-3xl tracking-[0.3em] text-gold-400">{round.joinCode}</p>
        </div>

        <p className="text-sm font-medium text-cream/50 px-1">
          Which team are you scoring for?
        </p>

        <div className="flex flex-col gap-3">
          {round.teams.map((team) => {
            const color = getTeamColor(team.color);
            const alreadyClaimed = round.scorers[team.id] && round.scorers[team.id] !== deviceId;
            const isSelected = selectedTeam === team.id;

            return (
              <button
                key={team.id}
                onClick={() => !alreadyClaimed && setSelectedTeam(team.id)}
                disabled={alreadyClaimed || undefined}
                className={`card p-4 text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'ring-2 ring-gold-500 border-gold-500/40'
                    : alreadyClaimed
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-gold-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${color.dot} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="font-semibold text-cream">{team.name}</p>
                    <p className="text-xs text-cream/40 mt-0.5">
                      {team.players.filter((p) => p.trim()).join(', ') || 'No players listed'}
                    </p>
                  </div>
                  {alreadyClaimed && (
                    <span className="text-xs text-cream/30 bg-white/10 px-2 py-1 rounded-full">
                      Taken
                    </span>
                  )}
                  {isSelected && (
                    <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          onClick={handleJoin}
          disabled={!selectedTeam}
          loading={joining}
          className="mt-2"
        >
          Join as Scorer
        </Button>
      </div>
    </PageLayout>
  );
}
