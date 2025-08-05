import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router } from 'react-router-dom';

import AuthProvider from '@/components/providers/auth-provider';
import LoadingProvider from '@/components/providers/loading-provider';

import App from './App';
import './index.css';
import { Toaster } from './components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <LoadingProvider>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </LoadingProvider>
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);
