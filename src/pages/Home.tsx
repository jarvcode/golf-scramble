import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeCode } from '../lib/utils';
import type { Round } from '../types';

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
    <div className="min-h-screen bg-fairway-700 flex flex-col max-w-lg mx-auto">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-sm">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path strokeLinecap="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.5C9.5 4 11 3 12 3s2.5 1 4 2.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Scramble</h1>
        <p className="text-fairway-200 text-base mb-10 max-w-xs">
          Track scores for your golf scramble in real time across all devices.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate('/create')}
            className="w-full bg-white text-fairway-700 font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all duration-150 shadow-lg shadow-fairway-900/20"
          >
            Create New Round
          </button>

          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full bg-fairway-600/60 text-white font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all duration-150 border border-white/20"
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
                  placeholder="Enter join code"
                  maxLength={8}
                  autoFocus
                  autoCapitalize="characters"
                  className="w-full bg-white/10 border-2 border-white/30 text-white placeholder-white/50
                             rounded-2xl px-4 py-4 text-center text-xl font-bold tracking-[0.3em]
                             focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                />
                {joinError && (
                  <p className="text-red-300 text-sm text-center">{joinError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={joining || joinCode.length < 4}
                className="w-full bg-white text-fairway-700 font-semibold py-4 rounded-2xl text-base
                           active:scale-95 transition-all duration-150 disabled:opacity-50
                           disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {joining ? 'Finding round…' : 'Join Round'}
              </button>
              <button
                type="button"
                onClick={() => { setShowJoin(false); setJoinError(''); setJoinCode(''); }}
                className="text-fairway-200 text-sm py-2 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* History link */}
      <div className="px-6 pb-8 text-center">
        <button
          onClick={() => navigate('/history')}
          className="text-fairway-200 text-sm active:scale-95 transition-all py-2"
        >
          View past rounds
        </button>
      </div>
    </div>
  );
}
