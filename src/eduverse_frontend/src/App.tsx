import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/components/pages/home';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Root Routes */}
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
