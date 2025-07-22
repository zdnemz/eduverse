import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import Loading from '@/components/Loading';

interface ProtectedLayoutProps {
  children: JSX.Element;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;

  return isAuthenticated ? children : <Navigate to="/" replace />;
}
