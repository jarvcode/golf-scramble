import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeCode } from '../lib/utils';
import type { Round } from '../types';

// Topography SVG pattern (heropatterns.com) encoded for inline use
const topoPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cpath d='M300 0C134.3 0 0 134.3 0 300s134.3 300 300 300 300-134.3 300-300S465.7 0 300 0zm0 580C145.4 580 20 454.6 20 300S145.4 20 300 20s280 125.4 280 280-125.4 280-280 280zm0-520C156.5 60 60 156.5 60 300s96.5 240 240 240 240-96.5 240-240S443.5 60 300 60zm0 460c-121.3 0-220-98.7-220-220S178.7 80 300 80s220 98.7 220 220-98.7 220-220 220zm0-400c-99.4 0-180 80.6-180 180s80.6 180 180 180 180-80.6 180-180S399.4 120 300 120zm0 340c-88.4 0-160-71.6-160-160s71.6-160 160-160 160 71.6 160 160-71.6 160-160 160zm0-280c-66.3 0-120 53.7-120 120s53.7 120 120 120 120-53.7 120-120S366.3 180 300 180zm0 220c-55.2 0-100-44.8-100-100s44.8-100 100-100 100 44.8 100 100-44.8 100-100 100zm0-160c-33.1 0-60 26.9-60 60s26.9 60 60 60 60-26.9 60-60-26.9-60-60-60z' fill='%23D4AF37' fill-opacity='0.06'/%3E%3C/svg%3E")`;

export function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeCode(joinCode);
    if (code.length < 4) {
      setJoinError('Enter a valid join code.');
      return;
    }

    setJoining(true);
    setJoinError('');

    try {
      const q = query(collection(db, 'rounds'), where('joinCode', '==', code));
      const snap = await getDocs(q);

      if (snap.empty) {
        setJoinError('No round found with that code. Check and try again.');
        setJoining(false);
        return;
      }

      const round = snap.docs[0].data() as Round;
      if (round.status === 'completed') {
        navigate(`/round/${round.id}/summary`);
      } else {
        navigate(`/join/${round.id}`);
      }
    } catch (err) {
      console.error(err);
      setJoinError('Something went wrong. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden"
      style={{ backgroundColor: '#0F2419', backgroundImage: topoPattern }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest-950/80 pointer-events-none" />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

        {/* Golf ball icon */}
        <div className="mb-4">
          <div className="w-16 h-16 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="#D4AF37" opacity="0.9"/>
              <circle cx="9.5" cy="9.5" r="1" fill="#0F2419" opacity="0.5"/>
              <circle cx="12.5" cy="8" r="0.8" fill="#0F2419" opacity="0.5"/>
              <circle cx="14.5" cy="10.5" r="0.8" fill="#0F2419" opacity="0.5"/>
              <circle cx="10" cy="12.5" r="0.8" fill="#0F2419" opacity="0.5"/>
              <circle cx="13" cy="13.5" r="1" fill="#0F2419" opacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-display text-[4.5rem] leading-none tracking-wider mb-1"
          style={{ color: '#D4AF37', textShadow: '0 2px 20px rgba(212,175,55,0.4)' }}
        >
          JARVS BACH
        </h1>

        {/* Decorative line */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-16 bg-gold-500/50" />
          <span className="text-gold-500/80 text-xs tracking-[0.3em] font-sans uppercase">Golf Scramble</span>
          <div className="h-px w-16 bg-gold-500/50" />
        </div>

        <p className="text-cream/60 text-sm font-sans mb-10 max-w-xs leading-relaxed">
          Live scoring for the boys. Real-time sync across all devices.
        </p>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate('/create')}
            className="w-full font-sans font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all duration-150 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8961E 100%)',
              color: '#0F2419',
              boxShadow: '0 4px 24px rgba(212,175,55,0.35)',
            }}
          >
            Create New Round
          </button>

          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full font-sans font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all duration-150 border"
              style={{
                backgroundColor: 'rgba(212,175,55,0.08)',
                color: '#D4AF37',
                borderColor: 'rgba(212,175,55,0.35)',
              }}
            >
              Join a Round
            </button>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(normalizeCode(e.target.value));
                    setJoinError('');
                  }}
                  placeholder="ENTER CODE"
                  maxLength={8}
                  autoFocus
                  autoCapitalize="characters"
                  className="w-full rounded-2xl px-4 py-4 text-center text-xl font-display tracking-[0.4em] focus:outline-none transition-all"
                  style={{
                    backgroundColor: 'rgba(212,175,55,0.08)',
                    border: '2px solid rgba(212,175,55,0.4)',
                    color: '#D4AF37',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D4AF37';
                    e.target.style.backgroundColor = 'rgba(212,175,55,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.4)';
                    e.target.style.backgroundColor = 'rgba(212,175,55,0.08)';
                  }}
                />
                {joinError && (
                  <p className="text-red-400 text-sm text-center font-sans">{joinError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={joining || joinCode.length < 4}
                className="w-full font-sans font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8961E 100%)',
                  color: '#0F2419',
                }}
              >
                {joining ? 'Finding round…' : 'Join Round'}
              </button>
              <button
                type="button"
                onClick={() => { setShowJoin(false); setJoinError(''); setJoinCode(''); }}
                className="font-sans text-cream/40 text-sm py-2 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative px-6 pb-8 text-center">
        <button
          onClick={() => navigate('/history')}
          className="font-sans text-cream/40 text-sm active:scale-95 transition-all py-2 hover:text-cream/60"
        >
          View past rounds
        </button>
      </div>
    </div>
  );
}
