import { Routes, Route, Navigate } from 'react-router-dom';
import Home from 'pages/home/Index';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from 'pages/dashboard';
import ProfileSetup from 'pages/profile/setup';
import Certificate from 'pages/certificate';
import LoadingScreen from '@/components/Loading';

export default function App() {
  const { loading, principal } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={principal ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/profile/setup" element={<ProfileSetup />} />
      </Routes>
    </>
  );
}
