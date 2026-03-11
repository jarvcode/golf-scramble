import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useRound } from '../hooks/useRound';
import { computeLeaderboard, formatToPar, getTeamColor, totalPar } from '../lib/utils';

export function Summary() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { round, loading, error } = useRound(roundId);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error || !round) {
    return (
      <PageLayout back="/" title="Error">
        <p className="text-cream/60">{error ?? 'Round not found.'}</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </PageLayout>
    );
  }

  const rows = computeLeaderboard(round);
  const winner = rows[0];
  const winnerColor = getTeamColor(winner.team.color);
  const tp = totalPar(round.holes);

  return (
    <PageLayout
      title="Round Summary"
      subtitle={round.name}
      back="/"
    >
      {/* Winner card — gold trophy style */}
      <div className="rounded-2xl p-5 text-center border border-gold-500/50"
        style={{ background: 'linear-gradient(135deg, #2A4A1E 0%, #1A3828 50%, #122B1E 100%)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400/70 mb-3">
          Winner
        </p>
        <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-500/50 flex items-center justify-center mx-auto mb-3">
          <span className="font-display text-2xl text-gold-400">
            {winner.team.name.charAt(0)}
          </span>
        </div>
        <div className={`w-4 h-4 rounded-full ${winnerColor.dot} mx-auto mb-2`} />
        <h2 className="text-2xl font-bold text-cream mb-1">{winner.team.name}</h2>
        <p className="text-base text-cream/60">
          {winner.totalScore} strokes &bull; {formatToPar(winner.toPar)} par
        </p>
        <p className="text-sm text-gold-400/60 mt-1">
          {winner.totalShotguns} shotgun{winner.totalShotguns !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Final standings */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gold-500/15">
          <p className="text-sm font-semibold text-cream/70">Final Standings</p>
        </div>
        {rows.map((row, i) => {
          const color = getTeamColor(row.team.color);
          return (
            <div
              key={row.team.id}
              className={`flex items-center gap-4 px-4 py-4 border-b border-gold-500/10 last:border-0 ${
                i === 0 ? 'bg-gold-500/5' : ''
              }`}
            >
              <span className={`text-lg font-bold w-6 ${i === 0 ? 'text-gold-400' : 'text-cream/30'}`}>
                {i + 1}
              </span>
              <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0`} />
              <div className="flex-1">
                <p className="font-semibold text-cream">{row.team.name}</p>
                <p className="text-xs text-cream/40">
                  Front: {row.front9} &bull; Back: {row.back9} &bull; {row.totalShotguns} shotguns
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-cream">{row.totalScore}</p>
                <p className={`text-xs font-semibold ${
                  row.toPar < 0 ? 'text-fairway-400' : row.toPar > 0 ? 'text-red-400' : 'text-cream/40'
                }`}>
                  {formatToPar(row.toPar)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hole-by-hole breakdown */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gold-500/15">
          <p className="text-sm font-semibold text-cream/70">Hole by Hole</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="text-xs text-cream/40 bg-forest-950/50 border-b border-gold-500/10">
                <th className="text-left px-4 py-2.5 font-medium">Hole</th>
                <th className="text-center px-2 py-2.5 font-medium">Par</th>
                {round.teams.map((t) => (
                  <th key={t.id} className="text-center px-2 py-2.5 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getTeamColor(t.color).dot}`} />
                      <span className="truncate max-w-[60px]">{t.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/8">
              {round.holes.map((hole, i) => {
                const isNineDivider = i === 8;
                return (
                  <>
                    {isNineDivider && (
                      <tr key="front9-total" className="bg-forest-950/50">
                        <td className="px-4 py-2 text-xs font-semibold text-cream/40" colSpan={2}>
                          Front 9
                        </td>
                        {round.teams.map((t) => {
                          const front9 = round.holes.slice(0, 9).reduce((s, h) => s + (h.scores[t.id]?.score ?? 0), 0);
                          return (
                            <td key={t.id} className="text-center px-2 py-2 text-xs font-bold text-cream/70">
                              {front9}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                    <tr key={hole.number}>
                      <td className="px-4 py-2.5 font-medium text-cream/70">{hole.number}</td>
                      <td className="text-center px-2 py-2.5 text-cream/40">{hole.par}</td>
                      {round.teams.map((t) => {
                        const ts = hole.scores[t.id];
                        const toPar = ts?.score != null ? ts.score - hole.par : null;
                        return (
                          <td key={t.id} className="text-center px-2 py-2.5">
                            <span className={`font-semibold ${
                              toPar == null ? 'text-cream/20' :
                              toPar < 0 ? 'text-fairway-400' :
                              toPar > 0 ? 'text-red-400' :
                              'text-cream/70'
                            }`}>
                              {ts?.score ?? '—'}
                            </span>
                            {ts?.shotguns ? (
                              <span className="text-xs text-gold-400 ml-0.5">💥</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })}
              {/* Back 9 total */}
              <tr className="bg-forest-950/50">
                <td className="px-4 py-2 text-xs font-semibold text-cream/40" colSpan={2}>Back 9</td>
                {round.teams.map((t) => {
                  const back9 = round.holes.slice(9).reduce((s, h) => s + (h.scores[t.id]?.score ?? 0), 0);
                  return (
                    <td key={t.id} className="text-center px-2 py-2 text-xs font-bold text-cream/70">{back9}</td>
                  );
                })}
              </tr>
              {/* Final total */}
              <tr className="bg-gold-500/10 border-t border-gold-500/20">
                <td className="px-4 py-3 text-sm font-bold text-gold-400" colSpan={2}>Total</td>
                {rows.map((row) => (
                  <td key={row.team.id} className="text-center px-2 py-3 font-bold text-gold-400">
                    {row.totalScore}
                  </td>
                ))}
              </tr>
              {/* Par row */}
              <tr className="border-t border-gold-500/10">
                <td className="px-4 py-2 text-xs text-cream/30" colSpan={2}>Par: {tp}</td>
                {rows.map((row) => (
                  <td key={row.team.id} className={`text-center px-2 py-2 text-xs font-semibold ${
                    row.toPar < 0 ? 'text-fairway-400' : row.toPar > 0 ? 'text-red-400' : 'text-cream/40'
                  }`}>
                    {formatToPar(row.toPar)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Shotgun totals */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-cream/40 uppercase tracking-wide mb-3">
          Shotgun Totals 💥
        </p>
        <div className="flex gap-3">
          {rows.map((row) => {
            const color = getTeamColor(row.team.color);
            return (
              <div key={row.team.id} className={`flex-1 ${color.bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-bold ${color.text}`}>{row.totalShotguns}</p>
                <p className={`text-xs ${color.text} opacity-70 mt-0.5`}>{row.team.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pb-4">
        <Button size="lg" onClick={() => navigate('/')}>
          New Round
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/history')}>
          View History
        </Button>
      </div>
    </PageLayout>
  );
}
