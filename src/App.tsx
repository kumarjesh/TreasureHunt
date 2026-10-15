import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './pages/LoginPage';
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { OrganizerDashboard } from './pages/OrganizerDashboard';

const RootRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'organizer') {
    return <Navigate to="/organizer" replace />;
  }

  return <Navigate to="/participant" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/participant" element={<ParticipantDashboard />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
