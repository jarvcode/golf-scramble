import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseSetupBanner } from './components/FirebaseSetupBanner';
import { Home } from './pages/Home';
import { CreateRound } from './pages/CreateRound';
import { JoinRound } from './pages/JoinRound';
import { Lobby } from './pages/Lobby';
import { Round } from './pages/Round';
import { Summary } from './pages/Summary';
import { History } from './pages/History';

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseSetupBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateRound />} />
          <Route path="/join/:roundId" element={<JoinRound />} />
          <Route path="/lobby/:roundId" element={<Lobby />} />
          <Route path="/round/:roundId" element={<Round />} />
          <Route path="/round/:roundId/summary" element={<Summary />} />
          <Route path="/history" element={<History />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
