import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useRound, useRoundActions, getLocalTeamId } from '../hooks/useRound';
import { getTeamColor } from '../lib/utils';

export function Lobby() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { round, loading, error } = useRound(roundId);
  const { startRound } = useRoundActions();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const myTeamId = roundId ? getLocalTeamId(roundId) : null;

  // Redirect once round starts
  useEffect(() => {
    if (round?.status === 'active') navigate(`/round/${roundId}`);
    if (round?.status === 'completed') navigate(`/round/${roundId}/summary`);
  }, [round?.status, roundId, navigate]);

  const copyCode = async () => {
    if (!round) return;
    try {
      await navigator.clipboard.writeText(round.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing silently
    }
  };

  const copyLink = async () => {
    if (!round) return;
    const url = `${window.location.origin}/join/${roundId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleStart = async () => {
    if (!roundId) return;
    setStarting(true);
    try {
      await startRound(roundId);
    } catch (err) {
      console.error(err);
      alert('Failed to start round.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!round || error) {
    return (
      <PageLayout back="/" title="Error">
        <p className="text-cream/60">{error ?? 'Round not found.'}</p>
      </PageLayout>
    );
  }

  const scorerCount = Object.keys(round.scorers).length;
  const allJoined = scorerCount >= 3;
  const isCreator = myTeamId === 'team0';

  return (
    <PageLayout
      title={round.name}
      subtitle={round.courseName || 'Golf Scramble'}
    >
      {/* Join code card */}
      <div className="rounded-2xl p-5 text-center border border-gold-500/40"
        style={{ background: 'linear-gradient(135deg, #1A3828 0%, #122B1E 100%)' }}
      >
        <p className="text-cream/50 text-sm mb-2">Share this code to join</p>
        <p className="font-display text-5xl tracking-[0.4em] text-gold-400 mb-4">
          {round.joinCode}
        </p>
        <div className="flex gap-2">
          <button
            onClick={copyCode}
            className="flex-1 bg-gold-500/15 text-gold-400 text-sm font-medium py-2.5 rounded-xl
                       active:scale-95 transition-all border border-gold-500/30"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={copyLink}
            className="flex-1 bg-gold-500/15 text-gold-400 text-sm font-medium py-2.5 rounded-xl
                       active:scale-95 transition-all border border-gold-500/30"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Team status */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gold-500/15 flex items-center justify-between">
          <p className="text-sm font-semibold text-cream/70">Teams</p>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            allJoined
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gold-500/20 text-gold-400'
          }`}>
            {scorerCount}/3 joined
          </span>
        </div>
        <div className="divide-y divide-gold-500/10">
          {round.teams.map((team) => {
            const color = getTeamColor(team.color);
            const hasScorer = !!round.scorers[team.id];
            const isMyTeam = myTeamId === team.id;

            return (
              <div key={team.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`w-3.5 h-3.5 rounded-full ${color.dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cream text-sm">
                    {team.name}
                    {isMyTeam && (
                      <span className="ml-2 text-xs font-medium text-gold-400 bg-gold-500/15 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-cream/40 truncate">
                    {team.players.filter((p) => p.trim()).join(' · ') || 'No players'}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  hasScorer ? 'text-green-400' : 'text-cream/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${hasScorer ? 'bg-green-400' : 'bg-cream/20'}`} />
                  {hasScorer ? 'Ready' : 'Waiting…'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      {!isCreator && (
        <div className="bg-gold-500/10 border border-gold-500/25 rounded-xl px-4 py-3">
          <p className="text-sm text-gold-400/80">
            Waiting for the round organizer to start play.
          </p>
        </div>
      )}

      {/* Start button (creator only) */}
      {isCreator && (
        <div className="flex flex-col gap-3">
          {!allJoined && (
            <p className="text-sm text-center text-cream/40">
              All 3 teams can join before starting, or start now.
            </p>
          )}
          <Button size="lg" onClick={handleStart} loading={starting}>
            {allJoined ? 'Start Round' : 'Start Without All Teams'}
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
