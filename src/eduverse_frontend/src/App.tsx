import { Routes, Route, Navigate } from 'react-router-dom';

import Home from 'pages/home/Index';
import Dashboard from 'pages/dashboard';
import ProfileSetup from 'pages/profile/setup';
import Certificate from 'pages/certificate';
import CoursePage from 'pages/course';
import AllCoursesPage from 'pages/course/AllCoursePage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<AllCoursesPage />} />
        <Route path="/course/:courseId" element={<CoursePage />} />
        <Route path="/profile/setup" element={<ProfileSetup />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
