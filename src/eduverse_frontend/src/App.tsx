import { Routes, Route, Navigate } from 'react-router-dom';

import Home from 'pages/home/Index';
import Dashboard from 'pages/dashboard';
import ProfileSetup from 'pages/profile/setup';
import Certificate from 'pages/certificate';
import { AllCoursesPage, LearningRoute } from 'pages/course';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<AllCoursesPage />} />
        <Route path="/learn/:courseId" element={<LearningRoute />} />
        <Route path="/profile/setup" element={<ProfileSetup />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
