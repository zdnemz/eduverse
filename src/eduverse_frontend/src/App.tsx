import { Routes, Route, Navigate } from 'react-router-dom';
import Home from 'pages/home/Index';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from 'pages/dashboard';
import PrivateRoute from './routes/PrivateRoute';
import LoadingScreen from '@/components/Loading';
import CertificatePage from 'pages/certificate';

export default function App() {
  const { loading, principal } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={principal ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/certificate"
          element={
            <PrivateRoute>
              <CertificatePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}
