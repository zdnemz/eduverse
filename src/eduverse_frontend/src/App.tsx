import { Routes, Route } from 'react-router-dom';

import Home from 'pages/home/Index';
import Dashboard from 'pages/dashboard';
import ProfileSetup from 'pages/profile/setup';
import Certificate from 'pages/certificate';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/profile/setup" element={<ProfileSetup />} />
      </Routes>
    </>
  );
}
