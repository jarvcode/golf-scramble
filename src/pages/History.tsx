import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useRoundHistory, useRoundActions } from '../hooks/useRound';
import { computeLeaderboard, formatToPar, getTeamColor } from '../lib/utils';
import type { Round } from '../types';

export function History() {
  const navigate = useNavigate();
  const { rounds, loading } = useRoundHistory();
  const { deleteRound } = useRoundActions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (round: Round) => {
    if (!window.confirm(`Delete "${round.name}"? This cannot be undone.`)) return;
    setDeletingId(round.id);
    try {
      await deleteRound(round.id);
    } catch {
      alert('Failed to delete round.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <PageLayout back="/" title="Round History">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (rounds.length === 0) {
    return (
      <PageLayout back="/" title="Round History">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-forest-800 border border-gold-500/20 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-cream/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-cream font-medium mb-1">No rounds yet</p>
          <p className="text-cream/40 text-sm mb-6">Completed rounds will appear here.</p>
          <Button onClick={() => navigate('/')}>Create a Round</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout back="/" title="Round History">
      <div className="flex flex-col gap-3">
        {rounds.map((round) => {
          const rows = computeLeaderboard(round);
          const isActive = round.status === 'active' || round.status === 'lobby';
          const isDeleting = deletingId === round.id;

          return (
            <div key={round.id} className="card overflow-hidden">
              <button
                onClick={() => {
                  if (round.status === 'completed') navigate(`/round/${round.id}/summary`);
                  else navigate(`/round/${round.id}`);
                }}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-cream truncate">{round.name}</p>
                    {round.courseName && (
                      <p className="text-sm text-cream/40 truncate">{round.courseName}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-gold-500/20 text-gold-400'
                        : round.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-cream/50'
                    }`}>
                      {isActive ? 'In Progress' : round.status === 'completed' ? 'Completed' : 'Setup'}
                    </span>
                    <span className="text-xs text-cream/30">{formatDate(round.createdAt)}</span>
                  </div>
                </div>

                {/* Teams */}
                {rows.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {rows.map((row, i) => {
                      const color = getTeamColor(row.team.color);
                      return (
                        <div key={row.team.id} className="flex items-center gap-2">
                          <span className="text-xs text-cream/30 w-4 text-center">{i + 1}</span>
                          <div className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                          <span className="text-sm text-cream/70 flex-1">{row.team.name}</span>
                          {row.holesPlayed > 0 && (
                            <>
                              <span className="text-sm font-semibold text-cream">{row.totalScore}</span>
                              <span className={`text-xs font-medium w-8 text-right ${
                                row.toPar < 0 ? 'text-fairway-400' : row.toPar > 0 ? 'text-red-400' : 'text-cream/40'
                              }`}>
                                {formatToPar(row.toPar)}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>

              {/* Actions */}
              <div className="px-4 pb-3 flex gap-2 border-t border-gold-500/10 pt-3">
                <button
                  onClick={() => {
                    if (round.status === 'completed') navigate(`/round/${round.id}/summary`);
                    else navigate(`/round/${round.id}`);
                  }}
                  className="flex-1 text-sm text-gold-400 font-medium py-2 rounded-lg bg-gold-500/10
                             active:scale-95 transition-all border border-gold-500/20"
                >
                  {round.status === 'completed' ? 'View Summary' : 'Continue Round'}
                </button>
                <button
                  onClick={() => handleDelete(round)}
                  disabled={isDeleting}
                  className="px-3 py-2 text-sm text-red-400 rounded-lg bg-red-500/10 border border-red-500/20
                             active:scale-95 transition-all disabled:opacity-50"
                >
                  {isDeleting ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
